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
  created_at: number;
  updated_at: number;
};

export type PartnerSettingsRecord = {
  uid: string;
  email: string;
  username: string;
  withdrawalAddress: string;
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
const DEFAULT_WITHDRAWAL_ADDRESS = '-';

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

export const ensurePartnerSettings = async (db: D1Database, email: string, now = Date.now()) => {
  let user = await db
    .prepare('SELECT uid, email, created_at, last_login_at FROM auth_users WHERE email = ?')
    .bind(email)
    .first<AuthUserRow>();

  if (!user) {
    user = {
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
        `,
      )
      .bind(user.uid, user.email, user.created_at, user.last_login_at)
      .run();
  } else {
    await db
      .prepare('UPDATE auth_users SET last_login_at = ? WHERE uid = ?')
      .bind(now, user.uid)
      .run();
  }

  let settings = await db
    .prepare(
      `
        SELECT user_uid, username, withdrawal_address, created_at, updated_at
        FROM settings
        WHERE user_uid = ?
      `,
    )
    .bind(user.uid)
    .first<PartnerSettingsRow>();

  if (!settings) {
    const username = await generateUniqueUsername(db, email, user.uid);
    settings = {
      user_uid: user.uid,
      username,
      withdrawal_address: DEFAULT_WITHDRAWAL_ADDRESS,
      created_at: now,
      updated_at: now,
    };

    await db
      .prepare(
        `
          INSERT INTO settings (user_uid, username, withdrawal_address, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?)
        `,
      )
      .bind(settings.user_uid, settings.username, settings.withdrawal_address, settings.created_at, settings.updated_at)
      .run();
  }

  return {
    uid: user.uid,
    email: user.email,
    username: settings.username,
    withdrawalAddress: settings.withdrawal_address,
  } satisfies PartnerSettingsRecord;
};

export const getPartnerSettingsBySessionId = async (db: D1Database, sessionId: string) => {
  const sessionUser = await db
    .prepare(
      `
        SELECT u.uid, u.email, s.username, s.withdrawal_address
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
    }>();

  if (!sessionUser) {
    return null;
  }

  return {
    uid: sessionUser.uid,
    email: sessionUser.email,
    username: sessionUser.username,
    withdrawalAddress: sessionUser.withdrawal_address,
  } satisfies PartnerSettingsRecord;
};

export const updateWithdrawalAddress = async (db: D1Database, userUid: string, withdrawalAddress: string, now = Date.now()) => {
  const normalizedAddress = normalizeWithdrawalAddress(withdrawalAddress);

  await db
    .prepare(
        `
        UPDATE settings
        SET withdrawal_address = ?, updated_at = ?
        WHERE user_uid = ?
      `,
    )
    .bind(normalizedAddress, now, userUid)
    .run();

  return normalizedAddress;
};
