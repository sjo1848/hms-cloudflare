# HMS Cloudflare — Foundation 0 Contract v1 (F0.1–F0.12)

All entries below are proposed future contracts derived from frozen Blueprint 001 / 007 / 008. Paths describe inspected current repository surfaces, not a change list authorization. Shared gates: **Development Gate** means implementation + directed tests/evidence are complete for local/synthetic scope; **Critic** is a separate artifact-specific review; **Human Gate** is limited to data-risk/product decisions specified below. No item is authorized to start by this document.

## Common contract rules

- Tenant routing and capability checks remain server authoritative; dollars are integer cents; domain transitions are commands; events accompany only winning mutations.
- Compatibility uses additive/forward migrations; no historical migration edits. API consumers remain compatible until explicitly moved. Readiness is derived and must fail closed on unknown/inconsistent source data.
- Required QA spans unit/domain, API authorization/tenant, D1 persisted state, stale/concurrency/ABA, browser workflow where user-visible, and exact audit/event counts. Evidence identifies fixture, command, exit status and durable artifact; no inherited PASS is fresh evidence.
- Each F0 item must record accepted contract version and tests. F0.12 is the aggregate gate for affected Blocks A–H.

## F0.1 — Authoritative room dimensions

**Objective/contract:** replace single room-status semantics with distinct Occupancy, Housekeeping, Maintenance Impact, Service State, derived Readiness, and date-range Sellability. Values/predicates must follow 007/008; status is not a generic mutable label.
**Dependencies:** frozen 001/007/008 only. **Current repository surfaces:** `apps/api/schema/hotel-migrations/0001_foundation.sql`, `apps/api/schema/hotel-migrations/0009_housekeeping_maintenance.sql`, `apps/api/schema/hotel-migrations/0020_maintenance_impact.sql`; `apps/api/src/modules/lifecycle/d1-lifecycle-repository.ts`, `apps/api/src/modules/inventory/availability.ts`, `apps/api/src/routes/inventory.ts`, `apps/api/src/routes/housekeeping.ts`, `apps/api/src/room-availability.ts`; `apps/web/src/features/rooms/RoomsPage.tsx`, `apps/web/src/features/housekeeping/HousekeepingPage.tsx`, `apps/web/src/features/reception/ReceptionPage.tsx`. **PROPOSED NEW SURFACE:** forward migration and any new dimension storage/API fields; exact names deferred.
**Non-goals:** new room workflow/product decisions; replacing inventory-night truth; silently mapping unknown states.
**API/data/UI:** define canonical dimension representation and derived response fields; consumers receive both physical/operational dimensions and explicit reasoned readiness/sellability; UI displays distinct facts, never conflates Occupied with not maintained.
**Migration/cutover:** additive schema and compatibility mapping; follow Room State Cutover Plan; preserve source values/provenance, quarantine ambiguous records.
**Concurrency/idempotency:** all state transitions use conditional authoritative writes; readiness is recomputed from current rows; duplicate commands cannot create duplicate cases/events.
**QA/evidence:** transition matrix; legacy mapping corpus; D1 state/event assertions; overlap/readiness predicates; tenant isolation; compatibility reads; evidence in matrices and cutover rehearsal.
**Development Gate:** every room consumer uses canonical dimensions or explicitly documented compatibility adapter; ambiguity is not READY. **Critic:** inspect dimensional truth and no-false-ready adversarially. **Human Gate:** approve any unresolved data-risk policy before real-data execution. **Rollback/recovery:** no destructive rollback; forward repair, dual-read only bounded period; restore/quarantine affected rows from captured source snapshot. **Questions:** none for target semantics; unknown legacy distributions are data-reconciliation inputs.

## F0.2 — Shared domain/event/invariant contract

