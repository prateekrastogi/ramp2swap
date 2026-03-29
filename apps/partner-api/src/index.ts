import { Hono } from 'hono';
import type { HonoRequest } from 'hono';
import { createOtp, createRandomToken, createSessionToken, getSessionExpiry, hashOtp, isValidEmail, normalizeEmail, verifySessionToken } from './lib/auth';
import {
  consumeOtpAndCreateSession,
  decrementOtpAttempts,
  getActiveOtpCooldown,
  getActiveSessionById,
  getPendingOtp,
  revokeSession,
  touchSessionVerification,
  upsertOtp,
} from './lib/auth-db';
import { sendOtpEmail } from './lib/email';
import {
  ensurePartnerSettings,
  normalizeWithdrawalAddress,
  updateWithdrawalAddress,
  WalletAddressCooldownError,
} from './lib/partner-settings';
import { deletePartnerLink, generatePartnerLink, listPartnerLinks } from './lib/partner-links';
import { listPartnerTransactionFeed } from './lib/transaction-feed';
import { saveClick, saveConversion, saveTransaction } from './lib/ingest';
import { getPartnerAnalytics } from './lib/analytics';
import { getPartnerEarningsSummary } from './lib/earnings';
import { backfillMissingConversionPayouts } from './lib/payouts';
import { getPartnerOverviewSummary } from './lib/overview';
import { listPartnerSettlements } from './lib/settlements';

type Bindings = CloudflareBindings & {
  ASSETS: Fetcher;
  AUTH_DB: D1Database;
  SESSION_SECRET: string;
  RESEND_KEY?: string;
  LOGIN_EMAIL_FROM?: string;
  PARTNER_API_PUBLIC_BASE_URL?: string;
  AUTH_EMAIL_MODE?: string;
  PARTNER_LINK_BASE_URL?: string;
};

const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_RESEND_COOLDOWN_MS = 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;

const app = new Hono<{ Bindings: Bindings }>();

const parseRequestBody = async (request: HonoRequest) => {
  const contentType = request.header('content-type') ?? '';
  const rawBody = await request.text();

  if (!rawBody.trim()) {
    return {};
  }

  if (contentType.includes('application/json')) {
    try {
      return JSON.parse(rawBody) as Record<string, unknown>;
    } catch {
      return {};
    }
  }

  if (
    contentType.includes('application/x-www-form-urlencoded') ||
    contentType.includes('multipart/form-data')
  ) {
    const params = new URLSearchParams(rawBody);
    return Object.fromEntries(params.entries());
  }

  try {
    return JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return {};
  }
};

const jsonError = (message: string, status = 400) =>
  new Response(JSON.stringify({ ok: false, error: message }), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });

const getAuthenticatedSession = async (
  db: D1Database,
  sessionSecret: string,
  sessionToken: string,
) => {
  if (!sessionToken) {
    return { error: jsonError('Missing session token.', 401) } as const;
  }

  const payload = await verifySessionToken(sessionToken, sessionSecret);
  if (!payload) {
    return { error: jsonError('Session expired or invalid.', 401) } as const;
  }

  const sessionRow = await getActiveSessionById(db, payload.sid);

  if (!sessionRow || sessionRow.expires_at <= Date.now()) {
    return { error: jsonError('Session expired or invalid.', 401) } as const;
  }

  await touchSessionVerification(db, sessionRow.id, Date.now());

  return { sessionRow } as const;
};

app.use('*', async (c, next) => {
  c.header('Cache-Control', 'no-store');
  await next();
});

app.get('/logo_horizontal.png', async (c) => {
  const assetResponse = await c.env.ASSETS.fetch(new Request(new URL('/logo_horizontal.png', c.req.url)));

  if (!assetResponse.ok) {
    return c.notFound();
  }

  return assetResponse;
});

