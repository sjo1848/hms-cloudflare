# 18 — End-to-end implementation scope matrix

Status: `BINDING SCOPE CONTRACT / IMPLEMENTATION LOCKED`

Purpose: define the complete operational scope that must be implemented and proven before the next HMS workflow wave can be called complete. This matrix does not authorize implementation by itself; it removes ambiguity about what BUILD must eventually deliver.

## Global rules applying to every flow

Every mutation must enforce tenant/hotel context, backend RBAC, stale/concurrency guards, atomic business truth, truthful audit/event creation only on success, no partial write on failure, and authoritative reload after success/conflict. Stable IDs may carry UI context but never authorization.

Accepted source behavior is preserved unless this package explicitly changes it. Authorized target departures are **only** those registered in `20-intentional-target-departures.md`. Physical room state, future sellability and immediate readiness remain separate facts. Date-sensitive rules use backend-derived `hotel_local_date` from persisted hotel IANA timezone. Money values use integer cents and Billing truth is authoritative.

API/command ownership is binding in `19-api-command-contract-map.md`. Maintenance role permissions are binding in `05-maintenance-data-rbac.md`. BUILD may not add parallel lifecycle endpoints, broaden capabilities, or use generic booking PATCH/direct room status as a shortcut around canonical commands.

## E2E-00 — Technical foundations

Owner: platform/domain foundation.

Required before material feature UI:
- generated raw JS reduced to `<=300000` without raising the `320000` budget or deleting accepted behavior;
- hotel IANA timezone persisted/backfilled and available through trusted server context;
- helper for authoritative hotel-local date;
- incremental migrations only; historical migrations remain immutable;
- existing tenant/RBAC/audit invariants remain green.

Acceptance: CI/budget gates prove headroom; timezone tests prove UTC/browser timezone cannot change lifecycle eligibility. D1 in `20` governs the intentional timezone correction.

## E2E-01 — Reservation with existing guest

Owner: Reception.

Trigger: operator creates reservation for known guest.

Path: search/select guest -> dates -> availability -> room -> review -> create -> select resulting booking.

Authoritative effects: booking + inventory claims created atomically under hotel tenant. Room physical state is not changed by advance reservation.

Failure paths: validation, overlap, hold, blocking maintenance, stale availability, tenant/RBAC. Failure creates no partial booking/inventory drift.

Acceptance: result appears in Reception/front-desk board and availability; no module switch required. Canonical API remains `POST /api/v1/bookings`.

## E2E-02 — Reservation with new guest inline

Owner: Reception.

Trigger: guest does not yet exist.

Path: search -> create guest inline -> reservation data -> room -> confirm.

Binding rule: guest + booking are one business intent. Failure leaves no unintended orphan guest. Same-hotel D1 uses one atomic command rather than frontend compensation.

Duplicate identity uses existing uniqueness semantics; no auto-merge is invented.

Acceptance: success persists both and selects booking; concurrent room loss leaves neither unintended guest nor booking. Canonical command is `POST /api/v1/bookings/with-guest`, requiring both `guests.write` and `bookings.write`. D5 registers this target hardening.

## E2E-03 — Formal check-in

Owner: Reception.

Preconditions: booking `CONFIRMED`; accepted check-in checklist/evidence complete; assigned room immediately ready/physically `AVAILABLE`; no blocking maintenance; backend concurrency/RBAC guards pass.

Source-parity timing: no new hard calendar window is added to `CONFIRMED -> CHECKED_IN`.

Mutation: booking -> `CHECKED_IN`; room -> `OCCUPIED`; existing inventory remains; check-in evidence + actor/audit persisted atomically.

UI: readiness/blocker visible before final action. If not ready, explain blocker and provide contextual navigation rather than failing late without context.

Acceptance: successful check-in updates Reception, Rooms, Guests and relevant boards after authoritative refresh; stale readiness rejects without partial state. Canonical command remains `POST /api/v1/bookings/:id/check-in` using `lifecycle.write`.

## E2E-04 — Arrival exception: cancellation

Owner: Reception.

Preconditions: booking still `CONFIRMED`; `terminal_reason` has at least 6 trimmed characters; authorization.

Source parity: no new arrival-date cutoff is introduced.

