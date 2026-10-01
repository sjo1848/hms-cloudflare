# Block E — Fresh Independent Critic Record — A1+B1

Status: **REWORK — historical pair; bounded findings repaired under Contract `HMS-BLOCK-E-REPAIR-CRITIC-AB-001.md`.** This is not the verdict for the replacement Artifact A + Boundary B.

## Exact pair and review independence

- Artifact A1: `921f2fb01d48ffa12818eee5c450423275e91832`.
- Boundary B1: `4af1d1e6e0be32fc632b0743ebc6eaef2a3e56f9` (A1's immediate child; only adds its boundary evidence file).
- Branch at review: `impl/hms-block-e-housekeeping-maintenance`; worktree clean at B1.
- Reviewer: a fresh separate read-only Independent Critic agent, not an implementer/specialist. It did not edit files, refs or run tests.
- Review sources: frozen Block E Task Contract, exact inventory/matrix, invariant map, Pre-Critic, Results, Boundary B1, budget resolutions, binding invariant registry and relevant API/UI/runner source at the exact pair.

## Verdict and findings

**Verdict: REWORK. No ROADMAP_BLOCKER.**

1. **HIGH — concurrent legacy recovery could persist partial/unattributed writes on HTTP 409.** In the legacy `/dirty` batch, the case insert only checked the expected resulting room version and absence of an open case. A concurrent loser could observe the winner's post-transition version after its own room update affected zero rows, insert/resolve a second case, then have its event rejected; the API's post-batch checks returned 409 after D1 had already persisted some statements. Missing proof: an executing-D1 concurrent legacy recovery test asserting exact final room/version, case set, and event count.
2. **MEDIUM — maintenance case history disappeared after resolution.** The board projected only OPEN cases; the UI filtered events to the selected open-case ID or unlinked events. With no active case after resolve, linked case events were hidden. E-05 historical case detail/trace was not visible.
3. **MEDIUM — focused task lacked a maintenance escalation affordance.** Existing API supported NON_BLOCKING→BLOCKING escalation, but the selected case UI only offered resolution. E-08 requires report/escalate/resolve task interaction; API evidence alone did not prove UI behavior.
4. **LOW — exact frozen WIDE viewport 1280×900 was missing.** Prior browser evidence used 1366×900 and 1280×600, not the exact 1280×900 acceptance size.
5. **MEDIUM — canonical STATE/STATUS remained stale at B1.** State still said RUNNING and described build/implementation/Artifact/Boundary/Critic work as future; status had no exact A/B heads and `external_review.required=false`. This is reserved for final orchestration reconciliation after replacement A+B review.

## Evidence limits

The reviewer inspected the frozen contract/evidence, exact Git pair, relevant SQL/UI/browser code and budget arithmetic. It did not run tests; the test claims in A1's Results were implementer-reported. The reviewer found no architecture contradiction or need for a new policy. A1+B1 remain immutable historical evidence; findings 1–4 were admitted for bounded technical/evidence repair; finding 5 requires post-Critic metadata reconciliation.
