# HMS Cloudflare — Orchestration State

## CURRENT AUTHORITATIVE STATE

Project: HMS Cloudflare  
Updated: 2026-08-23  
Global Project Mode: `DELIVERY`  
Phase: `BUILD`  
Phase Status: `CF-I01 PASS / CF-I02 PASS / CF-I03 PASS+INTEGRATED / CF-I04 PASS / NEXT: ACCELERATED CF-I05+ PLANNING`

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
- Last accepted Task Contract: `.orchestration/contracts/CF-I04.md`
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

## PENDING HUMAN ACTION

None.

## BLOCKERS

None.

## NEXT AUTHORIZED ACTION

Plan the next delivery scope beginning with CF-I05 using an accelerated-wave model while preserving the existing product, cost, security and parity decisions.

Recommended risk boundaries:
1. Housekeeping + maintenance may be implemented as one coherent operational wave.
2. Billing remains a dedicated independent-risk boundary because it introduces financial atomicity, invoices, payments, settlement and cash closure.
3. Users/RBAC/audit + hotels/network administration remain a dedicated security/cross-tenant boundary.
4. Analytics/reports + integrated desktop/mobile journeys may be treated as one integration wave after underlying operational domains exist.
5. Data migration rehearsal + operational readiness + Product Acceptance preparation remain the final dedicated boundary.

No production deployment, remote D1 mutation, real-data migration or paid Cloudflare transition is authorized by this planning state.
