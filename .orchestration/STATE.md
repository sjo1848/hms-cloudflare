# HMS Cloudflare — Orchestration State

## CURRENT AUTHORITATIVE STATE

Project: HMS Cloudflare  
Updated: 2026-08-23  
Global Project Mode: `DELIVERY`  
Phase: `BUILD`  
Phase Status: `CF-I01 PASS / CF-I02 PASS / CF-I03 PASS+INTEGRATED / CF-I04 PREPARATION`

Current objective: migrate the accepted HMS product to Cloudflare while preserving observable product behavior, domain semantics and material safety guarantees. Migration is parity-first; no product-feature expansion is authorized.

## CANONICAL SOURCES

- Source repository: `sjo1848/hotel-management-system`
- Source baseline: `main@4df56a6217caab611f2f5fcbd98bde8386bb5629`
- Target repository: `sjo1848/hms-cloudflare`
- Durable governance folder in Drive: `HMS Cloudflare`
- Portable integrated Design Package: `docs/migration-design-package.md`
- Runtime decision record: `.orchestration/decisions/CF-DATA-001.md`
- Source parity artifact: `docs/source-contract-inventory.md`

Conversation history is supporting context only and is never the sole source of truth.

## ACTIVE DECISIONS

### CF-ARCH-001 — APPROVED

- Authentication boundary: Cloudflare Access.
- Frontend: React + Vite.
- API: Cloudflare Workers + Hono + TypeScript.
- Persistence target: Cloudflare D1.
- Deployment topology: separate static frontend Worker and API Worker under one hostname; `/api/*` routes to API Worker.
- Compatibility objective: preserve same-origin `/api/v1` behavior where practical.
- Source HMS remains untouched.
- Parity before feature expansion.

### CF-DATA-001 — APPROVED OPTION B

- one control-plane D1 for Access identity mappings, hotels, memberships/roles and routing metadata;
- one operational D1 per hotel for hotel-scoped operational data;
- target remains `$0/month / Cloudflare Free`;
- no paid Cloudflare plan, paid D1 transition or material recurring-cost increase may be activated without a separate Human Gate;
- critical atomic workflows stay inside the relevant hotel operational D1.

### Independent review policy

- Codex quota is reserved for implementation/rework.
- ChatGPT is the external Independent Critic through GitHub.
- Routine `@codex review` is not used unless the Human explicitly changes this policy.

## VALIDATED RESULTS

### Bootstrap / source contract / design

- `CF-BOOTSTRAP-REVIEW-001`: PASS after bounded rework.
- `CF-SOURCE-CONTRACT-001`: PASS; router/OpenAPI/artifact operations `51 / 51 / 51`.
- `CF-DESIGN-REVIEW-001`: PASS.

### CF-I01

- Status: `PASS`.
- Rework: 1 bounded cycle.
- Fresh Critic PASS at repaired artifact `27515d85d9db0677c4946746fa86374252bff4f5`.

### CF-I02

- Status: `PASS`.
- Final implementation artifact: `bb3a136526c900522394f223206600f543e99e23`.
- State/evidence commit on main: `24a1e68a8df8fd7251586415619045f287e2c95a`.
- Evidence: 13 tests PASS, typecheck PASS, web build PASS, generated-type check PASS, API/web Wrangler dry-run PASS, diff check PASS.

### Runtime automation — CF-RUNTIME-AUTOMATION-001

- Status: `PASS / INTEGRATED` as a technical experiment, but unattended Codex is not the normal operating mode.
- PR #2 merged at `08af1ffda02447e53924345d900fa5f91c266765`.
- First real dispatch proved `GitHub → systemd → dispatcher → Codex` works without Human relay.
- User-visible execution is the preferred operating mode; automation must not hide substantive Codex work.

### Runtime Git handoff repair — CF-RUNTIME-GIT-HANDOFF-002

- Status: `PASS / INTEGRATED / LOCAL PROBE PASS`.
- PR #5 exact reviewed head: `f3f1565f15b69fb2b9a0046fc4ca0d72b31fdd28`.
- ChatGPT Independent Critic verdict: PASS after one controller-found rework concerning non-idempotent commit/push recovery.
- PR #5 merged to main at `a2f8a7eb760834b7868368ebe9c793a0fc2f188b`.
- No host auto-commit to `main`; no auto-merge path.

## CF-I03 — BOOKINGS / AVAILABILITY / ROOM-NIGHT PROTECTION

