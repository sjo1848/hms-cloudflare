# 20 — Intentional target departures from accepted source

Status: `BINDING GOVERNANCE REGISTER / IMPLEMENTATION LOCKED`

Default is accepted-source parity. Only departures listed here are authorized for this workflow wave.

## D1 — Authoritative hotel-local operational date
Target persists a hotel IANA timezone and derives `hotel_local_date` server-side for genuine date predicates instead of relying on UTC/browser date. This preserves business meaning such as no-show-from-arrival-date without inventing check-in/cancellation cutoffs.

## D2 — Overrun stay normalization before reassignment
If `hotel_local_date >= check_out`, a CHECKED_IN stay must be extended to a future checkout or checked out before reassignment. Remaining-night relocation requires a truthful future interval.

## D3 — Explicit no-show and extension commands
Target adds `POST /api/v1/bookings/:id/no-show` and `POST /api/v1/bookings/:id/extend-stay` instead of using generic booking updates for these material lifecycle/inventory operations.

## D4 — Server-enforced reassignment reason
Active-stay reassignment requires trimmed `reason` min 6 server-side, closing the source gap where UI required evidence but backend could accept the mutation without it.

## D5 — Atomic inline guest + reservation
Target adds one same-hotel atomic command for inline new guest + reservation so room-loss/validation failure cannot leave unintended guest-only state.

## D6 — Occupied maintenance and dedicated capabilities
Target models maintenance as an independent case with `NON_BLOCKING | BLOCKING`, supports occupied-room coexistence/escalation/resolution and introduces dedicated `maintenance.read/report/resolve` capabilities. V1 remains one open case per room.

## D7 — Restore/extend server-owned front-desk board
Target restores/extends accepted `GET /api/v1/front-desk/board` so queue/readiness/blocker meaning is server-owned rather than reconstructed independently by clients.

## D8 — Invoice consistency after authoritative total changes
Every authoritative booking-total change reconciles an existing invoice in the same logical operation. A PAID invoice cannot remain truthful when paid amount no longer covers authoritative amount. Payment entries remain immutable.

## D9 — Only explicit pricing mutations may change booking total

Accepted source generic booking update recalculates accommodation from the room's current catalog price even when the operator only changes lifecycle state, guest/notes metadata or front-desk evidence. Target removes that incidental coupling.

A mutation changes authoritative booking total **only if the contract explicitly classifies it as pricing-affecting**. In this wave those are:
- pre-occupancy room change;
- pre-occupancy stay-date change;
- in-stay reassignment;
- stay extension;
- explicit extra charge;
- another future command explicitly defined as priced.

All other booking metadata/state/evidence writes preserve the existing authoritative booking total unless a future decision says otherwise. This includes:
- guest reassociation/name or ordinary notes without room/date change;
- check-in and its evidence;
- cancellation;
- no-show;
- late-arrival metadata;
- checkout and its evidence.

Checkout may create/reconcile invoice and settlement state against the preserved total but does not reprice accommodation. Cancellation/no-show preserve total plus existing payment/invoice evidence and add no automatic refund/penalty. Late-arrival/notes/guest-only changes preserve total/invoice exactly.

Reason: a non-pricing administrative or lifecycle action must not alter the commercial value of a stay just because the room's catalog price changed after booking. This also prevents copying an incidental generic-PATCH implementation detail into explicit target commands.

## Non-authorized departures

Still outside this wave without a new decision:
- contracted/frozen nightly-rate pricing replacing current-room repricing on actual room/date pricing mutations;
- new early/late check-in cutoff;
- cancellation cutoff;
- configurable same-day no-show hour;
- automatic refund/retention/penalty;
- automatic relocation or split-stay extension;
- multiple simultaneous maintenance cases per room;
- new OUT_OF_ORDER transition design;
- paid realtime/WebSocket dependency;
- production/cutover or real-data migration.

## Governance rule
If BUILD needs behavior different from both accepted source and this register, stop and return to definition. Do not treat unregistered product divergence as implementation latitude.