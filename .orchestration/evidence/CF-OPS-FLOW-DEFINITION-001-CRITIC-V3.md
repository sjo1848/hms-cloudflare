# INDEPENDENT DEFINITION CRITIC V3 — CF-OPS-FLOW-DEFINITION-001

Artifact reviewed: `b9d3db3cec6c6c0d3cec012d8f3a7b2abaaa1fa0`
Boundary reviewed: `ae81a4c8f3c73443540899a187484c2508881242`
Verdict: `REWORK`

Boundary check: PASS. B3 is exactly one commit after A3 and changes only orchestration state files.

A3 is substantially complete, but the following contract ambiguities can still lead to incompatible implementations.

## F1 — `maintenance.read` has no canonical read contract — BLOCKING

RBAC now gives `maintenance.read` to admin/ops/receptionist/housekeeping, but the API map defines only maintenance write commands. The existing housekeeping board is governed by `housekeeping.read`, which receptionist does not have.

Required repair: bind a room-scoped maintenance read contract, preferably `GET /api/v1/housekeeping/:id/maintenance`, requiring `maintenance.read` and returning the current open case (or a clear empty/not-found semantic). Front-desk board may still embed summary blocker context without granting housekeeping-board access.

## F2 — Command evidence payloads remain underspecified — BLOCKING

The API map names canonical routes but leaves several material evidence fields implicit.

Required minimum contracts:
- cancellation: terminal reason required, minimum accepted validation length;
- no-show: terminal reason required with same validation;
- active-stay reassignment: operator reason/evidence required in the Reception UX and carried to audit; server contract must define whether mandatory or optional, not leave it to BUILD;
- maintenance escalation: escalation note/reason required so changing impact to `BLOCKING` is auditable;
- maintenance resolution: `resolution_note` required and validated.

Accepted source uses six-character minimum validation for terminal/reassignment/maintenance evidence in the relevant operator flows. The target contract should choose and bind one rule.

## F3 — Overrun reassignment restriction is an unlabelled source departure — BLOCKING GOVERNANCE

`02a-reassignment.md` rejects reassignment when `hotel_local_date >= check_out` until extension or checkout. Accepted source does not enforce this date restriction on an active checked-in room change.

The target rule is defensible because a reassignment with no authoritative remaining stay interval cannot truthfully move future inventory. However, the package's governing rule says source behavior is preserved unless an explicit product decision authorizes a departure.

Required repair: record this as an intentional target correction, with rationale and exact boundary. An overrun `CHECKED_IN` stay must first establish a future checkout through extension or end occupancy through checkout before reassignment. This must be listed among explicit target departures so BUILD cannot mistake it for source parity.

## Non-blocking observations

The inline guest+booking command path is sufficiently bounded because its business atomicity and capability conjunction are explicit. Exact guest field schema may reuse the existing guest-create contract.

No blocking defect was found in transition states, pricing parity, invoice reconciliation, maintenance impact semantics, checkout override authority, legacy `/dirty` compatibility, front-desk board ownership, OpenAPI obligation, synthetic shift coverage or scope isolation.

## Result

`REWORK`. Repair F1-F3, add an explicit target-departures register, update master/E2E/API/decision indexes, run Pre-Critic V4, publish immutable A4 + one-commit B4, then run the final critic.