Status: `PASS / CLEAN INTEGRATION PASS / CLOSED`.

Task Contract: `.orchestration/contracts/CF-I03.md`.
Accepted implementation artifact: `65ed1e5710a20af97d183f04364b5aa7b605a74a` on `runtime/cf-i03-rework-6`.
Clean integration product commit: `f6f3d230348ca22834704a063eec728d27235e6a`.
Integrated main head independently reviewed: `58c84a2564d9a4b85785203ff04fee24fee47213`.
Original PR #4 was closed without merge because it was stale.

Independent Critic records:
- `.orchestration/reviews/CF-I03-REWORK-4-CRITIC.md` — implementation artifact PASS.
- `.orchestration/reviews/CF-I03-INTEGRATION-CRITIC.md` — clean integration PASS.

Accepted evidence includes:
- booking create/list/detail/update/cancellation;
- date-scoped availability with holds and active booking claims;
- unique `(room_id, stay_date)` room-night claims;
- `booking_id -> bookings(id) ON DELETE CASCADE` relational integrity;
- guarded PATCH false-success prevention;
- overlap rollback, claim replacement, failed-update preservation, hold exclusion, cancellation release and half-open adjacency;
- tenant routing fail-closed behavior;
- persisted browser validation for loading, empty, validation, availability, create, detail/edit and surfaced backend error;
- 16/16 tests, executable CF-I03 D1/API regression, web build, generated types, Wrangler dry-runs and diff check PASS during clean integration validation.

Human Gate: `NONE`.

Runtime capability record: `RUNTIME_CAPABILITY_FALLBACK` — the visible Codex adapter did not expose separate specialist/subagent execution capability, so no false multiagency result is claimed. The Independent Critic boundary remained external and intact. This is a runtime/method limitation to improve, not a CF-I03 product blocker.

Non-blocking migration note: `0004_booking_claim_fk.sql` uses `PRAGMA foreign_keys = OFF/ON`; prefer `PRAGMA defer_foreign_keys` or no toggle in future D1 migrations when appropriate.

## CF-I04 — PREPARATION

Target increment: Reception Lifecycle.

Before implementation, derive a fresh Task Contract from current `main`, the approved migration design package and source parity inventory. The contract must preserve lifecycle semantics rather than generic CRUD and must explicitly separate these responsibilities:

- Domain/Lifecycle: check-in, checkout, reassignment and transition invariants/atomicity.
- Reception UX: browser/mobile reception journey and observable states.
- QA/Integration: adversarial lifecycle, tenant, concurrency and integrated journey evidence.

If the visible Codex runtime can instantiate true specialist/subagent contexts, the Runtime Orchestrator should delegate these bounded responsibilities. If it still cannot, record `RUNTIME_CAPABILITY_FALLBACK` explicitly and preserve contextual separation and independent QA evidence without simulating multiagency.

No CF-I04 implementation is authorized before its Task Contract exists.

## PENDING HUMAN GATES

None.

Any paid Cloudflare transition remains a separate Human Gate.

## PENDING HUMAN ACTION

None.

## BLOCKERS

None.

## NEXT AUTHORIZED ACTION

1. Derive and persist the fresh `CF-I04` Reception Lifecycle Task Contract from current `main`.
2. Define its dependency graph and responsibility split before implementation.
3. Start visible Codex execution only after the contract is canonical.
4. Stop again at the next Independent Critic boundary or legitimate Human Gate/stop condition.

## STOP CONDITION

Stop only for:
- a legitimate Human Gate;
- material unrecoverable blocker;
- unavoidable Human Action/Input;
- Product Acceptance boundary;
- external Independent Critic boundary;
- runtime/session end with exact resumable state persisted.

## ORCHESTRATION RULES

- Human = Product/Risk Authority.
- Codex = Runtime Orchestrator; implementation may be delegated to bounded Specialists when the runtime exposes that capability.
- ChatGPT = External Project Controller / Method Custodian / Independent Critic / Human Gate interface.
- Every substantive task requires a Task Contract.
- Every substantive output requires an independent ChatGPT Critic.
- Routine REWORK is autonomous.
- Retry exhaustion triggers diagnosis, not automatic escalation.
- Do not use the Human as a routine message bus.
- Preserve `Requirement → Expected Surface → Acceptance → Evidence` for material requirements.
- Optimize for minimum unnecessary Human coordination plus maximum execution visibility.
