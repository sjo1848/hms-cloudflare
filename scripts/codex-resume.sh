#!/usr/bin/env bash
set -euo pipefail

GIT_BIN="${GIT_BIN:-$(command -v git || true)}"
CODEX_BIN="${CODEX_BIN:-$(command -v codex || true)}"
PYTHON_BIN="${PYTHON_BIN:-$(command -v python3 || true)}"

log() { printf '[codex-resume] %s\n' "$*"; }

for name in GIT_BIN CODEX_BIN PYTHON_BIN; do
  value="${!name:-}"
  if [[ -z "$value" || ! -x "$value" ]]; then
    log "required executable missing: $name"
    exit 10
  fi
done

ROOT="$($GIT_BIN rev-parse --show-toplevel)"
cd "$ROOT"
STATE_HOME="${XDG_STATE_HOME:-$HOME/.local/state}/hms-cloudflare"
mkdir -p "$STATE_HOME"

if [[ -n "$($GIT_BIN status --porcelain --untracked-files=all)" ]]; then
  log "refusing to start Codex with a dirty worktree"
  exit 2
fi

if ! "$GIT_BIN" fetch origin main --quiet; then
  log "git fetch origin/main failed"
  exit 11
fi
if ! "$GIT_BIN" fetch origin '+refs/heads/runtime/*:refs/remotes/origin/runtime/*' --quiet; then
  log "runtime branch discovery fetch failed"
  exit 12
fi

"$GIT_BIN" switch main >/dev/null
"$GIT_BIN" pull --ff-only origin main >/dev/null

CURRENT_HEAD="$($GIT_BIN rev-parse HEAD)"
if [[ -n "${HMS_EXPECTED_MAIN_HEAD:-}" && "$CURRENT_HEAD" != "$HMS_EXPECTED_MAIN_HEAD" ]]; then
  log "canonical main changed after dispatcher validation; refusing stale authorization"
  exit 20
fi

STATUS_JSON="$($GIT_BIN show "$CURRENT_HEAD":.orchestration/STATUS.json 2>/dev/null || true)"
if [[ -z "$STATUS_JSON" ]]; then
  log "canonical main has no readable .orchestration/STATUS.json"
  exit 21
fi

readarray -t STATUS_FIELDS < <(
  STATUS_JSON="$STATUS_JSON" "$PYTHON_BIN" - <<'PY'
import json, os

def fail(msg):
    print(f"ERROR:{msg}")
    raise SystemExit(0)

try:
    data = json.loads(os.environ["STATUS_JSON"])
except Exception as exc:
    fail(f"invalid json: {exc}")

if not isinstance(data, dict):
    fail("root must be object")
if type(data.get("schema_version")) is not int or data["schema_version"] != 1:
    fail("unsupported schema_version")
if not isinstance(data.get("runtime_status"), str) or not data["runtime_status"]:
    fail("runtime_status must be non-empty string")
if type(data.get("resume_authorized")) is not bool:
    fail("resume_authorized must be boolean")
if not isinstance(data.get("active_task"), str) or not data["active_task"].strip():
    fail("active_task must be non-empty string")
external = data.get("external_review")
if not isinstance(external, dict) or type(external.get("required")) is not bool:
    fail("external_review.required must be boolean")
if "human_gate" not in data or "blocker" not in data:
    fail("human_gate and blocker keys must be present")
event = data.get("event")
if not isinstance(event, dict):
    fail("event must be object")
if not isinstance(event.get("id"), str) or not event["id"]:
    fail("event.id must be non-empty string")
if type(event.get("seq")) is not int or event["seq"] <= 0:
    fail("event.seq must be positive integer")
if not isinstance(data.get("next_action"), str) or not data["next_action"]:
    fail("next_action must be non-empty string")
work_branch = data.get("work_branch")
if work_branch is not None and (not isinstance(work_branch, str) or not work_branch.strip()):
    fail("work_branch must be null/absent or non-empty string")

print(data["runtime_status"])
print("true" if data["resume_authorized"] else "false")
print("true" if external["required"] else "false")
print("null" if data["human_gate"] is None else "set")
print("null" if data["blocker"] is None else "set")
print(event["id"])
print(str(event["seq"]))
print(data["active_task"].strip())
print(work_branch.strip() if isinstance(work_branch, str) else "")
PY
)

