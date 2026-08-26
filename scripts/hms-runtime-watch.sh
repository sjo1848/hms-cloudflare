#!/usr/bin/env bash
set -euo pipefail

ROOT="${HMS_REPO_ROOT:-$(git rev-parse --show-toplevel 2>/dev/null || true)}"
GIT_BIN="${GIT_BIN:-$(command -v git || true)}"
NPM_BIN="${NPM_BIN:-$(command -v npm || true)}"
PYTHON_BIN="${PYTHON_BIN:-$(command -v python3 || true)}"
FLOCK_BIN="${FLOCK_BIN:-$(command -v flock || true)}"
COOLDOWN_SECONDS="${HMS_DISPATCH_COOLDOWN_SECONDS:-1800}"
MAX_ATTEMPTS="${HMS_DISPATCH_MAX_ATTEMPTS:-2}"
MAX_CHECKPOINTS="${HMS_DISPATCH_MAX_CHECKPOINTS:-20}"

log() { printf '[hms-dispatch] %s\n' "$*"; }

for name in GIT_BIN NPM_BIN PYTHON_BIN FLOCK_BIN; do
  value="${!name:-}"
  if [[ -z "$value" || ! -x "$value" ]]; then
    log "required executable missing: $name"
    exit 10
  fi
done

if [[ -z "$ROOT" || ! -d "$ROOT/.git" ]]; then
  log "invalid HMS_REPO_ROOT: ${ROOT:-<empty>}"
  exit 11
fi
cd "$ROOT"

STATE_HOME="${XDG_STATE_HOME:-$HOME/.local/state}/hms-cloudflare"
mkdir -p "$STATE_HOME"
LOCK_FILE="${XDG_RUNTIME_DIR:-/tmp}/hms-codex-dispatch-${UID}.lock"
exec 9>"$LOCK_FILE"
if ! "$FLOCK_BIN" -n 9; then
  log "another dispatcher/runtime owns the lock; skipping"
  exit 0
fi

if [[ -n "$($GIT_BIN status --porcelain --untracked-files=all)" ]]; then
  log "local worktree is dirty; refusing automatic dispatch"
  exit 0
fi

if ! "$GIT_BIN" fetch origin main --quiet; then
  log "git fetch failed; leaving runtime untouched"
  exit 0
fi

CANONICAL_HEAD="$($GIT_BIN rev-parse origin/main 2>/dev/null || true)"
if [[ -z "$CANONICAL_HEAD" ]]; then
  log "cannot resolve origin/main; skipping"
  exit 0
fi

STATUS_JSON="$($GIT_BIN show "$CANONICAL_HEAD":.orchestration/STATUS.json 2>/dev/null || true)"
if [[ -z "$STATUS_JSON" ]]; then
  log "origin/main has no readable .orchestration/STATUS.json; skipping"
  exit 0
fi

readarray -t STATUS_FIELDS < <(
  STATUS_JSON="$STATUS_JSON" "$PYTHON_BIN" - <<'PY'
import hashlib, json, os
def fail(msg):
    print(f"ERROR:{msg}")
    raise SystemExit(0)
raw=os.environ["STATUS_JSON"]
try:
    data=json.loads(raw)
except Exception as exc:
    fail(f"invalid json: {exc}")
external=data.get("external_review")
event=data.get("event")
if not isinstance(data,dict) or data.get("schema_version") != 1:
    fail("invalid schema")
if not isinstance(external,dict) or not isinstance(event,dict):
    fail("invalid orchestration shape")
required=[
    data.get("runtime_status"),
    data.get("resume_authorized"),
    external.get("required"),
    event.get("id"),
    event.get("seq"),
    data.get("next_action"),
]
if not isinstance(required[0],str) or type(required[1]) is not bool or type(required[2]) is not bool:
    fail("invalid runtime fields")
if not isinstance(required[3],str) or type(required[4]) is not int or required[4] <= 0 or not isinstance(required[5],str):
    fail("invalid event fields")
print(data["runtime_status"])
print("true" if data["resume_authorized"] else "false")
print("true" if external["required"] else "false")
print("null" if data.get("human_gate") is None else "set")
print("null" if data.get("blocker") is None else "set")
print(event["id"])
print(str(event["seq"]))
print(data["next_action"])
print(hashlib.sha256(raw.encode()).hexdigest())
PY
)

