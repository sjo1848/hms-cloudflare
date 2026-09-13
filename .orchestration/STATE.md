# HMS Cloudflare — Orchestration State

## CURRENT AUTHORITATIVE STATE

Project: HMS Cloudflare  
Updated: 2026-09-13  
Global Project Mode: `DELIVERY`  
Phase: `OPERATIONAL FLOW DEFINITION`  
Runtime: `ANALYSIS`  
Active task: `CF-OPS-FLOW-DEFINITION-001`

Accepted staging baseline: `26239b76b919266de07d7bece5977296647f109c`.

The first UX/UI pass is complete on staging across Reception, Rooms, Guests, Housekeeping, Reports, Users and Network. The next wave is intentionally paused before product implementation while cross-module hotel workflows are defined.

## CURRENT AUTHORIZATION

Authorized:
- inspect current staging code and behavior;
- define product/domain flows;
- persist decisions, evidence and invariants;
- reconcile orchestration state;
- run non-destructive analysis/review.

Not authorized by this phase:
- runtime/product implementation of new lifecycle behavior;
- database migrations for the new flows;
- production deployment/cutover;
- real-data migration;
- paid-resource expansion;
- new financial policy.

## ACTIVE CONTRACT

`.orchestration/contracts/CF-OPS-FLOW-DEFINITION-001.md`

## BINDING DEFINITION PACK

- `docs/operational-flows/README.md`
- `docs/operational-flows/01-domain-model.md`
- `docs/operational-flows/02a-reassignment.md`
- `docs/operational-flows/02b-occupied-maintenance.md`
- `docs/operational-flows/02c-no-show.md`
- `docs/operational-flows/02d-stay-extension.md`
- `docs/operational-flows/03a-frontdesk-continuity.md`
- `docs/operational-flows/03b-context-navigation.md`
- `docs/operational-flows/03c-refresh-read-model.md`
- `docs/operational-flows/04-acceptance-and-sequencing.md`
- `.orchestration/decisions/CF-OPS-FLOWS-001.md`
- `.orchestration/OPERATIONAL-INVARIANTS.md`
- `.orchestration/evidence/CF-OPS-FLOW-DEFINITION-001-BASELINE.md`

## CURRENT GATE

Implementation remains locked until the definition pack is reviewed for internal consistency, P0 completeness and conflict with existing invariants/current backend behavior.

Required outcome: `PASS FOR IMPLEMENTATION PLANNING`.

A PASS authorizes only creation of bounded implementation Task Contracts. It does not authorize production or unrelated scope.

## NEXT ACTION

Independent definition review -> repair contradictions/omissions if any -> persist final definition verdict -> create first implementation contract for `P0.1 Reassignment correctness`.
