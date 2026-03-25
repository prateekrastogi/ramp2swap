import { Hono } from 'hono';
import type { HonoRequest } from 'hono';
import { createOtp, createRandomToken, createSessionToken, getSessionExpiry, hashOtp, isValidEmail, normalizeEmail, verifySessionToken } from './lib/auth';
import { sendOtpEmail } from './lib/email';
import {
  ensurePartnerSettings,
  normalizeWithdrawalAddress,
  updateWithdrawalAddress,
  WalletAddressCooldownError,
} from './lib/partner-settings';

type AuthOtpRow = {
  email: string;
  code_hash: string;
  salt: string;
  expires_at: number;
  resend_after: number;
  attempts_remaining: number;
};

type AuthSessionRow = {
  id: string;
  email: string;
  expires_at: number;
};

type Bindings = CloudflareBindings & {
  ASSETS: Fetcher;
  AUTH_DB: D1Database;
  SESSION_SECRET: string;
  RESEND_KEY?: string;
  LOGIN_EMAIL_FROM?: string;
  PARTNER_API_PUBLIC_BASE_URL?: string;
  AUTH_EMAIL_MODE?: string;
};

const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_RESEND_COOLDOWN_MS = 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;

let schemaReadyPromise: Promise<void> | null = null;

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

const ensureSchema = async (db: D1Database) => {
  schemaReadyPromise ??= db
    .batch([
      db.prepare(`
        CREATE TABLE IF NOT EXISTS auth_otps (
          email TEXT PRIMARY KEY,
          code_hash TEXT NOT NULL,
          salt TEXT NOT NULL,
          expires_at INTEGER NOT NULL,
          resend_after INTEGER NOT NULL,
          attempts_remaining INTEGER NOT NULL,
          requested_at INTEGER NOT NULL,
          consumed_at INTEGER
        )
      `),
      db.prepare('CREATE INDEX IF NOT EXISTS idx_auth_otps_expires_at ON auth_otps(expires_at)'),
      db.prepare(`
        CREATE TABLE IF NOT EXISTS auth_sessions (
          id TEXT PRIMARY KEY,
          email TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          expires_at INTEGER NOT NULL,
          last_verified_at INTEGER NOT NULL,
          revoked_at INTEGER
        )
      `),
      db.prepare('CREATE INDEX IF NOT EXISTS idx_auth_sessions_email ON auth_sessions(email)'),
      db.prepare('CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires_at ON auth_sessions(expires_at)'),
      db.prepare(`
        CREATE TABLE IF NOT EXISTS auth_users (
          uid TEXT PRIMARY KEY,
          email TEXT NOT NULL UNIQUE,
          created_at INTEGER NOT NULL,
          last_login_at INTEGER NOT NULL
        )
      `),
      db.prepare('CREATE INDEX IF NOT EXISTS idx_auth_users_email ON auth_users(email)'),
      db.prepare(`
        CREATE TABLE IF NOT EXISTS settings (
          user_uid TEXT PRIMARY KEY,
          username TEXT NOT NULL UNIQUE,
          withdrawal_address TEXT NOT NULL DEFAULT '',
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL,
          FOREIGN KEY (user_uid) REFERENCES auth_users(uid) ON DELETE CASCADE
        )
      `),
      db.prepare('CREATE INDEX IF NOT EXISTS idx_settings_username ON settings(username)'),
    ])
    .then(() => undefined);

  await schemaReadyPromise;
};

const jsonError = (message: string, status = 400) =>
  new Response(JSON.stringify({ ok: false, error: message }), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });

app.use('*', async (c, next) => {
  c.header('Cache-Control', 'no-store');
  await next();
});

app.get('/message', (c) => {
  return c.text('Hello Hono!');
});

app.get('/logo_horizontal.png', async (c) => {
  const assetResponse = await c.env.ASSETS.fetch(new Request(new URL('/logo_horizontal.png', c.req.url)));

  if (!assetResponse.ok) {
    return c.notFound();
  }

  return assetResponse;
});

app.post('/auth/request-otp', async (c) => {
  await ensureSchema(c.env.AUTH_DB);

  const body = await parseRequestBody(c.req);
  const email = normalizeEmail(typeof body.email === 'string' ? body.email : '');

  if (!email || !isValidEmail(email)) {
    return jsonError('Enter a valid email address.');
  }

  const now = Date.now();
  const existingOtp = await c.env.AUTH_DB.prepare(
    'SELECT email, resend_after FROM auth_otps WHERE email = ? AND consumed_at IS NULL',
  )
    .bind(email)
    .first<{ email: string; resend_after: number }>();

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

  await c.env.AUTH_DB.prepare(
    `
      INSERT INTO auth_otps (
        email,
        code_hash,
        salt,
        expires_at,
        resend_after,
        attempts_remaining,
        requested_at,
        consumed_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, NULL)
      ON CONFLICT(email) DO UPDATE SET
        code_hash = excluded.code_hash,
        salt = excluded.salt,
        expires_at = excluded.expires_at,
        resend_after = excluded.resend_after,
        attempts_remaining = excluded.attempts_remaining,
        requested_at = excluded.requested_at,
        consumed_at = NULL
    `,
  )
    .bind(email, codeHash, salt, now + OTP_TTL_MS, now + OTP_RESEND_COOLDOWN_MS, OTP_MAX_ATTEMPTS, now)
    .run();

  return c.json({
    ok: true,
    message: 'OTP sent.',
    expiresInSeconds: OTP_TTL_MS / 1000,
  });
});

