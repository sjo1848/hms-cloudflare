# 02A — In-stay room reassignment

Status: `BINDING DEFINITION`

## Trigger

A guest is already `CHECKED_IN` and must move to another room.

## Preconditions

- booking status is `CHECKED_IN`;
- destination room differs from current room;
- destination is immediately usable and physically `AVAILABLE`;
- destination has no overlapping hold or inventory conflict for the **remaining stay**;
- actor has lifecycle write capability;
- the current booking-room relation has not changed concurrently.

## Effective date

Reassignment uses the hotel's authoritative local operational date.

`effective_date = max(check_in, hotel_local_date)`.

Only inventory nights in `[effective_date, check_out)` move to the destination. Past stay dates are never revalidated against the destination and must not prevent relocation merely because that room was occupied earlier in the guest's stay.

## Authoritative mutation

One logical operation must:

1. move the booking's current room reference to the destination;
2. move only remaining inventory claims to the destination;
3. set destination room `AVAILABLE -> OCCUPIED`;
4. inspect open maintenance cases on the old room;
5. set old room:
   - no open maintenance case: `OCCUPIED -> DIRTY`;
   - any unresolved maintenance case: `OCCUPIED -> MAINTENANCE`;
6. record one reassignment lifecycle event with old room, new room, effective date and resulting old-room state.

A partially applied move is failure.

## Pricing

Reassignment does not automatically reprice the booking because destination room type/price may differ. Any commercial adjustment is explicit and belongs to Billing; it is not inferred by the lifecycle command.

## UI flow

`Reassign room -> show valid destinations for remaining stay -> choose -> show old-room consequence -> confirm -> authoritative mutation -> reload current context`.

The operator must see whether the old room will enter `DIRTY` or `MAINTENANCE`.

## Postconditions

- guest remains checked in;
- booking references destination room;
- destination is occupied;
- old room is not immediately sellable;
- old room appears in Housekeeping if dirty, or maintenance workflow if an open case exists;
- Reception/Rooms reflect new assignment after revalidation.

## Concurrency

If destination availability or booking-room identity changes before the mutation wins, return conflict and leave booking, both rooms and inventory unchanged.

## Acceptance scenarios

1. normal reassign: old room dirty, new room occupied;
2. destination had past occupancy but is free for remaining nights: reassignment succeeds;
3. destination conflicts on a remaining night: atomic rejection;
4. any unresolved old-room maintenance case: old room becomes maintenance;
5. repeated request cannot duplicate inventory/event effects;
6. mobile and desktop expose the same consequence before confirmation.