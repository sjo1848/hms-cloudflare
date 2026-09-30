# Task Contract — Block B: Reception + Booking/Stay Case

Status: `FROZEN BEFORE PRODUCT IMPLEMENTATION`
Task ID: `HMS-BLOCK-B-RECEPTION-BOOKING-STAY-001`
Base: `0a2b809097d73fd59865e75bb562eb3b6da4fea7` (B0 policy boundary; B0 closure changes are tracked separately)
Branch: `impl/hms-b0-bundle-headroom`
Authority: accepted Block B authorization in the current Controller instruction; roadmap Blueprint 001 / Reconciliation 007 / Final Disposition 008 as indexed by `docs/implementation-roadmap/HMS-IMPLEMENTATION-ROADMAP-MASTER-V1.md`.

## Objective

Make Reception the hotel's operational workspace, with queue and selected Booking/Stay context answering what needs attention, which case is being operated and the next valid existing action. Implement an explicit Attention / Arrivals / In-house / Departures / Reservations workspace and a first-class selected Booking/Stay case. Preserve the approved shell, backend-owned semantics, capability enforcement, queue priority, route/API contracts, and lifecycle command ownership.

First acceptance is causal: queue rows sourced from `/front-desk/board` render without waiting for `/rooms`, `/guests`, or `/reservation-creation-operations`. Those reads load independently/progressively with independent loading/error/refresh state, stale-response protection and continuity. Do not set an absolute localhost millisecond target.

## Frozen source design and boundaries

- Authority: `docs/implementation-roadmap/HMS-BLOCK-CONTRACTS-A-H-V1.md` Block B, `HMS-IMPLEMENTATION-ROADMAP-MASTER-V1.md` Block B / UX constraints / integration rules, `HMS-BLUEPRINT-BLOCK-TRACEABILITY-V1.md`, `HMS-TEST-EVIDENCE-MATRIX-V1.md`, `HMS-IMPLEMENTATION-ROADMAP-DEPENDENCY-DAG-V1.md`, and `docs/ux-operational-workflow-roadmap-001.md` accepted Reception interaction rows. These are elaboration of the frozen Blueprint, not a silent reinterpretation.
- Reception owns queue/case continuity and read-model context; C owns create/edit/lifecycle transaction semantics; D/E own room and housekeeping/maintenance command semantics; F-account owns financial workflows. This task adds no API, schema, D1 query, capability, lifecycle or financial semantics.
- State, Attention and Impact stay separate. Render only backend-supported facts: guest, room, dates, lifecycle/status, readiness, maintenance impact, Booking Account summary when already available from existing authorized read contracts, attention signals and existing capability-authorized contextual actions.
- No change to booking/queue priority, source ordering, synthetic queue item rules, readiness/room-state dimensions, maintenance advisory/blocking semantics, remaining-stay semantics, account grain, actor/audit, typed conflicts or lifecycle authority.
- Keep current transactional workflows operable with the same contracts and capabilities. No enhancement or new action for check-in, new/edit reservation, reassignment, extension, checkout, payments, charges, finance/cash, Rooms, Housekeeping or Maintenance.
- Billing/Cash content is not rendered inside Reception. Preserve the existing BillingWorkspace and API behavior through a separately addressable compatibility surface gated by the existing server-owned `billing.read` capability; do not add/rename grants, edit financial workflows, or introduce Cash ownership. The compatibility route is a proposed Block B presentation surface only, not a Finance redesign. It has no new permissions. If exact current code cannot keep it isolated and reachable without changing shell authority or making an unapproved capability change, stop that slice and record `ROADMAP_BLOCKER`.
- WIDE: persistent `Queue/List | Booking/Stay Case`. COMPACT and NARROW: actual `Queue → Case` state navigation, not desktop stacked vertically; preserve filter, search, selected identity, entry origin, queue scroll and focus. Reduced-height layouts keep primary case context and actions reachable.
- URL is the durable route-state source for queue filter/search and selected booking/task. Direct link and reload hydrate selection; Back/Forward and application Back restore visible case, prior queue context, scroll and focus; preserve unrelated query and hash. Reception query updates must preserve router history/scroll metadata. Capability refresh remains server-owned and fail-closed.

## Exact inspected repository surface inventory

### Product and authority surfaces inspected

