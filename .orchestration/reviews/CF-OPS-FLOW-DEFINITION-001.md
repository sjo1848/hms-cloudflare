# REVIEW LEDGER — CF-OPS-FLOW-DEFINITION-001

Status: `HISTORICAL REVIEW INDEX / NOT IMPLEMENTATION AUTHORITY`

This file records critic outcomes. The current next action is always taken from `.orchestration/STATE.md` / `STATUS.json`, not from an older review body.

## Artifact A / Boundary B

- Artifact A: `3ad6d84124a7b3da803d8ae2eb4c439a3e411fa4`
- Boundary B: `f5cd69416af361468020ae0a426998a4025dd7f3`
- Verdict: `REWORK`

Blocking findings:
- no-show timing incorrectly changed from source `>= check_in` to `> check_in`;
- unapproved calendar cutoffs were added to check-in/cancellation;
- checkout `settled` was incorrectly treated as unresolved despite source contract.

These findings were repaired before Artifact A2.

## Artifact A2 / Boundary B2

- Artifact A2: `0fd52aa5fa344ca7a6d123bdce61c5496453e799`
- Boundary B2: `11c9ecbdb878462f9b7d0ee4e3bdb1f3d3ceb44f`
- Verdict: `REWORK`
- detailed evidence: `.orchestration/evidence/CF-OPS-FLOW-DEFINITION-001-CRITIC-V2.md`

Blocking findings:
- maintenance role-capability mapping remained advisory rather than binding;
- API/command ownership and legacy compatibility were not fully fixed;
- checkout override authority needed explicit admin-only protection in the new scope.

Repairs:
- `05-maintenance-data-rbac.md` now defines binding role/capability semantics;
- `19-api-command-contract-map.md` binds canonical routes, compatibility, authorization and OpenAPI/client obligations;
- `18-end-to-end-scope-matrix.md`, master, decisions and invariants incorporate those contracts.

## Current review target

The next immutable artifact after these repairs must undergo a fresh critic. Until that PASS is persisted and orchestration exits the definition phase, implementation remains locked.