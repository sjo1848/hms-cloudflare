# 18 — End-to-end implementation scope matrix

Status: `BINDING SCOPE CONTRACT / IMPLEMENTATION LOCKED`

Purpose: define the complete operational scope that must be implemented and proven before the next HMS workflow wave can be called complete. This matrix does not authorize implementation by itself; it removes ambiguity about what BUILD must eventually deliver.

## Global rules applying to every flow

Every mutation must enforce tenant/hotel context, backend RBAC, stale/concurrency guards, atomic business truth, truthful audit/event creation only on success, no partial write on failure, and authoritative reload after success/conflict. Stable IDs may carry UI context but never authorization.

Accepted source behavior is preserved unless this package explicitly changes it. Physical room state, future sellability and immediate readiness remain separate facts. Date-sensitive rules use backend-derived `hotel_local_date` from persisted hotel IANA timezone. Money values use integer cents and Billing truth is authoritative.

## E2E-00 — Technical foundations

Owner: platform/domain foundation.

Required before material feature UI:
- generated raw JS reduced to `<=300000` without raising the `320000` budget or deleting accepted behavior;
- hotel IANA timezone persisted/backfilled and available through trusted server context;
- helper for authoritative hotel-local date;
- incremental migrations only; historical migrations remain immutable;
- existing tenant/RBAC/audit invariants remain green.

Acceptance: CI/budget gates prove headroom; timezone tests prove UTC/browser timezone cannot change lifecycle eligibility.

## E2E-01 — Reservation with existing guest

Owner: Reception.

Trigger: operator creates reservation for known guest.

Path: search/select guest -> dates -> availability -> room -> review -> create -> select resulting booking.

Authoritative effects: booking + inventory claims created atomically under hotel tenant. Room physical state is not changed by advance reservation.

Failure paths: validation, overlap, hold, blocking maintenance, stale availability, tenant/RBAC. Failure creates no partial booking/inventory drift.

Acceptance: result appears in Reception/read model and availability; no module switch required.

## E2E-02 — Reservation with new guest inline

Owner: Reception.

Trigger: guest does not yet exist.

Path: search -> create guest inline -> reservation data -> room -> confirm.

Binding rule: guest + booking are one business intent. Default failure outcome is no unintended orphan guest. Same-hotel D1 should use one atomic command rather than frontend compensation.

Duplicate identity uses existing uniqueness semantics; no auto-merge is invented.

Acceptance: success persists both and selects booking; concurrent room loss leaves neither unintended guest nor booking.

## E2E-03 — Formal check-in

Owner: Reception.

Preconditions: booking `CONFIRMED`; accepted check-in checklist/evidence complete; assigned room immediately ready/physically `AVAILABLE`; no blocking maintenance; backend concurrency/RBAC guards pass.

Source-parity timing: no new hard calendar window is added to `CONFIRMED -> CHECKED_IN`.

Mutation: booking -> `CHECKED_IN`; room -> `OCCUPIED`; existing inventory remains; check-in evidence + actor/audit persisted atomically.

UI: readiness/blocker visible before final action. If not ready, explain blocker and provide contextual navigation rather than failing late without context.

Acceptance: successful check-in updates Reception, Rooms, Guests and Housekeeping/read models after authoritative refresh; stale readiness rejects without partial state.

## E2E-04 — Arrival exception: cancellation

Owner: Reception.

Preconditions: booking still `CONFIRMED`; accepted terminal reason/evidence; authorization.

Source parity: no new arrival-date cutoff is introduced.

Mutation: `CONFIRMED -> CANCELLED`; release reservation inventory; physical room unchanged; terminal actor/time/reason + lifecycle evidence persisted.

Financial boundary: no automatic refund, retention or penalty is added in this wave; existing payment/invoice evidence remains visible.

Acceptance: booking leaves active arrival inventory, room is not dirtied, failed/stale transition creates no success event.

## E2E-05 — Arrival exception: no-show

Owner: Reception.

Preconditions: booking `CONFIRMED`, never occupied, `hotel_local_date >= check_in`, terminal reason/evidence, authorization.

Mutation: `CONFIRMED -> NO_SHOW`; release inventory; physical room unchanged; audit/event persists actor, room and stay context.

Future arrival (`hotel_local_date < check_in`) is rejected.

Financial boundary: no automatic penalty/refund/retention in this wave.

Acceptance: source-parity same-day eligibility; queue and availability revalidate immediately; concurrent check-in winning makes no-show fail cleanly.

