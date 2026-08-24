# CF-I06 invariant evidence

Artifact candidate: CF-I06 REWORK-2, populated immediately before publication.

| Invariant | Result | Evidence |
|---|---|---|
| INV-MONEY-001 | PROVEN | schema checks integer cents; API rejects non-safe/non-integer values; zero/negative payment and overpay tests pass |
| INV-ATOMIC-001 | PROVEN | extra-charge trigger changes booking total in the insert transaction; payment and audit use one D1 batch; cash closure insert plus audit trigger are one D1 transaction; focal regression PASS |
| INV-ORDER-001 | PROVEN | payment history API orders `received_at DESC, id DESC`; source parity package records newest-first semantics |
| INV-AUDIT-001 | PROVEN | `financial_events` records actor, hotel, request and operation metadata; cash-closure trigger correlates the winning closure and regression verifies exactly one closure event |
| INV-DOMAIN-001 | PROVEN | payment and cash close are guarded domain operations, not generic CRUD; checkout creates invoice in lifecycle batch |
| INV-TENANT-001 | PROVEN | operational database is selected only from authorized control-plane membership; unknown second-tenant binding fails closed with 403; routes never accept a database selector |
| INV-RBAC-001 | PROVEN | capability checks are backend-authoritative; housekeeping and unknown roles are denied billing; closure requires `billing.close_cash.write` |
| INV-PARITY-001 | PROVEN | source-to-target matrix in `docs/cf-i06-billing-parity.md`; invoice, payment, cash, TRANSFER non-cash and handoff semantics covered |
| INV-ENUM-001 | PROVEN | SQLite checks constrain invoice/payment enums and API canonicalizes payment methods |
| INV-UX-001 | PROVEN | booking billing plus cash operations surfaces expose invoice, charge, payment/history, balance, expected/count cash, difference, handoff and notes |
| INV-RESP-001 | PROVEN | Playwright executes charge plus payment at 375, 390, 430, 768 and 1024 with scroll width equal to viewport; validation, typed overpay, stale-close and successful close are exercised |
| INV-EVID-001 | PROVEN | focal regression, 17 unit tests, typecheck, web build, dry-run, browser artifact and fresh CF-I03/04/05 runners pass |
| INV-STATE-001 | PROVEN | publication protocol below creates exact-A substantive artifact and orchestration-only B |
| INV-SCOPE-001 | PROVEN | no remote D1, production migration, paid Cloudflare resource or CF-I07 work |

Fresh inherited runner evidence: `scripts/cf-i03-regression.sh` PASS (includes CF-I04 lifecycle regression) and `scripts/cf-i05-regression.sh` PASS. CF-I05 serializes local D1 inspection by stopping/restarting only its local Worker between assertions; product behavior is unchanged. No CF-I03/04 source or test blob changed in this REWORK.
