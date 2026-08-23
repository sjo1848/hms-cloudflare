# HMS Cloudflare — Orchestration State

## CURRENT AUTHORITATIVE STATE

Project: HMS Cloudflare  
Updated: 2026-08-23  
Global Project Mode: `DELIVERY`  
Phase: `BUILD`  
Phase Status: `CF-I02 PASS / RUNTIME GIT HANDOFF REPAIR PASS+MERGED / LOCAL CONTROLLED PROBE REQUIRED / CF-I03 REWORK`

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

- Status: `PASS / INTEGRATED`.
- PR #5 exact reviewed head: `f3f1565f15b69fb2b9a0046fc4ca0d72b31fdd28`.
- ChatGPT Independent Critic verdict: PASS after one controller-found rework concerning non-idempotent commit/push recovery.
- PR #5 merged to main at `a2f8a7eb760834b7868368ebe9c793a0fc2f188b`.
- Codex remains in `--sandbox workspace-write`.
- Host launcher now owns bounded `runtime/...` branch creation/resume, immutable commit creation and push.
- Runtime event ownership/base/artifact claims support recovery after commit/push interruption without rerunning Codex when identity remains exact.
- No host auto-commit to `main`; no auto-merge path.
- ChatGPT watcher now derives/inspects runtime branches so the Human is not required to relay branch publication.

## CF-I03

Status: `REWORK REQUIRED / PR #4 OPEN / NOT MERGEABLE BY METHOD YET`.

Clean product branch: `cf-i03-bookings@834e4a2aa3ec37aac036dc0273b15e6abf5c7d81`.
PR: #4.

The already-triggered Codex review returned 8 material findings before review policy changed:
- P1 optional blank notes break valid creation;
- P1 hold/booking exclusion is not atomic in both mutation directions;
- P1 booking UI does not use date-scoped availability;
- P1 generic PATCH can revive a cancelled booking;
- P2 booking detail/edit UI missing;
- P2 derived total can exceed JS safe integer range;
- P2 unavailable room operational status is not rejected;
- P2 booking list query is unbounded.

No further Codex review should be triggered. After the local runtime probe succeeds, these findings are the authorized bounded CF-I03 rework input for Codex; ChatGPT will perform the fresh Critic on the resulting immutable runtime branch.

## PENDING HUMAN GATES

None.

Any paid Cloudflare transition remains a separate Human Gate.

## PENDING HUMAN ACTION

### Local runtime update + controlled probe

The runtime repair is merged but the installed workstation copy must pull `main` before it can be trusted.

Required local action:

```bash
cd /home/sjo1848/dev/hms-elite-cloudflare/hms-cloudflare
git switch main
git pull --ff-only
systemctl --user start hms-codex-dispatch.service
journalctl --user -u hms-codex-dispatch.service -n 30 --no-pager
```

Expected result: canonical status is `HUMAN_ACTION_REQUIRED` with `resume_authorized=false`, therefore the controlled probe must start the service and exit without launching Codex.

This is a local operational action, not a Human Gate.

## BLOCKERS

No product-risk blocker. Unattended execution remains deliberately disabled until the local controlled probe confirms the merged host-Git bridge is active on the workstation.

## NEXT AUTHORIZED ACTION

1. Human performs the local pull + controlled fail-close probe above.
2. On successful probe, ChatGPT reconciles canonical state and authorizes a new CF-I03 rework event on a bounded runtime branch.
3. systemd launches Codex automatically for implementation/rework only.
4. Host bridge commits/pushes the immutable runtime branch.
5. ChatGPT detects that branch and performs the fresh Independent Critic without `@codex review`.
6. Routine REWORK continues autonomously until PASS or a legitimate stop condition.

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
