# CF-UX-ROUTING-001 — Staging SPA direct-route REWORK

Project: HMS Cloudflare
Global Project Mode: DELIVERY
Phase: REMOTE HUMAN PRODUCT ACCEPTANCE / REWORK

## Objective
Fix Cloudflare staging so direct navigation/reload to client routes such as `/housekeeping` resolves the SPA instead of returning HTTP 404, while preserving `/api/*` service-binding behavior and all existing product semantics.

## Trigger / evidence
Human Product Acceptance observed HTTP 404 at:
`https://hms-cloudflare-web-staging.sjo1848.workers.dev/housekeeping`

Root cause hypothesis verified from current implementation:
- browser CI serves the frontend through Vite, which supplies SPA history fallback;
- staging Web Worker delegates non-API requests to the Cloudflare `ASSETS` binding;
- staging assets config lacks SPA `not_found_handling`, so a direct unknown asset path returns 404.

## Scope
- Cloudflare Web Worker static-asset routing/fallback.
- Regression evidence that staging config explicitly enables SPA fallback.
- Foundation/browser CI on the exact candidate.
- Deliberate staging redeploy after PASS.

## Non-goals
- No product feature changes.
- No auth redesign.
- No D1/domain changes.
- No architecture hardening/refactor in this task.
- No production/cutover/paid resources/real data.

## Decision Latitude
Implementation may use Cloudflare-native SPA fallback or an equivalent bounded Web Worker fallback, provided `/api/*` remains excluded and static assets continue to resolve normally.

## Acceptance
1. Staging configuration has an explicit SPA fallback for non-API application routes.
2. Existing `/api/*` handling remains unchanged.
3. Foundation CI PASS.
4. Browser/mobile CI PASS.
5. Independent Critic finds no material regression/scope drift.
6. Acceptance release redeploys the exact reviewed head.
7. Human can directly open `/housekeeping` (and equivalent client routes) without HTTP 404 after Cloudflare Access authentication.

## Learned harness finding
Current browser CI uses Vite and therefore did not reproduce Cloudflare Workers static-assets route semantics. Record as environment/parity coverage gap: deployment-specific routing behavior must have deployment-equivalent evidence when it is observable to the product.

## Stop condition
Return to REMOTE HUMAN PRODUCT ACCEPTANCE after secure staging redeploy and direct-route verification opportunity.
