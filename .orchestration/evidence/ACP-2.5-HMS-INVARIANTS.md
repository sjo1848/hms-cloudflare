# ACP 2.5 HMS — Invariant Evidence

Substantive artifact A: `70fae5c902af557eadc2802ba773f44b9f95fd46`  
Task Contract: `.orchestration/contracts/ACP-2.5-HMS-CONTROLLED-RESERVATION.md`  
Scope: controlled reservation create/cancel RPC for AI Commerce Platform against HMS **staging only**.

## Complete durable invariant registry classification

| Registry invariant | Classification | Result / rationale | Evidence |
|---|---|---|---|
| `INV-ATOMIC-001` | APPLIES | PASS — conditional create/cancel inspect authoritative D1 mutation results; business mutation and provenance are transactionally coupled. | reservation/repository tests; executing-D1 cancellation race test; Foundation `33290659971`; Product Flow `33290660015`. |
| `INV-AUDIT-001` | APPLIES | PASS — successful ACP cancel emits exactly one event; losing/replayed cancellation emits none. This is now proven on executing D1, not only captured SQL. | `d1-booking-repository.executing-d1.test.ts`: winning case asserts booking CANCELLED, inventory 0, exactly one event with exact tenant/hotel/actor/session/trace/timestamp; losing case asserts update changes 0, inventory 0 and events `[]`. |
| `INV-DOMAIN-001` | APPLIES | PASS — explicit reservation domain operations reuse canonical `D1BookingRepository`; no generic state PATCH. | service/repository code + Product Flow `33290660015`. |
| `INV-TENANT-001` | APPLIES | PASS — server-side hotel grant/routing selects operational D1; user/model cannot choose binding. | capability/routing tests. |
| `INV-RBAC-001` | APPLIES | PASS — `reservation.write` / `reservation.cancel` enforced at backend Service Binding boundary. | Foundation `33290659971`. |
| `INV-PARITY-001` | N/A | Integration into accepted HMS target; no new source capability migration. | Task scope. |
| `INV-ENUM-001` | N/A | No enum representation change. | Diff audit. |
| `INV-UX-001` | N/A | Private RPC only; no HMS workflow redesign. | UX regression `33290659940` SUCCESS. |
| `INV-ORDER-001` | N/A | No operational queue/ranking semantics changed. | Diff audit. |
| `INV-RESP-001` | N/A | No new responsive journey contracted. | UX regression `33290659940`. |
| `INV-EVID-001` | APPLIES | PASS — claims are tied to exact executable proof; staging deployment/E2E remain explicitly unclaimed. | exact artifact/run IDs below. |
| `INV-LEGACY-001` | N/A | No legacy/backfill synthesis. | Diff audit. |
| `INV-MONEY-001` | APPLIES | PASS — totals stay integer cents; no payment mutation. | unit tests + inherited billing regression in `33290660015`. |
| `INV-STATE-001` | APPLIES | PASS — artifact A is immutable substantive tree; later publication commits record exact A and external-review requirement. | Pre-Critic + STATUS. |
| `INV-CF-I07-001` | N/A | No admin/network route introduced. | Diff audit. |
| `INV-CF-I07-002` | N/A | No role/plan no-op mutation. | Diff audit. |
| `INV-CF-I07-003` | N/A | No role downgrade. | Diff audit. |
| `INV-CF-I07-004` | APPLIES | PASS — regression runners terminate successfully. | Product Flow `33290660015`; UX `33290659940`. |
| `INV-CF-I08-001` | N/A | No analytics arithmetic change. | Diff audit. |
| `INV-CF-I08-002` | N/A | No network analytics fan-out. | Diff audit. |
| `INV-CF-I08-003` | N/A | No report date/state semantics changed. | Diff audit. |
| `INV-CF-I08-004` | N/A | No state expansion; migration 0018 only adds provenance storage. | migration audit. |
| `INV-CF-I08-005` | N/A | No reporting clock/default behavior. | Diff audit. |
| `INV-SCOPE-001` | APPLIES | PASS — staging-only create/cancel/cleanup; no production, paid expansion, real-data migration, payment mutation or unrelated UX. | Task Contract + diff. |

## Review finding closure

- persisted authorization boundary: PASS.
- durable same-batch mutation provenance: PASS.
- cancellation winner attribution: PASS on **executing D1** in artifact A.
- complete `INV-*` classification: PASS.
- zero-row create race: PASS via authoritative INSERT `meta.changes`.
- exact-head evidence: PASS; every run below is on artifact A.

## Exact executable gates for artifact A

- Foundation: `33290659971` — SUCCESS; includes the executing-D1 cancellation winner/loser proof.
- Product Flow / Worker+D1 / migration rehearsal / historical CF-I03→CF-I08: `33290660015` — SUCCESS.
- UX/mobile browser: `33290659940` — SUCCESS.
- Substantive artifact A: `70fae5c902af557eadc2802ba773f44b9f95fd46`.

No applicable HMS-side invariant remains `FAIL` or `UNPROVEN`. HMS staging deployment and cross-repository ACP E2E remain downstream gates after Independent Critic PASS.
