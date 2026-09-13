# 02A — In-stay room reassignment

Status: `BINDING DEFINITION`

## Trigger

A guest is already `CHECKED_IN` and must move to another room.

## Preconditions

- booking status is `CHECKED_IN`;
- `hotel_local_date < check_out`; an overrun stay must be extended or checked out first;
- destination differs from current room;
- destination is physically `AVAILABLE`;
- destination has no `BLOCKING` maintenance case;
- destination has no overlapping hold or inventory conflict for the remaining stay;
- a destination with `NON_BLOCKING` maintenance is allowed only with visible advisory context;
- actor has lifecycle write capability;
- current booking-room relation has not changed concurrently.

## Effective date and history

`effective_date = max(check_in, hotel_local_date)`.

Only inventory nights in `[effective_date, check_out)` move to the destination. Past stay dates remain associated with the old room; they are not revalidated against the destination. `bookings.room_id` becomes the current room and the reassignment event preserves movement history.

## Authoritative mutation

One logical operation must:

1. move current booking room reference to destination;
2. move only remaining inventory claims;
3. set destination `AVAILABLE -> OCCUPIED`;
4. inspect old-room maintenance impact;
5. set old room:
   - no open `BLOCKING` case: `OCCUPIED -> DIRTY`;
   - open `BLOCKING` case: `OCCUPIED -> MAINTENANCE`;
6. record one reassignment event with old/new room, effective date, moved interval and resulting old-room state.

A partial move is failure.

## Pricing

Reassignment does not automatically reprice the stay. Any commercial adjustment is explicit Billing behavior.

## UI flow

`Reassign -> show valid remaining-stay destinations -> disclose advisory incidents -> choose -> show old-room consequence -> confirm -> authoritative mutation -> refresh context`.

## Postconditions

- booking remains checked in on destination;
- destination occupied;
- old room not immediately sellable for check-in;
- old room enters Housekeeping if dirty or maintenance flow if blocking case remains;
- past room history is not rewritten;
- Reception/Rooms revalidate.

## Concurrency

If destination availability, maintenance impact or booking-room identity changes before mutation wins, return conflict with zero booking/room/inventory/audit drift.

## Acceptance

1. normal move -> old dirty, new occupied;
2. destination occupied in a past night but free for remaining interval -> succeeds;
3. remaining-night booking/hold conflict -> atomic rejection;
4. destination BLOCKING case -> excluded/rejected;
5. destination NON_BLOCKING case -> advisory but allowed;
6. old BLOCKING case -> old room maintenance;
7. overrun stay -> reassign rejected until extension/checkout;
8. replay cannot duplicate claims/events.