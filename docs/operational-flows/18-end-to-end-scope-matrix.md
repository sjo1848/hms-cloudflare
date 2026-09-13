# 18 — End-to-end implementation scope matrix

Status: `BINDING SCOPE CONTRACT / IMPLEMENTATION LOCKED`

This file is the implementation/acceptance checklist. Every row requires tenant-scoped backend authorization, stale/concurrency guards, atomic truth, success audit only when the mutation wins, authoritative reload and responsive browser proof where UI exists. Canonical companions: `16-target-transition-matrix.md`, `19-api-command-contract-map.md`, `05-maintenance-data-rbac.md`, `.orchestration/OPERATIONAL-INVARIANTS.md` and `20-intentional-target-departures.md`.

| ID | Flow | Binding E2E result / acceptance boundary |
|---|---|---|
| E2E-00 | Foundations | Raw generated JS `<=300000` without raising the 320000 budget; persisted hotel IANA timezone; server `hotel_local_date`; incremental migrations; existing tenant/RBAC/audit gates green. |
| E2E-01 | Existing-guest reservation | Search/select guest -> dates -> authoritative availability -> room -> `POST /bookings`; booking+inventory atomic; room physical state unchanged; overlap/hold/blocking-maintenance/stale conflict leaves no drift. |
| E2E-02 | Inline new guest + reservation | `POST /bookings/with-guest`; requires `guests.write` + `bookings.write`; guest+booking one atomic intent; duplicate/validation/lost-room failure leaves no unintended guest. |
| E2E-03 | Check-in | `CONFIRMED` + accepted checklist + immediate readiness -> explicit check-in -> booking `CHECKED_IN`, room `OCCUPIED`; no new calendar cutoff; stale readiness rejects atomically. |
| E2E-04 | Cancellation | Existing booking PATCH; `terminal_reason` min 6; only while `CONFIRMED`; no arrival-date cutoff; release inventory, room unchanged, actor/time/reason audited; no automatic money disposition. |
| E2E-05 | No-show | Explicit command; `CONFIRMED`, never occupied, `hotel_local_date >= check_in`, reason min 6; inventory released, room unchanged; future arrival/stale concurrent check-in rejected. |
| E2E-06 | Late arrival | Existing `PATCH /bookings/:id` with `front_desk.late_arrival_eta` + `late_arrival_note`; `bookings.write`; booking stays `CONFIRMED`; ETA future and hotel-local ETA date inside `[check_in,check_out)`; note min 6/max 250; persist ETA/note/actor/time/audit; no room/inventory/Billing change; re-record allowed under same guards. |
| E2E-07 | In-stay reassignment | `CHECKED_IN`, non-overrun, destination ready/free for remaining interval, reason min 6; move only `[effective_date,check_out)`; destination OCCUPIED; old room DIRTY or MAINTENANCE; preserve history; destination-current-price repricing + invoice reconciliation atomic. |
| E2E-08 | NON_BLOCKING maintenance | May open on `OCCUPIED`, `AVAILABLE`, `DIRTY`, `CLEANING`; physical state unchanged; no independent sale/readiness blocker; Reception can read/report/escalate but not resolve; resolve leaves physical state unchanged where non-blocking. |
| E2E-09 | BLOCKING occupied maintenance | Occupied room remains OCCUPIED but sale/readiness blocked; no automatic move; explicit reassign/checkout; if case open on vacancy -> MAINTENANCE; resolve -> DIRTY -> cleaning; future reservations become attention cases, not auto-cancelled. |
| E2E-10 | Vacant BLOCKING maintenance | Opening on AVAILABLE/DIRTY/CLEANING -> MAINTENANCE; resolve -> DIRTY; one open case/room; explicit escalation evidence. |
| E2E-11 | Housekeeping turnover | DIRTY -> CLEANING -> AVAILABLE under `housekeeping.write`; finish rejects when blocking condition makes AVAILABLE false; checkout/reassign handoff appears without manual duplicate task. |
| E2E-12 | Checkout + Billing | `CHECKED_IN`; authoritative balance/checklist; `settled` only fully paid; positive balance uses admin-only override + reference; booking CHECKED_OUT; room DIRTY or MAINTENANCE; invoice/audit atomic; embedded Billing uses Reception booking. |
| E2E-13 | Stay extension | Explicit command; later checkout; all added nights free; claim added interval atomically; source repricing + invoice reconciliation; booking remains CHECKED_IN/room OCCUPIED; stale/inventory/Billing conflict rolls back all. |
| E2E-14 | Extra charge after payment | Any total increase reconciles existing invoice atomically; immutable payment entries; formerly PAID invoice cannot stay paid if coverage is insufficient. |
| E2E-15 | Front-desk board | `GET /front-desk/board` requires `bookings.read`: admin/ops/receptionist allowed; housekeeping/saas_admin denied. Board owns queue priority, classifications, readiness/blockers, late-arrival context, maintenance impact, room context and recommended action; read-only. |
| E2E-16 | Context + freshness | Stable ID query context only; refresh after mutation, focus regain, contextual entry and modest visible polling; backend revalidates every write; conflicts explain+refresh. |
| E2E-17 | Post-action continuation | Preserve current search/filter, reload authoritative board, completed case moves naturally, select next case by same deterministic priority; empty queue does not change filters. |
| E2E-18 | Audit/evidence | Check-in, cancellation, no-show, late arrival, reassignment, checkout, extension and maintenance open/escalate/resolve record actor/hotel/request + material command details iff mutation wins. |
| E2E-19 | Synthetic shift | Exercise every flow above plus negative evidence, stale/concurrent conflicts, role 403s, non-blocking vacant states, admin override, late-arrival re-record/past/out-of-stay invalid cases, legacy `/dirty` compatibility and desktop/mobile operator journey. |
| E2E-20 | Contract conformance | Runtime, tests, OpenAPI/client and browser use canonical routes/capabilities/payloads; truthful 400/403/404/409; no shadow endpoints/direct status shortcuts/unregistered source departures. |

## Explicit negative tests that cannot be omitted

- Late arrival: past ETA, ETA outside stay, short note, non-CONFIRMED booking.
- Front-desk board: housekeeping and saas_admin receive 403; tenant isolation holds.
- NON_BLOCKING maintenance: opening on AVAILABLE, DIRTY and CLEANING keeps each physical state unchanged; on AVAILABLE it remains sellable subject to ordinary inventory/holds.
- Reassignment: short reason, blocking destination, remaining-night conflict, stale booking-room relation, overrun stay.
- Checkout: non-admin `pending-approved`, false `settled`, stale room/Billing.
- Extension: added-night conflict and concurrent invoice/payment change.

## Out of scope

No automatic refund/penalty/retention; no frozen contracted-rate model; no split stay/automatic relocation; no multiple simultaneous maintenance cases; no new OUT_OF_ORDER design; no paid realtime/WebSocket dependency; no new check-in/cancellation/no-show cutoff; no production/cutover/real-data migration; no unrelated Reports/Users/Network redesign.

## Completion rule

The wave is complete only when every E2E row has a bounded Task Contract, implementation, automated/domain/API proof, cross-module consequence proof and required browser evidence with no contradiction against the canonical companion documents.