if [[ "${STATUS_FIELDS[0]:-}" == ERROR:* ]]; then
  log "STATUS.json rejected: ${STATUS_FIELDS[0]}"
  exit 22
fi

RUNTIME_STATUS="${STATUS_FIELDS[0]:-}"
RESUME_AUTHORIZED="${STATUS_FIELDS[1]:-false}"
EXTERNAL_REVIEW_REQUIRED="${STATUS_FIELDS[2]:-true}"
HUMAN_GATE_STATE="${STATUS_FIELDS[3]:-set}"
BLOCKER_STATE="${STATUS_FIELDS[4]:-set}"
EVENT_ID="${STATUS_FIELDS[5]:-}"
EVENT_SEQ="${STATUS_FIELDS[6]:-0}"
ACTIVE_TASK="${STATUS_FIELDS[7]:-}"
CANONICAL_WORK_BRANCH="${STATUS_FIELDS[8]:-}"

if [[ "$RUNTIME_STATUS" != "READY_TO_RESUME" || "$RESUME_AUTHORIZED" != "true" || "$EXTERNAL_REVIEW_REQUIRED" != "false" || "$HUMAN_GATE_STATE" != "null" || "$BLOCKER_STATE" != "null" ]]; then
  log "canonical status no longer authorizes unattended resume"
  exit 23
fi
if [[ -n "${HMS_EXPECTED_EVENT_ID:-}" && "$EVENT_ID" != "$HMS_EXPECTED_EVENT_ID" ]]; then
  log "canonical event.id changed after dispatcher validation"
  exit 24
fi
if [[ -n "${HMS_EXPECTED_EVENT_SEQ:-}" && "$EVENT_SEQ" != "$HMS_EXPECTED_EVENT_SEQ" ]]; then
  log "canonical event.seq changed after dispatcher validation"
  exit 25
fi

TASK_SLUG="$($PYTHON_BIN - "$ACTIVE_TASK" <<'PY'
import re, sys
value = sys.argv[1].strip().lower()
value = re.sub(r"[^a-z0-9._-]+", "-", value).strip("-._")
if not value or len(value) > 80:
    raise SystemExit(1)
print(value)
PY
)" || {
  log "active_task cannot be converted to a safe branch slug"
  exit 26
}

EVENT_KEY="$($PYTHON_BIN - "$EVENT_ID" <<'PY'
import hashlib, sys
print(hashlib.sha256(sys.argv[1].encode("utf-8")).hexdigest())
PY
)"

validate_work_branch() {
  local branch="$1"
  "$PYTHON_BIN" - "$branch" <<'PY'
import re, sys
branch = sys.argv[1]
if not re.fullmatch(r"runtime/[A-Za-z0-9._/-]+", branch):
    raise SystemExit(1)
if ".." in branch or "//" in branch or branch.endswith("/") or branch.startswith("runtime/-"):
    raise SystemExit(1)
PY
}

if [[ -n "$CANONICAL_WORK_BRANCH" ]]; then
  WORK_BRANCH="$CANONICAL_WORK_BRANCH"
else
  WORK_BRANCH="runtime/${TASK_SLUG}-${EVENT_SEQ}"
fi
if ! validate_work_branch "$WORK_BRANCH"; then
  log "unsafe work branch: $WORK_BRANCH"
  exit 27
fi
if [[ "$WORK_BRANCH" == "main" ]]; then
  log "main can never be a runtime work branch"
  exit 28
fi

CLAIM_FILE="$STATE_HOME/event-${EVENT_SEQ}.claim"
CLAIM_SEQ=""
CLAIM_EVENT_KEY=""
CLAIM_MAIN_HEAD=""
CLAIM_BRANCH=""
CLAIM_BASE_HEAD=""
CLAIM_ARTIFACT_HEAD=""

