# HMS Block E — Bounded Independent Critic Repair — Contract 001

Status: **FROZEN BEFORE REWORK CODE**. Parent Block E contract remains `.orchestration/contracts/HMS-BLOCK-E-HOUSEKEEPING-MAINTENANCE-001.md`; this repair neither reopens product scope nor changes its domain semantics. Branch/worktree: `impl/hms-block-e-housekeeping-maintenance`.

## Exact review authority and findings

Fresh read-only Independent Critic reviewed Artifact A `921f2fb01d48ffa12818eee5c450423275e91832` + Boundary B `4af1d1e6e0be32fc632b0743ebc6eaef2a3e56f9`, verdict `REWORK`, no `ROADMAP_BLOCKER`. Findings: HIGH concurrent legacy recovery can create a second case after the loser returns 409; MEDIUM resolved case history is hidden; MEDIUM escalation is absent from the focused UI; LOW required WIDE viewport 1280×900 was not exercised. Critic additionally noted canonical state remained stale at B; correct that in the final orchestration reconciliation after replacement A+B review.

## Bounded requirements

1. **Exact legacy recovery winner:** retain the approved legacy `POST /housekeeping/:id/dirty` behavior, but guard every case/event side effect so two requests racing from the same MAINTENANCE/no-open-case/version snapshot leave exactly one resolved case and one event. The loser must be 409 with no second case, version, state, or audit drift. Add an executing local-D1 concurrency regression.
2. **Resolved case context/history:** preserve active open-case semantics. When no open case exists, expose only the latest existing resolved case as read-only context in the existing `/housekeeping/board`; render its facts and case-correlated event trace. Do not create a new route/schema/retention rule or alter old events.
3. **Escalation affordance:** expose the existing authorized NON_BLOCKING→BLOCKING escalation command from the focused open-case task with the existing required note validation, capability behavior and authoritative refresh. Do not introduce another domain transition or API contract.
4. **Responsive evidence:** exercise the exact frozen WIDE `1280×900` viewport in the integrated browser, in addition to COMPACT, NARROW, reduced-height and mobile landscape; execute controls and assert no horizontal overflow.
5. **Handoff metadata:** after replacement Artifact A, Boundary B and its fresh Independent Critic, reconcile STATE/STATUS exactly to that reviewed pair and completed Block E. Metadata correction is evidence/orchestration-only after Artifact A.

## Acceptance and evidence

- Worker + executing D1 concurrency returns statuses `200,409`; durable room/version and case set contains exactly one legacy-resolved case and exactly one correlated event; loser creates no second case/event.
- Board/API returns exact active case when open, otherwise exact latest resolved case; UI exposes its resolution facts/history and does not offer resolve/escalate controls for it.
- Focused UI escalation is available only for an open NON_BLOCKING case, validates the existing note contract, submits existing endpoint, refreshes authoritative case state to BLOCKING, and presents errors without losing queue context.
- Playwright executes actual UI/API controls at 1280×900 plus the frozen responsive matrix; history is verified after resolution; no screenshots-only claims.
- Rerun the CF-I05 API and browser regressions, full `npm run check`, Wrangler API/web type checks, production build, architecture/i18n/budgets, D1 query plan, API/web Wrangler dry-runs, diff/scope checks. Any ceiling breach stops at `BUNDLE_BUDGET_GATE_REQUIRED`; ceilings are unchanged.
- Replacement Artifact A contains all substantive repairs and complete invariant/results evidence; Boundary B is evidence/orchestration-only; fresh separate read-only Independent Critic reviews exact pair. No self-approved PASS.

## Invariants

All 24 registry invariants retain the frozen classifications in the parent contract. The repair-specific mapping and evidence paths are `.orchestration/evidence/HMS-BLOCK-E-REPAIR-CRITIC-AB-001-INVARIANTS.md`; repair admission is `.orchestration/evidence/HMS-BLOCK-E-REPAIR-CRITIC-AB-001-PRECRITIC.md`.

## Non-goals

No new schema/migration, endpoint, capability, role, lifecycle, maintenance semantics, retention policy or cross-module workflow. No changes to budgets. No Block F–H, real data, promotion, PR, merge, main, staging, deploy or production. No edits after replacement Artifact A except evidence/orchestration corrections until its Boundary B and Critic.
