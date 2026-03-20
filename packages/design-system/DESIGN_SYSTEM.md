# Ramp2Swap Shared Design System

This package is the reusable high-level visual system for Ramp2Swap web surfaces.

## Non-Negotiable Rule
- Any shared UI change must follow this file and `src/styles/foundation.css`.
- Only cross-app design language belongs here: tokens, typography, glass, branding, and reusable primitives.
- Product-specific shells and flows must stay in the owning app.

## Scope
This shared package owns:
- color palette tokens
- typography scale and font system
- shared spacing, cards, tables, chips, buttons, inputs, and status primitives
- ambient background and glass tiers
- logo system and responsive logo behavior
- reusable high-level layout rules such as `.swap-layout`

This shared package does not own:
- partner dashboard shell/sidebar behavior
- partner analytics/settings/login page composition
- app-specific showcase treatments or product workflows

## Color Palette Rules (Strict)
Use only the colors below. Do not add new hex/rgb values outside these approved palette and system-state entries.

### 60% Obsidian
- `#0A0D0F` page canvas and deepest backgrounds
- `#0F1419` elevated surfaces and primary cards
- `#141C24` secondary surfaces and inputs
- `#1E2C3A` borders and separators

### 30% Slate
- `#E8F0F7` primary text and headings
- `#7A98B3` secondary/supporting text
- `#3D5269` muted text, placeholders, disabled text
- `#243040` subtle fills and neutral hover states
- `#C0CDD9` platinum accent for premium tier indicators, enterprise badges, and partner-logo emphasis only

### 10% Mint
- `#00E5A0` primary action, active state, key confirmed callout
- `#00C484` hover/pressed state for mint actions
- `rgba(0,229,160,0.12)` mint-tint background for mint labels
- `rgba(0,229,160,0.06)` ultra subtle mint wash

### Platinum Usage Rule
- Platinum is a premium/status accent, not an action color.
- Use it sparingly for rare hierarchy signals:
  - premium tier indicators
  - enterprise badges
  - partner-logo emphasis
- Never use platinum for primary CTAs, active controls, or transactional confirmation states.
- Mint remains the only action accent in the system.

### Approved Glass Extension Tokens
- `rgba(255,255,255,0.06)` glass top edge / nav border
- `rgba(255,255,255,0.07)` tier-1 glass border
- `rgba(255,255,255,0.08)` tier-2 inset light edge
- `rgba(255,255,255,0.10)` tier-2 border / tier-3 inset edge
- `rgba(255,255,255,0.12)` tier-3 border
- `rgba(255,255,255,0.14)` hover border on interactive glass
- `rgba(0,120,255,0.07)` ambient blue orb

### Approved System State Colors
- `#F59E0B` amber: pending and warning states only
- `#EF4444` red: error and failed states only

## Logo System (Strict)
Two approved reusable variants:
- Logomark: square mint mark only
- Horizontal logo: logomark + `ramp2swap` wordmark

### Placement + sizing rules by surface
Desktop (1280+):
- Navbar: horizontal logo, mark `32px` / wordmark `20px`, left aligned, `48px` from left edge
- Footer: horizontal logo, mark `28px` / wordmark `17px`, left aligned
- Splash/loading: logomark only, `48px`, centered
- Favicon: logomark only, `32x32` + `16x16`

Tablet (768-1279):
- Navbar: horizontal logo, mark `28px` / wordmark `18px`, left aligned, `32px` from edge
- Footer: horizontal logo, mark `24px` / wordmark `15px`

Mobile (<768):
- Navbar: logomark only, `32px`, left aligned, `20px` from edge
- Footer: horizontal logo, mark `24px` / wordmark `14px`, centered
- Splash/loading: logomark only, `44px`, centered
- Embedded widget: horizontal logo, mark `20px` / wordmark `12px`, bottom-centered

### Clearspace rule
- Minimum clearspace on all sides = current mark height.
- Mobile nav exception: `20px` edge padding is the enforced boundary.

### Non-negotiable logo constraints
- Never stretch or recolor logos.
- Approved polarity only:
  - mint on obsidian
  - obsidian on mint
