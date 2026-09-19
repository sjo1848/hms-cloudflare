# 03A — Front-desk continuity

Status: `BINDING DEFINITION`

Reception is a queue-driven workspace. `21-app-interaction-contract.md` owns the interaction surface.

## Queue and selected case

Queue filters/search/scroll remain stable while the operator handles a selected case. Desktop uses master/detail. Mobile opens the selected case as a focused full-screen surface and returns to the same queue position.

After a successful mutation, authoritative refresh occurs and the next visible case is selected by canonical queue priority if the prior case leaves the active filter.

## New reservation

`New reservation` opens a drawer/full-screen sheet, not an inline page-expanding form.

Flow:
`guest search/select or inline create -> dates -> availability -> room -> review -> confirm`.

Inline guest creation is atomic with booking through `POST /api/v1/bookings/with-guest`; failure leaves no unintended guest-only record.

## Check-in

Focused task stepper:
1. identity/document;
2. stay/contact;
3. room readiness;
4. final review.

Success closes the focused task, refreshes board/Billing context and advances according to queue priority. Conflict stays in context and explains the refreshed blocker.

## Reassignment

Focused drawer shows current room, valid destinations, maintenance advisory/blockers, resulting old-room state, price/Billing consequence and required reason before explicit confirmation.

## Extension

Focused drawer shows current/requested checkout, added nights, availability, repriced total and D11 remaining/credit consequence before confirmation.

## Checkout

Focused checkout surface combines checklist, room release, authoritative selected-booking Billing, maintenance consequence and housekeeping handoff. `pending-approved` admin override is an explicit privileged branch, not an ordinary checkbox.

## Late arrival

Compact dialog/popover with ETA + note + booking summary. No lifecycle wizard and no pricing UI.

## Cancellation / no-show

Use product danger dialogs with booking consequence and required reason. Native `window.confirm` is forbidden.

## Billing coupling

Embedded Billing always uses the same Reception-selected booking and never exposes a separate booking selector inside the Reception task.

## Navigation handoff

Contextual links to room/guest/housekeeping carry stable IDs and return/back semantics from `03b` and `21`.
