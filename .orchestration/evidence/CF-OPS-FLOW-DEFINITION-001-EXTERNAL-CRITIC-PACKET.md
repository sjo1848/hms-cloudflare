# EXTERNAL INDEPENDENT CRITIC PACKET — CF-OPS-FLOW-DEFINITION-001

## Immutable review target
Artifact A7: `7d81b3c5fc0af6a834e614572ba4f15b44b9c75a`
Boundary B7: `ce426825dbccc29c63b4d8ddcea587c37f985c09`
Accepted staging baseline: `26239b76b919266de07d7bece5977296647f109c`
Accepted source: `sjo1848/hotel-management-system@4df56a6217caab611f2f5fcbd98bde8386bb5629`

## Critic mandate
Review A7+B7 independently. Do not inherit controller conclusions. Attempt to falsify the definition before implementation.

Read canonical authority in this order:
1. `docs/operational-flows/00-master-definition.md`
2. `18-end-to-end-scope-matrix.md`
3. `19-api-command-contract-map.md`
4. `20-intentional-target-departures.md`
5. `16-target-transition-matrix.md`
6. `05-maintenance-data-rbac.md`
7. `.orchestration/OPERATIONAL-INVARIANTS.md`

Also inspect accepted source/target code where a parity or feasibility claim depends on it.

## Required attack areas
- source-parity drift or unregistered target departure;
- incomplete booking/room/inventory/maintenance state transition;
- pricing side effect on a non-priced operation;
- D11 accounting contradiction, especially credit, `paid_at`, payment-ledger correlation and VOIDED behavior;
- partial mutation/concurrency possibility implied by the contract;
- impossible or orphan RBAC capability;
- API route ambiguity/shadow command;
- cross-module handoff gap;
- missing negative E2E proof;
- implementation sequencing that allows a dependent feature before its invariant foundation;
- scope that remains ambiguous enough for two implementers to produce incompatible behavior.

## Boundary check
Verify B7 is exactly one metadata-only commit after A7 and records the exact A7 SHA with implementation locked.

## Verdict contract
Return exactly one substantive verdict:
- `PASS FOR IMPLEMENTATION PLANNING`, only if no material definition defect remains; or
- `REWORK`, with numbered blocking findings, concrete evidence and required repair.

Do not call missing executable implementation evidence a definition defect when the contract explicitly defers that proof to implementation. Do treat an undefined/contradictory required behavior as a definition defect.

## Current controller status
Controller adversarial review V7 found no blocker, but that result is non-authoritative for this independent review.