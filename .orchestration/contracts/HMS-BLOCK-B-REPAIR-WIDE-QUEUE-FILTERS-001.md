# HMS-BLOCK-B-REPAIR-WIDE-QUEUE-FILTERS-001 — Frozen Bounded Repair Contract

Status: `FROZEN BEFORE IMPLEMENTATION`
Parent contract: `.orchestration/contracts/HMS-BLOCK-B-RECEPTION-BOOKING-STAY-001.md`
Finding: Independent Critic REWORK on A `c373511a5fef56d0f1d3a42bc262f14b84c3cbf0` + B `903436fcb69e3e412db7a41aeaacde3a8cfa1504`, MEDIUM: Queue filter labels/counts overlap at WIDE 1280×600; runner does not assert filter geometry/operation at that viewport.

## Objective and strict scope

Make all existing Reception Queue filter controls legible and operable in the existing WIDE 1280×600 layout, and add an executable integrated-browser assertion at exactly 1280×600 that proves filter geometry/non-overlap and a working filter transition. Wrapping or horizontal scrolling may be used if controls remain keyboard- and pointer-operable and visible/scrollable. Preserve filter meaning, lane membership, selection, URL/context behavior and desktop/touch responsiveness.

Only the Reception queue filter presentation CSS and Block B browser evidence runner/assertion may change, with corresponding repair evidence and orchestration state. No API, data, capability, lifecycle, workflow, budget, dependency, architecture, or other viewport redesign. Keep Artifact A `c373511…` and Boundary B `903436f…` immutable. A passing repair publishes a new Artifact A and a separate orchestration-only Boundary B for fresh Independent Critic review.

## Invariant mapping

| Invariant | Classification | Acceptance/evidence |
|---|---|---|
| INV-RESP-001 | APPLIES | At 1280×600, every filter label/count has a non-overlapping visible hit area; clicking a non-All filter changes the visible queue according to its existing behavior; keyboard focus can reach controls. Re-run full WIDE/COMPACT/NARROW/reduced-height workspace runner. |
| INV-UX-001 | APPLIES | Existing filter labels, counts, selection and visual hierarchy remain understandable; no filter state or operation semantics change. Screenshot and browser assertions. |
| INV-EVID-001 | APPLIES | Exact 1280×600 geometry and active-filter results are asserted in executable integrated browser evidence; claims point to the log/screenshot and exact source. |
| INV-SCOPE-001 | APPLIES | Diff restricted to queue-filter CSS, bounded browser runner assertions and repair evidence/orchestration. Confirm no domain/API/schema/capability/lifecycle/finance or C–H changes. |
| Other registry IDs | N/A for this repair | The parent contract and parent Artifact A invariant evidence retain the full registry classification. This repair changes no underlying behavior covered by other registry entries; audit diff and retain regression evidence. |

## Validation and publication

1. Freeze this contract and record the exact Critic finding before source edits.
2. Implement only the bounded presentation/test repair.
3. Run the focused integrated Worker+D1+Vite/browser runner and verify its owned-process cleanup.
4. Run the required Block B/full regression/type/build/architecture/i18n/budget/query-plan/Wrangler dry-run gates already defined by the parent contract; no deployment.
5. Re-run `git diff --check`, scope audit and Pre-Critic/invariant repair evidence.
6. Record bundle baseline→result→delta bytes/% (raw, gzip, entry) and runtime-loading evidence if bundle/runtime changes; state explicitly if the CSS-only repair leaves JS unchanged.
7. Freeze replacement substantive Artifact A, then orchestration-only Boundary B naming exact A SHA and requiring a fresh separate read-only Independent Critic.

No Human Gate is needed: this is a usability defect inside the already approved responsive contract. No Blocks C–H, real data, PR, push, merge, main, staging, deploy or production action is authorized.
