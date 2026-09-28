# Task Contract — F0.9 Extra Charge Idempotency

Task ID: `HMS-F0-09-EXTRA-CHARGE-IDEMPOTENCY-001`  
Parent: `.orchestration/contracts/HMS-FOUNDATION-0-START-001.md`  
Authority: Foundation 0 authorization RG1–RG7; `docs/implementation-roadmap/HMS-FOUNDATION-0-CONTRACT-V1.md` §F0.9; approved DAG.  
Status: `FROZEN BEFORE IMPLEMENTATION`  
Artifact scope: F0.9 only; synthetic/local evidence only. No Blocks A–H, PR/push/merge, main, staging, deploy, production, customer data, live cutover or pricing bootstrap.

## Objective

Make one extra-charge business operation replayable and recoverable after duplicate submission or lost response. The operation must commit exactly one `extra_charges` row, the booking-total increment, D11 invoice reconciliation (when an invoice exists), and exactly one `EXTRA_CHARGE` + `PRICE_RECONCILIATION` event pair together. Existing payment entries remain immutable. F0.9 does not close Foundation 0; the remaining increments are F0.10–F0.12.

## Verified current surfaces

- `apps/api/schema/hotel-migrations/0010_billing.sql`: legacy `extra_charges` rows have no operation identity; rows and `financial_events` follow the existing booking FK lifecycle. No independent extra-charge token expiry/cleanup policy was found.
- `apps/api/schema/hotel-migrations/0019_billing_reconciliation.sql`: drops the historical extra-charge trigger; booking-total updates guard VOIDED/ledger mismatch and reconcile invoice from immutable payment entries. This remains the only invoice reconciler.
- `apps/api/src/modules/billing/d1-payment-repository.ts`: `recordExtraCharge()` currently batches charge insert, booking update, and two financial events; it has no stable operation identity. Do not rely on per-statement `meta.changes === 1` as the exact-winner proof; D11 trigger side effects can increase counts, and post-batch checks cannot roll back committed writes.
- `apps/api/src/modules/billing/ports.ts`: current charge write/port has no operation token/result type.
- `apps/api/src/routes/billing.ts`: POST `/bookings/:id/extra-charges` uses canonical `bookings.extra_charges.write`; GET listing uses `bookings.extra_charges.read`; operational D1 is selected by authenticated membership.
- `apps/api/src/auth/capabilities.ts`: existing capability authority already covers charge read/write; no new capability or role map is allowed.
- `apps/web/src/features/billing/BillingWorkspace.tsx`: `submitCharge()` currently has no pending guard, stable operation token or outcome recovery. Repository search found this as the only in-repository POST consumer.
- `apps/api/src/modules/billing/d1-billing-reconciliation.executing-d1.test.ts`: current focused test proves D11 and one charge rollback scenario but not token replay, concurrent duplicate, response loss, lookup, or exact unchanged ledger/event assertions on rollback.
- `docs/implementation-roadmap/HMS-TEST-EVIDENCE-MATRIX-V1.md` F0.9 row requires charge arithmetic/capability/tenant, D11+event rollback, concurrent duplicates, response-loss retry, authoritative account refresh, accessible recovery and executing-D1 audit-failure rollback.

## Requirement → surface → acceptance → evidence

