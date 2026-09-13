# HMS Cloudflare — Orchestration State

Project: HMS Cloudflare
Phase: `OPERATIONAL FLOW DEFINITION`
Runtime: `FINAL_EXTERNAL_REVIEW_V4`
Active task: `CF-OPS-FLOW-DEFINITION-001`
Accepted staging: `26239b76b919266de07d7bece5977296647f109c`
Accepted source: `sjo1848/hotel-management-system@4df56a6217caab611f2f5fcbd98bde8386bb5629`

## Implementation lock

Product/runtime implementation remains unauthorized until final Critic V4 passes Artifact A4 and a separate phase-exit state is persisted.

## Artifact A4

`1482f7d67396f2ba7095effb3274705c2c9e79b1`

Canonical authority set:
- `docs/operational-flows/00-master-definition.md`
- `docs/operational-flows/05-maintenance-data-rbac.md`
- `docs/operational-flows/16-target-transition-matrix.md`
- `docs/operational-flows/18-end-to-end-scope-matrix.md`
- `docs/operational-flows/19-api-command-contract-map.md`
- `docs/operational-flows/20-intentional-target-departures.md`
- `.orchestration/OPERATIONAL-INVARIANTS.md`
- `.orchestration/decisions/CF-OPS-FLOWS-001.md`
- `.orchestration/evidence/CF-OPS-FLOW-DEFINITION-001-PRECRITIC-V4.md`

Earlier artifacts A/A2/A3 failed review and are historical evidence only.

## Human Gates

None open for the defined wave.

## Current gate

Run final adversarial Independent Definition Critic V4 against immutable A4 plus this one-commit publication boundary. Only PASS may close the definition phase.

## Next action

Critic V4 -> persist verdict -> on PASS, persist phase exit and authorize bounded implementation planning only.