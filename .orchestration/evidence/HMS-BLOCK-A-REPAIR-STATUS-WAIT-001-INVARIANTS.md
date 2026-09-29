# Durable invariant evidence — Block A external-review wait status

Task Contract: `.orchestration/contracts/HMS-BLOCK-A-REPAIR-STATUS-WAIT-001.md`

The contract explicitly classifies all 24 registry invariants. Applicable:

- `INV-EVID-001`: exact A+B3 reviewer findings are recorded verbatim in `.orchestration/evidence/HMS-BLOCK-A-APP-SHELL-NAVIGATION-CONTEXT-001-INDEPENDENT-CRITIC-A-B.md`; this repair does not relabel the critic as PASS.
- `INV-STATE-001`: exact Artifact A remains `f49ea5592dfb7e5e20e6c11ca4af5a7f8832f867`; the next boundary is metadata-only, uses `WAITING_EXTERNAL_REVIEW`, keeps review required and disables resume.
- `INV-SCOPE-001`: final A→boundary path audit verifies only orchestration status/evidence/repair contract files changed.

Validation completed before publishing the metadata boundary: STATUS parses; `runtime_status=WAITING_EXTERNAL_REVIEW`; `resume_authorized=false`; `external_review.required=true`; the next action awaits Critic follow-up on exact Artifact A plus the current boundary; actual worktree and canonical repository paths are distinct and correct. Artifact A identity remains unchanged. The boundary path audit allows only `.orchestration` contracts, state, and evidence. Independent Critic follow-up on the new exact pair remains pending and cannot be self-closed.