if [[ "${STATUS_FIELDS[0]:-}" == ERROR:* ]]; then
  log "STATUS.json rejected: ${STATUS_FIELDS[0]}"
  exit 0
fi

RUNTIME_STATUS="${STATUS_FIELDS[0]:-}"
RESUME_AUTHORIZED="${STATUS_FIELDS[1]:-false}"
EXTERNAL_REVIEW_REQUIRED="${STATUS_FIELDS[2]:-true}"
HUMAN_GATE_STATE="${STATUS_FIELDS[3]:-set}"
BLOCKER_STATE="${STATUS_FIELDS[4]:-set}"
EVENT_ID="${STATUS_FIELDS[5]:-}"
EVENT_SEQ="${STATUS_FIELDS[6]:-0}"
NEXT_ACTION="${STATUS_FIELDS[7]:-}"
STATUS_HASH="${STATUS_FIELDS[8]:-}"

if [[ "$RUNTIME_STATUS" != "READY_TO_RESUME" || "$RESUME_AUTHORIZED" != "true" ||
      "$EXTERNAL_REVIEW_REQUIRED" != "false" || "$HUMAN_GATE_STATE" != "null" ||
      "$BLOCKER_STATE" != "null" ]]; then
  log "canonical state does not authorize unattended resume"
  exit 0
fi

OBSERVED_FILE="$STATE_HOME/highest-observed-event"
if [[ -f "$OBSERVED_FILE" ]]; then
  IFS=$'\t' read -r OLD_SEQ OLD_EVENT OLD_HASH < "$OBSERVED_FILE" || {
    log "cannot parse highest-observed-event"; exit 0;
  }
  if (( EVENT_SEQ < OLD_SEQ )); then
    log "event.seq=$EVENT_SEQ is older than highest observed seq=$OLD_SEQ; refusing rollback"
    exit 0
  fi
  if (( EVENT_SEQ == OLD_SEQ )) && [[ "$EVENT_ID" != "$OLD_EVENT" || "$STATUS_HASH" != "$OLD_HASH" ]]; then
    log "event seq=$EVENT_SEQ changed identity/state without seq advance; refusing"
    exit 0
  fi
fi
printf '%s\t%s\t%s\n' "$EVENT_SEQ" "$EVENT_ID" "$STATUS_HASH" > "$OBSERVED_FILE"

SUCCESS_FILE="$STATE_HOME/success-state"
if [[ -f "$SUCCESS_FILE" ]]; then
  IFS=$'\t' read -r LAST_SUCCESS_SEQ LAST_SUCCESS_EVENT < "$SUCCESS_FILE" || {
    log "cannot parse success-state"; exit 0;
  }
  if [[ "$LAST_SUCCESS_SEQ" =~ ^[0-9]+$ ]] && (( EVENT_SEQ <= LAST_SUCCESS_SEQ )); then
    log "event.seq=$EVENT_SEQ is not newer than last terminal success seq=$LAST_SUCCESS_SEQ"
    exit 0
  fi
fi

ATTEMPT_FILE="$STATE_HOME/attempt-state"
NOW="$(date +%s)"
ATTEMPTS=0
LAST_TS=0
LAST_EVENT=""
LAST_ATTEMPT_SEQ=0
if [[ -f "$ATTEMPT_FILE" ]]; then
  IFS=$'\t' read -r LAST_EVENT LAST_ATTEMPT_SEQ ATTEMPTS LAST_TS < "$ATTEMPT_FILE" || {
    log "cannot parse attempt-state"; exit 0;
  }
fi
if [[ "$LAST_EVENT" != "$EVENT_ID" || "$LAST_ATTEMPT_SEQ" != "$EVENT_SEQ" ]]; then
  ATTEMPTS=0
  LAST_TS=0