**Objective/contract:** establish shared command boundaries, state vocabulary, event/audit rules, actor/hotel/request traceability, UTC instant vs hotel-local date, and resource-context semantics consumed by all blocks.
**Dependencies:** F0.1 semantics. **Current repository surfaces:** `apps/api/src/context.ts`, `apps/api/src/errors.ts`, `apps/api/src/auth/capabilities.ts`; `apps/api/src/modules/bookings/domain.ts`, `apps/api/src/modules/lifecycle/domain.ts`, `apps/api/src/modules/billing/domain.ts`; `apps/api/src/routes/inventory.ts`, `apps/api/src/routes/bookings.ts`, `apps/api/src/routes/front-desk.ts`, `apps/api/src/routes/lifecycle.ts`, `apps/api/src/routes/housekeeping.ts`, `apps/api/src/routes/billing.ts`, `apps/api/src/routes/admin.ts`, `apps/api/src/routes/analytics.ts`; `apps/api/src/time/hotel-time.ts`; `apps/web/src/app/AppShell.tsx`, `apps/web/src/app/navigation.ts`, `apps/web/src/app/router.tsx`.
**Non-goals:** generic workflow engine, duplicate source of truth, product behavior beyond the approved architecture.
**API/data/UI:** command identity, typed conflict/error shape and canonical state enums; events describe only actual transitions; client views distinguish FACT/derived/unknown.
**Migration/cutover:** additive event/schema adaptations only where required; never rewrite historical events to fabricate detail.
**Concurrency/idempotency:** exact-winner row/version/case identity; stale snapshots and ABA fail closed; side effects share the business atomic boundary or a recoverable outbox contract approved by architecture.
**QA/evidence:** transition matrices, event exact counts, stale/ABA, actor/hotel scoping, date boundary fixtures.
**Development Gate:** shared contract cross-module tests pass. **Critic:** verify no hidden generic CRUD or false audit. **Human Gate:** only if a source/target semantic ambiguity is material. **Rollback/recovery:** retain old readers during additive transition; forward repair. **Questions:** precise event retention/expiry is not a new requirement unless implementation reveals a binding need.

## F0.3 — Room State Cutover

**Objective/contract:** plan and prove safe mapping from current `rooms.status` plus HK/maintenance/history to F0.1 dimensions without false availability/readiness.
**Dependencies:** F0.1, F0.2. **Current repository surfaces:** `apps/api/schema/hotel-migrations/0001_foundation.sql`, `apps/api/schema/hotel-migrations/0009_housekeeping_maintenance.sql`, `apps/api/schema/hotel-migrations/0020_maintenance_impact.sql`; `apps/api/src/modules/lifecycle/d1-lifecycle-repository.ts`; `apps/api/src/routes/inventory.ts`, `apps/api/src/routes/bookings.ts`, `apps/api/src/routes/housekeeping.ts`; `scripts/migration/source-target-map.mjs`, `scripts/migration/migration-core.mjs`, `scripts/migration/rehearse.mjs`, `scripts/migration/reconcile.mjs`, `scripts/migration/test-rehearsal.sh`. **PROPOSED NEW SURFACE:** row-level shadow transform/report/runner only if current scripts cannot satisfy F0.3 evidence.
**Non-goals:** executing against production/real customer data in this planning scope; inventing missing history.
**API/data/UI:** establish shadow comparison/report schema and block activation for unresolved rows; compatibility responses remain explicit.
**Migration/cutover:** see dedicated plan: inventory, snapshot/checksum, deterministic mappings, ambiguous quarantine, dry-run, per-hotel readiness, reversible activation pointer or forward recovery.
**Concurrency/idempotency:** freeze or version/re-read cutover source; repeat runs idempotent; compare counts/checksums and prevent writes during activation window as contract dictates.
**QA/evidence:** synthetic edge corpus, rehearsal twice, injected failure/restart, orphan claims, duplicate open cases, dirty+occupied+maintenance combinations, exact reconciliation output.
**Development Gate:** zero unexplained loss/duplication and no unknown row marked READY. **Critic:** independent data/cutover review. **Human Gate:** explicit before any real-data execution/cutover. **Rollback/recovery:** pre-activation abort; after activation use forward correction/restore captured snapshot under authorized procedure, not destructive schema reversal. **Questions:** real-data distribution and operational freeze window remain unknown.

## F0.4 — Reassignment remaining-night interval

