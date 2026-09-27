# HMS Cloudflare — Block Contracts A–H v1

These are planning contracts under frozen Blueprint 001 / 007 / 008. “Surfaces” are actual inspected repo locations. Every block requires an approved, block-specific Task Contract before implementation. No contract here authorizes implementation.

## Shared contract fields

Each block follows: objective and approved requirements; dependencies; concrete repository surfaces; non-goals; API/data/UI contract; migration/cutover; concurrency/idempotency; compatibility; QA/evidence; Development Gate; independent Critic; Controller/Human Gate; rollback/recovery; unresolved questions. Shared security, audit, integer-cent, tenant and no-false-ready invariants are binding as applicable. A failed gate blocks descendants, not unrelated accepted work.

## A — App Shell, navigation and context

- **Objective / requirements:** provide the approved system shell and distinguish hotel operations, directory, insights, hotel administration and platform/network administration; retain identity, hotel, capability and resource context with route/deep-link and browser navigation behavior.
- **Dependencies:** F0.10 capabilities, F0.11 refresh/context, F0.12; frozen Shell/Reception contract.
- **Current repository surfaces:** `apps/web/src/app/AppShell.tsx`, `apps/web/src/app/navigation.ts`, `apps/web/src/app/router.tsx`, `apps/web/src/api/client.ts`; `apps/api/src/index.ts` (`/api/v1/auth/me`), `apps/api/src/auth/capabilities.ts`, `apps/api/src/auth/membership.ts`.
- **PROPOSED NEW SURFACE:** none required by the frozen shell contract; any new component/file is identified explicitly by a later Task Contract.
- **Non-goals:** reworking unrelated visual design, new authentication/topology, role-name authorization in the browser.
- **API/data/UI:** server-owned capabilities drive visibility; backend still enforces every request. URL represents durable navigable context where contract specifies; shell keeps hotel and current task context distinct.
- **Migration/cutover:** no product data migration; route aliases/deprecations are additive and measured; preserve direct links through transition.
- **Concurrency/idempotency:** stale membership/capability response cannot overwrite newer identity/hotel context; route changes abort/invalidate obsolete reads.
- **Compatibility:** preserve `/api/v1` and deep links; no inaccessible route becomes API authorization.
- **QA/evidence:** role/capability matrix, unknown-role fail closed, direct route, refresh, Back/Forward, hotel switch, WIDE/COMPACT/NARROW, focus and keyboard.
- **Development Gate:** every approved module has one discoverable route/owner and context survives navigation. **Critic:** information-architecture, capability and continuity review. **Controller/Human Gate:** only material navigation taxonomy/authority change. **Rollback/recovery:** route alias and old shell rollback while preserving URLs; no data impact. **Questions:** confirm exact legacy route deprecation only after inventory parity.

## B — Reception and Booking/Stay Case

