# REWORK V5 CLOSURE — CF-OPS-FLOW-DEFINITION-001

Status: `CLOSED FOR PRE-CRITIC V6`

Source critic: `CF-OPS-FLOW-DEFINITION-001-CRITIC-V5.md`.

## F1 — Hidden repricing on state/evidence-only writes — CLOSED

Source deep-dive confirmed accepted `update_booking_transactional` recalculates booking price through its generic update path even when the requested change is lifecycle or operational metadata. The target now explicitly treats that behavior as an incidental implementation coupling rather than desired business semantics.

Registered departure **D9** defines a closed pricing-mutation boundary:
- priced: reservation room/date change, reassignment, extension, extra charge, future explicitly priced command;
- non-priced: guest/name/ordinary notes-only update, check-in, cancellation, no-show, late arrival, checkout.

Non-priced writes preserve booking total. Checkout may create/reconcile invoice/settlement state against that stored total but cannot reprice accommodation. Cancellation/no-show preserve financial evidence and add no automatic disposition. Actual total changes reconcile invoice atomically under D8.

The rule is propagated through master, domain model, API map, transition matrix, E2E acceptance, financial register, Billing contract, Reception UX, no-show contract, lifecycle events, sequencing, prerequisites, decision and invariants.

Mandatory tests explicitly change room catalog price before non-priced actions and prove no hidden total/invoice change; priced actions prove the opposite where expected.

## Additional hardening discovered during closure — D10

Accepted source OpenAPI describes late-arrival ETA as `date-time`, while source UI sends a UTC-derived datetime with the timezone suffix removed. Target registers **D10**: RFC3339/ISO-8601 ETA with explicit Z/numeric offset, parsed as an absolute instant and converted to hotel IANA timezone for stay-date validation. Timezone-less ETA is rejected.

D10 is propagated through API, E2E, time/temporal docs, master, decision and invariants.

## Secondary-document sweep

Removed stale financial-gate wording from UX targets, completed late-arrival/maintenance event coverage, aligned front-desk board RBAC in the read-model document, and updated implementation sequencing to include D8/D9/D10 prerequisites.

## Scope isolation

Current branch comparison against accepted staging remains limited to `docs/operational-flows/**` and `.orchestration/**`. No runtime implementation, schema implementation, CI budget change, deployment, staging state, production or main branch is modified by this definition work.

## Result

Critic V5 blocker is materially closed and the discovered timestamp ambiguity is explicitly governed. Next action: Pre-Critic V6. Implementation remains locked.