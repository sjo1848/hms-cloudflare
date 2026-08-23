#!/usr/bin/env bash
set -euo pipefail

GIT_BIN="${GIT_BIN:-$(command -v git || true)}"
CODEX_BIN="${CODEX_BIN:-$(command -v codex || true)}"
PYTHON_BIN="${PYTHON_BIN:-$(command -v python3 || true)}"

for name in GIT_BIN CODEX_BIN PYTHON_BIN; do
  value="${!name:-}"
  if [[ -z "$value" || ! -x "$value" ]]; then
    echo "required executable missing: $name" >&2
    exit 10
  fi
done

ROOT="$($GIT_BIN rev-parse --show-toplevel)"
cd "$ROOT"

if [[ -n "$($GIT_BIN status --porcelain --untracked-files=all)" ]]; then
  echo "Refusing to start Codex with a dirty worktree." >&2
  exit 2
fi

"$GIT_BIN" fetch origin main
"$GIT_BIN" switch main
"$GIT_BIN" pull --ff-only origin main

CURRENT_HEAD="$($GIT_BIN rev-parse HEAD)"
if [[ -n "${HMS_EXPECTED_MAIN_HEAD:-}" && "$CURRENT_HEAD" != "$HMS_EXPECTED_MAIN_HEAD" ]]; then
  echo "Canonical main changed after dispatcher validation; refusing stale authorization." >&2
  exit 20
fi

STATUS_JSON="$($GIT_BIN show HEAD:.orchestration/STATUS.json 2>/dev/null || true)"
if [[ -z "$STATUS_JSON" ]]; then
  echo "Canonical main has no readable .orchestration/STATUS.json." >&2
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

print(data["runtime_status"])
print("true" if data["resume_authorized"] else "false")
print("true" if external["required"] else "false")
print("null" if data["human_gate"] is None else "set")
print("null" if data["blocker"] is None else "set")
print(event["id"])
print(str(event["seq"]))
PY
)

if [[ "${STATUS_FIELDS[0]:-}" == ERROR:* ]]; then
  echo "STATUS.json rejected: ${STATUS_FIELDS[0]}" >&2
  exit 22
fi

RUNTIME_STATUS="${STATUS_FIELDS[0]:-}"
RESUME_AUTHORIZED="${STATUS_FIELDS[1]:-false}"
EXTERNAL_REVIEW_REQUIRED="${STATUS_FIELDS[2]:-true}"
HUMAN_GATE_STATE="${STATUS_FIELDS[3]:-set}"
BLOCKER_STATE="${STATUS_FIELDS[4]:-set}"
EVENT_ID="${STATUS_FIELDS[5]:-}"
EVENT_SEQ="${STATUS_FIELDS[6]:-0}"

if [[ "$RUNTIME_STATUS" != "READY_TO_RESUME" || "$RESUME_AUTHORIZED" != "true" || "$EXTERNAL_REVIEW_REQUIRED" != "false" || "$HUMAN_GATE_STATE" != "null" || "$BLOCKER_STATE" != "null" ]]; then
  echo "Canonical status no longer authorizes unattended resume; refusing Codex launch." >&2
  exit 23
fi
if [[ -n "${HMS_EXPECTED_EVENT_ID:-}" && "$EVENT_ID" != "$HMS_EXPECTED_EVENT_ID" ]]; then
  echo "Canonical event.id changed after dispatcher validation; refusing stale authorization." >&2
  exit 24
fi
if [[ -n "${HMS_EXPECTED_EVENT_SEQ:-}" && "$EVENT_SEQ" != "$HMS_EXPECTED_EVENT_SEQ" ]]; then
  echo "Canonical event.seq changed after dispatcher validation; refusing stale authorization." >&2
  exit 25
fi

PROMPT="$(cat .orchestration/RESUME_PROMPT.txt)"

set +e
"$CODEX_BIN" exec --sandbox workspace-write "$PROMPT"
CODEX_STATUS=$?
set -e

if [[ $CODEX_STATUS -ne 0 ]]; then
  echo "Codex exited with status $CODEX_STATUS. Inspect .orchestration/STATUS.json and working tree before publishing." >&2
  exit "$CODEX_STATUS"
fi

if [[ -n "$($GIT_BIN status --porcelain --untracked-files=all)" ]]; then
  echo "Codex exited successfully but left uncommitted changes. Not pushing automatically." >&2
  exit 3
fi

CURRENT_BRANCH="$($GIT_BIN branch --show-current)"
if [[ -z "$CURRENT_BRANCH" ]]; then
  echo "Detached HEAD after Codex run. Not pushing automatically." >&2
  exit 4
fi

"$GIT_BIN" push origin "$CURRENT_BRANCH"
echo "Codex runtime finished. Published branch: $CURRENT_BRANCH"
