# Task Contract — HMS-F0-04-REASSIGNMENT-INTERVAL-001

Task ID: `HMS-F0-04-REASSIGNMENT-INTERVAL-001`
Parent: `HMS-FOUNDATION-0-START-001`
Depends on: F0.1 room dimensions; F0.2 shared room transition/version guards; F0.3 room-state mapping evidence.
Authority: Foundation 0 authorization; Roadmap Artifact A2 `b2581e4c370eeb6f74e9380af010e48386642b4f` and Boundary B2 `c6a4bcb9a2939505f7ddf8e72c02ec9b825f00f3`; frozen Blueprint 001, Reconciliation 007, Final Disposition 008; V11 reassignment, temporal, maintenance, transition, history, API-command and intentional-departure contracts.
Execution boundary: `impl/hms-foundation-0`; synthetic fixtures/disposable local D1 only.

## Objective

Make one authoritative hotel-local half-open interval govern an in-stay reassignment and its persisted room-night claims, while retaining elapsed room history. The command applies only to a `CHECKED_IN` booking with `hotel_local_date < check_out`; its effective date is `max(check_in, hotel_local_date)` and only `[effective_date, check_out)` moves. Connect the command to F0.1/F0.2 canonical room dimensions and monotonic room-state versions, with exact-winner, atomic event and tenant-scoped evidence.

The frozen contract sources are read from `origin/analysis/operational-flow-definition-v11` without merging that branch. No UI redesign or real-data operation is in scope.

## Requirement → expected surface → acceptance → evidence