write_claim() {
  local artifact_head="$1"
  local tmp="$CLAIM_FILE.tmp.$$"
  printf '%s\t%s\t%s\t%s\t%s\t%s\n' \
    "$EVENT_SEQ" "$EVENT_KEY" "$CURRENT_HEAD" "$WORK_BRANCH" "$BASE_WORK_HEAD" "$artifact_head" > "$tmp"
  mv "$tmp" "$CLAIM_FILE"
}

if [[ -f "$CLAIM_FILE" ]]; then
  if ! IFS=$'\t' read -r CLAIM_SEQ CLAIM_EVENT_KEY CLAIM_MAIN_HEAD CLAIM_BRANCH CLAIM_BASE_HEAD CLAIM_ARTIFACT_HEAD < "$CLAIM_FILE"; then
    log "cannot parse event ownership claim"
    exit 29
  fi
  if [[ ! "$CLAIM_SEQ" =~ ^[0-9]+$ || ! "$CLAIM_EVENT_KEY" =~ ^[0-9a-f]{64}$ || ! "$CLAIM_MAIN_HEAD" =~ ^[0-9a-f]{40}$ || ! "$CLAIM_BASE_HEAD" =~ ^[0-9a-f]{40}$ ]]; then
    log "invalid event ownership claim"
    exit 30
  fi
  if [[ "$CLAIM_ARTIFACT_HEAD" != "-" && ! "$CLAIM_ARTIFACT_HEAD" =~ ^[0-9a-f]{40}$ ]]; then
    log "invalid claimed artifact head"
    exit 31
  fi
  if [[ "$CLAIM_SEQ" != "$EVENT_SEQ" || "$CLAIM_EVENT_KEY" != "$EVENT_KEY" || "$CLAIM_MAIN_HEAD" != "$CURRENT_HEAD" || "$CLAIM_BRANCH" != "$WORK_BRANCH" ]]; then
    log "event ownership claim does not match canonical dispatch"
    exit 32
  fi
  BASE_WORK_HEAD="$CLAIM_BASE_HEAD"
else
  if [[ -n "$CANONICAL_WORK_BRANCH" ]]; then
    if ! "$GIT_BIN" show-ref --verify --quiet "refs/remotes/origin/$WORK_BRANCH"; then
      log "canonical work_branch does not exist on origin: $WORK_BRANCH"
      exit 33
    fi
    BASE_WORK_HEAD="$($GIT_BIN rev-parse "origin/$WORK_BRANCH")"
  else
    if "$GIT_BIN" show-ref --verify --quiet "refs/heads/$WORK_BRANCH" || "$GIT_BIN" show-ref --verify --quiet "refs/remotes/origin/$WORK_BRANCH"; then
      log "derived work branch already exists without an ownership claim: $WORK_BRANCH"
      exit 34
    fi
    BASE_WORK_HEAD="$CURRENT_HEAD"
  fi
  write_claim "-"
  CLAIM_ARTIFACT_HEAD="-"
fi

finalize_handoff() {
  local artifact_head="$1"
  local handoff_tmp="$STATE_HOME/published-handoff.tmp.$$"
  local handoff_file="$STATE_HOME/published-handoff"
  printf '%s\t%s\t%s\t%s\t%s\t%s\n' \
    "$EVENT_SEQ" "$EVENT_ID" "$CURRENT_HEAD" "$WORK_BRANCH" "$artifact_head" "$ACTIVE_TASK" > "$handoff_tmp"
  mv "$handoff_tmp" "$handoff_file"
}

