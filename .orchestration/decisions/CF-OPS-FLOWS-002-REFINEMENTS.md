# DECISION — CF-OPS-FLOWS-002-REFINEMENTS

Status: `BINDING`; where this file conflicts with `CF-OPS-FLOWS-001`, this refinement prevails.

1. **Operational date:** lifecycle/date eligibility uses an explicit hotel IANA timezone. Browser timezone and implicit UTC are not authoritative.
2. **No-show v1:** allowed only when `hotel_local_date > check_in`. Same-day configurable cutoff is deferred.
3. **Reassignment inventory:** move only remaining nights from `effective_date = max(check_in, hotel_local_date)` through `check_out`; past nights must not be validated against or moved to the destination.
4. **Vacancy with maintenance:** if any maintenance case is still open when checkout/reassignment vacates the room, old room becomes `MAINTENANCE`; otherwise it becomes `DIRTY`.
5. **Relocation-required availability:** an occupied room with open `RELOCATION_REQUIRED` maintenance is excluded from future sellable availability even though physical state remains `OCCUPIED` until relocation.
6. **Non-blocking availability:** occupied room with only `NON_BLOCKING` maintenance may remain advance-reservable under normal booking/hold rules.
7. **Reassignment pricing:** room reassignment does not automatically reprice the booking.
8. **Extension pricing v1:** keep existing accommodation total unchanged for already-booked nights; add `current_room_price_cents * added_nights`. Existing nights are never silently repriced.
9. **Unresolved occupied maintenance on checkout:** the maintenance case survives checkout and drives `OCCUPIED -> MAINTENANCE`; after repair, `MAINTENANCE -> DIRTY -> CLEANING -> AVAILABLE`.
