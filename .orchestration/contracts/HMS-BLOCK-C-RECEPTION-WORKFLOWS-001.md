# TASK CONTRACT — HMS-BLOCK-C-RECEPTION-WORKFLOWS-001

TASK ID: HMS-BLOCK-C-RECEPTION-WORKFLOWS-001
PROJECT: HMS Cloudflare
PHASE: BUILD
BRANCH: impl/hms-block-c-reception-workflows
BASE ARTIFACT: fc2daa783b8ef361e39e6945dbdfe2bfe6345b98
STATUS: FROZEN / AUTHORIZED
AUTHORITY: Human authorization “HMS Cloudflare — BLOCK C AUTHORIZATION”

## Objective

Turn the supported Reception transactions into focused tasks launched from the Block B Booking/Stay Case:

Queue → Case → Focused Task → authoritative result → Case/Queue

Keep the selected booking identity and Reception lane, search, filters, URL, scroll and focus context through open, cancel, conflict, success, reload and browser navigation. Preserve current API, capability, lifecycle, inventory, financial, recovery and pricing semantics.

## Frozen scope

Implement UI workflows only for:

1. New Reservation: progressively select/search a guest or create one when both server-owned capabilities permit; choose dates; query availability; select room/rate; enter relevant notes; review; create; and recover an incomplete/uncertain operation using the existing F0.8 identity and endpoints.
2. Edit Reservation: focused task for the existing CONFIRMED-only PATCH; preserve booking identity, guest/room/date constraints, availability and notes; show a final review; refresh authoritative case/queue after success and retain draft/context on conflict.
3. Check-in: preserve the approved P0.1 multi-step workflow and its desktop centered Dialog/mobile full-screen Drawer, readiness rules, BLOCKING vs NON_BLOCKING meaning, authoritative refresh, 409 recovery, focus/discard behavior and next canonical priority case.
4. Reassignment: focused task for the existing CHECKED_IN-only quote and command. Preserve the exact remaining interval [effective_date, original check-out), room inventory/holds/readiness/maintenance, segmented remaining-stay pricing, consumed history, quote token/version protection, and authoritative conflict recovery.
5. Checkout: focused task for the existing CHECKED_IN-only command, server-verified settlement, authorized pending-approved override, required confirmations, one atomic room/inventory/housekeeping transition, unchanged maintenance/service dimensions, authoritative refresh and conflicts.

Extension, No-show, and Late Arrival are deferred as DEFERRED_CAPABILITY_OR_CONTRACT_NOT_PRESENT. Current source has no adequate command + capability + lifecycle contract for these workflows. A NO_SHOW serialization value alone is not an operation contract.

Cancellation remains the existing separate action and semantics; it is not redesigned as an Edit task. No Rooms, Housekeeping, Maintenance, Finance, Cash, Reports, Guests module, Admin, Network, or Blocks D–H work.

## Interaction and continuity contract

- New Reservation launches from the Reception workspace into a progressive focused task. Edit, Reassignment and Checkout launch only from their eligible selected Case. The selected Booking/Stay identity remains in the task heading and URL.
- In WIDE, New Reservation/Edit/Reassignment/Checkout occupy a focused Case-side task surface while Queue remains present. They return to the same Case or queue context. Do not stack overlays.
- Preserve the already approved Check-in surface: centered native Dialog at desktop widths and full-screen task Drawer at compact/narrow widths. Do not weaken its dirty-discard, focus, readiness or continuation behavior.
- In COMPACT/NARROW, use Queue → Case → focused task as separate app states; complex tasks use a full-screen task state, not a vertically stacked desktop page. Application Back and browser Back return task → same Case → Queue in that order.
- Each task has one primary action at a time. Review/confirmation is an in-task step where material; do not open a second modal over a task. Ask to discard only a dirty task. Clean close returns immediately.
- Preserve query/hash parameters not owned by the task. Supported task URL state records task kind and booking_id; lane and q remain unchanged. Direct deep links/reload restore authorized task + Case identity; nonexistent/unauthorized identities fail closed and keep navigation usable.
- Preserve queue scroll, selected row, lane, search, filter and triggering-action focus on cancel/close. On success, close the task only after authoritative refresh; keep the updated Case selected, except Check-in follows its accepted next-priority behavior after the refreshed board.
- Do not add frontend permission truth. Visibility uses refreshed server-owned /auth/me capabilities; API authorization remains authoritative. On 403/capability loss, retain context, refresh capability state and fail closed.
- Errors are inline and announced. Validation focuses the first invalid field. Focus enters the task, stays within modal tasks, and returns to the opener or Case heading when the opener is no longer rendered. Task body scrolls independently; primary actions remain reachable with reduced height, safe areas and a simulated virtual keyboard viewport.

