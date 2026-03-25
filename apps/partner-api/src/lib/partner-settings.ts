import { uniqueNamesGenerator } from 'unique-names-generator';
import { createRandomToken } from './auth';

type AuthUserRow = {
  uid: string;
  email: string;
  created_at: number;
  last_login_at: number;
};

type PartnerSettingsRow = {
  user_uid: string;
  username: string;
  withdrawal_address: string;
  wallet_address_updated_at: number | null;
  created_at: number;
  updated_at: number;
};

export type PartnerSettingsRecord = {
  uid: string;
  email: string;
  username: string;
  withdrawalAddress: string;
  walletAddressUpdatedAt: number | null;
  walletAddressCooldownEndsAt: number | null;
  canUpdateWalletAddress: boolean;
};

const cryptoAdjectives = [
  'arc',
  'alpha',
  'apex',
  'arb',
  'astro',
  'atomic',
  'aurora',
  'axiom',
  'beacon',
  'binary',
  'block',
  'blue',
  'catalyst',
  'celestial',
  'central',
  'chrome',
  'cipher',
  'clarity',
  'cloud',
  'cobalt',
  'consensus',
  'cosmic',
  'crimson',
  'crystal',
  'cyber',
  'deep',
  'delta',
  'digital',
  'drift',
  'dynamic',
  'epoch',
  'ever',
  'falcon',
  'flash',
  'fluid',
  'fractal',
  'genesis',
  'glacier',
  'gold',
  'gravity',
  'grid',
  'halo',
  'helium',
  'helix',
  'horizon',
  'hyper',
  'ice',
  'ignition',
  'infinite',
  'ion',
  'jade',
  'jet',
  'keystone',
  'lattice',
  'legend',
  'liquid',
  'lithic',
  'logic',
  'lunar',
  'matrix',
  'mesh',
  'metal',
  'mint',
  'modular',
  'nebula',
  'native',
  'neon',
  'neural',
  'nova',
  'nucleus',
  'onyx',
  'omni',
  'opal',
  'orbit',
  'origin',
  'parallel',
  'photon',
  'pilot',
  'prime',
  'proof',
  'proto',
  'quant',
  'quartz',
  'rapid',
  'real',
  'relay',
  'ripple',
  'rocket',
  'royal',
  'ruby',
  'saffron',
  'satoshi',
  'secure',
  'signal',
  'silver',
  'solar',
  'sovereign',
  'spectra',
  'spiral',
  'stable',
  'stellar',
  'stone',
  'summit',
  'super',
  'swift',
  'synapse',
  'tangent',
  'tensor',
  'theory',
  'thunder',
  'titan',
  'token',
  'topaz',
  'turbo',
  'ultra',
  'unity',
  'uplink',
  'vector',
  'velocity',
  'vertex',
  'vortex',
  'vivid',
  'wave',
  'white',
  'wired',
  'zen',
  'zero',
  'zeta',
];

const cryptoTerms = [
  'anchor',
  'atlas',
  'bank',
  'block',
  'bridge',
  'capital',
  'chain',
  'cipher',
  'clearing',
  'credit',
  'custody',
  'dex',
  'engine',
  'epoch',
  'exchange',
  'finance',
  'flow',
  'forge',
  'fund',
  'gas',
  'gateway',
  'genesis',
  'hash',
  'hedge',
  'hub',
  'index',
  'inbox',
  'layer',
  'ledger',
  'liquidity',
  'loop',
  'market',
  'matrix',
  'mint',
  'module',
  'network',
  'oracle',
  'pay',
  'payments',
  'pool',
  'prime',
  'proof',
  'protocol',
  'quant',
  'rail',
  'reserve',
  'relay',
  'rollup',
  'router',
  'settlement',
  'signal',
  'sol',
  'staking',
  'stream',
  'strategy',
  'swap',
  'system',
  'terminal',
  'trade',
  'treasury',
  'trust',
  'vault',
  'validator',
  'token',
  'vector',
  'wallet',
  'wire',
  'yield',
];

const USERNAME_SEPARATOR = '-';
const DEFAULT_WITHDRAWAL_ADDRESS = '';
export const WALLET_ADDRESS_UPDATE_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

