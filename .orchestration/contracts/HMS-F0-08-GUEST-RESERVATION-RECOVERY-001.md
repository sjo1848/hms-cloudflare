# Task Contract — F0.8 Guest + Reservation Recoverable Creation

Task ID: `HMS-F0-08-GUEST-RESERVATION-RECOVERY-001`  
Parent: `.orchestration/contracts/HMS-FOUNDATION-0-START-001.md`  
Authority: Foundation 0 authorization RG1–RG7; `docs/implementation-roadmap/HMS-FOUNDATION-0-CONTRACT-V1.md` F0.8; approved dependency DAG.  
Status: `FROZEN BEFORE IMPLEMENTATION`  
Scope: local/synthetic only. No Blocks A–H, PR, push, merge, main, staging mutation, deploy, production, customer data, or live cutover/bootstrap.

## Objective

Make Reception's new guest + reservation creation recoverable under duplicate submission, lost response, interrupted guest/booking stages, room-availability conflict, and reload. Preserve existing guest and reservation semantics; no false cross-D1 atomicity claim. Reuse the existing hotel-local operational D1 and domain create rules. This is F0.8 only.

## Verified AS-IS surfaces

- `apps/api/src/routes/inventory.ts`: current `/guests` read/create; `guests.read` / `guests.write`; normalized name/email/phone validation; email uniqueness conflict; no automatic guest merge.
- `apps/api/src/routes/bookings.ts`: current `POST /bookings`; `bookings.write`; existing date, availability, current room-rate, integer-cent total and extra-charge rules.
- `apps/api/src/modules/bookings/d1-booking-repository.ts` and `domain.ts`: booking persistence, immutable pricing segment, inventory-night claims and booking mutation provenance types.
- `apps/api/src/index.ts`: API route registration and tenant-selected operational D1 context.
- `apps/api/schema/hotel-migrations/0002_rooms_guests_holds.sql`, `0003_bookings.sql`, `0010_billing.sql`, `0018_agent_mutation_provenance.sql`, `0019_billing_reconciliation.sql`, plus current forward migrations: guest uniqueness, booking/inventory, audit and D11 semantics.
- `apps/web/src/features/reception/ReceptionPage.tsx`, `useReceptionWorkspace.ts`, `reception-api.ts`, `model.ts`: current Reception reservation form requires selecting a pre-existing guest; it has no recoverable create operation.
- `apps/web/src/features/guests/GuestsPage.tsx`: separate guest create surface; current flow requires leaving/re-entering context to create a guest before booking.
- Existing tests include `apps/api/src/bookings.test.ts`, `apps/api/src/modules/bookings/d1-booking-repository.executing-d1.test.ts`, `apps/api/src/modules/bookings/d1-booking-repository.agent-provenance.test.ts`; these do not prove F0.8.

## Proposed surfaces (not current)

- **PROPOSED NEW SURFACE:** one forward-only hotel migration (next available sequence; expected `0029_*`) for tenant-local recoverable operation identity/stage/provenance and exact uniqueness. Do not edit historical migrations.
- **PROPOSED NEW SURFACE:** focused reservation-creation operation repository/service if existing booking repository cannot own the staged command without duplicating booking rules.
- **PROPOSED NEW SURFACE:** focused executing-D1/API tests for stage replay, failure recovery, concurrency, tenant and capability behavior.
- A separate generic workflow engine, new global guest identity, or new capability vocabulary is expressly not proposed.

## Requirement → expected surface → acceptance → evidence

