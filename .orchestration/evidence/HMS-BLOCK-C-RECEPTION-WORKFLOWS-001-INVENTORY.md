# Block C frozen implementation inventory

Inventory date: 2026-09-30
Exact source base: fc2daa783b8ef361e39e6945dbdfe2bfe6345b98
Worktree: /home/sjo1848/dev/hms-elite-cloudflare/hms-block-c-reception-workflows
Method: source/contract inspection and five separate read-only reviewer inspections; no product changes or tests.

## Existing Reception UI surfaces

| Workflow | Exact current UI | Current behavior and gap at base |
|---|---|---|
| New Reservation | apps/web/src/features/reception/ReceptionPage.tsx:234-263; state/API in useReceptionWorkspace.ts:41-50, 82, 112-123, 350-409; API adapter reception-api.ts:13-29, 59-66 | Header toggles a long inline form above Queue. Selects full guest list or toggles guest creation; dates, available rooms, notes and submit share one form; recoverable operations are nested in the form. No focused progressive review task. |
| Edit Reservation | ReceptionPage.tsx:336-348; useReceptionWorkspace.ts:210-226, 511-521; reception-api.ts:68-74 | Confirmed booking edits appear inline in Case; arrivals hide them behind More Actions. Guest/room/dates/notes and Cancel/Close coexist. Save closes Case before refresh. No isolated review/conflict-preserving task. |
| Check-in | ReceptionPage.tsx:121-165, 180-226, 336, 350; CheckInTask.tsx:28-125; CSS reception-queue.css:52-65, 92-96, 142-145; UI precedent UX-UI-RECEPTION-CHECKIN-001 | Existing four-stage task; query supports task=check-in and booking_id. Native centered dialog/full-height mobile drawer, dirty discard, keyboard focus and next-priority selection exist. Preserve, integrate, and extend evidence rather than redesigning semantics. |
| Reassignment | ReceptionPage.tsx:352-379; useReceptionWorkspace.ts:299-345, 468-501; reception-api.ts:88-94; reception-queue.css:100-117, 161-170 | Full operation remains inline in selected checked-in Case. Loads date/availability/readiness/maintenance/quote; displays remaining-stay prices and reason; uses quote epoch. Success closes Case before queue refresh; 409 refreshes/requotes but stays inline. No focused-task route. |
| Checkout | ReceptionPage.tsx:380-386; useReceptionWorkspace.ts:411-425, 504-509; reception-api.ts:96-106 | Inline beside reassignment. Policy select, reference and charge/release/HK confirmations. Generic lifecycle wrapper closes Case before queue refresh; no focused task/account conflict details. |

## Exact backend, API and capability inventory

Capabilities are server-owned through apps/api/src/auth/capabilities.ts:1-18 and /api/v1/auth/me (apps/api/src/index.ts:127-149). Current role sets include bookings.read/write, guests.read/write, rooms.read/search, lifecycle.write, bookings.update and bookings.checkout.override for selected roles. Do not create a frontend capability map. Actual routes below enforce:

