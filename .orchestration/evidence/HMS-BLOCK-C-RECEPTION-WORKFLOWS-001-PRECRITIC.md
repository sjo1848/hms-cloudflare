# Block C Pre-Critic — implementation admission freeze

Task: HMS-BLOCK-C-RECEPTION-WORKFLOWS-001
Base: fc2daa783b8ef361e39e6945dbdfe2bfe6345b98
Branch: impl/hms-block-c-reception-workflows
Phase: pre-implementation

## Admission status

**PASS FOR IMPLEMENTATION ADMISSION ONLY.** This is not implementation validation, Technical PASS or Independent Critic review. Product-code implementation may start because the Task Contract, exact source inventory, API/capability inventory, all-registry classification, requirement/evidence matrix and reviewer observations are frozen in this documentation commit. No implementation result is claimed yet.

## Pre-code adversarial findings addressed in contract

- Existing source has only Check-in URL task state; create/edit/reassign/checkout are inline or local toggles. Contract requires each new task route, Case identity, browser/application Back ordering and preserved lane/search/filter/query/hash/scroll/focus.
- Existing Edit and Checkout success paths close the Case before authoritative refresh. Contract requires task stay open until fresh result; preserve context/draft on errors.
- Creation is a staged recoverable operation, not one guest+booking transaction. Contract preserves exact operation token+payload on uncertainty; changed payload is a new operation, with an authoritative operation lookup before recovery.
- Reassignment must keep quote token bound to the exact effective remaining interval and current versions; a 409 discards/reloads/requotes instead of retrying stale data.
- Checkout policy choice is not evidence of settlement; F0.7 server ledger/account guard and override capability/reference stay authoritative.
- Extension, No-show and Late Arrival are absent from complete backend/domain/capability contract and are explicitly deferred. No UI-only substitute is allowed.
- Existing browser runner caveats and limits are disclosed in the evidence matrix; mocks/screenshots cannot prove integrated behavior.
- Five separate read-only reviewers inspected distinct lenses: lifecycle/domain, UX/interaction, concurrency/idempotency, responsive/accessibility and QA/evidence. They found no ROADMAP_BLOCKER for the five supported workflows. Their exact observations are recorded in the frozen inventory and their messages are not treated as Independent Critic approval.

## Contract and invariant gate

- Scope and forbidden D–H/promotion/real-data actions are explicit.
- All 24 registry invariant IDs are classified APPLIES or N/A in HMS-BLOCK-C-RECEPTION-WORKFLOWS-001-INVARIANTS.md.
- Requirement → surface → acceptance → evidence is frozen in HMS-BLOCK-C-RECEPTION-WORKFLOWS-001-EVIDENCE-MATRIX.md and the Task Contract.
- No unresolved product policy, new lifecycle meaning, architecture topology or backend contract is presumed. If code reveals that a current approved capability cannot meet the requirement, stop that subproblem as ROADMAP_BLOCKER.
- Budget baseline and active ceilings are frozen; no ceiling increase authorized.

## Required final gate (not yet evaluated)

Before Artifact A: run all contract validations and adversarial scenarios; update the invariant evidence with PASS/N/A evidence; update this Pre-Critic with actual results; check exact claims/limitations, bundle deltas, process cleanup, diff/scope/route checks and Block B regressions. Any applicable invariant FAIL/UNPROVEN blocks artifact publication and is repaired before proceeding. Then freeze A and create orchestration-only B for separate read-only Independent Critic.

## Final implementation self-adversarial gate — PASS for Artifact A publication

Evaluated against the frozen Task Contract, evidence matrix and all 24 frozen invariant classifications. The completed results are recorded in `.orchestration/evidence/HMS-BLOCK-C-RECEPTION-WORKFLOWS-001-RESULTS.md`; all APPLIES invariants have concrete PASS evidence in the invariant record, and all N/A classifications retain their original rationales.

