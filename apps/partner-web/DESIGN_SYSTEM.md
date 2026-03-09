# Partner Web Design System

This document is the source of truth for the portal visual language and typography.

## Non-Negotiable Rule
- Any UI change must follow this file and `src/styles/design-system.css` exactly.
- If a proposed design conflicts with this system, update this document first, then implement code.
- Do not introduce one-off styles that bypass system tokens/classes.

## Required Pre-Change Checklist
- Confirm no new color values are added outside approved palette.
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

## Color Palette Rules (Strict)
Use only the colors below. Do not add new hex/rgb values.

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

## Typography Discipline
- Do not swap in Inter, Space Grotesk, Clash Display, Neue Haas, Helvetica Neue, or decorative ligature-heavy editorial fonts.
- Keep the three-font system stable: Syne for power, DM Mono for truth, DM Sans for clarity.

## Optional Paid Upgrade
- If moving to paid fonts later, `Sohne` can replace `DM Sans` for UI/body.
- Free-font stack remains the default production choice.

## Canonical Files
- Tokens and primitives: `src/styles/design-system.css`
- Reference usage: `src/pages/index.astro`
