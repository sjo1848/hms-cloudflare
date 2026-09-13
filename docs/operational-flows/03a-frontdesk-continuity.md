# 03A — Front-desk continuity

Status: `BINDING DEFINITION`

## New reservation with new guest

Current friction: Reception can only select an existing guest.

Target flow:

`New reservation -> search guest -> select existing OR create guest inline -> dates -> check availability -> select room -> confirm`.

Guest creation is subordinate to reservation creation and must not force a module switch. Because guest and booking live in the same hotel D1, the target is one atomic business operation: booking conflict/validation failure must not leave an unintended guest record.

Canonical command is fixed by `19-api-command-contract-map.md` as `POST /api/v1/bookings/with-guest`, requiring both `guests.write` and `bookings.write`. Frontend choreography `POST guest` then `POST booking` is not the target.

Standalone Guests remains available when the operator intentionally wants to create a guest without a reservation.

## Check-in readiness

Reception must show readiness before the operator starts final check-in.

Readiness values include:

- `READY` — assigned room physically `AVAILABLE` and no blocking maintenance;
- `CLEANING` — room is being prepared;
- `DIRTY` — housekeeping required;
- `MAINTENANCE` — room unavailable pending maintenance;
- `OCCUPIED` — inconsistent/blocked for this arrival;
- `OUT_OF_ORDER` — blocked.

A `NON_BLOCKING` maintenance incident is advisory context and does not independently remove readiness when the room is otherwise available.

Primary check-in action is enabled only for `READY`. Calendar day is not an additional hard gate because accepted source does not impose one. Other blockers expose contextual action/navigation instead of making a backend conflict the first explanation.

## Billing follows the Reception case

When Reception has a selected booking, Billing must use that booking as its primary context. It must not silently keep a different booking selected.

Target selected-case workspace shows at least:

- accommodation/booking total;
- extra charges;
- paid amount;
- remaining balance;
- invoice/payment status relevant to checkout.

Billing may still have a standalone mode, but embedded Reception billing is controlled by Reception `booking_id`.

## Checkout handoff semantics

The operator confirms the physical fact:

**Room vacated/released: downstream operational work may begin.**

The backend performs the actual handoff through authoritative state:

- no open `BLOCKING` maintenance -> `OCCUPIED -> DIRTY` -> Housekeeping;
- open `BLOCKING` maintenance -> `OCCUPIED -> MAINTENANCE` -> Maintenance, then resolution -> `DIRTY` -> Housekeeping.

No separate manual housekeeping task creation is required.

## After successful lifecycle action

Reception preserves current filter/search and reloads authoritative data. The completed item may disappear from current filter. The next visible item is selected by the same queue priority rules; if none remains, the queue stays empty without changing filters automatically.