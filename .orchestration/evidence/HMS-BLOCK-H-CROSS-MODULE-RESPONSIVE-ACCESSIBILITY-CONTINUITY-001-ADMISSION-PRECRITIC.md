# Block H Admission Pre-Critic — Frozen Scope Gate

Task: `HMS-BLOCK-H-CROSS-MODULE-RESPONSIVE-ACCESSIBILITY-CONTINUITY-001`
Base: `9141f8a90d46fa8d8d91baa306d72ae0327b2bbd`
Branch: `impl/hms-block-h-cross-module-hardening`
Gate type: pre-implementation admission; not implementation PASS, final Pre-Critic, Artifact A, Independent Critic verdict or Controller PASS.

## Authority and lineage

- [x] Issue #54 body and all comments were fetched. Latest decision `START_BLOCK_H` authorizes H after Block G Controller PASS; exact normalized base is `9141f8a90d46fa8d8d91baa306d72ae0327b2bbd`.
- [x] Issue #53 and #54 decision cross-reference confirms Block G final Controller PASS and H start. Issue #52 staging authenticated browser smoke remains a separate external harness blocker.
- [x] Exact base exists as a commit fetched from origin; dedicated H branch/worktree is clean and based exactly on it. The pre-existing dirty `impl/hms-foundation-0` checkout was not modified.
- [x] The difference from accepted Block G Artifact A `66d43fd28d16fd6379b23c22e73d74578533fe57` through the normalized base is orchestration-only (`.orchestration/STATE.md`, `.orchestration/STATUS.json`).

## Contract and scope

- [x] H contract and route/API/capability/test inventory are frozen before hardening.
- [x] Requirement → expected surface → acceptance → evidence matrix covers A–G eligible journeys, responsiveness, focus/accessibility, navigation/history, async races/recovery, Worker/D1 attribution, and bundle/build gates.
- [x] All 24 registry invariants are classified with rationale before implementation. Applicable final evidence remains UNPROVEN and will block Artifact A until resolved.
- [x] F-cash and all Cash workflows, staging/authenticated smoke, promotion, real hotel data, main/PR/merge, Block I+, policy changes and new API/domain/schema behavior are explicitly excluded.
- [x] The five responsive viewports are specified; per-module evidence will not be inferred from screenshots or another module's suite.

## Source/design and technical admission

- [x] Roadmap H contract and frozen Blueprint traceability establish cross-module testing/hardening, not new business truth.
- [x] Existing accepted A–G routes, capabilities, browser/D1 suites and evidence were inspected; the matrix records uncovered Forward/context, whole-wave viewport/focus and cross-route delayed-read evidence gaps.
- [x] No required new product/domain semantics or architecture change is assumed. A bounded H-only browser evidence runner may be added only where the existing suites cannot assert a frozen row.
- [x] No mainline, staging, production or real-data action is required; all target mutations use local synthetic fixtures.

## Exact-base bundle baseline

- `npm ci` succeeded using the frozen lockfile; no package manifest/lock change was made.
- First `npm run web:build` attempt stopped before compilation because dependencies were absent (`vite: not found`); after `npm ci`, production build PASS.
- `npm run architecture:fitness` PASS, including architecture I/II, i18n coverage and unchanged budget checker.
- Exact base bundle: JS raw/gzip `339914/95371 B`; CSS raw/gzip `57024/10564 B`; ceilings remain `350000/100000` and `60000/15000 B`. No ceiling is breached. Entry/aggregate values are recorded from the actual emitted files in the final Results after verifying the checker’s gzip method.

## Admission decision

**PASS — BEGIN CONTRACTED H HARDENING.** The authorized scope is sufficiently specific, accepted A–G contracts cover the existing behavior, the cross-module gaps can be tested without inventing product/backend semantics, and current exact-base bundle metrics are below all active ceilings. This is admission only. Final implementation Pre-Critic, invariant evidence, full validation and fresh Independent Critic remain mandatory. If a required fix needs a new policy/domain/backend contract or any budget is exceeded, stop at the corresponding gate and report on Issue #54.
