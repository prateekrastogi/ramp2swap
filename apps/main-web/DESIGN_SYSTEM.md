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
- Confirm the header continues using the shared nav glass treatment.
- Confirm the primary header action remains a pill-shaped `Connect Wallet` button with accessible touch sizing.
- Confirm the homepage content remains header plus the centered widget shell, the conversation stage below it, and a low-emphasis legal footer beneath the main stage.
- Run `npm run build --workspace apps/main-web` after UI changes.

## Change Protocol (Every Time)
1. Update `packages/design-system` first when the change affects shared design language.
2. Update `apps/main-web/src/styles/design-system.css` only for main-web-specific composition and behavior.
3. Update this file when main-web-only rules change.
4. Re-check both docs before finalizing.
5. Build and verify no regressions.

## Main Web Layer
Main-web owns:
- homepage composition around the centered LI.FI widget stage
- the conversation upload surface that sits below the widget inside the same shell
- the top navigation shell and its sticky behavior
- the low-emphasis legal footer and main-web legal document pages
- page-level content arrangement below the shared brand primitives

Main-web does not own:
- global palette tokens
- global typography scale
- shared glass tiers and ambient background primitives
- reusable logo primitives
- generic cards, buttons, inputs, tables, chips, and status styles

## Header Experience
- The header uses the shared tier-4 nav glass treatment and stays visually separate from the widget stage.
- Desktop and tablet keep the horizontal logo on the left and the pill CTA on the right.
- Mobile keeps the right-aligned pill CTA at `44px` height and swaps to the approved mark-only nav treatment from the shared design system.

## Widget Stage
- The homepage body below the header is a single centered LI.FI widget stage.
- The outer widget shell uses shared `.glass` + `.glass-tier-2` so the widget takes center stage without introducing a new visual system.
- The LI.FI widget surface itself carries the softer partner-web `.glass-highlight-soft` language through its single container theme; do not add a nested extra glass shell around the widget to achieve this.
- The shell may include the dedicated conversation stage below the widget, but no extra marketing, metrics, or placeholder scroll sections.
- Widget customization is deferred; first implementation is focused on mounting the widget cleanly with one shared integrator config.
- Private RPC overrides should be supplied through `sdkConfig.rpcUrls` using the unified public config file at `src/lib/public-app-config.ts` for the primary six chains only: Ethereum, Arbitrum, Optimism, Base, Polygon, and Solana.
- Keep public app metadata and browser-visible RPC configuration centralized in `src/lib/public-app-config.ts` instead of scattering them across env files.

## Legal Footer And Pages
- The homepage may include a subdued legal footer below the widget stage for compliance links and platform identity.
- Use a softer shared glass tier than the header so the footer reads as supportive chrome, not a competing hero surface.
- Keep the copyright block above the legal link row.
- Legal links should open their documents in a new tab.
- Legal document pages should use the shared main-web header treatment plus a readable, long-form glass panel centered in the viewport.

## Conversation Stage
- The conversation composer sits below the widget inside the same outer shell and matches the widget width.
- Use a separate inner glass surface with lighter treatment than the main shell so it reads as a secondary action area.
- The conversation surface uses shared `.glass-mint` so it carries the fuller green fill tinge used by partner-web premium mint cards like revenue/link-builder surfaces.
- Keep clear spacing between the widget surface and the conversation surface; the shell should expand vertically rather than compress either component.
- The input area should autosize vertically while typing and keep the action button anchored to the lower right on desktop/tablet.
- The section label is fixed to `Intent AI` and the placeholder copy is fixed to `Describe Your Swap...`.
- The composer action uses `/White_Ramp2Swap.svg` inside the circular button; do not revert to an `Upload` text label.
- Keep the composer action at `48px` on desktop/tablet and `44px` on mobile, with the icon sized proportionally inside it.
- Keep the composer heading aligned with the LI.FI `Exchange` title scale and keep the input text aligned with the widget field typography.

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
