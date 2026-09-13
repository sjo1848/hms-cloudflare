# HMS — Operational Flow Invariants

Status: `BINDING SUPPLEMENT` to `.orchestration/INVARIANTS.md` for the next workflow wave.

## INV-OPS-ROOM-001 — Occupancy exit never skips turnover

If a guest actually occupied a room, checkout or ordinary reassignment cannot make that vacated room immediately `AVAILABLE`. It must enter `DIRTY`, unless a relocation-required maintenance case requires `MAINTENANCE`.

## INV-OPS-AVAIL-001 — Physical state and sellable availability are distinct

Room physical state, future date-range availability and immediate check-in readiness must not be collapsed into one boolean/status.

## INV-OPS-MAINT-001 — Maintenance may coexist with occupancy

A maintenance incident is a case independent from room physical status. Non-blocking incidents may coexist with `OCCUPIED`. Relocation-required incidents do not move the guest automatically; relocation is an explicit lifecycle action.

## INV-OPS-NOSHOW-001 — No-show is not cancellation or occupancy

`NO_SHOW` is an explicit transition from eligible `CONFIRMED`, releases reservation inventory, does not dirty the room and does not invent financial policy.

## INV-OPS-EXTEND-001 — Active stay extension is atomic

Extending a `CHECKED_IN` stay claims every added night and updates the booking as one logical operation. Any conflict leaves date, total and inventory unchanged.

## INV-OPS-CONTEXT-001 — One active case governs embedded context

Reception-selected booking governs embedded Billing and related contextual actions. A secondary workspace cannot silently retain another booking.

## INV-OPS-REVALIDATE-001 — Preview is advisory

Every mutation revalidates authoritative preconditions. Stale cross-screen state produces conflict and refresh, never false success.