fi
if (( ATTEMPTS >= MAX_ATTEMPTS )); then
  log "failure retry budget exhausted for event $EVENT_ID seq=$EVENT_SEQ"
  exit 0
fi
if (( LAST_TS > 0 && NOW - LAST_TS < COOLDOWN_SECONDS )); then
  log "failure cooldown active for event $EVENT_ID; skipping"
  exit 0
fi

HANDOFF_FILE="$STATE_HOME/published-handoff"
rm -f "$HANDOFF_FILE"
ATTEMPTS=$((ATTEMPTS + 1))
printf '%s\t%s\t%s\t%s\n' "$EVENT_ID" "$EVENT_SEQ" "$ATTEMPTS" "$NOW" > "$ATTEMPT_FILE"
log "dispatching event=$EVENT_ID seq=$EVENT_SEQ next_action=$NEXT_ACTION attempt=$ATTEMPTS/$MAX_ATTEMPTS"

set +e
HMS_EXPECTED_MAIN_HEAD="$CANONICAL_HEAD" \
HMS_EXPECTED_EVENT_ID="$EVENT_ID" \
HMS_EXPECTED_EVENT_SEQ="$EVENT_SEQ" \
  "$NPM_BIN" run codex:resume
RC=$?
set -e

if [[ $RC -ne 0 ]]; then
  log "managed Codex runner failed with status $RC; retry allowed after cooldown"
  exit "$RC"
fi

if [[ ! -f "$HANDOFF_FILE" ]]; then
  log "managed runner returned success without a durable handoff; treating as failure"
  exit 60
fi

IFS=$'\t' read -r H_SEQ H_EVENT H_CANONICAL H_BRANCH H_PAYLOAD H_KIND < "$HANDOFF_FILE" || {
  log "cannot parse managed handoff"; exit 61;
}
if [[ "$H_SEQ" != "$EVENT_SEQ" || "$H_EVENT" != "$EVENT_ID" ||
      ! "$H_CANONICAL" =~ ^[0-9a-f]{40}$ || ! "$H_PAYLOAD" =~ ^[0-9a-f]{40}$ ||
      ! "$H_BRANCH" =~ ^runtime/ ]]; then
  log "managed handoff does not match dispatched event"
  exit 62
fi

if [[ "$H_KIND" == "RESUMABLE_CHECKPOINT" ]]; then
  CHECKPOINT_FILE="$STATE_HOME/checkpoint-state"
  COUNT=0
  C_EVENT=""
  C_SEQ=0
  if [[ -f "$CHECKPOINT_FILE" ]]; then
    IFS=$'\t' read -r C_EVENT C_SEQ COUNT < "$CHECKPOINT_FILE" || {
      log "cannot parse checkpoint-state"; exit 63;
    }
  fi
  if [[ "$C_EVENT" != "$EVENT_ID" || "$C_SEQ" != "$EVENT_SEQ" ]]; then
    COUNT=0
  fi
  COUNT=$((COUNT + 1))
  printf '%s\t%s\t%s\n' "$EVENT_ID" "$EVENT_SEQ" "$COUNT" > "$CHECKPOINT_FILE"
  rm -f "$ATTEMPT_FILE"
  if (( COUNT >= MAX_CHECKPOINTS )); then
    log "runtime checkpoint budget exhausted ($COUNT/$MAX_CHECKPOINTS) for event $EVENT_ID; preserving checkpoint $H_PAYLOAD"
    exit 0
  fi
  log "runtime checkpoint $COUNT/$MAX_CHECKPOINTS persisted at $H_PAYLOAD; same event will resume automatically"
  exit 0
fi

printf '%s\t%s\n' "$EVENT_SEQ" "$EVENT_ID" > "$SUCCESS_FILE"
rm -f "$ATTEMPT_FILE" "$STATE_HOME/checkpoint-state"
log "terminal managed handoff completed kind=$H_KIND payload=$H_PAYLOAD canonical=$H_CANONICAL"
exit 0
