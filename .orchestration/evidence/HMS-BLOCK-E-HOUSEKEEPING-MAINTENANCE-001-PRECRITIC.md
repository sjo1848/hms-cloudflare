# Block E — Pre-Critic Admission Record

Task Contract `.orchestration/contracts/HMS-BLOCK-E-HOUSEKEEPING-MAINTENANCE-001.md` and exact surface inventory, evidence matrix and 24-invariant classification are frozen before product changes at base `3f06c7b52b8c5f57754e705071b7cee6a5668d05`.

## Admission checks

- [x] Approved Block E row, dependencies and Blueprint traceability found; B is not a start prerequisite.
- [x] Current UI/API/capabilities/DB/workflow inventory recorded.
- [x] Existing maintenance semantics and J-06 source parity mapped; no new transition, status, capability or role rule proposed.
- [x] New allowed fields are bounded read-only projections in the existing tenant-scoped board: existing event history and already-confirmed booking risk under existing room/date/impact facts. No new endpoint/schema/data mutation policy.
- [x] Explicit non-goals and stop condition for any need to invent domain semantics or cross module boundary.
- [x] All 24 invariants classified and mapped to acceptance/evidence.
- [x] Mutation/concurrency sweep: room state version and exact case/room conditions; D1 batch; event insertion coupled to command; failures/stale identity must yield conflict and zero drift; test duplicate, stale K1→K2 and ABA.
- [x] Security sweep: central `hasCapability`, authenticated hotel routing, capability denial with verified identity/membership and zero side effects, cross-tenant read/write isolation.
- [x] UX/source sweep: queue ordering, target enum semantic normalization, checked-in departure blocker, orphan visibility/safety, per-case draft, mobile focus entry/return, context after authoritative refresh.
- [x] Evidence sweep: executing D1 for integrated claims; browser asserts task controls and visible state; screenshots are supporting evidence only; no global claim beyond executed regressions.
- [x] Budget gate recorded: ceilings unchanged JS raw/gzip 330000/100000, CSS 55000/15000; baseline JS 329618/93456 and CSS 54297/10138. 382 B JS raw and 703 B CSS raw headroom at start. Build early and stop at required budget gate if not recoverable within contract.
- [x] No real data, cutover, remote D1, staging, deployment, paid resource, PR, merge or protected-branch action.

## Admission decision

**PASS — admitted to implementation under the frozen Block E contract.** This is a pre-code method/scope decision only; it does not prove implementation, evidence, invariant completion, technical PASS or Independent Critic PASS. No unresolved product policy question was identified in the approved Block E requirements. Final Pre-Critic remains mandatory before Artifact A.
