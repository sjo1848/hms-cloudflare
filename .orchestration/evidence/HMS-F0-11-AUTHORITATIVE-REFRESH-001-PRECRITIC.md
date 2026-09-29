# F0.11 Pre-Critic — Authoritative Refresh and UI Continuity

Task Contract: `.orchestration/contracts/HMS-F0-11-AUTHORITATIVE-REFRESH-001.md`
Reviewed inputs: approved Foundation 0 §F0.11, F0.2/F0.10 completion state, repository surface audit, affected frontend source, binding invariants and Pre-Critic Gate.
Phase: pre-implementation admission analysis; this is not final artifact Pre-Critic evidence or an Independent Critic verdict.

## Contract completeness and source inspection

- **PASS:** objective and boundaries are explicit; no new API/schema contract or global cache is presumed.
- **PASS:** repository confirms request-epoch guard already exists in Reception queue and Housekeeping board; these are retained, not duplicated.
- **PASS:** concrete latest-wins gaps exist in Rooms and Billing. Reception retains a stale selection when booking is absent from queue; existing scoped `GET /bookings/:id` is authority, so only its 404 may clear selection.
- **PASS:** mutation semantics remain explicit commands; this task only reconciles reads and visible authoritative state.
- **PASS:** Billing is constrained to Booking Account/Folio refresh; Cash/Shift in the same file is expressly excluded.
- **PASS:** `INV-ATOMIC-001` is limited to truthful UI representation; unchanged backend atomicity is not re-certified. Queue order is unchanged, so `INV-ORDER-001` is N/A.
- **PASS WITH REPAIR REQUIRED:** clean base JS measured 299,947/300,000 B; F0.11 output initially measured 300,858 B. The budget is binding. Conditional scope now allows tuning existing Terser compression only (no budget increase, dependency, aggregate unsafe transforms or property mangling); full tests and integrated browser must validate transformed output.
- **OPEN FOR CODE/TEST:** no DOM test library exists. Use deterministic Playwright deferred-route tests or a minimal request helper test plus integrated Worker/D1 browser assertions; no sleeps. The out-of-order proof must include Billing's secondary invoice/payment/charge reads.

## Requirement → surface → planned acceptance → evidence admission map

| Requirement | Expected surface | Acceptance target | Evidence required before artifact |
|---|---|---|---|
| Rooms latest response wins | `RoomsPage.tsx` | Older room/booking load cannot overwrite newer; selection reconciles to current identity | Deferred-promise deterministic test; targeted UI assertion |
| Billing selection/account coherence | `BillingWorkspace.tsx` | Older booking/account request cannot replace newer selected booking or pair the wrong invoice/payments/charges | Deferred response test across both booking list and account reads; exact identities |
| Reception authoritative selection | `useReceptionWorkspace.ts`, API | Queue omission triggers detail GET; selected booking updated when found and cleared only on 404; queue epoch remains | Deterministic browser assertions for detail 200/404 and response identity |
| Housekeeping stale-read and mutation refresh | `useHousekeepingWorkspace.ts` | Existing epoch rejects stale reads; failed post-mutation read does not advance selection or claim refreshed truth; error/retry remain visible | Deferred-route regression plus integrated local mutation and authoritative board assertion |
| Context continuity | affected workspaces/router only as needed | Reception identity; Rooms search/selected room; Billing hotel+booking identity; Housekeeping date/filter/search/selection/next remain | Per-workspace assertions; URL/history only if router changes; scroll only for tested in-place interactions |
| Mutation → authoritative reads | Reception; Housekeeping; Rooms/holds; Booking Account | Lifecycle/reservation commands reread Reception queue/detail/room projection; HK commands reread same-date board; room/hold commands reread rooms/bookings and selected holds; payment/charge rereads same booking account. Cash/Shift excluded | Representative integrated operation per family + targeted exact identity/deferred tests; no unexercised command coverage claim |
| Integrated authority | local Worker/D1 + Vite | mutation or 409 followed by refetch converges with persisted synthetic D1 state at desktop and mobile | Executable browser script, D1 assertions, viewport proof, owned process cleanup |

## Adversarial pre-flight

- A stale response can arrive after a newer selection and must not update data, errors, or loading indicators owned by that newer request.
- In Billing, guarding only the initial bookings list is insufficient; identity remains bound across invoice, payment, and charge reads. A booking switch during detail reads discards the stale snapshot.
- Failed billing detail reads cannot leave prior account data displayed under new selection.
- A successful mutation followed by failed refresh is not equivalent to failed mutation; preserve command outcome, visibly report refresh failure and retain authoritative retry.
- Queue omission is not deletion proof; Reception detail GET (200/404) decides selected context.
- Housekeeping `load()` returning null after stale/error must not advance `next`; preserve date/filter/search/selection and expose refresh retry.
- No queue ranking/priority/next rule changes: `INV-ORDER-001` is N/A. `INV-ATOMIC-001` covers UI truthfulness only; backend atomicity is unchanged and not re-certified.
- Cash/Shift balance and close-cash are explicitly out of scope.
- No arbitrary sleep, timeout inflation, blind retry, optimistic booking/room/account state, backend API change, migration, or unrelated module edit is accepted.
- Test runners that own local Worker/Vite/browser processes must prove process cleanup before PASS.

## Initial invariant applicability review

All 24 registry entries were classified in the frozen contract. Applicable: `INV-ATOMIC-001` (UI truthfulness only), `INV-TENANT-001`, `INV-UX-001`, `INV-RESP-001`, `INV-EVID-001`, `INV-MONEY-001` (financial read identity/value only), `INV-STATE-001`, `INV-CF-I07-004`, `INV-SCOPE-001`. `INV-ORDER-001` is N/A because queue ranking/order/next semantics do not change. Recheck against final diff.

## Admission decision

`PRE-IMPLEMENTATION CONTRACT GATE: PASS`

Independent Contract Reviewer Laplace (read-only, GPT-6 Luna Medium) returned eight bounded precision/evidence findings and no blocker. All are incorporated: detail GET authority for Reception; command→refresh resource matrix; identity-bound Billing snapshot and Cash/Shift exclusion; refresh failure/context assertions; Housekeeping failure/next behavior; INV-ORDER N/A and INV-ATOMIC scope. No product decision or backend change is required. Existing Playwright route interception provides deterministic deferred-response testing without sleeps. The newly observed budget dependency is a bounded build configuration repair within the pre-existing 300,000-byte ceiling; final Pre-Critic must audit the exact Terser settings and full runtime evidence.

This is not the final mandatory Pre-Critic Gate. Final invariant evidence and complete Pre-Critic must be refreshed against the implementation artifact.
