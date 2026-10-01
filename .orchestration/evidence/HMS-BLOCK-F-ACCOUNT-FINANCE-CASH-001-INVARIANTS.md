# HMS-BLOCK-F-ACCOUNT-FINANCE-CASH-001 — Invariant Evidence

Artifact candidate: pending immutable commit after evidence finalization.
Task Contract: `.orchestration/contracts/HMS-BLOCK-F-ACCOUNT-FINANCE-CASH-001.md`
Pre-Critic gate: `.orchestration/PRECRITIC-GATE.md`
Classification was frozen before implementation. Post-implementation results are reconciled below. This evidence applies only to F-account; OD-1 F-cash remains gated. `INV-STATE-001` specifies the non-circular A→B publication protocol; its exact artifact identity will be recorded in the immediate orchestration-only Boundary B.

| Invariant | Applies? | Status | Planned evidence / rationale |
|---|---|---|---|
| INV-ATOMIC-001 | APPLIES | PASS | F0.9 executing-D1 tests and `npm run test:cf-i06` verify one durable payment/charge winner, exact replay/conflict, final-payment replay, concurrent constraints and zero drift on rejected mutations; integrated browser retry confirms one payment row. | `.orchestration/evidence/HMS-BLOCK-F-ACCOUNT-FINANCE-CASH-001-RESULTS.md`; `apps/api/src/modules/billing/d1-billing-reconciliation.executing-d1.test.ts`; `scripts/cf-i06-regression.sh`; browser log. |
| INV-AUDIT-001 | APPLIES | PASS | D1 regression asserts exactly one charge/reconciliation event pair, one closure event and actor/request/hotel attribution; denied cross-tenant and capability writes create no target effects. | Results record; CF-I06 Worker/D1 exact ledger/event assertions. |
| INV-DOMAIN-001 | APPLIES | PASS | Existing explicit payment/charge commands remain the only mutation paths; route uniqueness test and static diff audit show no generic CRUD bypass. | `apps/api/src/billing-route-uniqueness.test.ts`; Result scope/route audit. |
| INV-TENANT-001 | APPLIES | PASS | Configured HOTEL_DEMO_DB/HOTEL_SECOND_DB fixtures prove each tenant's valid payment path and reciprocal cross-tenant invoice/payment/charge denials; unknown binding/hotel fail closed. | `scripts/cf-i06-regression.sh`; Result record. |
| INV-RBAC-001 | APPLIES | PASS | Authorized `subject-a` succeeds; established housekeeping and unknown-role identities receive 403 on financial reads/writes; no capabilities or role grants changed. | `scripts/cf-i06-regression.sh`; existing capability matrix/tests. |
| INV-PARITY-001 | APPLIES | PASS | D11/F0.7/F0.9 rules remain authoritative: exact cents, current remaining constraints, final-payment exact replay, changed-payload conflict, safe charge recovery, separate Cash math. Checkout settlement code is unchanged. | Result record; full suite; CF-I06 API/D1 and browser evidence. |
| INV-ENUM-001 | N/A | N/A | No domain enum/value representation is added or remapped. Payment method values remain existing API semantics. |
| INV-UX-001 | APPLIES | PASS | Case launches Booking-scoped Account, selected identity survives reload, contextual return preserves query and focus; browser Back and application return restore the Case. | Result record; `output/playwright/cf-i06-browser.log`. |
| INV-ORDER-001 | N/A | N/A | No operational queue ranking, synthetic work or next-item semantics changed. |
| INV-RESP-001 | APPLIES | PASS | Account, charge and payment controls execute at 375/390/430/768/1024/1280 widths; contextual account is checked at WIDE 1280×900, COMPACT 768×812, NARROW 375×812, reduced-height 375×600 and landscape 844×390; no horizontal overflow. | Result record; five named contextual Account screenshots. |
| INV-EVID-001 | APPLIES | PASS | Every material claim maps to tests, Worker/D1 reads, executable browser assertions, build metrics or static diff evidence; no mock is represented as integrated D1 evidence. The immediate browser Back focus assertion race was repaired under a frozen bounded contract and the complete browser run passed after waiting on the actual focus predicate. | Result record, requirement/evidence matrix, and `.orchestration/contracts/HMS-BLOCK-F-REPAIR-BROWSER-FOCUS-WAIT-001.md` with its Pre-Critic and invariant record. |
| INV-LEGACY-001 | N/A | N/A | No historical account/charge/payment record is synthesized, backfilled or migrated. |
| INV-MONEY-001 | APPLIES | PASS | Exact integer-cent sums, remaining/credit separation, payment replay and overpay conflict are verified against D1; existing Cash totals exclude Receivables and remain regression-tested. | Result record; CF-I06 exact assertions; `npm run check`. |
| INV-STATE-001 | APPLIES | PASS | Publication follows immutable substantive Artifact A then immediate orchestration-only Boundary B recording exact A, requiring external review, disabling resume and identifying the separate read-only Critic. A does not self-reference; no substantive PASS is claimed. | Mandatory Pre-Critic Gate §10; exact pair is recorded in Boundary B. |
| INV-CF-I07-001 | N/A | N/A | No protected admin/audit/network route authority is changed. |
| INV-CF-I07-002 | N/A | N/A | No role/plan mutation. |
| INV-CF-I07-003 | N/A | N/A | No role downgrade. |
| INV-CF-I07-004 | APPLIES | PASS | CF-I06 Worker regression and Worker/Vite/browser runner terminate their recursively enumerated owned trees, poll/verify absence and emit PASS only afterward. | `.orchestration/contracts/HMS-BLOCK-F-REPAIR-CF-I06-CLEANUP-001.md`; updated runners; final process/port check. |
| INV-CF-I08-001 | N/A | N/A | No analytics/report arithmetic is changed. Invoice/ledger arithmetic is covered by INV-MONEY-001. |
| INV-CF-I08-002 | N/A | N/A | No multi-hotel analytics aggregation is changed. Tenant denial is covered by INV-TENANT-001. |
| INV-CF-I08-003 | N/A | N/A | No reporting date/state query is changed. |
| INV-CF-I08-004 | N/A | N/A | No state expansion or cross-module predicate is changed. |
| INV-CF-I08-005 | N/A | N/A | No reporting clock/default range or cross-surface report continuity is changed. |
| INV-SCOPE-001 | APPLIES | PASS | Changed product behavior is limited to F-account contextual entry/presentation and existing payment recovery identity. Cash implementation, checkout settlement, schema, capabilities and G–H are untouched; the legacy direct Billing/Cash route remains intact. | Final diff/path audit and Results record. |