## E2E-06 — Late-arrival note

Owner: Reception.

Booking remains `CONFIRMED`. ETA/note uses accepted source semantics and is operational context, not a new lifecycle state. Read model may reprioritize/explain it without narrowing transition permissions.

Acceptance: note is persisted/audited and survives refresh; no inventory or room-state mutation.

## E2E-07 — In-stay room reassignment

Owner: Reception.

Preconditions: booking `CHECKED_IN`; destination distinct, physically ready, no blocking maintenance, no overlapping hold/inventory conflict over remaining interval; stale room relation rejected.

Inventory interval: `effective_date = max(check_in, hotel_local_date)`; only `[effective_date, check_out)` moves. Historical nights remain tied to prior room and reassignment event.

Mutation: booking current room -> destination; destination -> `OCCUPIED`; old room -> `DIRTY` when no open `BLOCKING` case, otherwise `MAINTENANCE`; remaining inventory moves atomically.

Source-parity pricing: accommodation becomes total stay nights × destination current room price; add existing extra charges; reconcile invoice atomically. Operator must see material price/balance change before confirm.

Acceptance: old room never becomes directly available; history remains truthful; any conflict rolls back booking/rooms/inventory/Billing/events together.

## E2E-08 — Non-blocking occupied maintenance

Owners: Reception reports; Housekeeping/Ops resolve according to RBAC.

Open case: impact `NON_BLOCKING`; room remains `OCCUPIED`; booking remains active; future sellability/readiness follows normal room/inventory policy because non-blocking is advisory.

Cleaning/state transitions are not granted to Reception by maintenance reporting capability.

Resolution while occupied closes case and leaves room `OCCUPIED`.

Acceptance: case visible on operational board/context; truthful same-state maintenance event; no artificial room-state mutation.

## E2E-09 — Blocking occupied maintenance and relocation

Owners: Reception + Housekeeping/Ops.

Open case: impact `BLOCKING`; occupied room remains `OCCUPIED`, future sale/readiness blocked and Reception gets relocation-required attention.

No automatic guest move. Reception explicitly reassigns or later checks out.

On vacancy with still-open blocking case: old room -> `MAINTENANCE`. Resolving from maintenance -> `DIRTY`; normal cleaning then required.

Existing future reservations are not auto-cancelled/reassigned; they become attention cases until repair or explicit Reception action.

Acceptance: new sale excludes blocked room, current guest is not silently moved, future bookings remain intact but visibly blocked.

## E2E-10 — Vacant-room blocking maintenance

Owner: Housekeeping/Ops.

Opening `BLOCKING` on `AVAILABLE|DIRTY|CLEANING` moves room to `MAINTENANCE` and blocks sale. Resolution -> `DIRTY`; cleaning required before available.

One open maintenance case per room in v1. `NON_BLOCKING -> BLOCKING` escalation is explicit. Multiple independent simultaneous cases are deferred.

## E2E-11 — Housekeeping turnover

Owner: Housekeeping.

Normal path: `DIRTY -> CLEANING -> AVAILABLE`.

Board remains authoritative housekeeping read model. Occupied rooms appear only when maintenance work exists; occupied rooms without case are not housekeeping tasks.

Actions obey cleaning vs maintenance capabilities separately.

Acceptance: checkout/reassignment-created dirty room appears without manual task creation; finish cleaning makes room immediately ready only when no blocking condition remains.

## E2E-12 — Checkout

Owner: Reception with Billing context.

Preconditions: booking `CHECKED_IN`; room occupied; accepted checkout checklist; room-release confirmation; authoritative Billing state; backend/RBAC/concurrency guards.

Financial parity:
- `settled` requires authoritative fully paid account;
- positive balance requires governed `pending-approved`, required reference and accepted override capability.

Mutation: booking -> `CHECKED_OUT`; room -> `DIRTY` or `MAINTENANCE` according to open blocking case; release unneeded inventory; create/reconcile invoice as required; persist checkout + optional override evidence atomically.

UI: selected Reception booking controls embedded Billing. Show total, extra charges, paid, remaining and settlement state before confirmation.

Acceptance: Housekeeping/Maintenance receives resulting work through room state; no duplicate manual handoff; failed financial/room check leaves lifecycle unchanged.

## E2E-13 — Checked-in stay extension

Owner: Reception + Billing.

