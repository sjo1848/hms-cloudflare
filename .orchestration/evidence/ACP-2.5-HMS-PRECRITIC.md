# ACP 2.5 HMS — Pre-Critic Gate

Substantive artifact A: `61b614fb21d5d3d51595e22030a0b551e6614c1a`  
Review scope: HMS portion of `ACP-2.5-HMS-CONTROLLED-RESERVATION`.

| Gate | Result | Exact evidence |
|---|---|---|
| Human authorization persisted | PASS | `.orchestration/STATE.md` + `STATUS.json`; staging-only create + token-bound cleanup authorized. |
| Task Contract | PASS | `.orchestration/contracts/ACP-2.5-HMS-CONTROLLED-RESERVATION.md`. |
| Scope bounded | PASS | No production, paid resources, real-data migration, payment side effects or unrelated UX. |
| Capability + hotel grant | PASS | `reservation.write` / `reservation.cancel` + allowedHotelIds fail closed before mutation. |
| Tenant routing | PASS | Control-plane binding remains trusted; no model/user D1 binding choice. |
| Canonical business semantics | PASS | `D1BookingRepository` reused for guest/room/hold/inventory and integer-cent total. |
| Persistent idempotency | PASS | Deterministic trusted-context booking identity; replay/conflict/concurrency covered. |
| Token-bound cleanup | PASS | Cancellation booking id derives from original trusted operation token. |
| Durable provenance | PASS | Migration 0018 stores actor/tenant/hotel/session/trace/action/booking/timestamp; raw operation token absent. |
| Create audit atomicity | PASS | Create + room-night claims + CREATE provenance share one D1 batch. |
| Cancel audit atomicity | PASS | CANCEL provenance claim + conditional CONFIRMED→CANCELLED update + inventory cleanup share one D1 batch. |
| Cancellation winner attribution | PASS | CANCEL event is allowed only while booking is CONFIRMED and executes before the conditional transition in the same transaction. Already-cancelled race cannot create a false ACP event. |
| Exactly-once provenance | PASS | Deterministic event id + DB uniqueness + replay behavior. |
| Failure classification | PASS | Unexpected persistence failure remains INTERNAL_ERROR if inventory is still valid. |
| Migration safety | PASS | Accidental 0012 collision caught; replacement 0018; fresh rehearsal passes. |
| Foundation | PASS | `33288020198` SUCCESS on artifact A. |
| Product Flow / D1 | PASS | `33288020169`: Worker+D1 PASS, migration rehearsal PASS, CF-I03→CF-I08 PASS after one bounded rerun for transient local `SQLITE_BUSY`. |
| UX/mobile | PASS | `33288020210` SUCCESS. |
| Invariants | PASS | `.orchestration/evidence/ACP-2.5-HMS-INVARIANTS.md`; no HMS-side FAIL/UNPROVEN. |
| Prior P1: stale state | ADDRESSED | State and Task Contract now reflect approved Phase 2.5. |
| Prior P1: missing provenance | ADDRESSED | Durable same-batch provenance added. |
| Fresh P1: cancellation winner attribution | ADDRESSED | Artifact A changes order/predicate and adds focused race-boundary test. |
| Independent Critic | REQUIRED | Fresh external review must inspect artifact A + publication evidence before merge. |

## Defects found and closed before Critic

1. Obsolete Access Human Gate persisted in repo state → reconciled to explicit Phase 2.5 staging-only authorization.
2. Agent create/cancel lacked durable HMS attribution → migration 0018 + trusted provenance + same-batch D1 event.
3. Initial migration number collided with existing 0012 → rehearsal caught it; new migration moved after 0012–0017.
4. Cancellation event originally relied on final CANCELLED status and could misattribute a race loser → event now claims only pre-transition CONFIRMED state before update in the same transaction; focused test covers zero-update race.
5. One historical-regression attempt hit local workerd `SQLITE_BUSY`; one bounded rerun passed the entire CF-I03→CF-I08 suite. No product assertion was relaxed or skipped.

## Exact executable gates

- Foundation: `33288020198` — SUCCESS.
- Product Flow / Worker+D1 / migration / historical regressions: `33288020169` — SUCCESS.
- UX/mobile browser: `33288020210` — SUCCESS.
- Substantive artifact: `61b614fb21d5d3d51595e22030a0b551e6614c1a`.

## Next boundary

Product code is frozen at artifact A. Evidence-only publication may move the branch head but does not alter artifact A. A fresh Independent Critic must review PR #28 against artifact A, the Task Contract, invariants and this Pre-Critic publication. No merge to `deploy/staging` until that external gate passes.

Cross-repository ACP deploy/E2E remains downstream and is not claimed here.