- `apps/web/src/features/reception/ReceptionPage.tsx` — queue, case, action panels, Billing mount, URL interactions.
- `apps/web/src/features/reception/useReceptionWorkspace.ts` — board/ancillary fetches, load and selection generations, selected-case/refresh state, existing command orchestration.
- `apps/web/src/features/reception/reception-api.ts` — `loadReceptionQueue()` Promise.all and existing `/api/v1` adapters.
- `apps/web/src/features/reception/model.ts`, `queue.ts`, `queue.test.ts` — UI state, priority/filter/count semantics and unit evidence.
- `apps/web/src/features/reception/reception-queue.css`, `CheckInTask.tsx` — current responsive queue/case and existing focused task behavior.
- `apps/web/src/app/AppShell.tsx`, `navigation.ts`, `router.tsx`, `capabilities.tsx`, `navigation.test.ts` — shell route/nav, history/scroll, server-owned capabilities and stale authorization.
- `apps/web/src/features/billing/BillingWorkspace.tsx` and billing styles/API — existing separate presentation component to preserve outside Reception.
- `apps/web/src/i18n/**` and `scripts/check-i18n-coverage.mjs` — all added user-visible copy must be localized for supported locales.
- `apps/api/src/routes/front-desk.ts`, `bookings.ts`, `lifecycle.ts`, `housekeeping.ts`, `billing.ts`; `apps/api/src/auth/capabilities.ts`; `apps/api/src/routes/front-desk-board.executing-d1.test.ts` — read-only contract verification and existing Worker/D1 regression surfaces. No API/schema/product backend edit is authorized.
- `scripts/cf-f0-11-reception-integrated.playwright.js`, its runner, `scripts/cf-block-a-shell.playwright.js`, existing mobile and architecture runners — executable evidence precedents; new Block B runner/evidence file(s) may be proposed explicitly below.
- Binding docs listed above, `.orchestration/INVARIANTS.md`, `.orchestration/PRECRITIC-GATE.md`, approved `PM-AUTONOMY-001.md` and `PM-INVARIANTS-001.md`.

### Explicitly proposed new surfaces (only if needed)

- `apps/web/src/features/reception/reception-context.ts` (or equivalent small pure helper) for serializing/restoring selected-case and queue context while retaining current queue semantics.
- `scripts/cf-block-b-reception-workspace.playwright.js` and a paired owned-process Worker/D1/Vite runner for causally delayed auxiliary reads and real integrated browser coverage at the contracted viewports. The runner must retain synthetic disposable D1 only and verify process cleanup.
- A capability-gated `/billing` compatibility route that reuses `BillingWorkspace` without changing its transaction UI/API or adding it to Reception; implementation must first demonstrate that `billing.read` is the existing intended visibility gate and add an exact same-subject allow/deny test. Do not add this route if that requires changing the frozen Block A navigation taxonomy or permission model; classify the contradiction as `ROADMAP_BLOCKER`.
- Evidence files named in the matrix and final artifact/boundary records. No migration, API route, domain, capability, or financial-data surface is proposed.

## Requirement → surface → acceptance → evidence

