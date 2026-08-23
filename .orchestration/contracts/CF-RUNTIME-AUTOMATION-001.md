# Task Contract — CF-RUNTIME-AUTOMATION-001

Status: `READY_FOR_INDEPENDENT_CRITIC`
Mode: `DELIVERY / method-governance tooling`
Author: External Project Controller
Required reviewer: logically independent Codex Critic

## Objective

Review the proposed runtime handoff/watch automation changes so future Codex sessions can reconstruct and continue work from durable repository state without the Human copying a custom resume prompt after each runtime end.

## Artifact under review

Branch: `chore/runtime-handoff-automation`
Base: `main@24a1e68a8df8fd7251586415619045f287e2c95a`

Expected changed artifacts:
- `AGENTS.md`
- `.orchestration/STATUS.json`
- `.orchestration/RESUME_PROMPT.txt`
- `scripts/codex-resume.sh`
- `package.json`
- this Task Contract

## Required behavior

1. `AGENTS.md` must contain durable protocol only; it must not hardcode mutable current phase/task/gate state.
2. A new runtime must reconstruct the authoritative state from `.orchestration/STATE.md`, `.orchestration/STATUS.json`, contracts, decisions and durable artifacts, without chat history.
3. If the next increment is already authorized by accepted design but its contract is absent, Codex may create the contract before implementation without asking routine human confirmation.
4. `.orchestration/STATUS.json` must provide a compact machine-readable signal sufficient for an external watcher to identify runtime end, current/last task, next action, Human Gate/blocker state and whether external review is requested.
5. Codex must update state/status before every runtime exit.
6. Routine task PASS must not force a Human Gate or Human confirmation.
7. The one-command resume path must fail closed on dirty worktrees and must not automatically push uncommitted work.
8. The launcher must not activate paid services, deploy Cloudflare resources or weaken Project Method gates.
9. Existing Option B, Free-tier cost guard, Product Acceptance boundary and migration invariants must remain unchanged.
10. The automation must not make the Human a message bus and must not let the External Controller self-approve this change.

## Explicit non-goals

- No product capability implementation.
- No CF-I03 implementation.
- No deployment or remote D1 mutation.
- No paid Codex/OpenAI API or external runner setup.
- No claim of real-time Codex → ChatGPT webhook delivery.
- No automatic Human Gate decision.

## Critic checks

The independent Critic must inspect the complete branch diff and test at minimum:
- stale/current-state hardcoding removed from `AGENTS.md`;
- `STATUS.json` is valid JSON and matches the current accepted state after CF-I02;
- `RESUME_PROMPT.txt` is state-driven rather than task-specific;
- shell launcher syntax and fail-closed behavior are reasonable;
- package script points to the launcher;
- the launcher uses the repository prompt rather than embedding a mutable task;
- no product files or paid/deployment changes are introduced;
- Human Gate, Critic independence and Product Acceptance semantics remain intact.

## Verdicts

Allowed: `PASS`, `REWORK`, `CONTRACT_DEFECT`, `TECHNICAL_BLOCKED`, legitimate `HUMAN_GATE`.

On `REWORK`: repair autonomously within this contract and require a fresh logically independent Critic. Default rework budget: 2 cycles.

On `PASS`: integrate through the normal Git path, reconcile `.orchestration/STATE.md`/`.orchestration/STATUS.json`, then future local Codex resumes may use `npm run codex:resume`.

This Task Contract does not authorize CF-I03 product work on this branch.