Mutation: `CONFIRMED -> CANCELLED`; release reservation inventory; physical room unchanged; terminal actor/time/reason + lifecycle evidence persisted.

Financial boundary: no automatic refund, retention or penalty is added; existing payment/invoice evidence remains visible.

Acceptance: short/missing reason rejected before mutation; booking leaves active arrival inventory; room is not dirtied; stale transition creates no success event. Existing `PATCH /api/v1/bookings/:id` cancellation path is preserved as defined in `19`.

## E2E-05 — Arrival exception: no-show

Owner: Reception.

Preconditions: booking `CONFIRMED`, never occupied, `hotel_local_date >= check_in`, `terminal_reason` min 6 trimmed chars, `lifecycle.write`.

Mutation: `CONFIRMED -> NO_SHOW`; release inventory; physical room unchanged; event persists actor, room, dates and terminal reason.

Future arrival (`hotel_local_date < check_in`) is rejected. No automatic penalty/refund/retention is introduced.

Acceptance: source-parity same-day eligibility; missing/short reason rejected; queue and availability revalidate immediately; concurrent check-in winning makes no-show fail cleanly. Canonical command is `POST /api/v1/bookings/:id/no-show`. D3 registers the explicit-command hardening.

## E2E-06 — Late-arrival note

Owner: Reception.

Booking remains `CONFIRMED`. ETA/note uses accepted source semantics and is operational context, not a new lifecycle state. Read model may reprioritize/explain it without narrowing transition permissions.

Acceptance: note is persisted/audited and survives refresh; no inventory or room-state mutation.

## E2E-07 — In-stay room reassignment

Owner: Reception.

Preconditions: booking `CHECKED_IN`; `hotel_local_date < check_out`; destination distinct, physically ready, no blocking maintenance, no overlapping hold/inventory conflict over remaining interval; current booking-room relation still matches; operational `reason` min 6 trimmed chars.

The overrun guard and server-enforced reason are intentional target departures D2/D4 in `20`. If `hotel_local_date >= check_out`, operator must first extend to a future checkout or checkout; BUILD may not silently reassign an overrun stay.

Inventory interval: `effective_date = max(check_in, hotel_local_date)`; only `[effective_date, check_out)` moves. Historical nights remain tied to prior room and reassignment event.

Mutation: booking current room -> destination; destination -> `OCCUPIED`; old room -> `DIRTY` when no open `BLOCKING` case, otherwise `MAINTENANCE`; remaining inventory moves atomically.

Source-parity pricing: accommodation becomes total stay nights × destination current room price; add existing extra charges; reconcile invoice atomically. Operator sees material price/balance change before confirm.

Acceptance: missing/short reason rejected; overrun reassignment rejected; old room never becomes directly available; history remains truthful; any conflict rolls back booking/rooms/inventory/Billing/events together. Canonical command remains `POST /api/v1/bookings/:id/reassign`.

## E2E-08 — Non-blocking occupied maintenance

Owners: Reception reports/escalates; Housekeeping/Ops/Admin resolve according to binding RBAC.

Open case: impact `NON_BLOCKING`; room remains `OCCUPIED`; booking remains active; non-blocking case is advisory rather than an independent sale blocker.

Receptionist has `maintenance.read` + `maintenance.report`, not `maintenance.resolve`. Room-scoped detail is read through `GET /api/v1/housekeeping/:id/maintenance`, so Reception does not need `housekeeping.read` just to inspect the active case.

Opening uses expanded `POST /housekeeping/:id/maintenance` with impact/priority/reason/assignee. Escalation `NON_BLOCKING -> BLOCKING` requires `escalation_note` min 6 and `maintenance.report`. Resolution requires `resolution_note` min 6 and `maintenance.resolve`.

Resolution while occupied closes case and leaves room `OCCUPIED` with truthful same-state event.

Acceptance: read endpoint returns current case or null; receptionist can read/report/escalate but receives 403 on resolve; short escalation/resolution evidence fails; no artificial room-state mutation.

## E2E-09 — Blocking occupied maintenance and relocation

Owners: Reception + Housekeeping/Ops/Admin.

Open case: impact `BLOCKING`; occupied room remains `OCCUPIED`, future sale/readiness blocked and Reception gets relocation-required attention.

No automatic guest move. Reception explicitly reassigns or later checks out.

