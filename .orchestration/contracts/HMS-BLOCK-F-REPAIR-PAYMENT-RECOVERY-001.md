# HMS-BLOCK-F-REPAIR-PAYMENT-RECOVERY-001 — Frozen bounded F-account clarification

Status: `FROZEN BEFORE PAYMENT-RECOVERY IMPLEMENTATION`
Parent: `.orchestration/contracts/HMS-BLOCK-F-ACCOUNT-FINANCE-CASH-001.md`
Authority: Issue #52 `CONTROLLER_DECISION: START`; approved F-account at-most-once payment/retry requirements, F0/D11 behavior and Blocks A–H contracts.
Base: `39ee0a2b38e7205b8e041e792e16ee469c996241`.

## Evidence-driven defect

The frozen F-account inventory/reviewer inspection found that `recordPayment()` evaluates the current remaining balance before looking up an existing payment operation token. Consequently, an exact retry after an accepted final payment can return 409 because the current invoice is already settled. The UI keeps payment identity only in React state, so reload after a committed response loss starts a new operation and may duplicate a partial payment. The repository lookup accepts only a token although the approved uniqueness grain is `(booking_id, operation_token)`.

This bounded repair completes the already approved payment operation identity/recovery behavior; it adds no new financial policy, endpoint, capability, schema, ledger source, settlement rule or Cash behavior.

## Frozen requirements

| Requirement | Surface | Acceptance | Evidence |
|---|---|---|---|
| Same-operation replay | existing `POST /bookings/:id/payments`, D1 repository | Find the durable prior row by booking + token and compare the complete normalized existing payment payload before current-balance validation. Exact match returns the persisted amount and a fresh authoritative invoice; changed payload or booking conflicts. New operation still applies all current invoice/remaining constraints. | executing local Worker+D1: final-payment replay after zero remaining, changed-payload conflict, cross-booking token case, exact ledger and invoice snapshots |
| Reload-safe uncertain payment | existing BillingWorkspace and existing POST route | Before send, sessionStorage holds active hotel, booking, opaque token and exact amount/method/reference/note. After reload, preserve/select the same Booking/Stay and show a truthful unresolved state. Only an explicit retry resubmits the exact saved payload/token; user cannot alter it or initiate another payment until resolved. Clear identity only on definitive 4xx rejection or POST success followed by successful authoritative account refresh. | integrated Worker+D1 browser: test-only `LOCAL_DEV_AUTH` seam commits in D1 then returns synthetic 502 (no production behavior); reload; retry same token/payload; one payment row, exact invoice amount and visible recovered status; retry after transient refresh failure |
| Scoped operation lookup | repository/ports/route | Resolve prior payment within authenticated hotel D1 and exact booking ID + operation token. Token is not authority. | executing-D1 same token on two bookings; each result is isolated and correct, cross-tenant request stays denied |
| Context return safety | BillingWorkspace | Accept only a same-origin normalized Reception path `/bookings` (query/hash preserved); traversal or external destinations fall back to Reception root. | Browser checks normal return, encoded traversal and external return candidate |
| Cash boundary | contextual Billing route | A route opened from the Booking/Stay Case renders only its account task; legacy direct `/billing` remains exactly as before. No Cash file/route/API behavior or owner model is modified. | static source diff and direct-route/context-route browser assertions |

## Non-goals

No payment lookup endpoint, persistence migration, operation-token format change, settlement/overpayment exception, automatically resubmitted payment, cross-booking token transfer, payment edit/delete, Cash route/UI/API change or F-cash owner/session semantics. The test-only post-commit response-loss header is honored only when Worker binding `LOCAL_DEV_AUTH=true`; it is not a production API behavior. `settle-payment` and checkout remain under existing contracts; checkout settlement authority is unchanged.

## Admission

Contextual Account entry and amount-summary implementation began under the parent contract. No durable payment-recovery persistence had been implemented when this evidence-driven gap was identified; any preliminary route change remains an unpublished working diff and must conform to this frozen clarification. This bounded clarification must pass the parent Pre-Critic and all applicable invariant evidence before Artifact A.