- Full serial Vitest: 35 files / 175 tests PASS. TypeScript, API/Web generated types, production build, architecture gates, i18n test + coverage, D1 query-plan regression, Wrangler API/Web dry-runs and `git diff --check` PASS.
- Executing local synthetic Worker/D1/browser scenarios PASS for staged create/recovery, edit + authoritative refresh, Check-in, remaining-interval reassignment and stale 409 recovery, checkout/room handoff, partial auxiliary failures/retries, stale request ordering, capability denial/refresh, navigation/context, responsive/keyboard/focus.
- Final Block B production-preview regression proves Queue readiness is independent of the three auxiliary reads: Queue visible at 2,601 ms and screenshot at 2,728 ms while the auxiliary requests remain pending until 5,293/6,297/6,397 ms. The browser run is causal evidence, not an absolute localhost target; after-FCP/LCP values were not measured.
- Final bundle gate PASS without changing ceilings: JS 320,330 raw / 91,198 gzip; CSS 54,937 raw / 10,119 gzip. Exact baseline/result/delta bytes and percentages are in the results report. The CSS raw headroom is 63 B; this is disclosed, and no additional ceiling is requested.
- Out-of-scope audit: no Worker endpoint, backend/domain contract, schema, capability model, lifecycle semantics or non-Reception module changed. Extension, No-show and Late Arrival remain deferred. No Block D–H, real data, PR, push, merge, main, staging, deploy or production action occurred.

**Gate result: PASS for immutable Artifact A.** Artifact A is not self-approved as a substantive PASS. Freeze A; make Boundary B orchestration/evidence-only and identity-bound to A; then request a fresh, separate read-only Independent Critic. Continue no further product work before that exact-pair review.


## Bounded REWORK Pre-Critic Gate — PASS for replacement Artifact A2 publication

Task: `HMS-BLOCK-C-REPAIR-HISTORY-FOCUS-001` (including Case focus restoration on browser Forward as recorded in the frozen contract addendum). The initial exact-pair Independent Critic returned two MEDIUM findings; the detailed report preserves that verdict and repair disposition. No product policy, API, backend, schema, capability, lifecycle or budget change was introduced.

- **History:** app task entry carries a task-entry marker; cancel/success traverses that entry; direct task deep links replace task URL and retain the Case; dirty-pop recovery restores the task entry marker. Fresh browser assertions prove cancel → Case → browser Back → Queue (task does not reopen) → Forward → Case.
- **Focus:** Reassignment/Checkout headings are focusable; direct-link Case restore retriggers task focus. History entries identify Queue row, Case heading, or task heading for restoration. Browser proof confirms focused Reassignment entry, focused Case after Forward, and direct task close retains `booking_id`. Fresh local Worker/D1 integrated run exit 0; no mock-only claim.
- **Full test and gates on current product source:** `npm run check` 35 files / 175 tests PASS; `npm run types:check`, `npm run web:build`, `npm run architecture:fitness`, `npm run test:i18n` (4/4), `npm run test:d1-query-plan`, and API/Web `npm run wrangler:dry-run` PASS. `git diff --check` PASS. Integrated reassignment runner also PASS and verifies owned process cleanup.
- **Checkout evidence limit:** checkout task focus assertion completed; POST returned 200 and authoritative CheckedOut refresh, but post-mutation local Wrangler room/invoice reads disconnected on rerun. This incomplete rerun is not called PASS. Initial Artifact A contains a complete prior Worker/D1 checkout success and final settlement code is unchanged; final full Vitest repeats executing-D1 settlement coverage. The limit is explicitly stated in Results.
- **Budget:** baseline remains JS 306,733 raw / 88,540 gzip and CSS 52,127 / 9,664. Final result JS 321,619 / 91,486; CSS 54,937 / 10,119. Aggregate raw 376,556 (+17,696, +4.931%); gzip 101,605 (+3,401, +3.463%). All existing per-asset budgets pass unchanged (JS 330,000/100,000; CSS 55,000/15,000).
- **Scope:** diff is restricted to Reception task history/focus, relevant browser regression/evidence and orchestration evidence. Blocks D–H, real data, promotion and unrelated modules remain untouched.

**Gate result: PASS for replacement Artifact A2 publication only.** Freeze substantive A2, write orchestration-only Boundary B2 with exact A2 SHA and external review required/resume disabled, then obtain a fresh separate read-only Independent Critic on exact A2+B2. This gate is not an Independent Critic PASS.
