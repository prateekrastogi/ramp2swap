import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_TRANSACTION_CENTS = 1_000_000;
const MIN_TRANSACTION_CENTS = 10_000;
const DEFAULT_REFERENCE_ISO = '2026-03-28T12:00:00.000Z';
const DEFAULT_LINK_BASE_URL = 'https://ramp2swap.com/r';

const DEFAULTS = {
  LOCAL_TEST_EMAIL_1: 'test1@gmail.com',
  LOCAL_TEST_EMAIL_2: 'test2@gmail.com',
  LOCAL_TEST_EMAIL_3: 'test3@gmail.com',
  STAGING_TEST_EMAIL_1: 'prastogi34@gmail.com',
  STAGING_TEST_EMAIL_2: 'prtk6592@gmail.com',
  STAGING_TEST_EMAIL_3: 'p.rastogi@outlook.com',
  PARTNER_TEST_LINK_BASE_URL: DEFAULT_LINK_BASE_URL,
  PARTNER_TEST_REFERENCE_ISO: DEFAULT_REFERENCE_ISO,
};

const USER_PROFILES = [
  {
    index: 1,
    days: 70,
    clicks: 1_000,
    links: 3,
    conversionTotalCents: 10_000_000,
    conversionTransactionCount: 20,
  },
  {
    index: 2,
    days: 90,
    clicks: 10_000,
    links: 10,
    conversionTotalCents: 50_000_000,
    conversionTransactionCount: 80,
  },
  {
    index: 3,
    days: 110,
    clicks: 50_000,
    links: 32,
    conversionTotalCents: 100_000_000,
    conversionTransactionCount: 160,
  },
];

const EXTRA_TRANSACTION_TOTAL_CENTS = 40_000_000;
const EXTRA_TRANSACTION_COUNT = 65;

const PAIRS = [
  ['ETH', 'USDC'],
  ['USDT', 'ETH'],
  ['WBTC', 'ETH'],
  ['DAI', 'USDC'],
  ['ARB', 'USDC'],
  ['SOL', 'USDC'],
  ['cbETH', 'ETH'],
  ['LINK', 'USDC'],
  ['MATIC', 'USDT'],
  ['OP', 'USDC'],
];

const COUNTRIES = ['US', 'IN', 'DE', 'GB', 'AE', 'SG', 'CA', 'AU'];

const WALLET_ADDRESSES = [
  '0x1111111111111111111111111111111111111111',
  '0x2222222222222222222222222222222222222222',
  '0x3333333333333333333333333333333333333333',
  '0x4444444444444444444444444444444444444444',
];

function parseEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return {};
  }

  const content = readFileSync(filePath, 'utf8');
  const entries = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }

    const separatorIndex = line.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    if (!key) {
      continue;
    }

    entries[key] = value;
  }

  return entries;
}

function getConfig() {
  const envFilePath = join(__dirname, '.env');
  const envFileValues = parseEnvFile(envFilePath);
  const resolve = (key) => process.env[key] ?? envFileValues[key] ?? DEFAULTS[key];

  const config = {
    localEmails: [
      resolve('LOCAL_TEST_EMAIL_1'),
      resolve('LOCAL_TEST_EMAIL_2'),
      resolve('LOCAL_TEST_EMAIL_3'),
    ],
    stagingEmails: [
      resolve('STAGING_TEST_EMAIL_1'),
      resolve('STAGING_TEST_EMAIL_2'),
      resolve('STAGING_TEST_EMAIL_3'),
    ],
    linkBaseUrl: resolve('PARTNER_TEST_LINK_BASE_URL'),
    referenceIso: resolve('PARTNER_TEST_REFERENCE_ISO'),
  };

  validateEmails('local', config.localEmails);
  validateEmails('staging', config.stagingEmails);

  return config;
}

function validateEmails(label, emails) {
  if (emails.some((email) => !email || !email.includes('@'))) {
    throw new Error(`Invalid ${label} test email configuration.`);
  }

  if (new Set(emails.map((email) => email.toLowerCase())).size !== emails.length) {
    throw new Error(`${label} test emails must be unique.`);
  }
}

