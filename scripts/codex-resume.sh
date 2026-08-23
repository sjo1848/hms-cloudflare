#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Refusing to start Codex with a dirty worktree." >&2
  exit 2
fi

git fetch origin main
git switch main
git pull --ff-only origin main

PROMPT="$(cat .orchestration/RESUME_PROMPT.txt)"

set +e
codex exec --sandbox workspace-write "$PROMPT"
CODEX_STATUS=$?
set -e

if [[ $CODEX_STATUS -ne 0 ]]; then
  echo "Codex exited with status $CODEX_STATUS. Inspect .orchestration/STATUS.json and working tree before publishing." >&2
  exit "$CODEX_STATUS"
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Codex exited successfully but left uncommitted changes. Not pushing automatically." >&2
  exit 3
fi

CURRENT_BRANCH="$(git branch --show-current)"
if [[ -z "$CURRENT_BRANCH" ]]; then
  echo "Detached HEAD after Codex run. Not pushing automatically." >&2
  exit 4
fi

git push origin "$CURRENT_BRANCH"
echo "Codex runtime finished. Published branch: $CURRENT_BRANCH"
