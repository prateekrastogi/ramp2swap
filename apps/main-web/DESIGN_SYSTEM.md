# Main Web Design System

This file is the main-web addendum to the shared Ramp2Swap design system.

## Relationship To Shared Design System
- High-level Ramp2Swap design language lives in `packages/design-system`.
- Shared rules and reusable primitives are defined in:
  - `packages/design-system/src/styles/foundation.css`
  - `packages/design-system/DESIGN_SYSTEM.md`
- Main-web specific composition stays here and in `src/styles/design-system.css`.

## Non-Negotiable Rule
- Any main-web UI change must follow the shared design system first.
- If a rule is reusable across apps, move it to `packages/design-system` instead of duplicating it here.
- Only main-web-specific composition, marketing layout, and shell behavior belong in this file.

## Required Pre-Change Checklist
- Confirm shared tokens, typography, logo rules, and glass tiers still come from `packages/design-system`.
- Confirm main-web additions do not redefine reusable brand primitives locally.
- Confirm the header continues using the same premium glass family as the partner-web sidebar.
- Confirm the primary header action remains a pill-shaped `Connect Wallet` button with accessible touch sizing.
- Run `npm run build --workspace apps/main-web` after UI changes.

## Change Protocol (Every Time)
1. Update `packages/design-system` first when the change affects shared design language.
2. Update `apps/main-web/src/styles/design-system.css` only for main-web-specific composition and behavior.
3. Update this file when main-web-only rules change.
4. Re-check both docs before finalizing.
5. Build and verify no regressions.

## Main Web Layer
Main-web owns:
- homepage composition and marketing layout
- the top navigation shell and its sticky behavior
- page-level content arrangement below the shared brand primitives

Main-web does not own:
- global palette tokens
- global typography scale
- shared glass tiers and ambient background primitives
- reusable logo primitives
- generic cards, buttons, inputs, tables, chips, and status styles

## Header Experience
- The header uses the same stronger glass treatment family as the partner-web sidebar so both apps feel part of one system.
- Desktop keeps a premium floating rail with generous spacing, the horizontal logo on the left, and a pill CTA on the right.
- Tablet preserves the horizontal logo and slightly tightens spacing while keeping the CTA above the `44px` touch target floor.
- Mobile keeps the right-aligned pill CTA at `44px` height and swaps to the approved mark-only nav treatment from the shared design system.

## Brand Assets And Favicon
- Main-web navbar uses `/Horizontal_Logo.svg` for the horizontal brand asset.
- Main-web mobile nav uses `/Ramp2Swap.svg` for the mark-only logo treatment.
- Main-web favicon uses `/Ramp2Swap.svg`.
- Never stretch, recolor, or replace these brand assets outside the shared logo rules.

## Canonical Files
- Shared CSS: `packages/design-system/src/styles/foundation.css`
- Shared docs: `packages/design-system/DESIGN_SYSTEM.md`
- Main-web CSS: `apps/main-web/src/styles/design-system.css`
- Main-web docs: `apps/main-web/DESIGN_SYSTEM.md`
