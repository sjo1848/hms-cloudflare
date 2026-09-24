# TASK CONTRACT — WAVE-1.1A-MAINTENANCE-IMPACT

TASK ID: `WAVE-1.1A-MAINTENANCE-IMPACT`  
PROJECT: HMS Cloudflare  
PHASE: `BUILD`  
BRANCH: `impl/wave-1.1a-maintenance-impact`  
BASE ARTIFACT: `efcbaf6fd98086ba29df0b839d29eb953655497d`  
STATUS: `READY / AUTHORIZED`

## Objective and authority

Add only the minimum maintenance-case impact foundation required by V11 to unblock later in-stay reassignment. The read-only authority is `origin/analysis/operational-flow-definition-v11`, specifically documents 05, 07, 16, 19 and 20 under `docs/operational-flows/`. That branch is not merged or vendored here.

This is not reassignment, Reports/Users repair, browser-harness repair, or UI redesign.

## Scope

- Forward migration adding `maintenance_cases.impact` with only `NON_BLOCKING` and `BLOCKING`.
- Deterministic compatibility/backfill; an existing open case protecting an unoccupied `MAINTENANCE` room backfills as `BLOCKING`.
- One open case per room.
- Blocking-aware open, escalate and resolve domain semantics while preserving physical room truth.
- Existing future confirmed reservations remain intact but expose blocking maintenance context; no automatic cancellation, reassignment or guest move.
- Canonical backend capabilities: `maintenance.read`, `maintenance.report`, `maintenance.resolve`.
- Tenant-local authorization, audit/event traceability and tests.

Forbidden: reassignment, multiple cases, OUT_OF_ORDER, D11/payment/pricing changes, Reports/Users fixes, automatic guest movement, generic CRUD bypass, staging/deploy/remote D1/production changes, and merging the V11 definition branch.

## Binding V11 rules

- Open `BLOCKING` blocks new advance sale, including while the room is `OCCUPIED`.
- Open `NON_BLOCKING` does not independently block sale/readiness.
- On `OCCUPIED`, opening either impact preserves physical `OCCUPIED`; BLOCKING adds future-sale blocking.
- On `AVAILABLE`, `DIRTY` or `CLEANING`, BLOCKING enters `MAINTENANCE`; NON_BLOCKING preserves physical state.
- Resolve while `OCCUPIED` preserves `OCCUPIED`.
- Resolve BLOCKING from `MAINTENANCE` enters `DIRTY`.
- Resolve NON_BLOCKING from `AVAILABLE`, `DIRTY` or `CLEANING` preserves physical state.
- Escalation is one-way in this wave and applies the consequence for the current room state.
- Capabilities: admin/ops/housekeeping get read/report/resolve; receptionist gets read/report only; `saas_admin` gets none of the tenant capabilities. Backend checks are authoritative.

## Invariant mapping

- `INV-ATOMIC-001` APPLIES: state/case/event changes share an authoritative write boundary; stale/zero-row writes cannot succeed.
- `INV-AUDIT-001` APPLIES: exactly one truthful event on success, none on rejected/stale operations.
- `INV-DOMAIN-001` APPLIES: explicit maintenance commands only; no generic state bypass.
- `INV-TENANT-001` APPLIES: authenticated hotel routing owns room/case/booking access.
- `INV-RBAC-001` APPLIES: the three maintenance capabilities are backend enforced.
- `INV-PARITY-001` APPLIES: V11 state, backfill, resolution and future-booking semantics are preserved.
- `INV-ENUM-001` APPLIES: impact values are canonical across DB/domain/API/read model.
- `INV-UX-001` APPLIES to existing maintenance information/actions; no new large UI is authorized.
- `INV-RESP-001` N/A for new UI; inherited browser evidence remains required and must not be falsely upgraded.
- `INV-EVID-001` APPLIES: claims map to exact migration/API/D1/browser evidence.
- `INV-LEGACY-001` APPLIES: legacy recovery/backfill preserves tenant, actor/time/provenance where synthesized.
- `INV-MONEY-001` N/A: no financial mutation or amount is in scope.
- `INV-STATE-001` APPLIES: artifact A plus orchestration-only boundary B.
- `INV-ORDER-001`, `INV-CF-I07-001..004`, and `INV-CF-I08-001..004` N/A: no ordering, Users/network admin, or Reports work is in scope.

## Acceptance and validation

- Forward migration applies to current local hotel D1 without historical migration edits.
- Existing open cases backfill without weakening protected `MAINTENANCE` rooms.
- Duplicate open case is rejected.
- Positive/negative coverage exists for every transition rule above, occupied coexistence and truthful physical events.
- Stale/zero-row operations conflict with zero partial state/event effects.
- Allowed and denied capability matrix, tenant-crossing denial, and future-booking flag/no-auto-move are tested.
- Wave 0.3 D11 and financial regressions remain green; shared browser finding stays documented and is not hidden.
- `.orchestration/evidence/WAVE-1.1A-MAINTENANCE-IMPACT-INVARIANTS.md` and Pre-Critic evidence are complete before publication.

Required checks include targeted maintenance tests, migration tests, `npm run types:check`, `npm run check`, `npm run web:build`, relevant query plans, Wrangler dry-runs, inherited financial regression, and browser regression. Browser failure remains a promotion blocker and is not a reason to expand scope.

## Done boundary

The minimum foundation, tests and invariant evidence form one artifact A ready for Independent Critic, followed by orchestration-only boundary B. Wave 1 reassignment remains a separate branch/wave.
