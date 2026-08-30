# ACP 2.5 HMS — Invariant Evidence

Substantive artifact A: `a8cf9e025fa53c26a0d3ac6ce5747a15fc5bd219`  
Task Contract: `.orchestration/contracts/ACP-2.5-HMS-CONTROLLED-RESERVATION.md`  
Scope: controlled reservation create/cancel RPC for AI Commerce Platform against HMS **staging only**. No production, paid expansion, payment mutation or real-data migration.

## Complete durable invariant registry classification

Every registry entry in `.orchestration/INVARIANTS.md` is classified below as `APPLIES` or `N/A`; applicable entries include an executable or immutable evidence path.

| Registry invariant | Classification | Result / rationale | Evidence |
|---|---|---|---|
| `INV-ATOMIC-001` | APPLIES | PASS — create and cancel are conditional aggregate mutations; zero-row races cannot report success and business mutation/audit share one logical D1 batch. | `D1BookingRepository.create/cancel`; `d1-booking-repository.agent-provenance.test.ts`; reservation service race tests; Foundation `33288424574`; Product Flow `33288424576`. |
| `INV-AUDIT-001` | APPLIES | PASS — successful ACP mutation emits exactly one durable provenance event; replay/stale/losing transition emits none. | migration `0018_agent_mutation_provenance.sql`; deterministic event keys/uniqueness; create/cancel replay tests; cancellation winner race test. |
| `INV-DOMAIN-001` | APPLIES | PASS — ACP does not generic-PATCH booking state; it calls explicit reservation service operations and reuses canonical booking repository/domain rules. | `AgentHmsReservationService.createReservation/cancelReservation`; existing canonical D1 booking repository; Product Flow `33288424576`. |
| `INV-TENANT-001` | APPLIES | PASS — tenant/hotel grant and server-side route select the operational D1; user/model input cannot choose a D1 binding or another hotel. | `AgentHmsService` caller props; `agent-hms-authorization.ts`; `resolveAgentHotel`; denied grant/capability tests. |
| `INV-RBAC-001` | APPLIES | PASS — backend Service Binding capability enforcement is authoritative for `reservation.write` / `reservation.cancel`. | capability tests and authorization boundary in `AgentHmsService`; Foundation `33288424574`. |
| `INV-PARITY-001` | N/A | This increment is ACP integration into the already accepted HMS target, not migration of a new accepted source capability. Existing HMS booking semantics are nevertheless reused rather than weakened. | Scope/Task Contract. |
| `INV-ENUM-001` | N/A | No source→target enum representation change is introduced. Booking status uses existing HMS canonical values. | Diff/scope audit. |
| `INV-UX-001` | N/A | No HMS user journey/UI is redesigned by this increment; the new surface is a private Service Binding RPC. | PR diff; UX regression `33288424566` confirms existing UI is unaffected. |
| `INV-ORDER-001` | N/A | No queue/list ranking, prioritization or synthetic next-item selection is introduced or changed. | Diff/scope audit. |
| `INV-RESP-001` | N/A | No new responsive HMS journey is contracted. Existing UX/mobile still regresses green. | UX/browser `33288424566`. |
| `INV-EVID-001` | APPLIES | PASS — claims in this file are restricted to exact code/runs; no mock/local evidence is presented as staging deployment or cross-repo E2E. | Exact artifact A + run IDs below; staging/E2E explicitly remain downstream. |
| `INV-LEGACY-001` | N/A | No missing historical case/record is synthesized for legacy recovery. | Diff/scope audit. |
| `INV-MONEY-001` | APPLIES | PASS — quote-derived booking totals remain integer cents using canonical `totalCents`; no payment/settlement mutation is added. | reservation service tests; Foundation `33288424574`; inherited billing regression in Product Flow `33288424576`. |
| `INV-STATE-001` | APPLIES | PASS — artifact A is immutable product code; later orchestration-only publication commits record exact A and require external review. | this file + `ACP-2.5-HMS-PRECRITIC.md` + `STATUS.json`; compare confirms publication commits do not alter product behavior. |
| `INV-CF-I07-001` | N/A | No admin/audit/network role-name protected route is introduced; ACP uses explicit Service Binding capabilities instead. | Diff/scope audit. |
| `INV-CF-I07-002` | N/A | No role/plan/admin same-value mutation is introduced. | Diff/scope audit. |
| `INV-CF-I07-003` | N/A | No role downgrade operation is in scope. | Diff/scope audit. |
| `INV-CF-I07-004` | APPLIES | PASS — inherited regression runners start local Worker/browser processes and complete their owned runs successfully. | Product Flow `33288424576`; UX/browser `33288424566`; existing runner cleanup traps/post-run cleanup remain unchanged. |
| `INV-CF-I08-001` | N/A | No analytics/revenue/occupancy/ADR/RevPAR surface changes. | Diff/scope audit. |
| `INV-CF-I08-002` | N/A | No multi-hotel network analytics fan-out is introduced. | Diff/scope audit. |
| `INV-CF-I08-003` | N/A | No report date/state semantics are changed. | Diff/scope audit. |
| `INV-CF-I08-004` | N/A | No schema state expansion is introduced by 2.5. | migration 0018 only adds provenance table/indexes. |
| `INV-CF-I08-005` | N/A | No report clock defaults or reporting continuity surface is changed. | Diff/scope audit. |
| `INV-SCOPE-001` | APPLIES | PASS — accelerated ACP integration remains bounded to staging create/cancel + cleanup; no production, paid resource, real-data migration, payment mutation or unrelated UX scope was absorbed. | Task Contract + PR diff + `STATUS.json`. |

