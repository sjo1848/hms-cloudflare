# CF-WEB-ARCH-001 — Frontend Architecture Hardening

Project: HMS Cloudflare
Global Project Mode: DELIVERY
Phase: REMOTE HUMAN PRODUCT ACCEPTANCE / ARCHITECTURE REWORK

## Trigger
Human Product Acceptance found visible full-document flashes when switching application screens. Inspection confirmed the application navigation is implemented with ordinary `<a href>` links and derives page state directly from `location.pathname`, causing full document reloads. The same inspection confirmed the frontend is concentrated in a ~105 KB `apps/web/src/App.tsx` that mixes domain types, HTTP client, routing, shell/navigation, feature state, forms and feature rendering.

This is not treated as cosmetic cleanup. It is an Architecture Fitness defect because the structure has produced observable UX degradation and makes routing/environment parity harder to test and change safely.

## Objective
Preserve the accepted HMS product/domain/auth/API behavior while creating a maintainable frontend architecture and client-side navigation with direct-route/reload support.

## Required target boundaries
- `app/`: application shell, route resolution and navigation.
- `api/`: shared HTTP client/auth-development adapter.
- `domain/`: reusable product types without UI state.
- `features/`: Reception, Rooms, Guests, Housekeeping/Maintenance, Reports, Users, Network and billing-related feature modules.
- `components/`: genuinely reused UI/state primitives where repetition exists.
- `App.tsx`: composition/root only; must no longer contain feature implementations or direct HTTP client implementation.

Exact file counts and line limits are implementation-owned. No arbitrary universal max-lines rule is introduced.

## Architecture Fitness criteria
1. Internal navigation is client-side and does not perform a full document reload.
2. Browser Back/Forward updates the rendered feature correctly.
3. Direct URL navigation/reload remains valid through Cloudflare SPA fallback.
4. `/api/*` behavior is unchanged.
5. Feature modules own feature-specific state/flows; root composition does not.
6. Shared abstractions are extracted only when there is demonstrated reuse; no speculative framework/DSL.
7. Existing browser/product behavior remains covered by regression evidence.
8. A new browser assertion detects accidental document reload during navigation.
9. Foundation CI + browser/mobile CI PASS on exact artifact.
10. Independent Critic reviews architecture boundaries, behavior parity and evidence before integration/deploy.

## Non-goals
- No new hotel/product feature.
- No API/domain/D1/auth redesign.
- No production/cutover.
- No paid resources or real customer data.
- No framework migration solely for aesthetics.

## Harness learning
Add `Architecture Fitness` as a Web Product Harness concern, not a hard-coded Project Method rule. Signals include God modules, mixed responsibility boundaries, repeated UI/state patterns, coupling/change amplification and observable UX caused by architecture. The method should require maintainability evidence when contracted; the Web Product Profile determines relevant checks.

## Stop condition
After refactor + technical evidence + fresh Critic PASS, deploy a reviewed staging checkpoint and return to REMOTE HUMAN PRODUCT ACCEPTANCE. `PRODUCT_ACCEPTED` remains human-only.
