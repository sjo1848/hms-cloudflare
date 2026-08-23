#!/usr/bin/env bash
set -euo pipefail

GIT_BIN="${GIT_BIN:-$(command -v git || true)}"
CODEX_BIN="${CODEX_BIN:-$(command -v codex || true)}"

if [[ -z "$GIT_BIN" || ! -x "$GIT_BIN" ]]; then
  echo "git not found." >&2
  exit 10
fi
if [[ -z "$CODEX_BIN" || ! -x "$CODEX_BIN" ]]; then
  echo "codex not found. Install/login to Codex CLI before using runtime automation." >&2
  exit 11
fi

ROOT="$($GIT_BIN rev-parse --show-toplevel)"
cd "$ROOT"

if [[ -n "$($GIT_BIN status --porcelain)" ]]; then
  echo "Refusing to start Codex with a dirty worktree." >&2
  exit 2
fi

"$GIT_BIN" fetch origin main
"$GIT_BIN" switch main
"$GIT_BIN" pull --ff-only origin main

PROMPT="$(cat .orchestration/RESUME_PROMPT.txt)"

set +e
"$CODEX_BIN" exec --sandbox workspace-write "$PROMPT"
CODEX_STATUS=$?
set -e

if [[ $CODEX_STATUS -ne 0 ]]; then
  echo "Codex exited with status $CODEX_STATUS. Inspect .orchestration/STATUS.json and working tree before publishing." >&2
  exit "$CODEX_STATUS"
fi

if [[ -n "$($GIT_BIN status --porcelain)" ]]; then
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
