# REWORK V4 CLOSURE — CF-OPS-FLOW-DEFINITION-001

Status: `CLOSED FOR PRE-CRITIC V5`

Source critic: `CF-OPS-FLOW-DEFINITION-001-CRITIC-V4.md`.

## F1 — Late-arrival canonical contract — CLOSED

Accepted source evidence confirms late arrival is front-desk metadata on a still-Confirmed booking: ETA must be future and inside the stay and the note is operational evidence.

Canonical target now binds:
- route: existing `PATCH /api/v1/bookings/:id`;
- authorization: `bookings.write` -> admin/ops/receptionist;
- payload: `front_desk.late_arrival_eta` + `front_desk.late_arrival_note`;
- ETA future and hotel-local ETA date in `[check_in,check_out)`;
- note min 6/max 250;
- booking remains CONFIRMED;
- actor/recorded timestamp/audit persisted;
- no room, inventory, booking-total or invoice mutation;
- re-recording allowed under identical guards.

Propagated to API map, E2E matrix, transition matrix, master, decisions and invariants.

## F2 — Front-desk board authorization — CLOSED

Canonical `GET /api/v1/front-desk/board` requires `bookings.read`.

Binding role result:
- admin: allow;
- ops: allow;
- receptionist: allow;
- housekeeping: deny;
- saas_admin: deny tenant operational board.

The E2E acceptance contract requires 200/403 role proofs and tenant isolation. Propagated to API map, E2E matrix, master, decisions and invariants.

## F3 — Vacant NON_BLOCKING maintenance — CLOSED

Transition matrix now explicitly permits opening NON_BLOCKING on:
- AVAILABLE -> physical AVAILABLE;
- DIRTY -> physical DIRTY;
- CLEANING -> physical CLEANING;
- OCCUPIED -> physical OCCUPIED.

NON_BLOCKING never independently blocks sale/readiness; normal physical state/inventory/holds still govern. Resolve preserves physical state. E2E acceptance explicitly tests AVAILABLE/DIRTY/CLEANING cases.

Propagated to transition matrix, E2E matrix, master, decisions and invariants.

## Scope isolation

Comparison against accepted staging baseline shows only `docs/operational-flows/**` and `.orchestration/**` changes. No runtime implementation, migration, CI budget change, staging deploy, production change or main-branch change is part of this analysis phase.

## Result

All V4 blocking findings are materially closed. Next action: Pre-Critic V5. Implementation remains locked.