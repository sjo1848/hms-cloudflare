# 12 — Housekeeping / Maintenance board behavior

Status: `BINDING DEFINITION`

## Board inclusion

The operational board must include:

- normal room work: `DIRTY`, `CLEANING`, `AVAILABLE`, `MAINTENANCE` as today;
- `OCCUPIED` rooms **only when they have an open maintenance case**.

Occupied rooms without a maintenance case do not become housekeeping tasks.

## Actions by state

For `OCCUPIED + open maintenance`:

- cleaning start/finish actions are unavailable;
- maintenance case detail is visible;
- authorized users may resolve the case if it is non-blocking and repair is complete;
- relocation-required case clearly indicates Reception relocation is pending.

For `MAINTENANCE + open case`:

- maintenance resolution is available to authorized roles;
- resolution sends room to `DIRTY`;
- cleaning then follows normal flow.

## Checkout result routing

Checkout determines the downstream work from authoritative maintenance state:

- no open maintenance case -> room `DIRTY`, handoff target `HOUSEKEEPING`;
- any open maintenance case -> room `MAINTENANCE`, handoff target `MAINTENANCE`.

Exact response field names are implementation latitude, but the frontend must be able to explain the resulting state without guessing.

## No duplicate handoff

The operator does not manually create a housekeeping task after checkout. Room state and open case are sufficient to make the work appear in the operational board.

## Blocked future arrival

If a maintenance room has a future confirmed arrival, the board may link to that booking, but Reception owns reservation reassignment. Housekeeping does not mutate future booking assignment.