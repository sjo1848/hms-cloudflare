# ACP 2.5 HMS — Pre-Critic Gate

Substantive artifact A: `30ec09e6dcab7fde3cf791290a69aab30fd6eb58`  
Review scope: HMS portion of `ACP-2.5-HMS-CONTROLLED-RESERVATION`.

| Gate | Result | Exact evidence |
|---|---|---|
| Human authorization persisted | PASS | `.orchestration/STATE.md` + `STATUS.json`; staging-only reservation/create + token-bound cleanup explicitly authorized. |
| Task Contract exists | PASS | `.orchestration/contracts/ACP-2.5-HMS-CONTROLLED-RESERVATION.md`. |
| Scope bounded | PASS | No production, paid resources, real-data migration, payment side effects or unrelated UX work. |
| Capability boundary | PASS | `reservation.write` / `reservation.cancel` authorization plus hotel grant fail closed before mutation. |
| Tenant routing | PASS | Control-plane binding resolution remains trusted; no model/user D1 binding choice. |
| Reservation business semantics | PASS | Canonical `D1BookingRepository` reused for guest/room/hold/inventory rules and integer-cent total. |
| Idempotency | PASS | Deterministic trusted-context booking identity; same-payload replay, different-payload conflict, concurrent replay tests. |
| Cleanup safety | PASS | Cancellation booking id must derive from original operation token; cancellation replay tested. |
| Durable provenance | PASS | `0018_agent_mutation_provenance.sql` + service/repository propagation stores actor/tenant/hotel/session/trace/action/booking/timestamp. |
| Provenance privacy | PASS | Raw operation token is not part of provenance schema or payload and is asserted absent in tests. |
| Mutation/audit atomicity | PASS | Focused repository test proves create+claims+CREATE event and cancel+claim cleanup+CANCEL event are each one D1 batch. |
| Exactly-once audit | PASS | Deterministic event key, DB uniqueness and replay behavior prevent duplicate create/cancel events. |
| Failure classification | PASS | Internal persistence faults remain INTERNAL_ERROR when inventory revalidation is still valid. |
| Migration safety | PASS | Collision defect discovered by rehearsal was repaired by moving new schema to migration 0018; fresh rehearsal PASS. |
| Foundation | PASS | GitHub Actions run `33287796048` SUCCESS on artifact A. |
| Product Flow / D1 | PASS | Run `33287796046`: real Worker+D1 integral product flow + migration rehearsal + CF-I03→CF-I08 historical regressions SUCCESS. |
| UX/mobile regression | PASS | Run `33287796053` SUCCESS. |
| Invariants | PASS | `.orchestration/evidence/ACP-2.5-HMS-INVARIANTS.md`; no HMS-side applicable FAIL/UNPROVEN remains. |
| P1 state review | ADDRESSED | Canonical state + Task Contract now reflect the Human-approved increment. |
| P1 provenance review | ADDRESSED | Durable same-batch provenance and focused atomicity tests added. |
| Independent Critic | REQUIRED | Specialist does not self-approve. External review must use this evidence, Task Contract, PR #28 patch and exact artifact A. |

## Requirement → Expected Surface → Acceptance → Evidence

1. **Controlled reservation write** → `AgentHmsService` + reservation service → capability + hotel grant + canonical D1 write → unit/service tests + Foundation/Product Flow PASS.
2. **Persistent idempotency** → deterministic booking identity + D1 booking → replay without duplicate and conflict on changed payload → reservation service tests.
3. **Durable risk provenance** → hotel migration + booking repository batch → attribution survives RPC/isolate and is exactly once → migration 0018 + repository atomicity test.
4. **Safe cleanup** → token-bound `cancelReservation` → only matching operation can cancel; replay does not duplicate mutation → service tests.
5. **No regression** → migration rehearsal + inherited suites + browser → all fresh gates pass on artifact A → runs `33287796046`, `33287796053`, `33287796048`.

## Defects found and closed during Pre-Critic

- Stale orchestration state incorrectly retained an old Access credential gate: reconciled before merge.
- Missing durable mutation provenance: implemented before merge.
- New provenance migration initially reused migration number `0012`: migration rehearsal failed as designed; migration was removed and recreated as `0018`, after existing `0012–0017`; fresh rehearsal passed.
- Added explicit repository-level evidence that provenance is in the same D1 batch as each business mutation.

## Next boundary

No merge is authorized by this document alone. The branch must be treated as frozen for product code while an Independent Critic reviews PR #28 against artifact A and this publication/evidence boundary. A fresh PASS is required before merge to `deploy/staging`.

Cross-repository ACP deployment/E2E remains a later integration gate; this Pre-Critic does not claim it.
