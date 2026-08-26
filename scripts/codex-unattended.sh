#!/usr/bin/env bash
set -euo pipefail

GIT_BIN="${GIT_BIN:-$(command -v git || true)}"
CODEX_BIN="${CODEX_BIN:-$(command -v codex || true)}"
PYTHON_BIN="${PYTHON_BIN:-$(command -v python3 || true)}"
MAX_CONTINUATIONS="${HMS_CODEX_MAX_SESSION_CONTINUATIONS:-6}"
STAGNATION_LIMIT="${HMS_CODEX_STAGNATION_LIMIT:-2}"

log() { printf '[codex-unattended] %s\n' "$*"; }
die() { log "$1"; exit "${2:-1}"; }

for name in GIT_BIN CODEX_BIN PYTHON_BIN; do
  value="${!name:-}"
  [[ -n "$value" && -x "$value" ]] || die "required executable missing: $name" 10
done
[[ "$MAX_CONTINUATIONS" =~ ^[1-9][0-9]*$ ]] || die "HMS_CODEX_MAX_SESSION_CONTINUATIONS must be a positive integer" 11
[[ "$STAGNATION_LIMIT" =~ ^[1-9][0-9]*$ ]] || die "HMS_CODEX_STAGNATION_LIMIT must be a positive integer" 12

ROOT="$($GIT_BIN rev-parse --show-toplevel)"
cd "$ROOT"
STATE_HOME="${XDG_STATE_HOME:-$HOME/.local/state}/hms-cloudflare"
mkdir -p "$STATE_HOME"

[[ -z "$($GIT_BIN status --porcelain --untracked-files=all)" ]] || die "refusing managed dispatch with a dirty worktree" 20

"$GIT_BIN" fetch origin main --quiet || die "git fetch origin/main failed" 21
"$GIT_BIN" fetch origin '+refs/heads/runtime/*:refs/remotes/origin/runtime/*' --quiet || die "runtime branch discovery fetch failed" 22
"$GIT_BIN" switch main >/dev/null || die "cannot switch to main" 23
"$GIT_BIN" pull --ff-only origin main >/dev/null || die "local main is not a clean fast-forward of origin/main; preserve/rebase local work before enabling managed dispatch" 24

CANONICAL_HEAD="$($GIT_BIN rev-parse HEAD)"
if [[ -n "${HMS_EXPECTED_MAIN_HEAD:-}" && "$CANONICAL_HEAD" != "$HMS_EXPECTED_MAIN_HEAD" ]]; then
  die "canonical main changed after dispatcher validation" 25
fi

STATUS_PATH=".orchestration/STATUS.json"
STATE_PATH=".orchestration/STATE.md"
[[ -f "$STATUS_PATH" && -f "$STATE_PATH" ]] || die "canonical orchestration files missing" 26

read_status() {
  local path="$1"
  "$PYTHON_BIN" - "$path" <<'PY'
import json, sys
path = sys.argv[1]
with open(path, "r", encoding="utf-8") as fh:
    data = json.load(fh)
external = data.get("external_review")
event = data.get("event")
if not isinstance(data, dict) or data.get("schema_version") != 1:
    raise SystemExit("invalid schema")
if not isinstance(external, dict) or not isinstance(event, dict):
    raise SystemExit("invalid orchestration shape")
fields = [
    data.get("runtime_status"),
    data.get("resume_authorized"),
    external.get("required"),
    data.get("human_gate"),
    data.get("blocker"),
    event.get("id"),
    event.get("seq"),
    data.get("active_task"),
    data.get("work_branch"),
    data.get("next_action"),
]
for value in fields:
    if value is None:
        print("null")
    elif value is True:
        print("true")
    elif value is False:
        print("false")
    else:
        print(str(value))
PY
}