app.post('/auth/verify-otp', async (c) => {
  await ensureSchema(c.env.AUTH_DB);

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
  const otpRow = await c.env.AUTH_DB.prepare(
    `
      SELECT email, code_hash, salt, expires_at, resend_after, attempts_remaining
      FROM auth_otps
      WHERE email = ? AND consumed_at IS NULL
    `,
  )
    .bind(email)
    .first<AuthOtpRow>();

  if (!otpRow || otpRow.expires_at <= now) {
    return jsonError('This OTP has expired. Request a new one.', 401);
  }

  if (otpRow.attempts_remaining <= 0) {
    return jsonError('Too many failed attempts. Request a new OTP.', 429);
  }

  const candidateHash = await hashOtp(otp, otpRow.salt, c.env.SESSION_SECRET);
  if (candidateHash !== otpRow.code_hash) {
    await c.env.AUTH_DB.prepare(
      'UPDATE auth_otps SET attempts_remaining = attempts_remaining - 1 WHERE email = ?',
    )
      .bind(email)
      .run();

    return jsonError('Incorrect OTP.', 401);
  }

  const sessionId = createRandomToken(24);
  const sessionExpiry = getSessionExpiry();
  const partnerSettings = await ensurePartnerSettings(c.env.AUTH_DB, email, now);

  await c.env.AUTH_DB.batch([
    c.env.AUTH_DB.prepare(
      `
        UPDATE auth_otps
        SET consumed_at = ?
        WHERE email = ?
      `,
    ).bind(now, email),
    c.env.AUTH_DB.prepare(
      `
        INSERT INTO auth_sessions (id, email, created_at, expires_at, last_verified_at, revoked_at)
        VALUES (?, ?, ?, ?, ?, NULL)
      `,
    ).bind(sessionId, email, now, sessionExpiry, now),
  ]);

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
  await ensureSchema(c.env.AUTH_DB);

  const body = await parseRequestBody(c.req);
  const sessionToken = typeof body.sessionToken === 'string' ? body.sessionToken.trim() : '';
  if (!sessionToken) {
    return c.json({ ok: true });
  }

  const payload = await verifySessionToken(sessionToken, c.env.SESSION_SECRET);
  if (!payload) {
    return c.json({ ok: true });
  }

  await c.env.AUTH_DB.prepare('UPDATE auth_sessions SET revoked_at = ? WHERE id = ?')
    .bind(Date.now(), payload.sid)
    .run();

  return c.json({ ok: true });
});

app.post('/auth/session', async (c) => {
  await ensureSchema(c.env.AUTH_DB);

  const body = await parseRequestBody(c.req);
  const sessionToken = typeof body.sessionToken === 'string' ? body.sessionToken.trim() : '';
  if (!sessionToken) {
    return jsonError('Missing session token.', 401);
  }

  const payload = await verifySessionToken(sessionToken, c.env.SESSION_SECRET);
  if (!payload) {
    return jsonError('Session expired or invalid.', 401);
  }

  const sessionRow = await c.env.AUTH_DB.prepare(
    'SELECT id, email, expires_at FROM auth_sessions WHERE id = ? AND revoked_at IS NULL',
  )
    .bind(payload.sid)
    .first<AuthSessionRow>();

  if (!sessionRow || sessionRow.expires_at <= Date.now()) {
    return jsonError('Session expired or invalid.', 401);
  }

  await c.env.AUTH_DB.prepare('UPDATE auth_sessions SET last_verified_at = ? WHERE id = ?')
    .bind(Date.now(), sessionRow.id)
    .run();

  const partnerSettings = await ensurePartnerSettings(c.env.AUTH_DB, sessionRow.email);

  return c.json({
    ok: true,
    email: partnerSettings.email,
    expiresAt: sessionRow.expires_at,
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

app.post('/settings/wallet-address', async (c) => {
  await ensureSchema(c.env.AUTH_DB);

  const body = await parseRequestBody(c.req);
  const sessionToken = typeof body.sessionToken === 'string' ? body.sessionToken.trim() : '';
  if (!sessionToken) {
    return jsonError('Missing session token.', 401);
  }

  const payload = await verifySessionToken(sessionToken, c.env.SESSION_SECRET);
  if (!payload) {
    return jsonError('Session expired or invalid.', 401);
  }

  const sessionRow = await c.env.AUTH_DB.prepare(
    'SELECT id, email, expires_at FROM auth_sessions WHERE id = ? AND revoked_at IS NULL',
  )
    .bind(payload.sid)
    .first<AuthSessionRow>();

  if (!sessionRow || sessionRow.expires_at <= Date.now()) {
    return jsonError('Session expired or invalid.', 401);
  }

  const partnerSettings = await ensurePartnerSettings(c.env.AUTH_DB, sessionRow.email);
  const withdrawalAddress = normalizeWithdrawalAddress(typeof body.withdrawalAddress === 'string' ? body.withdrawalAddress : '-');
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

export default app;