| Requirement | Expected surface | Acceptance | Evidence |
|---|---|---|---|
| Authoritative hotel-local date and interval | Existing `apps/api/src/routes/lifecycle.ts`, `apps/api/src/modules/lifecycle/domain.ts`, `apps/api/src/modules/lifecycle/d1-lifecycle-repository.ts`; existing hotel time middleware in `apps/api/src/index.ts` | The route requires the authenticated membership's hotel-time context; it does not fall back to UTC/system date. Reject if local date is absent/invalid. Derive `effective_date = max(check_in, hotel_local_date)` once and use it for eligibility, mutation, persisted claim interval and truthful event. | Route/domain tests with fixed hotel-local dates, including missing context fail-closed; executing-D1 event and claim assertions. |
| Eligible temporal boundary | Existing lifecycle route/repository and forward D1 guard migration only if current guards cannot enforce the contract | `CHECKED_IN` only; reject same-room, reason whose trimmed length is below 6, and `hotel_local_date >= check_out`. Same-day arrival uses `check_in`; before check-in uses `check_in`; in-stay uses local date; checkout day/after rejects without any mutation. | Boundary matrix on synthetic D1, exact unchanged snapshots/events for rejects. |
| Remaining-night inventory only | Existing `room_inventory_nights`, `apps/api/src/modules/lifecycle/d1-lifecycle-repository.ts`, migration `0021_reassignment_remaining_nights.sql`; proposed additive migration only if needed to strengthen invariant guards | Preserve every elapsed claim on the old room. Move precisely every expected date in `[effective_date, check_out)` from old room to new room; no missing, duplicate, pre-effective, or out-of-range claim. Fail closed if the original claims do not match the booking's expected pre-command interval. | Executing-D1 before/equal/in-stay tests compare complete per-date old/new claim sets before/after and event details. |
| Destination and old-room transition | Existing `apps/api/src/modules/room-state/domain.ts`, `read-model.ts`, lifecycle repository, forward migration if needed | Destination differs from current room, is physically AVAILABLE and canonically resolved/in service, has no overlapping hold/inventory claim in the remaining interval, and has no open BLOCKING maintenance; NON_BLOCKING is advisory and does not itself reject. After success derive destination occupancy as OCCUPIED and old room as VACANT with Housekeeping DIRTY, preserving unrelated dimensions. Apply F0.2 monotonic version checks/advancement exactly once for affected rooms; stale snapshots, visible-state ABA, and replacement state fail atomically. | Positive/negative executing-D1 transition matrix; destination/old-room version, dimension and legacy projection assertions; deterministic availability/maintenance race and ABA tests. |
| Atomic booking, claims, dimensions and event | Existing `apps/api/src/modules/lifecycle/d1-lifecycle-repository.ts`, route and `0021_reassignment_remaining_nights.sql`; proposed forward trigger migration only if existing database boundary is insufficient | Bind the exact pre-command old-room claim set to the authoritative D1 mutation boundary; any changed/missing/extra source claim since snapshot must reject atomically. Booking room and relevant domain state, exact claims, old/destination room state/version, and one `REASSIGN` lifecycle event commit or roll back together. The event records old/new room, hotel-local date, effective date, reason, actor/hotel/request, and before/after monotonic versions for both rooms. No post-commit JavaScript check may be used to pretend committed mutations rolled back. | Failure injection/trigger-abort tests and full-table snapshots; stale source-claim injection; exact one event on winner, zero on stale/rejected attempt. Same-booking/same-target and competing-bookings/one-target synchronized races each produce one winner and exact state. |
| Tenant/auth/API contract | Existing lifecycle route and authenticated hotel-scoped D1 routing; no new capability | Keep centralized `bookings.write` capability enforcement and tenant-bound operational D1. Foreign/unknown booking or destination cannot mutate or reveal another tenant's rows. Preserve existing HTTP semantics: invalid input 400, denied capability 403, unknown tenant-local booking 404, stale/ineligible operation 409. | Real local Worker with two synthetic tenant D1s; positive authorized reassignment and cross-tenant ID attempts with exact zero foreign drift; unauthenticated/unauthorized denial assertions. |
| Billing boundary during F0.4 | Existing D11 guards in `apps/api/src/modules/lifecycle/d1-lifecycle-repository.ts` and billing reconciliation migration; no pricing-segment store in this task | F0.4 preserves the existing booking total, invoice, extra charges and payment ledger unchanged; it emits no `PRICE_RECONCILIATION` because no price is changed. Keep fail-closed VOIDED/ledger-mismatch eligibility. Do not implement whole-stay or remaining-segment repricing here. F0.5 owns segment persistence, quote/command parity and D11 price reconciliation before the stack can be integrated/promoted. | Reassignment success and failure D1 snapshots assert total/invoice/charges/payments unchanged and no financial event; VOIDED/mismatch reject with exact zero drift; F0.5 later supplies price-change evidence. |
| Compatibility / response truth | Existing `/api/v1/bookings/:id/reassign` handler and repository result | Successful response must expose `old_room_id`, `new_room_id`, `hotel_local_date`, `effective_date`, and `remaining_interval: { start_date, end_date_exclusive }`; rejected operations return conflict and do not imply success. Audit history must not rewrite elapsed assignments. | API-level Worker assertions match response to D1 event and all persisted claims. Search all consumers before response adjustment. |
| Existing Reception preview/conflict path (bounded, no redesign) | Existing `apps/web/src/features/reception/ReceptionPage.tsx`, `useReceptionWorkspace.ts`, `reception-api.ts`; existing API availability and hotel-context reads | Keep current workflow/pattern. Candidate-room availability must query `[effective_date, check_out)` (not consumed nights); show the effective date/remaining interval consistently; stale 409 keeps the operator in context, refreshes candidate state, and permits a safe retry. Do not add new price behavior or assert a pricing preview in F0.4; F0.5 owns price consequences. This interim backend/UI state is not promotable by itself. | Targeted integrated Worker/D1 + browser checks at desktop and mobile assert interval passed to availability, candidate filtering, 409 recovery and no stale claims. No mock-only proof. |

## Frozen pricing authority and F0.5 ownership

The controlling Foundation 0 Implementation Authorization §9 (Drive `18JGIQxyl8Bh6_w7H3eW1qdPL7jfUsdSLk43aE-G-90A`, RG1–RG7 approved) and Reconciliation 007 Amendment C require consumed lodging to retain historical pricing and allow repricing only for remaining nights. This specific, later frozen rule supersedes older V11 `02a-reassignment.md` / `19-api-command-contract-map.md` wording that applies the destination rate over total-stay nights. The higher-priority authority also separates the work in the approved Roadmap A2: F0.4 owns interval/eligibility/history; F0.5 owns segmented repricing.

Current reassignment computes destination rate across total stay nights. That is a pre-existing behavior inconsistent with the controlling rule, not a policy ambiguity. F0.4 must leave total and all billing rows unchanged during the room/inventory transition; F0.5, on the same branch before integration/promotion, will implement the accepted per-night model and D11 reconciliation. Do not infer historical nightly prices or introduce a second pricing truth. This temporary F0.4 boundary is not an independently promotable state.

## Current repository surfaces and proposed surfaces