readarray -t C < <(read_status "$STATUS_PATH")
RUNTIME_STATUS="${C[0]:-}"
RESUME_AUTHORIZED="${C[1]:-false}"
EXTERNAL_REVIEW_REQUIRED="${C[2]:-true}"
HUMAN_GATE_STATE="${C[3]:-set}"
BLOCKER_STATE="${C[4]:-set}"
EVENT_ID="${C[5]:-}"
EVENT_SEQ="${C[6]:-0}"
ACTIVE_TASK="${C[7]:-}"
CANONICAL_WORK_BRANCH="${C[8]:-null}"
NEXT_ACTION="${C[9]:-}"

[[ "$RUNTIME_STATUS" == "READY_TO_RESUME" && "$RESUME_AUTHORIZED" == "true" &&
   "$EXTERNAL_REVIEW_REQUIRED" == "false" && "$HUMAN_GATE_STATE" == "null" &&
   "$BLOCKER_STATE" == "null" ]] || die "canonical state does not authorize unattended resume" 27
[[ "$EVENT_SEQ" =~ ^[1-9][0-9]*$ && -n "$EVENT_ID" && -n "$ACTIVE_TASK" && -n "$NEXT_ACTION" ]] ||
  die "canonical event/task/next_action invalid" 28
if [[ -n "${HMS_EXPECTED_EVENT_ID:-}" && "$EVENT_ID" != "$HMS_EXPECTED_EVENT_ID" ]]; then
  die "canonical event.id changed after dispatcher validation" 29
fi
if [[ -n "${HMS_EXPECTED_EVENT_SEQ:-}" && "$EVENT_SEQ" != "$HMS_EXPECTED_EVENT_SEQ" ]]; then
  die "canonical event.seq changed after dispatcher validation" 30
fi

TASK_SLUG="$("$PYTHON_BIN" - "$ACTIVE_TASK" <<'PY'
import re, sys
v = re.sub(r"[^a-z0-9._-]+", "-", sys.argv[1].strip().lower()).strip("-._")
if not v or len(v) > 80:
    raise SystemExit(1)
print(v)
PY
)" || die "active_task cannot be converted to a safe branch slug" 31

validate_runtime_branch() {
  "$PYTHON_BIN" - "$1" <<'PY'
import re, sys
b=sys.argv[1]
if not re.fullmatch(r"runtime/[A-Za-z0-9._/-]+", b):
    raise SystemExit(1)
if ".." in b or "//" in b or b.endswith("/"):
    raise SystemExit(1)
PY
}

# Compatibility: historical manual states used work_branch=main. Managed dispatch treats that as unset.
if [[ "$CANONICAL_WORK_BRANCH" == "null" || -z "$CANONICAL_WORK_BRANCH" || "$CANONICAL_WORK_BRANCH" == "main" ]]; then
  WORK_BRANCH="runtime/${TASK_SLUG}-${EVENT_SEQ}"
else
  WORK_BRANCH="$CANONICAL_WORK_BRANCH"
fi
validate_runtime_branch "$WORK_BRANCH" || die "unsafe runtime work branch: $WORK_BRANCH" 32

if "$GIT_BIN" show-ref --verify --quiet "refs/remotes/origin/$WORK_BRANCH"; then
  "$GIT_BIN" switch -C "$WORK_BRANCH" "origin/$WORK_BRANCH" >/dev/null
else
  "$GIT_BIN" switch -C "$WORK_BRANCH" "$CANONICAL_HEAD" >/dev/null
fi
BASE_WORK_HEAD="$($GIT_BIN rev-parse HEAD)"

BASE_PROMPT="$(cat .orchestration/RESUME_PROMPT.txt)"
HOST_PROMPT="$(cat <<EOF

HOST MANAGED RUNTIME IS ACTIVE.
Canonical main: $CANONICAL_HEAD
Event: $EVENT_ID (seq $EVENT_SEQ)
Active task: $ACTIVE_TASK
Managed work branch: $WORK_BRANCH

Do not perform Git write/network mutation commands. The host owns branch commits and publication.
An ordinary Codex session ending while routine work remains is NOT a task boundary. Persist READY_TO_RESUME/resume_authorized=true/external_review.required=false and the exact next action; this host runner will relaunch another session automatically.
Only a legitimate Human Gate, material blocker, Product Acceptance boundary, or external independent-review boundary ends the managed runtime loop.
When the substantive candidate is mature for external review, persist external_review.required=true, resume_authorized=false, and a truthful next action for host publication / External Independent Critic. Do not invent the artifact SHA.
EOF
)"

