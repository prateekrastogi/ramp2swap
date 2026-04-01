import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const appRoot = join(scriptDir, '..');
const repoRoot = join(appRoot, '..', '..');
const outputDir = join(appRoot, '.tmp');
const outputFile = join(outputDir, 'otp-email-preview.html');

const args = process.argv.slice(2);

const readArg = (name, fallback) => {
  const prefix = `--${name}=`;
  const match = args.find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : fallback;
};

const email = readArg('email', 'demo.partner@ramp2swap.com');
const otp = readArg('otp', '482913');
const assetBaseUrl = readArg('asset-base-url', 'http://localhost:8787');
const partnerLogoUrl = readArg('partner-logo-url', '../public/logo_horizontal_email.png');

const { buildOtpEmailHtml } = await import(resolve(repoRoot, 'apps/partner-api/src/lib/otp-email-template.ts'));

const html = buildOtpEmailHtml({
  assetBaseUrl,
  email,
  otp,
  partnerLogoUrl,
});

mkdirSync(outputDir, { recursive: true });
writeFileSync(outputFile, html, 'utf8');

console.log(`OTP email preview written to ${outputFile}`);
