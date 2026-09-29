# Task Contract — B0 Budget Policy Review

Status: `FROZEN BEFORE BUDGET TOOLING CHANGE`
Task ID: `HMS-B0-BUDGET-POLICY-REVIEW-001`
Authorization: Controller continuation decision in the current instruction, conditional on all six policy-review criteria.
Base: `3d40b82353ce747d9b79100e0d28e7f9348764fc`.
Branch: `impl/hms-b0-bundle-headroom`.

## Objective / boundary

Verify what the existing web budget measures and whether its raw aggregate ceilings constrain the intended performance risk. If and only if all six authorized conditions pass, adjust the raw development-growth ceilings to JS `330,000 B`, CSS `54,000 B`, retain JS gzip `100,000 B` and CSS gzip `15,000 B`, and keep the budget checker active and inclusive of every legitimate emitted JS/CSS asset. Describe the new raw values only as aggregate static-asset growth ceilings, not universal performance limits.

No product feature or architecture changes. No broad bundle refactor, budget asset exclusion, gzip-limit change, source-map/dev/test leakage concealment, PR, merge, staging, deploy, production, real data, or Blocks C–H. Block B may start only after the six conditions are verified and B0 evidence/checker/docs are closed.

## Surfaces and acceptance

| Requirement | Surface | Acceptance | Evidence |
|---|---|---|---|
| Checker semantics are transparent | `scripts/check-cloudflare-budgets.mjs` | Reports every JS/CSS file counted, exact raw and gzip totals, and labels raw ceilings as aggregate static-asset growth limits; all `.js`/`.css` under `apps/web/dist/assets` remain included | Policy-review evidence + unchanged build output |
| Baseline and initial payload are distinguished | `apps/web/vite.config.ts`, `apps/web/src/main.tsx`, `apps/web/src/app/AppShell.tsx`, emitted `apps/web/dist/**` | Record aggregate output, first-navigation resources, compressed/encoded bytes, entry assets, and browser timing evidence separately | Production build + local Worker/D1 + browser resource/navigation timing; Lighthouse only if a truthful representative result can be obtained |
| No material accidental dev/test code | `apps/web/src/**`, Vite production output | Build contains no test runner, browser test code, dev identity data/control, or source maps. Any residual non-material dev expression is identified and quantified rather than hidden | File inventory and emitted-string audit |
| No safe small change recovers practical headroom | Source/asset contributor analysis | Distinguish actual emitted savings from source-only duplicates; do not refactor architecture to satisfy raw aggregate value | CSS/JS inventory and documented exact savings |
| Existing compressed guardrails remain binding | `scripts/check-cloudflare-budgets.mjs` | JS/CSS gzip stay at the currently approved `100,000/15,000 B` ceilings and measured values pass | `npm run architecture:fitness` |
| Conditional growth policy is applied accurately | budget checker and orchestration evidence | Only if all six criteria pass: raw ceiling exactly `330,000/54,000 B`; no later increase in Block B; raw growth reported baseline→result, absolute and percentage; gzip and entry payload reported separately | `npm run web:build`, architecture gates, exact JSON checker output, Block B baseline evidence |

## Six conditions (all required)

1. Existing raw checker measures aggregate emitted JS/CSS files, not the initial browser payload itself.
2. No material test/development code or source maps are included in production assets.
3. No safe small dedup/dead-code change recovers practical margin without deleting supported behavior.
4. Both current gzip measurements pass the unchanged gzip ceilings.
5. A representative local Worker/D1/browser navigation shows no material initial-load problem; distinguish local lab evidence and its limits from field Core Web Vitals.
6. Updating only aggregate raw growth ceilings/checker labels/evidence does not change product or architecture.

## Invariant classification

| Invariant | Classification | Rationale |
|---|---|---|
| INV-ATOMIC-001 | N/A | No domain mutation. |
| INV-AUDIT-001 | N/A | No business event/audit. |
| INV-DOMAIN-001 | N/A | No domain transitions. |
| INV-TENANT-001 | N/A | No tenant data behavior changes; synthetic local Worker only. |
| INV-RBAC-001 | N/A | No authorization changes. |
| INV-PARITY-001 | N/A | No domain behavior change. |
| INV-ENUM-001 | N/A | No enum/state change. |
| INV-UX-001 | APPLIES | Prove the measured initial payload is representative of the real UI; do not remove product behavior. |
| INV-ORDER-001 | N/A | No queue ordering changes. |
| INV-RESP-001 | N/A | No responsive UI/CSS behavior changes. |
| INV-EVID-001 | APPLIES | Claims distinguish aggregate, gzip, entry assets, measured local browser timing and field performance. |
| INV-LEGACY-001 | N/A | No backfill/recovery data. |
| INV-MONEY-001 | N/A | No financial behavior. |
| INV-STATE-001 | APPLIES | Any substantive checker artifact follows immutable A + orchestration-only B; no fabricated SHA. |
| INV-CF-I07-001 | N/A | No protected admin authorization change. |
| INV-CF-I07-002 | N/A | No admin mutation. |
| INV-CF-I07-003 | N/A | No downgrade proof. |
| INV-CF-I07-004 | N/A | Any local Worker/browser runner must verify owned process cleanup. |
| INV-CF-I08-001 | N/A | No report arithmetic. |
| INV-CF-I08-002 | N/A | No network aggregation. |
| INV-CF-I08-003 | N/A | No reporting ranges or states. |
| INV-CF-I08-004 | N/A | No expanded state enum. |
| INV-CF-I08-005 | N/A | No hotel date/clock semantics. |
| INV-SCOPE-001 | APPLIES | Keep B0 bounded; Block B only after B0 closure; no C–H scope. |

## Stop rule

If any one of the six conditions is false or remains `UNPROVEN`, do not alter budgets and do not start Block B. Stop at `BUNDLE_BUDGET_POLICY_GATE_REQUIRED` with exact evidence. If all pass, close B0 under the exact authorized ceilings and proceed to Block B without an intermediate Human Gate.
