# HMS-F0-09-EXTRA-CHARGE-IDEMPOTENCY-001 — Invariant Evidence

Artifact candidate: to be frozen as Artifact A after final validation
Task Contract: `.orchestration/contracts/HMS-F0-09-EXTRA-CHARGE-IDEMPOTENCY-001.md`
Pre-Critic: `.orchestration/evidence/HMS-F0-09-EXTRA-CHARGE-IDEMPOTENCY-001-PRECRITIC.md`
Evidence scope: synthetic local D1, disposable Wrangler state, local Worker + Vite + Playwright CLI only.

| Invariant | Classification | Status | Concrete evidence |
|---|---|---|---|
| INV-ATOMIC-001 | APPLIES | PASS | Executing-D1 same-token same/different payload races, distinct-token stale snapshot, exact durable charge and event-pair identity; first/second audit failure and corrupt pair produce no false success. Integrated final D1 confirms exact effect counts. |
| INV-AUDIT-001 | APPLIES | PASS | `d1-billing-reconciliation.executing-d1.test.ts` 11/11 asserts exactly one `EXTRA_CHARGE` + `PRICE_RECONCILIATION` pair on success; failures roll back both. Repository and route reject missing/malformed pair rather than fabricate it. Actor/request/hotel and charge/token/cause correlation are asserted. |
| INV-DOMAIN-001 | APPLIES | PASS | Existing billing route/repository command; migration guards immutable charge operation identity. No generic CRUD or alternate invoice reconciler. Existing D11 4 cases remain green in the 11-test executing-D1 suite. |
| INV-TENANT-001 | APPLIES | PASS | Integrated API tests select two independently bound hotel D1s; cross-tenant lookup and mutation return 404; final HOTEL_SECOND_DB has zero foreign booking/charges. Event hotel provenance must equal selected hotel. |
| INV-RBAC-001 | APPLIES | PASS | Actual Worker permits receptionist operation and denies housekeeping read/write with 403; canonical `hasCapability` authority unchanged. |
| INV-PARITY-001 | APPLIES | PASS | Existing description, category normalization and positive integer-cent rules remain; `0019_billing_reconciliation.sql` remains the sole D11 reconciler. No new invoice/payment rules. |
| INV-ENUM-001 | N/A | N/A | No business enum or serialized domain state is added/remapped; existing category normalization preserved. |
| INV-UX-001 | APPLIES | PASS | Actual BillingWorkspace browser run recovers persisted success after a dropped response/reload and offers safe same-token retry when lookup is absent. Success waits for authoritative refresh. |
| INV-ORDER-001 | N/A | N/A | No queue ranking, priority, synthetic item or next-item ordering changed. |
| INV-RESP-001 | APPLIES | PASS | Actual controls execute at desktop 1280×900 and mobile 375×844, including response-loss recovery, explicit same-token retry and mobile bounds assertions; screenshots are supplementary. |
| INV-EVID-001 | APPLIES | PASS | Every claim maps to the listed executing-D1 tests, actual Worker/D1 Playwright runner, final persisted JSON, complete test suite and named build/regression commands. Mocks are not used for integrated claims. |
| INV-LEGACY-001 | N/A | N/A | No historical row is synthesized or backfilled. Migration leaves old extra-charge operation tokens NULL; execution test proves tokenless history remains readable and cannot be relabeled. |
| INV-MONEY-001 | APPLIES | PASS | All money remains integer cents. Atomic batch rollback tested at both audit insert positions; D11 invoice exact total/paid/remaining/credit/status/paid_at behavior remains; payment rows/method/reference exact before/after. |
| INV-STATE-001 | APPLIES | PASS AFTER A+B+INDEPENDENT CRITIC | Publication is non-circular: immutable implementation/evidence Artifact A followed by orchestration-only Boundary B recording exact A SHA and external-review requirement; fresh independent review must decide. No SHA is embedded in its own commit. |
| INV-CF-I07-001 | N/A | N/A | No admin/audit/network route or capability authority changed. |
| INV-CF-I07-002 | N/A | N/A | No admin no-op mutation is in scope. |
| INV-CF-I07-003 | N/A | N/A | No role downgrade. |
| INV-CF-I07-004 | APPLIES | PASS | Integrated runner cleanup trap terminates only its own Worker/Vite/browser process trees, verifies cleanup before terminal PASS; final runner exits 0. An unrelated host browser process was not touched. |
| INV-CF-I08-001 | N/A | N/A | No reporting arithmetic or revenue/occupancy query changed. |
| INV-CF-I08-002 | N/A | N/A | No network aggregation/fan-out changed. |
| INV-CF-I08-003 | N/A | N/A | No reporting date/state query changed. |
| INV-CF-I08-004 | N/A | N/A | No booking/room state value added. |
| INV-CF-I08-005 | N/A | N/A | No reporting clock/default date/cross-surface continuity changed. |
| INV-SCOPE-001 | APPLIES | PASS | Diff audit confines work to F0.9 charge identity/recovery, UI recovery, additive migration, F0.9 tests and evidence. No Blocks A–H, real data, promotion or unrelated Cash/Shift changes. |

