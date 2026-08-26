# HMS Cloudflare — Runtime Continuity Contract

Status: `BINDING`

Purpose: make Codex session termination different from task termination so the Human is never used as the routine dispatcher.

## Execution ownership

- `origin/main` is canonical authorization/state.
- Managed implementation runs on `runtime/*`.
- Runtime checkpoints may be pushed to `runtime/*`; they are **not Artifact A**, are not PASS, and are not External Independent Critic boundaries.
- The host runner owns Git writes, checkpoint publication and final A/B publication during unattended execution.
- A historical canonical `work_branch: "main"` is treated as legacy/unset by the managed runner. New managed work derives or records a `runtime/*` branch.

## Session continuity

A Codex process/session may end while routine work remains. That does not return control to the Human.

When routine work remains, Codex must persist:

- `runtime_status=READY_TO_RESUME`
- `resume_authorized=true`
- `external_review.required=false`
- no Human Gate
- no blocker
- exact `next_action`

The host runner immediately relaunches Codex within the same managed invocation when practical. If a process/runtime limit is reached, the host creates a durable `runtime/*` checkpoint and the dispatcher relaunches the same canonical event automatically.

The dispatcher must **not** mark a canonical event terminal-success merely because one Codex process returned exit code 0. Terminal success requires a validated host handoff.

## Valid terminal handoffs

Only these stop unattended continuation:

1. `EXTERNAL_REVIEW` — mature substantive candidate; host publishes Artifact A to `main`, then orchestration-only Boundary B with the exact full A SHA and `WAITING_EXTERNAL_REVIEW`.
2. `HUMAN_GATE` — legitimate product/risk/cost/irreversible-action gate.
3. `BLOCKER` — material demonstrated blocker that cannot be resolved through ordinary technical REWORK.
4. Product Acceptance boundary when explicitly reached.

Ordinary test failures, migration failures, hangs under investigation, evidence repairs and internal QA findings stay inside autonomous REWORK.

## Publication topology

For external review:

`canonical main H → runtime checkpoints (optional) → Artifact A → Boundary B`

- Artifact A contains substantive implementation/tests/evidence.
- Boundary B is the direct child of A.
- B changes only orchestration publication metadata/state.
- B records the exact full SHA of A.
- Runtime checkpoints never substitute for A/B.

## Local-only files

Known intentionally local files must be ignored by Git so they cannot disable unattended dispatch. Root `install.sh` is local-only and must remain untracked/ignored.

## Failure safety

- Dirty managed worktrees are not auto-dispatched.
- Concurrent canonical-main movement aborts publication.
- Runtime branches are event-scoped.
- Repeated no-progress sessions are bounded; a resumable runtime checkpoint is preferred over inventing a blocker.
- The dispatcher has a checkpoint budget to prevent infinite unattended token consumption.
