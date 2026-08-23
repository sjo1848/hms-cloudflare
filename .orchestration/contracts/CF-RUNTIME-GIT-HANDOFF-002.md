# TASK CONTRACT — CF-RUNTIME-GIT-HANDOFF-002

TASK ID: `CF-RUNTIME-GIT-HANDOFF-002`  
PROJECT: HMS Cloudflare  
GLOBAL PROJECT MODE: `DELIVERY`  
PHASE: `BUILD`  
ROLE: `RUNTIME INFRASTRUCTURE REPAIR`  
STATUS: `READY_FOR_INDEPENDENT_CRITIC`

## OBJECTIVE

Repair the local unattended Codex runtime after the first real CF-I03 dispatch proved that `codex exec --sandbox workspace-write` can edit the repository workspace but cannot write protected Git metadata such as `.git/FETCH_HEAD` and `.git/index.lock`.

Keep Codex inside `workspace-write`. Do not solve the incident by granting unrestricted filesystem or shell access. Move branch creation, immutable commit creation and push to the trusted host-side launcher while preserving fail-closed dispatch, canonical `origin/main` authorization, event idempotence, Human Gates, blockers and independent review boundaries.

## OBSERVED INCIDENT

The first automatic product dispatch successfully followed:

`GitHub main state → systemd timer → dispatcher → Codex`

Codex then implemented and locally validated CF-I03, but could not create the required Git commit because `.git` is intentionally protected by the sandbox. The launcher correctly refused to push the resulting dirty worktree. The artifact was preserved once by a manual recovery commit; repeated Human recovery is not acceptable.

## REQUIRED DESIGN

### Canonical authorization

- `origin/main:.orchestration/STATUS.json` remains the only unattended-dispatch authorization signal.
- Existing strict schema, gate/blocker, external-review, event-sequence and stale-main checks remain binding.
- The launcher must parse an explicit non-empty `active_task`.
- `work_branch` is optional in canonical status:
  - absent/null means create one new deterministic runtime branch for the authorized event;
  - when present it must be an explicitly safe `runtime/...` branch and is the only branch that may be resumed.

### Git ownership boundary

During host-bridge execution:

- Codex may use read-only Git inspection but MUST NOT perform Git writes or Git network mutations (`fetch`, `pull`, `switch`, `checkout`, `add`, `commit`, `merge`, `rebase`, `reset`, `push`, branch/ref mutation).
- Read-only `.git` is expected and MUST NOT itself be recorded as a runtime blocker.
- The trusted host launcher owns:
  - synchronization of canonical `main`;
  - creation/resume of the bounded runtime work branch;
  - immutable commit creation after a successful Codex exit;
  - push of that work branch.
- The host launcher MUST NEVER automatically commit product changes directly to `main`.
- The host launcher MUST NEVER auto-merge a product branch.

### New event / new work branch

If canonical status does not provide `work_branch`:

1. derive `runtime/<safe-active-task-slug>-<event.seq>`;
2. refuse an unrelated pre-existing local/remote branch with that name;
3. persist an event-ownership claim before the runtime branch is used;
4. create the local branch from the exact validated canonical main HEAD;
5. run Codex on that branch under `workspace-write`.

A retry may reuse the deterministic branch only when the persisted ownership claim proves the same event id/seq, canonical main head, branch and work-base identity.

### Rework / resumed work branch

If canonical status provides `work_branch`:

1. require it to match the allowed `runtime/...` namespace;
2. fetch the runtime branch outside the Codex sandbox;
3. claim the exact remote work-base head for the event;
4. switch/reset the local work branch to that claimed remote head only while the worktree is clean;
5. run Codex on that branch;
6. never silently select another branch.

Canonical dispatch state still comes from `origin/main`; branch-local state/artifacts are work evidence. The runtime prompt must tell Codex to inspect canonical main state read-only when branch-local state differs.

### Host publication after Codex

After Codex exits:

- non-zero Codex exit: do not commit or push newly dirty work; fail closed for diagnosis/retry policy;
- zero exit + dirty worktree:
  - verify the current branch is exactly the expected runtime branch and is not `main`;
  - stage all controlled workspace changes;
  - run diff checks;
  - create one immutable host commit whose single parent is the claimed work-base head;
  - persist the artifact commit identity in the local event claim before moving/pushing the branch ref;
  - push only the expected runtime branch;
  - persist a local handoff record containing event id/seq, canonical main head, work branch and published head;
