# HMS Cloudflare — Local Codex Runtime Automation

## Goal

Remove the Human from routine ChatGPT ↔ Codex handoffs while keeping Project Method gates intact.

```text
Codex runtime
    ↓ commit/push state
GitHub main/.orchestration/STATUS.json
    ↓
systemd --user timer (local, every ~2 min)
    ↓
scripts/hms-runtime-watch.sh
    ↓ only when explicitly authorized
npm run codex:resume
    ↓
Codex runtime

GitHub is also observed independently by ChatGPT Runtime Watch for material audit/gate events.
```

The local timer does not invoke Codex merely to check state. It uses Git/GitHub state only. Codex is invoked only after the dispatcher validates an explicitly resumable event.

## Dispatch condition

Automatic Codex resume requires ALL of the following in `origin/main:.orchestration/STATUS.json`:

- `runtime_status == "READY_TO_RESUME"`
- `resume_authorized == true`
- `external_review.required == false`
- `human_gate == null`
- `blocker == null`
- non-empty `event.id`
- non-empty `next_action`

Any Human Gate, blocker, Product Acceptance boundary or blocking external review must persist `resume_authorized=false`.

## Safety controls

- Reads the signal from `origin/main`, not an arbitrary local branch.
- Refuses automatic dispatch if the local worktree is dirty.
- Uses `flock` so only one dispatcher/runtime may be launched at a time.
- Uses `event.id` for idempotence; a successfully dispatched event is not launched twice.
- Failed dispatches have a default 30-minute cooldown and maximum 2 attempts per event.
- `codex:resume` itself refuses a dirty worktree, fast-forwards `main`, reads the canonical repository prompt, and never auto-pushes uncommitted work.
- No deploy, paid Cloudflare service, Human Gate decision or Product Acceptance is authorized by this automation.

## Install

Prerequisites available in the user shell:

- `git`
- `npm`
- authenticated `codex` CLI
- `python3`
- `flock`
- `systemctl --user`

From the HMS Cloudflare repository after this automation has been independently reviewed and merged:

```bash
cd /path/to/hms-cloudflare
git switch main
git pull --ff-only
npm run runtime:install
```

The installer records the repository's absolute path and executable locations, then creates:

```text
~/.config/systemd/user/hms-codex-dispatch.service
~/.config/systemd/user/hms-codex-dispatch.timer
~/.config/hms-cloudflare/runtime-watch.env
```

The timer uses approximately a two-minute cadence:

```ini
OnBootSec=2min
OnUnitActiveSec=2min
AccuracySec=20s
```

## Observe

Timer status:

```bash
systemctl --user status hms-codex-dispatch.timer
```

Recent dispatcher logs:

```bash
journalctl --user -u hms-codex-dispatch.service -n 50 --no-pager
```

Upcoming timers:

```bash
systemctl --user list-timers hms-codex-dispatch.timer
```

Run one safe check immediately:

```bash
systemctl --user start hms-codex-dispatch.service
```

If canonical status is not authorized, this command logs the reason and does not invoke Codex.

## Pause / resume

Pause automatic dispatch:

```bash
systemctl --user disable --now hms-codex-dispatch.timer
```

Resume it:

```bash
systemctl --user enable --now hms-codex-dispatch.timer
```

Remove the user service/timer:

```bash
npm run runtime:uninstall
```

Local retry/idempotence state is kept under:

```text
~/.local/state/hms-cloudflare/
```

The uninstall intentionally preserves it for auditability.

## Login/logout behavior

The installer does not enable systemd user lingering. Initial operation is intended while the user's systemd user manager is active (normally while logged in). If later we intentionally want the dispatcher to keep running after logout, `loginctl enable-linger <user>` can be evaluated as a separate operating decision.

## External ChatGPT monitoring

The local dispatcher and ChatGPT watcher have different roles:

- local systemd dispatcher: fast routine continuation, no Codex use while merely polling;
- ChatGPT Runtime Watch: slower independent audit of material milestones, Human Gates, blockers and Product Acceptance readiness.

A blocking external review sets `external_review.required=true` and `resume_authorized=false`, preventing local systemd from bypassing the controller boundary.
