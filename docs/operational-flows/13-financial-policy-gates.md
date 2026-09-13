# 13 — Financial policy gate and deferred policy

Status: `HUMAN GATE REGISTER / SOURCE-PARITY CLARIFICATION`

Operational/domain work must not invent unsupported commercial rules. Accepted source financial semantics remain binding and are not reopened as Human Gates.

## HG-FIN-001 — Rate basis for extending a stay

The new dedicated active-stay extension flow requires an explicit price basis. Current target stores `total_cents`; accepted source stores `total_price_cents` and recalculates accommodation from room price during generic booking updates, but there is no explicit contracted-rate snapshot dedicated to extension semantics. Extra charges also make `total / nights` unsafe as a rate derivation.

Options:

A. **Persist/preserve the originally contracted accommodation nightly rate** for added nights. Recommended for predictable commercial behavior; requires an explicit rate/accommodation snapshot.

B. Apply the room's current price according to a specifically approved extension pricing rule.

C. Require an explicit extension rate/amount entered or approved by staff with an authorization policy.

Recommendation: **A**. Do not implement P0.4 price mutation until human approval.

## Checkout `settled` — NOT A HUMAN GATE

Accepted source semantics are already explicit and binding:

- `settled` requires the account to be fully paid;
- `pending-approved` is the positive-balance exception;
- the accepted reference/override capability rules apply to `pending-approved`.

The target must restore/preserve this behavior. BUILD may not treat `settled` as a manual declaration independent of Billing truth.

## Cancellation/no-show money disposition — DEFERRED

Cancellation/no-show may occur after advance payments. This operational wave does not automatically refund, retain, void or create a penalty.

- payment entries remain immutable evidence of received money;
- invoice/payment context remains visible for financial follow-up;
- refund/retention/penalty policy belongs to a dedicated future Billing decision if automation is requested.

This deferred policy does not block operational cancellation/no-show because those transitions introduce no automatic money mutation.

## Billing consistency regardless of policy

If an invoice exists, any authoritative increase of booking total (extra charge or approved extension delta) must keep invoice amount/status consistent. A previously `PAID` invoice cannot remain `PAID` when the authoritative amount exceeds paid amount.

This is an accounting invariant, not a commercial-policy choice.