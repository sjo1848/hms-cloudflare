# F0.12 Aggregate Evidence Gate — Invariant Evidence

Task Contract: `.orchestration/contracts/HMS-F0-12-AGGREGATE-EVIDENCE-GATE-001.md`.
Scope: synthetic/read-only aggregate evidence. No real customer data, live cutover, pricing bootstrap, product mutation, Blocks A–H, PR, merge, staging or deploy.

| Invariant | Status | Evidence / bounded proof |
|---|---|---|
| INV-ATOMIC-001 | PASS | F0.3 executing-D1 rehearsal asserts injected batch rollback, exact checkpoint recovery, stale digest zero-drift; F0.6 executing-D1 asserts concurrent activation convergence, rollback, response/replay and ABA/drift. Fresh logs `f03-clean-rehearsal-1/2.log` and `f06-synthetic-bootstrap.log`. |
| INV-AUDIT-001 | PASS | Crosswalk distinguishes source-event provenance validation from canonical event non-mutation and F0.6 pricing-segment provenance; F0.9 D11/CF-I06 fresh regressions pass; no inferred audit success. |
| INV-DOMAIN-001 | PASS | Aggregate retains separate room-state and pricing-bootstrap classes, hold reasons and per-increment verdicts; no generic green status erases unresolved/held rows. Crosswalk and input JSON. |
| INV-TENANT-001 | PASS | F0.3 minimal synthetic D1 mapper separation and F0.6 isolated bootstrap D1 checkpoint/segment tests are separately represented; no cross-D1 atomicity or production auth/routing claim. |
| INV-RBAC-001 | PASS | F0.10 exact A5+B5 Critic evidence and immutable capability integration result included; no aggregate read/write path grants access. |
| INV-PARITY-001 | PASS | Frozen Foundation contract, Room State Cutover plan, Active-Stay Bootstrap plan and test/evidence matrix are hash-pinned inputs; gaps are scoped, not filled with inferred policy. |
| INV-ENUM-001 | PASS | F0.3 fixture retains exact `READY_FOR_ARRIVAL`, `REVIEW_REQUIRED`, `UNRESOLVED`, `SELLABLE`; F0.6 classifications and held dispositions remain exact. Unknowns fail closed in the validator. |
| INV-UX-001 | PASS | Historic immutable F0.8/F0.9/F0.10/F0.11 integrated Worker/D1 evidence and viewports are directly hash-pinned; no mock replaces integration proof. Earlier F0.3 room screenshots and its recorded actual browser result remain separately attributed. |
| INV-ORDER-001 | PASS | F0.11 integrated Reception desktop/mobile logs remain linked to A2; they assert expected next-priority identity, not target-self-derived ordering. |
| INV-RESP-001 | PASS | F0.3, F0.8, F0.9, F0.10 and F0.11 evidence paths preserve their exact desktop/mobile captures/logs; no viewport result is inferred across widths. |
| INV-EVID-001 | PASS | Input index pins every source/evidence SHA-256; validator verifies git identity/ancestry, evidence hashes, complete 24-row criteria, complete 16 validation receipts and references; repeated manifest output is byte-compared. Missing/tampered input fails closed in seven Node tests. |
| INV-LEGACY-001 | PASS | `unknown-room` is `REVIEW_REQUIRED/UNRESOLVED/UNRESOLVED`; aggregate exclusion is asserted. `Hotel Norte` remains a separate historical synthetic browser fixture, not current hotel inventory. |
| INV-MONEY-001 | PASS | F0.6 exact partial-paid `stay-a` snapshot includes booking, charges, invoice/paid_at, full payment rows and operational/financial records; full-paid/overpaid remain classification-only. Fresh F0.6 and CF-I06 outputs; no live bootstrap. |
| INV-STATE-001 | PASS (publication protocol) | The substantive Artifact A does not contain its own SHA. A subsequent orchestration-only Boundary B must name A and set external-review required/resume false; the exact pair is frozen for fresh Independent Critic. No Foundation completion is recorded in A/B. Final boundary SHA is added to the post-Critic closure record, not retroactively to A. |
| INV-CF-I07-001 | PASS | F0.10 A5+B5 reviewer evidence and network/admin capability integration result are pinned; no new protected route or local role-name authority is added by F0.12. |
| INV-CF-I07-002 | PASS | F0.10 exact A5+B5 evidence includes no-op/audit assertions; F0.12 is read-only against application data and introduces no admin mutations. |
| INV-CF-I07-003 | PASS | F0.10 exact A5+B5 includes same-subject allowed-before/denied-after downgrade evidence; no authorization state is changed here. |
| INV-CF-I07-004 | PASS | Fresh CF-I03–I06 suite uses script-owned cleanup; F0.12 validator is a short-lived Node process and invokes no Worker/Vite; test/run commands terminate before receipt PASS. |
| INV-CF-I08-001 | N/A | No analytics/revenue arithmetic is changed or claimed; F0.12 does not consume CF-I08 reports. |
| INV-CF-I08-002 | N/A | No network aggregation or multi-hotel reporting is changed or claimed. |
| INV-CF-I08-003 | N/A | No reporting date/state predicates are changed or claimed. |
| INV-CF-I08-004 | N/A | No CF-I08 output-state expansion is introduced; F0 room/bootstrap classifications are separately covered by INV-ENUM-001. |
| INV-CF-I08-005 | N/A | No reporting clock defaults or continuity behavior is changed or claimed. |
| INV-SCOPE-001 | PASS | Scoped diff contains only F0.12 aggregate validator/test and evidence/docs. Historical unrelated dirty output/P0.1/F0.11 paths remain unmodified and excluded. No product code, migration, DB mutation or promotion action. |

`PASS` here is invariant evidence for admission to the aggregate Critic boundary only. It is not a self-issued Foundation 0 Development Gate or Independent Critic verdict. Real-data cutover/bootstrap remains prohibited; global promotion findings remain open.