| Requirement | Expected surface | Acceptance | Required evidence |
|---|---|---|---|
| Stable operation identity | Billing request, additive hotel migration, D1 repository | Caller supplies an opaque operation token scoped by authenticated hotel D1 and booking. Same token + same validated payload replays; same token + changed payload conflicts before any additional mutation. Token is never authentication or winner proof. | Executing-D1 same/different payload and concurrent same-token callers; API authorization/tenant tests. |
| At-most-one charge and event pair | `extra_charges`, repository batch, `financial_events` | One winning operation persists one charge and exactly one event of each required type, both correlated to that charge/token. A rejected/stale/replay request creates no extra effects. | Exact row identities, cents, event types/count/details, actor/hotel/request provenance, and response status. |
| Atomic domain + D11 mutation | Repository plus existing migration 0019 triggers | Charge, booking total, invoice reconciliation and both events commit together or all roll back. No alternate invoice reconciler and no `payment_entries` writes. | D1 failure injection at audit stages; stale total, VOIDED, ledger mismatch; snapshot all affected tables and assert zero drift. |
| Exact-winner proof | Repository and operation lookup | Return create/replay only when the durable booking-scoped token row exactly matches the request and complete event pair committed. Never infer a winner from `x-request-id` or exact `meta.changes`; respect trigger-inflated counts (observed batch `[1,2,1,1]`). | Concurrent API/D1 winner + loser assertions; durable token row and event identities; logs/results showing actual metadata without making it causal. |
| Prior-success lookup after ambiguous response | Read-only operation lookup under existing extra-charge read capability | Lookup is tenant-routed and booking-scoped; existing operation returns its persisted charge plus a fresh authoritative invoice view; absent operation returns not-found. A previously committed operation remains discoverable even if current invoice state later changes. | Local Worker/D1 response-drop test followed by lookup and authoritative invoice/charge refresh; cross-tenant denial with zero target reads/mutations. |
| UI retry/recovery | `BillingWorkspace.tsx` and existing API client | Prevent double submit; retain token + exact payload during ambiguous outcome across reload in the same browser session; lookup prior success; if absent, retry the same token/payload only. Do not clear the pending identity or claim success until an authoritative persisted result is observed. | Integrated browser with actual Worker/D1; intercept/drop completed POST response, reload/recovery path, retry and exact persisted state; mobile 375px and desktop 1280px. |
| Legacy data | Forward migration | Existing charges remain readable with NULL operation token; no fabricated token/backfill. Token identity and payload fields cannot be reassigned or rewritten after creation. No separate expiry/cleanup is added; operation identity lifetime is the existing charge-row lifetime. | Clean migration chain, legacy row fixture preserved, immutable identity trigger tests, migration replay. |
| D11 financial truth | Repository / existing D11 migration | `invoice.paid_amount_cents = SUM(payment_entries.amount_cents)`; `remaining=max(amount-paid,0)`, `credit=max(paid-amount,0)`, status/paid_at follow D11. Repricing never mutates payment entries or fabricates method/reference. | Exact-cent before/after snapshots and ledger rows on success/replay/conflict/rollback. |

## Operation/API contract

- Every new in-repository charge submission uses a client-generated UUID operation token and the existing POST route. The BillingWorkspace consumer is migrated in this increment. To preserve existing `/api/v1` request compatibility, an omitted token is accepted and assigned a server-generated UUID; the response includes that token, but retry safety after a lost response is guaranteed only when the caller supplies and retains its token. No in-repository caller may use this compatibility path. The route validates supplied tokens before any write; authenticated hotel routing and existing `bookings.extra_charges.write` remain authoritative. A token is scoped by operational D1 + booking ID.
- Payload identity is the complete validated business payload: booking ID, trimmed description, positive safe-integer `amount_cents`, and normalized category (existing default `OTHER`, uppercase). The persisted charge row is the durable payload record; legacy rows remain tokenless. Reuse with any different normalized payload is a typed 409.
- Add one forward-only migration at the next sequence (expected `0030_*`), using nullable operation identity on `extra_charges` plus booking-scoped uniqueness for tokenized rows. Do not edit 0010 or any historical migration, backfill legacy rows, add token expiry, or create a second operation/source-of-truth table.
- Add one canonical `GET /bookings/:id/extra-charges/operations/:token` recovery route. It requires `bookings.extra_charges.read`, validates booking/token in the current hotel D1, returns the durable charge and current invoice view on success, and 404 when the operation is absent. Do not add duplicate/v2 charge mutation routes.
- POST same-token/same-payload replay returns the existing durable charge and a freshly-read authoritative invoice view, marked `replayed`; new success retains 201 and returns the same result shape. Changed-payload, stale snapshot, VOIDED, ledger mismatch or no-winner outcomes return conflict without partial state. Errors do not expose SQL internals.
- The write remains one atomic D1 batch with conditional charge insert, exact booking-total update (which invokes D11), and the two operation-correlated events. Constraint/guard failures abort the batch. On unique-token race or ambiguous batch error, reread the durable token row: identical persisted payload means replay; changed payload means conflict; absent row means failed operation. Confirm the durable charge identity and event pair, not `meta.changes` equality, before claiming success.
- Existing invoice reconciliation continues exclusively through migration 0019. Extra-charge operation does not touch payment entries and preserves invoice payment method/reference through D11.
- UI pending operation is stored in `sessionStorage` under a key including active `hotel_id` and booking ID. It contains only the operation token and exact charge payload needed to safely retry. It is removed only after lookup/POST confirms the matching committed durable result and the authoritative account/list refresh succeeds, or after a lookup 404 establishes no durable operation for that token; then the operator may edit and begin a new token. If lookup finds the token with a different payload, retain it and surface the conflict; do not silently discard or create a second charge. A transient network error triggers lookup; 404 keeps the same token/payload available for explicit safe retry. Do not start a second charge while an ambiguous operation remains unresolved.
- Token retention follows the charge row and its existing lifecycle; no independent token/audit retention policy is introduced. Do not delete prior charge/event history or make claims about finite retention absent an approved policy.

