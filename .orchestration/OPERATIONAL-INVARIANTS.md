# HMS — Operational Flow Invariants

Status: `BINDING SUPPLEMENT` to `.orchestration/INVARIANTS.md` for the next workflow wave.

## INV-OPS-ROOM-001 — Occupancy exit never skips turnover

If a guest actually occupied a room, checkout or reassignment cannot make the vacated room immediately `AVAILABLE`. It enters `DIRTY` unless an open `BLOCKING` maintenance case requires `MAINTENANCE`.

## INV-OPS-AVAIL-001 — Physical state and sellable availability are distinct

Room physical state, future date-range sellability and immediate check-in readiness must not be collapsed into one status/boolean.

## INV-OPS-MAINT-001 — Maintenance case is independent from physical state

Maintenance impact is `NON_BLOCKING | BLOCKING`, separate from priority. Non-blocking incidents may coexist with occupied/available state without automatically blocking sale. Blocking incidents prevent new occupancy. Opening a blocking case while occupied never moves the guest automatically; relocation/checkout is an explicit lifecycle action.

## INV-OPS-NOSHOW-001 — No-show is not cancellation or occupancy

`NO_SHOW` is an explicit eligible transition from `CONFIRMED`, releases reservation inventory, does not dirty the room and does not invent refund/penalty policy.

## INV-OPS-EXTEND-001 — Active stay extension is atomic

Extending a `CHECKED_IN` stay claims every added night and updates booking/Billing as one logical operation after the approved price policy is known. Any conflict leaves dates, totals, invoice, inventory and events unchanged.

## INV-OPS-CONTEXT-001 — One active case governs embedded context

Reception-selected booking governs embedded Billing and related contextual actions. A secondary workspace cannot silently retain another booking.

## INV-OPS-REVALIDATE-001 — Preview is advisory

Every mutation revalidates authoritative preconditions. Stale cross-screen state produces conflict and refresh, never false success.

## INV-OPS-TIME-001 — Hotel-local operational date is authoritative

Check-in, cancellation/no-show, overstay, reassignment effective date and other date-sensitive business rules use server-derived hotel-local date from a persisted valid IANA timezone. Browser time and raw UTC date cannot authorize a lifecycle mutation.

## INV-OPS-HISTORY-001 — Reassignment preserves physical history

Only remaining inventory nights move during an in-stay reassignment. Historical nights remain associated with the room actually occupied; event history identifies old/new rooms and effective date.

## INV-OPS-BILLING-001 — Increased booking total cannot leave a stale invoice

If an invoice exists, any successful operation that increases authoritative booking total must reconcile invoice amount/status in the same logical operation. A `PAID` invoice cannot remain `PAID` when `paid_amount_cents < amount_cents`; prior payment entries remain immutable.

## INV-OPS-POLICY-001 — Missing commercial policy is a Human Gate

BUILD must not infer extension rate basis, checkout settlement meaning, refund, retention or penalty rules from incomplete data or UI defaults. Unresolved commercial semantics remain explicit Human Gates/deferred policy.