- **Objective / requirements:** operational queue plus selected case workspace; arrival, in-house and departure context remains linked to booking, guest, room, readiness, account and next prioritized case.
- **Dependencies:** A, F0.1/.2/.7/.10/.11; integrates C/D/E/F.
- **Current repository surfaces:** `apps/web/src/features/reception/ReceptionPage.tsx`, `apps/web/src/features/reception/CheckInTask.tsx`, `apps/web/src/features/reception/model.ts`, `apps/web/src/features/reception/queue.ts`, `apps/web/src/features/reception/reception-api.ts`, `apps/web/src/features/reception/useReceptionWorkspace.ts`; `apps/api/src/routes/front-desk.ts`, `apps/api/src/routes/bookings.ts`, `apps/api/src/routes/lifecycle.ts`, `apps/api/src/routes/housekeeping.ts`, `apps/api/src/routes/billing.ts`; test `apps/api/src/routes/front-desk-board.executing-d1.test.ts`.
- **PROPOSED NEW SURFACE:** none required to start B. Production front-desk handlers are in `front-desk.ts`; `front-desk-board.executing-d1.test.ts` is a test, not a route module.
- **Non-goals:** duplicate module landing forms, changing queue priority without authority, moving Reports/Users into Reception.
- **API/data/UI:** queue and selected case share stable entity identity; state labels use canonical dimensions; task surfaces show authoritative readiness/account consequences and typed conflicts.
- **Migration/cutover:** no schema migration expected; old entry points remain compatible through route/redirect transition.
- **Concurrency/idempotency:** selection and queue refresh are keyed/versioned; stale row updates cannot replace a newer case; actions call command idempotency contracts.
- **Compatibility:** preserve existing reception links, filters/search and supported booking actions; deprecate duplicate entry only with parity evidence.
- **QA/evidence:** queue-order fixtures independent of storage order; arrival/check-in/checked-in/departure; stale conflicts; next-case identity; context retention; responsive execution.
- **Development Gate:** front desk can complete each contracted task from visible case context and recover without reconstructing context. **Critic:** workflow/priority adversarial review. **Human Gate:** only changes to operational priority or task ownership not already frozen. **Rollback/recovery:** retain old route as compatibility path, authoritative refetch after failed mutation. **Questions:** no-show/late-arrival UI is included only if matching backend capability is verified; otherwise remains explicitly partial/backend gap.

## C — Reservation, Check-in and lifecycle tasks

- **Objective / requirements:** complete reservation create/edit and guided lifecycle commands (check-in, reassignment, checkout; extension only if backed). Guest+reservation creation is staged/recoverable; room inventory, readiness, account pricing and audit are coherent.
- **Dependencies:** A/B, F0.1–.9/.11; D/E read contracts; F0.12.
- **Current repository surfaces:** `apps/api/src/modules/bookings/d1-booking-repository.ts`, `apps/api/src/modules/bookings/domain.ts`, `apps/api/src/modules/lifecycle/d1-lifecycle-repository.ts`, `apps/api/src/modules/inventory/availability.ts`; `apps/api/src/routes/inventory.ts`, `apps/api/src/routes/bookings.ts`, `apps/api/src/routes/lifecycle.ts`, `apps/api/src/routes/billing.ts`, `apps/api/src/routes/housekeeping.ts`; migrations `apps/api/schema/hotel-migrations/0003_bookings.sql`, `apps/api/schema/hotel-migrations/0004_booking_claim_fk.sql`, `apps/api/schema/hotel-migrations/0019_billing_reconciliation.sql`, `apps/api/schema/hotel-migrations/0021_reassignment_remaining_nights.sql`; `apps/web/src/features/reception/ReceptionPage.tsx`, `apps/web/src/features/reception/CheckInTask.tsx`, `apps/web/src/features/reception/useReceptionWorkspace.ts`, `apps/web/src/features/rooms/RoomsPage.tsx`.
- **PROPOSED NEW SURFACE:** no separate `apps/web/src/features/bookings/` or guests route exists. If a new staged reservation endpoint/store is needed, its file and migration must be labeled proposed in the implementation contract.
- **Non-goals:** invent missing late-arrival/no-show/extension semantics; modifying payment ledger on repricing; retrospective repricing; automatic guest moves.
- **API/data/UI:** commands validate tenant, state, readiness, effective local date, remaining inventory and account state at mutation boundary; UI presents consequences and recovers typed 409s.
- **Migration/cutover:** F0.3 room cutover and F0.6 pricing bootstrap precede affected operations; no rewrite of elapsed inventory/history.
- **Concurrency/idempotency:** compare booking/current room/date/rate/inventory/account snapshots; exact-winner transactional mutation, zero side effects on conflict; request replay returns one result.
- **Compatibility:** `/api/v1` stable; adapters may translate enums but not alter predicates; staged create is recoverable, not falsely cross-D1 atomic.
- **QA/evidence:** booking validation, inventory overlap, check-in readiness, overrun, interval boundaries, segmented quote parity, charge preservation, VOIDED/ledger mismatch, concurrent destination, response loss, tenant denial and real local Worker/D1 browser path.
- **Development Gate:** each named supported lifecycle command has domain/API/D1/browser proof; unsupported capabilities stay labeled gaps. **Critic:** lifecycle/inventory/financial adversarial review. **Human Gate:** any new policy or ambiguous historical pricing/room data before real cutover. **Rollback/recovery:** failed command atomic; successful transitions compensated only through domain commands; staged records resume or explicit cleanup. **Questions:** source-backed extension/late-arrival/no-show coverage must be decided from actual source parity, not inferred from route names.

