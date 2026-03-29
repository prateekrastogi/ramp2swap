import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const webRoot = join(scriptDir, '..');
const root = join(webRoot, '..', '..');
const packagesRoot = join(root, 'packages', 'design-system');
const srcRoot = join(webRoot, 'src');
const localCssFile = join(srcRoot, 'styles', 'design-system.css');
const sharedCssFile = join(packagesRoot, 'src', 'styles', 'foundation.css');
const localDocsFile = join(webRoot, 'DESIGN_SYSTEM.md');
const sharedDocsFile = join(packagesRoot, 'DESIGN_SYSTEM.md');

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

const loginPage = join(srcRoot, 'pages', 'login.astro');
const loginContent = readFileSync(loginPage, 'utf8');
check(
  loginContent.includes('/logo_verticle.png'),
  `[Logo system] ${relative(root, loginPage)} must use the documented auth vertical logo asset (/logo_verticle.png)`
);
check(
  loginContent.includes('/logo.png'),
  `[Brand asset] ${relative(root, loginPage)} must use /logo.png for the shared brand mark`
);
check(
  loginContent.includes('login-showcase-logo'),
  `[Logo system] ${relative(root, loginPage)} must use the documented auth logo class (.login-showcase-logo)`
);

const partnerHomePage = join(srcRoot, 'pages', 'index.astro');
const partnerHomeContent = readFileSync(partnerHomePage, 'utf8');
check(
  partnerHomeContent.includes('/logo.png'),
  `[Brand asset] ${relative(root, partnerHomePage)} must use /logo.png for the shared brand mark`
);
check(
  !partnerHomeContent.includes("settings-mock"),
  `[Settings source] ${relative(root, partnerHomePage)} must not import deprecated settings mock data`
);
check(
  partnerHomeContent.includes('data-profile-name'),
  `[Sidebar identity] ${relative(root, partnerHomePage)} must expose the profile name hook for the seeded identicon`
);
check(
  partnerHomeContent.includes('data-sidebar-avatar'),
  `[Sidebar identity] ${relative(root, partnerHomePage)} must expose the sidebar avatar hook for the seeded identicon`
);
check(
  partnerHomeContent.includes("'/api/setting/wallet-address'"),
  `[Settings persistence] ${relative(root, partnerHomePage)} must persist wallet address edits through the server route`
);

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

  // Only shared/local design system CSS files may define raw colors.
  if (file !== localCssFile && file !== sharedCssFile) {
    const hexMatches = content.match(colorHexRegex) ?? [];
    const rgbaMatches = content.match(rgbaRegex) ?? [];
    check(hexMatches.length === 0, `[Raw color] ${rel} contains raw hex colors: ${hexMatches.join(', ')}`);
    check(rgbaMatches.length === 0, `[Raw color] ${rel} contains raw rgb/rgba colors: ${rgbaMatches.join(', ')}`);
  }
}

const sharedCss = readFileSync(sharedCssFile, 'utf8');
const localCss = readFileSync(localCssFile, 'utf8');
const combinedCss = `${sharedCss}\n${localCss}`;
check(
  localCss.includes('@import "../../../../packages/design-system/src/styles/foundation.css";'),
  '[Missing shared import] apps/partner-web/src/styles/design-system.css must import the shared foundation from packages/design-system'
);
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
  check(combinedCss.includes(requiredClass), `[Missing rule] design system CSS must include ${requiredClass}`);
}

for (const requiredLocalClass of [
  '.dashboard-shell',
  '.sidebar',
  '.sidebar-avatar',
  '.login-showcase-logo',
  '.analytics-grid',
  '.settings-grid',
]) {
  check(localCss.includes(requiredLocalClass), `[Missing partner rule] design-system.css must include ${requiredLocalClass}`);
}

check(
  !localCss.includes('border: 1.5px solid var(--mint-500);'),
  '[Sidebar avatar] partner-web design system must not use the deprecated mint ring avatar border'
);

const sharedDocs = readFileSync(sharedDocsFile, 'utf8');
for (const requiredDocSection of [
  '## Non-Negotiable Rule',
  '## Logo System (Strict)',
  '## Glassmorphism System (Strict)',
  '## Responsive Type Scale',
]) {
  check(sharedDocs.includes(requiredDocSection), `[Missing shared docs section] packages/design-system/DESIGN_SYSTEM.md must include: ${requiredDocSection}`);
}

const localDocs = readFileSync(localDocsFile, 'utf8');
for (const requiredLocalDocSection of [
  '## Relationship To Shared Design System',
  '## Partner Web Layer',
  '## Login Experience',
  '## Dashboard Shell',
  '## Stable Dashboard Cards',
  '## Empty Shell Rules',
  '## Mint Surface Hover Rules',
  '## Tooltip Rules',
]) {
  check(localDocs.includes(requiredLocalDocSection), `[Missing partner docs section] apps/partner-web/DESIGN_SYSTEM.md must include: ${requiredLocalDocSection}`);
}

for (const requiredSharedDocSection of [
  '## Empty Shell Rules',
  '### Interactive Mint Surface Rules',
]) {
  check(sharedDocs.includes(requiredSharedDocSection), `[Missing shared docs section] packages/design-system/DESIGN_SYSTEM.md must include: ${requiredSharedDocSection}`);
}

check(
  partnerHomeContent.includes("fetch(`${partnerApiBaseUrl}/overview`"),
  `[Overview data source] ${relative(root, partnerHomePage)} must load overview metrics from the overview API route`
);
check(
  partnerHomeContent.includes('const overviewMetricShells: OverviewMetricShell[] = ['),
  `[Stable overview shells] ${relative(root, partnerHomePage)} must declare canonical overview card shells for empty-state fallback`
);
check(
  partnerHomeContent.includes('performance-metric-card-empty'),
  `[Stable overview shells] ${relative(root, partnerHomePage)} must preserve the dedicated overview empty-shell layout hook`
);
check(
  !partnerHomeContent.includes('>No data yet<'),
  `[Overview placeholders] ${relative(root, partnerHomePage)} must not use generic "No data yet" placeholders inside overview metric cards`
);
check(
  !partnerHomeContent.includes('performance-metric-value">--'),
  `[Overview placeholders] ${relative(root, partnerHomePage)} must not render "--" as the empty overview metric value placeholder`
);
check(
  partnerHomeContent.includes('glass-tier-2 glass-highlight-soft glass-interactive analytics-top-links-card on-glass'),
  `[Mint analytics shell] ${relative(root, partnerHomePage)} must keep Top Performing Links on the shared mint-highlight shell`
);

for (const requiredLocalCssRule of [
  '.performance-metric-card-empty',
  '.performance-metric-empty-state',
  '.revenue-summary-card.glass-interactive:hover',
  '.link-generator-card.glass-interactive:hover',
  '.performance-metric-card-highlight.glass-interactive:hover',
  '.analytics-top-links-card.glass-interactive:hover',
]) {
  check(localCss.includes(requiredLocalCssRule), `[Mint/empty-state rule] partner-web design-system.css must include ${requiredLocalCssRule}`);
}

check(
  localCss.includes('.analytics-top-links-card::before') &&
    localCss.includes('left: 14%;') &&
    localCss.includes('right: 14%;'),
  '[Mint flare parity] Top Performing Links must preserve the same top flare width as other mint-highlight surfaces'
);

if (failures.length > 0) {
  console.error('\nDesign system guardrails failed:\n');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  console.error('\nFix the issues above before shipping UI changes.');
  process.exit(1);
}

console.log('Design system guardrails passed.');
