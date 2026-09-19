# HMS — Operational Flow Definition Pack

Status: `ANALYSIS / UX INTERACTION REFINEMENT / IMPLEMENTATION LOCKED`
Baseline: `acceptance/staging@26239b76b919266de07d7bece5977296647f109c`

## Canonical entry points

Read in this order:

1. `00-master-definition.md` — product/domain summary.
2. `18-end-to-end-scope-matrix.md` — E2E implementation/acceptance perimeter.
3. `19-api-command-contract-map.md` — API/evidence/compatibility/authorization.
4. `20-intentional-target-departures.md` — authorized source departures.
5. `21-app-interaction-contract.md` — app-shell/navigation/overlay/filter/motion/task behavior.
6. `22-interaction-flow-matrix.md` — current→target interaction mapping and per-flow surfaces/transitions.
7. `16-target-transition-matrix.md` — domain transition authority.
8. `05-maintenance-data-rbac.md` — maintenance capability map.
9. `.orchestration/OPERATIONAL-INVARIANTS.md` — durable invariants.

Core rules:
- HMS follows operator workflow; known state is not reconstructed manually.
- Accepted source behavior is preserved unless registered in `20`.
- Operational correctness and interaction continuity are both required.
- No endpoint/screen is complete without E2E/API/RBAC/audit/negative-path/cross-module proof.
- “App-like” means persistent context + focused tasks + truthful feedback, not decorative animation.

## UX authority

`10-operational-ux-targets.md` states outcomes.
`21` defines the interaction contract.
`22` maps each flow and current implementation gap to the target behavior.
`.orchestration/decisions/CF-OPS-UX-001-APP-INTERACTION.md` records the scope expansion.

A7/B7 and `HG-OPS-EXTCRITIC-001` are historical/superseded final-review targets because UX scope was expanded after publication. A fresh immutable artifact/review packet is required.

## Detailed documents

01 domain model; 02a reassignment; 02b maintenance; 02c no-show; 02d extension; 03a Reception continuity; 03b context/navigation; 03c refresh/read models; 03d operational time; 04/04a acceptance/sequence; 05 maintenance RBAC; 06 temporal rules; 07 future reservations; 08 extension/Billing; 09 prerequisites; 10 UX outcomes; 11 guest+reservation; 12 housekeeping board; 13 financial register; 14 Billing consistency; 15 lifecycle events; 16 transitions; 17 history; 18 E2E; 19 API; 20 departures; 21 interaction contract; 22 interaction matrix.

Implementation remains forbidden until the reconciled definition pack is published immutably and reviewed again.