| Requirement | Expected surface | Acceptance | Required evidence |
|---|---|---|---|
| Reception can create a guest and reservation without leaving its task context. | Reception page/workspace/API adapter. | Existing-guest flow remains available; new-guest flow uses the same reservation rules and returns a created booking or a recoverable created guest. | Real local Worker/D1 + Vite browser at desktop and mobile; no mocked API for integrated claim. |
| Operation identity is stable and tenant scoped. | New operation API/repository + additive hotel migration. | Same token + semantically identical normalized payload replays the same durable guest/booking result; changed payload with same token conflicts before further mutation. A token is not authorization or winner proof. | Executing-D1 same/different-payload and two-caller races; exact rows/events/inventory assertions. |
| Guest stage survives interruption. | Operation persistence and recovery read model. | After guest creation but before/while booking fails or response is lost, operation remains discoverable; replay/recovery returns the same guest and never duplicates/deletes it. | Injected failure/response loss after each durable stage; exact guest and operation state. |
| Booking stage is safely recoverable. | Booking command boundary and Reception recovery UI. | A winning create returns the same booking on retry; a losing/failed create leaves no partial booking, room-night claims, booking-create event, or false success. Incomplete guest is presented with an operational action to use/select that guest; changed reservation details require a new operation identity. | Executing-D1 + API and browser recovery/refresh assertions. |
| Current reservation domain rules remain authoritative. | Existing availability/pricing/repository validators; no duplicate rule set. | Recheck tenant-local guest/room, date range, sellability/holds/inventory, authoritative current rate/version and exact room-night set at mutation. Preserve current notes, validation, integer-cents and pricing-segment behavior. | Existing targeted booking/reassignment/D11 regressions plus F0.8 stale-rate/availability/overlap tests. |
| Audit is truthful. | Operation-stage audit/provenance and existing booking mutation event. | Every committed guest/booking stage has actor, tenant/hotel, request trace and time; each event is exactly once; failed stage has no success event. `x-request-id` alone is not a winner token. | D1 exact event rows/counts for success, replay, failure and race. |
| Tenant and capability boundaries remain authoritative. | Route middleware, canonical capabilities, operational D1 selection. | No client hotel selector. New guest requires `guests.write` and `bookings.write`; existing guest booking requires `bookings.write`; recovery detail/list must require the minimum existing read/write capabilities needed for returned guest data and continuation. Unknown roles fail closed. | Authenticated allowed-role success; denied capability writes have zero drift; same token in two local hotel D1s cannot cross-read/replay; foreign IDs fail closed. |
| Mobile and desktop operation remains usable. | Reception create/recovery view. | Integrated task controls, recoverable guest selection, validation/conflict, pending/success states and queue refresh work at 1280px and 375px; no false optimistic booking. | Browser assertions on both widths for new guest success, incomplete recovery, conflict and authoritative refresh. |

## Canonical operation contract

- Normalize input using existing validators before computing semantic payload identity: trimmed name/text, lower-case validated email, normalized optional phone/notes, strict dates, room ID and explicit existing-guest vs new-guest choice. Ignore request headers as idempotency authority.
- Reception's recoverable create path uses a focused `POST /reservation-creation-operations`; exact recovery reads use `GET /reservation-creation-operations/:token` and an incomplete-operation list uses `GET /reservation-creation-operations`. The existing `/guests` and `/bookings` routes remain compatible; no duplicate canonical route is introduced.
- A client-generated opaque UUID operation token is unique in the selected hotel D1. It scopes replay only; authentication, membership, capabilities and current hotel routing are re-evaluated on every request. Starting with a new guest requires both existing `guests.write` and `bookings.write`; starting with an existing guest requires `bookings.write`; recovery reads require `guests.read`. A resumed booking attempt is still subject to `bookings.write`.
- Persist only canonical states `GUEST_CREATED`, `EXISTING_GUEST_SELECTED`, `BOOKING_CREATED`, with a stable operation identity, guest ID, reserved booking ID, normalized semantic payload digest, actor/hotel/request provenance and timestamps. A newly created guest, its initial operation row and `GUEST_CREATED` operation event are one atomic stage. Booking creation, exact room-night claims, `BOOKING_CREATED` operation event and transition to `BOOKING_CREATED` form the second atomic stage. Operation events use explicit authenticated actor/hotel/request fields; do not fabricate an Access session ID or mislabel the existing agent-only event format. Do not expose operation stage as a booking status.
- Same token + identical canonical payload returns/resumes the same operation and durable booking outcome; same token + changed payload returns typed conflict before further guest/booking/inventory/event mutation. A different token is required when the operator intentionally changes the reservation or selects an existing guest after an incomplete created-guest stage.
- Persist an incomplete-operation list/read for the selected hotel so a stage survives reload and can be recovered by an authorized hotel operator; return only the minimum guest and stage context required for recovery. The UI lets the operator select/use that created guest and create a separate reservation operation; it never silently changes the original token's payload. A staged operation that does not complete remains truthfully `GUEST_CREATED` or `EXISTING_GUEST_SELECTED`, not falsely completed.
- If the guest is created but the requested room/date becomes unavailable, retain the guest and incomplete operation, return an actionable conflict/recovery result, and allow the operator to select/reuse that guest in a **new** operation if changing reservation inputs. Do not infer that an existing guest with a matching email is the same person; do not silently merge or delete.
- On successful booking, authoritative post-write lookup returns the persisted booking. A response-loss retry returns that outcome, not a newly priced/recreated booking. The room quote remains governed by existing authoritative pricing at the actual winning booking mutation.
- Recovery lookup is hotel/tenant local, requires the existing applicable capability checks, and must not depend on a client-supplied hotel ID. Operation listing/read reveals no other tenant's identities.
- No expiration, purge, or silent cleanup of incomplete operation records/created guests is implemented in F0.8. Retention of minimal stage/provenance needed for recovery is durable; any finite retention/cleanup policy is explicitly deferred until an approved retention contract exists. Avoid duplicating guest PII in operation records where references/digests suffice.
- Do not fabricate payment entries, mutate payment ledger, create a guest-global financial account, or bypass existing D11/invoice behavior. Assert existing invoice/payment state after reservation creation; any invoice behavior must be the behavior of current approved code/migrations.

