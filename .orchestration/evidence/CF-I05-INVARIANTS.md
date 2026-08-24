# CF-I05 — Invariant Evidence

Artifact candidate: `PENDING_IMMUTABLE_HEAD`
Task Contract: `.orchestration/contracts/CF-I05.md`  
Pre-Critic gate: `.orchestration/PRECRITIC-GATE.md`

All registry invariants are classified below. `UNPROVEN` is not used; every applicable invariant has executable evidence or a precise scope rationale.

| Invariant | Applies? | Status | Concrete evidence | Notes |
|---|---|---|---|---|
| INV-ATOMIC-001 | APPLIES | PASS | `npm run test:cf-i05`; concurrent start/finish/resolve each assert sorted `200,409`, plus deterministic `case-h1` stale attempt after resolved K1/reopened K2 asserts HTTP 409, room MAINTENANCE, K1 RESOLVED, K2 OPEN and zero resolve events; SQL trigger rollback assertion | exact case update gates room transition with `changes()=1` and rejects newer OPEN case |
| INV-AUDIT-001 | APPLIES | PASS | `scripts/cf-i05-regression.sh`; exact event counts for races and successful operations; actor/hotel/request assertions | stale/rejected operations produce no second event |
| INV-DOMAIN-001 | APPLIES | PASS | route-only transition endpoints; `apps/api/src/routes/inventory.ts` status map has no status PATCH path; invalid SQL transition rejected by trigger | housekeeping state changes use explicit domain routes |
| INV-TENANT-001 | APPLIES | PASS | API middleware resolves membership before operational D1; regression sends hotel/subject headers and receptionist denial; room/case FKs are operational-D1 local | no client-selected database binding |
| INV-RBAC-001 | APPLIES | PASS | `npm run test:cf-i05` asserts receptionist GET and POST `403`; route capability map denies unknown roles | backend enforcement is independent of UI |
| INV-PARITY-001 | APPLIES | PASS | `docs/cf-i05-housekeeping-maintenance-parity.md`; source queue algorithm mapping; D1/API positive and negative tests; browser fixture with HIGH maintenance room 904 ahead of numeric room 901 and orphan departure room 906 | source operational ranking and synthetic departure ownership/context are retained |
| INV-ORDER-001 | APPLIES | PASS | `buildHousekeepingQueue` ports maintenance priority, turnover, blocked/status ranks and numeric tie-break; browser asserts known source head `Room 904` despite `Room 901` being numerically first, asserts `Siguiente tarea` opens 904, and proves orphan 906 is visible/safe | expected identity is independent of target-first-button derivation |
| INV-UX-001 | APPLIES | PASS | integrated browser script asserts known source-priority `Room 904` opens on `Siguiente tarea`, focus enters its heading at 375px, close restores focus to the originating next-task control, and queue selection opens the focused task | active route preserves focused-task semantics over ranked queue |
| INV-RESP-001 | APPLIES | PASS | `npm run test:cf-i05-browser`; executable journey at 375/390/430 asserts head-task dialog open/close, 375 asserts focus transition/return, 768/1024 assert desktop workspace, all widths assert no overflow | every contracted width exercises the relevant interaction model |
| INV-EVID-001 | APPLIES | PASS | this file and parity doc map source ranking, known 904 priority fixture, 906 orphan API/browser proof, 375 focus proof, mobile open/close, selected-room Clear form isolation, API/D1 and screenshot claims to named executable assertions | no claim depends on target self-consistency |
| INV-LEGACY-001 | APPLIES | PASS | `npm run test:cf-i05` asserts legacy case `reported_by_user_id=subject-a`, resolver, `return_status=DIRTY`; event details include `legacy_recovery` | synthesized case remains tenant-local and owned |
| INV-MONEY-001 | N/A | N/A | CF-I05 contract forbids billing, payment, settlement and cash operations | begins with CF-I06 |
| INV-STATE-001 | APPLIES | PASS | final publication will persist the exact REWORK-4 artifact in `.orchestration/STATE.md` and `.orchestration/STATUS.json`; unrelated `install.sh` remains outside artifact | canonical state is updated together with the immutable publication |
| INV-SCOPE-001 | APPLIES | PASS | diff/scope audit covers only CF-I05 rework, invariant evidence, browser harness and local Vite proxy; no CF-I06 or paid/production work | no Human Gate semantics changed |

## Mandatory mutation inventory

| Operation | Authoritative conditional mutation | Zero-row behavior | Audit/event behavior | Deterministic regression |
|---|---|---|---|---|
| Start cleaning | `UPDATE rooms ... WHERE status='DIRTY'` | event `INSERT ... WHERE changes()=1` is skipped; endpoint verifies event and returns `409` | exactly one `CLEANING_START` on winner | concurrent room-e start race |
| Finish cleaning | `UPDATE rooms ... WHERE status='CLEANING'` | same event-presence check returns `409` | exactly one `CLEANING_FINISH` on winner | concurrent room-b finish race |
| Open maintenance | room update, then case insert gated by prior `changes()` | no case/event; endpoint verifies event and returns `409` | exactly one `MAINTENANCE_OPEN` | duplicate open and invalid state tests |
| Resolve maintenance | exact open-case update, then room update gated by `changes()=1` and `NOT EXISTS OPEN case`, event gated by room `changes()` | stale/zero-row/ABA operation cannot move room or create event; endpoint returns `409`; legacy reporter retained | exactly one `MAINTENANCE_RESOLVE` for exact case | concurrent room-f race, K1→K2 stale case regression and legacy room-d regression |

## Evidence claim audit

| Claim | Evidence | Classification |
|---|---|---|
| stale mutation cannot false-succeed | `scripts/cf-i05-regression.sh` race statuses, final states and event counts | integrated API-D1 |
| queue ranking and focused workspace parity | `scripts/cf-i05-browser-regression.playwright.js`, source parity matrix; known 904-vs-901 priority conflict, `Siguiente tarea` identity, mobile dialog open/close and queue return assertions | integrated browser + source |
| orphan departure parity | same browser harness plus `/housekeeping/board` API assertion; 906 is absent from eligible `rooms`, present in `departures_today`, rendered as blocked and has no cleaning/maintenance mutation | integrated API + browser |
| responsive material controls | same committed browser harness, five widths, mobile focus/close at 375/390/430, desktop workspace at 768/1024, scroll width and queue assertions | browser |
| per-room draft isolation/clear | same browser harness enters room 903 draft, switches to 905, verifies empty, enters room 905 draft, clears only room 905, then returns to 903 and verifies room 903 retained | browser |
| legacy ownership | D1 query in CF-I05 regression | API-D1 |
| no scope/cost drift | contract forbidden-actions review and git diff | static/scope |

## Publication decision

- [x] No applicable invariant is `FAIL` or `UNPROVEN`.
- [x] Full Task Contract validation is executed or queued in the final gate.
- [x] Scope audit passes; CF-I06 remains unauthorized.
- [x] Canonical state will point to the exact published artifact before exit.
- [x] External review is required; Codex does not self-approve substantive PASS.