**Objective/contract:** one authoritative `effective_date=max(check_in, hotel_local_date)` and `[effective_date, check_out)` across preview, eligibility, mutation, inventory claims, audit and billing.
**Dependencies:** F0.1, F0.2, F0.3 mapping. **Current repository surfaces:** `apps/api/schema/hotel-migrations/0021_reassignment_remaining_nights.sql`; `apps/api/src/modules/lifecycle/d1-lifecycle-repository.ts`, `apps/api/src/modules/lifecycle/domain.ts`, `apps/api/src/routes/lifecycle.ts`, `apps/api/src/modules/inventory/availability.ts`, `apps/api/src/room-availability.ts`; `apps/web/src/features/reception/ReceptionPage.tsx`, `apps/web/src/features/reception/useReceptionWorkspace.ts`, `apps/web/src/features/reception/reception-api.ts`.
**Non-goals:** moving elapsed nights, changing check-out, silently accepting overrun.
**API/data/UI:** return effective date, old/new room, remaining interval and conflict reason; record truthful REASSIGN event/history.
**Migration/cutover:** no historical room-night rewrites; forward-only guards. **Concurrency/idempotency:** conditional booking/current-room, target availability and exact claim set; stale interval conflicts atomically.
**QA/evidence:** before/equal/after local date boundaries; same-day check-in; checkout overrun; exact old/new claims; event count; competing destination claim; tenant isolation.
**Development Gate:** all paths agree on one interval. **Critic:** adversarial race/interval review. **Human Gate:** only if V11/source interval conflict appears (none currently identified). **Rollback/recovery:** failed command leaves original claim set; successful operation reversed only by a new domain command. **Questions:** verify all old-client response consumers when contract version is set.

## F0.5 — Segmented stay pricing

**Objective/contract:** persist/evaluate non-retroactive per-night pricing segments so reassignment reprices only remaining nights at destination current rate; preserve prior priced nights and existing extra charges.
**Dependencies:** F0.2, F0.4. **Current repository surfaces:** `apps/api/src/modules/bookings/d1-booking-repository.ts`, `apps/api/src/modules/lifecycle/d1-lifecycle-repository.ts`, `apps/api/src/modules/billing/d1-payment-repository.ts`, `apps/api/src/modules/billing/domain.ts`; `apps/api/schema/hotel-migrations/0010_billing.sql`, `apps/api/schema/hotel-migrations/0019_billing_reconciliation.sql`, `apps/api/schema/hotel-migrations/0021_reassignment_remaining_nights.sql`; `apps/api/src/routes/inventory.ts`, `apps/api/src/routes/bookings.ts`, `apps/api/src/routes/lifecycle.ts`, `apps/api/src/routes/billing.ts`.
**PROPOSED NEW SURFACE:** pricing-segment schema/repository/read model and forward migration; no such segment store currently exists.
**Non-goals:** modifying payment entries; recreating charges; repricing elapsed nights; a second financial truth.
**API/data/UI:** booking total derives from segment totals + existing charges under accepted definition; preview and command use same authoritative quote/version; expose understandable delta.
**Migration/cutover:** plan explicitly in Active-Stay Pricing Bootstrap; historical rates must not be inferred as current; unresolved stays require reconciliation before repricing.
**Concurrency/idempotency:** lock/version/check quote inputs at mutation; concurrent rate or booking changes conflict; retries do not append duplicate segments.
**QA/evidence:** boundary nights, rate change before/after effective date, rounding integer cents, extras preserved, stale price, repeat/recovery, invoice state/ledger unchanged.
**Development Gate:** quote equals committed segments and total; no silent historical repricing. **Critic:** financial/data review. **Human Gate:** unresolved legacy-price policy before real-data bootstrap. **Rollback/recovery:** abort before activating segment totals; afterward forward-correct with auditable segment adjustment, never fabricate payments. **Questions:** only source-backed historical pricing availability per record.

## F0.6 — Active-stay pricing bootstrap

