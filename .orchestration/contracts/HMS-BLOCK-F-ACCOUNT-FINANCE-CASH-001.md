# HMS Block F — Account / Finance / Cash

Task ID: `HMS-BLOCK-F-ACCOUNT-FINANCE-CASH-001`
Status: `FROZEN BEFORE IMPLEMENTATION`
Authority: GitHub Issue #52, latest `CONTROLLER_DECISION: START`; exact base `39ee0a2b38e7205b8e041e792e16ee469c996241`; accepted Implementation Roadmap Master, Block Contracts A–H, Blueprint Traceability, Dependency DAG, Open Decisions and evidence matrix.
Branch: `impl/hms-block-f-account-finance-cash`
Mode: synthetic/local only; no real data or promotion.

## Objective and bounded delivery

Deliver the already-contracted Block F **F-account** capability over the existing Booking/Stay-grain account: authoritative total/paid/remaining/credit; charges; payment history and payment operations; receivables kept distinct from Cash. Use existing domain/API/capability/schema contracts, F0.7 checkout settlement, F0.9 charge operation identity/recovery, F0.10 server-owned capabilities, F0.11 authoritative refresh and F0.12 accepted evidence. Preserve existing Reception/Booking/Stay context and the approved finance separation. This task audits current implementation first and makes only changes needed for these accepted behaviors.

Block F **F-cash** is explicitly excluded from implementation pending the real-hotel cash ownership Product Acceptance/Human Gate OD-1. Existing Cash behavior is inspected and guarded against accidental coupling only; do not modify its UI, API, schema, accounting semantics or owner model. Do not claim all of Block F complete while this prerequisite is unresolved. This is an authorized F-account execution increment under Issue #52, not a new Cash policy.

## Frozen surface inventory

See `.orchestration/evidence/HMS-BLOCK-F-ACCOUNT-FINANCE-CASH-001-INVENTORY.md`. Current known surfaces include:

- API: `apps/api/src/routes/billing.ts`; `apps/api/src/modules/billing/{domain.ts,ports.ts,d1-payment-repository.ts}`; existing hotel migrations 0010/0015/0016/0019 and later accepted F0 migrations; canonical auth in `apps/api/src/auth/capabilities.ts`.
- Web: `apps/web/src/features/billing/BillingWorkspace.tsx` and `billing-workspace.css`; `apps/web/src/app/AppShell.tsx`; Reception Booking/Stay Case and existing API client; en/es-AR billing translations.
- Evidence: F0.7 settlement, F0.9 charge idempotency, F0.10 server-owned capability, F0.11 authoritative refresh, F0.12 aggregate evidence contracts/tests, plus Block F blueprint and test evidence matrix.
- Existing API operations: booking invoice/list, payment list/create/settle, extra-charge list/create/recovery, Cash balance/closures/close. F-account may use only its account/payment/charge operations; cash operations remain gated and untouched.

The inventory file records exact handlers, capabilities, tests and present UX gaps before product edits.

## Invariants and acceptance

1. Account grain is Booking/Stay, never Guest. Existing Booking/Stay Case identity remains the context; do not invent a guest-global balance.
2. Integer cents only. D11 remains the sole invoice/balance reconciler: paid is the immutable payment-entry ledger sum; remaining and credit are distinct derived values. Repricing cannot mutate payment entries.
3. Existing charges and payments remain auditable. Extra Charge keeps F0.9 stable operation token, exact-payload replay/conflict, lookup after uncertain response, exact durable-winner proof, atomic charge/booking/D11/event pair and safe retry. No direct ledger compensation.
4. Payment uses the current accepted operation identity/idempotency and authoritative balance constraints. Existing checkout settlement remains server-verified at the concurrency-safe F0.7 mutation boundary; UI assertions cannot prove settlement.
5. Every read/write stays tenant-routed and server-capability-authorized; frontend visibility is not authority. No role map, capability grant, API contract, migration semantics or domain policy is added.
6. After mutations/conflicts, affected Booking Account state is an authoritative coherent refresh for the same Booking/Stay. Stale responses cannot cross-bind another selected booking. Errors cannot be represented as refreshed success.
7. Finance/Receivables and Cash are separate. Pending balances/credit are never included in received-payment/cash totals, counts, expected/count cash or difference. Do not alter Cash or infer shift/source-of-funds ownership. The new contextual Booking/Stay Account route may omit the existing Cash panel; the legacy direct `/billing` route remains unchanged, and no Cash API, schema, calculation, capability or workflow is modified.
8. Existing workflows and historical data remain intact; only synthetic local fixtures. Existing payment/charge history is not deleted or rewritten.
9. Responsive account/payment/charge tasks remain usable at WIDE, COMPACT and NARROW and keyboard focus remains visible; test only surfaces actually changed.
10. Active bundle ceilings remain JS raw 350000, JS gzip 100000, CSS raw 60000, CSS gzip 15000. A breach stops at `BUNDLE_BUDGET_GATE_REQUIRED`; no ceiling increase is authorized.