## Non-goals

- Guest deduplication/merge, guest edit/delete, global guest identity, abandoned-record expiry, background cleanup, generic workflow engine, cross-hotel transaction, redesign of Reception or Guests, unrelated booking edit/cancel/lifecycle, new reservation policies, billing/payment changes, capability vocabulary changes, Blocks A–H, real-data migration/cutover.

## Concurrency, atomicity and recovery requirements

Inventory the exact D1 statements and winning identities for every operation stage. Guest+operation stage and booking+claims+pricing/event stage must each be atomic within their own D1 transaction boundary. The overall staged workflow is recoverable, not represented as one cross-stage/cross-D1 atomic transaction. A zero-row primary write cannot be rescued by a later event/operation status write. Use stable server-created operation/entity identity and authoritative returned/persisted row checks; never rely on an exact aggregate `meta.changes` count when triggers can affect additional rows. Include token collision/ABA, simultaneous identical requests, simultaneous same-token/different-payload, guest-email collision, booking availability race, injected stage/audit failure, and response-loss after each committed stage. Assert every affected table and zero false-success events.

## QA and evidence

- Unit/domain validation for canonical payload digest equivalence and changed-payload conflict.
- Executing-D1 tests on a clean full hotel migration chain for initial guest+booking creation, same-token replay, different payload, guest-stage response loss, booking-stage response loss, booking failure after guest commit, concurrent same-token callers, token-stage replacement/ABA where applicable, duplicate email, availability/hold/overlap race, audit failure rollback, exact claims, booking/pricing segment, event/provenance, invoice and payment ledger state.
- API tests prove exact typed responses and authenticated capability/tenant routing. Do not label missing identity/unknown binding as RBAC evidence.
- Browser integration uses actual local Wrangler Worker + isolated migrated D1 + Vite. Prove Reception context, existing/new guest selection, reasoned field errors, incomplete-stage recovery after refresh, same-token replay, success queue refresh and no duplicate booking at 1280px and 375px. Mock-only tests are supplemental and explicitly labeled.
- Run focused tests, `npm run check`, types, web build and budgets, architecture fitness, critical query plans, Wrangler API/Web and staging-SPA dry-runs (dry-run only), relevant serial CF-I03–I06 regressions, migration replay/clean-chain rehearsal, browser runner process cleanup, `git diff --check`, STATUS parse and forbidden-scope audit. Preserve the shared broad product-flow runner missing-`playwright` caveat; do not claim it PASS unless repaired and rerun.

## All durable invariant classifications