**Objective/contract:** initialize segment representation for checked-in stays without changing customer totals, payment ledger or historical economics.
**Dependencies:** F0.5; F0.3 inventory/booking identity reconciliation. **Current repository surfaces:** migration directory `apps/api/schema/hotel-migrations/` (existing directory; no claim that a future migration file exists); `apps/api/src/modules/bookings/d1-booking-repository.ts`, `apps/api/src/modules/billing/d1-payment-repository.ts`; `scripts/migration/source-target-map.mjs`, `scripts/migration/migration-core.mjs`, `scripts/migration/rehearse.mjs`, `scripts/migration/reconcile.mjs`, `scripts/migration/test-rehearsal.sh`; `apps/api/src/modules/billing/d1-billing-reconciliation.executing-d1.test.ts`, `apps/api/src/modules/lifecycle/check-in-concurrency.executing-d1.test.ts`.
**PROPOSED NEW SURFACE:** active-stay pricing classifier/bootstrap runner and row-level report if the existing rehearsal tools cannot satisfy the accepted evidence; exact filename deferred.
**Non-goals:** applying current rates retroactively or authorizing live cutover.
**API/data/UI:** bootstrap output carries status/provenance; unresolved rows block repricing and surface actionable reconciliation state.
**Migration/cutover:** dedicated plan covers source-of-truth precedence, deterministic segments where evidence exists, quarantine where it does not, checksums and no-false-success.
**Concurrency/idempotency:** snapshot expected booking/account/version; rerun same batch is idempotent; mutation during bootstrap aborts row/hotel activation.
**QA/evidence:** synthetic categorized corpus, exact cents and counts, rerun, interruption/restart, linked invoice/payment ledger invariants.
**Development Gate:** every activated stay has traceable basis and unchanged total/ledger. **Critic:** independent data/finance review. **Human Gate:** explicit approval before real-data bootstrap where inferred/missing history is involved. **Rollback/recovery:** pre-activation abort; post-activation corrective forward operation with original snapshot. **Questions:** source historical rate/charge completeness is unverified.

## F0.7 — Settlement guard at mutation boundary

**Objective/contract:** checkout/settlement checks current booking-account truth at authoritative transition boundary; stale pre-read cannot permit or reject incorrectly.
**Dependencies:** F0.2, F0.5, F0.6. **Current repository surfaces:** `apps/api/src/modules/lifecycle/d1-lifecycle-repository.ts`, `apps/api/src/routes/lifecycle.ts`, `apps/api/src/modules/billing/domain.ts`, `apps/api/src/modules/billing/d1-payment-repository.ts`, `apps/api/src/routes/billing.ts`, `apps/api/schema/hotel-migrations/0019_billing_reconciliation.sql`, `apps/web/src/features/reception/ReceptionPage.tsx`, `apps/web/src/features/billing/BillingWorkspace.tsx`.
**Non-goals:** inventing settlement policy or treating invoice presentation as authority.
**API/data/UI:** typed conflict exposes current amount/status safely; user gets actionable account review without duplicate checkout.
**Migration/cutover:** no data rewrite; compatibility with existing invoice/payment ledger.
**Concurrency/idempotency:** conditional booking/version plus invoice/ledger snapshot; settled transition and event atomic; retry outcome queryable.
**QA/evidence:** concurrent charge/payment vs checkout, VOIDED/mismatch, exact events, no partial room state, integer cents.
**Development Gate:** stale and settled paths satisfy approved rule. **Critic:** finance/concurrency review. **Human Gate:** only unresolved settlement policy conflict. **Rollback/recovery:** conflict leaves stay unchanged; completed checkout corrected via explicit domain command, not raw status update. **Questions:** any checkout exception must be source/approved contract backed.

## F0.8 — New guest + reservation recoverable workflow