## D — Rooms operational workspace

- **Objective / requirements:** room board exposes separate occupancy, HK, maintenance impact, service state, derived readiness and date-range sellability, with contextual links to occupant/booking/guest/case.
- **Dependencies:** A, F0.1–.4, F0.12; integrates B/C/E.
- **Current repository surfaces:** `apps/web/src/features/rooms/RoomsPage.tsx`, `apps/web/src/features/rooms/rooms-operational.css`; `apps/api/src/routes/inventory.ts`, `apps/api/src/modules/inventory/availability.ts`, `apps/api/src/room-availability.ts`; migrations `apps/api/schema/hotel-migrations/0001_foundation.sql`, `apps/api/schema/hotel-migrations/0002_rooms_guests_holds.sql`, `apps/api/schema/hotel-migrations/0009_housekeeping_maintenance.sql`, `apps/api/schema/hotel-migrations/0020_maintenance_impact.sql`, `apps/api/schema/hotel-migrations/0021_reassignment_remaining_nights.sql`.
- **PROPOSED NEW SURFACE:** no `apps/api/src/routes/rooms.ts` exists; room endpoints currently live in `routes/inventory.ts`. A separate route file is not required by this roadmap.
- **Non-goals:** treating physical AVAILABLE as interval availability; changing room state by generic CRUD; duplicating housekeeping or maintenance command authority.
- **API/data/UI:** read model explains independent dimensions and blockers; availability is date interval plus holds/claims; actions deep-link to owning workflow.
- **Migration/cutover:** F0.3 required; existing status compatibility ends only after reconciled activation.
- **Concurrency/idempotency:** board reads may be stale but commands revalidate; room edits/holds use conditional writes and operation identity.
- **Compatibility:** room IDs and booking associations stable; preserve existing room administration functions.
- **QA/evidence:** dimension combinations, occupancy+blocking maintenance, nonblocking advisory, holds and overlapping stays, date boundaries, stale board conflict, mobile/keyboard.
- **Development Gate:** no single status label hides contradictory dimensions; destination eligibility agrees with command result. **Critic:** room-state/sellability review. **Human Gate:** unresolved mapping/cutover risk only. **Rollback/recovery:** read view can roll back while canonical data remains; transitions require compensating domain action. **Questions:** exact room service-state catalog is frozen-source driven and must not be expanded ad hoc.

## E — Housekeeping and Maintenance

