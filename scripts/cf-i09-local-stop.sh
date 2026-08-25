#!/usr/bin/env bash
set -euo pipefail
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/cf-i09-local-common.sh"

mkdir -p "$CF_I09_PID_DIR"
stop_one() {
  local name="$1" pid_file pid
  pid_file="$CF_I09_PID_DIR/$name.pid"
  [[ -f "$pid_file" ]] || return 0
  read -r pid < "$pid_file"
  group_is_live() { kill -0 -- "-$1" 2>/dev/null; }
  if [[ "$pid" =~ ^[0-9]+$ ]] && group_is_live "$pid"; then
    kill -TERM -- "-$pid" 2>/dev/null || true
    for _ in {1..50}; do
      group_is_live "$pid" || break
      sleep 0.1
    done
    if group_is_live "$pid"; then
      kill -KILL -- "-$pid" 2>/dev/null || true
    fi
    wait "$pid" 2>/dev/null || true
  fi
  rm -f -- "$pid_file"
  if [[ "$pid" =~ ^[0-9]+$ ]] && group_is_live "$pid"; then
    cf_i09_die "$name owned process group $pid still has live members"
  fi
}

stop_one web
stop_one api
printf 'CF-I09 local runtime stopped cleanly\n'
