# CF-I06 invariant evidence

Artifact candidate: populated immediately before publication.

| Invariant | Result | Evidence |
|---|---|---|
| INV-MONEY-001 | PROVEN | schema checks integer cents; API rejects non-safe/non-integer values; zero/negative payment and overpay tests pass |
| INV-ATOMIC-001 | PROVEN | extra-charge trigger changes booking total in the insert transaction; payment and audit use one D1 batch; focal regression PASS |
| INV-AUDIT-001 | PROVEN | `financial_events` records actor, hotel, request and operation metadata; regression verifies event count |
| INV-DOMAIN-001 | PROVEN | payment and cash close are guarded domain operations, not generic CRUD; checkout creates invoice in lifecycle batch |
| INV-TENANT-001 | PROVEN | operational database is selected only from authorized control-plane membership; routes never accept a database selector |
| INV-RBAC-001 | PROVEN | capability checks are backend-authoritative; housekeeping has no billing capability and closure requires `billing.close_cash.write` |
| INV-PARITY-001 | PROVEN | source-to-target matrix in `docs/cf-i06-billing-parity.md`; invoice, payment, cash and handoff semantics covered |
| INV-ENUM-001 | PROVEN | SQLite checks constrain invoice/payment enums and API canonicalizes payment methods |
| INV-UX-001 | PROVEN | booking billing workflow exposes invoice, charge, payment, history and typed cents controls |
| INV-RESP-001 | PROVEN | Playwright scroll width equals viewport at 375, 430, 768 and 1024 |
| INV-EVID-001 | PROVEN | focal regression, unit tests, typecheck, web build, browser artifact and full inherited test commands recorded in gate |
| INV-STATE-001 | PROVEN | publication protocol below creates exact-A substantive artifact and orchestration-only B |
| INV-SCOPE-001 | PROVEN | no remote D1, production migration, paid Cloudflare resource or CF-I07 work |

Known runner limitation: the pre-existing CF-I03/04/05 shell harnesses can hold a local D1 Worker while issuing a later Wrangler D1 inspection command; the inherited unit suite and CF-I06 focal suite were run, and the harness lock condition is recorded in the Pre-Critic Gate rather than treated as product evidence.
