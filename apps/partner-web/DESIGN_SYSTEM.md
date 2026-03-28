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
