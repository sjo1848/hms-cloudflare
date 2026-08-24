# HMS Cloudflare — Orchestration State

## CURRENT AUTHORITATIVE STATE

Project: HMS Cloudflare  
Updated: 2026-08-23  
Global Project Mode: `DELIVERY`  
Phase: `BUILD`  
Phase Status: `CF-I01 PASS / CF-I02 PASS / CF-I03 PASS+INTEGRATED / CF-I04 PASS / CF-I05 REWORK-1 AUTHORIZED`

Current objective: migrate the accepted HMS product to Cloudflare while preserving observable product behavior, domain semantics and material safety guarantees. Migration is parity-first; no product-feature expansion or silent UX redesign is authorized.

## CANONICAL SOURCES

- Source repository: `sjo1848/hotel-management-system`
- Source baseline: `main@4df56a6217caab611f2f5fcbd98bde8386bb5629`
- Target repository: `sjo1848/hms-cloudflare`
- Portable Design Package: `docs/migration-design-package.md`
- Source parity artifact: `docs/source-contract-inventory.md`
- Data topology decision: `.orchestration/decisions/CF-DATA-001.md`
- Autonomous execution decision: `.orchestration/decisions/PM-AUTONOMY-001.md`
- UX parity decision: `.orchestration/decisions/CF-UX-PARITY-001.md`
- Active Task Contract: `.orchestration/contracts/CF-I05.md`
- Current Critic record: `.orchestration/reviews/CF-I05-CRITIC.md`

Conversation history is supporting context only and is never the sole source of truth.

## ACTIVE DECISIONS

### CF-ARCH-001 — APPROVED
- Cloudflare Access authentication boundary.
- React + Vite frontend.
- Workers + Hono + TypeScript API.
- D1 persistence.
- Same-origin `/api/v1` compatibility where product contract is unchanged.
- Source HMS remains read-only.
- Parity before feature expansion.

### CF-DATA-001 — APPROVED OPTION B
- CONTROL_DB for identity/hotel/membership/routing metadata.
- one operational D1 per hotel.
- critical atomic workflows remain within one hotel D1.
- target `$0/month / Cloudflare Free`.
- paid/material recurring-cost transition requires Human Gate.

### CF-UX-PARITY-001 — APPROVED
- Cloudflare migration is not a product redesign.
- accepted source HMS is UX canon for workflow structure, interaction semantics and responsive behavior.
- technical adaptation is allowed; material intentional UX departure requires Human Gate classification.

### PM-AUTONOMY-001 — APPROVED
- Human = Product/Risk Authority.
- ChatGPT = External Controller / Method Custodian / Independent Critic / Human-Gate Classifier.
- Codex = Runtime Orchestrator / execution owner.
- routine REWORK is autonomous.
- Human is not a routine message bus.
- `RUNTIME_CAPABILITY_FALLBACK` required when separate specialist contexts are unavailable.

## VALIDATED RESULTS

### CF-I01 — Platform foundation
Status: `PASS`.  
Accepted Critic artifact: `27515d85d9db0677c4946746fa86374252bff4f5`.

### CF-I02 — Rooms / guests / holds
Status: `PASS`.  
Accepted artifact: `bb3a136526c900522394f223206600f543e99e23`.

### CF-I03 — Bookings / availability / room-night protection
Status: `PASS / CLEAN INTEGRATION PASS / CLOSED`.  
Accepted artifact: `65ed1e5710a20af97d183f04364b5aa7b605a74a`.  
Integrated reviewed head: `58c84a2564d9a4b85785203ff04fee24fee47213`.

### CF-I04 — Reception lifecycle
Status: `PASS`.  
Accepted artifact: `5dc91414301810dba4d5ae6a00f062b8cf59ea7a`.  
Independent Critic: `.orchestration/reviews/CF-I04-REWORK-4-CRITIC.md`.  
Human Gate: `NONE`.

Accepted scope includes real check-in guest count, atomic lifecycle transitions, hold/claim-safe reassignment, checkout policy/reference semantics, actor/request/hotel traceability, source-aligned reception workspace/mobile journey and browser evidence at 375/390/430/768/1024.

## CF-I05 — HOUSEKEEPING + MAINTENANCE

Task Contract: `.orchestration/contracts/CF-I05.md`.

### Artifact / Critic history

