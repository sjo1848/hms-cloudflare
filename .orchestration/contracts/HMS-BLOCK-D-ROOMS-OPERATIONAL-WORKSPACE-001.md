# HMS Block D — Rooms Operational Workspace — Task Contract 001

Status: **FROZEN BEFORE PRODUCT CODE**  
Authorization: Human authorized Block D only from published CTRL-C-01 checkpoint `044ad756b0081d2a54083ea89c782557e97a351f`. Dedicated branch/worktree: `impl/hms-block-d-rooms`, `/home/sjo1848/dev/hms-elite-cloudflare/hms-block-d-rooms`. Blocks E–H, promotion, real data and environments remain unauthorized.

## Objective

Deliver `/rooms` as an operational workspace where staff can scan rooms and inspect a selected room without confusing physical state, service state, maintenance impact, readiness or date-range sellability. Preserve existing room administration and hold behavior, surface booking/guest/maintenance context where the caller has the corresponding server capability, and retain selection through URL navigation. Room state remains authoritative in existing F0 read models and command endpoints.

## Approved sources and dependencies

- `docs/implementation-roadmap/HMS-BLOCK-CONTRACTS-A-H-V1.md`, section D.
- `docs/implementation-roadmap/HMS-IMPLEMENTATION-ROADMAP-MASTER-V1.md`, Block D row and shared room-state rules.
- `docs/implementation-roadmap/HMS-BLUEPRINT-BLOCK-TRACEABILITY-V1.md`, “Room board, state dimensions, holds, occupant navigation”.
- `docs/implementation-roadmap/HMS-FOUNDATION-0-CONTRACT-V1.md`, F0.1–F0.3 room dimensions/readiness/sellability.
- `docs/implementation-roadmap/HMS-ROOM-STATE-CUTOVER-PLAN-V1.md` and `apps/api/src/modules/room-state/domain.ts`.
- Block D depends on Foundation F0.1–F0.3 and App Shell A, all present in the accepted base. Block C is complete and may be linked to, but its lifecycle commands are not changed. Block E is not authorized.

## Frozen state model and invariants

Render separately and using canonical enums: Occupancy `VACANT | OCCUPIED`; Housekeeping `READY | DIRTY | CLEANING`; Maintenance Impact `NONE | NON_BLOCKING | BLOCKING`; Service `IN_SERVICE | OUT_OF_ORDER`. Unknown/conflicting dimensions stay visibly `UNRESOLVED`. Readiness is rendered from `operational_state.readiness` and never inferred from one status label. Sellability is evaluated only for an explicit half-open `[start, end)` interval using the existing `deriveDateRangeSellability` predicate and authoritative hotel-local D1 evidence. Physical availability/readiness is not date-range sellability. Maintenance never rewrites or substitutes Housekeeping. Checkout remains `VACANT + DIRTY` and preserves Maintenance and Service.

## Scope: workflows

1. **Inspect/search board:** show room number/type, all four independent state dimensions, derived readiness and separate attention/impact signals; filter/search without hiding unknown values. Counts must identify what they count and use the same explicit predicates as rows.
2. **Inspect selected room:** persist `room_id` through query, reload and Back/Forward; show price in integer cents, current booking/guest context and dates when available, interval sellability for an explicit range, holds, and maintenance impact/case facts only when the applicable API capability permits.
3. **Date-range sellability:** preserve the no-query `GET /rooms` contract. Add optional paired `start` and `end` query parameters to that existing read route; when present require `rooms.search` in addition to `rooms.read`, and return each room's canonical range result using existing `deriveDateRangeSellability`, `service_state`, overlapping room-night claims, overlapping holds and open BLOCKING maintenance from one tenant-scoped D1 read. Missing/invalid/contradictory evidence fails closed as `UNRESOLVED`; conflicts are `NOT_SELLABLE`; no result may be inferred from legacy `rooms.status`. No new route, schema, command, enum, predicate or pricing policy is introduced. An omitted range leaves `DATE_RANGE_NOT_EVALUATED` unchanged.
4. **Room administration:** retain create/edit room number/type/rate only, only with `rooms.write`; never expose or write lifecycle/state dimensions through generic room CRUD. Prices remain non-negative safe integer cents.
5. **Room holds:** inspect, create, edit and delete through the existing holds routes with `rooms.read`/`rooms.write`. Present every backend-supported hold type, required dates/reason and server validation/conflict; preserve half-open overlap semantics and never claim the client-side check makes the mutation authoritative.
6. **Context links:** booking/guest links go to existing App Shell destinations with stable entity query identity where that destination supports it. Maintenance impact/history is read-only context; links may enter the existing Housekeeping module but no Housekeeping/Maintenance task is implemented or mutated here. Never manufacture a selectable case deep link the destination does not support.
7. **Loading and failure:** board, booking context, selected detail/holds and interval evaluation have independent loading/error/retry. Retain last known room data during refresh and mark stale/error state. Ignore late responses after route/selection changes. Capability refresh/downgrade removes unauthorized controls and a 403 remains server-authoritative.

## Exact repository surface boundary

