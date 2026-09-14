# 03A — Front-desk continuity

Status: `BINDING DEFINITION`

## New reservation with new guest
Target: `New reservation -> search guest -> select existing OR create inline -> dates -> availability -> room -> confirm`.

Inline guest creation is atomic with booking through `POST /api/v1/bookings/with-guest`, requiring `guests.write` + `bookings.write`. Conflict/validation cannot leave unintended guest-only state. Standalone Guests remains explicit guest-only intent.

## Check-in readiness
Reception shows readiness before final check-in: READY, CLEANING, DIRTY, MAINTENANCE, OCCUPIED conflict or OUT_OF_ORDER. READY requires physical AVAILABLE and no blocking condition. NON_BLOCKING maintenance is advisory. Calendar day is not an added check-in gate.

## Billing follows selected Reception case
Embedded Billing uses the same selected `booking_id`; it cannot silently retain another booking. It shows authoritative booking/accommodation total, extra charges, invoice amount/status, paid amount, remaining balance and the D11 derived credit when present. Ineligible invoice state is visible as a blocker rather than being hidden behind a failed lifecycle action.

## Pricing continuity
Under D9, guest/name/notes-only edits, check-in, checkout, late arrival, cancellation and no-show preserve stored total. Reception must not show a price delta for those actions merely because catalog price changed.

Reassignment and extension are priced operations and disclose resulting total plus D11 Billing consequence before confirmation. An ineligible invoice state blocks the priced command before any room/inventory mutation.

## Checkout handoff
Operator confirms physical release. Backend routes normal vacancy to DIRTY/Housekeeping and vacancy with open BLOCKING maintenance to MAINTENANCE before later DIRTY/Housekeeping. Checkout uses the already-authoritative D11 Billing truth and never reprices accommodation.

## Post-action continuation
Preserve filter/search, reload authoritative context, let completed case move/disappear naturally, then select next visible case using the same deterministic queue priority.