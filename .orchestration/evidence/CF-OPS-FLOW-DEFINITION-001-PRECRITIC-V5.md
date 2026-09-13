# PRE-CRITIC V5 — CF-OPS-FLOW-DEFINITION-001

Verdict: `PASS FOR IMMUTABLE EXTERNAL REVIEW`

Accepted staging baseline: `26239b76b919266de07d7bece5977296647f109c`.
Accepted source reference: `sjo1848/hotel-management-system@4df56a6217caab611f2f5fcbd98bde8386bb5629`.

This is an admission check, not implementation authorization.

## V4 blocking findings — PASS

### Late arrival

Canonical API is now explicit and source-compatible:
- existing `PATCH /api/v1/bookings/:id`;
- `bookings.write` authorization;
- nested `front_desk.late_arrival_eta` + `late_arrival_note`;
- booking remains CONFIRMED;
- ETA future and hotel-local ETA date within `[check_in,check_out)`;
- note min 6/max 250;
- actor/time/audit persisted;
- no room/inventory/Billing mutation;
- re-recording covered.

### Front-desk board authorization

`GET /api/v1/front-desk/board` requires `bookings.read`: admin/ops/receptionist allowed; housekeeping/saas_admin denied. E2E acceptance explicitly tests role results and tenant isolation.

### Vacant NON_BLOCKING maintenance

Transition matrix explicitly permits NON_BLOCKING opening on AVAILABLE, DIRTY and CLEANING with physical state unchanged, in addition to OCCUPIED. NON_BLOCKING is not an independent sale/readiness blocker and E2E acceptance covers all states.

## End-to-end scope — PASS

The canonical E2E matrix covers foundations, reservation creation, inline guest creation, check-in, cancellation, no-show, late arrival, reassignment, occupied/vacant maintenance, housekeeping, checkout/Billing, extension, extra-charge reconciliation, front-desk board, contextual freshness, post-action continuation, audit evidence, synthetic-shift acceptance and API/OpenAPI/RBAC conformance.

## Domain/state consistency — PASS

Booking/room/maintenance transitions are explicit. Physical state, sellability and readiness remain separate. Remaining-night reassignment preserves history. Overrun reassignment is a registered target correction. Source pricing and checkout settlement semantics remain preserved except for explicitly registered hardenings.

## API/RBAC/evidence — PASS

Canonical route ownership is fixed in `19-api-command-contract-map.md`; maintenance capability mapping is binding; checkout override stays admin-only; material reason/note validation is backend-enforced; generic PATCH/direct room status cannot bypass checked-in lifecycle commands. Late arrival is the defined confirmed-booking metadata use of PATCH.

## Financial consistency — PASS

Payment entries are immutable evidence. Any authoritative booking-total increase reconciles existing invoice state atomically. A stale PAID invoice after a total increase is forbidden.

## Source-departure governance — PASS

`20-intentional-target-departures.md` is the closed-set departure register. Unlisted behavior must preserve accepted source semantics; any newly required departure returns to definition.

## Scope isolation — PASS

Diff from accepted staging is limited to `docs/operational-flows/**` and `.orchestration/**`. No product runtime, migration implementation, CI budget change, deployment, staging state, production or main branch is modified by this phase.

## Admission result

No known unresolved contradiction, orphan capability, undefined E2E row, unbound API path, financial Human Gate or source-parity ambiguity blocks immutable review.

Exact next action: publish this commit as Artifact A5; publish a one-commit orchestration-only Boundary B5 pointing exactly to A5; run a fresh adversarial critic against A5+B5. Product implementation remains locked until that critic returns PASS and orchestration exits definition.