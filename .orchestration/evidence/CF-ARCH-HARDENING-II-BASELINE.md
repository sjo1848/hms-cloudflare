# CF-ARCH-HARDENING-II — Baseline Audit

Base artifact audited: `c64180acbf3d683245f6d42aec0f9ed7c60998a6`

## Executive result

The system is not architecturally broken. Architecture Hardening I successfully removed the frontend God-module and established feature/app/api/domain/shared boundaries. The remaining debt is moderate and concentrated in feature internals, bespoke client infrastructure, backend route responsibility mixing, and unmeasured D1/query scalability.

Priority is change amplification and Cloudflare/D1 efficiency, not line-count aesthetics.

## Frontend baseline

Established strengths:
- `App.tsx` is root composition only (~173 bytes).
- Explicit `app/`, `api/`, `domain/`, `components/`, `features/` boundaries exist.
- Client navigation uses History API and is regression-tested against document reload.
- Cloudflare Static Assets + `single-page-application` fallback support direct route/reload.

Debt signals by source size/responsibility concentration:
- `features/reception/ReceptionPage.tsx` ~17.4 KB: bookings collection, availability, create/edit/cancel, check-in, reassignment, checkout, billing coordination and UI state are concentrated together.
- `features/housekeeping/HousekeepingPage.tsx` ~15.2 KB.
- `features/billing/BillingWorkspace.tsx` ~8.7 KB.
- `features/rooms/RoomsPage.tsx` ~8.2 KB.
- `styles.css` ~21.3 KB global stylesheet.
- The application maintains a bespoke router (`app/router.tsx`) and does not currently depend on React Router or TanStack Query.

Priority:
P1 reception internal decomposition and server-state separation.
P1 standard routing/query-state decision and implementation with behavior parity.
P2 housekeeping/billing decomposition driven by workflow boundaries.
P3 style ownership cleanup only where it reduces coupling; no CSS-framework rewrite.

## Backend baseline

Largest route modules:
- `routes/inventory.ts` ~14.0 KB.
- `routes/billing.ts` ~13.6 KB.
- `routes/housekeeping.ts` ~13.2 KB.
- `routes/bookings.ts` ~11.8 KB.
- `routes/admin.ts` ~11.5 KB.
- `routes/lifecycle.ts` ~10.7 KB.

The important issue is not size alone. `bookings.ts` currently owns Hono transport, capability checks, validation, booking business rules, date expansion, availability decisions, SQL statements, concurrency guards and response mapping. This is the first high-value selective-hexagonal extraction candidate.

Target order:
P1 bookings + inventory + lifecycle as one reservation/lifecycle domain boundary.
P1 billing application/persistence boundary.
P2 housekeeping/maintenance.
P3 admin/read-heavy endpoints only when change isolation or testing benefit is demonstrated.

## D1/index baseline

Existing useful indexes already include:
- `room_holds(room_id,start_date,end_date)`.
- bookings indexes on `(check_in,check_out)`, `(guest_id,created_at)`, `(room_id,check_in)`.
- `room_inventory_nights` primary key `(room_id,stay_date)` plus `(booking_id)`.
- open-maintenance partial unique index and room/status/history index.
- housekeeping event room/time index.
- billing indexes for booking charges, invoice status, payment shift and booking/payment history.

Therefore index work MUST be plan-driven rather than count-driven.

Known query-risk candidates for EXPLAIN analysis:
1. Dashboard/report queries combine booking `status` with `check_in`, `check_out` and `room_id`; current booking indexes are not explicitly status-leading.
2. Occupancy report generates a recursive day set and executes a correlated booking count for every day in the requested range.
3. Network KPI iterates hotels and calls `hotelMetrics()` for each tenant DB. Each call executes dashboard + revenue + occupancy query work. This is an intentional cross-D1 fan-out today but is an N x query pattern that must have an explicit scale/cost strategy.
4. New indexes can increase D1 row writes, so read improvement must be proven before introduction.

## Cloudflare operational baseline

Current topology:
Cloudflare Access -> Web Worker/Static Assets -> Service Binding -> private API Worker -> CONTROL_DB + tenant operational D1.

Keep this topology.

Measured staging build/deploy baseline from the accepted deployment:
- Web JS asset: ~254.14 kB raw / ~75.34 kB gzip.
- API Worker upload: ~191.19 KiB raw / ~41.65 KiB gzip.
- Web Worker shell upload is small; frontend static files are served through the assets binding.

Hardening budgets will initially be regression budgets relative to these measured values, not arbitrary universal limits. Any dependency increase must be explained by removal of bespoke infrastructure or meaningful runtime/request-state benefit.

## Risk register

P1 — Backend business logic coupled directly to Hono/D1 in critical transaction modules.
P1 — Reception owns excessive server-state/workflow state and change amplification.
P1 — Query efficiency is not currently guarded by EXPLAIN-based fitness checks.
P1 — Network analytics is cross-D1 fan-out proportional to tenant count.
P2 — Bespoke frontend router is maintained in-house despite standard routing requirements.
P2 — Repeated manual fetch/loading/error/invalidation patterns can produce redundant API/D1 traffic and stale UI; TanStack Query is a strong candidate.
P2 — Architecture Fitness I checks coarse boundaries but not dependency direction or SQL/index efficiency.
P3 — Global stylesheet ownership remains broad.

## Stage 1 exit criteria

- Architecture target and non-goals are contracted.
- Baseline source and bundle sizes are recorded.
- Existing index coverage is recorded so optimization does not duplicate indexes blindly.
- Query-risk candidates are identified for exact EXPLAIN work.
- Work is isolated from the deployed acceptance artifact.

Stage 1 verdict: PASS. Next authorized stage: Frontend Architecture II.