recover_claimed_artifact() {
  local artifact_head="$1"
  if ! "$GIT_BIN" cat-file -e "${artifact_head}^{commit}" 2>/dev/null; then
    log "claimed artifact commit is missing locally; refusing ambiguous recovery"
    exit 35
  fi
  local parent_head
  parent_head="$($GIT_BIN rev-parse "${artifact_head}^")"
  if [[ "$parent_head" != "$BASE_WORK_HEAD" ]]; then
    log "claimed artifact parent does not match claimed work base"
    exit 36
  fi

  if "$GIT_BIN" show-ref --verify --quiet "refs/remotes/origin/$WORK_BRANCH"; then
    local remote_head
    remote_head="$($GIT_BIN rev-parse "origin/$WORK_BRANCH")"
    if [[ "$remote_head" == "$artifact_head" ]]; then
      finalize_handoff "$artifact_head"
      log "HOST_GIT_ALREADY_PUBLISHED event=$EVENT_ID seq=$EVENT_SEQ branch=$WORK_BRANCH head=$artifact_head"
      exit 0
    fi
    if [[ "$remote_head" != "$BASE_WORK_HEAD" ]]; then
      log "remote runtime branch moved away from the claimed base/artifact; refusing overwrite"
      exit 37
    fi
  elif [[ -n "$CANONICAL_WORK_BRANCH" ]]; then
    log "canonical rework branch disappeared from origin; refusing recovery"
    exit 38
  fi

  "$GIT_BIN" push --set-upstream origin "${artifact_head}:refs/heads/$WORK_BRANCH" >/dev/null
  finalize_handoff "$artifact_head"
  log "HOST_GIT_PUBLISHED_RECOVERY event=$EVENT_ID seq=$EVENT_SEQ branch=$WORK_BRANCH head=$artifact_head"
  exit 0
}

if [[ "$CLAIM_ARTIFACT_HEAD" != "-" ]]; then
  recover_claimed_artifact "$CLAIM_ARTIFACT_HEAD"
fi

if [[ -n "$CANONICAL_WORK_BRANCH" ]]; then
  if ! "$GIT_BIN" show-ref --verify --quiet "refs/remotes/origin/$WORK_BRANCH"; then
    log "canonical work_branch does not exist on origin: $WORK_BRANCH"
    exit 39
  fi
  REMOTE_WORK_HEAD="$($GIT_BIN rev-parse "origin/$WORK_BRANCH")"
  if [[ "$REMOTE_WORK_HEAD" != "$BASE_WORK_HEAD" ]]; then
    log "canonical work_branch changed after event claim; refusing stale rework base"
    exit 40
  fi
  "$GIT_BIN" switch -C "$WORK_BRANCH" "$BASE_WORK_HEAD" >/dev/null
else
  if "$GIT_BIN" show-ref --verify --quiet "refs/remotes/origin/$WORK_BRANCH"; then
    log "new-event runtime branch appeared on origin without a published artifact claim"
    exit 41
  fi
  if "$GIT_BIN" show-ref --verify --quiet "refs/heads/$WORK_BRANCH"; then
    LOCAL_WORK_HEAD="$($GIT_BIN rev-parse "$WORK_BRANCH")"
    if [[ "$LOCAL_WORK_HEAD" != "$BASE_WORK_HEAD" ]]; then
      log "claimed local runtime branch moved before artifact publication"
      exit 42
    fi
    "$GIT_BIN" switch -C "$WORK_BRANCH" "$BASE_WORK_HEAD" >/dev/null
  else
    "$GIT_BIN" switch -c "$WORK_BRANCH" "$BASE_WORK_HEAD" >/dev/null
  fi
fi

if [[ "$($GIT_BIN branch --show-current)" != "$WORK_BRANCH" ]]; then
  log "work branch boundary invalid before Codex launch"
  exit 43
fi

BASE_PROMPT="$(cat .orchestration/RESUME_PROMPT.txt)"
HOST_BRIDGE_PROMPT="$(cat <<EOF

HOST GIT BRIDGE IS ACTIVE FOR THIS UNATTENDED RUN.
Canonical dispatch authorization was validated from origin/main@$CURRENT_HEAD for event $EVENT_ID (seq $EVENT_SEQ), active task $ACTIVE_TASK.
Expected work branch: $WORK_BRANCH.

Git metadata is intentionally protected by the Codex workspace-write sandbox. This is expected and is NOT a blocker. You may use read-only Git inspection (for example status, diff, log, show), including read-only inspection of origin/main. Do NOT run Git write/network mutation commands: fetch, pull, switch, checkout, add, commit, merge, rebase, reset, branch/ref mutation, or push. The trusted host launcher owns those operations after you exit successfully.

