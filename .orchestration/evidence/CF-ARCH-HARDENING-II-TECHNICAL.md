# CF-ARCH-HARDENING-II — Technical Evidence for Stages 2–5

Pre-evidence implementation candidate: `c677719da7fd152634d4bcf608dc27544bb30c48`
Base/deployed checkpoint: `c64180acbf3d683245f6d42aec0f9ed7c60998a6`
Foundation run: `33233832741` — PASS

This evidence closes the implementation/fitness portion of Architecture Hardening II. A later Pre-Critic/Independent Critic must still bind to the exact final PR candidate after this evidence commit.

## Stage 2 — Frontend Architecture II

PASS.

Reception is split into:
- `ReceptionPage.tsx` — rendering/composition.
- `model.ts` — form/check-in view model primitives.
- `reception-api.ts` — HTTP adapter.
- `useReceptionWorkspace.ts` — async orchestration and commands.

Housekeeping is split into:
- `HousekeepingPage.tsx` — rendering/composition.
- `model.ts` — queue derivation/filtering/drafts.
- `housekeeping-api.ts` — HTTP adapter.
- `useHousekeepingWorkspace.ts` — async orchestration, actions and mobile focus behavior.

No direct shared HTTP-client calls remain in the two refactored page views. Existing persistent App Shell, History API behavior, Back/Forward and Cloudflare direct-route SPA fallback remain the routing contract.

`CF-WEB-STACK-002` records the explicit decision to retain the bounded ~2.3 KB custom router and defer React Router/TanStack Query until measured adoption triggers exist. This avoids dependency growth for architectural fashion while keeping server-state/routing boundaries replaceable.

## Stage 3 — Backend Modular/Hexagonal II

PASS for the selected high-value boundaries.

Selective hexagonal boundaries now exist for:
- Bookings + reservation inventory: pure domain + `BookingRepository` port + `D1BookingRepository` adapter; Hono route no longer owns booking SQL.
- Lifecycle: pure lifecycle/checkout rules + `LifecycleRepository` port + `D1LifecycleRepository`; check-in/reassign/checkout atomic persistence is outside Hono.
- Billing payment core: pure payment/idempotency rules + `BillingPaymentRepository` port + `D1PaymentRepository`; the transactional payment sequence and operation-token lookup are outside the route.

Simple read/CRUD and cash/extra-charge endpoints remain direct where a repository layer would be ceremonial. Inventory reservation semantics are covered by booking/lifecycle adapters rather than a duplicate unused abstraction.

Compatibility surfaces were preserved: booking status helper re-exports remain available to historical migration tests. Billing idempotency tests were moved from source-location assertions to the route/domain/adapter boundary without weakening the invariant.

## Stage 4 — D1 Performance & Indexing

PASS.

Existing indexes were inspected before adding anything. Only one complementary index was added:

`idx_bookings_status_checkout(status, check_out)`

It targets exact checkout-day/departure queries; the existing status index is keyed by `(status, check_in)` and does not cover this access pattern equivalently.

`cf-d1-query-plan-regression.sh` applies the real local hotel migrations and uses `EXPLAIN QUERY PLAN` to enforce:
- arrivals use `idx_bookings_status`;
- checkout/departure lookup uses `idx_bookings_status_checkout`;
- room inventory date lookup remains keyed;
- checkout must not regress to `SCAN bookings`.

Run `33233832741`: `d1QueryPlan=PASS`.

Network KPI fan-out was also reduced. Previously each tenant network summary called the detailed hotel metrics path, producing roughly five D1 query calls per hotel (dashboard, arrivals, departures, revenue, occupancy series) although the network response did not need detailed series. The network path now calls one aggregate D1 query per hotel through `loadNetworkHotelMetrics`, plus the CONTROL_DB hotel list query. Physical D1-per-hotel isolation is unchanged.

## Stage 5 — Architecture Fitness II

PASS.

`check-architecture-fitness-ii.mjs` enforces:
- Reception/Housekeeping view -> hook -> feature API boundaries;
- no direct shared HTTP calls from those page views;
- booking and lifecycle routes cannot regain direct D1 `.prepare()` calls;
- pure domain/port files cannot import Hono, D1/routing, ApiError or SQL prepare surfaces;
- D1 booking/lifecycle/payment adapters must own their expected persistence concerns;
- network KPI must use the optimized tenant metrics boundary;
- reporting checkout index must remain present.

Cloudflare/browser budgets are executable after the production web build. Run `33233832741` measured:
- JS raw: `254,992` bytes; budget `320,000`.
- JS gzip: `75,744` bytes; budget `100,000`.
- CSS raw: `15,737` bytes; budget `50,000`.
- CSS gzip: `3,912` bytes; budget `15,000`.
- API Worker dry-run upload: `198.50 KiB` raw / `43.02 KiB` gzip.
- Web Worker code dry-run: `1.10 KiB` raw / `0.49 KiB` gzip, with frontend content remaining Static Assets.

The web JS bundle is effectively flat versus the pre-hardening baseline (~254 KB raw / ~75 KB gzip) because no unnecessary router/query runtime dependency was added.

## Foundation evidence

Run `33233832741` on exact pre-evidence candidate `c677719d...`:
- generated Worker types PASS;
- TypeScript PASS;
- 37/37 unit tests PASS;
- production web build PASS;
- Architecture Fitness v1 PASS;
- Architecture Fitness II PASS;
- Cloudflare web budget PASS;
- D1 query-plan gate PASS;
- API/Web Wrangler dry-run PASS;
- staging Web Worker SPA/service-binding dry-run PASS.

## Remaining gates

Stages 2–5 are technically closed. Stage 6 must now execute full merge-candidate Product Flow + UX/mobile + historical regressions, exact-artifact Pre-Critic, and an Independent Critic. Only after PASS may Stage 7 integrate and create a new staging candidate. Production remains unauthorized.
