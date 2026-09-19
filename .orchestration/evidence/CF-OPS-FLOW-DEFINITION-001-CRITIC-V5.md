# INDEPENDENT DEFINITION CRITIC V5 — CF-OPS-FLOW-DEFINITION-001

Artifact reviewed: `6604871ed5c010451db3441deedd58a8c194fa93`
Boundary reviewed: `1c49f6ddaee61cbd454988e69119ffb42d8a0169`
Verdict: `REWORK`

Boundary check: PASS. B5 is exactly one commit after A5 and changes only `.orchestration/STATE.md` and `.orchestration/STATUS.json`.

## F1 — Status/metadata-only booking mutations have an unregistered pricing divergence — BLOCKING FINANCIAL CONTRACT

Accepted source `update_booking_transactional` recalculates `booking.total_price_cents` from the current room price plus extra charges on the generic booking update path after applying status/front-desk metadata. This means a source PATCH used only to record late arrival, cancellation/no-show, check-in or checkout can incidentally reprice accommodation when the current room price differs from the previously stored total.

A5 explicitly states late-arrival recording changes no booking total/invoice and elsewhere scopes source repricing to date/room changes. That is a desirable target hardening, but it is not source parity and is not registered in `20-intentional-target-departures.md`.

The ambiguity also affects cancellation/no-show/check-in/checkout: the definition does not state strongly enough whether a state/evidence-only lifecycle operation may recalculate accommodation simply because source generic PATCH did so.

### Required repair

Register an explicit target departure and make it a financial invariant:

- **pricing-affecting mutations:** room change, stay-date change/extension, explicit extra charge (and any later expressly priced command) may recompute/change authoritative total according to their defined rule;
- **state/evidence-only mutations:** check-in, cancellation, no-show, late-arrival metadata and checkout do **not** reprice accommodation merely because they persist state/evidence;
- checkout may create/reconcile invoice/settlement state against the already-authoritative booking total but does not change accommodation price absent a separate pricing mutation;
- cancellation/no-show preserve booking total and payment/invoice evidence for financial follow-up; they add no refund/penalty automation;
- late arrival preserves booking total/invoice exactly;
- implementation must not copy the source generic-update incidental repricing into these commands.

This is a domain/accounting correctness correction and must be added to the closed-set source-departure register.

## V4 findings recheck — PASS

Late-arrival route/payload/auth is now canonical; front-desk board authorization is explicit; vacant NON_BLOCKING maintenance is fully enumerated. No regression found there.

## Other areas rechecked — PASS

No new blocker found in reassignment remaining-night semantics, maintenance RBAC/state model, no-show timing, checkout override authority, extension pricing, invoice consistency, guest+booking atomicity, API/OpenAPI ownership, concurrency/audit truth or scope isolation.

## Result

`REWORK`. Add the state/evidence-only no-repricing rule across source-departure register, master/financial model, transition/E2E/API contracts and invariants. Then publish a new Pre-Critic, immutable Artifact + one-commit Boundary, and rerun critic. Implementation remains locked.