work_fingerprint() {
  {
    "$GIT_BIN" status --porcelain=v1 --untracked-files=all
    "$GIT_BIN" diff --no-ext-diff --binary HEAD --
    cat "$STATUS_PATH" 2>/dev/null || true
  } | sha256sum | awk '{print $1}'
}

classify_local_state() {
  readarray -t L < <(read_status "$STATUS_PATH")
  LOCAL_RUNTIME_STATUS="${L[0]:-}"
  LOCAL_RESUME="${L[1]:-false}"
  LOCAL_EXTERNAL="${L[2]:-true}"
  LOCAL_HUMAN_GATE="${L[3]:-set}"
  LOCAL_BLOCKER="${L[4]:-set}"
  LOCAL_EVENT_ID="${L[5]:-}"
  LOCAL_EVENT_SEQ="${L[6]:-0}"
  LOCAL_NEXT_ACTION="${L[9]:-}"
}

LAST_FINGERPRINT=""
STAGNANT=0
ITERATION=0
TERMINAL_KIND=""

while (( ITERATION < MAX_CONTINUATIONS )); do
  ITERATION=$((ITERATION + 1))
  log "starting Codex session $ITERATION/$MAX_CONTINUATIONS on $WORK_BRANCH"
  set +e
  HMS_HOST_GIT_BRIDGE=1 \
  HMS_CANONICAL_MAIN_HEAD="$CANONICAL_HEAD" \
  HMS_WORK_BRANCH="$WORK_BRANCH" \
    "$CODEX_BIN" exec --sandbox workspace-write "$BASE_PROMPT$HOST_PROMPT"
  RC=$?
  set -e
  [[ $RC -eq 0 ]] || die "Codex session exited with status $RC; managed runner will not publish partial output" "$RC"

  [[ "$($GIT_BIN branch --show-current)" == "$WORK_BRANCH" ]] || die "Codex changed the managed branch unexpectedly" 40
  classify_local_state

  if [[ "$LOCAL_HUMAN_GATE" != "null" ]]; then
    TERMINAL_KIND="HUMAN_GATE"
    break
  fi
  if [[ "$LOCAL_BLOCKER" != "null" ]]; then
    TERMINAL_KIND="BLOCKER"
    break
  fi
  if [[ "$LOCAL_EXTERNAL" == "true" && "$LOCAL_RESUME" == "false" ]]; then
    TERMINAL_KIND="EXTERNAL_REVIEW"
    break
  fi

  if [[ "$LOCAL_RUNTIME_STATUS" == "READY_TO_RESUME" && "$LOCAL_RESUME" == "true" && "$LOCAL_EXTERNAL" == "false" ]]; then
    FP="$(work_fingerprint)"
    if [[ "$FP" == "$LAST_FINGERPRINT" ]]; then
      STAGNANT=$((STAGNANT + 1))
    else
      STAGNANT=0
      LAST_FINGERPRINT="$FP"
    fi
    if (( STAGNANT >= STAGNATION_LIMIT )); then
      log "managed sessions made no durable progress; creating resumable runtime checkpoint"
      TERMINAL_KIND="RESUMABLE_CHECKPOINT"
      break
    fi
    log "routine work remains: ${LOCAL_NEXT_ACTION:-<unspecified>}; relaunching automatically"
    continue
  fi

  die "Codex exited without a valid resumable or terminal orchestration state" 41
done

if [[ -z "$TERMINAL_KIND" ]]; then
  TERMINAL_KIND="RESUMABLE_CHECKPOINT"
fi

[[ -n "$($GIT_BIN status --porcelain --untracked-files=all)" ]] ||
  die "managed run reached $TERMINAL_KIND without repository changes" 42
