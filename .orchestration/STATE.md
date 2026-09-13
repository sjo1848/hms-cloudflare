# HMS Cloudflare — Orchestration State

## CURRENT AUTHORITATIVE STATE

Project: HMS Cloudflare  
Updated: 2026-09-13  
Global Project Mode: `DELIVERY`  
Phase: `OPERATIONAL FLOW DEFINITION`  
Runtime: `EXTERNAL_REVIEW`  
Active task: `CF-OPS-FLOW-DEFINITION-001`

Accepted staging baseline: `26239b76b919266de07d7bece5977296647f109c`.

## IMPLEMENTATION LOCK

This phase is analysis/definition only. Product/runtime implementation, schema migrations for the new flows, production/cutover, real-data migration, paid-resource expansion and new financial policy remain unauthorized.

## PUBLISHED DEFINITION ARTIFACT

Artifact A: `3ad6d84124a7b3da803d8ae2eb4c439a3e411fa4`

Canonical entry points:

- `docs/operational-flows/00-master-definition.md`
- `docs/operational-flows/README.md`
- `.orchestration/contracts/CF-OPS-FLOW-DEFINITION-001.md`
- `.orchestration/decisions/CF-OPS-FLOWS-001.md`
- `.orchestration/decisions/CF-OPS-FLOWS-003-MAINTENANCE-MODEL.md`
- `.orchestration/OPERATIONAL-INVARIANTS.md`
- `.orchestration/evidence/CF-OPS-FLOW-DEFINITION-001-BASELINE.md`
- `.orchestration/evidence/CF-OPS-FLOW-DEFINITION-001-DEEP-DIVE.md`
- `.orchestration/evidence/CF-OPS-FLOW-DEFINITION-001-PRECRITIC.md`

`CF-OPS-FLOWS-002-REFINEMENTS.md` and files explicitly marked `SUPERSEDED` are history only and not implementation authority.

## PRE-CRITIC

Verdict: `PASS FOR EXTERNAL DEFINITION REVIEW`.

The definition package now explicitly covers P0 reassignment, occupied maintenance, no-show, stay extension, operational time, Billing consistency, Reception/Housekeeping/Billing continuity, contextual navigation, revalidation, acceptance evidence and implementation sequencing.

## OPEN HUMAN GATES

### HG-FIN-001 — extension rate basis

Recommended direction: persist a contracted accommodation-rate snapshot and preserve it for ordinary extensions. Not yet human-authorized.

### HG-FIN-002 — checkout `settled`

Recommended direction: `settled` requires authoritative remaining balance = 0; positive balance uses authorized `pending-approved` + reference. Not yet human-authorized.

These gates are explicit product/financial policy and may not be decided by BUILD.

## CURRENT GATE

External Independent Definition Critic must review Artifact A plus this publication boundary for:

- internal semantic consistency;
- contract/P0/P1 coverage;
- agreement with accepted source/target evidence;
- compatibility with durable invariants;
- truthful Human Gate isolation;
- absence of runtime implementation in the analysis artifact.

## NEXT ACTION

Run Independent Definition Critic. On PASS, mark the definition phase complete and authorize only bounded implementation planning/Task Contracts. Do not start product implementation automatically from the review verdict; retain Human Gate restrictions for any affected increment.