## Authoritative mutation, retries and conflicts

- New Reservation uses existing POST /reservation-creation-operations, GET /reservation-creation-operations and GET /reservation-creation-operations/:token; no cross-D1 atomicity is claimed. Bind exact request payload to its operation token. Keep token + payload unchanged through uncertain transport outcome; query the same operation before allowing payload edits. A changed payload is a new operation token. On known saved-guest/availability conflict, offer the truthful saved-guest recovery path with a new token and never imply the prior operation was erased.
- Guest search filters the capability-authorized existing guest read model. Guest creation is available only when both guests.write and bookings.write are present. Date-range availability comes from GET /rooms/available; display the returned rate and dates at review. It is an availability snapshot, not a reservation guarantee. Final price/status comes from the authoritative create response and refreshed Booking/Stay Case.
- Edit uses only PATCH /bookings/:id and existing availability rules. Preserve unsaved values on 409; refresh server facts and require deliberate review/resubmission. Do not introduce generic CRUD or status editing.
- Check-in uses only POST /bookings/:id/check-in. UI readiness is advisory; backend readiness/version guards decide. On 409 refresh and keep the task open for recovery. On ambiguous response, refresh booking/board and do not blindly repeat a lifecycle command.
- Reassignment obtains a fresh existing quote for the exact destination and submits its quote_token. Freeze the reviewed quote while confirming. On 409 discard that quote, refresh current booking/room/maintenance/account facts and require a fresh quote; never resubmit a stale token or reprice consumed nights.
- Checkout uses only POST /bookings/:id/check-out. The operator selection is not proof of settlement. Preserve server account/ledger guard, capability-gated pending-approved branch and reference validation. On 409 or uncertain response, refresh booking/account and show current authoritative state; do not claim success or automatically resubmit.
- Do not change any API/schema/migration/capability/lifecycle/domain contract. If correctness requires such a change, record ROADMAP_BLOCKER and stop that subproblem.

## Frozen surfaces and inventories

Exact current UI/backend/API/capability inventory as of the base is frozen in:
.orchestration/evidence/HMS-BLOCK-C-RECEPTION-WORKFLOWS-001-INVENTORY.md

Requirement → expected surface → acceptance → evidence matrix:
.orchestration/evidence/HMS-BLOCK-C-RECEPTION-WORKFLOWS-001-EVIDENCE-MATRIX.md

All-registry invariant classification and acceptance mapping:
.orchestration/evidence/HMS-BLOCK-C-RECEPTION-WORKFLOWS-001-INVARIANTS.md

## Validation and acceptance

Every required behavior must have executable assertions; screenshots are diagnostic only.

- Unit/component tests cover progressive form state, review, reset/isolation by booking, operation identity, dirty discard, capability changes, errors, focus and back navigation.
- Existing relevant executing-D1 contracts remain unchanged and are run for creation recovery, edit/inventory where available, check-in, remaining-night reassignment/segmented pricing and checkout/account settlement. Add D1 tests only if a current-contract regression is found; do not create backend semantics.
- TypeScript, full npm check, production web build, architecture fitness, i18n gates, D1 query plans as relevant, active bundle checker, Wrangler dry-runs and git diff checks pass.
- A real local Wrangler Worker + clean migrated synthetic D1 + Vite + browser run proves each implemented workflow and final D1/API state. Mocks are supplemental and labeled. Runner verifies its own processes terminate before PASS.
- WIDE: 1280×900 plus 1280×600. COMPACT: 900×700 and 768×1024. NARROW: 390×844 and 320×700. Also 844×390 landscape and reduced-height / simulated visual viewport for keyboard reachability.
- For each task, assert entry from the correct origin, correct case identity, direct deep link/reload, query/hash/lane/search/filter/scroll preservation, app Back and browser Back/Forward, dirty cancel/discard, success and conflict/uncertain recovery, accessible validation/announcements, focus entry/return, no horizontal overflow, and reachable primary CTA.
- Domain assertions include F0.8 same-token replay/payload binding and truthful recovery; edit eligibility/availability; readiness BLOCKING vs NON_BLOCKING; reassignment interval and segmented quote/history preservation; checkout exact settlement and room Occupancy→VACANT / Housekeeping→DIRTY with Maintenance and Service unchanged; capability denial and no false success.
- Re-run Block B Queue/Case critical-path, filters/search, context, capabilities and responsive regressions without changing their semantics.
- Bundle baseline from Block B: JS raw 306,733 B / gzip 88,540 B; CSS raw 52,127 B / gzip 9,664 B. Ceilings remain JS 330,000/100,000 and CSS 55,000/15,000 B. Report baseline → result → delta bytes → delta percent for JS, CSS, aggregate raw/gzip and entry/initial payload. If any ceiling is exceeded, stop at BUNDLE_BUDGET_GATE_REQUIRED; do not raise it.

