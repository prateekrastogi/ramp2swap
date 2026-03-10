# Partner Web Design System

This document is the source of truth for the portal visual language and typography.

## Non-Negotiable Rule
- Any UI change must follow this file and `src/styles/design-system.css` exactly.
- If a proposed design conflicts with this system, update this document first, then implement code.
- Do not introduce one-off styles that bypass system tokens/classes.

## Required Pre-Change Checklist
- Confirm no new color values are added outside approved palette and approved glass tokens.
- Confirm no new font families or font weights outside system scale.
- Confirm responsive typography matches desktop/tablet/mobile rules in this document.
- Confirm mint usage remains accent-only and limited per section.
- Confirm swap widget rules remain intact:
  - `.swap-layout` stacks on mobile.
  - `.swap-amount-input` stays `26px / Syne 700` on all breakpoints.
- Run `npm run build --workspace apps/partner-web` after UI changes.

## Change Protocol (Every Time)
1. Update or reuse existing design-system class/tokens in `src/styles/design-system.css`.
2. Apply those classes in page/component markup (avoid inline styling unless unavoidable).
3. Re-check this document section-by-section before finalizing.
4. Build and verify no regressions.
5. If system changes are intentional, update both:
   - `src/styles/design-system.css`
   - `DESIGN_SYSTEM.md`

## Automated Guardrails (Enforced)
- Local validation command:
  - `npm run check:design-system --workspace apps/partner-web`
- CI enforcement:
  - `.github/workflows/deploy-partner-web.yml` runs the same check before deploy.
- Build and deploy are guarded:
  - `apps/partner-web/package.json` runs `check:design-system` before `build` and `deploy`.
- Validation blocks:
  - raw color literals outside `src/styles/design-system.css`
  - forbidden font families (Inter, Space Grotesk, Clash Display, Neue Haas, Helvetica Neue)
  - missing required design-system sections/classes
  - missing page-level import of `src/styles/design-system.css`

## Color Palette Rules (Strict)
Use only the colors below. Do not add new hex/rgb values outside these approved palette and system-state entries.

### 60% Obsidian (base and spatial hierarchy)
- `#0A0D0F` page canvas and deepest backgrounds
- `#0F1419` elevated surfaces and primary cards
- `#141C24` secondary surfaces and inputs
- `#1E2C3A` borders and separators

### 30% Slate (typography and communication)
- `#E8F0F7` primary text and headings
- `#7A98B3` secondary/supporting text
- `#3D5269` muted text, placeholders, disabled text
- `#243040` subtle fills and neutral hover states

### 10% Mint (actions and signal)
- `#00E5A0` primary action, active state, key confirmed callout
- `#00C484` hover/pressed state for mint actions
- `rgba(0,229,160,0.12)` mint-tint background for mint labels
- `rgba(0,229,160,0.06)` ultra subtle mint wash

### Approved Glass Extension Tokens
- `rgba(255,255,255,0.06)` glass top edge / nav border
- `rgba(255,255,255,0.07)` tier-1 glass border
- `rgba(255,255,255,0.08)` tier-2 inset light edge
- `rgba(255,255,255,0.10)` tier-2 border / tier-3 inset edge
- `rgba(255,255,255,0.12)` tier-3 border
- `rgba(255,255,255,0.14)` hover border on interactive glass
- `rgba(0,120,255,0.07)` ambient blue orb (background only)

### Approved System State Colors
These are system colors, not brand colors. They appear only when the UI needs to communicate state and must never be used decoratively.

- `#F59E0B` amber: pending transactions and warnings only
- `#EF4444` red: errors and failed states only

Usage rule:
- Keep these limited to status chips, warnings, validation, and failure indicators.
- Do not use amber/red for navigation, decorative highlights, card accents, or marketing emphasis.

## Logo System (Strict)
Two approved logo variants:
- Logomark: square mint mark only
- Horizontal logo: logomark + `ramp2swap` wordmark

### Placement + sizing rules by surface

Desktop (1280+):
- Navbar: horizontal logo, mark `32px` / wordmark `20px`, left aligned, `48px` from left edge
- Footer: horizontal logo, mark `28px` / wordmark `17px`, left aligned, first footer element, opacity `100%`
- Splash/loading: logomark only, `48px`, centered both axes, subtle pulse
- Favicon: logomark only, `32x32` + `16x16`, obsidian background + mint mark

Tablet (768–1279):
- Navbar: horizontal logo, mark `28px` / wordmark `18px`, left aligned, `32px` from edge
- Footer: horizontal logo, mark `24px` / wordmark `15px`, top-left before footer columns
- Auth/onboarding: logomark only, `40px`, top-center, `32px` from top