On vacancy with still-open blocking case: old room -> `MAINTENANCE`. Resolving from maintenance -> `DIRTY`; normal cleaning then required.

Existing future reservations are not auto-cancelled/reassigned; they become attention cases until repair or explicit Reception action.

Acceptance: new sale excludes blocked room; current guest is not silently moved; future bookings remain intact but visibly blocked; escalation audit includes note/actor; resolve follows RBAC/evidence. D6 governs the occupied maintenance departure.

## E2E-10 — Vacant-room blocking maintenance

Owner: Housekeeping/Ops/Admin.

Opening `BLOCKING` on `AVAILABLE|DIRTY|CLEANING` moves room to `MAINTENANCE` and blocks sale. Resolution -> `DIRTY`; cleaning required before available.

One open maintenance case per room in v1. `NON_BLOCKING -> BLOCKING` escalation is explicit; multiple independent simultaneous cases are deferred.

Acceptance includes stale case rejection, required evidence, and one-open-case enforcement.

## E2E-11 — Housekeeping turnover

Owner: Housekeeping/Ops/Admin according to existing `housekeeping.write`.

Normal path: `DIRTY -> CLEANING -> AVAILABLE` using existing `/housekeeping/:id/start` and `/housekeeping/:id/finish`.

Board remains authoritative housekeeping read model. Occupied rooms appear only when maintenance work exists; occupied rooms without case are not housekeeping tasks.

Acceptance: checkout/reassignment-created dirty room appears without manual task creation; finish cleaning makes room available only when no blocking condition makes that state untruthful.

## E2E-12 — Checkout

Owner: Reception with Billing context.

Preconditions: booking `CHECKED_IN`; room occupied; accepted checkout checklist; room-release confirmation; authoritative Billing state; backend/RBAC/concurrency guards.

Financial parity:
- `settled` requires authoritative fully paid account;
- positive balance requires governed `pending-approved`, required reference and `bookings.checkout.override`;
- `bookings.checkout.override` remains admin-only.

Mutation: booking -> `CHECKED_OUT`; room -> `DIRTY` or `MAINTENANCE` according to open blocking case; release unneeded inventory; create/reconcile invoice as required; persist checkout + optional override evidence atomically.

UI: selected Reception booking controls embedded Billing. Show total, extra charges, paid, remaining and settlement state before confirmation.

Acceptance: non-admin pending override gets 403; invalid settlement fails before lifecycle change; Housekeeping/Maintenance receives work through room state; no duplicate manual handoff. Canonical command remains `POST /api/v1/bookings/:id/check-out`.

## E2E-13 — Checked-in stay extension

Owner: Reception + Billing.

Preconditions: booking `CHECKED_IN`; new checkout later; same room; every added night free of booking claim, hold and blocking maintenance; stale relation rejected.

Mutation: claim `[old_check_out, new_check_out)`; update checkout; booking stays checked in and room occupied; persist extension audit atomically.

Source-parity pricing: total stay nights × current room price + existing extra charges. Reconcile existing invoice to authoritative total; if amount exceeds paid amount, invoice cannot remain `PAID`.

UI discloses added nights, current room price, recalculated total and resulting balance before confirmation.

Acceptance: any added-night/Billing/concurrency conflict rolls back all parts; replay is idempotent/safe. Canonical command is `POST /api/v1/bookings/:id/extend-stay`. D3 registers the explicit-command target hardening.

## E2E-14 — Extra charge after payment/invoice

Owner: Billing/Reception according to existing capability.

Any successful extra charge changes authoritative booking total and must keep existing invoice truthful. A previously paid invoice cannot remain falsely settled when amount rises above paid amount. Payment entries remain immutable.

Acceptance: booking total, invoice amount/status, remaining balance and UI agree after mutation; failure is atomic. D8 governs the consistency hardening.

## E2E-15 — Front-desk operational read model

Owner: API/read layer.

Preserve/extend `GET /api/v1/front-desk/board`; do not invent a parallel route.

It provides authoritative joined/derived context for queue priority, arrival/departure classification, readiness, blockers, late-arrival context, maintenance impact and recommended action without becoming write authority.

Housekeeping keeps `GET /api/v1/housekeeping/board`; room-scoped maintenance case reads use the least-privilege endpoint from `19`.

