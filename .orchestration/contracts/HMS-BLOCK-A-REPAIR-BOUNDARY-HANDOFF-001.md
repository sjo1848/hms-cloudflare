# Task Contract — Block A boundary handoff metadata repair

Status: `FROZEN BEFORE REPAIR`
Task ID: `HMS-BLOCK-A-REPAIR-BOUNDARY-HANDOFF-001`
Parent artifact: `f49ea5592dfb7e5e20e6c11ca4af5a7f8832f867`
Current boundary with critic finding: `d987663ad1f023aafdf25afb750020b1c941aa1f`

## Finding and bounded objective

Independent Critic Meitner returned `REWORK` on exact A+B for one MEDIUM handoff inconsistency: `STATUS.json` names the canonical checkout rather than the isolated active worktree, and still directs creation of Boundary B although B exists; passive review dispatch is also represented as `RUNNING`. Correct only orchestration metadata so local dispatch resolves the correct checkout and accurately represents the next action/runtime state. Preserve Artifact A byte-for-byte and do not touch product code, tests, evidence receipts or contracts other than this repair contract/evidence.

## Requirement → surface → acceptance → evidence

| Requirement | Expected surface | Acceptance | Evidence |
|---|---|---|---|
| Worktree pointer is actionable | `.orchestration/STATUS.json` | `working_directory` is the actual isolated checkout `/home/sjo1848/dev/hms-elite-cloudflare/hms-block-a-shell`; canonical repository may be separately named; branch remains `impl/hms-block-a-shell`. | Parse STATUS and compare with `pwd`, `git branch --show-current`. |
| Handoff points forward | `.orchestration/STATE.md`, `.orchestration/STATUS.json` | A exact SHA remains `f49ea5592dfb7e5e20e6c11ca4af5a7f8832f867`; next action no longer says create B and identifies review of exact A + new B. | JSON assertions; state text inspection. |
| Runtime is truthful | `.orchestration/STATUS.json` | While this metadata repair is active, RUNNING is accurate; at final review wait, use a non-running completed/checkpoint status, `resume_authorized=false`, and external review requirement consistent with the pending Controller checkpoint. | Status transition assertions and critic follow-up. |
| Boundary remains orchestration-only | Git diff from A | Only `.orchestration/STATE.md`, `.orchestration/STATUS.json`, this repair Task Contract and its evidence are added/changed; exact A has no changed blobs. | `git diff --name-status A..B3`, tree/parent verification. |

## Invariant classification (all registry IDs)

| Invariant | Classification | Rationale/evidence |
|---|---|---|
| INV-ATOMIC-001 | N/A | No business mutation; read-only tree/status checks. |
| INV-AUDIT-001 | N/A | No product event/audit behavior changes. |
| INV-DOMAIN-001 | N/A | No domain transitions change. |
| INV-TENANT-001 | N/A | No tenant data/API behavior changes. |
| INV-RBAC-001 | N/A | No authorization behavior changes. |
| INV-PARITY-001 | N/A | No source behavior changes. |
| INV-ENUM-001 | N/A | No enum changes. |
| INV-UX-001 | N/A | Product UX artifact remains exact A. |
| INV-ORDER-001 | N/A | No queue ordering changes. |
| INV-RESP-001 | N/A | No responsive/product behavior changes. |
| INV-EVID-001 | APPLIES | Exact critic claim and exact A/B references must be traceable to committed evidence and Git ancestry; no unverified PASS claim. |
| INV-LEGACY-001 | N/A | No recovery/cutover behavior changes. |
| INV-MONEY-001 | N/A | No financial behavior changes. |
| INV-STATE-001 | APPLIES | Preserve non-circular A and orchestration-only B publication; point to exact A, require external review and disable resume while review blocks. |
| INV-CF-I07-001 | N/A | No protected route/API authority changes. |
| INV-CF-I07-002 | N/A | No admin mutation changes. |
| INV-CF-I07-003 | N/A | No capability downgrade flow changes. |
| INV-CF-I07-004 | N/A | No process-owning runner changes. |
| INV-CF-I08-001 | N/A | No report arithmetic changes. |
| INV-CF-I08-002 | N/A | No network aggregation changes. |
| INV-CF-I08-003 | N/A | No report date/state semantics changes. |
| INV-CF-I08-004 | N/A | No state expansion changes. |
| INV-CF-I08-005 | N/A | No report clock/context journey changes. |
| INV-SCOPE-001 | APPLIES | Repair is restricted to handoff metadata; no next block, product source, data, or promotion scope. Diff audit is mandatory. |

## Prohibited actions and close criteria

Do not amend or replace Artifact A, do not change application/test behavior, and do not run any promotion or real-data action. Close only when status JSON parses, worktree pointer and next action are exact, A remains unchanged, the new B is orchestration-only, Pre-Critic/invariant evidence passes, and an independent follow-up reviewer confirms the repaired exact A+B pair. No ROADMAP_BLOCKER is currently indicated.
