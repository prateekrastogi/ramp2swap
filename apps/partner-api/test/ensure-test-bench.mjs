import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ENV_DEFAULTS = {
  local: {
    sqlFile: join(__dirname, 'partner-testbench.local.sql'),
    wranglerArgs: ['d1', 'execute', 'AUTH_DB', '--local'],
  },
  staging: {
    sqlFile: join(__dirname, 'partner-testbench.staging.sql'),
    wranglerArgs: ['d1', 'execute', 'AUTH_DB', '--remote', '--env', 'staging'],
  },
};

const CONFIG_DEFAULTS = {
  LOCAL_TEST_EMAIL_1: 'test1@gmail.com',
  LOCAL_TEST_EMAIL_2: 'test2@gmail.com',
  LOCAL_TEST_EMAIL_3: 'test3@gmail.com',
  LOCAL_TEST_EMAIL_4: 'test4@gmail.com',
  STAGING_TEST_EMAIL_1: 'prastogi34@gmail.com',
  STAGING_TEST_EMAIL_2: 'prtk6592@gmail.com',
  STAGING_TEST_EMAIL_3: 'p.rastogi@outlook.com',
  STAGING_TEST_EMAIL_4: 'r.prateek@outlook.com',
};

const EXPECTED = {
  auth_user_count: 4,
  auth_session_count: 4,
  auth_otp_count: 4,
  settings_count: 4,
  user_1_link_count: 3,
  user_2_link_count: 10,
  user_3_link_count: 32,
  user_4_link_count: 2,
  user_1_click_count: 1000,
  user_2_click_count: 10000,
  user_3_click_count: 50000,
  user_4_click_count: 720,
  user_1_click_campaign_count: 3,
  user_2_click_campaign_count: 10,
  user_3_click_campaign_count: 32,
  user_4_click_campaign_count: 2,
  transaction_count: 332,
  transaction_total: 2079000,
  conversion_count: 267,
  user_1_conversion_total: 100000,
  user_2_conversion_total: 500000,
  user_3_conversion_total: 1000000,
  user_4_conversion_total: 79000,
  verified_true_count: 239,
  withdrawn_true_count: 131,
  settlements_count: 11,
  user_1_settlement_count: 1,
  user_2_settlement_count: 3,
  user_3_settlement_count: 6,
  user_4_settlement_count: 1,
  paid_settlement_count: 10,
  pending_settlement_count: 1,
};

function parseEnvName(argv) {
  const argIndex = argv.findIndex((arg) => arg === '--env');
  if (argIndex !== -1 && argv[argIndex + 1]) {
    return argv[argIndex + 1];
  }

  const envArg = argv.find((arg) => arg.startsWith('--env='));
  if (envArg) {
    return envArg.slice('--env='.length);
  }

  return 'local';
}

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
    if (key) {
      entries[key] = value;
    }
  }

  return entries;
}

function resolveConfig() {
  const envFile = parseEnvFile(join(__dirname, '.env'));
  const read = (key) => process.env[key] ?? envFile[key] ?? CONFIG_DEFAULTS[key];

  return {
    localEmails: [
      read('LOCAL_TEST_EMAIL_1'),
      read('LOCAL_TEST_EMAIL_2'),
      read('LOCAL_TEST_EMAIL_3'),
      read('LOCAL_TEST_EMAIL_4'),
    ],
    stagingEmails: [
      read('STAGING_TEST_EMAIL_1'),
      read('STAGING_TEST_EMAIL_2'),
      read('STAGING_TEST_EMAIL_3'),
      read('STAGING_TEST_EMAIL_4'),
    ],
  };
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
  const suffixes = ['prime', 'vector', 'summit', 'user4'];
  return `${sanitizeEmailLocalPart(email)}-${suffixes[index - 1] ?? `user${index}`}`;
}

function run(command, args, { capture = false } = {}) {
  const result = spawnSync(command, args, {
    cwd: join(__dirname, '..'),
    encoding: 'utf8',
    stdio: capture ? 'pipe' : 'inherit',
    shell: process.platform === 'win32',
  });

  if (result.error) {
    throw result.error;
  }

  if ((result.status ?? 0) !== 0) {
    if (capture) {
      const stderr = result.stderr?.trim();
      throw new Error(stderr || `Command failed: ${command} ${args.join(' ')}`);
    }

    process.exit(result.status ?? 1);
  }

  return result.stdout ?? '';
}