## Mutation inventory (frozen)

| Operation | Authoritative mutation / winner identity | Stale/zero-row behavior | Required evidence |
|---|---|---|---|
| Record payment | Existing booking/invoice/payment-operation identity at current D1 boundary | Overpay/VOIDED/mismatch/stale or duplicate operation cannot create another payment or false success | concurrent and replay D1 snapshots; exact ledger/invoice/event state |
| Record extra charge | F0.9 tokenized charge row + expected booking/invoice snapshot and exact event pair | Same token/payload replays; changed payload conflicts; stale/failed batch has no partial charge/booking/D11/events | executing-D1 concurrent/response-loss/rollback exact identities and no-drift assertions |
| Refresh account | No mutation; selected Booking identity and read generation bind the composite snapshot | stale completion is ignored; failed refresh remains visible | deterministic out-of-order/failed read tests plus Worker/D1 authoritative result |
| Checkout settlement | Existing F0.7 boundary, not modified by this task | server rejects stale/remaining due; no frontend claim supersedes current D1 | focused existing F0.7 executing-D1 regression; static diff confirms checkout authority unchanged |

## Publication decision

All applicable product and evidence invariants pass for the frozen F-account contract. `INV-STATE-001` is realized only by the exact non-circular Artifact A → orchestration-only Boundary B sequence; B carries exact A identity and opens external review. F-cash/OD-1 remains excluded and is not represented as Block F completion.
