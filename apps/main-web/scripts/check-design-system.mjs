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
const lifiConfigFile = join(srcRoot, 'lib', 'lifi-config.ts');
const publicAppConfigFile = join(srcRoot, 'lib', 'public-app-config.ts');

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
  if (!condition) failures.push(message);
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

const homePage = join(srcRoot, 'pages', 'index.astro');
const homeContent = readFileSync(homePage, 'utf8');
check(
  homeContent.includes('/Horizontal_Logo.svg'),
  `[Logo system] ${relative(root, homePage)} must use the main-web horizontal logo asset (/Horizontal_Logo.svg)`
);
check(
  homeContent.includes('/Ramp2Swap.svg'),
  `[Brand asset] ${relative(root, homePage)} must use /Ramp2Swap.svg for the favicon and mobile mark`
);
check(
  homeContent.includes('Connect Wallet'),
  `[Header CTA] ${relative(root, homePage)} must include the Connect Wallet primary action`
);
check(
  homeContent.includes('lifi-widget-root'),
  `[Widget mount] ${relative(root, homePage)} must include the LI.FI widget SSR mount`
);
check(
  homeContent.includes('conversation-upload-input') &&
    homeContent.includes('conversation-stage') &&
    homeContent.includes('conversation-stage-submit') &&
    homeContent.includes('Intent AI') &&
    homeContent.includes('Describe Your Swap...') &&
    homeContent.includes('/White_Ramp2Swap.svg'),
  `[Conversation stage] ${relative(root, homePage)} must include the main-web conversation upload composer below the widget`
);
check(
  !homeContent.includes('Upload</span>') && !homeContent.includes('Upload Conversation To AI'),
  `[Conversation stage] ${relative(root, homePage)} must not revert to the old upload-label CTA treatment`
);
check(
  !homeContent.includes('Sticky header scroll preview') &&
    !homeContent.includes('Sample Metrics') &&
    !homeContent.includes('Long-form layout blocks'),
  `[Homepage cleanup] ${relative(root, homePage)} must remove the old placeholder and scroll-demo sections`
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
const allowedLiFiHexColors = new Set([
  '#00E5A0',
  '#7A98B3',
  '#0F1419',
  '#141C24',
  '#E8F0F7',
  '#243040',
  '#1E2C3A',
  '#3D5269',
  '#0A0D0F',
  '#C0CDD9',
]);
const allowedLiFiRgbValues = new Set([
  'rgba(255, 255, 255, 0.10)',
  'rgba(0, 0, 0, 0.42)',
  'rgba(255, 255, 255, 0.08)',
  'rgba(15, 20, 25, 0.82)',
  'rgba(255, 255, 255, 0.06)',
  'rgba(20, 28, 36, 0.86)',
  'rgba(255, 255, 255, 0.07)',
  'rgba(0, 0, 0, 0.28)',
  'rgba(0, 0, 0, 0.26)',
  'rgba(0, 229, 160, 0.12)',
  'rgba(0, 229, 160, 0.06)',
  'rgba(0, 229, 160, 0.15)',
  'rgba(192, 205, 217, 0.18)',
]);

for (const file of srcFiles) {
  const rel = relative(root, file);
  const content = readFileSync(file, 'utf8');

  for (const fontPattern of forbiddenFonts) {
    check(!fontPattern.test(content), `[Forbidden font] ${rel} contains disallowed font pattern: ${fontPattern}`);
  }

  if (file === lifiConfigFile) {
    const hexMatches = content.match(colorHexRegex) ?? [];
    const rgbaMatches = content.match(rgbaRegex) ?? [];
    const disallowedHexMatches = hexMatches.filter((match) => !allowedLiFiHexColors.has(match));
    const disallowedRgbMatches = rgbaMatches.filter((match) => !allowedLiFiRgbValues.has(match));
    check(
      disallowedHexMatches.length === 0,
      `[Widget color drift] ${rel} contains disallowed hex colors: ${disallowedHexMatches.join(', ')}`
    );
    check(
      disallowedRgbMatches.length === 0,
      `[Widget color drift] ${rel} contains disallowed rgb/rgba colors: ${disallowedRgbMatches.join(', ')}`
    );
  } else if (file !== localCssFile && file !== sharedCssFile) {
    const hexMatches = content.match(colorHexRegex) ?? [];
    const rgbaMatches = content.match(rgbaRegex) ?? [];
    check(hexMatches.length === 0, `[Raw color] ${rel} contains raw hex colors: ${hexMatches.join(', ')}`);
    check(rgbaMatches.length === 0, `[Raw color] ${rel} contains raw rgb/rgba colors: ${rgbaMatches.join(', ')}`);
  }
}

const lifiConfig = readFileSync(lifiConfigFile, 'utf8');
const publicAppConfig = readFileSync(publicAppConfigFile, 'utf8');
check(
  lifiConfig.includes("appearance: 'dark'"),
  '[Widget theme] apps/main-web/src/lib/lifi-config.ts must keep the widget in dark appearance mode'
);
check(
  lifiConfig.includes("integrator = 'ramp2swap'"),
  '[Widget config] apps/main-web/src/lib/lifi-config.ts must use the shared ramp2swap integrator name'
);
check(
  lifiConfig.includes('fee: 0.005'),
  '[Widget fee] apps/main-web/src/lib/lifi-config.ts must keep the LI.FI integrator fee set to 0.5% (0.005)'
);
check(
  lifiConfig.includes('sdkConfig: {') &&
    lifiConfig.includes('rpcUrls,') &&
    lifiConfig.includes('ChainId.ETH') &&
    lifiConfig.includes('ChainId.ARB') &&
    lifiConfig.includes('ChainId.OPT') &&
    lifiConfig.includes('ChainId.BAS') &&
    lifiConfig.includes('ChainId.POL') &&
    lifiConfig.includes('ChainId.SOL'),
  '[Widget RPC config] apps/main-web/src/lib/lifi-config.ts must keep the six-chain private RPC scaffold for ETH, ARB, OPT, BASE, POL, and SOL'
);
check(
  publicAppConfig.includes("appName: 'Ramp2Swap'") &&
    publicAppConfig.includes("appDescription: 'One Interface. All of DeFi.'") &&
    publicAppConfig.includes("appUrl: 'https://ramp2swap.com'") &&
    publicAppConfig.includes("appIconPath: '/logo.png'") &&
    publicAppConfig.includes("walletConnectProjectId: '5432e3507d41270bee46b7b85bbc2ef8'") &&
    lifiConfig.includes('icons: [appIconUrl]'),
  '[WalletConnect metadata] apps/main-web/src/lib/public-app-config.ts and apps/main-web/src/lib/lifi-config.ts must define the approved Ramp2Swap wallet metadata for wallet apps'
);
check(
  publicAppConfig.includes('alchemyRpcUrls: {') &&
    publicAppConfig.includes('ethereum:') &&
    publicAppConfig.includes('arbitrum:') &&
    publicAppConfig.includes('optimism:') &&
    publicAppConfig.includes('base:') &&
    publicAppConfig.includes('polygon:') &&
    publicAppConfig.includes('solana:'),
  '[Public app config] apps/main-web/src/lib/public-app-config.ts must keep a unified six-chain Alchemy RPC config scaffold'
);
check(
  lifiConfig.includes("variant: 'compact'"),
  '[Widget config] apps/main-web/src/lib/lifi-config.ts must keep the widget in compact variant mode'
);
check(
  lifiConfig.includes("hiddenUI: ['appearance', 'poweredBy']"),
  '[Widget config] apps/main-web/src/lib/lifi-config.ts must hide appearance switching and the powered-by footer'
);
check(
  lifiConfig.includes("connectWallet: 'Connect Wallet'"),
  '[Widget copy] apps/main-web/src/lib/lifi-config.ts must preserve the Connect Wallet label casing'
);
check(
  lifiConfig.includes("main: '#00E5A0'"),
  '[Widget action color] apps/main-web/src/lib/lifi-config.ts must keep mint as the widget primary action color'
);
check(
  lifiConfig.includes("backgroundColor: 'rgba(15, 20, 25, 0.82)'"),
  '[Widget glass] apps/main-web/src/lib/lifi-config.ts must keep the approved obsidian glass container background'
);
check(
  lifiConfig.includes("color: '#C0CDD9'"),
  '[Widget premium accent] apps/main-web/src/lib/lifi-config.ts must use platinum for the widget header wallet text/icon treatment'
);
check(
  !lifiConfig.includes("contained: {\n                background: '#C0CDD9'") &&
    !lifiConfig.includes("contained: {\r\n                background: '#C0CDD9'"),
  '[Widget premium accent] Platinum must not replace the mint contained CTA background in apps/main-web/src/lib/lifi-config.ts'
);

const sharedCss = readFileSync(sharedCssFile, 'utf8');
const localCss = readFileSync(localCssFile, 'utf8');
const combinedCss = `${sharedCss}\n${localCss}`;

check(
  localCss.includes('@import "../../../../packages/design-system/src/styles/foundation.css";'),
  '[Missing shared import] apps/main-web/src/styles/design-system.css must import the shared foundation from packages/design-system'
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
  '.brand-nav',
  '.logo-nav-horizontal',
  '.logo-mark-nav',
  '.mobile-nav-mark-only',
  '.mobile-nav-horizontal-only',
]) {
  check(combinedCss.includes(requiredClass), `[Missing rule] design system CSS must include ${requiredClass}`);
}

