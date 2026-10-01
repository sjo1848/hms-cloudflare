# E-11 Stale Board Response Repair — Invariant Map

All registry invariants retain the frozen parent Block E classifications. This table records the repair-specific disposition for all 24 entries before code/test changes.

| Invariant | Applies? | Repair-specific evidence / rationale |
|---|---|---|
| INV-ATOMIC-001 | N/A | No business mutation or multi-write operation changes. |
| INV-AUDIT-001 | N/A | No event/audit mutation changes. |
| INV-DOMAIN-001 | N/A | No domain transition or API behavior changes. |
| INV-TENANT-001 | APPLIES | Browser race uses existing tenant-scoped board endpoint and synthetic hotel fixture; existing two-tenant assertions rerun. |
| INV-RBAC-001 | N/A | No capability or authorization surface changes. |
| INV-PARITY-001 | N/A | No source semantics or business rules change. |
| INV-ENUM-001 | N/A | No enum representation or predicate changes. |
| INV-UX-001 | APPLIES | Assert the visible workspace keeps the latest authoritative queue/case after stale response. |
| INV-ORDER-001 | N/A | No queue ordering or next-item behavior changes. |
| INV-RESP-001 | APPLIES | Existing responsive browser journey reruns; the race assertion is exercised on a contracted workspace viewport. |
| INV-EVID-001 | APPLIES | Deterministic integrated browser assertion directly proves response order and rendered result. |
| INV-LEGACY-001 | N/A | No legacy recovery behavior changes. |
| INV-MONEY-001 | N/A | No financial operation or amount changes. |
| INV-STATE-001 | APPLIES | Exact replacement A→B pair, fresh critic, then non-circular final metadata reconciliation. |
| INV-CF-I07-001 | N/A | No admin/audit/network authorization surface changes. |
| INV-CF-I07-002 | N/A | No admin no-op mutation changes. |
| INV-CF-I07-003 | N/A | No role downgrade changes. |
| INV-CF-I07-004 | APPLIES | Existing integrated runner cleanup assertions rerun; test runner owns all processes it starts. |
| INV-CF-I08-001 | N/A | No reporting arithmetic changes. |
| INV-CF-I08-002 | N/A | No network aggregation changes. |
| INV-CF-I08-003 | N/A | No reporting date semantics changes. |
| INV-CF-I08-004 | N/A | No cross-module state predicates change. |
| INV-CF-I08-005 | N/A | No reporting date defaults or continuity changes. |
| INV-SCOPE-001 | APPLIES | Diff allowlist is the existing CF-I05 browser runner and scoped evidence/orchestration files only. |

The scoped product diff may also remove `loading` from the existing Refresh button's disabled predicate, retaining `actionBusy` as its mutation lock, so the documented refresh action can safely start a newer read. No other product code is in scope.

## Evidence claim audit

| Claim | Evidence | Classification |
|---|---|---|
| The late older board response cannot overwrite the newer rendered board | Integrated Playwright response gates + DOM assertions against distinguishable Worker/D1 board data | Integrated browser + Worker/D1 |
| Tenant isolation and responsive flows remain intact | Full existing CF-I05 browser suite at frozen viewports | Integrated browser + Worker/D1 |

## Publication decision

- [ ] All applicable invariants PASS.
- [ ] Full contract validation passed.
- [ ] Scope audit passed.
- [ ] Exact Artifact A and Boundary B persisted.
- [ ] Fresh external review required; no self-approval.