- zero exit + no changes: refuse an ambiguous new-branch publication rather than manufacturing an empty artifact.

If the process or network fails after the immutable commit exists but before publication is acknowledged, a later retry must recover the exact claimed artifact without rerunning Codex, provided the remote branch is still either at the claimed base or the exact artifact. Any different remote movement fails closed rather than overwriting it.

The published work branch is an immutable artifact boundary suitable for later ChatGPT Independent Critic / PR review. Independent Critic approval is not manufactured by the launcher.

## CODEX EXIT PROTOCOL UNDER HOST BRIDGE

The runtime instructions must explicitly tell Codex:

- `.git` write protection is intentional;
- do not attempt Git writes or Git network mutations;
- implement/rework only the authorized task;
- run local non-destructive validation;
- if substantive changes are ready for immutable publication, stop before independent Critic because the host must first create the immutable commit;
- persist branch-local state indicating host publication / ChatGPT independent review is next;
- a legitimate Human Gate, blocker, Human Action/Input or Product Acceptance boundary still overrides routine continuation;
- do not self-PASS substantive work;
- do not trigger `@codex review`.

## REQUIRED ACCEPTANCE

| Requirement | Acceptance | Evidence |
|---|---|---|
| Preserve sandbox | Codex still runs with `--sandbox workspace-write`; no Full Access workaround. | launcher diff + runtime instructions |
| No Git writes by Codex | prompt/AGENTS explicitly assign Git mutations to host bridge. | prompt + AGENTS review |
| New branch isolation | new event creates deterministic `runtime/...` branch from exact validated main with event ownership. | shell review |
| Rework branch isolation | only explicit safe `work_branch` and exact claimed base may be resumed. | parser/branch validation |
| Host immutable artifact | successful dirty Codex output becomes one host commit and is pushed only on the expected non-main work branch. | launcher review |
| Publication retry | commit/push interruption can recover the exact claimed artifact without rerunning Codex or requiring Human relay. | claim/recovery control-flow review |
| Failure fail-close | non-zero Codex exit never auto-commits/pushes newly dirty output. | shell control-flow evidence |
| No auto merge | launcher cannot merge product work to main. | diff review |
| Existing gates preserved | main authorization, gate/blocker/external-review/stale-event checks remain. | regression review |
| Auditability | local claim + published-handoff record preserve canonical/event/branch/base/artifact identity. | launcher evidence |
| Review quota policy | Independent Critic is performed by ChatGPT through GitHub; routine `@codex review` is not used. | AGENTS + contract review |

## FORBIDDEN ACTIONS

- `danger-full-access` / unrestricted Codex execution as the incident fix.
- weakening Human Gate, blocker, Product Acceptance or external-review rules.
- automatic product commit to `main`.
- automatic product merge.
- force-pushing a runtime artifact over unexpected remote movement.
- paid service, remote D1 mutation, deployment or CF-I03 product changes in this runtime repair.
- treating sandbox-protected `.git` as writable through permission hacks.
- routine `@codex review` for Independent Critic work.

## REQUIRED REVIEW

This controller-authored runtime repair MUST receive a fresh independent ChatGPT Critic on its exact current head before integration. The Critic reads the PR/diff, contract and canonical evidence through GitHub and does not trigger Codex review quota.

Critic focus:

- shell quoting/branch injection;
- ambiguous branch ownership/collision;
- stale canonical main authorization;
- accidental commit/push to main;
- committing after failed Codex execution;
- dirty-worktree loss/reset;
- commit/push crash recovery and event idempotence;
- rework branch selection;
- any path that grants Codex broader filesystem permissions than `workspace-write`;
- any new Human message-bus dependency;
- mismatch between branch-local review state and canonical `main` authorization.

## DONE WHEN

The repair receives a fresh ChatGPT Independent Critic PASS, is integrated into `main`, the local repository pulls the updated scripts, and a controlled probe demonstrates that host Git publication can preserve a sandboxed Codex artifact without manual commit/push. Unattended product continuation remains disabled until that probe succeeds.
