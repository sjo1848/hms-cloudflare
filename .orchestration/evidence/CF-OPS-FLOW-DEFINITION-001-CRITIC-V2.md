# INDEPENDENT DEFINITION CRITIC V2 — CF-OPS-FLOW-DEFINITION-001

Artifact reviewed: `0fd52aa5fa344ca7a6d123bdce61c5496453e799`
Boundary reviewed: `11c9ecbdb878462f9b7d0ee4e3bdb1f3d3ceb44f`
Verdict: `REWORK`

The V2 artifact fixes the source-parity failures of Artifact A and materially improves E2E coverage, but it is not yet implementation-safe.

## F1 — Maintenance RBAC remains non-binding — BLOCKING

`05-maintenance-data-rbac.md` defines new capabilities `maintenance.read`, `maintenance.report`, `maintenance.resolve`, but labels the role mapping as `Recommended`.

That leaves BUILD free to choose who can report, classify a blocking incident, escalate an existing case or resolve it. These operations affect sellability, relocation and room state; they are product/security semantics.

Required repair: make the mapping binding and define escalation authorization. Preserve least privilege and accepted role intent:
- admin: read/report/resolve;
- ops: read/report/resolve;
- receptionist: read/report, not resolve;
- housekeeping: read/report/resolve;
- saas_admin: no tenant maintenance capability.

Escalating `NON_BLOCKING -> BLOCKING` is a safety/reporting action and may use `maintenance.report`; resolution/closure requires `maintenance.resolve`. Cleaning transitions remain governed separately by `housekeeping.write`.

## F2 — API/command contract perimeter is under-specified — BLOCKING

The E2E/domain documents define semantics but do not bind which current target contracts are retained versus replaced. Current staging already has explicit lifecycle routes for check-in/reassign/checkout, generic cancellation in booking PATCH and housekeeping routes whose current semantics cannot represent occupied/non-blocking maintenance resolution.

Without a binding API map, BUILD could create parallel routes, retain misleading `/dirty` semantics for occupied resolution, or implement no-show/extension through generic booking PATCH contrary to the explicit-command model.

Required repair: add a canonical API command map that states at minimum:
- preserve explicit check-in/reassign/check-out lifecycle routes;
- preserve cancellation as the existing confirmed-booking terminal update unless a bounded contract deliberately migrates it;
- add explicit no-show command;
- add explicit checked-in stay-extension command;
- preserve/extend `/api/v1/front-desk/board` rather than inventing a parallel read model;
- expand maintenance-open payload with impact and occupied-room support;
- add a semantically correct maintenance resolve command that supports same-state occupied resolution and `MAINTENANCE -> DIRTY` blocking resolution;
- define explicit escalation path for `NON_BLOCKING -> BLOCKING`;
- keep cleaning start/finish independent from maintenance resolution;
- define compatibility treatment for the current `/housekeeping/:id/dirty` route rather than silently changing its meaning.

## F3 — Checkout override authorization should be explicit in the new scope — NON-BLOCKING BUT REQUIRED BEFORE PASS

Accepted source and target capability maps assign `bookings.checkout.override` to admin only. The E2E text says accepted override capability applies, but the final implementation scope should state this directly so no agent broadens it to ops/receptionist while refactoring lifecycle routes.

## What passed

Source-parity timing/pricing/settlement repairs, domain state model, inventory/history semantics, Billing consistency, maintenance impact semantics, timezone foundation, cross-module continuity, E2E scenario coverage, audit/concurrency rules, scope isolation and synthetic-shift acceptance are materially defined.

## Critic result

`REWORK`. Do not exit the definition phase. Repair F1-F3, add the API/RBAC contract to the canonical index/master/E2E matrix, run Pre-Critic V3, publish Artifact A3 + one-commit Boundary B3, then run a fresh critic.