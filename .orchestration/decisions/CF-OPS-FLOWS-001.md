# DECISION — CF-OPS-FLOWS-001

Status: `BINDING FOR NEXT IMPLEMENTATION WAVE`
Baseline: `acceptance/staging` @ `26239b76b919266de07d7bece5977296647f109c`

## Binding decisions

1. **Room physical state is not the same as sellable availability.** Future availability remains derived from room policy + booking inventory + holds; immediate check-in requires physical `AVAILABLE`.
2. **Vacated occupied rooms never become directly available.** Checkout or ordinary reassignment sends the vacated room to `DIRTY`.
3. **Reassignment with a relocation-required maintenance case sends the old room to `MAINTENANCE`.** Maintenance resolution returns it to `DIRTY`, then cleaning returns it to `AVAILABLE`.
4. **Maintenance is a case independent from room status.** A case may coexist with an occupied room.
5. **Maintenance impact is distinct from priority.** Initial impact values are `NON_BLOCKING` and `RELOCATION_REQUIRED`.
6. **Opening occupied-room maintenance never moves the guest automatically.** Relocation is an explicit Reception lifecycle action.
7. **`NO_SHOW` is a distinct terminal booking outcome from `CONFIRMED`.** It is allowed only on/after arrival date, releases reservation inventory, and does not dirty the room.
8. **No-show financial penalty is not part of the operational transition.** Financial consequences require a later Billing decision.
9. **Checked-in extension is an explicit lifecycle command.** It only extends checkout forward, claims all added nights atomically, keeps room occupied and booking checked in.
10. **Shortening an active stay is checkout, not an edit of checkout date.**
11. **Basic extension never auto-relocates or splits the stay.** Conflict returns without mutation.
12. **Check-in readiness is shown before check-in.** Only physically available rooms are `READY`; dirty/cleaning/maintenance/occupied/out-of-order states must be explained before submission.
13. **Reception-selected booking controls embedded Billing context.** Embedded Billing cannot keep an unrelated selection.
14. **Checkout handoff confirmation represents the physical fact that the room is vacated and housekeeping may enter.** Backend state transition performs the actual handoff by setting the room dirty.
15. **After a successful Reception lifecycle action, preserve filter/search and select the next visible item by queue priority after authoritative reload.**
16. **Contextual navigation uses stable IDs in query parameters and never acts as authorization.**
17. **Operational revalidation begins with low-cost refresh-on-mutation, focus revalidation and modest visible-screen polling.** No WebSockets by default.
18. **The existing Housekeeping board remains authoritative for housekeeping work.** A front-desk server read model should be introduced before further duplication of Reception readiness/priority rules.
19. **Do not raise the frontend bundle budget to implement these flows.** Create headroom through structure/code splitting when needed.

## Deferred decisions

- no-show penalty/deposit policy;
- combined `extend + planned relocation` / split-stay workflow;
- multiple simultaneous open maintenance cases per room;
- richer maintenance categories/SLA model;
- event push/WebSocket infrastructure;
- production/cutover implications.

BUILD may not invent deferred behavior.

## Implementation latitude

Codex may choose internal file/module layout, helper names, SQL organization, exact polling interval within a reasonable low-cost band, and component decomposition provided the binding semantics and existing invariants are preserved.

## Human gates

None are required to begin implementation planning under these definitions. A new Human Gate is required only if implementation discovers a genuine financial-policy, paid-cost, production, multi-case maintenance, split-stay, or cross-D1 atomicity trade-off.