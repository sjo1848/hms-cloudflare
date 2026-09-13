# 12 — Housekeeping / Maintenance board behavior

Status: `BINDING DEFINITION`

## Board inclusion

The operational board includes normal turnover work (`DIRTY`, `CLEANING`, `AVAILABLE`, `MAINTENANCE`) and also `OCCUPIED` rooms when they have an open maintenance case. Occupied rooms without a maintenance case do not become housekeeping tasks.

## Actions by state

For `OCCUPIED + open maintenance`:

- cleaning start/finish is unavailable;
- maintenance case detail/impact is visible;
- authorized users may resolve the case after repair/mitigation; room remains `OCCUPIED`;
- a `BLOCKING` case clearly indicates Reception relocation is required while it remains unresolved;
- a `NON_BLOCKING` case is advisory and does not itself block the stay.

For `MAINTENANCE + open BLOCKING case`:

- maintenance resolution is available to authorized roles;
- resolution sends room to `DIRTY`;
- cleaning then follows normal turnover.

## Checkout/reassignment result routing

Downstream work is derived from authoritative blocking-maintenance state:

- no open `BLOCKING` case, including only `NON_BLOCKING` advisory -> vacated room `DIRTY`, target `HOUSEKEEPING`;
- open `BLOCKING` case -> vacated room `MAINTENANCE`, target `MAINTENANCE`.

Exact response field names are implementation latitude, but UI must explain resulting state without guessing.

## No duplicate handoff

The operator does not manually create a housekeeping task after checkout/reassignment. Resulting room state plus maintenance case state is sufficient to surface downstream work.

## Future arrival blocker

If a blocking maintenance case affects a future confirmed arrival, the board may link to that booking, but Reception owns reservation reassignment. Housekeeping/Maintenance does not mutate future booking assignment.