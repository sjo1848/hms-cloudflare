# 01 — Domain model

Status: `BINDING DEFINITION / SOURCE-PARITY PLUS REGISTERED HARDENING`.

## Booking lifecycle

`CONFIRMED -> CHECKED_IN -> CHECKED_OUT`, with terminal alternatives `CANCELLED` and `NO_SHOW`. No generic rollback. No-show is eligible when `hotel_local_date >= check_in` and the guest never occupied the room. Check-in/cancellation gain no new calendar cutoff.

Late arrival is operational metadata on a still-CONFIRMED booking, not a state.

## Physical room state

States: `AVAILABLE`, `OCCUPIED`, `DIRTY`, `CLEANING`, `MAINTENANCE`, `OUT_OF_ORDER`.

Normal turnover: `AVAILABLE -> OCCUPIED -> DIRTY -> CLEANING -> AVAILABLE`.

If open BLOCKING maintenance remains at vacancy: occupied room becomes `MAINTENANCE`; resolution returns `DIRTY`, then normal cleaning. A room actually occupied never becomes directly AVAILABLE when vacated.

## Sellability / readiness

Physical state, future sellability and immediate readiness are distinct. Future sellability combines physical-state policy, booking inventory, holds and BLOCKING maintenance. Immediate readiness requires physically AVAILABLE with no blocker.

## Maintenance case

Maintenance is independent from room physical state. `NON_BLOCKING` is advisory and may coexist with OCCUPIED/AVAILABLE/DIRTY/CLEANING without changing state or independently blocking sale/readiness. `BLOCKING` prevents new occupancy; occupied guest remains until explicit relocation/checkout. V1 one open case/room; escalation is explicit.

## Inventory ownership

Lifecycle operations affecting booking/room/inventory are atomic.
- check-in retains claims and occupies room;
- checkout releases unneeded claims and routes room to DIRTY/MAINTENANCE;
- reassignment moves only remaining `[effective_date,check_out)` claims and preserves historical room nights;
- extension claims only `[old_check_out,new_check_out)`;
- no-show releases reservation claims without dirtying room.

## Operational time

Genuine date predicates use server-derived hotel-local date from persisted IANA timezone. Browser/UTC date cannot authorize them. This does not create cutoffs absent from accepted business behavior.

## Financial relationship / D9 pricing boundary

Booking total, invoice and payments are distinct related facts. Payment entries are immutable evidence.

Only an explicitly **pricing-affecting** operation may change booking total: room/date edit, reassignment, extension, extra charge or future explicitly priced command. For source-covered room/date pricing mutations, accommodation uses total stay nights × current selected-room price, then extras. Reassignment uses destination price; extension uses current assigned-room price.

**State/evidence-only** operations preserve booking total: check-in, cancellation, no-show, late-arrival recording and checkout. Checkout may create/reconcile invoice/settlement state against the existing total but cannot reprice accommodation. Cancellation/no-show preserve financial evidence and add no automatic refund/penalty. This is registered target hardening D9.

Whenever a pricing-affecting mutation changes total, any existing invoice reconciles in the same logical operation. A PAID invoice cannot remain falsely settled. Checkout `settled` requires fully paid; `pending-approved` is the governed positive-balance exception.

## Audit principle

Every successful lifecycle/arrival/maintenance mutation records truthful actor/hotel/request/material details only when authoritative state mutation wins. Failed/stale/lost-race operations create no success event.