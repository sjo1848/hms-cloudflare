# ACP 2.5 HMS — Pre-Critic Gate

Substantive artifact A: `a9cf1fe45a510f82d4725236fa7693ba9a2b376e`  
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
| Zero-row create race | PASS | Repository returns authoritative INSERT result; service maps `meta.changes !== 1` directly to `CONFLICT`, avoiding the prior revalidation race. Focused test keeps references valid while insert returns zero and still requires `CONFLICT`. |
| Unexpected persistence failure | PASS | A thrown persistence error with valid inventory remains `INTERNAL_ERROR`, distinct from the conditional zero-row business race. |
| Migration safety | PASS | Initial 0012 collision was caught; replacement migration 0018 rehearses successfully. |
| Foundation | PASS | `33289871047` SUCCESS on artifact A; auxiliary branch Foundation `33289869352` also SUCCESS. |
| Product Flow / D1 | PASS | `33289871006`: Worker+D1, migration rehearsal and historical CF-I03→CF-I08 regressions SUCCESS. |
| UX/mobile | PASS | `33289870953` SUCCESS. |
| Invariants | PASS | `.orchestration/evidence/ACP-2.5-HMS-INVARIANTS.md`; no applicable HMS-side FAIL/UNPROVEN. |
| Prior P1: stale state | ADDRESSED | State and Task Contract reflect approved Phase 2.5. |
| Prior P1: missing provenance | ADDRESSED | Durable same-batch provenance added. |
| Prior P1: cancellation winner attribution | ADDRESSED | Winner-bound pre-transition provenance claim + race coverage. |
| Prior P1: stale/frozen evidence | ADDRESSED | Evidence is now anchored to final artifact A and exact successful CI runs. |
| Prior P2: zero-row create classification | ADDRESSED | Final artifact uses authoritative INSERT `meta.changes`, superseding the post-create revalidation approach. |
| Independent Critic | REQUIRED | Fresh external review must inspect artifact A + publication evidence before merge. |

## Defects found and closed before Critic

1. Obsolete Access Human Gate persisted in repo state → reconciled to explicit Phase 2.5 staging-only authorization.
2. Agent create/cancel lacked durable HMS attribution → migration 0018 + trusted provenance + same-batch D1 event.
3. Initial migration number collided with existing 0012 → rehearsal caught it; migration moved to 0018 after existing sequence.
4. Cancellation event could misattribute a race loser → event now claims only pre-transition CONFIRMED state before update in the same transaction.
5. Initial zero-row create handling relied on a later availability revalidation. That state could become valid again and incorrectly preserve an INTERNAL_ERROR path. Final artifact A returns the canonical INSERT batch result and classifies `meta.changes === 0` immediately as `CONFLICT`.
6. Evidence previously described the superseded zero-row approach → evidence refreshed to artifact A and exact final CI.

## Exact executable gates

- Foundation: `33289871047` — SUCCESS.
- Product Flow / Worker+D1 / migration / historical regressions: `33289871006` — SUCCESS.
- UX/mobile browser: `33289870953` — SUCCESS.
- Additional Foundation: `33289869352` — SUCCESS.
- Substantive artifact: `a9cf1fe45a510f82d4725236fa7693ba9a2b376e`.

## Next boundary

Product code is frozen at artifact A. Evidence-only publication may move the branch head but does not alter artifact A. A fresh Independent Critic must review PR #28 against artifact A, the Task Contract, invariant evidence and this Pre-Critic publication. No merge to `deploy/staging` until that external gate passes.

Cross-repository Agent Core deployment/E2E remains downstream and is not claimed here.
