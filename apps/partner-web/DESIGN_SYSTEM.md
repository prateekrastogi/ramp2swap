# Partner Web Design System

This file is the partner-web addendum to the shared Ramp2Swap design system.

## Relationship To Shared Design System
- High-level Ramp2Swap design language now lives in `packages/design-system`.
- Shared rules and reusable primitives are defined in:
  - `packages/design-system/src/styles/foundation.css`
  - `packages/design-system/assets/logo.png`
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

## Partner Web Layer
Partner-web owns:
- dashboard shell and sidebar behavior
- login screen layout and showcase treatment
- analytics, earnings, settings, and referral-management composition
- partner-only spotlight card variants such as `.glass-highlight-soft`

Partner-web does not own:
- global palette tokens
- global typography scale
- shared glass tiers
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
- Highlighted insight surfaces may use `.glass-highlight-soft`; that variant is partner-web specific until another app needs it.

## Canonical Files
- Shared CSS: `packages/design-system/src/styles/foundation.css`
- Shared docs: `packages/design-system/DESIGN_SYSTEM.md`
- Partner-web CSS: `apps/partner-web/src/styles/design-system.css`
- Partner-web docs: `apps/partner-web/DESIGN_SYSTEM.md`
