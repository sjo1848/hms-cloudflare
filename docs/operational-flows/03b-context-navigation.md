# 03B — Cross-module context and navigation

Status: `BINDING DEFINITION`

The booking is the primary context when the operator is handling a reservation/stay. For cleaning or maintenance, the room is primary context.

## Deep-link contract

- `/reception?booking_id=<id>`
- `/rooms?room_id=<id>`
- `/guests?guest_id=<id>`
- `/housekeeping?room_id=<id>&date=<yyyy-mm-dd>`

Query context never authorizes access. Each page must validate the requested entity through the authorized API response. Missing/invalid IDs fall back safely.

Selecting an entity may update the URL so refresh/back/forward preserve context. Context navigation should not clear unrelated filters/search without need.

## Contextual actions

Reception can open the assigned room, guest, and relevant housekeeping task. Rooms can open active/upcoming booking, guest, and housekeeping/maintenance. Guests can open a stay in Reception or its room. Housekeeping can open a related departure/booking when lifecycle state blocks the task.

Reception-selected booking governs embedded Billing. Billing must never silently retain a different booking.