**Objective/contract:** guest creation and reservation create form a staged/recoverable operation with stable request identity; preserve reservation semantics without requiring cross-D1 atomicity.
**Dependencies:** F0.2. **Current repository surfaces:** `apps/api/src/routes/inventory.ts` (guest list/create endpoints), `apps/api/src/routes/bookings.ts`, `apps/api/src/modules/bookings/d1-booking-repository.ts`; hotel migrations `apps/api/schema/hotel-migrations/0002_rooms_guests_holds.sql`, `apps/api/schema/hotel-migrations/0003_bookings.sql`; `apps/web/src/features/guests/GuestsPage.tsx`, `apps/web/src/features/reception/ReceptionPage.tsx`, `apps/web/src/features/reception/useReceptionWorkspace.ts`.
**PROPOSED NEW SURFACE:** staged guest+reservation operation identity/recovery persistence and endpoint logic if needed; there is currently no `apps/api/src/routes/guests.ts` or `apps/web/src/features/bookings/`.
**Non-goals:** cross-hotel/global guest merge, hidden duplicate creation on response loss.
**API/data/UI:** explicit staged state and recovery lookup; UI can resume/select created guest; no pretend all-or-nothing across stores.
**Migration/cutover:** additive request identity/recovery metadata if contract requires; existing records unchanged.
**Concurrency/idempotency:** client operation token scoped to tenant and semantic request; same token/same payload replays result; changed payload conflicts; uniqueness/ABA tests.
**QA/evidence:** guest created then booking failure; response loss after each stage; replay; duplicate guest race; tenant isolation.
**Development Gate:** every interrupted stage is discoverable/recoverable. **Critic:** workflow and idempotency review. **Human Gate:** none absent a duplicate-resolution product tradeoff. **Rollback/recovery:** resume or explicit abandoned draft cleanup per retention contract; never silently delete created guest. **Questions:** retention duration for abandoned staged records if not defined by source.

## F0.9 — Extra-charge idempotency and outcome recovery

**Objective/contract:** make extra charge safe across lost response/retry; one business charge/event pair and D11 reconciliation per operation.
**Dependencies:** F0.2 only among F0 work; it relies on the existing D11 billing-reconciliation contract but does not require segmented pricing F0.5 or checkout-settlement guard F0.7. **Current repository surfaces:** `apps/api/schema/hotel-migrations/0010_billing.sql`, `apps/api/src/modules/billing/d1-payment-repository.ts`, `apps/api/src/routes/billing.ts`, `apps/web/src/features/billing/BillingWorkspace.tsx`, `apps/api/src/modules/billing/d1-billing-reconciliation.executing-d1.test.ts`.
**PROPOSED NEW SURFACE:** forward migration for stable charge operation identity/uniqueness and added replay tests if required; current `extra_charges` does not persist such a token.
**Non-goals:** payment-entry fabrication or a divergent invoice reconciler.
**API/data/UI:** stable operation identity and lookup/replay response; duplicate token/payload conflict behavior explicit.
**Migration/cutover:** forward-only token/unique scope; legacy charges remain; no fabricated token retroactively unless traceable mapping is deterministic.
**Concurrency/idempotency:** unique tenant/booking/token and atomic charge+booking/invoice trigger+events; exact-winner semantics honor trigger-inflated D1 `meta.changes` (never assume each statement equals one).
**QA/evidence:** duplicate simultaneous calls, response loss, audit failure rollback, stale booking/ledger/VOIDED, exact totals/events, immutable payment entries.
**Development Gate:** at-most-one charge and complete truthful outcome. **Critic:** DB/financial adversarial review. **Human Gate:** only if charge retry semantics conflict with payment policy. **Rollback/recovery:** failed batch all-or-nothing; ambiguous response resolved by operation lookup. **Questions:** token retention horizon must align with charge audit retention.

## F0.10 — Server-owned capabilities

**Objective/contract:** expose effective capability set from canonical server authority and use it for navigation/action visibility; backend remains final enforcement.
**Dependencies:** F0.2. **Current repository surfaces:** `apps/api/src/auth/capabilities.ts`, `apps/api/src/index.ts` `/api/v1/auth/me`; `apps/web/src/app/AppShell.tsx`, `apps/web/src/app/navigation.ts`, `apps/web/src/app/router.tsx`, `apps/web/src/api/client.ts`.
**Non-goals:** client-side authorization, duplicate role maps, identity/topology change.
**API/data/UI:** `/auth/me` (or approved equivalent) returns effective capability names, scoped to current hotel/identity; hide inaccessible entries while direct API still denies.
**Migration/cutover:** no DB migration unless capability persistence is contractually required; otherwise additive response.
**Concurrency/idempotency:** membership/role changes invalidate cached capability context; stale claims cannot grant backend access.
**QA/evidence:** exact role matrix parity, unknown role fail-closed, same subject before/after downgrade, no side effects on denied writes, hotel isolation.
**Development Gate:** each surface derives visible actions from server capabilities and APIs enforce them. **Critic:** RBAC review. **Human Gate:** security-authority change only. **Rollback/recovery:** additive response can be ignored by old clients; revert client consumer while server remains authoritative. **Questions:** none if existing canonical capability sets remain unchanged.

