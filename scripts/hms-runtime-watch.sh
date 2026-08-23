#!/usr/bin/env bash
set -euo pipefail

ROOT="${HMS_REPO_ROOT:-$(git rev-parse --show-toplevel 2>/dev/null || true)}"
GIT_BIN="${GIT_BIN:-$(command -v git || true)}"
NPM_BIN="${NPM_BIN:-$(command -v npm || true)}"
PYTHON_BIN="${PYTHON_BIN:-$(command -v python3 || true)}"
FLOCK_BIN="${FLOCK_BIN:-$(command -v flock || true)}"
COOLDOWN_SECONDS="${HMS_DISPATCH_COOLDOWN_SECONDS:-1800}"
MAX_ATTEMPTS="${HMS_DISPATCH_MAX_ATTEMPTS:-2}"

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
external = data.get("external_review")
if not isinstance(external, dict) or type(external.get("required")) is not bool:
    fail("external_review.required must be boolean")
event = data.get("event")
if not isinstance(event, dict):
    fail("event must be object")
if not isinstance(event.get("id"), str) or not event["id"]:
    fail("event.id must be non-empty string")
if type(event.get("seq")) is not int or event["seq"] <= 0:
    fail("event.seq must be positive integer")
if not isinstance(data.get("next_action"), str) or not data["next_action"]:
    fail("next_action must be non-empty string")

print(data["runtime_status"])
print("true" if data["resume_authorized"] else "false")
print("true" if external["required"] else "false")
print("null" if data.get("human_gate") is None else "set")
print("null" if data.get("blocker") is None else "set")
print(event["id"])
print(str(event["seq"]))
print(data["next_action"])
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

if [[ "$RUNTIME_STATUS" != "READY_TO_RESUME" ]]; then
  log "runtime_status=$RUNTIME_STATUS; no automatic resume"
  exit 0
fi
if [[ "$RESUME_AUTHORIZED" != "true" ]]; then
  log "resume_authorized=false; waiting for canonical authorization"
  exit 0
fi
if [[ "$EXTERNAL_REVIEW_REQUIRED" != "false" ]]; then
  log "external review state is not explicitly false; dispatcher will not bypass it"
  exit 0
fi
if [[ "$HUMAN_GATE_STATE" != "null" || "$BLOCKER_STATE" != "null" ]]; then
  log "Human Gate or blocker present; dispatcher will not launch Codex"
  exit 0
fi
if [[ -z "$EVENT_ID" || "$EVENT_SEQ" -le 0 || -z "$NEXT_ACTION" ]]; then
  log "missing/invalid event or next_action; refusing ambiguous resume"
  exit 0
fi

SUCCESS_FILE="$STATE_HOME/success-state"
ATTEMPT_FILE="$STATE_HOME/attempt-state"
LAST_SUCCESS_SEQ=0
LAST_SUCCESS_EVENT=""
if [[ -f "$SUCCESS_FILE" ]]; then
  if ! IFS=$'\t' read -r LAST_SUCCESS_SEQ LAST_SUCCESS_EVENT < "$SUCCESS_FILE"; then
    log "cannot parse success-state; refusing automatic dispatch"
    exit 0
  fi
  if [[ ! "$LAST_SUCCESS_SEQ" =~ ^[0-9]+$ ]]; then
    log "invalid success-state sequence; refusing automatic dispatch"
    exit 0
  fi
fi
if (( EVENT_SEQ <= LAST_SUCCESS_SEQ )); then
  log "event.seq=$EVENT_SEQ is not newer than last successful seq=$LAST_SUCCESS_SEQ; refusing replay"
  exit 0
fi

NOW="$(date +%s)"
ATTEMPTS=0
LAST_TS=0
LAST_EVENT=""
LAST_ATTEMPT_SEQ=0
if [[ -f "$ATTEMPT_FILE" ]]; then
  if ! IFS=$'\t' read -r LAST_EVENT LAST_ATTEMPT_SEQ ATTEMPTS LAST_TS < "$ATTEMPT_FILE"; then
    log "cannot parse attempt-state; refusing automatic dispatch"
    exit 0
  fi
  if [[ ! "$LAST_ATTEMPT_SEQ" =~ ^[0-9]+$ || ! "$ATTEMPTS" =~ ^[0-9]+$ || ! "$LAST_TS" =~ ^[0-9]+$ ]]; then
    log "invalid attempt-state; refusing automatic dispatch"
    exit 0
  fi
fi
if [[ "$LAST_EVENT" != "$EVENT_ID" || "$LAST_ATTEMPT_SEQ" != "$EVENT_SEQ" ]]; then
  ATTEMPTS=0
  LAST_TS=0
fi
if (( ATTEMPTS >= MAX_ATTEMPTS )); then
  log "retry budget exhausted for event $EVENT_ID seq=$EVENT_SEQ; manual diagnosis required"
  exit 0
fi
if (( LAST_TS > 0 && NOW - LAST_TS < COOLDOWN_SECONDS )); then
  log "cooldown active for event $EVENT_ID; skipping"
  exit 0
fi

ATTEMPTS=$((ATTEMPTS + 1))
printf '%s\t%s\t%s\t%s\n' "$EVENT_ID" "$EVENT_SEQ" "$ATTEMPTS" "$NOW" > "$ATTEMPT_FILE"
log "dispatching Codex for event=$EVENT_ID seq=$EVENT_SEQ next_action=$NEXT_ACTION attempt=$ATTEMPTS/$MAX_ATTEMPTS"

set +e
HMS_EXPECTED_MAIN_HEAD="$CANONICAL_HEAD" \
HMS_EXPECTED_EVENT_ID="$EVENT_ID" \
HMS_EXPECTED_EVENT_SEQ="$EVENT_SEQ" \
  "$NPM_BIN" run codex:resume
RC=$?
set -e

if [[ $RC -eq 0 ]]; then
  printf '%s\t%s\n' "$EVENT_SEQ" "$EVENT_ID" > "$SUCCESS_FILE"
  rm -f "$ATTEMPT_FILE"
  log "Codex dispatch completed successfully for $EVENT_ID"
  exit 0
fi

log "Codex dispatch failed with status $RC; retry allowed after cooldown if canonical state still authorizes it"
exit "$RC"
