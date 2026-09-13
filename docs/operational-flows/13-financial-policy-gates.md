# 13 — Financial policy and source-parity register

Status: `BINDING CLARIFICATION`; no open Human Gate for the defined operational-flow wave.

## Pricing-affecting mutations

Accepted source pricing remains binding when price is intentionally recalculated:
- reservation room/date edit;
- active-stay reassignment -> total stay nights × destination current price + extras;
- stay extension -> total stay nights × current assigned-room price + extras;
- explicit extra charge.

Existing invoice must reconcile atomically to any new authoritative total.

## D9 — State/evidence-only writes preserve total

Accepted source generic booking update recalculates price even when a write is only lifecycle/evidence metadata. Target intentionally removes this incidental behavior.

The following preserve the already-authoritative booking total:
- check-in;
- cancellation;
- no-show;
- late-arrival recording/re-recording;
- checkout.

Checkout may create/reconcile invoice/settlement status against that total, but does not reprice accommodation. Cancellation/no-show preserve total, payments and invoice evidence for follow-up; no automatic refund/retention/penalty is added. Late arrival changes only operational metadata.

## Checkout settlement

Source semantics remain binding: `settled` requires fully paid; `pending-approved` is the governed positive-balance exception with accepted reference and admin-only override.

## Future product choices

A frozen/contracted-rate snapshot for actual priced room/date changes may be commercially preferable, but requires an explicit future decision and migration/backfill rules. Automated cancellation/no-show refund/penalty/retention likewise remains deferred.

## Accounting invariant

Only a defined pricing mutation may change booking total. Whenever it does, existing invoice truth must change with it in the same logical operation. State/evidence-only writes cannot cause hidden repricing.