When branch-local STATE/STATUS differs from canonical main, use read-only git show origin/main:.orchestration/STATE.md and git show origin/main:.orchestration/STATUS.json to understand the canonical dispatch decision, then use the work branch for implementation artifacts.

Implement or rework only the authorized task and run relevant local non-destructive validation. If substantive changes are ready for immutable publication, stop BEFORE independent Critic review because the host must first create the immutable commit. Persist branch-local STATE.md and STATUS.json so they accurately say host publication / ChatGPT independent review is next; set resume_authorized=false and external_review.required=true for that review boundary. Do not classify read-only .git as BLOCKED. Do not invoke @codex review. Legitimate unrelated Human Gates/blockers/Product Acceptance boundaries still apply normally.
EOF
)"

set +e
HMS_HOST_GIT_BRIDGE=1 \
HMS_CANONICAL_MAIN_HEAD="$CURRENT_HEAD" \
HMS_WORK_BRANCH="$WORK_BRANCH" \
  "$CODEX_BIN" exec --sandbox workspace-write "$BASE_PROMPT$HOST_BRIDGE_PROMPT"
CODEX_STATUS=$?
set -e

if [[ $CODEX_STATUS -ne 0 ]]; then
  log "Codex exited with status $CODEX_STATUS; host will not commit or push dirty output"
  exit "$CODEX_STATUS"
fi

CURRENT_BRANCH="$($GIT_BIN branch --show-current)"
if [[ "$CURRENT_BRANCH" != "$WORK_BRANCH" || "$CURRENT_BRANCH" == "main" ]]; then
  log "branch changed unexpectedly after Codex run; refusing publication"
  exit 44
fi

if [[ -z "$($GIT_BIN status --porcelain --untracked-files=all)" ]]; then
  log "Codex exited successfully with no repository changes; refusing to manufacture an empty runtime artifact"
  exit 45
fi

if ! "$GIT_BIN" diff --check; then
  log "working-tree diff check failed; refusing publication"
  exit 46
fi

"$GIT_BIN" add -A
if "$GIT_BIN" diff --cached --quiet; then
  log "no staged changes after host add; refusing publication"
  exit 47
fi
if ! "$GIT_BIN" diff --cached --check; then
  log "staged diff check failed; refusing publication"
  exit 48
fi

PARENT_HEAD="$($GIT_BIN rev-parse HEAD)"
if [[ "$PARENT_HEAD" != "$BASE_WORK_HEAD" ]]; then
  log "runtime branch parent changed before immutable publication"
  exit 49
fi
TREE_HEAD="$($GIT_BIN write-tree)"
PUBLISHED_HEAD="$(printf 'runtime: %s event %s\n' "$ACTIVE_TASK" "$EVENT_SEQ" | "$GIT_BIN" commit-tree "$TREE_HEAD" -p "$PARENT_HEAD")"
if [[ ! "$PUBLISHED_HEAD" =~ ^[0-9a-f]{40}$ ]]; then
  log "failed to create immutable runtime commit"
  exit 50
fi

write_claim "$PUBLISHED_HEAD"
"$GIT_BIN" update-ref "refs/heads/$WORK_BRANCH" "$PUBLISHED_HEAD" "$PARENT_HEAD"

if [[ "$($GIT_BIN branch --show-current)" != "$WORK_BRANCH" || "$($GIT_BIN rev-parse HEAD)" != "$PUBLISHED_HEAD" ]]; then
  log "branch boundary invalid after immutable commit creation"
  exit 51
fi
if [[ -n "$($GIT_BIN status --porcelain --untracked-files=all)" ]]; then
  log "worktree is not clean after host commit; refusing push"
  exit 52
fi

"$GIT_BIN" push --set-upstream origin "${PUBLISHED_HEAD}:refs/heads/$WORK_BRANCH" >/dev/null
finalize_handoff "$PUBLISHED_HEAD"

log "HOST_GIT_PUBLISHED event=$EVENT_ID seq=$EVENT_SEQ branch=$WORK_BRANCH head=$PUBLISHED_HEAD"
