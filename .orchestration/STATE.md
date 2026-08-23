# HMS Cloudflare — Orchestration State

## CURRENT AUTHORITATIVE STATE

Project: HMS Cloudflare  
Updated: 2026-08-23  
Global Project Mode: `DELIVERY`  
Phase: `BUILD`  
Phase Status: `CF-I02 PASS / RUNTIME AUTOMATION CHANGE UNDER INDEPENDENT REVIEW`

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
- one operational D1 per hotel for hotel-scoped operational data.
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

## RUNTIME AUTOMATION — CF-RUNTIME-AUTOMATION-001

Status: `READY_FOR_INDEPENDENT_CRITIC` on PR #2 / branch `chore/runtime-handoff-automation`.

Purpose: remove routine Human copy/paste handoff between ChatGPT and Codex while preserving Project Method gates.

Proposed mechanism:
- `.orchestration/STATUS.json` is the machine-readable signal;
- `resume_authorized` explicitly controls whether local unattended resume is allowed;
- ordinary `READY_TO_RESUME` may continue automatically only when no blocking external review/Gate/blocker exists;
- a systemd user timer polls approximately every two minutes without invoking Codex;
- `scripts/hms-runtime-watch.sh` launches Codex only for an explicitly authorized `origin/main` event;
- local dispatch is protected by dirty-worktree fail-close, `flock`, event idempotence, 30-minute failure cooldown and max two attempts per event;
- systemd installer is user-scoped and does not enable lingering automatically.

Contract: `.orchestration/contracts/CF-RUNTIME-AUTOMATION-001.md`.
Documentation: `docs/runtime-automation.md`.

This automation is controller-authored and MUST NOT self-approve. It must receive a fresh independent Critic PASS before merge and before local installation.

## NEXT PRODUCT INCREMENT

### CF-I03

Status: `PLANNED / NOT STARTED ON AUTOMATION BRANCH`.

Accepted design scope: bookings, availability and room-night overlap protection.

CF-I03 product implementation is not authorized on PR #2. After automation review/integration and controlled local dispatcher installation, the runtime may derive/create the formal CF-I03 Task Contract from accepted design and continue according to Project Method.

## PENDING HUMAN GATES

None.

Any paid Cloudflare transition remains a separate Human Gate.

## PENDING HUMAN ACTIONS / INPUTS

None for product scope.

After independent PASS and merge of PR #2, local installation requires running `npm run runtime:install` once on the Debian workstation. That is a local setup action, not a product/risk decision.

## BLOCKERS

Product CF-I03 is intentionally not executed on the automation branch.

Runtime automation integration is blocked only on independent Critic PASS for `CF-RUNTIME-AUTOMATION-001`.

## NEXT AUTHORIZED ACTION

Run a fresh logically independent Critic over the current PR #2 head against `.orchestration/contracts/CF-RUNTIME-AUTOMATION-001.md`.

- On `REWORK`: repair within contract and require a fresh Critic.
- On `PASS`: merge/integrate through normal Git path, reconcile `main` state/status, then install the user timer locally with `npm run runtime:install` and execute a controlled dispatch test.
- Do not implement CF-I03 on PR #2.

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
