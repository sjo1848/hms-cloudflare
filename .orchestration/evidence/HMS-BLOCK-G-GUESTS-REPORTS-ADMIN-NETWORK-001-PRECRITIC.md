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
