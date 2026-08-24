# HMS Cloudflare — Orchestration State

## CURRENT AUTHORITATIVE STATE

Project: HMS Cloudflare  
Updated: 2026-08-23  
Global Project Mode: `DELIVERY`  
Phase: `BUILD`  
Phase Status: `CF-I01 PASS / CF-I02 PASS / CF-I03 PASS+INTEGRATED / CF-I04 REWORK-4 RUNNING`

Current objective: migrate the accepted HMS product to Cloudflare while preserving observable product behavior, domain semantics and material safety guarantees. Migration is parity-first; no product-feature expansion or silent UX redesign is authorized.

## CANONICAL SOURCES

- Source repository: `sjo1848/hotel-management-system`
- Source baseline: `main@4df56a6217caab611f2f5fcbd98bde8386bb5629`
- Target repository: `sjo1848/hms-cloudflare`
- Durable governance folder in Drive: `HMS Cloudflare`
- Portable Design Package: `docs/migration-design-package.md`
- Source parity artifact: `docs/source-contract-inventory.md`
- Data topology decision: `.orchestration/decisions/CF-DATA-001.md`
- Autonomous execution decision: `.orchestration/decisions/PM-AUTONOMY-001.md`
- UX parity decision: `.orchestration/decisions/CF-UX-PARITY-001.md`
- Active Task Contract: `.orchestration/contracts/CF-I04.md`
- Current Critic record: `.orchestration/reviews/CF-I04-REWORK-3-CRITIC.md`

Conversation history is supporting context only and is never the sole source of truth.

## ACTIVE DECISIONS

### CF-ARCH-001 — APPROVED

- Authentication boundary: Cloudflare Access.
- Frontend: React + Vite.
- API: Cloudflare Workers + Hono + TypeScript.
- Persistence: Cloudflare D1.
- Topology: separate static frontend Worker and API Worker under one hostname; `/api/*` routes to API Worker.
- Preserve same-origin `/api/v1` compatibility where product contract has not intentionally changed.
- Source HMS remains read-only.
- Parity before feature expansion.

### CF-DATA-001 — APPROVED OPTION B

- one control-plane D1 for Access identity mappings, hotels, memberships/roles and routing metadata;
- one operational D1 per hotel for hotel-scoped operational data;
- critical atomic workflows remain inside one operational hotel D1;
- target remains `$0/month / Cloudflare Free`;
- any paid/material recurring-cost transition requires a separate Human Gate.

### CF-UX-PARITY-001 — APPROVED

- Cloudflare is a technical migration of the accepted HMS product, not a product redesign.
- The accepted source HMS is the UX canon for workflow structure, interaction semantics and responsive reception behavior.
- Technical frontend adaptation is allowed; a materially different product UX is not.
- A material intentional UX departure requires Human Gate classification before implementation.
- Pixel-perfect copying is not required; relevant accepted behavior and information architecture are.

### PM-AUTONOMY-001 — APPROVED

- Human = Product/Risk Authority; decides legitimate Human Gates and Product Acceptance only.
- ChatGPT = External Project Controller / Method Custodian / Independent Critic / Human-Gate Classifier.
- Codex = Runtime Orchestrator / execution owner for planning, implementation, tests, adversarial QA, repair, evidence and artifact publication.
- Bugs, red tests, migration defects, incomplete evidence and Independent Critic REWORK are not Human Gates.
- REWORK is consumed directly from persisted GitHub evidence and repaired autonomously by Codex.
- The Human is not a routine message bus.
- `RUNTIME_CAPABILITY_FALLBACK` is required when true Specialist contexts are unavailable; no false multiagency claims.

## VALIDATED RESULTS

### Method / design foundation

- `CF-BOOTSTRAP-REVIEW-001`: PASS after bounded rework.
- `CF-SOURCE-CONTRACT-001`: PASS; router/OpenAPI/inventory operations `51 / 51 / 51`.
- `CF-DESIGN-REVIEW-001`: PASS.

### CF-I01 — Platform foundation

Status: `PASS`.  
Fresh Critic PASS artifact: `27515d85d9db0677c4946746fa86374252bff4f5`.

### CF-I02 — Rooms / guests / holds

Status: `PASS`.  
Accepted artifact: `bb3a136526c900522394f223206600f543e99e23`.

### CF-I03 — Bookings / availability / room-night protection

Status: `PASS / CLEAN INTEGRATION PASS / CLOSED`.  
Accepted artifact: `65ed1e5710a20af97d183f04364b5aa7b605a74a`.  
Integrated reviewed head: `58c84a2564d9a4b85785203ff04fee24fee47213`.

Human Gate: `NONE`.

## CF-I04 — RECEPTION LIFECYCLE

Task Contract: `.orchestration/contracts/CF-I04.md`.

### Artifact / Critic history