Preconditions: booking `CHECKED_IN`; new checkout later; same room; every added night free of booking claim, hold and blocking maintenance; stale relation rejected.

Mutation: claim `[old_check_out, new_check_out)`; update checkout; booking stays checked in and room occupied; persist extension audit atomically.

Source-parity pricing: total stay nights × current room price + existing extra charges. Reconcile existing invoice to authoritative total; if amount exceeds paid amount, invoice cannot remain `PAID`.

UI discloses added nights, current room price, recalculated total and resulting balance before confirmation.

Acceptance: any added-night/Billing/concurrency conflict rolls back all parts; replay is idempotent/safe.

## E2E-14 — Extra charge after payment/invoice

Owner: Billing/Reception according to existing capability.

Any successful extra charge changes authoritative booking total and must keep existing invoice truthful. A previously paid invoice cannot remain falsely settled when amount rises above paid amount. Payment entries remain immutable.

Acceptance: booking total, invoice amount/status, remaining balance and UI agree after mutation; failure is atomic.

## E2E-15 — Front-desk operational read model

Owner: API/read layer.

Preserve/extend the accepted source contract `GET /api/v1/front-desk/board` instead of inventing a parallel route.

It must provide enough authoritative joined/derived context for queue priority, arrival/departure classification, readiness, blockers, late-arrival context, maintenance impact and recommended action without becoming write authority.

Housekeeping keeps `/housekeeping/board` as its own authoritative view.

Acceptance: Reception no longer reconstructs critical priority/readiness from unrelated endpoints where the board can own that meaning.

## E2E-16 — Context navigation and freshness

Stable query context uses IDs (`booking_id`, `room_id`, `guest_id` where applicable), never names and never authorization.

Revalidation occurs after mutation, when visible screen regains focus, on modest visible-screen polling (about 30s initial target), and when contextual navigation opens a case. Polling reduces/pauses while hidden.

Stale previews are advisory; backend always revalidates. Conflict returns explanation + authoritative refresh, never force/replay of stale intent.

## E2E-17 — Post-action continuation

After successful Reception lifecycle mutation: preserve current search/filter, reload authoritative board/context, let completed item move/disappear naturally, select next visible case by the same deterministic queue priority. Empty queue remains empty without silently changing filters.

Acceptance records whether next work is obvious without operator memory or unnecessary module switching.

## E2E-18 — Audit, lifecycle events and evidence

Required lifecycle evidence covers check-in, reassignment, checkout, no-show, cancellation and extension, plus truthful maintenance events. Event exists iff authoritative mutation won.

Material details include actor/hotel/request identity plus command-specific old/new rooms, dates, inventory interval, resulting state, price/financial delta where applicable and override reference where applicable.

Absolute timestamp and hotel-local operational date are distinct and both preserved when material.

## E2E-19 — Synthetic hotel-shift acceptance

Before the wave is accepted, execute scenarios at minimum:
1. reservation + existing guest;
2. reservation + new inline guest;
3. normal check-in;
4. cancellation;
5. same-day/overdue no-show;
6. late-arrival note;
7. normal checkout -> housekeeping -> available;
8. active-stay reassignment without maintenance;
9. non-blocking occupied maintenance;
10. blocking occupied maintenance -> relocation -> repair -> cleaning;
11. future booking blocked by maintenance and manually resolved/reassigned;
12. stay extension success;
13. extension conflict rollback;
14. paid invoice followed by total increase;
15. pending-balance checkout override;
16. stale/concurrent action rejection;
17. cross-module focus/revalidation and next-case continuation.

Record module switches, confirmations, duplicate data entry, stale/conflict outcomes, operator-memory dependencies and whether next action is obvious. Responsive browser proof must include contracted mobile and desktop widths.

## Explicitly outside this implementation wave

No automatic refund/penalty/retention policy; no split stay or automatic relocation; no multiple simultaneous maintenance cases per room; no new OUT_OF_ORDER transition design; no WebSockets/paid real-time service; no contracted/frozen nightly-rate model; no new check-in/cancellation/no-show cutoff beyond accepted source behavior; no production/cutover/real-data migration; no unrelated redesign of Reports, Users or Network.

## Completion rule

The implementation wave is complete only when every in-scope E2E row has a bounded implementation contract, domain/API proof, regression coverage where applicable, responsive browser evidence, cross-module consequence proof and no unresolved contradiction with the canonical master/transition matrix/invariants. A green UI or isolated endpoint is not sufficient.