## Requirement → surface → acceptance → evidence

| Requirement | Expected surface | Acceptance | Required evidence |
|---|---|---|---|
| New Reservation progressive guest/date/availability/room/rate/notes/review/create | Reception task UI; existing guests, room-availability and reservation-operation APIs | No permanent inline form; server capability gates guest creation; displayed availability/rate is not represented as a guarantee; authoritative create result opens the created Case | Unit/component + local Worker/D1 browser; exact booking/claim/segment/operation rows; create success, duplicate-safe replay, availability conflict and recovery |
| F0.8 uncertain/incomplete operation recovery | Existing reservation operation token/read/list and task recovery affordance | Same exact payload reuses the token; changed payload gets a new token after truthful resolution; saved guest/operation state remains visible; no duplicate booking | Existing executing-D1 recovery suite plus integrated operation recovery and exact D1 assertions |
| Edit Reservation | Selected Case task; PATCH /bookings/:id; existing availability endpoint | CONFIRMED-only fields and availability semantics; preserve identity/draft; no optimistic update; authoritative refresh on success/409 | Component/API + local Worker/D1 edit, stale availability, capability denial and refreshed Case |
| Check-in | Existing CheckInTask Dialog/Drawer; existing lifecycle API | Checklist and READY_FOR_ARRIVAL semantics preserved; BLOCKING blocks, NON_BLOCKING remains advisory; conflict and next-case behavior authoritative | Existing executing-D1 check-in + integrated Worker/D1 WIDE/COMPACT/NARROW task flow; exact room/booking/event |
| Reassignment | Case task; existing quote/command/readiness/availability/account APIs | Only CHECKED_IN; exact [effective_date, checkout) and quote token; segmented remaining-only pricing and consumed history preserved; stale quote requires refresh/requote | Executing-D1 reassignment suite + integrated Worker/D1 task success/conflict; exact claim/segment/pricing/event assertions |
| Checkout | Case task; existing checkout/account/lifecycle APIs | Current server ledger decides settled; pending-approved requires existing capability/reference; exact atomic room/inventory/HK handoff; no maintenance/service rewrite | Executing-D1 settlement/race suite + integrated Worker/D1 success/denial/conflict/response-loss and exact account/room/claim/event assertions |
| Context/capabilities/responsive/accessibility | Reception router, App Shell, server-owned /auth/me, current workspace and task surfaces | Correct task/case URL state; Queue→Case→Task Back order; filters/query/hash/scroll/focus retained; capability revocation fails closed; responsive operation executable | Browser assertions at every contracted viewport plus Block B regression logs; keyboard, focus, virtual viewport, direct links/reload and browser history |
| Extension / No-show / Late Arrival | No new surface in this Block | DEFERRED_CAPABILITY_OR_CONTRACT_NOT_PRESENT; no fabricated action/capability/domain semantics | Inventory states missing exact API/capability/lifecycle contract |

## Non-goals and stop conditions

No backend/schema changes, product-policy change, generic CRUD, fabricated quote/settlement, unrelated module redesign, Block D–H, real data or promotion. Stop for ROADMAP_BLOCKER, BUNDLE_BUDGET_GATE_REQUIRED, material architecture/policy need, unsupported domain contract, real data, promotion, or completed Controller checkpoint only.

## Artifact and review

After all implementation, regression, adversarial QA and evidence pass, freeze substantive Artifact A. Then permit evidence/orchestration-only changes until Boundary B records exact A and blocks continuation. Obtain a separate fresh read-only Independent Critic on exact A+B. Do not self-declare PASS. Ordinary technical findings are repaired within Block C; a material policy/architecture issue is classified and stopped per the conditions above.