## Requirement → Expected Surface → Acceptance → Evidence

| Requirement | Result | Expected surface | Acceptance / exact evidence |
|---|---|---|---|
| Human-authorized scope | PASS | state + Task Contract | Phase 2.5 staging-only create + controlled cleanup persisted; forbidden scopes remain explicit. |
| Capability + hotel grant | PASS | Service Binding boundary | Missing `reservation.write`/`reservation.cancel` or ungranted hotel fails closed before mutation. |
| Canonical booking semantics | PASS | reservation service + canonical repository | Guest/room/hold/inventory validation, integer-cent total and CONFIRMED booking reuse HMS rules. |
| Persistent idempotency | PASS | deterministic booking identity in D1 | Same token/same payload replays; same token/different payload conflicts; identity survives isolate replacement. |
| Zero-row create race | PASS | post-create read + revalidation | If `INSERT ... SELECT` creates no booking because availability/reference changed after validation, the result is `CONFLICT`; a genuine persistence inconsistency with still-valid references remains `INTERNAL_ERROR`. Artifact A contains this correction. |
| Create provenance | PASS | D1 batch + migration 0018 | Booking/claims/CREATE event are atomic; event stores tenant/hotel/actor/session/trace and no raw operation token. |
| Cancel winner attribution | PASS | D1 cancel batch | CANCEL event can be claimed only while booking is still CONFIRMED in the same transaction; a caller arriving after another cancellation produces no ACP event. |
| Cancel cleanup | PASS | token-bound cancellation | Only booking derived from same trusted operation token may be cancelled; replay is safe. |
| Existing HMS regressions | PASS | inherited suites | Foundation `33288424574`; Product Flow / migration / CF-I03→CF-I08 `33288424576`; UX/mobile browser `33288424566`. |
| Cost/scope guard | PASS | configuration/diff | No paid resource, production route, custom domain, real data or unrelated UX scope. |

## Review finding closure

- **P1 — persisted authorization boundary:** closed by authoritative Phase 2.5 state + Task Contract.
- **P1 — durable reservation mutation provenance:** closed by migration 0018 + trusted provenance + same-batch writes.
- **P1 — cancellation provenance race:** closed by winner-bound event claim and deterministic zero-row race test.
- **P1 — exact-head evidence:** closed here; all executable gates cited below were run against artifact A `a8cf9e025fa53c26a0d3ac6ce5747a15fc5bd219`.
- **P1 — classify every registry invariant:** closed by the complete `INV-*` table above.
- **P1 — publish external-review boundary:** publication `STATUS.json` is updated after this evidence commit to point exactly to artifact A with `external_review.required=true`.
- **P2 — zero-row create race classification:** closed in artifact A by post-create state/revalidation classification; ordinary availability/reference races return `CONFLICT` instead of `INTERNAL_ERROR`.

## Exact executable gates for artifact A

- Foundation: `33288424574` — SUCCESS.
- Product Flow / Worker+D1 / migration rehearsal / CF-I03→CF-I08: `33288424576` — SUCCESS.
- UX/mobile browser: `33288424566` — SUCCESS.
- Substantive artifact A: `a8cf9e025fa53c26a0d3ac6ce5747a15fc5bd219`.

No applicable HMS-side durable invariant is `FAIL` or `UNPROVEN`. This document does **not** claim HMS staging deployment of artifact A or cross-repository ACP E2E; those remain downstream gates after Independent Critic PASS.