Mobile (<768):
- Navbar: logomark only, `32px`, left aligned, `20px` from edge
- Footer: horizontal logo, mark `24px` / wordmark `14px`, centered
- Splash/loading: logomark only, `44px`, centered
- Embedded widget: horizontal logo, mark `20px` / wordmark `12px`, bottom-centered, opacity `60%` with “Powered by ramp2swap”

### Sizing reference matrix
- Desktop nav: mark `32px`, wordmark `20px`, total `~140px`
- Tablet nav: mark `28px`, wordmark `18px`, total `~125px`
- Mobile nav: mark `32px`, total `32px`
- Desktop footer: mark `28px`, wordmark `17px`, total `~120px`
- Tablet footer: mark `24px`, wordmark `15px`, total `~105px`
- Mobile footer: mark `24px`, wordmark `14px`, total `~100px`
- Widget: mark `20px`, wordmark `12px`, total `~88px`
- Favicon: mark `32px`
- Splash: mark `48px` desktop/tablet, `44px` mobile

### Clearspace rule
- Minimum clearspace on all sides = current mark height.
- If mark is `32px`, no element gets closer than `32px`.
- Mobile nav exception behavior: `20px` edge padding is the enforced clearspace boundary; do not reduce it further.

### Non-negotiable logo constraints
- Never stretch or recolor logos.
- Approved polarity only:
  - mint on obsidian
  - obsidian on mint (reversed, light background only)
- Never use wordmark without mark, except mark-only contexts:
  - favicon
  - splash/loading
  - mobile nav
- Mobile nav must be mark-only.

### CSS implementation classes
- Containers: `.brand-nav`, `.brand-footer`, `.brand-splash`, `.brand-auth`, `.brand-widget`
- Assets: `.logo-horizontal`, `.logo-mark`
- Context sizes: `.logo-nav-horizontal`, `.logo-footer-horizontal`, `.logo-widget-horizontal`, `.logo-mark-nav`, `.logo-mark-splash`, `.logo-mark-auth`
- Visibility helpers: `.mobile-nav-horizontal-only`, `.mobile-nav-mark-only`
- Clearspace helpers: `.logo-clearspace-32`, `.logo-clearspace-28`, `.logo-clearspace-24`, `.logo-clearspace-20`

## Glassmorphism System (Strict)
Glass requires a vivid background. Ambient orbs are mandatory and load-bearing, not decorative.

### Ambient Layer (Non-Negotiable)
Use persistent fixed orbs behind all glass surfaces:
- Orb 1 mint (top-right): `700x700`, `rgba(0,229,160,0.12)` radial, blur `80px`
- Orb 2 blue (bottom-left): `500x500`, `rgba(0,120,255,0.07)` radial, blur `100px`
- Orb 3 deep mint (center): `300x300`, `rgba(0,229,160,0.04)` radial, blur `60px`

Classes:
- `.ambient-layer`
- `.ambient-orb--mint-top`
- `.ambient-orb--blue-bottom`
- `.ambient-orb--mint-center`
- `.content-layer` (keeps UI above ambient layer)

### Glass Elevation Tiers
- Tier 1 `.glass-tier-1` (cards/panels): `rgba(15,20,25,0.55)`, blur `20px`, saturate `140%`
- Tier 2 `.glass-tier-2` (modals/swap widget): `rgba(15,20,25,0.72)`, blur `40px`, saturate `160%`
- Tier 3 `.glass-tier-3` (dropdowns/tooltips): `rgba(20,28,36,0.85)`, blur `60px`, saturate `180%`
- Tier 4 `.glass-tier-4-nav` (fixed nav only): `rgba(10,13,15,0.70)`, blur `20px`, saturate `120%`

Premium detail:
- All glass tiers keep inner top-edge light via inset shadow.

### Mint Glass Variant
Use `.glass-mint` for action surfaces only (swap widget, confirmation panels):
- Background `rgba(0,229,160,0.04)`
- Border `rgba(0,229,160,0.15)`
- Blur `40px`, saturate `160%`
- Includes top edge highlight (`::before`) with mint gradient.

### Interactive Glass States
- Hover `.glass-interactive:hover`:
  - opacity shift (+0.08 via per-tier hover background)
  - border `rgba(255,255,255,0.14)`
  - mint edge ring `rgba(0,229,160,0.1)`
  - transition `all 0.25s ease`
- Focus `.input-glass:focus-visible`:
  - border `rgba(0,229,160,0.35)`
  - ring `0 0 0 3px rgba(0,229,160,0.08)`
  - inset `rgba(0,229,160,0.06)`
  - blur `40px`, saturate `180%`
- Active `.btn-glass:active`:
  - background `rgba(0,229,160,0.85)`
  - `transform: translateY(1px)`
  - reduced shadow

