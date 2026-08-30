# ACP 2.5 HMS — Invariant Evidence

Substantive artifact A: `a9cf1fe45a510f82d4725236fa7693ba9a2b376e`  
Task Contract: `.orchestration/contracts/ACP-2.5-HMS-CONTROLLED-RESERVATION.md`  
Scope: controlled reservation create/cancel RPC for AI Commerce Platform against HMS **staging only**. No production, paid expansion, payment mutation or real-data migration.

## Complete durable invariant registry classification

Every registry entry in `.orchestration/INVARIANTS.md` is classified below as `APPLIES` or `N/A`; applicable entries include an executable or immutable evidence path.

| Registry invariant | Classification | Result / rationale | Evidence |
|---|---|---|---|
| `INV-ATOMIC-001` | APPLIES | PASS — create and cancel are conditional aggregate mutations; the authoritative INSERT result is inspected directly so a zero-row create cannot report success even if state later becomes valid; business mutation/audit share one logical D1 batch. | `D1BookingRepository.create/cancel`; `AgentHmsReservationService`; reservation race tests; exact CI below. |
| `INV-AUDIT-001` | APPLIES | PASS — successful ACP mutation emits exactly one durable provenance event; replay/stale/losing transition emits none. | migration `0018_agent_mutation_provenance.sql`; deterministic event keys/uniqueness; create/cancel replay tests; cancellation winner race test. |
| `INV-DOMAIN-001` | APPLIES | PASS — ACP does not generic-PATCH booking state; it calls explicit reservation service operations and reuses canonical booking repository/domain rules. | `AgentHmsReservationService.createReservation/cancelReservation`; canonical D1 booking repository; Product Flow `33289871006`. |
| `INV-TENANT-001` | APPLIES | PASS — tenant/hotel grant and server-side route select the operational D1; user/model input cannot choose a D1 binding or another hotel. | `AgentHmsService` caller props; `agent-hms-authorization.ts`; `resolveAgentHotel`; denied grant/capability tests. |
| `INV-RBAC-001` | APPLIES | PASS — backend Service Binding capability enforcement is authoritative for `reservation.write` / `reservation.cancel`. | capability tests and authorization boundary in `AgentHmsService`; Foundation `33289871047`. |
| `INV-PARITY-001` | N/A | This increment is ACP integration into the already accepted HMS target, not migration of a new accepted source capability. Existing HMS booking semantics are nevertheless reused rather than weakened. | Scope/Task Contract. |
| `INV-ENUM-001` | N/A | No source→target enum representation change is introduced. Booking status uses existing HMS canonical values. | Diff/scope audit. |
| `INV-UX-001` | N/A | No HMS user journey/UI is redesigned by this increment; the new surface is a private Service Binding RPC. | PR diff; UX regression `33289870953` confirms existing UI is unaffected. |
| `INV-ORDER-001` | N/A | No queue/list ranking, prioritization or synthetic next-item selection is introduced or changed. | Diff/scope audit. |
| `INV-RESP-001` | N/A | No new responsive HMS journey is contracted. Existing UX/mobile still regresses green. | UX/browser `33289870953`. |
| `INV-EVID-001` | APPLIES | PASS — claims in this file are restricted to exact code/runs; no mock/local evidence is presented as staging deployment or cross-repo E2E. | Exact artifact A + run IDs below; staging/E2E explicitly remain downstream. |
| `INV-LEGACY-001` | N/A | No missing historical case/record is synthesized for legacy recovery. | Diff/scope audit. |
| `INV-MONEY-001` | APPLIES | PASS — quote-derived booking totals remain integer cents using canonical `totalCents`; no payment/settlement mutation is added. | reservation service tests; Foundation `33289871047`; inherited billing regression in Product Flow `33289871006`. |
| `INV-STATE-001` | APPLIES | PASS — artifact A is immutable product code; later orchestration-only publication commits record exact A and require external review. | this file + `ACP-2.5-HMS-PRECRITIC.md` + `STATUS.json`. |
| `INV-CF-I07-001` | N/A | No admin/audit/network role-name protected route is introduced; ACP uses explicit Service Binding capabilities instead. | Diff/scope audit. |
| `INV-CF-I07-002` | N/A | No role/plan/admin same-value mutation is introduced. | Diff/scope audit. |
| `INV-CF-I07-003` | N/A | No role downgrade operation is in scope. | Diff/scope audit. |
| `INV-CF-I07-004` | APPLIES | PASS — inherited regression runners start local Worker/browser processes and complete their owned runs successfully. | Product Flow/historical regressions `33289871006`; UX/browser `33289870953`. |
| `INV-CF-I08-001` | N/A | No analytics/revenue/occupancy/ADR/RevPAR surface changes. | Diff/scope audit. |
| `INV-CF-I08-002` | N/A | No multi-hotel network analytics fan-out is introduced. | Diff/scope audit. |
| `INV-CF-I08-003` | N/A | No report date/state semantics are changed. | Diff/scope audit. |
| `INV-CF-I08-004` | N/A | No schema state expansion is introduced by 2.5 beyond provenance migration 0018. | migration 0018 only adds provenance table/indexes. |
| `INV-CF-I08-005` | N/A | No report clock defaults or reporting continuity surface is changed. | Diff/scope audit. |
| `INV-SCOPE-001` | APPLIES | PASS — accelerated ACP integration remains bounded to staging create/cancel + cleanup; no production, paid resource, real-data migration, payment mutation or unrelated UX scope was absorbed. | Task Contract + PR diff + `STATUS.json`. |

