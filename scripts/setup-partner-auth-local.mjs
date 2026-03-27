import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { randomBytes } from 'node:crypto';

const repoRoot = resolve(new URL('..', import.meta.url).pathname);
const partnerApiVarsPath = resolve(repoRoot, 'apps/partner-api/.dev.vars');
const partnerWebEnvPath = resolve(repoRoot, 'apps/partner-web/.env');

const ensureDir = (filePath) => {
  mkdirSync(dirname(filePath), { recursive: true });
};

const parseEnvFile = (filePath) => {
  if (!existsSync(filePath)) return {};

  const contents = readFileSync(filePath, 'utf8');
  return Object.fromEntries(
    contents
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#') && line.includes('='))
      .map((line) => {
        const separatorIndex = line.indexOf('=');
        const key = line.slice(0, separatorIndex);
        const value = line.slice(separatorIndex + 1);
        return [key, value];
      }),
  );
};

const writeEnvFile = (filePath, values) => {
  ensureDir(filePath);
  const contents = Object.entries(values)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  writeFileSync(filePath, `${contents}\n`, 'utf8');
};

const apiVars = parseEnvFile(partnerApiVarsPath);
const webEnv = parseEnvFile(partnerWebEnvPath);

const sharedSecret =
  apiVars.SESSION_SECRET ||
  webEnv.SESSION_SECRET ||
  randomBytes(32).toString('hex');

writeEnvFile(partnerApiVarsPath, {
  SESSION_SECRET: sharedSecret,
  AUTH_EMAIL_MODE: apiVars.AUTH_EMAIL_MODE || 'console',
  LOGIN_EMAIL_FROM: apiVars.LOGIN_EMAIL_FROM || 'Ramp2Swap Partners <auth@yourdomain.com>',
  RESEND_KEY: apiVars.RESEND_KEY || '',
  PARTNER_LINK_BASE_URL: apiVars.PARTNER_LINK_BASE_URL || 'http://localhost:1234/r',
});

writeEnvFile(partnerWebEnvPath, {
  PARTNER_API_BASE_URL: webEnv.PARTNER_API_BASE_URL || 'http://127.0.0.1:8787',
  PARTNER_LINK_BASE_URL: webEnv.PARTNER_LINK_BASE_URL || 'http://localhost:1234/r',
  SESSION_SECRET: sharedSecret,
});

console.log('Partner auth local env files are ready.');
console.log(`- ${partnerApiVarsPath}`);
console.log(`- ${partnerWebEnvPath}`);