- Never use wordmark without mark, except mark-only contexts:
  - favicon
  - splash/loading
  - mobile nav

### Shared CSS implementation classes
- Containers: `.brand-nav`, `.brand-footer`, `.brand-splash`, `.brand-auth`, `.brand-widget`
- Assets: `.logo-horizontal`, `.logo-mark`
- Context sizes: `.logo-nav-horizontal`, `.logo-footer-horizontal`, `.logo-widget-horizontal`, `.logo-mark-nav`, `.logo-mark-splash`, `.logo-mark-auth`
- Visibility helpers: `.mobile-nav-horizontal-only`, `.mobile-nav-mark-only`
- Clearspace helpers: `.logo-clearspace-32`, `.logo-clearspace-28`, `.logo-clearspace-24`, `.logo-clearspace-20`

## Glassmorphism System (Strict)
Glass requires a vivid background. Ambient orbs are structural, not decorative.

### Ambient Layer
- mint orb: `700x700`, `rgba(0,229,160,0.12)`, blur `80px`
- blue orb: `500x500`, `rgba(0,120,255,0.07)`, blur `100px`
- deep mint orb: `300x300`, `rgba(0,229,160,0.04)`, blur `60px`

Classes:
- `.ambient-layer`
- `.ambient-orb--mint-top`
- `.ambient-orb--blue-bottom`
- `.ambient-orb--mint-center`
- `.content-layer`

### Glass Elevation Tiers
- Tier 1 `.glass-tier-1`: `rgba(15,20,25,0.55)`, blur `20px`, saturate `140%`
- Tier 2 `.glass-tier-2`: `rgba(15,20,25,0.72)`, blur `40px`, saturate `160%`
- Tier 3 `.glass-tier-3`: `rgba(20,28,36,0.85)`, blur `60px`, saturate `180%`
- Tier 4 `.glass-tier-4-nav`: `rgba(10,13,15,0.70)`, blur `20px`, saturate `120%`

### Mint Glass Variant
Use `.glass-mint` for action surfaces only.

### Interactive Glass States
- `.glass-interactive:hover`
- `.input-glass:focus-visible`
- `.btn-glass:active`
- `.on-glass` type adjustments

### Responsive Blur Performance Rules
- Desktop: Tier1 `20px`, Tier2 `40px`, Tier3 `60px`, Nav `20px`
- Tablet: Tier1 `16px`, Tier2 `32px`, Tier3 `48px`, Nav `16px`
- Mobile: Tier1 `12px`, Tier2 `24px`, Tier3 `36px`, Nav `12px`

## Typography System
- Display/Headings: `Syne`
- Data/Monospace: `DM Mono`
- Body/UI: `DM Sans`

## Responsive Type Scale
### Display
- Hero title: desktop `76px`, tablet `52px`, mobile `36px`
- Section title: desktop `56px`, tablet `40px`, mobile `28px`
- Card heading: desktop `18px`, tablet `17px`, mobile `16px`

### Data
- Data large: desktop `26px`, tablet `22px`, mobile `20px`
- Data small: desktop/tablet `12px`, mobile `11px`

### UI Label
- Desktop `13px`, tablet `12px`, mobile `11px`

### Body
- Body: desktop `16px/300`, tablet `15px/300`, mobile `15px/400`
- Body small: desktop `14px/300`, tablet `13px/300`, mobile `13px/400`

### Interactive
- Button: desktop `15px`, tablet `14px`, mobile `15px`

## Shared Layout Rules
- `.swap-layout` is two-column on desktop/tablet and stacked on mobile.
- `.swap-amount-input` remains `26px / Syne 700` on all breakpoints.
- Shared cards, tables, chips, progress, and metric primitives live in `foundation.css`.

## Extending In Apps
- Import the shared foundation first.
- Add app-specific shells and flows in the app-local stylesheet afterward.
- If a rule could be reused by another app, move it here instead of duplicating it.

## Canonical Files
- Shared CSS: `packages/design-system/src/styles/foundation.css`
- Shared docs: `packages/design-system/DESIGN_SYSTEM.md`