function createRng(seedText) {
  let seed = 2166136261;
  for (const char of seedText) {
    seed ^= char.charCodeAt(0);
    seed = Math.imul(seed, 16777619);
  }

  return () => {
    seed += 0x6d2b79f5;
    let value = seed;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function randomInt(rng, min, max) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function sanitizeEmailLocalPart(email) {
  return email
    .split('@')[0]
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/--+/g, '-');
}

function deriveUsername(email, index) {
  const suffixes = ['prime', 'vector', 'summit'];
  return `${sanitizeEmailLocalPart(email)}-${suffixes[index - 1] ?? `user${index}`}`;
}

function sqlValue(value) {
  if (value === null || value === undefined) {
    return 'NULL';
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? String(value) : 'NULL';
  }

  return `'${String(value).replaceAll("'", "''")}'`;
}

function insertStatement(table, columns, rows) {
  if (rows.length === 0) {
    return [];
  }

  const chunks = [];
  const chunkSize = 500;

  for (let index = 0; index < rows.length; index += chunkSize) {
    const chunk = rows.slice(index, index + chunkSize);
    chunks.push(
      `INSERT INTO ${table} (${columns.join(', ')}) VALUES\n${chunk
        .map((row) => `  (${columns.map((column) => sqlValue(row[column])).join(', ')})`)
        .join(',\n')};`,
    );
  }

  return chunks;
}

function sqlList(values) {
  return values.map((value) => sqlValue(value)).join(', ');
}

function formatUsd(cents) {
  return (cents / 100).toFixed(2);
}

function buildAmountPlan(totalCents, count, rng) {
  let remaining = totalCents;
  const amounts = [];

  for (let index = 0; index < count; index += 1) {
    const remainingSlots = count - index - 1;
    const minPossibleForRest = remainingSlots * MIN_TRANSACTION_CENTS;
    const maxPossibleForRest = remainingSlots * MAX_TRANSACTION_CENTS;
    const minCurrent = Math.max(MIN_TRANSACTION_CENTS, remaining - maxPossibleForRest);
    const maxCurrent = Math.min(MAX_TRANSACTION_CENTS, remaining - minPossibleForRest);

    if (remainingSlots === 0) {
      amounts.push(remaining);
      break;
    }

    const target = Math.round(remaining / (remainingSlots + 1));
    const lowerBound = Math.max(minCurrent, target - Math.floor(target * 0.35));
    const upperBound = Math.min(maxCurrent, target + Math.floor(target * 0.35));
    const current =
      lowerBound > upperBound ? minCurrent : randomInt(rng, lowerBound, upperBound);

    amounts.push(current);
    remaining -= current;
  }

  return amounts;
}

function createUsers(envName, emails) {
  return USER_PROFILES.map((profile, profileIndex) => {
    const email = emails[profileIndex];
    return {
      ...profile,
      email,
      uid: `${envName}_user_${String(profile.index).padStart(2, '0')}`,
      sessionId: `${envName}_session_${String(profile.index).padStart(2, '0')}`,
      username: deriveUsername(email, profile.index),
      walletAddress: WALLET_ADDRESSES[profileIndex] ?? WALLET_ADDRESSES[WALLET_ADDRESSES.length - 1],
      linkTags: Array.from({ length: profile.links }, (_value, linkIndex) =>
        `u${profile.index}-c${String(linkIndex + 1).padStart(2, '0')}`,
      ),
    };
  });
}

function createAuthRows(envName, users, referenceTimestamp) {
  const authUsers = [];
  const authSessions = [];
  const authOtps = [];

  for (const user of users) {
    authUsers.push({
      uid: user.uid,
      email: user.email,
      created_at: referenceTimestamp - user.index * DAY_MS,
      last_login_at: referenceTimestamp - user.index * 3_600_000,
    });

    authSessions.push({
      id: user.sessionId,
      email: user.email,
      created_at: referenceTimestamp - DAY_MS,
      expires_at: referenceTimestamp + 6 * DAY_MS,
      last_verified_at: referenceTimestamp - 300_000,
      revoked_at: null,
    });

    authOtps.push({
      email: user.email,
      code_hash: `${envName}-otp-hash-${user.index}`,
      salt: `${envName}-otp-salt-${user.index}`,
      expires_at: referenceTimestamp + 15 * 60 * 1000,
      resend_after: referenceTimestamp - 60 * 1000,
      attempts_remaining: 5,
      requested_at: referenceTimestamp - 5 * 60 * 1000,
      consumed_at: null,
    });
  }

  return { authUsers, authSessions, authOtps };
}

function createSettingsRows(users, referenceTimestamp) {
  return users.map((user) => ({
    user_uid: user.uid,
    username: user.username,
    withdrawal_address: '',
    created_at: referenceTimestamp - 30 * DAY_MS,
    updated_at: referenceTimestamp - DAY_MS,
    wallet_address_updated_at: null,
  }));
}

function createLinksRows(envName, users, referenceTimestamp, linkBaseUrl) {
  const rows = [];

  for (const user of users) {
    user.linkTags.forEach((tag, linkIndex) => {
      rows.push({
        id: `${envName}_lnk_${user.index}_${String(linkIndex + 1).padStart(2, '0')}`,
        user_uid: user.uid,
        campaign_name: `User ${user.index} Campaign ${String(linkIndex + 1).padStart(2, '0')}`,
        campaign_tag: tag,
        generated_url: `${linkBaseUrl}?pid=${encodeURIComponent(user.username)}&cmp=${encodeURIComponent(tag)}`,
        created_at: referenceTimestamp - (linkIndex + 1) * DAY_MS,
        updated_at: referenceTimestamp - (linkIndex + 1) * DAY_MS,
      });
    });
  }

  return rows;
}

function createClicksRows(envName, users, referenceTimestamp, rng) {
  const rows = [];

  for (const user of users) {
    const horizonStart = referenceTimestamp - user.days * DAY_MS;

    for (let index = 0; index < user.clicks; index += 1) {
      const timestamp = randomInt(rng, horizonStart, referenceTimestamp);
      const campaignTag = user.linkTags[randomInt(rng, 0, user.linkTags.length - 1)];
      rows.push({
        event: 'affiliate',
        username: user.username,
        campaign: campaignTag,
        timestamp,
        created_at: timestamp + randomInt(rng, 0, 1_800_000),
        country: COUNTRIES[randomInt(rng, 0, COUNTRIES.length - 1)],
      });
    }
  }

  return rows.sort((left, right) => left.timestamp - right.timestamp);
}

function createTransactionRows(envName, users, referenceTimestamp, rng) {
  const transactions = [];
  const conversions = [];
  let transactionSequence = 0;

  for (const user of users) {
    const amounts = buildAmountPlan(user.conversionTotalCents, user.conversionTransactionCount, rng);
    const horizonStart = referenceTimestamp - user.days * DAY_MS;

    amounts.forEach((amountCents, index) => {
      transactionSequence += 1;
      const pair = PAIRS[(user.index + index) % PAIRS.length];
      const timestamp = randomInt(rng, horizonStart, referenceTimestamp);
      const transactionId = `${envName}_tx_${String(transactionSequence).padStart(5, '0')}`;
      const campaign = user.linkTags[randomInt(rng, 0, user.linkTags.length - 1)];

      transactions.push({
        transaction_id: transactionId,
        status: 'COMPLETED',
        amount: formatUsd(amountCents),
        from_symbol: pair[0],
        to_symbol: pair[1],
        wallet_address: user.walletAddress,
        timestamp,
        created_at: timestamp - randomInt(rng, 60_000, 1_800_000),
        updated_at: timestamp,
      });

      conversions.push({
        transaction_id: transactionId,
        event: 'conversion',
        username: user.username,
        campaign,
        timestamp: timestamp + randomInt(rng, 60_000, 900_000),
        payout: null,
        country: COUNTRIES[randomInt(rng, 0, COUNTRIES.length - 1)],
      });
    });
  }

  const unattributedAmounts = buildAmountPlan(EXTRA_TRANSACTION_TOTAL_CENTS, EXTRA_TRANSACTION_COUNT, rng);

  unattributedAmounts.forEach((amountCents, index) => {
    transactionSequence += 1;
    const pair = PAIRS[(index + 3) % PAIRS.length];
    const owner = users[index % users.length];
    const timestamp = randomInt(rng, referenceTimestamp - 120 * DAY_MS, referenceTimestamp);
    const statuses = ['PENDING', 'FAILED', 'COMPLETED'];

    transactions.push({
      transaction_id: `${envName}_tx_${String(transactionSequence).padStart(5, '0')}`,
      status: statuses[index % statuses.length],
      amount: formatUsd(amountCents),
      from_symbol: pair[0],
      to_symbol: pair[1],
      wallet_address: owner.walletAddress,
      timestamp,
      created_at: timestamp - randomInt(rng, 60_000, 1_800_000),
      updated_at: timestamp,
    });
  });

  return {
    transactions: transactions.sort((left, right) => left.timestamp - right.timestamp),
    conversions: conversions.sort((left, right) => left.timestamp - right.timestamp),
  };
}

function buildSql(envName, selectedEmails, config) {
  const referenceTimestamp = Date.parse(config.referenceIso);
  if (!Number.isFinite(referenceTimestamp)) {
    throw new Error(`Invalid PARTNER_TEST_REFERENCE_ISO: ${config.referenceIso}`);
  }

  const rng = createRng(`${envName}:${selectedEmails.join('|')}:${config.referenceIso}`);
  const users = createUsers(envName, selectedEmails);
  const { authUsers, authSessions, authOtps } = createAuthRows(envName, users, referenceTimestamp);
  const settings = createSettingsRows(users, referenceTimestamp);
  const links = createLinksRows(envName, users, referenceTimestamp, config.linkBaseUrl);
  const clicks = createClicksRows(envName, users, referenceTimestamp, rng);
  const { transactions, conversions } = createTransactionRows(envName, users, referenceTimestamp, rng);
  const emails = users.map((user) => user.email);
  const usernames = users.map((user) => user.username);
  const userUids = users.map((user) => user.uid);

  const statements = [
    `-- Generated partner-api test bench for ${envName}`,
    `-- Reference timestamp: ${new Date(referenceTimestamp).toISOString()}`,
    'BEGIN TRANSACTION;',
    `DELETE FROM conversions WHERE username IN (${sqlList(usernames)});`,
    `DELETE FROM clicks WHERE username IN (${sqlList(usernames)});`,
    `DELETE FROM links WHERE user_uid IN (${sqlList(userUids)});`,
    `DELETE FROM auth_sessions WHERE email IN (${sqlList(emails)});`,
    `DELETE FROM auth_otps WHERE email IN (${sqlList(emails)});`,
    `DELETE FROM auth_users WHERE email IN (${sqlList(emails)});`,
    `DELETE FROM transactions WHERE transaction_id LIKE ${sqlValue(`${envName}_tx_%`)};`,
    ...insertStatement(
      'auth_users',
      ['uid', 'email', 'created_at', 'last_login_at'],
      authUsers,
    ),
    ...insertStatement(
      'auth_sessions',
      ['id', 'email', 'created_at', 'expires_at', 'last_verified_at', 'revoked_at'],
      authSessions,
    ),
    ...insertStatement(
      'auth_otps',
      [
        'email',
        'code_hash',
        'salt',
        'expires_at',
        'resend_after',
        'attempts_remaining',
        'requested_at',
        'consumed_at',
      ],
      authOtps,
    ),
    ...insertStatement(
      'settings',
      ['user_uid', 'username', 'withdrawal_address', 'created_at', 'updated_at', 'wallet_address_updated_at'],
      settings,
    ),
    ...insertStatement(
      'links',
      ['id', 'user_uid', 'campaign_name', 'campaign_tag', 'generated_url', 'created_at', 'updated_at'],
      links,
    ),
    ...insertStatement(
      'clicks',
      ['event', 'username', 'campaign', 'timestamp', 'created_at', 'country'],
      clicks,
    ),
    ...insertStatement(
      'transactions',
      [
        'transaction_id',
        'status',
        'amount',
        'from_symbol',
        'to_symbol',
        'wallet_address',
        'timestamp',
        'created_at',
        'updated_at',
      ],
      transactions,
    ),
    ...insertStatement(
      'conversions',
      ['transaction_id', 'event', 'username', 'campaign', 'timestamp', 'payout', 'country'],
      conversions,
    ),
    'COMMIT;',
  ];

  return `${statements.join('\n\n')}\n`;
}

function main() {
  const config = getConfig();
  mkdirSync(__dirname, { recursive: true });

  const localSql = buildSql('local', config.localEmails, config);
  const stagingSql = buildSql('staging', config.stagingEmails, config);

  writeFileSync(join(__dirname, 'partner-testbench.local.sql'), localSql, 'utf8');
  writeFileSync(join(__dirname, 'partner-testbench.staging.sql'), stagingSql, 'utf8');

  process.stdout.write(
    [
      'Generated partner-api test bench SQL:',
      `- ${join(__dirname, 'partner-testbench.local.sql')}`,
      `- ${join(__dirname, 'partner-testbench.staging.sql')}`,
    ].join('\n'),
  );
}

main();