app.post('/auth/request-otp', async (c) => {
  const body = await parseRequestBody(c.req);
  const email = normalizeEmail(typeof body.email === 'string' ? body.email : '');

  if (!email || !isValidEmail(email)) {
    return jsonError('Enter a valid email address.');
  }

  const now = Date.now();
  const existingOtp = await getActiveOtpCooldown(c.env.AUTH_DB, email);

  if (existingOtp && existingOtp.resend_after > now) {
    return jsonError('Please wait before requesting another OTP.', 429);
  }

  const otp = createOtp();
  const salt = createRandomToken(18);
  const codeHash = await hashOtp(otp, salt, c.env.SESSION_SECRET);

  try {
    await sendOtpEmail({
      assetBaseUrl: c.env.PARTNER_API_PUBLIC_BASE_URL ?? new URL(c.req.url).origin,
      email,
      otp,
      resendKey: c.env.RESEND_KEY,
      from: c.env.LOGIN_EMAIL_FROM,
      mode: c.env.AUTH_EMAIL_MODE ?? 'console',
    });
  } catch (error) {
    console.error('[auth] failed to send otp email', error);
    return jsonError('Unable to send OTP right now. Please try again.', 502);
  }

  await upsertOtp(c.env.AUTH_DB, {
    email,
    codeHash,
    salt,
    expiresAt: now + OTP_TTL_MS,
    resendAfter: now + OTP_RESEND_COOLDOWN_MS,
    attemptsRemaining: OTP_MAX_ATTEMPTS,
    requestedAt: now,
  });

  return c.json({
    ok: true,
    message: 'OTP sent.',
    expiresInSeconds: OTP_TTL_MS / 1000,
  });
});

app.post('/auth/verify-otp', async (c) => {
  const body = await parseRequestBody(c.req);
  const email = normalizeEmail(typeof body.email === 'string' ? body.email : '');
  const otp = (typeof body.otp === 'string' ? body.otp : '').trim();

  if (!email || !isValidEmail(email)) {
    return jsonError('Enter a valid email address.');
  }

  if (!/^\d{6}$/.test(otp)) {
    return jsonError('Enter the 6-digit OTP.');
  }

  const now = Date.now();
  const otpRow = await getPendingOtp(c.env.AUTH_DB, email);

  if (!otpRow || otpRow.expires_at <= now) {
    return jsonError('This OTP has expired. Request a new one.', 401);
  }

  if (otpRow.attempts_remaining <= 0) {
    return jsonError('Too many failed attempts. Request a new OTP.', 429);
  }

  const candidateHash = await hashOtp(otp, otpRow.salt, c.env.SESSION_SECRET);
  if (candidateHash !== otpRow.code_hash) {
    await decrementOtpAttempts(c.env.AUTH_DB, email);

    return jsonError('Incorrect OTP.', 401);
  }

  const sessionId = createRandomToken(24);
  const sessionExpiry = getSessionExpiry();
  const partnerSettings = await ensurePartnerSettings(c.env.AUTH_DB, email, now);

  await consumeOtpAndCreateSession(c.env.AUTH_DB, {
    email,
    consumedAt: now,
    sessionId,
    sessionCreatedAt: now,
    sessionExpiresAt: sessionExpiry,
    sessionLastVerifiedAt: now,
  });

  const sessionToken = await createSessionToken(
    {
      sid: sessionId,
      email,
      exp: sessionExpiry,
    },
    c.env.SESSION_SECRET,
  );

  return c.json({
    ok: true,
    email,
    expiresAt: sessionExpiry,
    uid: partnerSettings.uid,
    settings: {
      username: partnerSettings.username,
      withdrawalAddress: partnerSettings.withdrawalAddress,
      walletAddressUpdatedAt: partnerSettings.walletAddressUpdatedAt,
      walletAddressCooldownEndsAt: partnerSettings.walletAddressCooldownEndsAt,
      canUpdateWalletAddress: partnerSettings.canUpdateWalletAddress,
    },
    sessionToken,
  });
});

app.post('/auth/logout', async (c) => {
  const body = await parseRequestBody(c.req);
  const sessionToken = typeof body.sessionToken === 'string' ? body.sessionToken.trim() : '';
  if (!sessionToken) {
    return c.json({ ok: true });
  }

  const payload = await verifySessionToken(sessionToken, c.env.SESSION_SECRET);
  if (!payload) {
    return c.json({ ok: true });
  }

  await revokeSession(c.env.AUTH_DB, payload.sid, Date.now());

  return c.json({ ok: true });
});

