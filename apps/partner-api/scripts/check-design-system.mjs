import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const appRoot = join(scriptDir, '..');
const repoRoot = join(appRoot, '..', '..');
const docsFile = join(appRoot, 'DESIGN_SYSTEM.md');
const sharedDocsFile = join(repoRoot, 'packages', 'design-system', 'DESIGN_SYSTEM.md');
const emailTemplateFile = join(appRoot, 'src', 'lib', 'otp-email-template.ts');
const publicLogoFile = join(appRoot, 'public', 'logo_horizontal.png');

const failures = [];

function check(condition, message) {
  if (!condition) {
    failures.push(message);
  }
}

const docs = readFileSync(docsFile, 'utf8');
const sharedDocs = readFileSync(sharedDocsFile, 'utf8');
const emailTemplate = readFileSync(emailTemplateFile, 'utf8');

for (const requiredSection of [
  '## Relationship To Shared Design System',
  '## Non-Negotiable Rule',
  '## Owned Visual Surfaces',
  '## Email Rules',
  '## Change Protocol',
]) {
  check(docs.includes(requiredSection), `[Missing docs section] apps/partner-api/DESIGN_SYSTEM.md must include: ${requiredSection}`);
}

check(
  sharedDocs.includes('## Color Palette Rules (Strict)'),
  '[Missing shared docs section] packages/design-system/DESIGN_SYSTEM.md must include: ## Color Palette Rules (Strict)',
);

check(
  existsSync(publicLogoFile),
  '[Missing asset] apps/partner-api/public/logo_horizontal.png must exist for partner email branding.',
);

for (const requiredSnippet of [
  "family=DM+Mono",
  "family=DM+Sans",
  "family=Syne",
  '--obsidian-900: #0A0D0F;',
  '--slate-100: #E8F0F7;',
  '--mint-500: #00E5A0;',
  '--state-amber: #F59E0B;',
  '--state-red: #EF4444;',
  "/logo_horizontal.png",
]) {
  check(
    emailTemplate.includes(requiredSnippet),
    `[Email system drift] apps/partner-api/src/lib/otp-email-template.ts must include: ${requiredSnippet}`,
  );
}

for (const forbiddenPattern of [
  /(^|[^a-z])Inter([^a-z]|$)/i,
  /Helvetica\s+Neue/i,
  /Space\s+Grotesk/i,
]) {
  check(
    !forbiddenPattern.test(emailTemplate),
    `[Forbidden font] apps/partner-api/src/lib/otp-email-template.ts contains disallowed font pattern: ${forbiddenPattern}`,
  );
}

if (failures.length > 0) {
  console.error('\nDesign system guardrails failed:\n');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  console.error('\nFix the issues above before shipping changes.');
  process.exit(1);
}

console.log('Design system guardrails passed.');
