# Task Contract — B0 Closure: Raw Static Asset Growth Guardrails

Status: `FROZEN; POLICY EXPLICITLY AUTHORIZED`
Task ID: `HMS-B0-CLOSE-RAW-GROWTH-GUARDRAILS-001`
Base: `0a2b809097d73fd59865e75bb562eb3b6da4fea7` (B0 policy review boundary; runtime evidence subsequently accepted by Controller)
Branch: `impl/hms-b0-bundle-headroom`

## Objective and authorization

Close B0 by recording the accepted runtime investigation, updating the approved development growth ceilings, preserving the checker and compressed ceilings, and registering the exact transition into Block B.

Authorized policy: JavaScript raw aggregate `300,000 → 330,000 B`; CSS raw aggregate `50,000 → 55,000 B`; JavaScript gzip `100,000 B` unchanged; CSS gzip `15,000 B` unchanged. Raw ceilings are development growth guardrails, not performance targets. The accepted causal runtime finding is that ancillary Reception reads gate queue rendering through `Promise.all`; the bundle is not the material cause. Do not change product code under this closure contract.

## Surfaces and acceptance

| Requirement | Surface | Acceptance | Evidence |
|---|---|---|---|
| Preserve material diagnosis | `.orchestration/evidence/HMS-B0-RUNTIME-LOAD-INVESTIGATION-001.md` and this closure record | Preserve local/synthetic limits; FCP/LCP/queue-ready and request sequence; attribute cause to Reception critical-path coupling; no further B0 runtime work | Runtime report and closure evidence |
| Apply exact authorized ceilings | `scripts/check-cloudflare-budgets.mjs` | JS raw 330000; CSS raw 55000; gzip unchanged 100000/15000; all emitted `.js`/`.css` remain included and checker remains enabled | Production build and `npm run architecture:fitness` |
| Name policy accurately | checker comments and orchestration evidence | Raw limits described as development aggregate static-asset growth guardrails, never performance targets | Checker diff and evidence |
| Record baseline/delta | B0 and Block B evidence | Baseline JS 299976 raw / 86915 gzip; CSS 48615 raw / 9193 gzip. Report resulting bytes and exact delta bytes/percent against baseline; keep entry/initial payload separate | Build inventory, checker output and evidence |
| Start Block B only after B0 closes | canonical state + Block B contract | B0 closure evidence complete and Block B contract, exact surface inventory, invariant classification, evidence matrix and Pre-Critic frozen before product edits | Canonical state and linked contract artifacts |

## Invariants

- `INV-EVID-001` APPLIES: budget and runtime claims tied to exact build/browser evidence.
- `INV-STATE-001` APPLIES: exact baseline and later immutable A/B boundaries; no fabricated SHA.
- `INV-SCOPE-001` APPLIES: no B0 runtime re-investigation or C–H scope.
- All other registry invariants are N/A: this contract changes only static-asset guardrail values/comments and orchestration records; it changes no application behavior, domain, authorization, data, or responsive surface.

## Forbidden actions

Do not remove/weaken `check-cloudflare-budgets.mjs`, exclude assets, change gzip values, begin C–H, or perform PR/merge/main/staging/deploy/production/real-data actions.