for (const requiredLocalClass of [
  '.main-header',
  '.main-header-brand',
  '.main-header-cta',
  '.widget-stage',
  '.widget-stage-shell',
  '.widget-stage-frame',
  '.conversation-stage-frame',
  '.conversation-stage',
  '.conversation-stage-input-shell',
  '.conversation-stage-label',
  '.conversation-stage-input',
  '.conversation-stage-submit',
  '.conversation-stage-submit-icon',
]) {
  check(localCss.includes(requiredLocalClass), `[Missing main-web rule] design-system.css must include ${requiredLocalClass}`);
}

check(
  localCss.includes('width: 48px;') &&
    localCss.includes('height: 48px;') &&
    localCss.includes('width: 44px;') &&
    localCss.includes('height: 44px;'),
  '[Conversation action size] apps/main-web/src/styles/design-system.css must keep the composer action at 48px on tablet/desktop and 44px on mobile'
);
check(
  localCss.includes('width: 20px;') &&
    localCss.includes('height: 20px;') &&
    localCss.includes('width: 18px;') &&
    localCss.includes('height: 18px;'),
  '[Conversation icon size] apps/main-web/src/styles/design-system.css must keep the White Ramp2Swap icon sized for desktop/tablet and mobile'
);
check(
  localCss.includes('font-size: 24px !important;') && localCss.includes('font-size: 20px !important;'),
  '[Conversation heading] apps/main-web/src/styles/design-system.css must keep Intent AI aligned with the widget title scale across breakpoints'
);
check(
  localCss.includes('font-size: 18px;') && localCss.includes('font-size: 16px;') && localCss.includes('font-weight: 500;'),
  '[Conversation input type] apps/main-web/src/styles/design-system.css must keep the composer text aligned with the widget field typography'
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
  '## Main Web Layer',
  '## Header Experience',
  '## Widget Stage',
  '## Conversation Stage',
  '## Brand Assets And Favicon',
]) {
  check(localDocs.includes(requiredLocalDocSection), `[Missing main-web docs section] apps/main-web/DESIGN_SYSTEM.md must include: ${requiredLocalDocSection}`);
}
check(
  localDocs.includes('Intent AI') &&
    localDocs.includes('Describe Your Swap...') &&
    localDocs.includes('/White_Ramp2Swap.svg'),
  '[Main-web docs] apps/main-web/DESIGN_SYSTEM.md must document the approved conversation stage copy and icon asset'
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
