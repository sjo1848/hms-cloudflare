# HMS Cloudflare — Orchestration State

## CURRENT AUTHORITATIVE STATE

Project: HMS Cloudflare  
Updated: 2026-08-23  
Global Project Mode: `DELIVERY`  
Phase: `BUILD`  
Phase Status: `CF-I01 PASS / CF-I02 PASS / CF-I03 PASS+INTEGRATED / CF-I04 PASS / CF-I05 ARTIFACT READY FOR INDEPENDENT CRITIC`

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
- Current Critic record: `.orchestration/reviews/CF-I04-REWORK-4-CRITIC.md`

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

Accepted scope includes:
- real positive check-in guest count and required confirmations;
- atomic check-in / room occupancy;
- atomic in-house room reassignment with hold/claim protection;
- deterministic stale destination and hold-vs-reassignment rollback evidence;
- valid repeated room history;
- checkout policy/reference semantics, charge/release/handoff gates, dirty-room transition;
- lifecycle actor/request/hotel traceability;
- reception case-workspace UX parity;
- staged mobile check-in and full lifecycle browser evidence at 375/390/430/768/1024;
- 16/16 test suite, D1/API regressions, build/types/Wrangler validation.

### CF-I05 — Housekeeping + Maintenance
Status: `IMPLEMENTED / VALIDATED / AWAITING INDEPENDENT CRITIC`.
Immutable artifact: `02421a1`.
Task Contract: `.orchestration/contracts/CF-I05.md`.
Parity/evidence: `docs/cf-i05-housekeeping-maintenance-parity.md`.

Validated scope includes:
- source-aligned dirty queue and housekeeping board with departure and maintenance context;
- Dirty → Cleaning → Available transitions with invalid-state rejection and traceability;
- maintenance open/resolve workflow, legacy maintenance resolution, priority/reason/assignee/note validation and one-open-case-per-room enforcement;
- D1 transactional coupling of room state, maintenance case and housekeeping event audit;
- backend RBAC and tenant-bound API behavior;
- responsive `/housekeeping` UX and browser evidence at 375/390/430/768/1024;
- full check/build plus CF-I03, CF-I04 and CF-I05 D1/API regressions;
- self-critic completed with no scope, security, cost, architecture or Human Gate drift.

## DELIVERY SPEED FINDING

CF-I04 required four bounded REWORK cycles before PASS. The defect classes were legitimate, but the experience exposes coordination overhead from very small implementation/review loops and late discovery of source-parity details.

Future delivery should accelerate by increasing **pre-flight contract completeness and coherent execution scope**, not by weakening QA or collapsing unrelated high-risk domains.

Candidate delivery model:
- group low/medium-risk, tightly coupled implementation work inside larger delivery waves;
- retain internal deterministic checkpoints rather than external review after every small seam;
- keep an external Independent Critic at meaningful risk boundaries;
- financial atomicity, security/cross-tenant administration, and migration/cutover remain separate substantive risk boundaries.

## PENDING HUMAN GATES

None.

## CF-I05 EXECUTION

Runtime status: `STOPPED AT INDEPENDENT CRITIC BOUNDARY`; `RUNTIME_CAPABILITY_FALLBACK` remains active because this runtime exposes no separate Specialist contexts. Domain/Engineering, Reception/Housekeeping UX and QA/Security responsibilities were separated in the contract, implementation passes and evidence plan without a false multiagency claim.

CF-I05 is one coherent accelerated operational wave covering only Housekeeping + Maintenance. Billing/financial atomicity, users/RBAC administration, hotels/network administration, reports, migration/cutover and paid Cloudflare changes remain outside scope.

## PENDING HUMAN ACTION

None.

## BLOCKERS

None.

## NEXT AUTHORIZED ACTION

Stop for the next Independent Critic review of immutable artifact `02421a1`. Do not begin CF-I06 until that boundary is resolved and canonical state authorizes the next increment.

No production deployment, remote D1 mutation, real-data migration or paid Cloudflare transition is authorized by this state.
