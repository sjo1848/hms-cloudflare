# Maintenance vacancy rules

Status: `BINDING`.

- If checkout or reassignment vacates a room and any maintenance case remains open, old room becomes `MAINTENANCE`.
- If no maintenance case is open, vacancy state is `DIRTY`.
- Maintenance resolution after vacancy returns to `DIRTY`, then cleaning returns it to `AVAILABLE`.
- An occupied room with an open `RELOCATION_REQUIRED` case is not advance-reservable.
- An occupied room with only `NON_BLOCKING` case(s) may remain advance-reservable under normal booking/hold rules.
- Maintenance impact and maintenance priority are separate concepts.
- Opening a maintenance case never moves the guest automatically.