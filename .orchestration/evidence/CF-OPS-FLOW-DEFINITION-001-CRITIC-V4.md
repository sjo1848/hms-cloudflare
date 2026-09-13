# INDEPENDENT DEFINITION CRITIC V4 — CF-OPS-FLOW-DEFINITION-001

Artifact reviewed: `1482f7d67396f2ba7095effb3274705c2c9e79b1`
Boundary reviewed: `295a06e240f9751fc271e560e944b658458a3416`
Verdict: `REWORK`

Boundary check: PASS. B4 is exactly one commit after A4 and modifies only `.orchestration/STATE.md` and `.orchestration/STATUS.json`.

A4 closes the prior three critic rounds, but three residual contract gaps still prevent implementation-safe PASS.

## F1 — Late-arrival E2E flow lacks canonical API contract — BLOCKING

`18-end-to-end-scope-matrix.md` includes late-arrival note as E2E-06 and accepted source defines ETA/note validation/audit. `19-api-command-contract-map.md` does not bind its route/payload/authorization.

Required repair: preserve this as a `CONFIRMED` booking context update through the existing booking update surface, with explicit payload and validation:
- `late_arrival_eta` required/future and inside `[check_in, check_out)`;
- `late_arrival_note` trimmed min 6;
- booking remains `CONFIRMED`;
- authorization uses normal confirmed-booking update capability set (admin/ops/receptionist);
- actor/time/audit recorded;
- no inventory/room mutation.

## F2 — Front-desk board read authorization is implicit — BLOCKING SECURITY CONTRACT

The API map fixes `GET /api/v1/front-desk/board` but does not bind its capability. BUILD could accidentally expose operational guest/booking context to `housekeeping` or `saas_admin`.

Required repair: canonical authorization is tenant `bookings.read`, which preserves current role intent: admin/ops/receptionist allowed; housekeeping and saas_admin denied. Any future broader read requires a separate decision.

## F3 — NON_BLOCKING maintenance on vacant turnover states is semantically allowed but incompletely enumerated — BLOCKING CONSISTENCY

Canonical maintenance model allows NON_BLOCKING cases on `AVAILABLE`, `DIRTY` and `CLEANING` with physical state unchanged. The transition matrix maintenance-case table explicitly lists occupied NON_BLOCKING but only lists vacant BLOCKING openings. Because the same matrix states unlisted commands default to reject, this is ambiguous/contradictory.

Required repair: explicitly add open NON_BLOCKING rows for `AVAILABLE`, `DIRTY`, `CLEANING`, preserving physical state and advisory semantics. Ensure API/open/resolve and E2E acceptance cover them.

## What passed

No blocking defect was found in:
- source-parity and D1-D8 departure governance;
- booking lifecycle/room turnover/inventory history;
- pricing and Billing reconciliation;
- checkout override authority;
- maintenance role mapping and room-scoped read concept;
- material reason/escalation/resolution evidence;
- canonical no-show/extension/reassignment commands;
- legacy `/dirty` compatibility boundary;
- concurrency/audit truth;
- atomic guest+reservation;
- scope isolation and synthetic-shift structure.

## Result

`REWORK`. Repair F1-F3 and propagate them across API map, E2E matrix, transition matrix, master/decision/invariants as appropriate. Then publish Pre-Critic V5, immutable A5 + one-commit B5, and run the next critic. Implementation remains locked.