app.post('/auth/session', async (c) => {
  const body = await parseRequestBody(c.req);
  const sessionToken = typeof body.sessionToken === 'string' ? body.sessionToken.trim() : '';
  const sessionResult = await getAuthenticatedSession(c.env.AUTH_DB, c.env.SESSION_SECRET, sessionToken);
  if ('error' in sessionResult) {
    return sessionResult.error;
  }

  const partnerSettings = await ensurePartnerSettings(c.env.AUTH_DB, sessionResult.sessionRow.email);

  return c.json({
    ok: true,
    email: partnerSettings.email,
    expiresAt: sessionResult.sessionRow.expires_at,
    uid: partnerSettings.uid,
    settings: {
      username: partnerSettings.username,
      withdrawalAddress: partnerSettings.withdrawalAddress,
      walletAddressUpdatedAt: partnerSettings.walletAddressUpdatedAt,
      walletAddressCooldownEndsAt: partnerSettings.walletAddressCooldownEndsAt,
      canUpdateWalletAddress: partnerSettings.canUpdateWalletAddress,
    },
  });
});

app.post('/setting/wallet-address', async (c) => {
  const body = await parseRequestBody(c.req);
  const sessionToken = typeof body.sessionToken === 'string' ? body.sessionToken.trim() : '';
  const sessionResult = await getAuthenticatedSession(c.env.AUTH_DB, c.env.SESSION_SECRET, sessionToken);
  if ('error' in sessionResult) {
    return sessionResult.error;
  }

  const partnerSettings = await ensurePartnerSettings(c.env.AUTH_DB, sessionResult.sessionRow.email);
  const withdrawalAddress = normalizeWithdrawalAddress(typeof body.withdrawalAddress === 'string' ? body.withdrawalAddress : '');
  let updatedSettings;

  try {
    updatedSettings = await updateWithdrawalAddress(c.env.AUTH_DB, partnerSettings.uid, withdrawalAddress);
  } catch (error) {
    if (error instanceof WalletAddressCooldownError) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: 'Wallet address can only be changed once every 7 days.',
          walletAddressCooldownEndsAt: error.cooldownEndsAt,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store',
          },
        },
      );
    }

    throw error;
  }

  return c.json({
    ok: true,
    email: partnerSettings.email,
    uid: partnerSettings.uid,
    settings: {
      username: partnerSettings.username,
      withdrawalAddress: updatedSettings.withdrawalAddress,
      walletAddressUpdatedAt: updatedSettings.walletAddressUpdatedAt,
      walletAddressCooldownEndsAt: updatedSettings.walletAddressCooldownEndsAt,
      canUpdateWalletAddress: updatedSettings.canUpdateWalletAddress,
    },
  });
});

app.post('/link', async (c) => {
  const body = await parseRequestBody(c.req);
  const sessionToken = typeof body.sessionToken === 'string' ? body.sessionToken.trim() : '';
  const sessionResult = await getAuthenticatedSession(c.env.AUTH_DB, c.env.SESSION_SECRET, sessionToken);
  if ('error' in sessionResult) {
    return sessionResult.error;
  }

  const partnerSettings = await ensurePartnerSettings(c.env.AUTH_DB, sessionResult.sessionRow.email);
  const links = await listPartnerLinks(c.env.AUTH_DB, partnerSettings.uid);

  return c.json({
    ok: true,
    links,
  });
});

