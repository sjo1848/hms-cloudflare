# HMS-BLOCK-B-RECEPTION-BOOKING-STAY-001 — Invariant Evidence

Artifact candidate: immutable source commit to be created from this validated tree; exact A SHA will be recorded by orchestration-only Boundary B.
Task Contract: `.orchestration/contracts/HMS-BLOCK-B-RECEPTION-BOOKING-STAY-001.md`
Pre-Critic gate: `.orchestration/PRECRITIC-GATE.md`
Registry: `.orchestration/INVARIANTS.md`

The Task Contract prose says “all 25” registry invariants; its classification table contains 24 IDs and the current binding registry also contains those same 24 IDs. Every current registry ID is mapped below; this is a count typo, with no omitted invariant identity.

| Invariant | Applies? | Status | Concrete evidence | Notes |
|---|---|---|---|---|
| INV-ATOMIC-001 | N/A | N/A | Scope audit: no business write, command contract, D1 mutation, or transactional write was added/changed. `scripts/cf-f0-11-reception-integrated.playwright.js` and `scripts/cf-wave12-reassignment-integrated.playwright.js` exercise unchanged check-in/reassignment paths. | Reassignment success-notice ordering is presentation state after the existing command and authoritative refresh; it does not change the command. |
| INV-AUDIT-001 | N/A | N/A | `git diff --name-status`: no API or audit/event source/schema change; `npm run test:cf-i03`, `npm run test:cf-i05`, `npm run test:cf-i06` PASS. | No new event or business operation. |
| INV-DOMAIN-001 | APPLIES | PASS | `apps/api/src/routes/front-desk-board.executing-d1.test.ts` (2/2 in `npm run check`); `output/playwright/f0-11-reception-integrated-mobile.log`; `output/playwright/cf-wave12-reassignment-integrated.log`. | Rows/actions use existing board fields and existing lifecycle commands. |
| INV-TENANT-001 | APPLIES | PASS | Local Worker + isolated synthetic D1 browser runners; `output/playwright/cf-block-b-reception-local.log`; CF-I03/04 regression log; same hotel/subject headers asserted in Block B runners. | No API tenant routing changes; no real data. |
| INV-RBAC-001 | APPLIES | PASS | `output/playwright/cf-block-b-capability-refresh.log`, `cf-block-b-billing-allow.log`, `cf-block-b-billing-denied.log`; denied same-subject backend Billing read is HTTP 403; existing `/auth/me` remains sole UI capability source. | UI denial and API denial are separately asserted. |
| INV-PARITY-001 | APPLIES | PASS | Frozen roadmap rows in Task Contract; `output/playwright/cf-block-b-reception-workspace.log` proves same board rows/commands and partial reads; `npm run test:cf-i03`; F0.11 check-in integrated Worker/D1. | No backend shape/lifecycle change. |
| INV-ENUM-001 | APPLIES | PASS | `ReceptionPage.tsx` maps canonical readiness `READY_FOR_ARRIVAL` / `NOT_READY` / `UNKNOWN`; core workspace runner asserts unknown readiness uses a neutral class and is not labeled blocked; serialized `Available`/`Maintenance` board fixture exercised in Worker/D1. | No enum/predicate change. |
| INV-UX-001 | APPLIES | PASS | `output/playwright/block-b-queue-before-aux-settle.png`; `cf-block-b-reception-workspace.log`; Billing allow/deny logs. | Queue/Case workspace, separate Billing compatibility path, distinct State/Attention/Impact, and contextual selection asserted. |
| INV-ORDER-001 | APPLIES | PASS | `cf-block-b-reception-workspace.log` uses `z-priority`, `a-next`, `m-blocked` plus B00…B11; expected order is asserted independently, conflicting with lexical ID order; stale older board result is ignored. | Source queue rank is unchanged. |
| INV-RESP-001 | APPLIES | PASS | `cf-block-b-reception-workspace.log` Queue and Case matrices at WIDE 1280×600/900, COMPACT 900×700/768×1024, NARROW 390×844/320×700, landscape 844×390; filter clicks/height, search, task action reachability, no overflow/occlusion, Back/focus/scroll all asserted. | Landscape filters retain 30 px controls and a 33 px scrolling list area above mobile nav. |
| INV-EVID-001 | APPLIES | PASS | Claim-to-source audit in the final Pre-Critic and this file; current Block B DevTools summary and timeline in `HMS-BLOCK-B-RECEPTION-BOOKING-STAY-001-RUNTIME.md`; screenshot and runner log are durable. | LCP and queue-ready are not misrepresented as the same event; raw trace export limitation is explicit. |
| INV-LEGACY-001 | N/A | N/A | No legacy/backfill/recovery data write or synthetic product record creation was added. | The test-only D1 fixture does not create product legacy recovery data. |
| INV-MONEY-001 | N/A | N/A | No financial calculation/write code changed; `npm run test:cf-i06`, `npm run test:cf-i06-browser`, and `npm run check` PASS. | Existing Billing API/flows are regression-only. |
| INV-STATE-001 | APPLIES | PASS | Two-step local publication plan: this substantive Artifact A is followed by orchestration-only Boundary B, which records exact A SHA, sets `external_review.required=true` and `resume_authorized=false`; no commit records its own SHA. | Boundary B will be the exact critic handoff and changes no product files. |
| INV-CF-I07-001 | N/A | N/A | No protected admin/audit/network handler or capability authority changed; `npm run test:cf-i07` and `npm run test:cf-i07-browser` PASS as inherited regressions. | Block B tests use current server-owned capability payload. |
| INV-CF-I07-002 | N/A | N/A | No admin role/plan mutation implementation changed; inherited API runner passes after its fixture now seeds an explicit synthetic lifecycle audit row. | Test fixture only. |
| INV-CF-I07-003 | N/A | N/A | No role downgrade mutation behavior changed; stale frontend capability refresh is separately exercised same-subject by `cf-block-b-capability-refresh.log`. | Scope does not claim a new admin downgrade API proof. |
| INV-CF-I07-004 | APPLIES | PASS | `scripts/cf-block-b-reception-local.sh`, `scripts/cf-f0-11-reception-local.sh`, `scripts/cf-wave12-reassignment-integrated.sh`, `scripts/cf-i05-browser-regression.sh`, `scripts/cf-i06-browser-regression.sh`, and `scripts/cf-i07-browser-regression.sh` verify owned process cleanup before successful exit; corresponding logs are in `output/playwright/`. | All executed serially; no owned process remains. |
| INV-CF-I08-001 | N/A | N/A | No analytics/reporting arithmetic code changed. | — |
| INV-CF-I08-002 | N/A | N/A | No network analytics or multi-hotel aggregation code changed. | — |
| INV-CF-I08-003 | N/A | N/A | No reporting date/state predicate changed. | — |
| INV-CF-I08-004 | N/A | N/A | No report state enum or reporting predicate changed. | — |
| INV-CF-I08-005 | N/A | N/A | No report date default or cross-surface analytics clock behavior changed. | — |
| INV-SCOPE-001 | APPLIES | PASS | `git diff --name-status` and `git diff --stat`; no API source, schema/migration, API contract, capability, lifecycle, finance, Rooms/HK/Maintenance product implementation, C–H workflow, or real-data mutation change. | Block B remains Reception presentation/read orchestration only; C–H have not started. |

