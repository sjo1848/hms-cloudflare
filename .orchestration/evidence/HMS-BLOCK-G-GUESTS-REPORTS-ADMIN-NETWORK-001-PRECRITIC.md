# Block G Pre-Critic — Admission Gate

Task: `HMS-BLOCK-G-GUESTS-REPORTS-ADMIN-NETWORK-001`
Base: `d9ff3325709633d7760dd236977b90f582b1b144`
Branch: `impl/hms-block-g-guests-reports-admin-network`
Gate type: implementation admission; not implementation PASS, Artifact A, or Independent Critic verdict.

## Contract and scope

- [x] Issue #53 body and all comments read; latest authorization is `START_BLOCK_G_WITH_STAGING_SMOKE_PENDING`, base normalized by `CONTROLLER_NORMALIZATION_COMPLETE`.
- [x] Scope frozen to Guests, Reports, hotel-user administration and Network; F-cash, Block H, main, PR/merge, production and real data excluded.
- [x] Active bundle ceilings recorded unchanged: JS raw/gzip 350000/100000 B; CSS raw/gzip 60000/15000 B. Ceiling breach is hard stop `BUNDLE_BUDGET_GATE_REQUIRED`.
- [x] Product surfaces and route/capability/data authority inventory frozen in `...-INVENTORY-EVIDENCE-MATRIX.md`; no new route/schema/database contract assumed.
- [x] All 24 registry invariants classified in `...-INVARIANTS.md`; applicable evidence remains pending implementation.
- [x] Source parity references read: CF-I07 and CF-I08; roadmap Block G surfaces and boundaries inspected.

## Source-parity preflight

- [x] Guest list, booking context, booking ordering and current guest-create capability identified from actual route/UI code.
- [x] Report inclusive boundaries, status exclusions, timezone defaults, integer cents and zero-safe occupancy recorded from approved source-parity evidence.
- [x] Users/admin routes are backed by CONTROL_DB; network registry is CONTROL_DB and metrics are read from server-configured operational D1 bindings.
- [x] Capability names are sourced from `apps/api/src/auth/capabilities.ts`; UI capability arrays are presentation only.
- [x] No approved requirement for F-cash, new report types, global guest identity/merge or schema migration was found.

## Risk and open conditions

- [x] Staging authenticated UI smoke is pending solely due external Browser test-harness startup failure before navigation; Controller has classified it as `EXTERNAL_TEST_HARNESS_BLOCKER`. No staging action/redeploy is part of G.
- [x] Existing shared Reports/Users browser instability and inherited unrelated findings must be attributed and reported accurately; do not hide or relabel them.
- [x] Guest booking-context request currently uses `Promise.allSettled` but maps a rejected context request to an empty booking list. Treating that as “no stays” is potentially misleading; bounded UI correction may distinguish unavailable context and retry without changing API/domain semantics.
- [x] Network metrics currently fail when a configured store is missing; evidence must prove this is a truthful unavailable failure, not silently report a partial aggregate.
- [x] Existing admin APIs are in scope; source/static audit and executing-D1 checks must determine whether current semantic no-op/audit/concurrency invariants already pass. Repair only within the existing contract, no policy or schema changes.

## Evidence plan and implementation admission

The inventory/evidence matrix maps each material claim to API, executing-D1, browser, route/static, budget, and scope evidence. After implementation, run required unit/integration, TypeScript, build, architecture/i18n/bundle, D1 plans, CF-I07/CF-I08, Wrangler dry-runs, local Worker + D1 + browser, and responsive/accessibility evidence. Any missing proof remains UNPROVEN, not PASS. Recheck route uniqueness, role-name bypass, process cleanup, exact diff scope, and bundle before Artifact A.

**Admission result: PASS TO BEGIN CONTRACTED IMPLEMENTATION.** No `ROADMAP_BLOCKER`, new policy, architecture change, or unapproved domain/backend contract is needed to begin. Final Pre-Critic remains mandatory after implementation.

## Final Publication Gate — 2026-10-02

This section is the post-implementation publication gate; it supersedes the admission-only status above, not its historical record.

### Contract, scope and source parity

