# 02C — No-show

Status: `BINDING DEFINITION`

## Meaning / eligibility

`NO_SHOW` is distinct from cancellation: arrival date has been reached/passed, reservation is still `CONFIRMED`, guest never occupied the room. Require authoritative `hotel_local_date >= check_in`, terminal reason min 6, lifecycle authorization and stale-state guard.

## Atomic mutation

A successful no-show:
1. `CONFIRMED -> NO_SHOW`;
2. releases reservation inventory;
3. leaves physical room state unchanged;
4. **preserves the existing authoritative booking total** under D9;
5. preserves existing payment/invoice evidence without automatic refund, retention or penalty;
6. records one truthful actor/hotel/booking/operational-date/room/reason event;
7. disappears from active arrivals after authoritative reload.

No-show must not recalculate accommodation from the room's current catalog price merely because terminal state/evidence is persisted.

Cancellation remains a separate terminal intent and likewise receives no new arrival-date cutoff.

## UI / concurrency / acceptance

Reception may offer Mark no-show from arrival date onward. Success communicates inventory release and distinct terminal meaning. If check-in/another transition wins first, return conflict with zero state, financial or event drift.

Acceptance covers same-day, overdue, future rejection, checked-in rejection, concurrent check-in loss, room-state preservation, inventory release and booking-total/invoice preservation after a catalog price change.