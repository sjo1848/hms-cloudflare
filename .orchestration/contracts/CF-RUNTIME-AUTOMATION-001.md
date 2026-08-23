# Task Contract — CF-RUNTIME-AUTOMATION-001

Status: `READY_FOR_INDEPENDENT_CRITIC`
Mode: `DELIVERY / method-governance tooling`
Author: External Project Controller
Required reviewer: logically independent Codex Critic

## Objective

Review the runtime handoff/watch automation so future Codex sessions can reconstruct and continue routine authorized work from durable repository state without the Human copying a custom resume prompt after each runtime end.

The automation must preserve the distinction between fast local routine dispatch and slower independent external audit. A local dispatcher may resume only when canonical state explicitly authorizes it; it must never bypass a Human Gate, blocker, Product Acceptance boundary or blocking external review.

## Artifact under review

Branch: `chore/runtime-handoff-automation`
Base: `main@24a1e68a8df8fd7251586415619045f287e2c95a`

Expected changed artifacts:
- `AGENTS.md`
- `.orchestration/STATUS.json`
- `.orchestration/RESUME_PROMPT.txt`
- `scripts/codex-resume.sh`
- `scripts/hms-runtime-watch.sh`
- `scripts/install-hms-runtime-watch.sh`
- `scripts/uninstall-hms-runtime-watch.sh`
- `docs/runtime-automation.md`
- `package.json`
- this Task Contract

## Required behavior

1. `AGENTS.md` contains durable protocol only; it must not hardcode mutable current phase/task/gate state.
2. A new runtime reconstructs authoritative state from `.orchestration/STATE.md`, `.orchestration/STATUS.json`, contracts, decisions and durable artifacts, without chat history.
3. If the next bounded increment is already authorized by accepted design but its contract is absent, Codex may create that contract before implementation without routine human confirmation.
4. `.orchestration/STATUS.json` provides a compact machine-readable signal including runtime status, explicit `resume_authorized`, current/last task, next action, event identity, Human Gate/blocker state and external-review request.
5. Before substantive execution Codex sets `runtime_status=RUNNING` and `resume_authorized=false`; before every exit it persists exact resumable/terminal state.
6. Routine runtime/session end may set `READY_TO_RESUME + resume_authorized=true + external_review.required=false` only when authorized routine work remains and no gate/blocker/review boundary is pending.
7. Human Gate, blocker, Human Action/Input, Product Acceptance and blocking external review require `resume_authorized=false`.
8. Routine task PASS does not force a Human Gate, Human confirmation or blocking external review.
9. The local dispatcher reads `origin/main` and launches Codex only when the full explicit dispatch condition is satisfied.
10. The dispatcher is fail-closed on dirty worktrees, unknown/ambiguous status, Gate/blocker/review state and concurrent execution.
11. Dispatcher idempotence prevents the same successful `event.id` from launching twice.
12. Dispatcher failure retry is bounded: default cooldown 30 minutes and maximum 2 attempts per event.
13. The one-command Codex resume path fails closed on dirty worktrees and does not automatically push uncommitted work.
14. The systemd user installer captures the real repository/executable paths, creates only user-scoped units/config, enables a roughly two-minute timer, and does NOT enable user lingering automatically.
15. Polling itself must not invoke Codex. Codex is invoked only for an explicitly authorized resume event.
16. The automation must not deploy Cloudflare resources, mutate remote D1, activate paid services, decide a Human Gate or weaken Product Acceptance boundaries.
17. Existing Option B, Free-tier cost guard and migration invariants remain unchanged.
18. The Human is not used as a routine message bus and the External Controller cannot self-approve this change.

## Explicit non-goals

- No product capability implementation.
- No CF-I03 implementation on this branch.
- No deployment or remote D1 mutation.
- No paid Codex/OpenAI API or external runner setup.
- No claim of real-time Codex → ChatGPT webhook delivery.
- No automatic Human Gate decision.
- No automatic `loginctl enable-linger`.

## Critic checks

The independent Critic must inspect the complete branch diff and test at minimum:
- stale/current-state hardcoding removed from `AGENTS.md`;
- `STATUS.json` is valid JSON and its `resume_authorized` / external review semantics are internally consistent;
- `RESUME_PROMPT.txt` is state-driven rather than task-specific;
- shell syntax for all new/changed scripts (`bash -n` or equivalent);
- dispatcher reads only `origin/main` as the canonical remote signal;
- dispatcher refuses dirty worktree, duplicate event, Gate/blocker/review and concurrent execution;
- retry/cooldown logic cannot create a rapid Codex quota-burning loop;
- installer uses `systemd --user`, has a bounded timer cadence and does not enable linger;
- package scripts point to the intended launch/install/uninstall scripts;
- no product files, paid/deployment changes or CF-I03 work are introduced;
- Human Gate, Critic independence, Free-tier and Product Acceptance semantics remain intact.

## Verdicts

Allowed: `PASS`, `REWORK`, `CONTRACT_DEFECT`, `TECHNICAL_BLOCKED`, legitimate `HUMAN_GATE`.

On `REWORK`: repair autonomously within this contract and require a fresh logically independent Critic. Default rework budget: 2 cycles.

On `PASS`: integrate through the normal Git path, reconcile `.orchestration/STATE.md` / `.orchestration/STATUS.json`, then install locally from updated `main` with `npm run runtime:install` and run a controlled dispatcher test before relying on unattended execution.

This Task Contract does not authorize CF-I03 product work on this branch.