"$GIT_BIN" diff --check || die "working-tree diff check failed" 43
"$GIT_BIN" add -A
"$GIT_BIN" diff --cached --check || die "staged diff check failed" 44
"$GIT_BIN" diff --cached --quiet && die "no staged changes available for managed publication" 45

PARENT_HEAD="$($GIT_BIN rev-parse HEAD)"
TREE_HEAD="$($GIT_BIN write-tree)"
CHECKPOINT_HEAD="$(printf 'runtime: %s event %s %s\n' "$ACTIVE_TASK" "$EVENT_SEQ" "$TERMINAL_KIND" | "$GIT_BIN" commit-tree "$TREE_HEAD" -p "$PARENT_HEAD")"
[[ "$CHECKPOINT_HEAD" =~ ^[0-9a-f]{40}$ ]] || die "failed to create managed runtime commit" 46
"$GIT_BIN" update-ref "refs/heads/$WORK_BRANCH" "$CHECKPOINT_HEAD" "$PARENT_HEAD"
"$GIT_BIN" reset --hard "$CHECKPOINT_HEAD" >/dev/null
"$GIT_BIN" push --set-upstream origin "${CHECKPOINT_HEAD}:refs/heads/$WORK_BRANCH" >/dev/null ||
  die "failed to publish managed runtime branch" 47

ORIGIN_MAIN_NOW="$($GIT_BIN rev-parse origin/main)"
[[ "$ORIGIN_MAIN_NOW" == "$CANONICAL_HEAD" ]] || die "origin/main changed during managed runtime; refusing canonical publication" 48

write_handoff() {
  local canonical_head="$1"
  local payload_head="$2"
  local kind="$3"
  printf '%s\t%s\t%s\t%s\t%s\t%s\n' \
    "$EVENT_SEQ" "$EVENT_ID" "$canonical_head" "$WORK_BRANCH" "$payload_head" "$kind" \
    > "$STATE_HOME/published-handoff"
}

