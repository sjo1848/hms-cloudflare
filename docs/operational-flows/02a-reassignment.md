# 02A — In-stay room reassignment

Status: `BINDING DEFINITION / SOURCE-PARITY PRICING / INTENTIONAL OVERRUN GUARD`.

## Trigger

A guest is already `CHECKED_IN` and must move to another room.

## Preconditions

- booking status is `CHECKED_IN`;
- `hotel_local_date < check_out`; an overrun stay must be extended or checked out first;
- destination differs from current room;
- destination is physically `AVAILABLE`;
- destination has no `BLOCKING` maintenance case;
- destination has no overlapping hold or inventory conflict for the remaining stay;
- a destination with `NON_BLOCKING` maintenance is allowed only with visible advisory context;
- actor has lifecycle write capability;
- current booking-room relation has not changed concurrently;
- command carries an operational `reason` with at least 6 trimmed characters.

The overrun guard and server-enforced reason are intentional target hardenings recorded in `20-intentional-target-departures.md`; they are not claimed as source parity.

## Effective date and history

`effective_date = max(check_in, hotel_local_date)`.

Only inventory nights in `[effective_date, check_out)` move to the destination. Past stay dates remain associated with the old room; they are not revalidated against the destination. `bookings.room_id` becomes the current room and the reassignment event preserves movement history.

## Authoritative mutation

One logical operation must:

1. revalidate booking/room identity and reason;
2. move current booking room reference to destination;
3. move only remaining inventory claims;
4. set destination `AVAILABLE -> OCCUPIED`;
5. inspect old-room maintenance impact;
6. set old room:
   - no open `BLOCKING` case: `OCCUPIED -> DIRTY`;
   - open `BLOCKING` case: `OCCUPIED -> MAINTENANCE`;
7. recalculate authoritative accommodation using accepted source pricing and destination current price, then add/preserve extra charges;
8. reconcile any existing invoice;
9. record one reassignment event with actor, reason, old/new room, effective date, moved interval, resulting old-room state and resulting financial total.

A partial move is failure.

## Pricing parity

Accepted source behavior recalculates booking total on room change using destination current `price_cents` across total stay nights, then adds extra charges. This can reprice an active stay when moving between room prices. V1 preserves that observable source behavior.

Changing reassignment pricing to preserve a contracted/snapshot rate is a future product decision and must not be introduced silently during BUILD.

## Overrun boundary

When `hotel_local_date >= check_out`, there is no authoritative future stay interval to move. The target intentionally rejects reassignment until the operator either extends the stay to a later checkout or checks out. This is a domain-correctness departure from the looser accepted source behavior and is explicitly authorized only for this target wave.

## UI flow

`Reassign -> show valid remaining-stay destinations -> disclose advisory incidents + destination price consequence -> choose -> enter/confirm operational reason -> show old-room consequence + resulting total/balance -> confirm -> authoritative mutation -> refresh context`.

## Postconditions

- booking remains checked in on destination;
- destination occupied;
- old room not immediately sellable for check-in;
- old room enters Housekeeping if dirty or maintenance flow if blocking case remains;
- past room history is not rewritten;
- booking total/invoice are financially consistent with accepted source pricing;
- Reception/Rooms/Billing revalidate.

## Concurrency

If destination availability, maintenance impact, booking-room identity, invoice/payment state or price input changes before mutation wins, return conflict with zero booking/room/inventory/financial/audit drift.

## Acceptance

1. normal move -> old dirty, new occupied;
2. destination occupied in a past night but free for remaining interval -> succeeds;
3. remaining-night booking/hold conflict -> atomic rejection;
4. destination BLOCKING case -> excluded/rejected;
5. destination NON_BLOCKING case -> advisory but allowed;
6. old BLOCKING case -> old room maintenance;
7. source-parity total uses destination current room price across stay nights plus extra charges and reconciles invoice;
8. missing/short reason -> rejected before mutation;
9. overrun stay -> rejected until extension or checkout;
10. replay cannot duplicate claims/events or financial effects.