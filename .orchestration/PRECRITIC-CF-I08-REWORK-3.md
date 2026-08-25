# CF-I08 REWORK-3 — Binding Pre-Critic Supplement

This file supplements `.orchestration/PRECRITIC-GATE.md` for CF-I08 REWORK-3. It does not weaken the canonical gate.

Before publication, Codex MUST additionally prove:

1. **Executable width coverage equals the contract.** The browser script itself must execute material CF-I08/integrated controls at `375`, `390`, `430`, `768`, and `1024`. Evidence text cannot infer missing widths from prior artifacts or screenshots.
2. **Final execution result dominates stale evidence.** If a required regression fails or is interrupted after an earlier PASS, the final artifact state is `UNPROVEN` until a later fresh PASS is obtained. Evidence/Pre-Critic files must be rewritten to match the last successful complete run before publication.
3. **Inherited cleanup is full-schema aware.** Regression fixture cleanup must respect all foreign keys introduced by later accepted increments; calling a failure "pre-existing" does not waive a fresh inherited regression required by the active contract.
4. **Calendar-dependent assertions are source-derived.** Current-day/month fixtures must remain correct on UTC month boundaries; hard-coded totals that only hold on most days are forbidden.
5. **Optional date defaults are semantically asserted.** No-param/start-only/end-only tests must prove the effective source-derived window/result, not only HTTP reachability.

Any unmet item is `UNPROVEN` and blocks artifact publication for Independent Critic.