publish_state_boundary() {
  local kind="$1"
  local payload_head="$2"
  local base_for_state="$3"

  "$GIT_BIN" switch -C main "$base_for_state" >/dev/null

  ARTIFACT_HEAD="$payload_head" \
  TERMINAL_KIND="$kind" \
  WORK_BRANCH="$WORK_BRANCH" \
  ACTIVE_TASK="$ACTIVE_TASK" \
  CANONICAL_EVENT_SEQ="$EVENT_SEQ" \
  "$PYTHON_BIN" - "$STATUS_PATH" "$STATE_PATH" <<'PY'
import json, os, re, subprocess, sys
status_path, state_path = sys.argv[1], sys.argv[2]
artifact = os.environ["ARTIFACT_HEAD"]
kind = os.environ["TERMINAL_KIND"]
work_branch = os.environ["WORK_BRANCH"]
task = os.environ["ACTIVE_TASK"]
canonical_seq = int(os.environ["CANONICAL_EVENT_SEQ"])
seq = canonical_seq + 1

with open(status_path, "r", encoding="utf-8") as fh:
    s = json.load(fh)

if kind != "EXTERNAL_REVIEW":
    branch_raw = subprocess.check_output(
        ["git", "show", f"{work_branch}:{status_path}"], text=True
    )
    branch_status = json.loads(branch_raw)
    s.update(branch_status)

external = s.setdefault("external_review", {})
event = s.setdefault("event", {})

if kind == "EXTERNAL_REVIEW":
    s["runtime_status"] = "WAITING_EXTERNAL_REVIEW"
    s["resume_authorized"] = False
    s["last_completed_head"] = artifact
    s["work_branch"] = None
    s["next_action"] = f"EXTERNAL_INDEPENDENT_CRITIC_REVIEW_{task}_{artifact}"
    event.update({
        "seq": seq,
        "id": f"{task}@ARTIFACT-{artifact[:12]}-PUBLISHED",
        "type": "ARTIFACT_READY_EXTERNAL_REVIEW",
    })
    external["required"] = True
    external["artifact_head"] = artifact
    external["pending_verdict"] = "INDEPENDENT_CRITIC_REVIEW_REQUIRED"
    s["human_gate"] = None
    s["blocker"] = None
else:
    s["resume_authorized"] = False
    s["work_branch"] = work_branch
    external["required"] = False
    external["artifact_head"] = None
    external["pending_verdict"] = None
    event.update({
        "seq": seq,
        "id": f"{task}@{kind}-{artifact[:12]}",
        "type": kind,
    })
    if not s.get("next_action"):
        s["next_action"] = kind

with open(status_path, "w", encoding="utf-8") as fh:
    json.dump(s, fh, indent=2, ensure_ascii=False)
    fh.write("\n")

with open(state_path, "r", encoding="utf-8") as fh:
    text = fh.read()
start = "<!-- HOST-RUNTIME-BOUNDARY:START -->"
end = "<!-- HOST-RUNTIME-BOUNDARY:END -->"
block = (
    f"{start}\n"
    f"## Host Runtime Boundary\n\n"
    f"- Kind: `{kind}`\n"
    f"- Runtime payload: `{artifact}`\n"
    f"- Runtime branch: `{work_branch}`\n"
    f"- Canonical status: `{s['runtime_status']}`\n"
    f"- Next action: `{s['next_action']}`\n"
    f"{end}"
)
pattern = re.compile(re.escape(start) + r".*?" + re.escape(end), re.S)
if pattern.search(text):
    text = pattern.sub(block, text)
else:
    text = text.rstrip() + "\n\n" + block + "\n"
with open(state_path, "w", encoding="utf-8") as fh:
    fh.write(text)
PY

  "$GIT_BIN" add "$STATUS_PATH" "$STATE_PATH"
  "$GIT_BIN" diff --cached --check || die "canonical boundary diff check failed" 49
  local state_tree
  state_tree="$($GIT_BIN write-tree)"
  local boundary_head
  boundary_head="$(printf 'orchestration: publish %s boundary for %s\n' "$kind" "$ACTIVE_TASK" | "$GIT_BIN" commit-tree "$state_tree" -p "$base_for_state")"
  [[ "$boundary_head" =~ ^[0-9a-f]{40}$ ]] || die "failed to create canonical state boundary" 50
  "$GIT_BIN" update-ref refs/heads/main "$boundary_head" "$base_for_state"
  "$GIT_BIN" reset --hard "$boundary_head" >/dev/null
  "$GIT_BIN" push origin "${boundary_head}:refs/heads/main" >/dev/null || die "failed to publish canonical state boundary" 51
  write_handoff "$boundary_head" "$payload_head" "$kind"
  log "canonical boundary published kind=$kind main=$boundary_head payload=$payload_head branch=$WORK_BRANCH"
}

if [[ "$TERMINAL_KIND" == "RESUMABLE_CHECKPOINT" ]]; then
  "$GIT_BIN" switch main >/dev/null
  "$GIT_BIN" reset --hard "$CANONICAL_HEAD" >/dev/null
  write_handoff "$CANONICAL_HEAD" "$CHECKPOINT_HEAD" "RESUMABLE_CHECKPOINT"
  log "runtime checkpoint published branch=$WORK_BRANCH head=$CHECKPOINT_HEAD; canonical event remains resumable"
elif [[ "$TERMINAL_KIND" == "EXTERNAL_REVIEW" ]]; then
  "$GIT_BIN" push origin "${CHECKPOINT_HEAD}:refs/heads/main" >/dev/null ||
    die "failed to fast-forward Artifact A onto main" 52
  "$GIT_BIN" fetch origin main --quiet
  publish_state_boundary "EXTERNAL_REVIEW" "$CHECKPOINT_HEAD" "$CHECKPOINT_HEAD"
else
  publish_state_boundary "$TERMINAL_KIND" "$CHECKPOINT_HEAD" "$CANONICAL_HEAD"
fi

log "HOST_MANAGED_RUNTIME_COMPLETE event=$EVENT_ID seq=$EVENT_SEQ kind=$TERMINAL_KIND"