- Initial artifact `32b5070dbd80b4b4d3667fe45573f8851cb60a7c` → `REWORK`.
- REWORK-1 artifact `88c8361bae2148f682947bba1976a41404db9212` → `REWORK`.
- REWORK-2 artifact `22eb064c68e2793ef0d67dd984384f32f5a13873` → `REWORK`.
- REWORK-3 artifact `cea75f7ebce322e49be16c1167b55efa59cbada6` → `REWORK`.
- Current Critic record: `.orchestration/reviews/CF-I04-REWORK-3-CRITIC.md`.

### What REWORK-3 materially resolved

- actual positive check-in guest count is now persisted in D1;
- checkout policy/reference are now persisted in D1;
- reassignment final guard now checks overlapping room holds;
- deterministic stale-destination reassignment rollback is present;
- deterministic hold-vs-reassignment rollback is present;
- valid `A -> B -> A -> C` room history remains legal and tested;
- stale checkout rollback guard remains present;
- no generic lifecycle status PATCH bypass was observed;
- `RUNTIME_CAPABILITY_FALLBACK` remains accurate.

### Current blocking findings — REWORK-4 input

1. **Extra check-in gate:** target still requires `guest_count_confirmed=true` in addition to the actual positive guest count; source/Task Contract do not.
2. **Extra checkout gate:** target still requires `payment_policy_accepted=true` in addition to selecting a valid checkout policy; source/Task Contract do not.
3. **Reference parity:** source requires `pending-approved` closing reference trimmed length >= 6; target currently accepts 3.
4. **Mobile UX parity:** `checkInStep` is only a hidden click counter. It does not render the accepted visible staged flow, progress or next/back behavior, and it is not reset per selected case.
5. **Responsive evidence:** 390/430/768/1024 still prove workspace/queue/case reachability rather than actual lifecycle control usability. Browser evidence does not substantively cover pending-approved reference behavior.

Diagnosis: `DOMAIN_PARITY_DEFECT + UX_PARITY_DEFECT + EVIDENCE_DEFECT`.  
Human Gate: `NONE`.  
Blocker: `NONE`.

## PENDING HUMAN GATES

None.

Any paid Cloudflare transition, material product/UX redesign, approved architecture/topology change, irreversible real-data migration/cutover or Product Acceptance remains a separate Human Gate.

## PENDING HUMAN ACTION

None.

## BLOCKERS

None. CF-I04 REWORK-4 is authorized routine parity/evidence repair.

## REWORK-4 EXECUTION

Runtime status: `RUNNING`; `RUNTIME_CAPABILITY_FALLBACK` remains active because this runtime exposes no separate Specialist contexts. Domain/Engineering and QA/Security responsibilities remain separated in implementation and evidence passes; no multiagency claim is made.

Authorized repair is limited to the persisted `CF-I04-REWORK-3-CRITIC.md` findings: exact lifecycle parity, source-equivalent staged mobile check-in and substantive responsive browser evidence.

## NEXT AUTHORIZED ACTION

Codex reads `.orchestration/STATUS.json`, `.orchestration/reviews/CF-I04-REWORK-3-CRITIC.md`, the CF-I04 Task Contract, source contract inventory and binding decisions, then autonomously:

1. removes target-only `guest_count_confirmed` and `payment_policy_accepted` gates;
2. enforces source pending-reference semantics (trimmed length >= 6);
3. replaces the hidden mobile click-counter with the accepted staged check-in interaction model and resets workflow state per case;
4. strengthens browser evidence so lifecycle controls are exercised at 375/390/430/768/1024, including checkout policy/reference behavior;
5. aligns evidence claims exactly with what tests prove;
6. runs full self-adversarial QA, D1/API regressions, browser tests, build/types/Wrangler/diff checks;
7. publishes a fresh immutable CF-I04 artifact with `external_review.required=true`;
8. stops at the next Independent Critic boundary or another legitimate stop condition.

Do not advance to CF-I05 before CF-I04 obtains a fresh Independent Critic PASS.

## STOP CONDITIONS

Stop only for:
- substantive immutable-artifact / Independent Critic boundary;
- legitimate Human Gate;
- Product Acceptance boundary;
- material unrecoverable blocker after bounded recovery/diagnosis;
- unavoidable Human-only Action/Input;
- runtime/session termination with exact resumable state persisted.

Do not stop for ordinary bugs, red tests, bounded migration defects, incomplete evidence or Independent Critic REWORK.

## ORCHESTRATION RULES

- Every substantive task requires a Task Contract.
- Every substantive artifact requires external Independent Critic before PASS.
- REWORK is persisted for direct Codex consumption; Human does not relay it.
- Retry exhaustion triggers diagnosis, not automatic Human escalation.
- Integration Review is required when separate outputs must compose; identity-preserving post-PASS integration may use deterministic verification when no substantive blob/semantics change.
- Specialists are used only when runtime genuinely exposes separate contexts; otherwise use `RUNTIME_CAPABILITY_FALLBACK`.
- Preserve `Requirement → Expected Surface → Acceptance → Evidence`.
- Optimize for minimum unnecessary Human coordination, maximum auditable autonomy and sufficient execution visibility.
