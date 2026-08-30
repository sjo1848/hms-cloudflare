# ACP 2.5 HMS — Pre-Critic Gate

Substantive artifact A: `70fae5c902af557eadc2802ba773f44b9f95fd46`  
Review scope: HMS portion of `ACP-2.5-HMS-CONTROLLED-RESERVATION`.

| Gate | Result | Exact evidence |
|---|---|---|
| Human authorization / bounded scope | PASS | staging-only create + controlled cleanup; no production, paid, real-data or payment mutation. |
| Capability + hotel grant | PASS | backend `reservation.write` / `reservation.cancel` + allowed hotel grant fail closed. |
| Canonical HMS business rules | PASS | `AgentHmsReservationService` reuses `D1BookingRepository`. |
| Persistent idempotency | PASS | deterministic booking identity; replay/conflict/zero-row create covered. |
| Durable provenance | PASS | migration 0018 stores actor/tenant/hotel/session/trace/action/booking/timestamp without raw operation token. |
| Create atomicity | PASS | booking + claims + CREATE provenance share D1 batch. |
| Cancellation winner attribution | PASS | production `D1BookingRepository.cancel()` is executed against local D1 in artifact A. ACP-winning case asserts update=1, CANCELLED booking, inventory=0, exactly one exact provenance event; ordinary-winner case asserts ACP update=0, original winner timestamp preserved, inventory=0, events=`[]`. |
| Zero-row create classification | PASS | authoritative INSERT `meta.changes !== 1` -> CONFLICT. |
| Foundation | PASS | `33290659971` SUCCESS. |
| Product Flow / D1 / migrations / CF-I03→CF-I08 | PASS | `33290660015` SUCCESS. |
| UX/mobile | PASS | `33290659940` SUCCESS. |
| Full invariant registry | PASS | `ACP-2.5-HMS-INVARIANTS.md` classifies every `INV-*` as APPLIES/N/A with evidence/rationale. |
| Independent Critic | REQUIRED | fresh external review must inspect artifact A before merge. |

## Defects closed during the gate

1. stale authorization state;
2. missing durable mutation provenance;
3. migration-number collision;
4. false cancellation attribution race;
5. stale exact-head evidence;
6. incomplete invariant classification;
7. zero-row create classification and ABA-safe authoritative INSERT result;
8. cancellation winner evidence upgraded from captured SQL to an executing-D1 adversarial test.

## Exact executable gates

- Foundation: `33290659971` — SUCCESS.
- Product Flow / Worker+D1 / migration rehearsal / historical regressions: `33290660015` — SUCCESS.
- UX/mobile browser: `33290659940` — SUCCESS.
- Substantive artifact A: `70fae5c902af557eadc2802ba773f44b9f95fd46`.

## Next boundary

Product code is frozen at artifact A. Publication commits after A are orchestration/evidence only. A fresh Independent Critic must review PR #28 against artifact A and this publication before merge to `deploy/staging`. Cross-repository deployment/E2E remains downstream and is not claimed here.
