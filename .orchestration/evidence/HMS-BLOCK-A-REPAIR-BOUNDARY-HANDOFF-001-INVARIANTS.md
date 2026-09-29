# Durable invariant evidence — Block A boundary handoff metadata repair

Task Contract: `.orchestration/contracts/HMS-BLOCK-A-REPAIR-BOUNDARY-HANDOFF-001.md`

Classification is explicit for all 24 registry invariants in that contract. Applicable invariants:

- `INV-EVID-001`: critic verdict/findings are persisted without embellishment; exact A/B references, independent critic response, parseable STATUS and Git ancestry/path checks are evidence.
- `INV-STATE-001`: A remains `f49ea5592dfb7e5e20e6c11ca4af5a7f8832f867`; follow-up boundary contains orchestration/evidence metadata only; external review remains required and resume remains disabled until the blocking checkpoint is resolved.
- `INV-SCOPE-001`: compare new boundary paths to the approved metadata-only write set; no product source, tests, data or promotion action.

Validation completed before publication: STATUS parses and its worktree path matches the actual checkout; branch and exact Artifact A are asserted; `external_review.required=true` and `resume_authorized=false`; parent A and boundary path checks pass. The critic follow-up on the exact unchanged A plus repaired boundary is the next blocking review and is not self-certified here.
