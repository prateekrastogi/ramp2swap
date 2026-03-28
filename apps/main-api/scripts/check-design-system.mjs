import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const appRoot = join(scriptDir, '..');
const repoRoot = join(appRoot, '..', '..');
const srcRoot = join(appRoot, 'src');
const docsFile = join(appRoot, 'DESIGN_SYSTEM.md');
const sharedDocsFile = join(repoRoot, 'packages', 'design-system', 'DESIGN_SYSTEM.md');

const failures = [];

function walk(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      files.push(...walk(fullPath));
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

function check(condition, message) {
  if (!condition) {
    failures.push(message);
  }
}

const docs = readFileSync(docsFile, 'utf8');
const sharedDocs = readFileSync(sharedDocsFile, 'utf8');

for (const requiredSection of [
  '## Relationship To Shared Design System',
  '## Non-Negotiable Rule',
  '## Allowed Visual Surfaces',
  '## Change Protocol',
]) {
  check(docs.includes(requiredSection), `[Missing docs section] apps/main-api/DESIGN_SYSTEM.md must include: ${requiredSection}`);
}

check(
  sharedDocs.includes('## Extending In Apps'),
  '[Missing shared docs section] packages/design-system/DESIGN_SYSTEM.md must include: ## Extending In Apps',
);

check(
  !existsSync(join(appRoot, 'public')),
  '[Unexpected visual surface] apps/main-api must not add a public asset directory without updating its design-system contract.',
);

const srcFiles = walk(srcRoot).filter((file) =>
  file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.mjs'),
);

for (const file of srcFiles) {
  const rel = relative(repoRoot, file);
  const content = readFileSync(file, 'utf8');

  check(!content.includes('<html'), `[Unexpected HTML] ${rel} must not include inline HTML markup.`);
  check(!content.includes('<style'), `[Unexpected inline styles] ${rel} must not include inline <style> markup.`);
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
