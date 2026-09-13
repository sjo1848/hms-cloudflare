# 02B — Maintenance while room is occupied

Status: `BINDING DEFINITION`

## Problem

A real hotel must record incidents such as heating, plumbing, TV, lock or electrical faults while the guest is still staying in the room. Current HMS room status cannot represent `OCCUPIED` and `MAINTENANCE` simultaneously, so maintenance must be modeled as a case that can coexist with occupancy.

## Case impact

Every newly opened maintenance case must declare operational impact:

- `NON_BLOCKING` — guest may remain in the room; issue is tracked and assigned.
- `RELOCATION_REQUIRED` — continued occupancy is not acceptable; Reception must relocate the guest before the room can enter maintenance state.

Priority remains a separate dimension (`LOW`, `MEDIUM`, `HIGH`, `URGENT`). Impact answers whether the guest may remain; priority answers how urgently the issue should be handled.

## Open NON_BLOCKING case

Preconditions:

- room may be `OCCUPIED`, `AVAILABLE`, `DIRTY` or `CLEANING`;
- no duplicate open case violating the one-active-case rule, unless later design explicitly supports multiple cases.

Behavior while `OCCUPIED`:

- create maintenance case;
- keep room physical state `OCCUPIED`;
- surface incident in Reception/Rooms and maintenance-oriented Housekeeping context;
- do not alter booking inventory.

Resolution while still occupied closes the case and keeps the room `OCCUPIED`.

## Open RELOCATION_REQUIRED case

Behavior while `OCCUPIED`:

- create case and mark it relocation-required;
- keep room `OCCUPIED` until relocation actually succeeds;
- Reception case becomes attention/blocked and primary next action is relocation;
- the room must not be treated as a valid destination for another guest.

After successful reassignment:

- destination becomes `OCCUPIED`;
- old room becomes `MAINTENANCE` rather than `DIRTY`;
- maintenance case remains open.

After maintenance resolution:

`MAINTENANCE -> DIRTY -> CLEANING -> AVAILABLE`.

## Safety rule

Opening a maintenance case must never silently evict a guest or mutate a booking. Relocation is a separate explicit lifecycle action.

## UI consequences

Reception and Rooms should show an occupied-room incident badge/context. For relocation-required incidents, the selected Reception case must explain why relocation is required and offer only valid destinations.

Housekeeping/Maintenance must be able to see occupied incidents without pretending the room is ready for housekeeping cleaning.

## Acceptance scenarios

1. non-blocking occupied issue opens and resolves with booking/room still occupied;
2. relocation-required issue opens, guest remains until explicit reassignment;
3. successful relocation sends old room to maintenance;
4. maintenance resolve sends old room to dirty, never directly available;
5. stale case or concurrent room change cannot generate a false success/audit event.