- **Objective / requirements:** preserve task ordering and state; maintenance case has impact, priority, reason/owner/history; blocking and advisory cases coexist with occupancy according to 008; future booking is AT RISK, not automatically cancelled/moved.
- **Start dependencies:** F0.12, A, F0.1–.3 room-state contracts, and F0.10 capability contract. Block E may start without Block B being implemented.
- **Integration dependency/checkpoint:** integrate E's room/maintenance context with Reception under B before the dependent C lifecycle flows and before H cross-module acceptance. This is not a hard start edge B→E.
- **Current repository surfaces:** `apps/api/src/routes/housekeeping.ts`, `apps/api/src/modules/lifecycle/d1-lifecycle-repository.ts`; migrations `apps/api/schema/hotel-migrations/0009_housekeeping_maintenance.sql`, `apps/api/schema/hotel-migrations/0020_maintenance_impact.sql`; `apps/web/src/features/housekeeping/HousekeepingPage.tsx`, `apps/web/src/features/housekeeping/housekeeping-api.ts`, `apps/web/src/features/housekeeping/model.ts`, `apps/web/src/features/housekeeping/useHousekeepingWorkspace.ts`, `apps/web/src/features/housekeeping/housekeeping-operational.css`.
- **PROPOSED NEW SURFACE:** no `apps/api/src/routes/maintenance.ts` or `apps/web/src/features/maintenance/` currently exists. Block E may extend the existing Housekeeping files; separate files are not a prerequisite or presumed design.
- **Non-goals:** automatic guest relocation/cancellation; resolving maintenance by blindly setting AVAILABLE; broad unrelated HK redesign.
- **API/data/UI:** maintenance read/report/resolve capabilities remain distinct; open-case uniqueness per room; impact is explicit; resolve event reflects actual physical state; affected future bookings visibly risk-marked.
- **Migration/cutover:** 0020 behavior is current evidence; F0.3 must separately preserve hidden prior HK state; forward-only case impact backfill with ambiguity held for review.
- **Concurrency/idempotency:** exact open case identity/room/version; one open case per room; stale resolve/report conflicts; no duplicate events on replay.
- **Compatibility:** existing open cases readable; old status adapters cannot erase impact or HK state.
- **QA/evidence:** blocking/nonblocking × occupied/vacant × HK combinations, duplicate open race, resolution truth, capabilities and tenant denial, future reservation risk, deterministic queue ranking, mobile task execution.
- **Development Gate:** state-preserving behavior and case history verified; no automatic guest move/cancel. **Critic:** maintenance/readiness/order review. **Human Gate:** only ambiguous legacy-state/data policy. **Rollback/recovery:** failed command leaves case/room unchanged; case correction as audited new command; ambiguous backfill quarantined. **Questions:** none in target semantics; per-hotel legacy provenance remains to inspect during cutover.

## F — Booking Account, Charges, Payments and Cash

### F-account/payments (not gated by cash ownership)

- **Objective / requirements:** contextual booking account with total/paid/remaining/credit, charges, payment history and payment operations; ledger is source of paid truth and D11 derives invoice status/balances.
- **Dependencies:** A/B/C; F0.2, .5–.9; F0.12.
- **Current repository surfaces:** `apps/api/src/modules/billing/d1-payment-repository.ts`, `apps/api/src/modules/billing/domain.ts`, `apps/api/src/modules/billing/ports.ts`; `apps/api/src/routes/billing.ts`; migrations `apps/api/schema/hotel-migrations/0010_billing.sql`, `apps/api/schema/hotel-migrations/0011_cash_closure_audit.sql`, `apps/api/schema/hotel-migrations/0012_cash_closure_operation_token.sql`, `apps/api/schema/hotel-migrations/0015_payment_operation_token.sql`, `apps/api/schema/hotel-migrations/0016_payment_operation_token_scope.sql`, `apps/api/schema/hotel-migrations/0019_billing_reconciliation.sql`; `apps/web/src/features/billing/BillingWorkspace.tsx`, `apps/web/src/features/reception/ReceptionPage.tsx`.
- **PROPOSED NEW SURFACE:** pricing-segment persistence is owned by F0.5 and charge idempotency by F0.9; any files/migrations they add must be identified as proposed in those contracts. Booking Account is Booking/Stay grain; no global guest-account file is assumed.
- **Non-goals:** fabricating payment rows, altering ledger during repricing, duplicating account truth inside cash UI, silently replacing existing charge/payment history.
- **API/data/UI:** exact cents; stable idempotency/recovery tokens; extra charge and event/reconciliation atomic; VOIDED and ledger mismatch fail closed; show credit distinct from remaining.
- **Migration/cutover:** forward-only idempotency support; keep legacy records; active-stay segment bootstrap before repricing.
- **Concurrency/idempotency:** conditional invoice/account snapshots; at-most-once payment/charge effects; response-loss lookup; atomic D1 boundary, exact event count.
- **Compatibility:** retain API contracts; payment token behavior upgrade safely; existing account records remain auditable.
- **QA/evidence:** concurrent/replay payments and charges, lost response, rollback on audit error, credit, repricing up/down, VOIDED/mismatch, integer cents and tenant isolation.
- **Development Gate:** booking account and payment tasks user-completable with truthful authoritative refresh. **Critic:** finance/D1 review. **Human Gate:** material payment/settlement policy changes only. **Rollback/recovery:** resolve uncertain outcome by token lookup; never compensate by editing ledger directly. **Questions:** none for D11 semantics.

