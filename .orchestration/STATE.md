# HMS Cloudflare — Orchestration State

## CURRENT AUTHORITATIVE STATE

Project: HMS Cloudflare  
Updated: 2026-08-23  
Global Project Mode: `DELIVERY`  
Phase: `BUILD`  
Phase Status: `CF-I02 PASS / RUNTIME AUTOMATION PASS / CF-I03 RECOVERED TO BRANCH / RUNTIME GIT HANDOFF BLOCKED`

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

## VALIDATED RESULTS

### Bootstrap

- `CF-BOOTSTRAP-REVIEW-001`: `REWORK → repaired → fresh independent PASS`.
- Bootstrap PR #1 integrated.

### Source contract inventory

- `CF-SOURCE-CONTRACT-001`: `PASS`.
- Router/OpenAPI/artifact operations: `51 / 51 / 51`.
- Evidence: `docs/source-contract-inventory.md` and `.orchestration/reviews/CF-SOURCE-CONTRACT-001-critic.md`.

### Design

- `CF-DESIGN-REVIEW-001`: `PASS`.
- DESIGN exit closed before product BUILD.

### CF-I01

- Status: `PASS`.
- Rework: `1` bounded cycle.
- Fresh Critic PASS at repaired artifact `27515d85d9db0677c4946746fa86374252bff4f5`.
- Evidence: `.orchestration/reviews/CF-I01-critic.md`.

### CF-I02

- Status: `PASS`.
- Final implementation artifact after bounded UI rework: `bb3a136526c900522394f223206600f543e99e23`.
- State/evidence commit on main: `24a1e68a8df8fd7251586415619045f287e2c95a`.
- Evidence: 13 tests PASS, typecheck PASS, web build PASS, generated-type check PASS, API/web Wrangler dry-run PASS, diff check PASS.
- Critic evidence: `.orchestration/reviews/CF-I02-critic.md`.
- No deployment, remote D1 mutation or paid service activation.

### Runtime automation — CF-RUNTIME-AUTOMATION-001

- Status: `PASS / INTEGRATED`, but runtime Git handoff now has a technical blocker discovered by the first real autonomous product run.
- Independently reviewed final PR head: `400ca30e40362dda28e5b81fcdd8f169d971caf0` with no fresh Codex findings.
- PR #2 merged to main at `08af1ffda02447e53924345d900fa5f91c266765`.
- User-scoped systemd dispatcher installed locally.
- Controlled fail-close probe passed.
- First real automatic dispatch passed the `GitHub → systemd → dispatcher → Codex` path and launched CF-I03 without Human relay.
- Codex implemented and locally validated CF-I03, but `codex exec --sandbox workspace-write` could not write `.git/FETCH_HEAD` or `.git/index.lock`, so it could not create the immutable artifact commit or publish it.
- The launcher then correctly refused automatic push because the worktree was dirty.
- Subsequent timer runs correctly failed closed on the dirty worktree.
- The recovered CF-I03 workspace was manually checkpointed once to branch `cf-i03-recovery` at `c1bd966` solely to preserve the artifact; this is a recovery action, not acceptance.

## NEXT PRODUCT INCREMENT

### CF-I03

Status: `RECOVERED_ARTIFACT / REQUIRES INDEPENDENT CRITIC`.

Accepted design scope: bookings, availability and room-night overlap protection.

Recovered implementation branch: `cf-i03-recovery` at `c1bd966`.
The recovered artifact is not PASS and must not be merged until it receives an independent Critic and bounded rework if needed.

## PENDING HUMAN GATES

None.

Any paid Cloudflare transition remains a separate Human Gate.

## PENDING HUMAN ACTIONS / INPUTS

None.

The one-time manual recovery commit/push has already been completed. Do not require further Human relay for routine Git/Codex coordination.

## BLOCKERS

### Runtime Git handoff blocker

`codex exec --sandbox workspace-write` can modify the project workspace but cannot reliably write Git metadata. The current launcher therefore cannot depend on Codex itself creating commits/branches inside the sandbox.

Required repair: keep Codex sandboxed for implementation, but move immutable Git publication responsibilities to the trusted host-side launcher or an equivalent bounded repository channel. The repaired handoff must preserve fail-close behavior, exact reviewed artifact identity, branch isolation, and Human Gate/blocker semantics.

## NEXT AUTHORIZED ACTION

Two bounded tracks are authorized:

1. Open the recovered CF-I03 artifact as a PR and request a fresh independent Critic against `.orchestration/contracts/CF-I03.md`. On REWORK, repair within the contract and require a fresh Critic. Do not merge until PASS.
2. Repair the runtime Git handoff in a separate automation PR so future autonomous runs can produce immutable commits/branches without granting unrestricted Codex access to `.git`. Require independent Critic before integration.

Do not resume unattended product execution until the runtime Git handoff repair is integrated and locally re-probed.

## STOP CONDITION

Stop only for:
- a legitimate Human Gate;
- material unrecoverable blocker;
- unavoidable Human Action/Input;
- Product Acceptance boundary;
- runtime/session end with exact resumable state persisted.

## ORCHESTRATION RULES

- Human = Product/Risk Authority.
- Codex = Runtime Orchestrator / repository execution.
- ChatGPT = External Project Controller / Method Custodian / audit and Human Gate interface.
- Every substantive task requires a Task Contract.
- Every substantive output requires independent Critic review.
- Routine REWORK is autonomous.
- Retry exhaustion triggers diagnosis, not automatic escalation.
- Do not use the human as a routine message bus.
- Preserve `Requirement → Expected Surface → Acceptance → Evidence` for material requirements.
