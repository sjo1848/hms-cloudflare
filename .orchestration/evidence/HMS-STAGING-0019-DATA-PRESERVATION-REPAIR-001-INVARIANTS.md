# HMS-STAGING-0019-DATA-PRESERVATION-REPAIR-001 — Invariant Evidence

Artifact candidate: transaction-safe migration 0019 + authorized lexical parser edits + executing-D1 regression, based on `0e78050999550d193ff0d352672b233e2f3da472`.
Task Contract: `.orchestration/contracts/HMS-STAGING-0019-DATA-PRESERVATION-REPAIR-001.md`.
Pre-Critic gate: `.orchestration/evidence/HMS-STAGING-0019-DATA-PRESERVATION-REPAIR-001-PRECRITIC.md`.

| Invariant | Applies? | Status | Concrete evidence | Rationale |
|---|---|---|---|---|
| INV-ATOMIC-001 | APPLIES | PASS | The executing-D1 regression batches all 0019 statements with a forced final failure; invoice/payment values and old trigger/schema remain unchanged. Canonical remote D1 apply of 0019 and full chain also passed. | Migration performs multiple dependent DDL/data writes inside canonical D1 migration batch semantics. |
| INV-AUDIT-001 | N/A | N/A | No business audit/event behavior changed. | Migration correctness only. |
| INV-DOMAIN-001 | APPLIES | PASS | D11 invoice/ledger guard, total reconciliation, credit transition, extra-charge tests, and checkout settlement executing-D1 tests pass; phase 2 exact ledger guard rejection is captured. | Financial domain triggers are preserved through rebuild. |
| INV-TENANT-001 | N/A | N/A | Disposable D1s contain synthetic tenant-local data only; no API routing changed. | No tenant routing surface changed. |
| INV-RBAC-001 | N/A | N/A | No capabilities or authorization code changed. | No auth surface changed. |
| INV-PARITY-001 | APPLIES | PASS | Exact 0018→0019 invoice/payment row snapshots match; full 0019–0030 synthetic run matches accepted original schema and all financial rows except explicitly exercised D11 total mutation. | Canonical migration path now preserves accepted financial data/semantics. |
| INV-ENUM-001 | N/A | N/A | No enum mapping or serialization changed. | No enum change. |
| INV-UX-001 | N/A | N/A | No UI/workflow changed. | No product surface changed. |
| INV-ORDER-001 | N/A | N/A | No queue/order behavior changed. | Not an operational queue task. |
| INV-RESP-001 | N/A | N/A | No responsive surface changed. | No UI changed. |
| INV-EVID-001 | APPLIES | PASS | Exact SQL hashes, before/after row snapshots, Wrangler command logs, ledger/FK/schema assertions, read-only exports and complete validation are linked by the two proof reports and Results. | Claims are limited to synthetic D1 and local validation evidence. |
| INV-LEGACY-001 | APPLIES | PASS | All 3 synthetic invoice rows and all 3 payment rows compare byte/value-identically across 0019; legacy extra charge survives through 0030 without fabricated operation identity. | Invoice/payment rows are existing data during the parent rebuild. |
| INV-MONEY-001 | APPLIES | PASS | Integer-cent D11 behavior, exact payment ledger sum, paid-ledger trigger rejection, partial/paid/unpaid rows and a supported 2,000-cent credit case pass. | Payment and invoice aggregate truth are directly affected. |
| INV-STATE-001 | APPLIES | PASS | No staging D1 was written during proof; both diagnostic D1s were deleted and a read-only D1 list filter confirms none remain. Before Artifact A, `STATE.md`/`STATUS.json` remain RUNNING with the exact authorized base, resume disabled and no fabricated artifact/boundary SHA; Boundary B will record the resolvable A and set external review required before any continuation. | Promotion state and data boundary are high-risk; closure is deliberately non-circular. |
| INV-CF-I07-001 | N/A | N/A | No protected authorization route or role-name shortcut changed. | No access-control source changed. |
| INV-CF-I07-002 | N/A | N/A | No semantic no-op admin mutation changed. | No administrative mutation changed. |
| INV-CF-I07-003 | N/A | N/A | No role downgrade behavior changed. | No downgrade operation changed. |
| INV-CF-I07-004 | N/A | N/A | Vitest/Miniflare in-process D1 test uses `afterEach` to dispose its Miniflare instances; no standalone Worker/Vite/browser child-process runner was added. | No child-process regression runner was added. |
| INV-CF-I08-001 | N/A | N/A | No analytics/revenue/occupancy KPI changed. | Reporting out of scope. |
| INV-CF-I08-002 | N/A | N/A | No network aggregation changed. | Network metrics out of scope. |
| INV-CF-I08-003 | N/A | N/A | No report date/state predicate changed. | Reporting out of scope. |
| INV-CF-I08-004 | N/A | N/A | No expanded state enum changed. | No state enum change. |
| INV-CF-I08-005 | N/A | N/A | No reporting clock defaults or browser navigation changed. | No reporting/browser behavior changed. |
| INV-SCOPE-001 | APPLIES | PASS | Diff contains only migration 0019, five already-authorized lexical edits, their financial regression and its dependent pinned digest updates, plus orchestration/evidence. No Web/API product routes, schema beyond the accepted 0019 contract, F-cash, main, staging or production data changed. | This risk-sensitive migration repair must not absorb other scope. |

## Mutation inventory

No product business mutation was implemented. Database changes were confined to two named synthetic disposable D1s and one isolated in-process D1 regression. The only post-0019 fixture mutation was an explicitly asserted synthetic booking-total decrease used to exercise already-accepted credit semantics.

## Publication decision

- [x] Every applicable invariant is PASS with concrete evidence.
- [x] Required validation set and diff/scope review pass.
- [ ] External Controller/Independent Critic decision on exact artifact/boundary pair is not yet recorded.
- [ ] Do not move `acceptance/staging` or run deployment workflow until the required external review boundary is resolved.