### F-cash (separately gated)

- **Objective / requirements:** approved “Caja actual / desde último cierre” reconciliation of payments actually received during the cash period: total received, cash received, non-cash received, payment count, expected cash, counted cash, cash difference, notes, handoff and closure history as blueprint specifies. Outstanding Booking Account balances/Receivables are excluded from every Cash amount/count and from the difference.
- **Dependencies:** A and F0.2/.9–.11; **Human validation of actual hotel ownership model** is a hard prerequisite only here.
- **Current repository surfaces:** `apps/api/src/routes/billing.ts`, `apps/api/src/modules/billing/d1-payment-repository.ts`, migrations `apps/api/schema/hotel-migrations/0010_billing.sql`, `apps/api/schema/hotel-migrations/0011_cash_closure_audit.sql`, `apps/api/schema/hotel-migrations/0012_cash_closure_operation_token.sql`; `apps/web/src/features/billing/BillingWorkspace.tsx`.
- **PROPOSED NEW SURFACE:** none assumed. If a Receivables link is exposed from Cash, it must navigate to the Booking Account/Folio context and remain visually/data separate; a new file is not required by this plan.
- **Non-goals:** creating operator-owned “shift” sessions without authorization; reshaping the physical cash ownership product model.
- **API/data/UI:** summarize only received payment events in the cash period from authoritative source; distinguish Cash from Booking Account/Folio and Receivables. Pending invoices/debt/credit must not be merged into total received, cash, non-cash, expected cash, counted cash, payment count or difference. A separately labeled link/attention affordance to Receivables is allowed. Preserve stable close-operation identity and retry outcome.
- **Migration/cutover:** none until ownership decision; if shared physical cashbox, preserve V1 semantics; if operator-owned, reopen only cash-session contract and its data/API implications.
- **Concurrency/idempotency:** close snapshot binds current ledger/event watermark and counted amount; simultaneous close/payment has deterministic conflict/reconciliation; replay returns same close.
- **Compatibility:** preserve existing “since last close” behavior until accepted replacement; no synthetic shift history.
- **QA/evidence:** shared-box fixture and owner validation evidence; close/replay/lost-response/concurrent payment; calculate total received, cash/non-cash, payment count and difference from payment-entry fixtures while separately seeding pending/credit invoices and asserting those balances affect none of the Cash values; history and tenant scope.
- **Development Gate:** only after documented owner-model answer and matching contract; accurate totals and recoverable close. **Critic:** independent finance/cash review. **Human Gate:** explicit cash ownership decision; no inference from labels. **Rollback/recovery:** failed close leaves ledger and closure unchanged; uncertain close queried by operation ID; no fabricated opening float. **Questions:** is cashbox shared across operators or owned per operator/session in actual hotel practice?

## G — Guests, Reports, Hotel Administration and Network