## Concurrency and mutation inventory

| Operation | Authoritative mutation / winner identity | Zero-row or race behavior | Event behavior | Deterministic regression |
|---|---|---|---|---|
| Create extra charge | Tokenized `extra_charges` row under unique `(booking_id, operation_token)` plus conditional expected booking/invoice/ledger snapshot; all within one D1 batch | No token row after failed/stale batch => conflict; unique-token race rereads winner and becomes replay only for identical payload; altered payload => conflict | Exactly correlated EXTRA_CHARGE + PRICE_RECONCILIATION if commit wins; none otherwise | stale snapshot, simultaneous same token/same payload, simultaneous same token/different payload, simultaneous distinct tokens same stale booking snapshot; exact full-state snapshots |
| Recover prior outcome | Read by booking ID + token after existing capability and tenant selection | Missing operation => 404; foreign tenant cannot resolve/read it | Read has no event side effects | authorized lookup, missing token, same identifier from another tenant, prior operation after later invoice state change |

## Explicit non-goals

No changes to payment idempotency, invoice states or D11 trigger semantics; no payment-entry fabrication/mutation; no extra charge editing/deletion; no new financial source of truth; no generic idempotency framework; no capability vocabulary/role map changes; no cash/shift behavior; no Blocks A–H; no real data, live migration, cutover, bootstrap, PR, push, merge, main, staging, deploy or production.

## Validation and evidence

- Unit tests: operation-token validation and full-payload identity equivalence/conflict.
- Executing-D1: clean full hotel migration chain through new forward migration; existing D11 4/4 must remain passing. Prove fresh success, same-token replay, changed payload, parallel identical submissions, parallel changed payload, stale total, invoice VOIDED, ledger mismatch, injected failure on each audit insert, response-loss lookup/retry, a legacy tokenless charge, exact charge/event identities/cents, unchanged payment ledger, invoice paid/remaining/credit/status/paid_at, and zero partial changes for every reject.
- API: replay/new status and shape, prior-success lookup, missing token/invalid token, tenant isolation with two configured hotels, authorized receptionist success, denied capability mutation and lookup; preconditions must establish identity/membership/routing before calling it RBAC evidence. Route uniqueness must prove one handler per method/path.
- Browser integration: actual local Wrangler Worker + isolated migrated D1 + Vite. At desktop 1280px and mobile 375px, submit real charge, lose the completed response, resolve via lookup after reload, refresh account and charge list, verify no optimistic success and exact persisted total/event/ledger state; also show a 404 lookup safe retry using the same token. Mock-only evidence is supplemental and separately labeled.
- Run focused tests, `npm run check`, `npm run types:check`, `npm run web:build`, architecture fitness/budgets, critical D1 query plans, Wrangler API/Web/staging-SPA dry-runs only, relevant serial CF-I03–I06 regressions, clean/repeat local migration rehearsal, route-uniqueness test, diff check, STATUS JSON parse, forbidden-scope audit and owned Worker/Vite/browser process cleanup. Preserve the disclosed shared broad browser runner limitation; do not claim it PASS unless freshly proven.

## All durable invariant classifications (24)

