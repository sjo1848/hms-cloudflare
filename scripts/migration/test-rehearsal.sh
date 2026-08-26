#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$repo_root"
# Isolate each D1 binding under the caller-owned root. Wrangler 4.125's
# shared Miniflare persistence can retain a process-wide lock across repeated
# child invocations; this keeps the focal runner deterministic without
# changing the local product runtime layout.
export CF_I09_ISOLATED_PERSISTENCE=1
test_state="$(mktemp -d)"
failure_state="$(mktemp -d)"
test_output="$(mktemp -d)"
cleanup() {
  case "$test_state" in /tmp/*) rm -rf -- "$test_state" ;; esac
  case "$failure_state" in /tmp/*) rm -rf -- "$failure_state" ;; esac
  case "$test_output" in /tmp/*) rm -rf -- "$test_output" ;; esac
}
trap cleanup EXIT

node scripts/migration/preflight-negative-tests.mjs
node scripts/migration/timezone-determinism-test.mjs
node scripts/migration/rehearse.mjs --persist-to "$test_state" >"$test_output/rehearse.log" 2>&1
node scripts/migration/reconcile.mjs --persist-to "$test_state" >"$test_output/reconcile-1.json"
node scripts/migration/reconcile.mjs --persist-to "$test_state" >"$test_output/reconcile-2.json"
cmp "$test_output/reconcile-1.json" "$test_output/reconcile-2.json"
node scripts/migration/reconcile-negative-tests.mjs "$test_state"

if node scripts/migration/rehearse.mjs --persist-to "$test_state" >"$test_output/replay.log" 2>&1; then
  echo "replay unexpectedly succeeded" >&2
  exit 1
fi
grep -q "MIGRATION_REPLAY_REFUSED_BEFORE_BUSINESS_MUTATION" "$test_output/replay.log"
node scripts/migration/reconcile.mjs --persist-to "$test_state" >"$test_output/reconcile-after-replay.json"
cmp "$test_output/reconcile-1.json" "$test_output/reconcile-after-replay.json"

if node scripts/migration/rehearse.mjs --persist-to "$failure_state" --fail-after-control >"$test_output/failure.log" 2>&1; then
  echo "injected partial migration unexpectedly succeeded" >&2
  exit 1
fi
grep -q "partial run is not reconciled or successful" "$test_output/failure.log"
if node scripts/migration/reconcile.mjs --persist-to "$failure_state" >"$test_output/partial-reconcile.json" 2>"$test_output/partial-reconcile.err"; then
  echo "partial migration unexpectedly reconciled" >&2
  exit 1
fi
grep -q "RECONCILIATION_FAILED" "$test_output/partial-reconcile.err"
if node scripts/migration/rehearse.mjs --persist-to "$failure_state" >"$test_output/partial-replay.log" 2>&1; then
  echo "partial migration replay unexpectedly succeeded" >&2
  exit 1
fi
grep -q "MIGRATION_REPLAY_REFUSED_BEFORE_BUSINESS_MUTATION" "$test_output/partial-replay.log"

if rg -n -- '--remote' scripts/migration/rehearse.mjs scripts/migration/reconcile.mjs || rg -n -- 'password_hash|\$synthetic\$never-import' "$test_output"/*.log; then
  echo "migration command/log leaked a forbidden remote or password surface" >&2
  exit 1
fi

npx vitest run apps/api/src/migration-booking-status.test.ts
echo "CF-I09 migration/reconciliation focal: PASS"
