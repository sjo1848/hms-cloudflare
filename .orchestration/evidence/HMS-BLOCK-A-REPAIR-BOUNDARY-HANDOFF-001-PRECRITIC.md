# Pre-Critic — Block A boundary handoff metadata repair

Task Contract: `.orchestration/contracts/HMS-BLOCK-A-REPAIR-BOUNDARY-HANDOFF-001.md`
Status: `PASS — metadata-only bounded repair admitted`

- Exact reviewer finding is concrete and limited to worktree pointer, stale next action, and runtime/handoff truthfulness.
- No product decision, architecture change, code/test edit, or real-data access is needed.
- Acceptance is executable: parse STATUS; compare checkout and branch; assert exact A SHA, external-review flag and disabled resume; inspect A→new-B changed paths.
- All 24 invariants are individually classified in the Task Contract. Applicable evidence is the exact metadata/tree checks; no invariant is being waived.
- Artifact A remains immutable. New boundary must not include any non-orchestration path.
- No `ROADMAP_BLOCKER`, scope crossing, promotion, or Human Gate is present.
