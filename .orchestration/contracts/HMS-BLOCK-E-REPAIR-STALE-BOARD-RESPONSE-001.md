# HMS Block E — Bounded E-11 Stale Board Response Repair — Contract 001

Status: **FROZEN BEFORE REWORK CODE**. Parent contract `.orchestration/contracts/HMS-BLOCK-E-HOUSEKEEPING-MAINTENANCE-001.md` remains authoritative. Branch: `impl/hms-block-e-housekeeping-maintenance`.

## Authority

Fresh read-only Independent Critic reviewed A2 `3d28da570b1b0916c49dd03c93c333494dcadadb` + B2 `3114979d9ecd6bc7848ccf1814ac21608f98d789` and returned `REWORK`, no `ROADMAP_BLOCKER`. It confirmed the previous product findings repaired. The only substantive finding is MEDIUM: E-11 requires a deterministic integrated browser assertion for out-of-order board GET responses; the request-ID guard exists in `useHousekeepingWorkspace.ts`, but no executable browser assertion proves an older response cannot overwrite newer state.

## Bounded requirement

Add a deterministic real-browser regression to the existing integrated CF-I05 Worker + D1 runner. Cause two actual UI-triggered `GET /api/v1/housekeeping/board` requests to overlap, hold the older request, let the newer request resolve first with distinguishable authoritative board data, and then release the older response. Assert the UI retains the newer response after both have completed, including its selected queue/case context. The older response must not replace current board data or clear the latest request's loading/error state.

The existing Refresh control is disabled during a board read, which prevents the contracted race from being initiated by an operator. A narrowly scoped interaction repair is permitted: leave Refresh enabled while `loading` is true, but continue disabling it during a business mutation (`actionBusy`). This allows an operator to request a newer authoritative refresh and makes the already-implemented request identity guard reachable through the real UI. Do not enable other controls or change queue, mutation, error, or data semantics.

Keep the assertion deterministic and local/synthetic. Use the existing board endpoint, route, hook request identity behavior and existing fixture; do not add an API, schema, capability, domain state, persistence, product policy or CSS behavior. Do not add a test-only production seam.

## Acceptance and evidence

- Integrated browser test triggers two actual overlapping board loads through the UI and captures both response order and distinguishable response bodies.
- Older response is released after the newer response. DOM proves newest room/case data and selected context remain authoritative after the late response.
- Test fails if the request identity guard is removed or rendered response handling is otherwise changed to accept the stale result.
- Existing CF-I05 API and browser regressions, full Block E validation, bundle ceilings, invariant map and results evidence are rerun/updated.
- Produce replacement immutable Artifact A and evidence-only Boundary, followed by a fresh separate read-only Critic of that exact pair. Metadata handoff reconciliation follows the verdict.

## Invariant classification

All 24 registry invariants remain classified by the frozen parent Block E contract. The repair-specific complete mapping is `.orchestration/evidence/HMS-BLOCK-E-REPAIR-STALE-BOARD-RESPONSE-001-INVARIANTS.md`.

## Non-goals

No changes to product code beyond the explicitly permitted Refresh-control enablement, CSS, budgets, API, D1 schema, domain/capability semantics, or workflow behavior are authorized by this finding. No F–H, real data, promotion, PR, merge, main, staging, deploy or production.