- **Objective / requirements:** keep guest directory, analytics, hotel-user administration and SaaS/network administration as distinct roles/domains, integrated with shell/capabilities and relevant booking context.
- **Dependencies:** A, F0.10/.11; guests additionally B/C; financial reports F-account; network remains separate from hotel operational D1.
- **Current repository surfaces:** `apps/web/src/features/guests/GuestsPage.tsx`; `apps/web/src/features/reports/ReportsPage.tsx`, `apps/web/src/features/reports/OperationalReportsPage.tsx`; `apps/web/src/features/users/UsersPage.tsx`, `apps/web/src/features/users/OperationalUsersPage.tsx`; `apps/web/src/features/network/NetworkPage.tsx`; API `apps/api/src/routes/inventory.ts` (guest handlers), `apps/api/src/routes/analytics.ts` (reports/network metrics), `apps/api/src/routes/admin.ts` (users/hotel/network administration), `apps/api/src/modules/analytics/network-metrics.ts`, `apps/api/src/auth/capabilities.ts`.
- **PROPOSED NEW SURFACE:** separate route files for guests/reports/users/network are not required; no `routes/guests.ts`, `routes/reports.ts`, `routes/users.ts`, or `routes/network.ts` exists.
- **Non-goals:** bringing SaaS administration into hotel Reception; changing report semantics or global identity authority; broad admin expansion.
- **API/data/UI:** tenant-scoped guest/admin reads, explicit report date/state/cents semantics, network allow-list aggregation and truthful unavailable-store errors; capabilities server-owned.
- **Migration/cutover:** no data migration unless approved; preserve control/operational database boundary.
- **Concurrency/idempotency:** admin mutation exact winner/no-op zero audit; downgrade invalidates same subject; aggregation uses bounded configured stores; stale report dates/filters are explicit.
- **Compatibility:** keep route/API and metric meanings stable; explicit capability additions only by approved contract.
- **QA/evidence:** tenant isolation, role matrix and denied write, no-op audit, downgrade before/after, report zero/rounding/date/cancel fixtures, network missing-store handling, responsive/context tests.
- **Development Gate:** no role bypass; domain boundaries visible and metrics independently reproducible. **Critic:** authorization/report/network review. **Human Gate:** global identity or SaaS authority change. **Rollback/recovery:** additive UI/route compatibility; correct admin effects only through auditable authorized mutation. **Questions:** any unexposed backend capability stays cataloged until source parity and product surface are evidenced.

## H — Cross-module integration, responsive and accessibility hardening

- **Objective / requirements:** prove end-to-end journeys across A–G at WIDE/COMPACT/NARROW, keyboard/focus, reduced-height, navigation continuity, loading/error/recovery and build budgets.
- **Dependencies:** all material A–G flows accepted; F-cash included only if separately approved/implemented.
- **Current repository surfaces:** `scripts/cf-product-flow-regression.sh`, `scripts/cf-product-flow-browser-ci.mjs`, `scripts/cf-ux-mobile-browser-ci.mjs`, `scripts/cf-wave12-reassignment-integrated.sh`, `scripts/p0-1-integrated-browser.sh`, `scripts/check-architecture-fitness-ii.mjs`, `scripts/check-cloudflare-budgets.mjs`, `scripts/cf-product-flow-lifecycle.playwright.js`, `scripts/cf-ux-rooms-guests-browser.playwright.js`, `scripts/cf-web-arch-browser.playwright.js`.
- **PROPOSED NEW SURFACE:** an H-level integrated runner only if these existing runners cannot prove the agreed scenarios; exact name deferred.
- **Non-goals:** substitute for block QA; unrelated redesign; global browser instability repair outside attributable scope.
- **API/data/UI:** no new business truth; verify integrated read/write behavior and canonical conflicts.
- **Migration/cutover:** none; integration test data synthetic/local only unless separately authorized.
- **Concurrency/idempotency:** cross-module delayed/out-of-order fetch and concurrent resource mutations; no stale success; exact event/ledger state.
- **Compatibility:** preserve approved deep links and context; verify current browser support contract.
- **QA/evidence:** all journeys in evidence matrix, actual Worker/D1 where integration claimed, desktop/tablet/mobile interactions, focus restoration, keyboard, reduced motion/height, process cleanup, JS budgets.
- **Development Gate:** all required scenarios reproducibly pass; shared/preexisting findings are attributed separately, not hidden. **Critic:** final integrated independent audit. **Human Gate:** Product Acceptance and any promotion/data action. **Rollback/recovery:** isolate failed flow, revert only its feature increment or use forward repair; preserve immutable evidence. **Questions:** final browser gate attribution must be resolved for promotion, but preexisting external instability does not become an unrelated code scope.