Primary UI: `apps/web/src/features/rooms/RoomsPage.tsx`, `rooms-operational.css`, `apps/web/src/domain/types.ts`, the room-local i18n catalogs/generated keys, and room-specific tests. Read-only API contract implementation may extend existing `apps/api/src/routes/inventory.ts` and its existing inventory/room-state domain/read-model modules, with directed route/D1 tests; no schema migration is anticipated. Browser/integration scripts and evidence are task-local. Cross-module reads are existing routes only: `/front-desk/board`, `/housekeeping/:id/maintenance`, and `/rooms/:id/holds` as capability allows. No edits to Housekeeping/Reception workflow implementations, app navigation taxonomy, billing, finance, or schema. Any need for an unapproved mutation/domain contract or schema stops as `ROADMAP_BLOCKER`.

## Capability/API inventory

Canonical source is `/api/v1/auth/me` and `apps/api/src/auth/capabilities.ts`; server guards remain authoritative. `/rooms` navigation requires `rooms.read`. Existing room routes: `GET /rooms` (`rooms.read`), `GET /rooms/available` (`rooms.search`; currently explicitly legacy-filtered and not a sellability source), `GET /rooms/:id` and holds reads (`rooms.read`), room create/edit and hold create/edit/delete (`rooms.write`). `/bookings` and `/front-desk/board` require `bookings.read`; guest route reads require `guests.read`; `GET /housekeeping/:id/maintenance` requires `maintenance.read`. Capability absence means omit that auxiliary context/control and keep other permitted room facts usable. Do not add frontend role maps or weaken the backend guards.

## Non-goals / Block E boundary

No housekeeping start/finish/dirty transitions; maintenance report/escalate/resolve; changes to Occupancy, Housekeeping, Maintenance or Service state; bulk state CRUD; new state/status enum; guest relocation; lifecycle, booking or room-night mutation; automated navigation into unsupported selected contexts; new source behavior; schema/backfill/cutover; changes to Blocks E–H. Room hold management and room metadata administration remain within existing `rooms.write` contracts.

## UX and responsive acceptance

Use the approved App Shell and existing shared UI patterns. WIDE: scan board beside selected-room case. COMPACT: preserve usable master/detail with explicit room-to-detail transition if width no longer supports two panes. NARROW/mobile: `Board → Room detail`, not a desktop stack; provide a visible return-to-board action, preserving search, filters, selected room and scroll. Validate 1280×900, 1280×600, 900×700, 390×844, 320×700 and 844×390, keyboard-only/focus, reduced-height and direct/reload/back/forward. Critical controls remain reachable with internal scrolling and mobile safe area. State, Attention and Impact have distinct labels and visual treatment; no hover-only critical details, toast-only conflicts or universal overlay.

## Bundle gates

Baseline at Block C A2: JS 321,619 raw / 91,486 gzip; CSS 54,937 raw / 10,119 gzip. Ceilings remain JS 330,000 / 100,000 and CSS 55,000 / 15,000 bytes. No ceiling increase. Record baseline → result → delta bytes → delta percent for JS, CSS, aggregate raw/gzip and initial payload; CSS has only 63 B raw headroom. Remove/compact obsolete CSS before adding shipped CSS. If any active ceiling still fails after local optimization, stop with `BUNDLE_BUDGET_GATE_REQUIRED`.

## Requirement → acceptance → evidence

Frozen in `.orchestration/evidence/HMS-BLOCK-D-ROOMS-OPERATIONAL-WORKSPACE-001-EVIDENCE-MATRIX.md`. Includes canonical dimension combinations and contradictory/unresolved records; service/readiness independence; range boundaries, holds, inventory claims and BLOCKING/NON_BLOCKING cases; all room/hold mutations, duplicate/stale conflicts; tenant/capability denial with zero drift; stale read suppression/refresh; full Room workflows at contracted viewports and navigation; Block B Reception compatibility.

## Validation and mandatory gates

Unit/component, API and executing-D1 tests; TypeScript; production build; architecture/i18n/bundle budgets; relevant D1 query plans; local Worker + migrated synthetic D1 + browser. WIDE/COMPACT/NARROW, reduced-height/mobile landscape, keyboard/focus, direct/deep link/reload, Back/Forward, filters/search, room/hold create/edit/delete success/cancel/error/409, capability denial/refresh, stale response and context preservation. Regression Blocks B/C entry paths, with no changes to their behavior. Screenshots support executable assertions and cannot alone prove PASS.

All 24 registry invariants are classified before implementation in the task invariant evidence. The pre-implementation Pre-Critic package is frozen before code. Before immutable Artifact A, update result, invariant and final Pre-Critic evidence; run self-adversarial QA; require all applicable invariants PASS; freeze Artifact A. After A only evidence/orchestration edits are allowed until Boundary B. Request fresh separate read-only Independent Critic on exact A+B; then reconcile STATE/STATUS and closure before `BLOCK_D_COMPLETE_AWAITING_CONTROLLER_REVIEW`. Do not self-approve.

## Stop conditions

Only `ROADMAP_BLOCKER`, new product policy, material architecture change, new unapproved backend/domain contract, `BUNDLE_BUDGET_GATE_REQUIRED` after optimization, real data, staging/Product Acceptance, or PR/merge/main/deploy/production. Routine bugs, tests, evidence, metadata and implementation choices within this contract are autonomous work. No push is authorized by this Task Contract.