| Invariant | Classification | Acceptance / rationale |
|---|---|---|
| INV-ATOMIC-001 | APPLIES | Exact token/booking winner, stale and ABA-safe race handling, zero partial rows/events, durable proof rather than trigger-sensitive change counts. |
| INV-AUDIT-001 | APPLIES | Exactly one event pair iff charge mutation commits; exact actor/hotel/request and charge linkage; zero events on reject/rollback/replay. |
| INV-DOMAIN-001 | APPLIES | Charge remains an explicit billing-domain command through the existing route/repository, not generic row CRUD. |
| INV-TENANT-001 | APPLIES | Authenticated membership chooses operational D1; operation read/write is booking/token scoped; cross-tenant lookup/mutation denied without drift. |
| INV-RBAC-001 | APPLIES | Existing canonical extra-charge read/write capabilities enforced on lookup and mutation; unknown/denied role fails closed. |
| INV-PARITY-001 | APPLIES | Preserve current description/category/cents validation and D11 semantics; no new payment or invoice policy. |
| INV-ENUM-001 | N/A | No booking/room/domain enum is added or remapped; category normalization remains existing API semantics. Reassess if implementation adds a persisted state enum. |
| INV-UX-001 | APPLIES | Billing charge flow remains in its existing booking account context; ambiguous response/recovery is visible and truthful. |
| INV-ORDER-001 | N/A | No queue ranking, priority, synthetic-item or next-case ordering changes. |
| INV-RESP-001 | APPLIES | Actual recovery controls execute at 1280px and 375px integrated widths; shell-only rendering is insufficient. |
| INV-EVID-001 | APPLIES | Each API/D1/browser/migration claim maps to exact commands and assertions; mocks and integrated Worker/D1 evidence are distinguished. |
| INV-LEGACY-001 | N/A | No historical business record is synthesized/backfilled; legacy charges stay tokenless and unchanged. |
| INV-MONEY-001 | APPLIES | Integer cents, D11 ledger truth, exact state and all-or-nothing financial operation; payment entries remain unchanged. |
| INV-STATE-001 | APPLIES | Publish substantive Artifact A, orchestration-only Boundary B with exact A SHA, then separate Independent Critic; no self-PASS. |
| INV-CF-I07-001 | N/A | No admin/audit/network route authority is changed; reuse centralized capability helper. |
| INV-CF-I07-002 | N/A | No role/plan/admin semantic no-op mutation. |
| INV-CF-I07-003 | N/A | No role downgrade. |
| INV-CF-I07-004 | APPLIES | Local integrated runner starts Worker/Vite/browser and must verify owned process-tree termination before PASS. |
| INV-CF-I08-001 | N/A | No analytics/reporting output; money arithmetic is covered by INV-MONEY-001. |
| INV-CF-I08-002 | N/A | No multi-hotel network aggregation. |
| INV-CF-I08-003 | N/A | No analytics date/range/state query. |
| INV-CF-I08-004 | N/A | No booking/room state expansion. |
| INV-CF-I08-005 | N/A | No reporting default clock/range or cross-surface reporting continuity. |
| INV-SCOPE-001 | APPLIES | Diff remains limited to F0.9 charge identity, recovery, D11, UI and evidence; no F0.10+ or Blocks A–H. |

## Read-only contract reviews and Pre-Critic preflight

- Contract Reviewer: separate GPT-6 Luna Medium agent; confirmed F0.9 depends only on F0.2 among F0 items, provided the requirement→surface→acceptance→evidence checklist and all 24 invariant dispositions above, and found no `ROADMAP_BLOCKER`. It confirmed token retention is a check against existing charge-row lifetime, not authorization to invent expiry.
- DB/Data Reviewer: separate GPT-6 Luna Medium agent; confirmed no material contract blocker, flagged `meta.changes` and post-batch checks as insufficient exact-winner evidence, and recommended booking-scoped durable token identity with legacy NULLs and full state/event/ledger assertions.
- Multi-agent capability: `true` for these two completed read-only reviews; no agent edits or migrations. Independent Critic remains a later distinct review of exact immutable A+B.
- Pre-implementation contract preflight: source surfaces inspected; no unresolved product behavior identified. Any newly discovered retention-policy conflict or API compatibility contract conflict must be evaluated against approved authority, not guessed.

## Gate and recovery

F0.9 Development Gate requires every applicable acceptance item and invariant above to be freshly proven. A green test subset is not closure. Then run mandatory `.orchestration/PRECRITIC-GATE.md`, create `.orchestration/evidence/HMS-F0-09-EXTRA-CHARGE-IDEMPOTENCY-001-INVARIANTS.md`, publish immutable Artifact A and orchestration-only B, and stop for a fresh Independent Critic. Routine technical failures are repaired autonomously. No Human Gate or `ROADMAP_BLOCKER` is currently identified. F0.10 may begin only after F0.9 exact artifact/boundary review closes, following the approved DAG; Foundation 0 remains open until F0.12.
