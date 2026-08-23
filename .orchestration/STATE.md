# HMS Cloudflare — Orchestration State

## CURRENT AUTHORITATIVE STATE

Project: HMS Cloudflare  
Updated: 2026-08-23  
Global Project Mode: `DELIVERY`  
Phase: `BUILD`  
Phase Status: `CF-I02 PASS / RUNTIME GIT HANDOFF PASS+PROBED / CF-I03 REWORK AUTHORIZED`

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

Status: `REWORK AUTHORIZED / PR #4 BASE ARTIFACT / RUNTIME REWORK BRANCH`.

Runtime execution: `READY_TO_RESUME` with `resume_authorized=false` — event `CF-I03@REWORK-1-READY` (seq 8), active task `CF-I03`, on `runtime/cf-i03-rework-6`. The branch-local status was reconciled to canonical `origin/main` dispatch authorization before implementation. External review is required after immutable publication.

CF-I03 REWORK-1 implementation evidence: API/domain changes repair blank optional notes, atomic hold/booking validation and claim replacement, safe integer totals, unavailable-room rejection, cancelled-booking revival, and bounded booking queries. The `/bookings` UI now uses date-scoped availability and provides detail/edit interaction. Local validation passed: `npm run typecheck`, `npm run test` (14/14), `npm run web:build`, `npm run types:check`, `npm run wrangler:dry-run`, and `git diff --check`. Wrangler dry-run emitted the known read-only `.wrangler` log warning but completed both dry-runs.

Stop reason: substantive implementation is ready for host-created immutable publication. Do not invent a commit head. Next: host publishes `runtime/cf-i03-rework-6`, then ChatGPT independently reviews that exact artifact against CF-I03.

Base product branch: `cf-i03-bookings@834e4a2aa3ec37aac036dc0273b15e6abf5c7d81`.
Original review PR: #4.
Authorized runtime rework branch: `runtime/cf-i03-rework-6`, created from the exact reviewed CF-I03 base artifact.
Task Contract: `.orchestration/contracts/CF-I03.md` on the work branch.

The already-triggered Codex review returned 8 material findings before review policy changed. They are now the exact bounded rework input:
- P1 optional blank notes break otherwise valid booking creation;
- P1 hold/booking exclusion is not atomic in both mutation directions;
- P1 booking UI does not use date-scoped `/rooms/available` results;
- P1 generic PATCH can revive a cancelled booking;
- P2 booking detail/edit UI interaction is missing;
- P2 derived booking total can exceed JavaScript safe-integer range;
- P2 unavailable room operational status is not rejected during booking validation;
- P2 booking list/calendar query is unbounded.

Codex must repair these findings within CF-I03 scope, run relevant local validation, persist branch-local review-ready state, and stop at the immutable-artifact boundary. It must not trigger `@codex review` or self-PASS the substantive artifact. The host Git bridge will commit/push the exact runtime branch, then ChatGPT performs the fresh Independent Critic.

## PENDING HUMAN GATES

None.

Any paid Cloudflare transition remains a separate Human Gate.

## PENDING HUMAN ACTION

None.

The local runtime update + controlled fail-close probe has been completed successfully. No routine Human relay is authorized or required for CF-I03 rework.

## BLOCKERS

None.

## NEXT AUTHORIZED ACTION

1. Canonical `STATUS.json` authorizes event `CF-I03@REWORK-1` on `runtime/cf-i03-rework-6`.
2. systemd launches Codex automatically for CF-I03 bounded implementation/rework only.
3. Codex repairs the 8 recorded findings and runs local validation under `workspace-write`.
4. Host Git bridge creates/pushes the immutable artifact on the same `runtime/...` branch.
5. ChatGPT detects/reviews that exact head against CF-I03 Task Contract, design and evidence without `@codex review`.
6. Routine bounded REWORK continues autonomously until PASS or a legitimate stop condition.

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
