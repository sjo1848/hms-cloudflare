# HMS Cloudflare — Orchestration State

Project: HMS Cloudflare
Phase: `OPERATIONAL FLOW DEFINITION`
Runtime: `EXTERNAL_REVIEW_V2`
Active task: `CF-OPS-FLOW-DEFINITION-001`
Accepted staging: `26239b76b919266de07d7bece5977296647f109c`
Source reference: `sjo1848/hotel-management-system@4df56a6217caab611f2f5fcbd98bde8386bb5629`

## Implementation lock

Runtime/product implementation remains unauthorized until the V2 immutable definition passes fresh adversarial review.

## Artifact A2

`0fd52aa5fa344ca7a6d123bdce61c5496453e799`

Canonical scope:
- `docs/operational-flows/00-master-definition.md`
- `docs/operational-flows/18-end-to-end-scope-matrix.md`
- `docs/operational-flows/16-target-transition-matrix.md`
- `.orchestration/OPERATIONAL-INVARIANTS.md`
- `.orchestration/decisions/CF-OPS-FLOWS-001.md`
- `.orchestration/evidence/CF-OPS-FLOW-DEFINITION-001-PRECRITIC-V2.md`

The earlier Artifact A failed review and is historical evidence only.

## Pre-Critic V2

Verdict: `PASS FOR IMMUTABLE EXTERNAL REVIEW`.

The complete E2E perimeter now covers technical prerequisites, reservation/guest composition, check-in, cancellation, no-show, late arrival, reassignment, maintenance, housekeeping, checkout, Billing consistency, extension, extra-charge reconciliation, front-desk board, cross-module freshness/navigation, audit/events and synthetic shift acceptance.

## Human Gates

None remain open for the current source-parity definition. Future product departures require a new explicit decision.

## Current gate

Run Independent Definition Critic V2 against Artifact A2 plus the publication boundary. Only a fresh PASS can close this definition phase.

## Next action

Independent Definition Critic V2 -> persist verdict -> if PASS, exit definition phase and authorize bounded implementation planning only.