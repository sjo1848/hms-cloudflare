# 03A — Front-desk continuity

Status: `BINDING DEFINITION`

## New reservation with new guest

Current friction: Reception can only select an existing guest.

Target flow:

`New reservation -> search guest -> select existing OR create guest inline -> dates -> check availability -> select room -> confirm`.

Guest creation is subordinate to the reservation flow; it must not force a module switch. Backend composition may be one endpoint or two guarded operations, but BUILD must preserve clear recovery if guest creation succeeds and booking creation fails.

## Check-in readiness

Reception must show readiness before the operator starts final check-in.

Readiness values:

- `READY` — assigned room physically `AVAILABLE`;
- `CLEANING` — room is being prepared;
- `DIRTY` — housekeeping required;
- `MAINTENANCE` — room unavailable pending maintenance;
- `OCCUPIED` — inconsistent/blocked for this arrival;
- `OUT_OF_ORDER` — blocked.

Primary check-in action is enabled only for `READY`. Other states expose the blocker and contextual action/navigation instead of allowing a late conflict to be the first explanation.

## Billing follows the Reception case

When Reception has a selected booking, Billing must use that booking as its primary context. It must not silently keep a different booking selected.

Target selected-case workspace shows at least:

- accommodation total;
- extra charges;
- paid amount;
- remaining balance;
- invoice/payment status relevant to checkout.

Billing may still have a standalone mode, but embedded Reception billing is controlled by the Reception `booking_id`.

## Checkout handoff semantics

Current backend correctly changes `OCCUPIED -> DIRTY` and records a housekeeping handoff.

The UI confirmation should represent the physical fact the operator knows, not duplicate internal bookkeeping. The checkbox meaning becomes:

**Room vacated/released: housekeeping may enter.**

After confirmation, the system itself performs the housekeeping handoff by making the room dirty. No separate manual task creation is required.

## After successful lifecycle action

Reception preserves current filter/search and reloads authoritative data. The completed item may disappear from the current filter. The next visible item is selected by the same queue priority rules; if none remains, the queue stays empty without changing filters automatically.