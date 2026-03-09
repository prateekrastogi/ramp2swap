import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const webRoot = join(scriptDir, '..');
const root = join(webRoot, '..', '..');
const srcRoot = join(webRoot, 'src');
const cssFile = join(srcRoot, 'styles/design-system.css');
const docsFile = join(webRoot, 'DESIGN_SYSTEM.md');

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

function addFailure(message) {
  failures.push(message);
}

function check(condition, message) {
  if (!condition) addFailure(message);
}

const srcFiles = walk(srcRoot).filter((file) => {
  return file.endsWith('.astro') || file.endsWith('.css') || file.endsWith('.ts') || file.endsWith('.tsx');
});

const pageFiles = walk(join(srcRoot, 'pages')).filter((file) => file.endsWith('.astro'));
for (const pageFile of pageFiles) {
  const content = readFileSync(pageFile, 'utf8');
  check(
    content.includes("design-system.css"),
    `[Missing import] ${relative(root, pageFile)} must import src/styles/design-system.css`
  );
}

const forbiddenFonts = [
  /(^|[^a-z])Inter([^a-z]|$)/i,
  /Space\s+Grotesk/i,
  /Clash\s+Display/i,
  /Neue\s+Haas/i,
  /Helvetica\s+Neue/i,
];

const colorHexRegex = /#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g;
const rgbaRegex = /rgba?\([^\)]*\)/g;

for (const file of srcFiles) {
  const rel = relative(root, file);
  const content = readFileSync(file, 'utf8');

  for (const fontPattern of forbiddenFonts) {
    check(!fontPattern.test(content), `[Forbidden font] ${rel} contains disallowed font pattern: ${fontPattern}`);
  }

  // Only design-system.css may define raw colors; usage files must rely on tokens/classes.
  if (file !== cssFile) {
    const hexMatches = content.match(colorHexRegex) ?? [];
    const rgbaMatches = content.match(rgbaRegex) ?? [];
    check(hexMatches.length === 0, `[Raw color] ${rel} contains raw hex colors: ${hexMatches.join(', ')}`);
    check(rgbaMatches.length === 0, `[Raw color] ${rel} contains raw rgb/rgba colors: ${rgbaMatches.join(', ')}`);
  }
}

const css = readFileSync(cssFile, 'utf8');
for (const requiredClass of [
  '.glass-tier-1',
  '.glass-tier-2',
  '.glass-tier-3',
  '.glass-tier-4-nav',
  '.glass-mint',
  '.ambient-layer',
  '.ambient-orb--mint-top',
  '.ambient-orb--blue-bottom',
  '.ambient-orb--mint-center',
  '.swap-layout',
  '.swap-amount-input',
  '.on-glass .body',
  '.brand-nav',
  '.brand-footer',
  '.brand-splash',
  '.brand-widget',
  '.logo-nav-horizontal',
  '.logo-footer-horizontal',
  '.logo-mark-nav',
  '.mobile-nav-mark-only',
  '.mobile-nav-horizontal-only',
]) {
  check(css.includes(requiredClass), `[Missing rule] design-system.css must include ${requiredClass}`);
}

const docs = readFileSync(docsFile, 'utf8');
for (const requiredDocSection of [
  '## Non-Negotiable Rule',
  '## Required Pre-Change Checklist',
  '## Change Protocol (Every Time)',
  '## Logo System (Strict)',
  '## Glassmorphism System (Strict)',
  '## Responsive Type Scale',
]) {
  check(docs.includes(requiredDocSection), `[Missing docs section] DESIGN_SYSTEM.md must include: ${requiredDocSection}`);
}

if (failures.length > 0) {
  console.error('\nDesign system guardrails failed:\n');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  console.error('\nFix the issues above before shipping UI changes.');
  process.exit(1);
}

console.log('Design system guardrails passed.');
