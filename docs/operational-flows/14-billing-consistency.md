# 14 — Billing consistency

Status: `BINDING ACCOUNTING CONTRACT`.

## Pricing mutation boundary

A booking total changes only through an explicitly pricing-affecting operation:
- pre-occupancy room/date change;
- in-stay reassignment;
- stay extension;
- explicit extra charge;
- a future command explicitly defined as priced.

State/evidence-only operations preserve the existing authoritative booking total:
- check-in;
- cancellation;
- no-show;
- late-arrival metadata;
- checkout.

This target rule is registered departure D9 and intentionally removes the accepted source generic-update side effect that can reprice accommodation on unrelated metadata/status writes.

## Booking total and invoice

When a pricing-affecting mutation changes authoritative total and an invoice exists, invoice amount/status must be reconciled in the same logical operation. If paid amount is below new amount, invoice cannot remain `PAID`; settlement metadata must stop claiming full settlement. Payment entries remain immutable.

A state/evidence-only command must not change invoice amount merely because the current room catalog price changed. Checkout may create or reconcile invoice/settlement status against the already-authoritative booking total but does not recalculate accommodation price.

## Source pricing where pricing is actually intended

For source-covered room/date pricing changes:

`accommodation_total = total_stay_nights × current selected room price_cents`

then add existing extra charges.

Reassignment uses destination current price. Extension uses current assigned-room price with new total nights. A frozen/contracted-rate model is a future deliberate product decision.

## Extra charges

An extra charge is pricing-affecting. Current target behavior can leave a paid invoice stale after a later charge; the new workflow must reconcile/reopen invoice atomically or fail closed. A false PAID state is forbidden.

## Checkout

Checkout reads authoritative Billing state in the same decision window. `settled` requires fully paid; `pending-approved` is the governed positive-balance exception with accepted reference and admin-only override. Checkout preserves booking total.

## Cancellation / no-show / late arrival / check-in

These preserve booking total and any existing payment/invoice evidence. Cancellation/no-show add no automatic refund, retention or penalty. Late arrival changes only operational metadata. Check-in changes lifecycle/room occupancy only.

## Audit / concurrency

Money-affecting mutations must be atomic with truthful audit; failed/stale operations leave booking total, invoice, payment evidence and events unchanged.