- Initial accelerated artifact `02421a19985fa71408e52be2a253b9082292dd78` → Independent Critic `REWORK`.
- Current Critic record: `.orchestration/reviews/CF-I05-CRITIC.md`.

### What the initial accelerated wave got right

- schema, API, UX and QA arrived as one coherent artifact rather than multiple external micro-boundaries;
- dirty queue and board cover eligible room states plus departure and maintenance context;
- maintenance cases enforce one open case per room and durable resolved-state fields;
- maintenance open is transactionally coupled to room state/case/event;
- reason/assignee/priority/resolution validation is present;
- receptionist is denied by backend housekeeping capability checks;
- legacy maintenance rooms are explicitly recoverable;
- generic room metadata PATCH does not expose a status bypass;
- no CF-I06, paid-resource, production, remote-D1 or real-data scope drift occurred;
- `RUNTIME_CAPABILITY_FALLBACK` remains accurate.

### Current blocking findings — REWORK-1 input

1. **Concurrent cleaning false success:** stale `DIRTY -> CLEANING` and `CLEANING -> AVAILABLE` requests can have their guarded room UPDATE affect zero rows while the final event insert still succeeds because the trigger checks only the final room state. This can return success and duplicate transition audit events.
2. **Concurrent maintenance resolution false success:** a stale second resolver can update zero rows but still insert a second `MAINTENANCE_RESOLVE` event because the room/case already satisfy the final trigger state.
3. **Legacy actor ownership parity:** synthesized legacy maintenance case omits `reported_by_user_id`; the accepted source records the recovery actor as reporter.
4. **Housekeeping UX parity:** target is a flat grid of inline action cards; source workflow is queue-oriented with selected/focused room workspace and mobile next-task / focused-sheet behavior. This remains material workflow drift under `CF-UX-PARITY-001`.
5. **Per-room maintenance draft isolation:** reason/priority/owner/resolution state is global to the page and can leak between room forms; resolution text can mirror across multiple maintenance rooms.
6. **Browser evidence:** current durable evidence has screenshots only at 375/1024, simple width/card assertions at all widths and one mocked Start-cleaning interaction. It does not reproducibly prove start, finish, maintenance open, resolve, validation/error/recovery and per-room draft isolation through the integrated local API.

Diagnosis: `CONCURRENCY_DEFECT + DOMAIN_PARITY_DEFECT + UX_PARITY_DEFECT + EVIDENCE_DEFECT`.  
Human Gate: `NONE`.  
Blocker: `NONE`.

## DELIVERY SPEED FINDING

The accelerated wave model is retained. CF-I05 reached one meaningful Independent Critic boundary with a coherent artifact, which is preferable to repeated schema/API/UI micro-boundaries.

Acceleration rule:
- keep a complete contract and parity matrix before implementation;
- implement and self-critic the whole bounded wave;
- surface all discovered defects in one external Critic review where possible;
- keep financial, security/cross-tenant and migration/cutover domains as separate high-risk boundaries.

The goal is fewer external coordination cycles, not weaker QA.

## PENDING HUMAN GATES

None.

## PENDING HUMAN ACTION

None.

## BLOCKERS

None. CF-I05 has bounded autonomous REWORK.

## NEXT AUTHORIZED ACTION

Codex reads `.orchestration/STATUS.json`, `.orchestration/reviews/CF-I05-CRITIC.md`, `.orchestration/contracts/CF-I05.md`, source parity inventory and binding decisions, then autonomously as one bounded rework wave:

1. fixes stale/concurrent start-cleaning, finish-cleaning and maintenance-resolution semantics so false success/duplicate transition audit is impossible;
2. adds deterministic exact-state/event-count concurrency regressions;
3. restores reporter ownership in synthesized legacy maintenance recovery;
4. ports/adapts source queue/focused-room Housekeeping interaction model;
5. isolates maintenance drafts per selected room/case;
6. adds committed reproducible browser/integration evidence for start, finish, maintenance open and resolve, validation/error/recovery and 375/390/430/768/1024 usability;
7. runs full CF-I03/CF-I04/CF-I05 regressions, tests, build, types, Wrangler and diff checks;
8. publishes one fresh immutable CF-I05 artifact with `external_review.required=true`;
9. stops at the next Independent Critic boundary.

Do not begin CF-I06 before a fresh CF-I05 Independent Critic PASS.

No production deployment, remote D1 mutation, real-data migration or paid Cloudflare transition is authorized by this state.