| Requirement | Expected surface | Acceptance | Evidence |
|---|---|---|---|
| Queue readiness independent of ancillary reads | Reception API/hook/page | Board success makes queue visible while each auxiliary request is still pending; no Promise.all visual gate; each auxiliary resolves/rejects independently without hiding queue or other available data; initial/refresh semantics distinguished | Unit tests with deferred promises; Worker/D1 + browser route-delay test and DevTools trace with board/aux request start and end, Queue-ready, FCP, LCP, before/after |
| Partial loading/error and refresh continuity | `useReceptionWorkspace.ts`, `ReceptionPage.tsx` | Queue has its own initial/error/retry; rooms, guests, recovery each expose local loading/error/retry; refresh keeps known board/case visible; stale board/auth/load generation cannot overwrite newer identity or case | Unit race/failure matrix + browser refresh while auxiliary request pending and independent failure cases |
| Workspace hierarchy | `ReceptionPage.tsx`, `queue.ts`, CSS/i18n | Attention / Arrivals / In-house / Departures / Reservations represented as workspace views over existing board items; no priority/data semantic change; State, Attention, Impact visually and accessibly distinct; one contextual primary action where an existing capability allows it | Deterministic fixture whose ID/storage order conflicts with expected priority; assertions for lane identity/order, labels and action/capability |
| Booking/Stay Case context | Reception case view | One selected booking identity controls guest, room, dates, state, readiness, maintenance impact, existing Booking Account summary if supported, attention and contextual existing actions; no redundant booking selector; do not invent absent values | Worker/D1 source read assertions + browser known booking fixture; unsupported/missing facts represented as unknown/absent, not inferred |
| WIDE | Reception layout | At 1280×900 and 1280×600 queue/list and case simultaneously visible/usable, independently scrollable as needed, no horizontal overflow, selection remains visible | Playwright viewport/overflow/interaction/focus assertions and screenshots |
| COMPACT | Reception layout/navigation | At 768×1024 and 900×700 use Queue→Case state navigation rather than vertical stack; application Back returns the same lane/search/selection origin/scroll and focus | Playwright case below queue scroll, open/back, scroll/focus identity assertions |
| NARROW / mobile | Reception layout/navigation | At 390×844 and 320×700 use app-like Queue→Case; no desktop stack, no universal drawer/sheet; actions remain reachable with safe areas/fixed nav; keyboard/focus remains visible | Playwright actual filter/search/select/case/back/reload at both widths; assert no horizontal overflow/occlusion; diagnostic screenshots |
| Reduced height | Reception layout | At 1280×600 and 844×390 landscape, selected state and primary action remain reachable; queue/case scrolling does not trap controls | Playwright keyboard and scroll assertions |
| Route/context continuity | `ReceptionPage.tsx`, router/helper | `/bookings?lane=…&q=…&booking_id=…` direct load/reload selects same case; invalid/nonexistent ID fails safely to queue; browser Back/Forward round-trips selection/filter/search; application Back restores originating queue; preserve hash/unowned query/router scroll state; refresh and auth refresh do not silently select another case | Playwright direct links/reload/Back/Forward/query/hash/focus/scroll assertions, plus pure URL helper unit tests |
| Capability-aware behavior | AppShell, existing capability gates | Existing `/auth/me` remains sole frontend permission source; stale event clears capability UI then refreshes; direct routes remain capability denied; backend remains authoritative; denied action absent/disabled according to current contract | Existing F0.10/11 tests cited + same-subject browser downgrade/direct-route test and denied API assertion; no role-name map added |
| Billing separation and compatibility | Reception, AppShell route parser, BillingWorkspace | No Billing/Cash section mounted in Reception; existing payment/account UI remains reachable as a separate context under unchanged `billing.read`; no new finance workflow, selector, capability or API; existing billing regression passes | DOM assertion Reception has no Billing/Cash content; compatibility route same-subject allow/deny + existing `cf-i06`/billing tests |
| Existing workflow regression | Reception, Billing, C/D/E linked workflows | Preserve current contracts and capability behavior without expanding workflows; check-in/reassignment/checkout/create/edit, account/payment/charge, Rooms, Housekeeping/Maintenance continue to pass existing regressions | Existing current branch regressions serially, plus integrated smoke of unchanged paths on Worker/D1 where existing runners provide it; report exact coverage/limits |
| Runtime loading evidence | Browser / Worker / D1 | Same synthetic fixture/build/browser/viewport methodology as accepted B0; record board request start/end, each ancillary start/end, queue visible, first and complete UI usable markers, FCP, LCP, long tasks if exposed; verify intentional delay/rejection of each ancillary does not block queue; no localhost absolute target | `HMS-BLOCK-B-RECEPTION-BOOKING-STAY-001-RUNTIME.md`, raw trace and executable integrated runner |
| Bundle guardrail and accounting | Vite dist + unchanged checker | Preserve all asset inclusion and JS gzip 100000/CSS gzip 15000; report each metric baseline→result→delta bytes→delta %, raw aggregate, gzip, initial/entry payload if measurable, and runtime evidence separately | Baseline `.orchestration/evidence/HMS-B0-WEB-BUNDLE-HEADROOM-001-BASELINE.md`; post-build budget output and Block B evidence |
| Full validation | tests/build/architecture/browser | Unit, integration, typecheck, production build, architecture and i18n gates, budgets, responsive/keyboard/deep-link/context, regression and local Worker+D1 pass | Exact commands/logs, invariant map, precritic and evidence index |

## Invariant classification and required evidence mapping

All 25 registry invariants are classified here. Applicable rows must be proven before Artifact A; conditional N/A rationales are invalidated if product code crosses the listed boundary.

