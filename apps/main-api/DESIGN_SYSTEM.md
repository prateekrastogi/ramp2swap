# Main API Design System

This file defines the design-system boundary for `apps/main-api`.

## Relationship To Shared Design System
- Shared Ramp2Swap design language lives in `packages/design-system`.
- `main-api` does not own interactive UI surfaces.
- `main-api` may only participate in the design system through response payload contracts that feed UI, naming consistency, and future transactional/public-facing rendered content.

## Non-Negotiable Rule
- `main-api` must not introduce ad hoc rendered HTML, inline CSS, or app-specific branding primitives.
- If `main-api` ever needs a rendered user-facing surface, it must follow `packages/design-system/DESIGN_SYSTEM.md`.
- Keep UI design concerns out of API handlers unless they are explicit transactional surfaces.

## Allowed Visual Surfaces
- none today

## Disallowed Surfaces
- inline HTML email templates
- inline rendered landing pages
- duplicated logo/color/typography systems

## Change Protocol
1. If a new user-facing surface is added to `main-api`, update this file first.
2. Add or update a design-system check in `scripts/check-design-system.mjs`.
3. Keep visual language aligned with `packages/design-system`.