type WalletAddressUpdateResult = Pick<
  PartnerSettingsRecord,
  'withdrawalAddress' | 'walletAddressUpdatedAt' | 'walletAddressCooldownEndsAt' | 'canUpdateWalletAddress'
>;

const buildUsernameCandidate = (email: string, attempt: number) =>
  uniqueNamesGenerator({
    dictionaries: [cryptoAdjectives, cryptoTerms],
    separator: USERNAME_SEPARATOR,
    length: 2,
    style: 'lowerCase',
    seed: `${email}:${attempt}`,
  });

const generateFallbackSuffix = async (value: string) => {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest))
    .slice(0, 3)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
};

const generateUniqueUsername = async (db: D1Database, email: string, userUid: string) => {
  for (let attempt = 0; attempt < 64; attempt += 1) {
    const candidate = buildUsernameCandidate(email, attempt);
    const existing = await db
      .prepare('SELECT user_uid FROM settings WHERE username = ?')
      .bind(candidate)
      .first<{ user_uid: string }>();

    if (!existing || existing.user_uid === userUid) {
      return candidate;
    }
  }

  return `${buildUsernameCandidate(email, 64)}${await generateFallbackSuffix(`${email}:${userUid}`)}`;
};

export const normalizeWithdrawalAddress = (value: string) => {
  const trimmed = value.trim();
  return trimmed ? trimmed : DEFAULT_WITHDRAWAL_ADDRESS;
};

const buildWalletAddressUpdateResult = (withdrawalAddress: string, walletAddressUpdatedAt: number | null, now = Date.now()): WalletAddressUpdateResult => {
  const walletAddressCooldownEndsAt =
    typeof walletAddressUpdatedAt === 'number'
      ? walletAddressUpdatedAt + WALLET_ADDRESS_UPDATE_COOLDOWN_MS
      : null;

  return {
    withdrawalAddress,
    walletAddressUpdatedAt,
    walletAddressCooldownEndsAt,
    canUpdateWalletAddress: walletAddressCooldownEndsAt === null || walletAddressCooldownEndsAt <= now,
  };
};

export const ensurePartnerSettings = async (db: D1Database, email: string, now = Date.now()) => {
  const provisionalUser = {
    uid: `usr_${createRandomToken(18)}`,
    email,
    created_at: now,
    last_login_at: now,
  };

  await db
    .prepare(
      `
        INSERT INTO auth_users (uid, email, created_at, last_login_at)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(email) DO UPDATE SET
          last_login_at = excluded.last_login_at
      `,
    )
    .bind(provisionalUser.uid, provisionalUser.email, provisionalUser.created_at, provisionalUser.last_login_at)
    .run();

  const user = await db
    .prepare('SELECT uid, email, created_at, last_login_at FROM auth_users WHERE email = ?')
    .bind(email)
    .first<AuthUserRow>();

  if (!user) {
    throw new Error('Partner user was not found after upsert.');
  }

  let settings = await db
    .prepare(
      `
        SELECT user_uid, username, withdrawal_address, created_at, updated_at
             , wallet_address_updated_at
        FROM settings
        WHERE user_uid = ?
      `,
    )
    .bind(user.uid)
    .first<PartnerSettingsRow>();

  if (!settings) {
    const username = await generateUniqueUsername(db, email, user.uid);

    await db
      .prepare(
        `
          INSERT OR IGNORE INTO settings (
            user_uid,
            username,
            withdrawal_address,
            wallet_address_updated_at,
            created_at,
            updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?)
        `,
      )
      .bind(
        user.uid,
        username,
        DEFAULT_WITHDRAWAL_ADDRESS,
        null,
        now,
        now,
      )
      .run();

    settings = await db
      .prepare(
        `
          SELECT user_uid, username, withdrawal_address, created_at, updated_at
               , wallet_address_updated_at
          FROM settings
          WHERE user_uid = ?
        `,
      )
      .bind(user.uid)
      .first<PartnerSettingsRow>();
  }

  if (!settings) {
    throw new Error('Partner settings were not found after initialization.');
  }

  return {
    uid: user.uid,
    email: user.email,
    username: settings.username,
    ...buildWalletAddressUpdateResult(settings.withdrawal_address, settings.wallet_address_updated_at, now),
  } satisfies PartnerSettingsRecord;
};

