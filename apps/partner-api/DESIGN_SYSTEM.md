# Partner API Design System

This file defines the design-system boundary for `apps/partner-api`.

## Relationship To Shared Design System
- Shared Ramp2Swap design language lives in `packages/design-system`.
- `partner-api` owns a limited set of user-facing design surfaces:
  - partner auth/security email HTML
  - public logo assets exposed by the worker
- Any rendered surface must stay aligned with the shared Ramp2Swap brand system.

## Non-Negotiable Rule
- Do not introduce ad hoc colors, fonts, or logos in transactional surfaces.
- Reuse the shared Ramp2Swap visual language even when rendering email HTML.
- Keep API handlers free of UI concerns except for explicit transactional/public-facing assets.

## Owned Visual Surfaces
- `src/lib/otp-email-template.ts`
- `public/logo_horizontal.png`

## Email Rules
- Transactional emails must keep Ramp2Swap typography:
  - `Syne`
  - `DM Sans`
  - `DM Mono`
- Transactional emails must keep the approved obsidian/slate/mint palette.
- Transactional emails must use the approved horizontal logo asset.

## Change Protocol
1. Update `packages/design-system` first when the change affects shared brand language.
2. Update this file when partner-api adds or changes a visual surface.
3. Re-run `node ./scripts/check-design-system.mjs` from `apps/partner-api`.