## Mandatory mutation inventory

| Operation | Authoritative conditional mutation | Zero-row behavior | Audit/event behavior | Deterministic regression |
|---|---|---|---|---|
| None added or changed | N/A | N/A | N/A | Existing check-in/reassignment/Billing regressions listed above. |

## Evidence claim audit

| Claim | Evidence | Classification |
|---|---|---|
| Queue paints while all three ancillary reads are pending | `output/playwright/block-b-queue-before-aux-settle.png`, timestamp assertion + request-end unset assertions in `cf-block-b-reception-workspace.playwright.js`, result in `cf-block-b-reception-workspace.log` | Integrated Worker + D1 + browser |
| Final-build FCP/LCP/Queue mark and request intervals | `.orchestration/evidence/HMS-BLOCK-B-RECEPTION-BOOKING-STAY-001-RUNTIME.md` (Chrome DevTools MCP trace/evaluate summary; no raw file claim) | Browser performance trace + Resource Timing |
| Partial errors/retries/context continuity | `output/playwright/cf-block-b-reception-partial.log` | Integrated browser + Worker |
| Stale response cannot overwrite fresh Queue | `output/playwright/cf-block-b-reception-workspace.log` (`oldResultIgnored:true`) | Integrated browser |
| Same-subject capability refresh and Billing API denial | capability refresh and Billing allow/deny logs | Integrated browser + API |
| Check-in and reassignment existing commands still function | F0.11 mobile Worker/D1 log; wave12 integrated reassignment log; CF-I03/04 regression log | Integrated browser + Worker/D1; API/D1 |
| Raw/gzip growth within authorized ceilings | final build log + architecture fitness/budget log | Production Vite build + active checker |

## Publication decision

- [x] All current registry IDs are classified; no applicable invariant is FAIL or UNPROVEN.
- [x] Task Contract validation and inherited regressions are recorded.
- [x] Scope audit excludes Blocks C–H and backend/workflow expansion.
- [x] Artifact A + orchestration-only Boundary B publication sequence is non-circular.
- [ ] Independent Critic PASS is not self-declared; exact Artifact A + Boundary B review remains the next blocking handoff.
