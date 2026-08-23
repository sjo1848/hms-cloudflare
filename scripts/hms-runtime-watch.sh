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

if [[ -n "$($GIT_BIN status --porcelain)" ]]; then
  log "local worktree is dirty; refusing automatic dispatch"
  exit 0
fi

if ! "$GIT_BIN" fetch origin main --quiet; then
  log "git fetch failed; leaving runtime untouched"
  exit 0
fi

STATUS_JSON="$($GIT_BIN show origin/main:.orchestration/STATUS.json 2>/dev/null || true)"
if [[ -z "$STATUS_JSON" ]]; then
  log "origin/main has no readable .orchestration/STATUS.json; skipping"
  exit 0
fi

readarray -t STATUS_FIELDS < <(
  STATUS_JSON="$STATUS_JSON" "$PYTHON_BIN" - <<'PY'
import json, os, sys
try:
    data = json.loads(os.environ["STATUS_JSON"])
except Exception as exc:
    print(f"ERROR:{exc}")
    sys.exit(0)

def b(v):
    return "true" if v is True else "false"

print(str(data.get("runtime_status") or ""))
print(b(data.get("resume_authorized")))
print(b((data.get("external_review") or {}).get("required")))
print("null" if data.get("human_gate") is None else "set")
print("null" if data.get("blocker") is None else "set")
print(str((data.get("event") or {}).get("id") or ""))
print(str(data.get("next_action") or ""))
PY
)

if [[ "${STATUS_FIELDS[0]:-}" == ERROR:* ]]; then
  log "STATUS.json is invalid: ${STATUS_FIELDS[0]}"
  exit 0
fi

RUNTIME_STATUS="${STATUS_FIELDS[0]:-}"
RESUME_AUTHORIZED="${STATUS_FIELDS[1]:-false}"
EXTERNAL_REVIEW_REQUIRED="${STATUS_FIELDS[2]:-false}"
HUMAN_GATE_STATE="${STATUS_FIELDS[3]:-set}"
BLOCKER_STATE="${STATUS_FIELDS[4]:-set}"
EVENT_ID="${STATUS_FIELDS[5]:-}"
NEXT_ACTION="${STATUS_FIELDS[6]:-}"

if [[ "$RUNTIME_STATUS" != "READY_TO_RESUME" ]]; then
  log "runtime_status=$RUNTIME_STATUS; no automatic resume"
  exit 0
fi
if [[ "$RESUME_AUTHORIZED" != "true" ]]; then
  log "resume_authorized=false; waiting for canonical authorization"
  exit 0
fi
if [[ "$EXTERNAL_REVIEW_REQUIRED" == "true" ]]; then
  log "external review is required; dispatcher will not bypass it"
  exit 0
fi
if [[ "$HUMAN_GATE_STATE" != "null" || "$BLOCKER_STATE" != "null" ]]; then
  log "Human Gate or blocker present; dispatcher will not launch Codex"
  exit 0
fi
if [[ -z "$EVENT_ID" || -z "$NEXT_ACTION" ]]; then
  log "missing event.id or next_action; refusing ambiguous resume"
  exit 0
fi

SUCCESS_FILE="$STATE_HOME/last-success-event"
ATTEMPT_FILE="$STATE_HOME/attempt-state"
if [[ -f "$SUCCESS_FILE" ]] && [[ "$(cat "$SUCCESS_FILE")" == "$EVENT_ID" ]]; then
  log "event already dispatched successfully: $EVENT_ID"
  exit 0
fi

NOW="$(date +%s)"
ATTEMPTS=0
LAST_TS=0
LAST_EVENT=""
if [[ -f "$ATTEMPT_FILE" ]]; then
  IFS=$'\t' read -r LAST_EVENT ATTEMPTS LAST_TS < "$ATTEMPT_FILE" || true
  ATTEMPTS="${ATTEMPTS:-0}"
  LAST_TS="${LAST_TS:-0}"
fi
if [[ "$LAST_EVENT" != "$EVENT_ID" ]]; then
  ATTEMPTS=0
  LAST_TS=0
fi
if (( ATTEMPTS >= MAX_ATTEMPTS )); then
  log "retry budget exhausted for event $EVENT_ID; manual diagnosis required"
  exit 0
fi
if (( LAST_TS > 0 && NOW - LAST_TS < COOLDOWN_SECONDS )); then
  log "cooldown active for event $EVENT_ID; skipping"
  exit 0
fi

ATTEMPTS=$((ATTEMPTS + 1))
printf '%s\t%s\t%s\n' "$EVENT_ID" "$ATTEMPTS" "$NOW" > "$ATTEMPT_FILE"
log "dispatching Codex for event=$EVENT_ID next_action=$NEXT_ACTION attempt=$ATTEMPTS/$MAX_ATTEMPTS"

set +e
"$NPM_BIN" run codex:resume
RC=$?
set -e

if [[ $RC -eq 0 ]]; then
  printf '%s\n' "$EVENT_ID" > "$SUCCESS_FILE"
  rm -f "$ATTEMPT_FILE"
  log "Codex dispatch completed successfully for $EVENT_ID"
  exit 0
fi

log "Codex dispatch failed with status $RC; retry allowed after cooldown if worktree remains clean"
exit "$RC"