## Requirement → surface → acceptance → evidence

| Requirement | Expected surface | Acceptance | Evidence |
|---|---|---|---|
| Booking/Stay account identity | Booking/Stay Case → account context / `BillingWorkspace` | Exactly the selected Booking/Stay account; no global Guest account or ambiguous selector/context | Browser direct/deep link and selected ID assertions; API/D1 booking-scoped identity |
| Financial truth | Billing API/repository, D11 invoice view, UI summary | Integer cents; total/paid/remaining/credit and invoice state agree with authoritative invoice/payment ledger; credit shown separately | Executing-D1 independent sums and exact-cent fixtures; UI assertion against API |
| Extra charge safety | Existing POST + operation lookup + UI | F0.9 token survives ambiguous response/reload; exact-payload replay only; no optimistic success; one durable charge/event pair and D11 update | Existing plus targeted executing-D1/API and Worker+D1 browser response-loss/replay tests |
| Payment safety/history | Existing payment command/list, UI | Capability and remaining-balance constraints enforced; immutable entry is exact-cent; duplicate/retry behavior matches existing frozen operation identity; refresh returns current account | Executing-D1/API concurrency/idempotency/denial tests; browser success/conflict and exact D1 state |
| Authoritative refresh and selection | `BillingWorkspace` read sequence | No old account rendered under a new booking; stale reads cannot replace current selection; read failure stays visible and retryable | Deterministic delayed/out-of-order and failed-read tests; integrated mutation refresh |
| Capabilities and tenant boundary | existing API auth/router/capability authority | Read/write allowed/denied behavior is server-owned and hotel scoped, with zero effects on denial | Existing role/capability API tests and configured two-tenant D1 regression; direct API denial |
| Cash/Receivables boundary | Static/API/D1 boundary checks; Cash code unchanged | Receivables cannot enter cash math; F-cash implementation is deferred for OD-1 | Existing cash fixture/math regression plus diff/path audit proving gated Cash files untouched |
| Responsive/accessibility/context | changed account/task UI | WIDE 1280, COMPACT 768, NARROW 375; keyboard/focus, errors/status, direct link/reload and return to selected Booking/Stay | Integrated local browser assertions and focused component tests; screenshots diagnostic only |
| Bundle | production entry output/checker | All existing ceilings pass; report JS/CSS raw/gzip + aggregate raw/gzip + entry payload baseline → result → byte/% delta | `npm run web:build`, `npm run architecture:fitness`, exact output report |

## Explicit non-goals

No F-cash ownership/session/float/handoff design or implementation; no real-hotel validation; no new payment/settlement, invoice, receivables, charge, API, capability, schema or accounting contract; no ledger edits; no guest-global account; no new cash UI; no new report/network finance; no Blocks G–H; no real data, cutover, staging/Product Acceptance, PR, merge, main, deploy or production.

## Validation and publication

Run targeted unit and executing-D1 tests for financial domain/repository/API paths; relevant capability/tenant tests; complete repository unit/integration suite; TypeScript and Wrangler type checks; production web build; architecture, i18n and bundle gates; D1 query-plan gate; local Worker + migrated D1 integrated account/payment/charge browser flow; WIDE/COMPACT/NARROW, keyboard/focus, stale response, conflict/retry and context assertions; applicable existing regressions; `git diff --check`; clean owned-process verification; STATUS parse and forbidden-scope/diff audit. No mocks substitute for required integrated D1/API evidence.

Before Artifact A, complete all-registry invariant evidence and mandatory Pre-Critic gate. Then create substantive Artifact A and orchestration/evidence-only Boundary B recording exact A. Obtain a fresh separate read-only Independent Critic on exact A+B, repair routine findings autonomously, reconcile final STATE/STATUS without self-PASS, push only this dedicated branch, verify remote SHA, and report directly to Issue #52. Do not claim complete Block F Controller PASS or implement F-cash until its separate OD-1 Product Acceptance/Human Gate is resolved. Blocks G–H remain unauthorized.

## Stop conditions

Stop and report in Issue #52 on a material `ROADMAP_BLOCKER`, new product/settlement policy, material architecture change, new unapproved backend/domain contract, any active bundle ceiling breach, real data, staging/Product Acceptance or promotion request. Ordinary technical defects, red tests, bounded review REWORK, evidence and metadata issues are repaired autonomously.
