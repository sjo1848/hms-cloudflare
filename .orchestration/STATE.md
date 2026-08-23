# HMS Cloudflare — Orchestration State

## CURRENT AUTHORITATIVE STATE

Project: HMS Cloudflare  
Updated: 2026-08-23  
Global Project Mode: `DELIVERY`  
Phase: `BUILD`  
Phase Status: `CF-I01 PASS / CF-I02 PASS / CF-I03 INDEPENDENT CRITIC PASS / CLEAN INTEGRATION VALIDATED / INDEPENDENT REVIEW PENDING`

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

- Status: `PASS / INTEGRATED`.
- PR #2 merged at `08af1ffda02447e53924345d900fa5f91c266765`.
- systemd user dispatcher installed locally.
- Initial fail-close probe passed.
- First real dispatch proved `GitHub → systemd → dispatcher → Codex` works without Human relay.
- Incident found: Codex `workspace-write` could edit workspace but not `.git`, so it could not commit/push CF-I03.
- Recovered CF-I03 workspace was checkpointed once to `cf-i03-recovery@c1bd966` solely to preserve the artifact.

### Runtime Git handoff repair — CF-RUNTIME-GIT-HANDOFF-002

- Status: `PASS / INTEGRATED / LOCAL PROBE PASS`.
- PR #5 exact reviewed head: `f3f1565f15b69fb2b9a0046fc4ca0d72b31fdd28`.
- ChatGPT Independent Critic verdict: PASS after one controller-found rework concerning non-idempotent commit/push recovery.
- PR #5 merged to main at `a2f8a7eb760834b7868368ebe9c793a0fc2f188b`.
- Codex remains in `--sandbox workspace-write`.
- Host launcher owns bounded `runtime/...` branch creation/resume, immutable commit creation and push.
- Runtime event ownership/base/artifact claims support recovery after commit/push interruption without rerunning Codex when identity remains exact.
- No host auto-commit to `main`; no auto-merge path.
- ChatGPT watcher derives/inspects runtime branches so the Human is not required to relay branch publication.
- Controlled local probe passed repeatedly on 2026-08-23: dispatcher observed `HUMAN_ACTION_REQUIRED` and exited without launching Codex.

## CF-I03

Status: `PASS / INDEPENDENT CRITIC COMPLETE / CLEAN INTEGRATION VALIDATED / INDEPENDENT REVIEW PENDING`.

Base product branch: `cf-i03-bookings@834e4a2aa3ec37aac036dc0273b15e6abf5c7d81`.
Original review PR: #4.
Authorized runtime rework branch: `runtime/cf-i03-rework-6`.
Task Contract: `.orchestration/contracts/CF-I03.md` on the work branch.

Accepted implementation artifact: `65ed1e5710a20af97d183f04364b5aa7b605a74a` on `runtime/cf-i03-rework-6`.
Clean integration artifact: `f6f3d230348ca22834704a063eec728d27235e6a` on `integration/cf-i03-clean`, fast-forward integrated into current `main` at `a720966f25fe10dbe5b43ab258e0f6014c93cca8`.

Independent Critic record: `.orchestration/reviews/CF-I03-REWORK-4-CRITIC.md`.
Critic verdict: `PASS`.
Human Gate: `NONE`.

Runtime capability record: `RUNTIME_CAPABILITY_FALLBACK` — the visible Codex adapter did not expose separate specialist/subagent execution capability, so no false multiagency result is claimed. The bounded implementation and adversarial validation were executed in this runtime, with the independent Critic boundary preserved.

### Prior review input — 8 findings

The first review found 4 P1 + 4 P2 issues: blank notes, non-atomic hold/booking exclusion, missing date-scoped availability UI, cancelled-booking resurrection, missing detail/edit UI, unsafe derived integer total, unavailable room acceptance, and unbounded list query.

### ChatGPT Independent Critic — resolved runtime artifact

Verdict: `PASS` after bounded rework. The accepted artifact includes the booking claim FK, guarded PATCH update, executable D1/API regressions and persisted Playwright evidence.

Previously reported findings, now resolved in the accepted artifact:

1. **P1 — hold/booking exclusion remains non-atomic in the hold mutation direction.** `POST /rooms/:id/holds` and `PATCH /rooms/:id/holds/:hold_id` still only check overlap against `room_holds`; neither checks `room_inventory_nights`. A hold can therefore be created or moved onto nights already claimed by a confirmed booking. This violates the accepted shared exclusion invariant and leaves availability semantically inconsistent.

2. **P1 — booking claim replacement on PATCH is incorrect when room or dates change.** The delete statement only removes old claims if the existing booking already matches the *new* room/date tuple. For an actual room/date edit that predicate is false, so old `room_inventory_nights` rows survive while new claims are added. This can strand stale claims and incorrectly block availability after a booking edit.

3. **P1 — `claimStatements()` binds the room-id predicate incorrectly.** The claim insert guard checks `bookings.room_id = ?2`, but `?2` is bound to `stayDate`, not `roomId`. The guard can therefore fail for valid bookings, meaning the expected per-night claims may not be inserted at all. This undermines the unique room-night protection relied on by booking creation and update.

Positive progress observed: blank optional notes are normalized to null; derived totals use `Number.isSafeInteger`; booking PATCH rejects lifecycle revival; booking list is bounded; booking UI now exposes date-scoped availability and an edit/detail interaction; room operational status is checked on booking write.

No Human Gate is required. These findings are ordinary bounded rework within CF-I03.

## PENDING HUMAN GATES

None.

Any paid Cloudflare transition remains a separate Human Gate.

## PENDING HUMAN ACTION

None.

## BLOCKERS

None. CF-I03 has a fresh Independent Critic PASS and its clean integration is published; the next boundary is Independent Critic review of the integrated head.

## NEXT AUTHORIZED ACTION

1. ChatGPT performs the Independent Critic review of the exact clean integration head after publication to current `main`.
2. After that review boundary, reconcile canonical state and derive/authorize CF-I04 under a fresh Task Contract.

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
- Codex = Runtime Orchestrator / implementation and bounded rework.
- ChatGPT = External Project Controller / Method Custodian / Independent Critic / Human Gate interface.
- Every substantive task requires a Task Contract.
- Every substantive output requires an independent ChatGPT Critic.
- Routine REWORK is autonomous.
- Retry exhaustion triggers diagnosis, not automatic escalation.
- Do not use the Human as a routine message bus.
- Preserve `Requirement → Expected Surface → Acceptance → Evidence` for material requirements.
