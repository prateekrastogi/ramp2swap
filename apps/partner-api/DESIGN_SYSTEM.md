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
- `public/logo_horizontal_email.png`

## Email Rules
- Transactional emails must keep Ramp2Swap typography:
  - `Syne`
  - `DM Sans`
  - `DM Mono`
- Transactional emails must keep the approved obsidian/slate/mint palette.
- Transactional emails must use the approved horizontal logo asset.
- Transactional emails must preserve the original Ramp2Swap composition even when the implementation changes for client safety:
  - logo left / security chip right on desktop-class layouts
  - centered stacked header on mobile
  - one dominant OTP card
  - warning block, support/detail rows, and footer in the same order and hierarchy
- Transactional emails must prefer email-client-safe HTML over browser-perfect effects when the two conflict.

## Email Rendering Tradeoffs
The following tradeoffs are allowed only to keep the OTP email rendering correctly across Gmail, Outlook.com, Outlook desktop, and Apple Mail. These are implementation compromises, not a license to drift from the design system.

- Allowed: replace imported/web font rendering with safe fallback stacks while still naming `Syne`, `DM Sans`, and `DM Mono` as the source typography system.
- Allowed: replace glass blur, layered ambient gradients, pseudo-element flares, and transform-driven effects with flatter table-safe approximations that preserve the same palette, hierarchy, and overall mood.
- Allowed: use table layout, inline styles, and client-specific resets when needed for stable transactional email rendering.
- Allowed: use an email-specific cropped horizontal logo asset for OTP email rendering only, as long as the logo artwork itself is unchanged and the shared `logo_horizontal.png` remains the canonical brand asset for other surfaces.
- Allowed: use anti-auto-link techniques for displayed email addresses, URLs, or phone-like strings when clients would otherwise recolor or restyle them away from the approved palette.
- Not allowed: changing copy tone, changing message hierarchy, introducing new colors, swapping logo artwork, or inventing new brand treatments in the name of compatibility.
- Not allowed: removing the premium Ramp2Swap feel entirely; email-safe does not mean generic.

## Change Protocol
1. Update `packages/design-system` first when the change affects shared brand language.
2. Update this file whenever partner-api adds or changes a visual surface, email-specific asset, or email-rendering compatibility rule.
3. Re-run `node ./scripts/check-design-system.mjs` from `apps/partner-api`.