| Invariant | Classification | Acceptance / rationale |
|---|---|---|
| INV-ATOMIC-001 | APPLIES | Exact operation/stage winner, zero-row behavior, ABA/token conflict, stage rollback and full durable state. |
| INV-AUDIT-001 | APPLIES | `GUEST_CREATED` / `BOOKING_CREATED` operation events and provenance rows exist exactly once iff each corresponding stage wins; failure creates no success audit/event. |
| INV-DOMAIN-001 | APPLIES | Explicit reservation-create command; no generic CRUD bypass. |
| INV-TENANT-001 | APPLIES | Authenticated hotel routes to isolated D1; second-hotel foreign token/object denial with zero drift. |
| INV-RBAC-001 | APPLIES | Existing guest/booking capability sets enforced by API on every stage/read; unknown role denied. |
| INV-PARITY-001 | APPLIES | Preserve current guest validation and booking/date/availability/pricing rules; no identity merge or silent semantic change. |
| INV-ENUM-001 | APPLIES | Any new persisted operation stage has one explicit canonical DB/API mapping and negative/transition tests; it is not substituted for booking status. |
| INV-UX-001 | APPLIES | Preserve operational task context and existing reservation workflow while making guest+booking recovery visible in Reception. |
| INV-ORDER-001 | N/A | No Reception queue ranking, deduplication, synthetic item or next-case ordering is changed. |
| INV-RESP-001 | APPLIES | Contracted material create/recovery controls execute at 1280px and 375px, not shell-only rendering. |
| INV-EVID-001 | APPLIES | Every integrated, persistence, recovery and responsive claim maps to named executable evidence; mocks are separate. |
| INV-LEGACY-001 | N/A | No legacy/history synthesis or backfill; existing records remain unchanged. |
| INV-MONEY-001 | APPLIES | Existing integer-cent booking total/pricing behavior and D11 ledger/invoice truth asserted; no payment fabrication/mutation; stage writes atomic. |
| INV-STATE-001 | APPLIES | Immutable implementation Artifact A then orchestration-only exact-head Boundary B and separate Independent Critic. |
| INV-CF-I07-001 | N/A | No admin/network/audit route; use existing canonical capability authority. |
| INV-CF-I07-002 | N/A | No admin semantic no-op mutation. |
| INV-CF-I07-003 | N/A | No role downgrade. |
| INV-CF-I07-004 | APPLIES | Integrated/regression runners that start Worker/Vite/browser must prove owned process cleanup before PASS. |
| INV-CF-I08-001 | N/A | No reporting arithmetic or analytics response. |
| INV-CF-I08-002 | N/A | No network fan-out/analytics. |
| INV-CF-I08-003 | N/A | No report date/state query. |
| INV-CF-I08-004 | N/A | No booking state/status enum expansion; operation stage is not a booking state. |
| INV-CF-I08-005 | N/A | No reporting clock/default range; booking dates use existing explicit hotel/request contract. |
| INV-SCOPE-001 | APPLIES | Scope audit limits change to F0.8 guest+reservation recovery; no later F0, Blocks A–H or real data. |

## Internal contract review

Peirce (separate read-only Contract Reviewer, GPT-6 Luna Medium) confirmed that same-token replay, changed-payload conflict, recovery lookup, tenant isolation and response-loss requirements are specified; no retention duration is approved. Durable retention without expiry satisfies recovery without a new Human Gate; any future finite cleanup policy is deferred. Follow-up source inspection found the existing booking `agent_mutation_events` shape is agent-session-specific and the normal Reception route does not provide that provenance; this contract therefore requires explicit F0.8 operation-stage audit events rather than manufacturing an agent session identity. The contract closes stage-state, payload semantics and recovery authorization before code changes.

## Gate and recovery

Development evidence is complete only when all applicable criteria above pass; no aggregate Foundation 0 PASS is claimed. Fresh independent critic must review exact immutable Artifact A + orchestration-only Boundary B before proceeding past this increment. No Human Gate is identified by this contract. On any failed technical test, repair within F0.8 and rerun. A guest already committed by a successful stage is never silently deleted; failed reservation stage retains that guest and the operation for explicit recovery. Real-data retention/cutover policy remains outside this authorization.