Verified existing surfaces: `apps/api/schema/hotel-migrations/0021_reassignment_remaining_nights.sql`; `apps/api/src/modules/lifecycle/d1-lifecycle-repository.ts`, `domain.ts`, `ports.ts`; `apps/api/src/routes/lifecycle.ts`; `apps/api/src/modules/room-state/domain.ts`, `read-model.ts`; `apps/api/src/modules/inventory/availability.ts`; `apps/api/src/room-availability.ts`; `apps/api/src/index.ts`; `apps/api/src/modules/lifecycle/check-in-concurrency.executing-d1.test.ts`; `scripts/cf-i03-regression.sh`; `scripts/cf-product-flow-reassign-race.mjs`.

**PROPOSED NEW SURFACES (conditional):** focused reassignment executing-D1 test file and an additive forward migration to replace/strengthen reassignment trigger guards, only if inspection/tests prove existing surfaces cannot establish the acceptance criteria. No migration may rewrite historical room-night claims or backfill real room dimensions.

## Mutation / concurrency / idempotency

- Identify and condition the booking's authoritative current room, status, check-in/out, and any mutable version/state used to derive the interval.
- Correlate old and destination room dimensions/versions and exact target availability/maintenance/hold/claim evidence inside the same D1 write boundary; test ABA where state changes away and returns visibly equal.
- Verify the complete pre-state claim set is the expected booking interval, not only a matching count. On success, assert the exact post-state date→room mapping and exactly one audit event. On any stale/zero-row/failure path, assert unchanged booking, both room dimensions/versions, all claims, billing rows/events and lifecycle event counts.
- D1 batch trigger abort is relied on only when demonstrated by executing-D1 rollback evidence; a JavaScript post-batch result check is not rollback.
- Concurrent reassignment attempts to the same destination have at most one winner and no loser-side effects. Replayed stale request cannot produce duplicate events. No generic idempotency ledger or new request-key policy is introduced by this task.
- Keep all operations within the authenticated hotel's operational D1; no cross-D1 transaction is claimed.

## Non-goals

- F0.5 segmented pricing implementation/bootstrap; guessing elapsed nightly rates; changing payment ledger, extra-charge identity or D11 source of truth.
- UI/Reception redesign, Blocks A–H, checkout/extension changes, future reservation cancellation/reassignment, generic booking CRUD, new capability or auth boundary.
- Real-data access, real migration rehearsal, cutover, active-stay bootstrap, production, PR, merge, main, staging or deploy.
- Editing historical migrations or rewriting elapsed room-night history.

## Invariant applicability map (all registry entries)

| Invariant | Classification | Rationale and required acceptance/evidence |
|---|---|---|
| INV-ATOMIC-001 | APPLIES | Conditional reassignment plus claims/dimensions/version/event must have exact winner and full rollback on stale, ABA, trigger failure and concurrency; executing-D1 snapshots prove zero drift. |
| INV-AUDIT-001 | APPLIES | One truthful REASSIGN event iff operation wins; event fields match authoritative persisted transition; zero event on every reject/stale/failure. |
| INV-DOMAIN-001 | APPLIES | Reassignment remains a domain command with CHECKED_IN/overrun/destination rules, not generic CRUD; tests exercise permitted/forbidden transition matrix. |
| INV-TENANT-001 | APPLIES | Hotel-routed D1 and tenant-scoped IDs; two synthetic hotels prove foreign attempts cannot read/mutate. |
| INV-RBAC-001 | APPLIES | Existing centralized `bookings.write` check remains authoritative; authenticated allowed and denied write paths with membership/routing established, zero side effects on denial. |
| INV-PARITY-001 | APPLIES | V11/Frozen 007/008 date interval, transition, history and blocking/advisory semantics are asserted directly. |
| INV-ENUM-001 | APPLIES | CHECKED_IN/AVAILABLE/OCCUPIED/DIRTY/MAINTENANCE and BLOCKING/NON_BLOCKING predicates must preserve semantics across DB/read-model/API serialization. |
| INV-UX-001 | APPLIES (bounded existing-flow correction) | Preserve the existing Reception reassignment task and context; only correct its interval/candidate/conflict behavior. Integrated browser proof covers selection, conflict refresh and safe recovery; no redesign. |
| INV-ORDER-001 | N/A | No queue ordering, ranking or next-item behavior changes. |
| INV-RESP-001 | APPLIES (bounded existing-flow evidence) | At contracted desktop and narrow/mobile widths, exercise destination selection and stale-conflict recovery controls, not shell-only reachability. |
| INV-EVID-001 | APPLIES | Each date, persistence, atomicity, tenant and billing claim is linked to named tests/API/DB assertions; no mock or post-commit check overclaim. |
| INV-LEGACY-001 | N/A | No historical event/case recovery or synthesized legacy record is introduced; elapsed source claims are preserved rather than reconstructed. |
| INV-MONEY-001 | APPLIES (preservation boundary) | Reassignment must preserve total/invoice/charges/payment rows and emit no financial event in F0.4; VOIDED/mismatch still fail closed. Exact D1 snapshots prove no billing drift. Segmented pricing is F0.5. |
| INV-STATE-001 | APPLIES | After mandatory Pre-Critic/invariant gate, publish immutable implementation Artifact A followed by orchestration-only Boundary B naming exact A and requesting Independent Critic; no self-PASS. |
| INV-CF-I07-001 | N/A | No protected admin/network/audit routes or authorization authority are changed. |
| INV-CF-I07-002 | N/A | No admin no-op mutation. |
| INV-CF-I07-003 | N/A | No role downgrade. |
| INV-CF-I07-004 | APPLIES if a runner is added/changed | Prefer extending existing test infrastructure; any new integrated runner must own and positively verify Worker/Vite/browser cleanup before PASS. |
| INV-CF-I08-001 | N/A | No reporting arithmetic. |
| INV-CF-I08-002 | N/A | No network aggregation. |
| INV-CF-I08-003 | N/A | No report query/date semantics. |
| INV-CF-I08-004 | N/A | No report state predicate expansion. |
| INV-CF-I08-005 | N/A | Hotel-local date is sourced from canonical middleware; no report clock/default behavior is modified. |
| INV-SCOPE-001 | APPLIES | Diff audit proves changes are F0.4 interval/room transition correctness only; pricing-segment design remains F0.5 and no Blocks A–H/UI scope is absorbed. |

