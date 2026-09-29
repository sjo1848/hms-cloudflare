# HMS-F0-11-AUTHORITATIVE-REFRESH-001 — Task Contract

Status: `FROZEN BEFORE IMPLEMENTATION`
Phase: Foundation 0 / F0.11 — Refresh/invalidation and authoritative UI continuity
Authority: approved Foundation 0 authorization and `docs/implementation-roadmap/HMS-FOUNDATION-0-CONTRACT-V1.md` §F0.11; dependent on F0.2 and F0.10.
Scope: local/synthetic implementation and evidence only. No real data or promotion.

## Objective

After a successful mutation or conflict, affected workspace reads must converge to the newest authoritative server response. An older request must not overwrite a newer selection or newer response. A UI must not report an authoritative refresh as successful when the refresh failed. Existing meaningful filter/search/selection/URL context remains where its resource still exists; if the authoritative resource no longer exists, stale selected domain data must not be retained as truth.

## Evidence-based current defects

1. `apps/web/src/features/rooms/RoomsPage.tsx`: `load()` has no request generation guard. Two overlapping `/rooms` + `/bookings` loads can resolve out of order; an older result can overwrite the newer room board and selection.
2. `apps/web/src/features/billing/BillingWorkspace.tsx`: `BillingPanel.refresh()` has no generation/booking identity guard across the bookings read and subsequent invoice/payment/charge reads. A slower prior selection can replace a newer selection or attach prior booking account data to a later UI state.
3. `apps/web/src/features/reception/useReceptionWorkspace.ts`: queue `load()` is sequence-guarded, but on a response that no longer contains the selected booking it retains the previous `Booking` object (`?? current`). Queue absence alone does not prove deletion; existing tenant-scoped `GET /bookings/:id` is the existence/status authority.
4. `apps/web/src/features/housekeeping/useHousekeepingWorkspace.ts`: board reads already use `boardRequestRef`; this is an existing guard to preserve and regression-check, not a reason to add another cache mechanism.

## Requirement → expected surface → acceptance → evidence

| Requirement | Expected surface | Acceptance | Evidence |
|---|---|---|---|
| Latest room read wins | `RoomsPage.tsx` | An older delayed board/bookings response cannot overwrite a newer response or selected room; search selection remains if the room still exists; removed room clears selection | Deterministic out-of-order test and browser assertion |
| Billing selection remains coherent | `BillingWorkspace.tsx` | Each booking selection's invoice/payments/charges belong to that exact booking; stale refresh cannot overwrite current selection/account; failed authoritative refresh is visibly an error, not success | Deferred-response component/browser test with distinct booking identities |
| Reception is authoritative | `useReceptionWorkspace.ts`, `reception-api.ts`, existing `GET /bookings/:id` | If selected booking is absent from queue, fetch authoritative detail; update if found; clear only on authoritative 404. Keep queue request epoch; filters/search/URL outside this hook untouched | Directed detail/404 test and browser success/conflict refresh assertion |
| Housekeeping sequencing remains | `useHousekeepingWorkspace.ts`, `housekeeping-api.ts` | Existing request-id rule still rejects delayed older response; mutation result is not represented as refreshed authoritative state on failed reread | Regression test for delayed response and failed post-mutation read |
| No false success or optimistic domain truth | all contracted workspaces | Mutation completion and authoritative read completion are distinct; conflict/success feedback is retained if reread fails, with a usable refresh/retry path where the current UI supports it | Browser-visible success/conflict + stale response scenarios |
| Billing account display | `BillingWorkspace.tsx` BillingPanel only | On booking selection change, do not display prior invoice/payment/charge data as the new booking's account. Commit account components as one booking-identity-bound snapshot; clear/mark unavailable on failed read. Cash/Shift section expressly excluded | Deferred booking-switch test and failed subread assertion |
| Context continuity | Reception, Rooms, Billing, Housekeeping; `router.tsx` only if required | Reception selection follows authoritative detail identity; Rooms filter/selected room persist if still present; Billing selection persists by hotel+booking; Housekeeping date/filter/search/selection/scroll and `next` behavior remain. URL/Back/Forward asserted only if changed code touches routing; scroll asserted only on an interaction expected not to navigate | Per-workspace browser assertions after success/conflict, with unchanged/not-applicable evidence stated explicitly |
| Mutation-to-read map | existing resource hooks/API callers | Reservation create/edit/cancel/check-in/reassign/checkout refresh Reception queue/selected booking/related room state; housekeeping transition refreshes board at same date and selected task context; room/hold writes refresh room-bookings projection and selected room/holds; extra charge/payment refreshes the same Booking Account. Cash/Shift balance and close are out of scope | Representative local integration per resource family plus deterministic read-race tests; do not claim unexercised commands individually integrated |

