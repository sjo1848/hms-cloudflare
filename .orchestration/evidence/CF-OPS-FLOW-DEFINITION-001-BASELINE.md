# EVIDENCE — CF-OPS-FLOW-DEFINITION-001 BASELINE

Baseline reviewed: `acceptance/staging` @ `26239b76b919266de07d7bece5977296647f109c`.

## Confirmed current behavior

### Reception

- Queue priority/filtering exists.
- Lifecycle commands are explicit: check-in, reassign, checkout.
- `runLifecycle()` closes the selected case and reloads, so next-case continuation is not yet preserved.
- New reservation requires an existing `guest_id`.
- Embedded Billing is rendered separately and keeps its own selected booking.

### Checkout -> Housekeeping

Backend checkout currently performs:

- booking `CHECKED_IN -> CHECKED_OUT`;
- room `OCCUPIED -> DIRTY`;
- inventory-night deletion;
- invoice creation if needed;
- lifecycle event with housekeeping handoff details.

This integration already exists and should be preserved.

### Housekeeping

Current explicit transitions include:

- `DIRTY -> CLEANING`;
- `CLEANING -> AVAILABLE`;
- maintenance resolution `MAINTENANCE -> DIRTY`.

The board includes dirty, cleaning, available and maintenance rooms plus departure context.

### Reassignment defect

Current lifecycle reassignment changes:

- destination `AVAILABLE -> OCCUPIED`;
- old room `OCCUPIED -> AVAILABLE`.

That old-room transition bypasses cleaning after actual occupancy and is the highest-priority domain correction.

### Occupied maintenance gap

Current maintenance-open route allows room status only from `AVAILABLE`, `DIRTY` or `CLEANING`. `OCCUPIED` is rejected, so a normal in-stay maintenance incident has no first-class workflow.

### No-show gap

The target schema/business predicates already know `NO_SHOW` in some places, but booking PATCH allows only `CANCELLED` status mutation and Reception exposes no explicit no-show lifecycle command.

### Stay extension gap

Generic booking update accepts only `CONFIRMED` bookings. Checked-in bookings can be reassigned or checked out, but their stay cannot be extended.

### Room availability

`/rooms/available` already combines room-status policy, room holds and `room_inventory_nights`. This proves the codebase already treats future reservation availability as more than the visible room status.

### Context/navigation gap

The app router supports query strings and history navigation, but operational pages do not yet share a stable booking/room/guest query-context contract.

## Risk conclusion

The next wave should not begin with visual refinements. Reassignment, occupied maintenance, no-show and extension change authoritative hotel state and must be defined/tested as domain transitions first.

## Evidence sources inspected

- `apps/web/src/features/reception/ReceptionPage.tsx`
- `apps/web/src/features/reception/useReceptionWorkspace.ts`
- `apps/web/src/features/reception/reception-api.ts`
- `apps/web/src/features/rooms/RoomsPage.tsx`
- `apps/web/src/features/guests/GuestsPage.tsx`
- `apps/web/src/features/housekeeping/HousekeepingPage.tsx`
- `apps/web/src/features/housekeeping/useHousekeepingWorkspace.ts`
- `apps/web/src/features/billing/BillingWorkspace.tsx`
- `apps/web/src/app/router.tsx`
- `apps/api/src/modules/lifecycle/d1-lifecycle-repository.ts`
- `apps/api/src/routes/lifecycle.ts`
- `apps/api/src/routes/housekeeping.ts`
- `apps/api/src/routes/bookings.ts`
- `apps/api/src/routes/inventory.ts`
- `.orchestration/INVARIANTS.md`