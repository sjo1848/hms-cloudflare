# 13 — Financial policy Human Gates

Status: `HUMAN GATE REGISTER`

Operational/domain work must not silently invent the following commercial rules.

## HG-FIN-001 — Rate basis for extending a stay

Current HMS stores `total_cents` / source `total_price_cents`, but no immutable booked nightly-rate snapshot. Extra charges can also increase the booking total, so `total / nights` is not a reliable live rate after charges.

Options:

A. **Preserve the originally booked nightly rate** for added nights. Recommended for predictability. Requires storing/backfilling a rate snapshot or accommodation subtotal.

B. Use the room's current price at extension time. Simpler technically, but the same stay can change rate without explicit negotiation.

C. Require an explicit extension rate entered/approved by staff. Flexible but adds operator friction and authorization policy.

Recommendation: **A**. Do not implement P0.4 pricing until human approval.

## HG-FIN-002 — Meaning of checkout policy `settled`

Current backend accepts `settled` without proving that authoritative remaining balance is zero.

Options:

A. **Enforce `remaining_balance == 0` for `settled`; use `pending-approved` for positive balance with override capability/reference.** Recommended.

B. Keep `settled` as a manual declaration independent of Billing state.

Recommendation: **A**, because it makes the persisted policy truthful and uses the existing override path for exceptions.

## HG-FIN-003 — Cancellation/no-show money disposition

Cancellation/no-show may occur after advance payments.

Recommended v1 boundary:

- lifecycle transition does not auto-refund, void or create a penalty;
- payment entries remain immutable evidence of received money;
- existing invoice/payment context remains visible for manual financial follow-up;
- refund/retention/penalty policy is deferred to a dedicated Billing contract.

This recommendation does not block operational no-show if no automatic financial mutation is introduced.

## Existing Billing consistency defect to repair regardless of commercial choice

If an invoice exists, any authoritative increase of booking total (extra charge or approved extension delta) must keep invoice amount/status consistent. A previously `PAID` invoice cannot remain `PAID` when the amount increases beyond paid amount.

This is an accounting consistency invariant, not a pricing-policy choice.