# 02A — In-stay room reassignment

Status: `BINDING DEFINITION`

## Trigger

A guest is already `CHECKED_IN` and must move to another room.

## Preconditions

- booking status is `CHECKED_IN`;
- destination room differs from current room;
- destination is immediately usable and physically `AVAILABLE`;
- destination has no overlapping hold or inventory conflict for the remaining stay;
- actor has lifecycle write capability;
- the current booking-room relation has not changed concurrently.

## Authoritative mutation

One logical operation must:

1. move the booking to the destination room;
2. move the booking inventory claims for the relevant stay nights to the destination;
3. set destination room `AVAILABLE -> OCCUPIED`;
4. transition the old room according to incident context:
   - no relocation-required maintenance case: `OCCUPIED -> DIRTY`;
   - open `RELOCATION_REQUIRED` maintenance case: `OCCUPIED -> MAINTENANCE`;
5. record one reassignment lifecycle event including old room, new room and resulting old-room state.

A partially applied move is failure.

## Why old room must not become AVAILABLE

The guest actually occupied it. Even if the move occurred shortly after check-in, HMS must require a housekeeping/inspection step before that room can return to service.

## UI flow

Reception selected case:

`Reassign room -> show only valid destinations -> choose destination -> show old-room consequence -> confirm -> backend mutation -> reload current operational context`.

The confirmation must say whether the old room will enter `DIRTY` or `MAINTENANCE`.

## Postconditions

- guest remains checked in;
- booking references destination room;
- destination is occupied;
- old room is not sellable for immediate check-in;
- Housekeeping can see old room when it is dirty;
- Maintenance can see the case when old room enters maintenance;
- Reception/Rooms show the new assignment after revalidation.

## Concurrency

If destination availability changes between selection and confirmation, operation returns conflict and leaves booking, old room, destination room and inventory unchanged.

## Acceptance scenarios

1. normal reassign: old room becomes dirty, new room occupied;
2. destination claimed concurrently: zero state drift;
3. relocation-required maintenance exists: old room becomes maintenance;
4. repeated reassignment request: cannot duplicate inventory/event side effects;
5. mobile and desktop Reception expose the same consequence before confirmation.