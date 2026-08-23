# HMS Cloudflare — Orchestration State

## CURRENT AUTHORITATIVE STATE

Project: HMS Cloudflare  
Updated: 2026-08-23  
Global Project Mode: `DELIVERY`  
Phase: `BUILD`  
Phase Status: `CF-I02 PASS / RUNTIME AUTOMATION PASS / CF-I03 BLOCKED`

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

- Status: `PASS / INTEGRATED`.
- Independently reviewed final PR head: `400ca30e40362dda28e5b81fcdd8f169d971caf0` with no fresh Codex findings.
- PR #2 merged to main at `08af1ffda02447e53924345d900fa5f91c266765`.
- User-scoped systemd dispatcher installed locally.
- Controlled fail-close probe passed: service started, observed canonical `resume_authorized=false`, and exited without launching Codex.
- Polling alone does not invoke Codex.
- No linger was enabled.
- Safety model includes dirty-worktree fail-close, `flock`, strict STATUS schema checks, explicit gate/blocker keys, stale-main revalidation, monotonic observed event sequencing/status fingerprinting, bounded retry/cooldown, and no bypass of Human Gate/blocker/external review.

## NEXT PRODUCT INCREMENT

### CF-I03

Status: `RUNNING`; Task Contract created at `.orchestration/contracts/CF-I03.md`.

Accepted design scope: bookings, availability and room-night overlap protection.

Next routine runtime action is authorized to derive/create the formal CF-I03 Task Contract from accepted design and execute CF-I03 according to Project Method. No deploy, remote D1 mutation, paid transition or Product Acceptance decision is implied by this authorization.

## PENDING HUMAN GATES

None.

Any paid Cloudflare transition remains a separate Human Gate.

## PENDING HUMAN ACTIONS / INPUTS

None.

## BLOCKERS

None.

## NEXT AUTHORIZED ACTION

CF-I03 specialist implementation is present in the controlled workspace under the new Task Contract, but the required immutable artifact commit is blocked by read-only Git metadata.

Codex completed the bounded implementation attempt for:
- the formal CF-I03 Task Contract derived from accepted design;
- implement only the accepted CF-I03 scope;
- preserve the room-night overlap invariant and tenant boundaries;
- run required tests/evidence;
- obtain an independent Critic for the substantive output;
- perform bounded routine REWORK autonomously;
- persist exact orchestration state before runtime/session end.

## BLOCKER

`GIT_METADATA_READ_ONLY`: `git fetch` cannot write `.git/FETCH_HEAD`, and `git commit` cannot create `.git/index.lock`. The CF-I03 workspace changes are controlled and pass local checks, but cannot become an immutable artifact or be independently reviewed/integrated until Git metadata is writable or the repository channel publishes the controlled changes.

Recovery attempted: remote fetch and commit retry. Next action is to restore writable Git metadata, commit CF-I03, then run the required independent Critic and bounded integration review.

Stop and set `resume_authorized=false` for the material Git metadata blocker. No Human Gate is being requested; this is a technical/runtime blocker.

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