export const getPartnerSettingsBySessionId = async (db: D1Database, sessionId: string) => {
  const sessionUser = await db
    .prepare(
      `
        SELECT u.uid, u.email, s.username, s.withdrawal_address
             , s.wallet_address_updated_at
        FROM auth_sessions AS sess
        INNER JOIN auth_users AS u ON u.email = sess.email
        INNER JOIN settings AS s ON s.user_uid = u.uid
        WHERE sess.id = ? AND sess.revoked_at IS NULL
      `,
    )
    .bind(sessionId)
    .first<{
      uid: string;
      email: string;
      username: string;
      withdrawal_address: string;
      wallet_address_updated_at: number | null;
    }>();

  if (!sessionUser) {
    return null;
  }

  return {
    uid: sessionUser.uid,
    email: sessionUser.email,
    username: sessionUser.username,
    ...buildWalletAddressUpdateResult(sessionUser.withdrawal_address, sessionUser.wallet_address_updated_at),
  } satisfies PartnerSettingsRecord;
};

export class WalletAddressCooldownError extends Error {
  readonly cooldownEndsAt: number;

  constructor(cooldownEndsAt: number) {
    super(`Wallet address can be updated again after ${new Date(cooldownEndsAt).toISOString()}.`);
    this.name = 'WalletAddressCooldownError';
    this.cooldownEndsAt = cooldownEndsAt;
  }
}

export const updateWithdrawalAddress = async (db: D1Database, userUid: string, withdrawalAddress: string, now = Date.now()): Promise<WalletAddressUpdateResult> => {
  const normalizedAddress = normalizeWithdrawalAddress(withdrawalAddress);
  const existingSettings = await db
    .prepare('SELECT withdrawal_address, wallet_address_updated_at FROM settings WHERE user_uid = ?')
    .bind(userUid)
    .first<Pick<PartnerSettingsRow, 'withdrawal_address' | 'wallet_address_updated_at'>>();

  if (!existingSettings) {
    throw new Error('Partner settings were not found.');
  }

  if (existingSettings.withdrawal_address === normalizedAddress) {
    return buildWalletAddressUpdateResult(normalizedAddress, existingSettings.wallet_address_updated_at, now);
  }

  if (typeof existingSettings.wallet_address_updated_at === 'number') {
    const cooldownEndsAt = existingSettings.wallet_address_updated_at + WALLET_ADDRESS_UPDATE_COOLDOWN_MS;
    if (cooldownEndsAt > now) {
      throw new WalletAddressCooldownError(cooldownEndsAt);
    }
  }

  await db
    .prepare(
      `
        UPDATE settings
        SET withdrawal_address = ?, wallet_address_updated_at = ?, updated_at = ?
        WHERE user_uid = ?
          AND (
            wallet_address_updated_at IS NULL
            OR wallet_address_updated_at <= ?
          )
      `,
    )
    .bind(normalizedAddress, now, now, userUid, now - WALLET_ADDRESS_UPDATE_COOLDOWN_MS)
    .run();

  const latestSettings = await db
    .prepare('SELECT withdrawal_address, wallet_address_updated_at FROM settings WHERE user_uid = ?')
    .bind(userUid)
    .first<Pick<PartnerSettingsRow, 'withdrawal_address' | 'wallet_address_updated_at'>>();

  if (!latestSettings) {
    throw new Error('Partner settings were not found after update.');
  }

  if (latestSettings.withdrawal_address !== normalizedAddress) {
    const cooldownEndsAt = latestSettings.wallet_address_updated_at
      ? latestSettings.wallet_address_updated_at + WALLET_ADDRESS_UPDATE_COOLDOWN_MS
      : now + WALLET_ADDRESS_UPDATE_COOLDOWN_MS;
    throw new WalletAddressCooldownError(cooldownEndsAt);
  }

  return buildWalletAddressUpdateResult(latestSettings.withdrawal_address, latestSettings.wallet_address_updated_at, now);
};