## F0.11 — Refresh/invalidation and authoritative UI continuity

**Objective/contract:** after mutations/conflicts, invalidate/refetch affected booking, room, inventory, account, HK, maintenance and queue context without stale optimistic truth or unnecessary full-page reset.
**Dependencies:** F0.2, F0.10. **Current repository surfaces:** `apps/web/src/api/client.ts`; `apps/web/src/app/router.tsx`; `apps/web/src/features/reception/useReceptionWorkspace.ts`, `apps/web/src/features/reception/reception-api.ts`; `apps/web/src/features/rooms/RoomsPage.tsx`; `apps/web/src/features/housekeeping/useHousekeepingWorkspace.ts`, `apps/web/src/features/housekeeping/housekeeping-api.ts`; `apps/web/src/features/billing/BillingWorkspace.tsx`; API route files listed in the repository surface audit.
**PROPOSED NEW SURFACE:** shared invalidation utility only if the existing hooks cannot meet the refresh/version contract.
**Non-goals:** global realtime infrastructure or speculative cache rewrite.
**API/data/UI:** command result includes enough identity/version to refresh; authoritative read controls final state; preserve meaningful filters/search/selection/URL/scroll.
**Migration/cutover:** none. **Concurrency/idempotency:** overlapping reads are ordered/cancelled or version-checked; stale responses cannot overwrite newer state; retry uses operation identity.
**QA/evidence:** delayed/out-of-order fetch, 409 refresh, success context retention, navigation/back-forward, mobile task close, no false optimistic completion.
**Development Gate:** contracted mutations converge to authoritative view. **Critic:** stale-state UX review. **Human Gate:** none unless behavior changes operational intent. **Rollback/recovery:** refetch explicit resource scope; fall back to visible refresh affordance. **Questions:** endpoint version/ETag strategy only if needed by observed race.

## F0.12 — Foundation evidence/activation gate

**Objective/contract:** aggregate acceptance evidence for F0.1–F0.11, cutover readiness and per-record unresolved handling before dependent product blocks.
**Dependencies:** F0.1–F0.11. **Current repository surfaces:** `scripts/migration/test-rehearsal.sh`, `scripts/cf-product-flow-regression.sh`, `scripts/cf-ux-mobile-browser-ci.mjs`, `scripts/check-architecture-fitness-ii.mjs`, `scripts/check-cloudflare-budgets.mjs`, `.orchestration/evidence/`.
**PROPOSED NEW SURFACE:** Foundation aggregate evidence manifest/gate runner if existing scripts cannot produce the required exact per-test/per-hotel report.
**Non-goals:** real customer data execution, promotion, independent approval substitution.
**API/data/UI:** gate report exposes per-hotel/per-record states and explicit blockers; no aggregate green if required sub-evidence is missing.
**Migration/cutover:** dry-run/rehearsal only unless separate Human authorization; readiness digest/checksum/versioned plan.
**Concurrency/idempotency:** freeze evidence inputs by commit/test artifact; repeat gate is deterministic; runner owns process cleanup.
**QA/evidence:** full matrix in Test/Evidence Matrix, hashes, commands, exit codes, failures and quarantines.
**Development Gate:** all required foundation criteria pass; unresolved rows are excluded from activation. **Critic:** fresh reviewer verifies package and evidence. **Human Gate:** Controller review plus explicit data-risk approval before live cutover; subsequent implementation authorization separately required. **Rollback/recovery:** gate failure leaves current runtime unchanged; rerun after correction. **Questions:** real cutover window and data owner are later inputs.
