# 13 — Financial policy and source-parity register

Status: `BINDING CLARIFICATION`; no open Human Gate is required by the current operational-flow definition.

Accepted source financial semantics are preserved by default. A future intentional commercial departure requires an explicit product decision before implementation.

## Active-stay extension pricing — SOURCE PARITY

Accepted source behavior permits editing stay dates and recalculates accommodation using:

`total stay nights × current room price_cents`

then adds existing extra charges.

The dedicated extension command must preserve this behavior in v1 and reconcile any existing invoice atomically.

Do not derive a rate from `prior total / prior nights`; extra charges make that calculation invalid.

### Future alternative requiring explicit product decision

A contracted/frozen nightly-rate snapshot may be commercially preferable because source-parity repricing can change the accommodation value of prior nights when room price changes. If adopted later, define migration/backfill and rate-change rules explicitly. It is not the default for this wave.

## Reassignment pricing — SOURCE PARITY

Accepted source transactional behavior recalculates booking accommodation with the destination room's current price when a room changes, then adds extra charges.

V1 preserves that observable rule. The operator must see the resulting total/balance before confirming an active-stay reassignment when price differs.

A future rule that preserves the old/contracted rate across room changes requires explicit product authorization.

## Checkout `settled` — SOURCE PARITY

Accepted source semantics are binding:

- `settled` requires a fully paid account;
- `pending-approved` is the governed positive-balance exception;
- operational reference and privileged override requirements remain in force.

This is not a Human Gate.

## Cancellation/no-show money disposition — DEFERRED AUTOMATION

Cancellation/no-show do not automatically refund, retain, void or create a penalty in this wave.

- payment entries remain immutable evidence;
- invoice/payment context remains visible for manual financial follow-up;
- refund/retention/penalty automation requires a dedicated future product/Billing decision.

This deferred automation does not block the lifecycle implementation because no automatic money disposition is being added.

## Accounting consistency

Any operation that changes authoritative booking total must keep an existing invoice truthful in the same logical operation. A previously `PAID` invoice cannot remain `PAID` when authoritative amount exceeds paid amount.

This is an invariant, not a commercial option.