# 03A — Front-desk continuity

Status: `BINDING DEFINITION`

## New reservation with new guest

Target: `New reservation -> search guest -> select existing OR create inline -> dates -> availability -> room -> confirm`.

Inline guest creation is subordinate to reservation intent and atomic with booking through `POST /api/v1/bookings/with-guest`, requiring `guests.write` + `bookings.write`. Conflict/validation must not leave unintended guest-only state. Standalone Guests remains explicit guest-only intent.

## Check-in readiness

Reception shows readiness before final check-in:
- READY = physical AVAILABLE + no blocking condition;
- CLEANING;
- DIRTY;
- MAINTENANCE;
- OCCUPIED conflict;
- OUT_OF_ORDER.

NON_BLOCKING maintenance is advisory and does not independently remove readiness from an otherwise AVAILABLE room. Calendar day is not an added check-in gate. Blocked states show reason/contextual action rather than relying on a late backend conflict.

## Billing follows selected Reception case

Embedded Billing is governed by the same selected `booking_id`; it cannot silently retain another booking. Show authoritative booking/accommodation total, extra charges, paid amount, remaining balance and invoice/payment status.

## Pricing continuity at lifecycle actions

Under D9, check-in and checkout are state/evidence operations and preserve the stored booking total. Recording late arrival, cancellation and no-show likewise do not reprice. Reception must not show a price delta for those actions merely because room catalog price changed.

Reassignment and stay extension are pricing-affecting and must disclose their resulting total/balance before confirmation because their defined pricing rule may change the booking total.

## Checkout handoff

Operator confirms physical release. Backend routes:
- no open BLOCKING case: OCCUPIED -> DIRTY -> Housekeeping;
- open BLOCKING case: OCCUPIED -> MAINTENANCE -> repair -> DIRTY -> Housekeeping.

No duplicate manual housekeeping task is required. Checkout settlement operates against the pre-existing authoritative booking total; checkout itself does not reprice accommodation.

## Post-action continuation

Preserve filter/search, reload authoritative context, let completed case move/disappear naturally, then select next visible case using the same queue priority. Empty queue remains empty without silently changing filters.