- [x] Frozen Task Contract and exact inventory/evidence matrix are unchanged and cover all Block G surfaces and exclusions.
- [x] Guest partial booking-context failure is now truthfully distinct from an empty stay history, with retry and context retention; API/domain semantics are unchanged.
- [x] Reports retain inclusive boundaries, existing state exclusion, timezone defaults, integer-cent sums and zero-safe occupancy; executing-D1 evidence passes.
- [x] Admin/network remain controlled by central server capabilities, authoritative CONTROL_DB, exact mutation winner and audit semantics; no browser role authority or client-selected tenant/binding was added.
- [x] No duplicate/shadow route, schema migration, new domain contract, F-cash or Block H scope is present.

### Mutation and security checks

- [x] CF-I07 executing Worker/D1 regression PASS: authenticated role/capability fixtures, allowed/denied operation, same-subject downgrade denial, exact winner/no-op/audit assertions and network mutation.
- [x] CF-I08 executing Worker + two-D1 regression PASS: independent report values, cents/state/date predicates, tenant separation, complete aggregation and truthful unavailable binding behavior.
- [x] Static route uniqueness and role-name bypass review completed against changed API surfaces; no API authorization implementation changed.

### UX/browser checks

- [x] Integrated local Worker/D1/Vite/Chromium PASS: Users and Network at 375/390/430/768/1024; Reports at WIDE 1440×900, COMPACT 1024×768, NARROW 375×812, landscape 812×375 and reduced-height 375×360.
- [x] User deactivation dialog executes initial keyboard focus, Escape cancel, visible synthetic 409 conflict recovery/retry, confirmation and focus return. Deactivation refresh falls back to a still-connected Search control when the filtered source row is removed.
- [x] Network plan changes assert HTTP 200 and selected state; Reports assert actual 200 API range parameters and visible invalid-range error.
- [x] Guest context 503→retry recovery PASS in real Chromium at WIDE/COMPACT/NARROW/landscape, explicitly with synthetic mocked API; normal live Worker/D1 Guest context is covered by integrated/inherited routes and Guest inventory evidence.
- [x] Inherited CF-I05 integrated browser PASS: responsive (wide/reduced-height/compact/narrow/small/landscape), tenant isolation, failed refresh/retry context, keyboard/focus, deep link/reload/Back/Forward. Process cleanup is verified by runners.

### Build, tests and budgets

- [x] `npm run check`: PASS, 35 files / 176 tests; executing-D1 tests included.
- [x] i18n index unit suite 4/4, `npm run i18n:coverage` PASS, TypeScript PASS; runtime catalogs contain exactly 674 keys in both locales.
- [x] `npm run types:check`: API and Web Worker type checks PASS on Wrangler 4.125.0.
- [x] Production web build PASS; `npm run architecture:fitness` PASS after final build; D1 query-plan PASS.
- [x] CF-I07, CF-I08, integrated Block G browsers and inherited CF-I05 browser PASS.
- [x] API and Web Wrangler dry-runs PASS; deployment commands were not run.
- [x] `git diff --check` PASS after final evidence/state changes; final exact path/scope audit required immediately before Artifact A.
- [x] Bundle table in Results contains baseline→result→delta bytes/% for each raw/gzip, aggregate raw/gzip and initial/entry payload. JS 339914/95371 B and CSS 57024/10564 B are inside unchanged 350000/100000 and 60000/15000 ceilings. No budget gate.

### Required invariant and evidence gate

- [x] All 24 registry rows have final `PASS` or justified `N/A` in `...-INVARIANTS.md`; no applicable row remains `UNPROVEN`.
- [x] Results file states which evidence is executing Worker/D1 versus synthetic mock; screenshots are supplementary and not sole proof.
- [x] Issue #52 remains `STAGING_DEPLOYED_TECHNICALLY_VERIFIED_UI_SMOKE_PENDING`, with external Browser-runtime blocker. G uses local synthetic evidence only; no staging redeploy/smoke is claimed.
- [x] Scope excludes F-cash, Block H, PR/merge/main, staging action, production and real hotel data.

**Final Pre-Critic result: PASS for immutable Artifact A publication.** This is Codex's mandatory internal gate, not the separate Independent Critic verdict or Controller PASS. Artifact A must now be frozen, followed by an orchestration-only Boundary B naming exact A and requiring the fresh read-only Independent Critic.