## Requirement → Expected Surface → Acceptance → Evidence

| Requirement | Result | Expected surface | Acceptance / exact evidence |
|---|---|---|---|
| Human-authorized scope | PASS | state + Task Contract | Phase 2.5 staging-only create + controlled cleanup persisted; forbidden scopes remain explicit. |
| Capability + hotel grant | PASS | Service Binding boundary | Missing `reservation.write`/`reservation.cancel` or ungranted hotel fails closed before mutation. |
| Canonical booking semantics | PASS | reservation service + canonical repository | Guest/room/hold/inventory validation, integer-cent total and CONFIRMED booking reuse HMS rules. |
| Persistent idempotency | PASS | deterministic booking identity in D1 | Same token/same payload replays; same token/different payload conflicts; identity survives isolate replacement. |
| Zero-row create race | PASS | authoritative D1 INSERT result | `D1BookingRepository.create` returns the first D1 batch result; `AgentHmsReservationService` classifies `meta.changes !== 1` immediately as `CONFLICT`. It no longer relies on a later availability revalidation that could race back to valid. Focused test keeps references valid while the canonical insert reports zero rows and still requires `CONFLICT`. |
| Unexpected persistence failure | PASS | exception path | A genuine thrown persistence failure with still-valid references remains `INTERNAL_ERROR`; it is distinct from the zero-row conditional-insert business race. |
| Create provenance | PASS | D1 batch + migration 0018 | Booking/claims/CREATE event are atomic; event stores tenant/hotel/actor/session/trace and no raw operation token. |
| Cancel winner attribution | PASS | D1 cancel batch | CANCEL event can be claimed only while booking is still CONFIRMED in the same transaction; a caller arriving after another cancellation produces no ACP event. |
| Cancel cleanup | PASS | token-bound cancellation | Only booking derived from same trusted operation token may be cancelled; replay is safe. |
| Existing HMS regressions | PASS | inherited suites | Foundation `33289871047`; Product Flow / migration / historical CF-I03→CF-I08 `33289871006`; UX/mobile browser `33289870953`. |
| Cost/scope guard | PASS | configuration/diff | No paid resource, production route, custom domain, real data or unrelated UX scope. |

## Review finding closure

- **P1 — persisted authorization boundary:** closed by authoritative Phase 2.5 state + Task Contract.
- **P1 — durable reservation mutation provenance:** closed by migration 0018 + trusted provenance + same-batch writes.
- **P1 — cancellation provenance race:** closed by winner-bound event claim and deterministic zero-row race test.
- **P1 — exact-head evidence:** refreshed here; all executable gates below run on artifact A `a9cf1fe45a510f82d4725236fa7693ba9a2b376e`.
- **P1 — classify every registry invariant:** closed by the complete `INV-*` table above.
- **P1 — publish external-review boundary:** `STATUS.json` is refreshed after this evidence publication to point exactly to artifact A with `external_review.required=true`.
- **P2 — zero-row create race classification:** closed in artifact A by returning the authoritative booking INSERT result from the repository and inspecting `meta.changes` directly. The old post-create revalidation classification is explicitly superseded.

## Exact executable gates for artifact A

- Foundation: `33289871047` — SUCCESS.
- Product Flow / Worker+D1 / migration rehearsal / historical regressions CF-I03→CF-I08: `33289871006` — SUCCESS.
- UX/mobile browser: `33289870953` — SUCCESS.
- Additional branch Foundation run: `33289869352` — SUCCESS.
- Substantive artifact A: `a9cf1fe45a510f82d4725236fa7693ba9a2b376e`.

No applicable HMS-side durable invariant is `FAIL` or `UNPROVEN`. This document does **not** claim HMS staging deployment of artifact A or cross-repository ACP E2E; those remain downstream gates after Independent Critic PASS.
