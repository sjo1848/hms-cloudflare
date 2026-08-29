#!/usr/bin/env bash
set -euo pipefail

repo_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
tmp_dir=$(mktemp -d)
api_pid=""
web_pid=""
status=0

cleanup() {
  if [[ -n "$web_pid" ]]; then kill "$web_pid" 2>/dev/null || true; fi
  if [[ -n "$api_pid" ]]; then pkill -TERM -P "$api_pid" 2>/dev/null || true; kill "$api_pid" 2>/dev/null || true; fi
}

on_exit() {
  status=$?
  if [[ "$status" != "0" ]]; then
    mkdir -p "$repo_dir/output/playwright"
    cp "$tmp_dir"/*.log "$repo_dir/output/playwright/" 2>/dev/null || true
  fi
  cleanup
  rm -rf "$tmp_dir"
  exit "$status"
}
trap on_exit EXIT

cd "$repo_dir"
mkdir -p output/playwright
wrangler="$repo_dir/node_modules/.bin/wrangler"

# This runner owns its D1 state. The isolated CI job starts from a clean checkout;
# local invocations explicitly clear local D1 persistence so the result is order-independent.
rm -rf apps/api/.wrangler/state/v3/d1

CI=1 "$wrangler" d1 migrations apply CONTROL_DB --local -c apps/api/wrangler.jsonc >"$tmp_dir/migrations.log" 2>&1
CI=1 "$wrangler" d1 migrations apply HOTEL_DEMO_DB --local -c apps/api/wrangler.jsonc >>"$tmp_dir/migrations.log" 2>&1
CI=1 "$wrangler" d1 migrations apply HOTEL_SECOND_DB --local -c apps/api/wrangler.jsonc >>"$tmp_dir/migrations.log" 2>&1

CI=1 "$wrangler" d1 execute CONTROL_DB --local -c apps/api/wrangler.jsonc --command "
  INSERT OR REPLACE INTO control_hotels (id,slug,operational_binding,active) VALUES
    ('hotel-a','hotel-a','HOTEL_DEMO_DB',1),
    ('hotel-b','hotel-b','HOTEL_SECOND_DB',1);
  INSERT OR REPLACE INTO access_identity_mappings (access_subject,email,active) VALUES
    ('source-user:subject-admin','admin@example.test',1),
    ('source-user:subject-network','network@example.test',1),
    ('source-user:subject-reception','reception@example.test',1),
    ('source-user:subject-housekeeping','housekeeping@example.test',1);
  INSERT OR REPLACE INTO hotel_memberships (access_subject,hotel_id,role,active) VALUES
    ('source-user:subject-admin','hotel-a','admin',1),
    ('source-user:subject-reception','hotel-a','reception',1),
    ('source-user:subject-housekeeping','hotel-a','housekeeping',1);
  INSERT OR REPLACE INTO network_memberships (access_subject,role,active) VALUES
    ('source-user:subject-network','saas_admin',1);
  INSERT OR REPLACE INTO hotel_admin_metadata (hotel_id,name,plan_tier) VALUES
    ('hotel-a','Hotel Integral Audit','BASIC'),
    ('hotel-b','Hotel Isolation Target','PRO');
" >>"$tmp_dir/migrations.log" 2>&1

bash scripts/cf-product-flow-seed.sh "$wrangler" "$tmp_dir/migrations.log"

start_api() {
  "$wrangler" dev --local --ip 127.0.0.1 --port 8787 --var LOCAL_DEV_AUTH:true -c apps/api/wrangler.jsonc >>"$tmp_dir/api.log" 2>&1 & api_pid=$!
  api_ready=0
  for _ in {1..40}; do
    if curl -fsS http://127.0.0.1:8787/health >/dev/null 2>&1; then api_ready=1; break; fi
    sleep 1
  done
  if [[ "$api_ready" != "1" ]]; then echo "API did not become ready" >&2; exit 1; fi
}

start_api

VITE_LOCAL_ACCEPTANCE_AUTH=true "$repo_dir/node_modules/.bin/vite" --host 127.0.0.1 --port 4174 --config apps/web/vite.config.ts >"$tmp_dir/web.log" 2>&1 & web_pid=$!
web_ready=0
for _ in {1..40}; do
  if curl -fsS http://127.0.0.1:4174/bookings >/dev/null 2>&1; then web_ready=1; break; fi
  sleep 1
done
if [[ "$web_ready" != "1" ]]; then echo "Web did not become ready" >&2; exit 1; fi

PRODUCT_FLOW_PHASE=api node scripts/cf-product-flow-browser-ci.mjs 2>&1 | tee output/playwright/product-flow.log

# Wrangler's local proxy can lose its internal connection after the intentional
# concurrency stress. Restart only the Worker process while preserving the owned
# D1 state, then exercise the complete browser lifecycle against that same state.
pkill -TERM -P "$api_pid" 2>/dev/null || true
kill "$api_pid" 2>/dev/null || true
wait "$api_pid" 2>/dev/null || true
api_pid=""
start_api

PRODUCT_FLOW_PHASE=availability node scripts/cf-product-flow-browser-ci.mjs 2>&1 | tee -a output/playwright/product-flow.log

pkill -TERM -P "$api_pid" 2>/dev/null || true
kill "$api_pid" 2>/dev/null || true
wait "$api_pid" 2>/dev/null || true
api_pid=""
start_api

PRODUCT_FLOW_PHASE=lifecycle node scripts/cf-product-flow-browser-ci.mjs 2>&1 | tee -a output/playwright/product-flow.log

pkill -TERM -P "$api_pid" 2>/dev/null || true
kill "$api_pid" 2>/dev/null || true
wait "$api_pid" 2>/dev/null || true
api_pid=""
start_api

PRODUCT_FLOW_PHASE=i18n node scripts/cf-product-flow-browser-ci.mjs 2>&1 | tee -a output/playwright/product-flow.log
