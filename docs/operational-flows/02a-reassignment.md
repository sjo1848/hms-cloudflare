# 02A — In-stay room reassignment

Status: `BINDING DEFINITION / SOURCE-PARITY PRICING / INTENTIONAL OVERRUN GUARD`.

A checked-in guest may move rooms only when `hotel_local_date < check_out`, destination differs, is physically AVAILABLE, has no BLOCKING maintenance, and has no remaining-stay hold/inventory conflict. Destination NON_BLOCKING is advisory. `reason` min 6 and authoritative booking-room identity are required.

`effective_date = max(check_in, hotel_local_date)`. Only `[effective_date,check_out)` inventory moves. Past room-night history remains unchanged.

One atomic command changes current booking room, moves remaining claims, destination AVAILABLE->OCCUPIED, and old room OCCUPIED->DIRTY or MAINTENANCE according to open BLOCKING maintenance. It then applies accepted destination-current-price repricing across total stay nights plus existing extra charges and reconciles any invoice.

D11 in `20-intentional-target-departures.md` is the binding invoice-reconciliation contract for both price increases and decreases. Existing VOIDED invoice state blocks this priced mutation; the command must not partially move the guest/rooms/inventory before discovering that conflict.

When `hotel_local_date >= check_out`, reassignment is rejected until extension establishes a future checkout or checkout ends occupancy. This is D2.

UI discloses destination advisory incidents, price consequence, resulting Billing context and old-room consequence before confirmation. Any destination, maintenance, booking-room, price or Billing race yields conflict with zero state/audit drift.

Acceptance includes normal DIRTY handoff, BLOCKING->MAINTENANCE handoff, remaining-night-only movement, NON_BLOCKING advisory destination, short reason rejection, overrun rejection, D11 upward/downward reconciliation and ineligible-invoice atomic rejection.