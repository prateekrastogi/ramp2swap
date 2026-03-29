# Partner Web Design System

This file is the partner-web addendum to the shared Ramp2Swap design system.

## Relationship To Shared Design System
- High-level Ramp2Swap design language now lives in `packages/design-system`.
- Shared rules and reusable primitives are defined in:
  - `packages/design-system/src/styles/foundation.css`
  - `packages/design-system/DESIGN_SYSTEM.md`
- Partner-web specific rules stay here and in `src/styles/design-system.css`.

## Non-Negotiable Rule
- Any partner-web UI change must follow the shared design system first.
- If a rule is reusable across apps, move it to `packages/design-system` instead of duplicating it here.
- Only partner-web-specific shell, dashboard, login, analytics, and settings behaviors belong in this file.

## Required Pre-Change Checklist
- Confirm shared tokens, glass tiers, logo rules, and typography still come from `packages/design-system`.
- Confirm partner-web additions do not redefine reusable brand primitives locally.
- Confirm responsive partner dashboard and login behavior still matches this document.
- Confirm auth uses the approved vertical logo treatment.
- Run `npm run build --workspace apps/partner-web` after UI changes.

## Change Protocol (Every Time)
1. Update `packages/design-system` first when the change affects shared design language.
2. Update `apps/partner-web/src/styles/design-system.css` only for partner-specific composition and behavior.
3. Update this file when partner-web-only rules change.
4. Re-check both docs before finalizing.
5. Build and verify no regressions.

## Current Doc Corrections
- `.glass-highlight-soft` is a shared Ramp2Swap glass primitive defined in `packages/design-system/src/styles/foundation.css`, not a partner-only variant.
- Partner-web may compose that shared primitive for dashboard emphasis, but must not describe it as app-owned.

## Partner Web Layer
Partner-web owns:
- dashboard shell and sidebar behavior
- login screen layout and showcase treatment
- analytics, earnings, settings, and referral-management composition
- partner-only composition around shared glass primitives

Partner-web does not own:
- global palette tokens
- global typography scale
- shared glass tiers
- shared glass highlight/mint primitives
- reusable logo primitives
- generic cards, tables, chips, buttons, inputs, and status styles

## Login Experience
- Auth/onboarding uses the approved vertical logo asset inside the showcase panel only.
- Implementation stays:
  - `.login-showcase-logo`
  - `/logo_verticle.png`
- Mobile login tiles must remain visually connected as one stacked unit:
  - no gap between showcase and form panels
  - touching corners flatten where the cards meet

## Dashboard Shell
- Desktop uses a persistent left sidebar with a `260px` rail.
- Tablet uses the compressed icon-first sidebar state by default.
- Mobile uses the slide-in sidebar and sticky topbar.
- Dashboard content must keep `min-width: 0` and prevent horizontal overflow inside panels.

## Analytics And Settings
- Analytics and settings layouts may customize composition locally, but should continue using shared primitives for typography, chips, tables, buttons, and form controls.
- Highlighted insight surfaces may use the shared `.glass-highlight-soft` primitive.
- Empty states in analytics, link management, and transaction views must use the shared `.empty-state-copy` utility and shared semantic tokens from `packages/design-system/src/styles/foundation.css`.
- Do not introduce partner-local palette guesses such as undefined `--slate-*` steps for muted text; promote a shared semantic token first if the existing one is insufficient.
- Analytics cards that support time windows must keep range behavior explicit per card and only show blank states when the authenticated partner truly has no data for that surface.
- Tooltip content for analytics comparisons must be calculated from real backend values, not hardcoded percentages or placeholder conversion rates.

## Stable Dashboard Cards
- Dashboard cards that temporarily lose mock data must keep their production shell structure intact:
  - same card chrome
  - same header position
  - same accent treatment
  - same action area footprint when that card will later be refilled with live data
- Recreating card structure from memory later is not acceptable. Empty states should preserve the exact shell we intend to refill.
- Overview cards should return to the original KPI composition as soon as live data exists; the empty-shell layout is only for the empty state.

## Empty Shell Rules
- Overview, earnings, payout, analytics, and referral-management empty shells must use metric- or workflow-specific copy.
- Avoid generic placeholders like `No data yet` and `--` inside metric cards when a centered empty-shell message can communicate the state more clearly.
- If a dashboard metric card is empty, center the empty-state copy within the remaining card body while preserving the canonical card header.
- Empty shell copy should be derived from the metric's intended meaning so the future live implementation does not drift from the shell semantics.

## Mint Surface Hover Rules
- Partner-web must not let shared `.glass-interactive:hover` darken mint-highlighted dashboard cards.
- `Commission Balance`, `Top Performing Links`, and any other `.glass-highlight-soft` card must keep the original mint gradient and top flare on hover while only the mint border/ring becomes brighter.
- `Primary Link Builder`, `Revenue Summary`, and other `.glass-mint` action surfaces must keep the filled mint treatment on hover while only the mint border/ring gains contrast.
- When two mint-highlighted cards are meant to look alike, align flare width/intensity and hover border contrast deliberately instead of letting one become more subdued.

## Tooltip Rules
- Informational tooltips inside KPI cards should use compact circular info icons, not extra chip/button styling.
- Tooltip copy must be specific, concise, and grounded in real backend logic or persisted data.
- KPI tooltips must remain fully visible within the card stack and must not be clipped by local overflow rules.

## Referral Stream Rules
- The transaction/referral stream must avoid horizontal overflow at every breakpoint.
- Desktop keeps the full table.
- The transient range between mobile and full tablet collapses to 4 visible columns:
  - `Transaction`
  - `Status`
  - `AMOUNT($)`
  - `Pair`
- Mobile may collapse further, but visible-row count must remain intentional and variable-driven rather than hardcoded pixel guesses.

## Canonical Files
- Shared CSS: `packages/design-system/src/styles/foundation.css`
- Shared docs: `packages/design-system/DESIGN_SYSTEM.md`
- Partner-web CSS: `apps/partner-web/src/styles/design-system.css`
- Partner-web docs: `apps/partner-web/DESIGN_SYSTEM.md`