## Scope and actual surfaces

Current repository surfaces expected to change only if tests confirm the defects:

- `apps/web/src/features/rooms/RoomsPage.tsx`
- `apps/web/src/features/billing/BillingWorkspace.tsx`
- `apps/web/src/features/reception/useReceptionWorkspace.ts`
- `apps/web/src/features/housekeeping/useHousekeepingWorkspace.ts`
- corresponding existing tests under the feature directories, or a focused test utility under `apps/web/src` if component-level testing requires it.
- `apps/web/src/api/client.ts`, `apps/web/src/app/router.tsx`, reception/housekeeping API wrappers are inspection surfaces; change only if an observed contract defect cannot be repaired in the owning workspace.
- `apps/web/vite.config.ts` is conditionally in scope to preserve the binding 300,000-byte raw-JS ceiling: the clean base artifact measured 299,947 bytes and F0.11 exceeded it by 858 bytes. Only existing Terser compression settings may be optimized; do not raise budgets, add a minifier, enable aggregate `unsafe`, or mangle public/API properties. The optimized output must pass complete tests and integrated browser regressions.

No new shared invalidation/cache abstraction is authorized unless a concrete implementation need is demonstrated and remains smaller than resource-local request identity guards. No API or schema changes are planned.

## Non-goals / prohibited actions

- No global cache, realtime, polling framework or speculative invalidation system.
- No route/navigation redesign; no change to hotel operational semantics or mutation contracts.
- No backend/domain/schema/migration changes absent a demonstrated backend contract gap.
- No modifications to Reports, Users, unrelated workflows or F0.12 before F0.11 artifact boundary.
- No real/customer data, live cutover, pricing bootstrap, Blocks A–H, PR, push, merge, `main`, staging, deploy or production.

## Concurrency and failure semantics

- Every latest-wins read is scoped to the owning view/resource identity; stale responses are ignored and cannot clear loading/error state owned by a newer request.
- Booking-specific billing reads are committed as one coherent snapshot only if the selected booking/request identity is still current after all component reads resolve.
- On booking selection change, clear/mark unavailable the previous account snapshot until the new booking's full account reads succeed; failed reads must not cross-bind old account values under the new booking.
- Reception queue omission triggers existing tenant-scoped `GET /bookings/:id`; update selected state from its response and clear only after authoritative 404. Queue omission is not deletion proof.
- Refresh errors remain observable; a successful mutation followed by failed refresh is not represented as fully refreshed state. Preserve command outcome, show the refresh error and retain an explicit authoritative retry path. Housekeeping must not advance to `next` after failed reread.
- Housekeeping, Reception, Rooms and Billing preserve the relevant resource identity and active search/filter/date/selection through an in-place refresh. Routing behavior is unmodified; URL/Back/Forward and scroll are asserted only for tested flows that invoke them.
- Billing scope is Booking Account/Folio and its charges/payments only; Cash/Shift balance and close are excluded.
- No queue ordering/priority/next-item rule changes; `INV-ORDER-001` is N/A. `INV-ATOMIC-001` covers UI truthfulness about existing outcomes only; backend atomicity/winner/event behavior is unchanged and is not re-certified here.
- Preserve existing command idempotency tokens and backend winner semantics; this task does not change retry identity or mutation payloads.
- No backend write operation is introduced; all mutations remain the current explicit API commands.

## Validation / QA

1. Deterministic deferred-promise tests for Rooms and Billing out-of-order responses and Reception selected-record disappearance.
2. Housekeeping delayed-response guard regression and post-mutation refresh failure behavior.
3. Directed browser flow against local Worker/D1/Vite (no mock as substitute): perform one existing synthetic mutation, force/induce an overlapping read or 409 refresh, then assert authoritative persisted identity/state and preserved workspace context. Use existing accepted local integration runner or a focused isolated runner; do not use real data.
4. If no existing deterministic browser seam can force delayed ordering without sleeps/timeouts, use deferred API test doubles for ordering and a separate integrated Worker/D1 browser flow for authoritative persistence. Do not add arbitrary sleeps, inflated timeouts or blind retries.
5. Regression: `npm run check`, `npm run types:check`, `npm run web:build`, architecture fitness/budgets, D1 query plans, Wrangler dry-runs; targeted existing regressions for changed behavior. No broad unrelated browser gate claim.
6. Pre-Critic and invariant evidence are mandatory before immutable Artifact A. A separate Independent Critic reviews exact A+B; Codex does not self-PASS.