Acceptance: Reception no longer reconstructs critical priority/readiness from unrelated endpoints where the board can own that meaning. D7 governs restoration/extension of the source board contract.

## E2E-16 — Context navigation and freshness

Stable query context uses IDs (`booking_id`, `room_id`, `guest_id` where applicable), never names and never authorization.

Revalidation occurs after mutation, when visible screen regains focus, on modest visible-screen polling (about 30s initial target), and when contextual navigation opens a case. Polling reduces/pauses while hidden.

Stale previews are advisory; backend always revalidates. Conflict returns explanation + authoritative refresh, never force/replay of stale intent.

## E2E-17 — Post-action continuation

After successful Reception lifecycle mutation: preserve current search/filter, reload authoritative board/context, let completed item move/disappear naturally, select next visible case by the same deterministic queue priority. Empty queue remains empty without silently changing filters.

Acceptance records whether next work is obvious without operator memory or unnecessary module switching.

## E2E-18 — Audit, lifecycle events and evidence

Required lifecycle evidence covers check-in, reassignment, checkout, no-show, cancellation and extension, plus truthful maintenance open/escalate/resolve events. Event exists iff authoritative mutation won.

Material details include actor/hotel/request identity plus command-specific reason/note, old/new rooms, dates, inventory interval, impact change, resulting state, price/financial delta and override reference where applicable.

Absolute timestamp and hotel-local operational date are distinct and both preserved when material.

## E2E-19 — Synthetic hotel-shift acceptance

Before the wave is accepted, execute at minimum:
1. reservation + existing guest;
2. reservation + new inline guest;
3. normal check-in;
4. cancellation with valid reason + missing/short reason rejection;
5. same-day/overdue no-show + future and short-reason rejection;
6. late-arrival note;
7. normal checkout -> housekeeping -> available;
8. active-stay reassignment with valid reason;
9. reassignment with short reason rejection;
10. overrun checked-in reassignment rejected until extension/checkout;
11. non-blocking occupied maintenance + room-scoped read;
12. blocking occupied maintenance -> escalation/relocation -> repair -> cleaning;
13. receptionist maintenance resolve forbidden while report/escalate succeeds;
14. future booking blocked by maintenance and manually resolved/reassigned;
15. stay extension success;
16. extension conflict rollback;
17. paid invoice followed by total increase;
18. pending-balance checkout override success for admin + unauthorized-role rejection;
19. stale/concurrent action rejection;
20. cross-module focus/revalidation and next-case continuation;
21. legacy `/housekeeping/:id/dirty` compatibility only for blocking maintenance-room resolution while new UI uses canonical resolve;
22. saas_admin denied tenant operational commands.

Record module switches, confirmations, duplicate data entry, stale/conflict outcomes, operator-memory dependencies and whether next action is obvious. Responsive browser proof includes contracted mobile and desktop widths.

## E2E-20 — API/OpenAPI/RBAC/departure conformance

Every implemented row must conform to `19-api-command-contract-map.md`, `05-maintenance-data-rbac.md` and `20-intentional-target-departures.md`.

Acceptance requires:
- canonical route used; no shadow endpoint;
- correct capability enforced backend-side;
- evidence payload validation matches contract;
- OpenAPI/client types updated for every new/additive route/field;
- legacy compatibility explicitly tested where retained;
- `400/403/404/409` semantics remain truthful;
- browser client uses canonical commands rather than generic PATCH/direct status shortcuts;
- every behavior differing from accepted source is listed in `20`; unlisted drift blocks acceptance.

## Explicitly outside this implementation wave

No automatic refund/penalty/retention policy; no split stay or automatic relocation; no multiple simultaneous maintenance cases per room; no new OUT_OF_ORDER transition design; no WebSockets/paid real-time service; no contracted/frozen nightly-rate model; no new check-in/cancellation/no-show cutoff beyond accepted source behavior; no production/cutover/real-data migration; no unrelated redesign of Reports, Users or Network.

## Completion rule

The implementation wave is complete only when every in-scope E2E row has a bounded implementation contract, domain/API proof, regression coverage where applicable, responsive browser evidence, cross-module consequence proof and no unresolved contradiction with the master, transition matrix, invariants, RBAC contract, API map or intentional-departure register. A green UI or isolated endpoint is not sufficient.