function runWranglerJson(args) {
  const stdout = run('npx', ['wrangler', ...args, '--json'], { capture: true });
  return JSON.parse(stdout);
}

function coerceNumeric(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function buildEnvironmentQuery(envName, { emails, usernames }) {
  const [email1, email2, email3, email4] = emails;
  const [username1, username2, username3, username4] = usernames;
  const orderedEmailCase = `CASE email WHEN '${email1}' THEN 1 WHEN '${email2}' THEN 2 WHEN '${email3}' THEN 3 WHEN '${email4}' THEN 4 ELSE 99 END`;
  const orderedUsernameCase = `CASE username WHEN '${username1}' THEN 1 WHEN '${username2}' THEN 2 WHEN '${username3}' THEN 3 WHEN '${username4}' THEN 4 ELSE 99 END`;

  return `
    SELECT
      (
        SELECT GROUP_CONCAT(email, '|')
        FROM (
          SELECT email
          FROM auth_users
          WHERE email IN ('${email1}', '${email2}', '${email3}', '${email4}')
          ORDER BY ${orderedEmailCase}
        )
      ) AS ordered_emails,
      (
        SELECT COUNT(*)
        FROM auth_users
        WHERE email IN ('${email1}', '${email2}', '${email3}', '${email4}')
      ) AS auth_user_count,
      (
        SELECT COUNT(*)
        FROM auth_sessions
        WHERE email IN ('${email1}', '${email2}', '${email3}', '${email4}')
      ) AS auth_session_count,
      (
        SELECT COUNT(*)
        FROM auth_otps
        WHERE email IN ('${email1}', '${email2}', '${email3}', '${email4}')
      ) AS auth_otp_count,
      (
        SELECT GROUP_CONCAT(username, '|')
        FROM (
          SELECT username
          FROM settings
          WHERE username IN ('${username1}', '${username2}', '${username3}', '${username4}')
          ORDER BY ${orderedUsernameCase}
        )
      ) AS ordered_usernames,
      (
        SELECT COUNT(*)
        FROM settings
        WHERE username IN ('${username1}', '${username2}', '${username3}', '${username4}')
      ) AS settings_count,
      (SELECT COUNT(*) FROM links WHERE user_uid = '${envName}_user_01') AS user_1_link_count,
      (SELECT COUNT(*) FROM links WHERE user_uid = '${envName}_user_02') AS user_2_link_count,
      (SELECT COUNT(*) FROM links WHERE user_uid = '${envName}_user_03') AS user_3_link_count,
      (SELECT COUNT(*) FROM links WHERE user_uid = '${envName}_user_04') AS user_4_link_count,
      (SELECT COUNT(*) FROM clicks WHERE username = '${username1}') AS user_1_click_count,
      (SELECT COUNT(*) FROM clicks WHERE username = '${username2}') AS user_2_click_count,
      (SELECT COUNT(*) FROM clicks WHERE username = '${username3}') AS user_3_click_count,
      (SELECT COUNT(*) FROM clicks WHERE username = '${username4}') AS user_4_click_count,
      (SELECT COUNT(DISTINCT campaign) FROM clicks WHERE username = '${username1}') AS user_1_click_campaign_count,
      (SELECT COUNT(DISTINCT campaign) FROM clicks WHERE username = '${username2}') AS user_2_click_campaign_count,
      (SELECT COUNT(DISTINCT campaign) FROM clicks WHERE username = '${username3}') AS user_3_click_campaign_count,
      (SELECT COUNT(DISTINCT campaign) FROM clicks WHERE username = '${username4}') AS user_4_click_campaign_count,
      (SELECT COUNT(*) FROM transactions WHERE transaction_id LIKE '${envName}_tx_%') AS transaction_count,
      (SELECT ROUND(COALESCE(SUM(CAST(amount AS REAL)), 0), 2) FROM transactions WHERE transaction_id LIKE '${envName}_tx_%') AS transaction_total,
      (SELECT COUNT(*) FROM conversions WHERE username IN ('${username1}', '${username2}', '${username3}', '${username4}')) AS conversion_count,
      (
        SELECT ROUND(COALESCE(SUM(CAST(t.amount AS REAL)), 0), 2)
        FROM conversions c
        JOIN transactions t ON t.transaction_id = c.transaction_id
        WHERE c.username = '${username1}'
      ) AS user_1_conversion_total,
      (
        SELECT ROUND(COALESCE(SUM(CAST(t.amount AS REAL)), 0), 2)
        FROM conversions c
        JOIN transactions t ON t.transaction_id = c.transaction_id
        WHERE c.username = '${username2}'
      ) AS user_2_conversion_total,
      (
        SELECT ROUND(COALESCE(SUM(CAST(t.amount AS REAL)), 0), 2)
        FROM conversions c
        JOIN transactions t ON t.transaction_id = c.transaction_id
        WHERE c.username = '${username3}'
      ) AS user_3_conversion_total,
      (
        SELECT ROUND(COALESCE(SUM(CAST(t.amount AS REAL)), 0), 2)
        FROM conversions c
        JOIN transactions t ON t.transaction_id = c.transaction_id
        WHERE c.username = '${username4}'
      ) AS user_4_conversion_total,
      (SELECT COUNT(*) FROM conversions WHERE username IN ('${username1}', '${username2}', '${username3}', '${username4}') AND verified = 'true') AS verified_true_count,
      (SELECT COUNT(*) FROM conversions WHERE username IN ('${username1}', '${username2}', '${username3}', '${username4}') AND withdrawn = 'true') AS withdrawn_true_count,
      (SELECT COUNT(*) FROM settlements WHERE username IN ('${username1}', '${username2}', '${username3}', '${username4}')) AS settlements_count,
      (SELECT COUNT(*) FROM settlements WHERE username = '${username1}') AS user_1_settlement_count,
      (SELECT COUNT(*) FROM settlements WHERE username = '${username2}') AS user_2_settlement_count,
      (SELECT COUNT(*) FROM settlements WHERE username = '${username3}') AS user_3_settlement_count,
      (SELECT COUNT(*) FROM settlements WHERE username = '${username4}') AS user_4_settlement_count,
      (SELECT COUNT(*) FROM settlements WHERE username IN ('${username1}', '${username2}', '${username3}', '${username4}') AND status = 'paid') AS paid_settlement_count,
      (SELECT COUNT(*) FROM settlements WHERE username IN ('${username1}', '${username2}', '${username3}', '${username4}') AND status = 'pending') AS pending_settlement_count;
  `.trim();
}

function getFirstResultRow(jsonPayload) {
  const first = Array.isArray(jsonPayload) ? jsonPayload[0] : jsonPayload;
  const results = first?.results;
  if (Array.isArray(results) && results.length > 0) {
    return results[0];
  }

  return null;
}

function benchMatches(row, { emails, usernames }) {
  if (!row) {
    return false;
  }

  if (row.ordered_emails !== emails.join('|')) {
    return false;
  }

  if (row.ordered_usernames !== usernames.join('|')) {
    return false;
  }

  for (const [key, expectedValue] of Object.entries(EXPECTED)) {
    if (coerceNumeric(row[key]) !== expectedValue) {
      return false;
    }
  }

  return true;
}

function ensureGeneratedSql() {
  run('node', ['./test/generate-test-bench.mjs']);
}

function applyBench(target) {
  run('npx', ['wrangler', ...target.wranglerArgs, '--yes', '--file', target.sqlFile]);
}

function main() {
  const envName = parseEnvName(process.argv.slice(2));
  const target = ENV_DEFAULTS[envName];
  const config = resolveConfig();

  if (!target) {
    throw new Error(`Unsupported env "${envName}". Use local or staging.`);
  }

  const emails = envName === 'local' ? config.localEmails : config.stagingEmails;
  const usernames = emails.map((email, index) => deriveUsername(email, index + 1));
  target.emails = emails;
  target.usernames = usernames;

  ensureGeneratedSql();

  const query = buildEnvironmentQuery(envName, target);
  let row = null;

  try {
    row = getFirstResultRow(runWranglerJson([...target.wranglerArgs, '--command', query]));
  } catch {
    row = null;
  }

  if (benchMatches(row, target)) {
    console.log(`[testbench] ${envName} already matches the expected seeded users. Skipping apply.`);
    return;
  }

  console.log(`[testbench] ${envName} is missing the expected seeded state. Applying bench.`);
  applyBench(target);
}

main();
