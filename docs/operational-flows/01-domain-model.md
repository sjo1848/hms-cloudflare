# 01 — Domain model

## 1. Booking lifecycle

Target booking states:

`CONFIRMED -> CHECKED_IN -> CHECKED_OUT`

Alternative terminal paths from `CONFIRMED`:

- `CANCELLED`
- `NO_SHOW`

Rules:

- `CANCELLED` means the reservation was cancelled before occupancy.
- `NO_SHOW` means the expected arrival date was reached/passed and the guest did not occupy the room.
- `CHECKED_OUT` means actual occupancy ended.
- A checked-in stay is extended through an explicit lifecycle operation, not generic booking PATCH.
- Shortening an occupied stay is represented by checkout, not by editing `check_out` backward.

## 2. Physical room state

Target physical states remain:

`AVAILABLE`, `OCCUPIED`, `DIRTY`, `CLEANING`, `MAINTENANCE`, `OUT_OF_ORDER`.

Normal flow:

`AVAILABLE -> OCCUPIED -> DIRTY -> CLEANING -> AVAILABLE`

Maintenance flow after vacancy:

`AVAILABLE|DIRTY|CLEANING -> MAINTENANCE -> DIRTY -> CLEANING -> AVAILABLE`

Critical rule: after a guest has actually occupied a room, leaving that room cannot transition it directly to `AVAILABLE`.

## 3. Sellable availability

Sellable availability for a date range is derived from multiple facts, not from one status field:

1. the room is allowed for advance reservation by the room-status policy;
2. there is no overlapping `room_inventory_nights` claim;
3. there is no overlapping room hold;
4. any additional out-of-service rule is satisfied.

Immediate check-in readiness is stricter: the assigned room must be physically `AVAILABLE` at the moment of check-in.

Therefore:

`physical state != future availability != immediate readiness`.

## 4. Maintenance case model

A maintenance incident is a case, not merely a room status.

Target case concepts:

- status: `OPEN | RESOLVED`;
- impact: `NON_BLOCKING | RELOCATION_REQUIRED`;
- reason, priority, assignee and audit identity;
- optional resolution note.

A `NON_BLOCKING` case may coexist with an `OCCUPIED` room. The room remains occupied while the issue is tracked.

A `RELOCATION_REQUIRED` case may also be opened while occupied, but the room cannot become sellable after the guest leaves. Once relocation succeeds, the old room transitions to `MAINTENANCE`; resolving maintenance returns it to `DIRTY`, then normal cleaning applies.

## 5. Inventory ownership

Booking inventory and physical room state must change atomically at lifecycle boundaries that affect both.

- Check-in keeps the booking's claimed nights and makes the room occupied.
- Checkout releases remaining booking inventory according to the current lifecycle implementation and makes the room dirty.
- Reassignment moves the active booking inventory from old room to new room and changes both physical room states in the same logical operation.
- Extension claims only the added nights and succeeds only if all added nights remain available.
- No-show releases the reservation inventory without creating a dirty-room transition because no occupancy occurred.

## 6. Audit principle

Every successful lifecycle mutation records exactly one authoritative event with actor, hotel, request identity and material transition details. Failed or stale mutations create no success event.