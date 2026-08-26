# CF-I09 invariant evidence

Candidate: CF-I09 REWORK-3 closure candidate; source baseline `4df56a6217caab611f2f5fcbd98bde8386bb5629`.

| Invariant | Classification | Evidence |
|---|---|---|
| INV-ATOMIC-001 | APPLIES / PASS | `scripts/migration/test-rehearsal.sh` partial-failure and replay refusal; smoke payment/closure flow. |
| INV-AUDIT-001 | APPLIES / PASS | Exact lifecycle/financial event reconciliation; inherited CF-I03–08 regressions. |
| INV-DOMAIN-001 | APPLIES / PASS | Real smoke check-in, reassignment, checkout, housekeeping and cash close. |
| INV-TENANT-001 | APPLIES / PASS | Two-hotel exact reconciliation; smoke cross-hotel denial and browser profile switching. |
| INV-RBAC-001 | APPLIES / PASS | Access unit tests, CF-I03–08 and smoke identity/membership checks. |
| INV-PARITY-001 | APPLIES / PASS | `docs/cf-i09-source-target-mapping.md`; source-derived fixture, exact reconciliation and booking actor snapshot NULL checks. |
| INV-ENUM-001 | APPLIES / PASS | NO_SHOW mapping focal and `apps/api/src/migration-booking-status.test.ts` (2/2). |
| INV-UX-001 | APPLIES / PASS | Playwright smoke selector/profile/network workflow; CF-I08 browser widths. |
| INV-ORDER-001 | N/A | CF-I09 has no new queue/next-item ranking requirement. |
| INV-RESP-001 | APPLIES / PASS | CF-I09 Playwright smoke plus CF-I08 browser widths 375–1024. |
| INV-EVID-001 | APPLIES / PASS | Focal rehearsal, exact lifecycle reconciliation, tamper-negative proof, source audit, unit/type/build and runtime-isolation evidence are executable and recorded. |
| INV-LEGACY-001 | APPLIES / PASS | Legacy guest/payment/maintenance/lifecycle reconstruction, deterministic event-only unknown actors, booking snapshot NULL parity and source-nullable audit. |
| INV-MONEY-001 | APPLIES / PASS | Final booking totals, charge trigger neutralization, payments/closure exact cents. |
| INV-STATE-001 | APPLIES / PASS | Two-commit A/B publication plan; boundary metadata only in B. |
| INV-CF-I07-001 | APPLIES / PASS | Inherited CF-I07 focal and browser regression PASS. |
| INV-CF-I07-002 | APPLIES / PASS | Inherited CF-I07 focal regression PASS. |
| INV-CF-I07-003 | APPLIES / PASS | Inherited CF-I07 focal regression PASS. |
| INV-CF-I07-004 | APPLIES / PASS | CF-I03–08 runners and CF-I09 runners verify owned process cleanup. |
| INV-CF-I08-001 | APPLIES / PASS | CF-I08 normal regression: integer cents and corrected occupancy/RevPAR assertions. |
| INV-CF-I08-002 | APPLIES / PASS | CF-I08 normal/browser regression and CF-I09 two-binding reconciliation. |
| INV-CF-I08-003 | APPLIES / PASS | CF-I08 date-window regression and CF-I09 fixed report range. |
| INV-CF-I08-004 | APPLIES / PASS | NO_SHOW cross-module focal and exact zero inventory/revenue inclusion. |
| INV-CF-I08-005 | APPLIES / PASS | TZ-independent SQL hash plus deterministic dashboard/reconcile evidence. |
| INV-SCOPE-001 | APPLIES / PASS | No deploy, remote, paid, real-data or cutover action; `git diff` scope audit. |

All applicable invariants are PASS or N/A; no invariant evidence is UNPROVEN.