| Operation | Existing API and capability | Existing authoritative semantics/source |
|---|---|---|
| Queue/Case | GET /front-desk/board; GET /bookings/:id requires bookings.read | Tenant-selected operational D1; Block B Queue/Case. |
| Guest read/search | GET /guests requires guests.read | Existing guest list; UI may filter it locally. |
| Guest creation | POST /guests requires guests.write | Unique email collision is 409; do not silently merge. |
| Room availability | GET /rooms/available requires rooms.search | Date interval, holds and claims; returned room rate is a snapshot. |
| Simple booking create | POST /bookings requires bookings.write | Existing guest only; validates dates, room and availability. Block C uses staged operation instead. |
| Staged create/recovery | POST /reservation-creation-operations; GET list and /:token require existing guest/booking capabilities as implemented | F0.8 operation_token binds exact payload. Existing/new guest distinction, truthful GUEST_CREATED or EXISTING_GUEST_SELECTED stage, duplicate-safe booking replay, room availability revalidation and operation recovery; no cross-store transaction claim. apps/api/src/routes/bookings.ts:125-272; modules/bookings/d1-reservation-creation-repository.ts. |
| Edit/cancel | PATCH /bookings/:id requires bookings.write | Only CONFIRMED may edit/cancel; room/date/guest constraints and availability revalidated; pricing and inventory claims updated atomically. Block C changes edit UI only; cancellation remains a separate existing action. apps/api/src/routes/bookings.ts:283-333; modules/bookings/d1-booking-repository.ts. |
| Check-in | POST /bookings/:id/check-in requires bookings.write via lifecycle guard | Confirmations + positive guest count; CONFIRMED only; READY_FOR_ARRIVAL and exact room-state/version checks; booking/room/event mutation atomic. BLOCKING maintenance blocks; NON_BLOCKING is not a blocker. apps/api/src/routes/lifecycle.ts:23-52; modules/lifecycle/d1-lifecycle-repository.ts:38-53. |
| Reassignment quote/mutation | POST /bookings/:id/reassignment-quote and /reassign require bookings.write | CHECKED_IN only; authoritative effective date and remaining interval; exact quote token, availability/holds/readiness/maintenance and pricing snapshots; atomically update only remaining room-night claims/segments and event. apps/api/src/routes/lifecycle.ts:54-121; D1 lifecycle/pricing repositories. |
| Checkout | POST /bookings/:id/check-out requires bookings.write; pending-approved also requires bookings.checkout.override plus valid reference | CHECKED_IN only; server invoice/payment ledger settlement; required confirmations; atomic checkout, claim release, Occupancy→VACANT, Housekeeping→DIRTY; Maintenance and Service unchanged. apps/api/src/routes/lifecycle.ts:124-161; D1 lifecycle repository and F0.7 settlement contract. |

## Workflow contract availability

| Workflow | Backend contract / capability / lifecycle evidence | Block C disposition |
|---|---|---|
| Extension | No current extension route, capability or lifecycle contract found. | DEFERRED_CAPABILITY_OR_CONTRACT_NOT_PRESENT |
| Late Arrival | No current ETA/note fields, command route, capability or lifecycle contract found. | DEFERRED_CAPABILITY_OR_CONTRACT_NOT_PRESENT |
| No-show | NO_SHOW may appear in serialization/report predicates, but no current command route, reason/eligibility contract or capability was found. | DEFERRED_CAPABILITY_OR_CONTRACT_NOT_PRESENT |

Source references: docs/implementation-roadmap/HMS-BLOCK-CONTRACTS-A-H-V1.md (C); HMS-IMPLEMENTATION-ROADMAP-MASTER-V1.md; HMS-BLUEPRINT-BLOCK-TRACEABILITY-V1.md; UX-UI-RECEPTION-CHECKIN-001.md; P0.1-RECEPTION-ARRIVAL-CHECKIN.md; HMS-F0-08, F0-04, F0-05 and F0-07 contracts; docs/ux-operational-workflow-roadmap-001.md. The latter is historical AS-IS evidence and its old proposed /bookings/with-guest flow is superseded by the implemented approved F0.8 staged operation.

## Reviewer provenance (all read-only, no tests or edits)

- Lifecycle/domain: /root/block_c_lifecycle_domain. Confirmed current command/capability semantics and deferred unsupported flows; no ROADMAP_BLOCKER.
- UX/interaction: /root/block_c_ux_interaction. Identified inline task surfaces, task URL/current Check-in precedent, stale refresh ordering risks and task-specific return/focus requirements.
- Concurrency/idempotency: /root/block_c_concurrency_idempotency. Confirmed operation-token, authoritative refresh, quote-token and exact mutation constraints; no backend change needed for contract-preserving UI.
- Responsive/accessibility: /root/block_c_responsive_accessibility. Defined WIDE/COMPACT/NARROW/reduced-height/landscape, focus, scroll, safe-area and CTA assertions; reuse current semantic components.
- QA/evidence: /root/block_c_qa_evidence. Mapped reusable D1/Worker/browser runners and gaps; mocks/screenshots alone are insufficient.

## Exact implementation boundary

Expected product change is limited to Reception task navigation/interaction, its API client/hook only where needed to call existing endpoints and refresh context, Reception styles/i18n and tests/runners/evidence. Backend/API/schema/capability files are read-only unless a strictly necessary defect is found in an already approved contract; such a discovery is a ROADMAP_BLOCKER pending classification, not permission to invent a new contract.