## Mandatory mutation inventory

| Operation | Authoritative mutation | Stale/zero-row behavior | Event behavior | Deterministic evidence |
|---|---|---|---|---|
| New extra charge | One tokenized `extra_charges` insert + expected-total booking update (D11 trigger) + two financial events in one D1 batch. Durable row and exact pair prove the winner; `meta.changes` is observational only. | Stale booking total, VOIDED, ledger mismatch, duplicate token or any batch failure returns conflict; no partial state. | Exactly one pair for the winning operation only. | 11 executing-D1 tests, trigger failure at first and second event, integrated Worker final database assertions. |
| Identical replay | Read exact tokenized charge and verify exactly the correlated event pair; return current invoice view. | Missing/inconsistent event pair fails closed; no repair or additional mutation. | Read-only; no new event. | Same-token replay and deliberately corrupt event-pair API/repository fixtures. |
| Prior-outcome lookup | Hotel/booking/token-scoped read; exact charge and event pair validation + fresh invoice view. | Missing operation 404; foreign tenant 404; malformed event pair 409. | Read-only; no new event. | Actual Worker response-loss/reload lookup, two-D1 tenant test, current-invoice-after-later-D11-reconciliation D1 test. |

## Evidence claim audit

| Claim | Evidence | Classification |
|---|---|---|
| Full chain applies migration 0030 successfully | Final migration rehearsal log; all three bindings are isolated Wrangler local stores | local migration |
| Response-lost committed charge is recoverable after reload | Playwright route fetch commits real Worker POST then aborts response; reload uses actual GET lookup | integrated browser |
| Mobile safe retry uses same token after no prior operation | Real Worker/D1 network abort before commit, GET 404 then same-token POST at 375×844 | integrated browser |
| D11 financial truth preserved | Final authoritative API response + final D1 JSON; exact amounts and ledger row | API/D1 + browser |
| Audit failure rolls everything back | Trigger-abort first/second event executing-D1 snapshots and API injection | executing-D1/API |
| Tenant/RBAC fail closed | actual local Worker requests under two hotel bindings and two roles | integrated API |
| Foundation regressions and budgets pass | exact final command outputs recorded in Pre-Critic | tests/platform |

## Publication decision

- [x] No applicable invariant is FAIL or UNPROVEN; INV-STATE-001 is explicitly conditional on the mandatory A+B+independent-review boundary.
- [x] Full Task Contract evidence is present, including synthetic migration, recovery, concurrency and rollback.
- [x] Scope/evidence claim audit passed.
- [ ] Exact immutable Artifact A + orchestration-only Boundary B + Independent Critic verdict are recorded. This row is completed only by the publication/review boundary; no self-approval is claimed here.