| Invariant | Classification | Acceptance/evidence mapping |
|---|---|---|
| INV-ATOMIC-001 | N/A | No business mutation changes are authorized; any mutation change is scope failure and requires new contract. Existing command regressions protect unchanged paths. |
| INV-AUDIT-001 | N/A | No event/audit mutation changes; existing backend workflow regressions. |
| INV-DOMAIN-001 | APPLIES | Queue/state/action display must use existing domain transitions; no generic CRUD/action; Worker/D1 source inspection and unchanged lifecycle regressions. |
| INV-TENANT-001 | APPLIES | All new reads/routes use existing API tenant binding and same synthetic hotel fixture; local Worker/D1 tenant assertions and API auth context. |
| INV-RBAC-001 | APPLIES | Server-owned `/auth/me` capabilities gate UI; no client role authority; direct-route, stale capability and denied action/API proof. |
| INV-PARITY-001 | APPLIES | Preserve approved queue/task journey, source priority and established actions; frozen source/roadmap mapping + adversarial queue/browser evidence. |
| INV-ENUM-001 | APPLIES | State/readiness/impact display maps canonical model values without changing predicates; fixtures cover actual serialized values and labels. |
| INV-UX-001 | APPLIES | Reception is queue/case workspace with stable context and no stacked landing/Billing; WIDE/COMPACT/NARROW integrated browser evidence. |
| INV-ORDER-001 | APPLIES | Attention/lane ordering/next selection unchanged; fixture IDs conflict with priority order and exact expected IDs asserted. |
| INV-RESP-001 | APPLIES | Execute task controls at WIDE/COMPACT/NARROW/reduced-height, keyboard and focus return; browser assertions, not screenshots alone. |
| INV-EVID-001 | APPLIES | Every causal, bundle, API, UI, viewport and compatibility claim links to executable log/trace and limits. |
| INV-LEGACY-001 | N/A | No backfill, migration, legacy data repair or recovery mutation. |
| INV-MONEY-001 | N/A | No finance arithmetic or transaction changes; existing billing tests/regression only. |
| INV-STATE-001 | APPLIES | Freeze Artifact A then orchestration/evidence-only Boundary B with exact identity; no self-PASS or invented SHA. |
| INV-CF-I07-001 | N/A | No admin/network role authorization path changed. |
| INV-CF-I07-002 | N/A | No admin/no-op mutation changed. |
| INV-CF-I07-003 | N/A | No downgrade mutation proof contract changed; stale frontend capability refresh is separately tested under RBAC. |
| INV-CF-I07-004 | APPLIES | New integrated Worker/Vite/Playwright runner owns process tree and verifies all owned processes exited before PASS. |
| INV-CF-I08-001 | N/A | No report arithmetic. |
| INV-CF-I08-002 | N/A | No network aggregation. |
| INV-CF-I08-003 | N/A | No report date/state semantics. |
| INV-CF-I08-004 | N/A | No state enum expansion. |
| INV-CF-I08-005 | N/A | No clock/date-default change. |
| INV-SCOPE-001 | APPLIES | Exclude C–H implementation and all workflow expansions; exact diff and route/API/schema scope audit. |

## Non-goals and forbidden changes

No backend or schema/API contract edits, queue priority changes, capability matrix change, lifecycle/action semantic change, new workflow or future action, financial calculation/operation, room/HK/maintenance workflow redesign, payment/cash work, broad refactor, raw-budget increase beyond B0 authorized values, C–H work, real data, PR, merge, main, staging, deploy or production.

## Review and admission

Separate read-only Specialist reviews before freeze: UX/IA/continuity; responsive/mobile; QA/evidence. Their concrete findings and dispositions are recorded in `.orchestration/evidence/HMS-BLOCK-B-RECEPTION-BOOKING-STAY-001-CONTRACT-REVIEWS.md`. These reviews are contract input, not implementation, Pre-Critic PASS or Independent Critic.

This Task Contract plus exact surface inventory, invariant map and evidence matrix are frozen before the first product edit. Pre-Critic admission plan is `.orchestration/evidence/HMS-BLOCK-B-RECEPTION-BOOKING-STAY-001-PRECRITIC.md`; Artifact A admission requires completed evidence and a separate final read-only Independent Critic on exact Artifact A + Boundary B.
