# PRE-CRITIC V3 — CF-OPS-FLOW-DEFINITION-001

Verdict: `PASS FOR IMMUTABLE FINAL REVIEW`
Reviewed predecessor: `52be8b95fd5da5e15eebf0f44ae644faa90b962d`
Accepted staging baseline: `26239b76b919266de07d7bece5977296647f109c`
Accepted source reference: `sjo1848/hotel-management-system@4df56a6217caab611f2f5fcbd98bde8386bb5629`

This is an admission gate only. Product implementation remains locked until a fresh critic passes the immutable V3 publication.

## Prior critic closure

Artifact A failed source-parity review. Artifact A2 failed API/RBAC completeness review. Both review outcomes are preserved in `.orchestration/reviews/CF-OPS-FLOW-DEFINITION-001.md` and evidence files.

V3 closes those findings:
- source-parity no-show/check-in/cancellation semantics corrected;
- source pricing/settlement semantics made binding rather than Human Gates;
- maintenance role-capability mapping made binding;
- checkout override kept explicitly admin-only;
- canonical API command/compatibility map added;
- legacy housekeeping `dirty` path restricted to compatibility semantics;
- E2E matrix now requires API/OpenAPI/RBAC conformance.

## Canonical package consistency

The following are intended to be mutually binding and must be reviewed together:
- `00-master-definition.md`;
- `16-target-transition-matrix.md`;
- `18-end-to-end-scope-matrix.md`;
- `19-api-command-contract-map.md`;
- `05-maintenance-data-rbac.md`;
- `.orchestration/OPERATIONAL-INVARIANTS.md`;
- `.orchestration/decisions/CF-OPS-FLOWS-001.md`.

## Full E2E coverage — PASS

The scope defines technical prerequisites plus reservation, inline guest creation, check-in, cancellation, no-show, late arrival, reassignment, non-blocking maintenance, blocking maintenance/relocation, vacant maintenance, housekeeping turnover, checkout, extension, Billing reconciliation, front-desk board, context/freshness, next-case continuation, audit/events, API/RBAC/OpenAPI conformance and synthetic hotel-shift acceptance.

Every business mutation has defined authoritative state effects and fail-closed expectations. Cross-module handoffs and acceptance consequences are explicit.

## API ownership — PASS

Canonical route ownership is explicit:
- preserve/harden lifecycle check-in, reassign, check-out;
- preserve confirmed-booking cancellation on booking update path;
- add explicit no-show and extend-stay commands;
- preserve/extend front-desk board;
- expand maintenance-open and add explicit escalate/resolve commands;
- keep cleaning start/finish separate;
- retain `/housekeeping/:id/dirty` only as bounded compatibility alias.

Generic PATCH/direct room status cannot bypass canonical commands. New/additive API surface must update OpenAPI/client contracts.

## Authorization — PASS

Binding maintenance roles:
- admin: read/report/resolve;
- ops: read/report/resolve;
- receptionist: read/report, no resolve;
- housekeeping: read/report/resolve;
- saas_admin: no tenant maintenance capability.

`maintenance.report` can open/escalate; `maintenance.resolve` closes cases. Cleaning remains `housekeeping.write`. Lifecycle commands use `lifecycle.write` for admin/ops/receptionist. `bookings.checkout.override` remains admin-only.

## Financial/domain consistency — PASS

Source-parity repricing, invoice reconciliation, immutable payments, settlement semantics, remaining-night inventory history, room turnover, maintenance impact, hotel-local date predicates and lifecycle events are aligned across master/matrix/invariants/E2E/API map.

## Scope isolation — PASS

Branch-vs-staging comparison contains only `docs/**` and `.orchestration/**`. No runtime code, migration, CI budget, deploy, production or real-data mutation is part of this definition phase.

## Human Gates — PASS

No open Human Gate is required for the currently defined source-parity wave. Deferred product departures are explicitly outside scope and cannot be invented by BUILD.

## Admission result

No known unresolved definition ambiguity blocks final immutable review. Exact next action: publish this commit as Artifact A3, publish one orchestration-only Boundary B3 pointing exactly to A3, then run a fresh adversarial critic. Only that critic may authorize definition-phase exit.