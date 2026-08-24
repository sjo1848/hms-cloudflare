# CF-I05 — Invariant Evidence

Artifact candidate: `CF-I05 REWORK-1 immutable artifact; exact HEAD is persisted in canonical STATUS/STATE at publication`  
Task Contract: `.orchestration/contracts/CF-I05.md`  
Pre-Critic gate: `.orchestration/PRECRITIC-GATE.md`

All registry invariants are classified below. `UNPROVEN` is not used; every applicable invariant has executable evidence or a precise scope rationale.

| Invariant | Applies? | Status | Concrete evidence | Notes |
|---|---|---|---|---|
| INV-ATOMIC-001 | APPLIES | PASS | `npm run test:cf-i05`; concurrent start/finish/resolve each assert sorted `200,409`, final state and one event; SQL trigger rollback assertion | zero-row mutations cannot return success or commit an event |
| INV-AUDIT-001 | APPLIES | PASS | `scripts/cf-i05-regression.sh`; exact event counts for races and successful operations; actor/hotel/request assertions | stale/rejected operations produce no second event |
| INV-DOMAIN-001 | APPLIES | PASS | route-only transition endpoints; `apps/api/src/routes/inventory.ts` status map has no status PATCH path; invalid SQL transition rejected by trigger | housekeeping state changes use explicit domain routes |
| INV-TENANT-001 | APPLIES | PASS | API middleware resolves membership before operational D1; regression sends hotel/subject headers and receptionist denial; room/case FKs are operational-D1 local | no client-selected database binding |
| INV-RBAC-001 | APPLIES | PASS | `npm run test:cf-i05` asserts receptionist GET and POST `403`; route capability map denies unknown roles | backend enforcement is independent of UI |
| INV-PARITY-001 | APPLIES | PASS | `docs/cf-i05-housekeeping-maintenance-parity.md`; source state/validation matrix; D1/API positive and negative tests | source reporter ownership is retained on legacy recovery |
| INV-UX-001 | APPLIES | PASS | integrated browser script executes queue → selected room → focused workspace, Next task, lifecycle and maintenance controls | active route no longer uses flat action-card workflow |
| INV-RESP-001 | APPLIES | PASS | `npm run test:cf-i05-browser`; executable journey at 375/390/430/768/1024 asserts queue reachability, controls and no overflow | each width exercises a material control |
| INV-EVID-001 | APPLIES | PASS | this file and parity doc map claims to named scripts, SQL assertions, screenshots and source baseline; integrated claims are labeled real local API/D1 | previous mocked-only claim removed |
| INV-LEGACY-001 | APPLIES | PASS | `npm run test:cf-i05` asserts legacy case `reported_by_user_id=subject-a`, resolver, `return_status=DIRTY`; event details include `legacy_recovery` | synthesized case remains tenant-local and owned |
| INV-MONEY-001 | N/A | N/A | CF-I05 contract forbids billing, payment, settlement and cash operations | begins with CF-I06 |
| INV-STATE-001 | APPLIES | PASS | final publication updates exact immutable HEAD in `.orchestration/STATE.md` and `.orchestration/STATUS.json`, with clean synchronized boundary | this evidence is part of the publication sequence |
| INV-SCOPE-001 | APPLIES | PASS | diff/scope audit covers only CF-I05 rework, invariant evidence, browser harness and local Vite proxy; no CF-I06 or paid/production work | no Human Gate semantics changed |

## Mandatory mutation inventory

| Operation | Authoritative conditional mutation | Zero-row behavior | Audit/event behavior | Deterministic regression |
|---|---|---|---|---|
| Start cleaning | `UPDATE rooms ... WHERE status='DIRTY'` | event `INSERT ... WHERE changes()=1` is skipped; endpoint verifies event and returns `409` | exactly one `CLEANING_START` on winner | concurrent room-e start race |
| Finish cleaning | `UPDATE rooms ... WHERE status='CLEANING'` | same event-presence check returns `409` | exactly one `CLEANING_FINISH` on winner | concurrent room-b finish race |
| Open maintenance | room update, then case insert gated by prior `changes()` | no case/event; endpoint verifies event and returns `409` | exactly one `MAINTENANCE_OPEN` | duplicate open and invalid state tests |
| Resolve maintenance | open-case update, room update, event gated by room `changes()` | no resolve event; endpoint verifies event and returns `409` | exactly one `MAINTENANCE_RESOLVE`; legacy reporter retained | concurrent room-f resolve race and legacy room-d regression |

## Evidence claim audit

| Claim | Evidence | Classification |
|---|---|---|
| stale mutation cannot false-succeed | `scripts/cf-i05-regression.sh` race statuses, final states and event counts | integrated API-D1 |
| queue/focused workspace parity | `scripts/cf-i05-browser-regression.playwright.js`, source parity matrix | integrated browser + source |
| responsive material controls | same committed browser harness, five widths, scroll width and queue assertions | browser |
| legacy ownership | D1 query in CF-I05 regression | API-D1 |
| no scope/cost drift | contract forbidden-actions review and git diff | static/scope |

## Publication decision

- [x] No applicable invariant is `FAIL` or `UNPROVEN`.
- [x] Full Task Contract validation is executed or queued in the final gate.
- [x] Scope audit passes; CF-I06 remains unauthorized.
- [x] Canonical state will point to the exact published artifact before exit.
- [x] External review is required; Codex does not self-approve substantive PASS.
