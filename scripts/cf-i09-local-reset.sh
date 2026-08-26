#!/usr/bin/env bash
set -euo pipefail
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/cf-i09-local-common.sh"

cf_i09_require_tools
cf_i09_require_stopped
[[ -f "$CF_I09_REPO_DIR/scripts/migration/rehearse.mjs" ]] || cf_i09_die "migration rehearsal entrypoint is missing"

mkdir -p "$CF_I09_RUNTIME_DIR/resets"
stamp=$(date -u +%Y%m%dT%H%M%SZ)
if [[ -e "$CF_I09_PERSIST_DIR" ]]; then
  cf_i09_assert_managed_path "$CF_I09_PERSIST_DIR/v3/d1"
  prior="$CF_I09_RUNTIME_DIR/resets/state-before-$stamp-$$"
  mv "$CF_I09_PERSIST_DIR" "$prior"
  printf 'Previous local persistence retained at %s\n' "$prior"
fi
mkdir -p "$CF_I09_PERSIST_DIR"
test_state=$(mktemp -d "${TMPDIR:-/tmp}/cf-i09-acceptance.XXXXXX")
cleanup_state() { rm -rf -- "$test_state"; }
trap cleanup_state EXIT

# Each migration invocation gets a binding-specific persistence directory.
# This is mandatory for the known Wrangler/Miniflare shared-D1 lock hang.
CF_I09_ISOLATED_PERSISTENCE=1 timeout 90s node "$CF_I09_REPO_DIR/scripts/migration/rehearse.mjs" --persist-to "$test_state"
# Wrangler dev uses one process for all bindings and therefore reads its
# normal shared root. Materialise the exact databases produced above before
# reconciliation/startup so reset and the Worker operate on the same state.
node "$CF_I09_REPO_DIR/scripts/migration/materialize-local-state.mjs" "$test_state" "$CF_I09_PERSIST_DIR"
cf_i09_reconcile "$CF_I09_RUNTIME_DIR/reconciliation.json"
printf 'CF-I09 local reset/reseed PASS (%s)\n' "$CF_I09_PERSIST_DIR"