## Validation and evidence

Required fresh evidence includes:

1. Unit/domain cases for `effective_date=max(check_in,hotel_local_date)`, strict overrun guard and trimmed reason boundary.
2. Executing-D1 migration-chain tests for hotel-local date before check-in, equal to check-in, during stay, equal to checkout, after checkout; exact old/new claim set and no elapsed-claim rewrite. Inject changed/missing source claims between repository snapshot and write batch; require conflict and zero drift.
3. Target state matrix: available target, blocking maintenance reject, non-blocking advisory-eligible target, hold/inventory conflict, same target, non-checked-in booking, malformed/missing hotel-local context.
4. Dimension/version assertions for both rooms, including occupancy derived from booking assignment, unrelated dimension preservation, exact one version advance, stale and ABA failures.
5. Failure injection at the final event/guard boundary and direct complete-table snapshots proving atomic rollback; same-booking/same-destination and two-bookings/one-destination operations released from synchronized snapshots, each proving exactly one winner, no loser effects, exact room versions/claims and actor/event correlation.
6. API Worker evidence for local authenticated hotel routing, capability allow/deny and two synthetic tenants; route date comes from hotel timezone context; required response fields/event/DB agree.
7. Existing D11 4/4 executing-D1 and CF-I03 reassignment checks rerun where affected; reassignment VOIDED/mismatch failure and success both assert no total/invoice/charge/payment/financial-event mutation in F0.4. F0.5 segmented pricing is not certified by F0.4.
8. Integrated targeted Reception browser evidence for remaining-interval candidate selection and 409 refresh/recovery at desktop and mobile; test only interval/context behavior, not pricing preview.
9. `npm run check`, `npm run types:check`, `npm run web:build` and budgets, `npm run architecture:fitness`, `npm run test:d1-query-plan`, `npm run wrangler:dry-run`, `git diff --check`, route/scope audit.

## Development Gate

F0.4 is internally evidence-complete only when every permitted path uses the same hotel-local half-open interval, elapsed inventory history is unchanged, room-state dimensions/versions and booking assignment agree, all invalid/stale/concurrent paths fail atomically with zero events/drift, tenant/capability boundaries hold, and D11 protections remain intact. This is F0.4 evidence only; it does not close F0.5 pricing, F0.12 aggregate Foundation, Independent Critic or promotion.

## Critic, publication and stop conditions

After fresh invariant evidence and mandatory Pre-Critic, freeze implementation Artifact A and orchestration-only Boundary B, then require an independent read-only critic with explicit interval/race/atomicity mandate. No self-verdict. Routine technical findings are repaired within this contract. Stop only for an actual contradiction between binding pricing/interval contracts that makes safe F0.4 implementation impossible, new product policy, real-data access, or scope beyond F0.4. Keep all D1 fixtures disposable and synthetic.
