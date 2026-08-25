#!/usr/bin/env bash
set -euo pipefail
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/cf-i09-local-common.sh"

cf_i09_require_tools
cf_i09_require_stopped
[[ -f "$CF_I09_REPO_DIR/scripts/migration/rehearse.mjs" ]] || cf_i09_die "migration rehearsal entrypoint is missing"

mkdir -p "$CF_I09_RUNTIME_DIR/resets" "$CF_I09_PERSIST_DIR"
d1_state="$CF_I09_PERSIST_DIR/v3/d1"
if [[ -e "$d1_state" ]]; then
  cf_i09_assert_managed_path "$d1_state"
  stamp=$(date -u +%Y%m%dT%H%M%SZ)
  prior="$CF_I09_RUNTIME_DIR/resets/d1-before-$stamp-$$"
  mv "$d1_state" "$prior"
  printf 'Previous local D1 state retained at %s\n' "$prior"
fi

node "$CF_I09_REPO_DIR/scripts/migration/rehearse.mjs" --persist-to "$CF_I09_PERSIST_DIR"
cf_i09_reconcile "$CF_I09_RUNTIME_DIR/reconciliation.json"
printf 'CF-I09 local reset/reseed PASS (%s)\n' "$CF_I09_PERSIST_DIR"