## Gate / critic / recovery

- Development Gate: every contracted workspace rejects stale read completion and reaches an authoritative view after the tested mutation/conflict, retaining meaningful existing context; failed refresh remains visible and recoverable.
- Critic: adversarial stale-state and context-continuity review across changed workspaces; verify no scope drift or cache abstraction.
- Human Gate: none under current approved contract unless a real product-intent, backend-authority, security, or data policy conflict is discovered.
- Rollback/recovery: revert the resource-local UI guards/selection reconciliation; authoritative manual refresh remains available. No persisted state changes exist in this task.
- Open question: only introduce API version/ETag/command identity if executable evidence demonstrates that frontend read ordering alone cannot meet the contract; that would require a new bounded contract, not an assumption in this task.

## Durable invariant classification (all registry invariants)

| Invariant | Classification | Rationale / planned acceptance evidence |
|---|---|---|
| INV-ATOMIC-001 | APPLIES | Only UI truthfulness is in scope: verify stale reads do not imply command winner/success; backend atomicity/winner behavior is unchanged and not re-certified. |
| INV-AUDIT-001 | N/A | No event/audit mutation path changes; integrated synthetic command checks existing persisted outcome only. |
| INV-DOMAIN-001 | N/A | No domain transitions or API writes added; static diff confirms. |
| INV-TENANT-001 | APPLIES | Existing tenant-scoped reads are refreshed; integrated local evidence uses configured tenant identity and confirms no cross-tenant request/state expansion. |
| INV-RBAC-001 | N/A | No protected API or capability surface changes. |
| INV-PARITY-001 | N/A | No source capability or domain rule is migrated/changed. |
| INV-ENUM-001 | N/A | No enum normalization or predicate changes. |
| INV-UX-001 | APPLIES | Preserve current operational context and task semantics through authoritative refresh; browser tests on affected flows. |
| INV-ORDER-001 | N/A | No queue ranking, priority or next-item rule changes; existing order is passed through unchanged. |
| INV-RESP-001 | APPLIES | Targeted integrated flow must exercise material control at desktop and mobile contracted widths where the changed workspace supports both. |
| INV-EVID-001 | APPLIES | Each claim maps to deterministic test, integrated browser or source diff; mock evidence labeled distinctly. |
| INV-LEGACY-001 | N/A | No synthesized historical data or recovery records. |
| INV-MONEY-001 | APPLIES | Billing account reads include monetary state; no arithmetic/write changes; assert invoice/payment/charge identity and values remain server-authoritative after races. |
| INV-STATE-001 | APPLIES | Immutable implementation Artifact A plus orchestration-only exact-A Boundary B, external review required, no self-approval. |
| INV-CF-I07-001 | N/A | No admin/network/audit endpoints or route authorization changes. |
| INV-CF-I07-002 | N/A | No admin mutations. |
| INV-CF-I07-003 | N/A | No role downgrade. |
| INV-CF-I07-004 | APPLIES | Integrated runner starts local processes; must own cleanup and verify processes absent before reporting PASS. |
| INV-CF-I08-001 | N/A | Reports/analytics and their calculations are explicitly out of scope. |
| INV-CF-I08-002 | N/A | No network aggregation. |
| INV-CF-I08-003 | N/A | No report date/range semantics. |
| INV-CF-I08-004 | N/A | No state enum expansion. |
| INV-CF-I08-005 | N/A | No report clock defaults or cross-surface reporting continuity. |
| INV-SCOPE-001 | APPLIES | Diff audit explicitly excludes F0.12, Blocks A–H and all unrelated modules. |

## Stop boundary

Stop after the exact F0.11 Artifact A + orchestration-only Boundary B are ready for fresh Independent Critic. Do not declare Foundation 0 complete. After F0.11 receives its required Independent Critic disposition, continue to F0.12 under its separately frozen Task Contract.