### Responsive Blur Performance Rules
- Desktop (1280+): Tier1 `20px`, Tier2 `40px`, Tier3 `60px`, Nav `20px`
- Tablet (768–1279): Tier1 `16px`, Tier2 `32px`, Tier3 `48px`, Nav `16px`
- Mobile (<768): Tier1 `12px`, Tier2 `24px`, Tier3 `36px`, Nav `12px`

### Saturate Mapping Rule
- `blur(12px) -> saturate(120%)`
- `blur(20px) -> saturate(140%)`
- `blur(40px) -> saturate(160%)`
- `blur(60px) -> saturate(180%)`

### Typography on Glass
- On glass surfaces, body weight is increased for legibility:
  - `DM Sans 300 -> 400`
  - `DM Sans 400 -> 500`
- Heading tracking is loosened on glass:
  - hero: `-2px -> -1.5px`
  - section: `-1.5px -> -1px`
- Never use text-shadow on glass.
- Use `.on-glass` container class to apply these adjustments.

## Typography System (Free Fonts)
- Display/Headings: `Syne`
- Data/Monospace: `DM Mono`
- Body/UI: `DM Sans`

## Responsive Type Scale

### Display
- Hero title
  Desktop: `76px / Syne 800 / -2px`
  Tablet: `52px / Syne 800 / -1.5px`
  Mobile: `36px / Syne 800 / -1px`
- Section title
  Desktop: `56px / Syne 800 / -1.5px`
  Tablet: `40px / Syne 800 / -1px`
  Mobile: `28px / Syne 800 / -0.5px`
- Card heading
  Desktop: `18px / Syne 700 / -0.3px`
  Tablet: `17px / Syne 700 / -0.3px`
  Mobile: `16px / Syne 700 / -0.2px`

### Data
- Data large
  Desktop: `26px / DM Mono 500 / -0.5px`
  Tablet: `22px / DM Mono 500 / -0.3px`
  Mobile: `20px / DM Mono 500 / -0.2px`
- Data small
  Desktop: `12px / DM Mono 400 / +0.04em`
  Tablet: `12px / DM Mono 400 / +0.04em`
  Mobile: `11px / DM Mono 400 / +0.04em`

### UI Label
- Desktop: `13px / DM Mono 400 / +0.08em / uppercase`
- Tablet: `12px / DM Mono 400 / +0.08em / uppercase`
- Mobile: `11px / DM Mono 400 / +0.08em / uppercase`

### Body
- Body
  Desktop: `16px / DM Sans 300 / 1.7`
  Tablet: `15px / DM Sans 300 / 1.7`
  Mobile: `15px / DM Sans 400 / 1.75`
- Body small
  Desktop: `14px / DM Sans 300 / 1.65`
  Tablet: `13px / DM Sans 300 / 1.65`
  Mobile: `13px / DM Sans 400 / 1.7`

### Interactive
- Button
  Desktop: `15px / DM Sans 500 / -0.01em`
  Tablet: `14px / DM Sans 500 / -0.01em`
  Mobile: `15px / DM Sans 500 / 0`

## Implementation Strategy
- Display tiers (`.heading-hero`, `.heading-section`, `.heading-card`) use fluid `clamp()` to avoid visual jumps.
- Body/data tiers use hard breakpoints for predictable readability.
- Mobile body weight increases from `300` to `400` by design.
- Button text stays `15px` on mobile for action confidence.
- Mobile heading tracking is looser to avoid cramped glyph collisions.

## Layout Rule for Swap UI
- Desktop/tablet: two-column layout for hero copy + widget (`.swap-layout`).
- Mobile: stacked layout (`.swap-layout` becomes one column).
- Critical interaction: `.swap-amount-input` remains `26px / Syne 700` on all breakpoints.

## Usage Discipline
- Mint is an accent layer, not a base layer.
- Never use mint for long body text.
- Never make mint the dominant background of a section.
- Prefer one mint-emphasis element per section.
- Do not apply one uniform glass style to every surface. Use tiered elevation classes.
- Do not break logo context rules across breakpoints.

## Typography Discipline
- Do not swap in Inter, Space Grotesk, Clash Display, Neue Haas, Helvetica Neue, or decorative ligature-heavy editorial fonts.
- Keep the three-font system stable: Syne for power, DM Mono for truth, DM Sans for clarity.

## Optional Paid Upgrade
- If moving to paid fonts later, `Sohne` can replace `DM Sans` for UI/body.
- Free-font stack remains the default production choice.

## Canonical Files
- Tokens and primitives: `src/styles/design-system.css`
- Live dashboard usage: `src/pages/index.astro`