app.post('/link/generate', async (c) => {
  const body = await parseRequestBody(c.req);
  const sessionToken = typeof body.sessionToken === 'string' ? body.sessionToken.trim() : '';
  const sessionResult = await getAuthenticatedSession(c.env.AUTH_DB, c.env.SESSION_SECRET, sessionToken);
  if ('error' in sessionResult) {
    return sessionResult.error;
  }

  const partnerSettings = await ensurePartnerSettings(c.env.AUTH_DB, sessionResult.sessionRow.email);
  const campaignName = typeof body.campaignName === 'string' ? body.campaignName : '';
  const campaignTag = typeof body.campaignTag === 'string' ? body.campaignTag : '';

  try {
    const result = await generatePartnerLink(c.env.AUTH_DB, {
      userUid: partnerSettings.uid,
      username: partnerSettings.username,
      campaignName,
      campaignTag,
      baseUrl: c.env.PARTNER_LINK_BASE_URL ?? 'https://ramp2swap.com/r',
    });

    return c.json({
      ok: true,
      duplicate: result.duplicate,
      duplicateField: result.duplicateField,
      link: result.link,
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Unable to generate link.');
  }
});

app.post('/link/delete', async (c) => {
  const body = await parseRequestBody(c.req);
  const sessionToken = typeof body.sessionToken === 'string' ? body.sessionToken.trim() : '';
  const sessionResult = await getAuthenticatedSession(c.env.AUTH_DB, c.env.SESSION_SECRET, sessionToken);
  if ('error' in sessionResult) {
    return sessionResult.error;
  }

  const partnerSettings = await ensurePartnerSettings(c.env.AUTH_DB, sessionResult.sessionRow.email);
  const linkId = typeof body.linkId === 'string' ? body.linkId : '';

  try {
    const deletedLink = await deletePartnerLink(c.env.AUTH_DB, partnerSettings.uid, linkId);
    if (!deletedLink) {
      return jsonError('Link not found.', 404);
    }

    return c.json({
      ok: true,
      link: deletedLink,
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Unable to delete link.');
  }
});

app.post('/transaction', async (c) => {
  const transaction = await parseRequestBody(c.req);
  const transactionId =
    typeof transaction.transaction_id === 'string' ? transaction.transaction_id.trim() : '';
  const status = typeof transaction.status === 'string' ? transaction.status.trim() : '';
  const amount = typeof transaction.amount === 'string' ? transaction.amount.trim() : null;
  const fromSymbol = typeof transaction.from === 'string' ? transaction.from.trim() : null;
  const toSymbol = typeof transaction.to === 'string' ? transaction.to.trim() : null;
  const walletAddress =
    typeof transaction.walletAddress === 'string' ? transaction.walletAddress.trim() : null;
  const timestamp =
    typeof transaction.timestamp === 'number' && Number.isFinite(transaction.timestamp)
      ? transaction.timestamp
      : null;
  const now = Date.now();

  if (!transactionId) {
    return jsonError('transaction_id is required.');
  }

  if (!status) {
    return jsonError('status is required.');
  }

  if (timestamp === null) {
    return jsonError('timestamp is required.');
  }

  await saveTransaction(c.env.AUTH_DB, {
    transactionId,
    status,
    amount,
    fromSymbol,
    toSymbol,
    walletAddress,
    timestamp,
    now,
  });

  return c.json({
    ok: true,
  });
});

app.post('/transaction/feed', async (c) => {
  const body = await parseRequestBody(c.req);
  const sessionToken = typeof body.sessionToken === 'string' ? body.sessionToken.trim() : '';
  const sessionResult = await getAuthenticatedSession(c.env.AUTH_DB, c.env.SESSION_SECRET, sessionToken);
  if ('error' in sessionResult) {
    return sessionResult.error;
  }

  const partnerSettings = await ensurePartnerSettings(c.env.AUTH_DB, sessionResult.sessionRow.email);
  const requestedUsername = typeof body.username === 'string' ? body.username.trim() : '';
  const username = requestedUsername || partnerSettings.username;

  if (username !== partnerSettings.username) {
    return jsonError('Username does not match authenticated partner.', 403);
  }

  const transactions = await listPartnerTransactionFeed(c.env.AUTH_DB, {
    username,
    secret: c.env.SESSION_SECRET,
  });

  return c.json({
    ok: true,
    username,
    transactions,
  });
});

app.post('/analytic', async (c) => {
  const body = await parseRequestBody(c.req);
  const sessionToken = typeof body.sessionToken === 'string' ? body.sessionToken.trim() : '';
  const sessionResult = await getAuthenticatedSession(c.env.AUTH_DB, c.env.SESSION_SECRET, sessionToken);
  if ('error' in sessionResult) {
    return sessionResult.error;
  }

  const partnerSettings = await ensurePartnerSettings(c.env.AUTH_DB, sessionResult.sessionRow.email);
  const requestedUsername = typeof body.username === 'string' ? body.username.trim() : '';
  if (requestedUsername && requestedUsername !== partnerSettings.username) {
    return jsonError('Username does not match authenticated partner.', 403);
  }

  const analytics = await getPartnerAnalytics(c.env.AUTH_DB, {
    userUid: partnerSettings.uid,
    username: partnerSettings.username,
  });

  return c.json({
    ok: true,
    username: analytics.username,
    ranges: analytics.ranges,
    topLinks: analytics.topLinks,
    geography: analytics.geography,
  });
});

app.post('/earning', async (c) => {
  const body = await parseRequestBody(c.req);
  const sessionToken = typeof body.sessionToken === 'string' ? body.sessionToken.trim() : '';
  const sessionResult = await getAuthenticatedSession(c.env.AUTH_DB, c.env.SESSION_SECRET, sessionToken);
  if ('error' in sessionResult) {
    return sessionResult.error;
  }

  const partnerSettings = await ensurePartnerSettings(c.env.AUTH_DB, sessionResult.sessionRow.email);
  await backfillMissingConversionPayouts(c.env.AUTH_DB);

  const earnings = await getPartnerEarningsSummary(c.env.AUTH_DB, {
    username: partnerSettings.username,
  });

  return c.json({
    ok: true,
    username: earnings.username,
    currentCommissionBps: earnings.currentCommissionBps,
    currentBalance: earnings.currentBalance,
    pendingBalance: earnings.pendingBalance,
    availableBalance: earnings.availableBalance,
    totalEarnings: earnings.totalEarnings,
  });
});

app.post('/overview', async (c) => {
  const body = await parseRequestBody(c.req);
  const sessionToken = typeof body.sessionToken === 'string' ? body.sessionToken.trim() : '';
  const sessionResult = await getAuthenticatedSession(c.env.AUTH_DB, c.env.SESSION_SECRET, sessionToken);
  if ('error' in sessionResult) {
    return sessionResult.error;
  }

  const partnerSettings = await ensurePartnerSettings(c.env.AUTH_DB, sessionResult.sessionRow.email);
  await backfillMissingConversionPayouts(c.env.AUTH_DB);

  const overview = await getPartnerOverviewSummary(c.env.AUTH_DB, {
    username: partnerSettings.username,
  });

  return c.json({
    ok: true,
    username: overview.username,
    metrics: overview.metrics,
  });
});

app.post('/settlement', async (c) => {
  const body = await parseRequestBody(c.req);
  const sessionToken = typeof body.sessionToken === 'string' ? body.sessionToken.trim() : '';
  const sessionResult = await getAuthenticatedSession(c.env.AUTH_DB, c.env.SESSION_SECRET, sessionToken);
  if ('error' in sessionResult) {
    return sessionResult.error;
  }

  const partnerSettings = await ensurePartnerSettings(c.env.AUTH_DB, sessionResult.sessionRow.email);
  const records = await listPartnerSettlements(c.env.AUTH_DB, {
    username: partnerSettings.username,
  });

  return c.json({
    ok: true,
    username: partnerSettings.username,
    records,
  });
});

app.post('/click', async (c) => {
  const click = await parseRequestBody(c.req);
  const event = typeof click.event === 'string' ? click.event.trim() : '';
  const username = typeof click.username === 'string' ? click.username.trim() : null;
  const campaign = typeof click.campaign === 'string' ? click.campaign.trim() : null;
  const country = typeof click.country === 'string' ? click.country.trim().toUpperCase() : null;
  const timestamp =
    typeof click.timestamp === 'number' && Number.isFinite(click.timestamp)
      ? click.timestamp
      : null;
  const now = Date.now();

  if (!event) {
    return jsonError('event is required.');
  }

  if (timestamp === null) {
    return jsonError('timestamp is required.');
  }

  await saveClick(c.env.AUTH_DB, {
    event,
    username,
    campaign,
    country,
    timestamp,
    now,
  });

  return c.json({
    ok: true,
  });
});

app.post('/conversion', async (c) => {
  const conversion = await parseRequestBody(c.req);
  const event = typeof conversion.event === 'string' ? conversion.event.trim() : '';
  const transactionId =
    typeof conversion.transaction_id === 'string' ? conversion.transaction_id.trim() : '';
  const username = typeof conversion.username === 'string' ? conversion.username.trim() : null;
  const campaign = typeof conversion.campaign === 'string' ? conversion.campaign.trim() : null;
  const country =
    typeof conversion.country === 'string' ? conversion.country.trim().toUpperCase() : null;
  const timestamp =
    typeof conversion.timestamp === 'number' && Number.isFinite(conversion.timestamp)
      ? conversion.timestamp
      : null;
  const now = Date.now();

  if (!event) {
    return jsonError('event is required.');
  }

  if (!transactionId) {
    return jsonError('transaction_id is required.');
  }

  if (timestamp === null) {
    return jsonError('timestamp is required.');
  }

  await saveConversion(c.env.AUTH_DB, {
    transactionId,
    event,
    username,
    campaign,
    country,
    timestamp,
    now,
  });

  return c.json({
    ok: true,
  });
});

export default app;
