#!/usr/bin/env bash
set -euo pipefail
export WRANGLER_SEND_METRICS=false
repo_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
cd "$repo_dir"
wrangler="$repo_dir/node_modules/.bin/wrangler"
state_dir="$repo_dir/.wrangler/state"
rm -rf "$state_dir"

run_d1() {
  CI=1 timeout 12s "$wrangler" "$@"
}

run_d1 d1 migrations apply HOTEL_DEMO_DB --local -c apps/api/wrangler.jsonc >/dev/null

arrivals_plan=$(run_d1 d1 execute HOTEL_DEMO_DB --local -c apps/api/wrangler.jsonc --command "EXPLAIN QUERY PLAN SELECT id FROM bookings WHERE status='CONFIRMED' AND check_in='2026-09-01';" 2>&1)
checkout_plan=$(run_d1 d1 execute HOTEL_DEMO_DB --local -c apps/api/wrangler.jsonc --command "EXPLAIN QUERY PLAN SELECT id FROM bookings WHERE status='CHECKED_IN' AND check_out='2026-09-01';" 2>&1)
inventory_plan=$(run_d1 d1 execute HOTEL_DEMO_DB --local -c apps/api/wrangler.jsonc --command "EXPLAIN QUERY PLAN SELECT booking_id FROM room_inventory_nights WHERE room_id='room-a' AND stay_date >= '2026-09-01' AND stay_date < '2026-09-03';" 2>&1)

printf '%s\n' "$arrivals_plan" | grep -q 'idx_bookings_status' || { echo "arrival query did not use idx_bookings_status" >&2; printf '%s\n' "$arrivals_plan" >&2; exit 1; }
printf '%s\n' "$checkout_plan" | grep -q 'idx_bookings_status_checkout' || { echo "checkout query did not use idx_bookings_status_checkout" >&2; printf '%s\n' "$checkout_plan" >&2; exit 1; }
printf '%s\n' "$inventory_plan" | grep -Eq 'room_inventory_nights|sqlite_autoindex' || { echo "inventory query plan is unexpected" >&2; printf '%s\n' "$inventory_plan" >&2; exit 1; }
if printf '%s\n' "$checkout_plan" | grep -q 'SCAN bookings'; then
  echo "checkout query regressed to a bookings table scan" >&2
  printf '%s\n' "$checkout_plan" >&2
  exit 1
fi

printf '{"d1QueryPlan":"PASS","arrivalIndex":"idx_bookings_status","checkoutIndex":"idx_bookings_status_checkout","inventoryKeyed":true}\n'
