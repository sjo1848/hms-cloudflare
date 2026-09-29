#!/usr/bin/env bash
set -euo pipefail
repo_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
cd "$repo_dir"
tmp_dir=$(mktemp -d)
persist_dir="$tmp_dir/wrangler"
api_pid=""
web_pid=""
browser_session_open=0
playwright_cli="/home/sjo1848/.codex/skills/playwright/scripts/playwright_cli.sh"

collect_tree() {
  local parent="$1" child
  printf '%s\n' "$parent"
  while read -r child; do [[ -n "$child" ]] && collect_tree "$child"; done < <(pgrep -P "$parent" || true)
}

stop_owned() {
  local root pid live
  local -a owned=()
  for root in "$api_pid" "$web_pid"; do
    [[ -n "$root" ]] || continue
    while read -r pid; do owned+=("$pid"); done < <(collect_tree "$root")
  done
  for pid in "${owned[@]}"; do kill -TERM "$pid" 2>/dev/null || true; done
  for _ in {1..50}; do
    live=0
    for pid in "${owned[@]}"; do kill -0 "$pid" 2>/dev/null && live=1; done
    if (( live == 0 )); then
      [[ -z "$api_pid" ]] || wait "$api_pid" 2>/dev/null || true
      [[ -z "$web_pid" ]] || wait "$web_pid" 2>/dev/null || true
      api_pid=""; web_pid=""
      return 0
    fi
    sleep 0.1
  done
  for pid in "${owned[@]}"; do kill -KILL "$pid" 2>/dev/null || true; done
  for _ in {1..20}; do
    live=0
    for pid in "${owned[@]}"; do kill -0 "$pid" 2>/dev/null && live=1; done
    if (( live == 0 )); then
      [[ -z "$api_pid" ]] || wait "$api_pid" 2>/dev/null || true
      [[ -z "$web_pid" ]] || wait "$web_pid" 2>/dev/null || true
      api_pid=""; web_pid=""
      return 0
    fi
    sleep 0.1
  done
  echo "F0.10 owned Worker/Vite process remains after cleanup" >&2
  return 1
}

on_exit() {
  local status=$?
  if (( browser_session_open )); then
    bash "$playwright_cli" -s f0-10-capabilities close >/dev/null 2>&1 || status=1
    browser_session_open=0
  fi
  stop_owned || status=1
  exit "$status"
}
trap on_exit EXIT

wrangler="$repo_dir/node_modules/.bin/wrangler"
for database in CONTROL_DB HOTEL_DEMO_DB HOTEL_SECOND_DB; do
  CI=1 "$wrangler" d1 migrations apply "$database" --local -c apps/api/wrangler.jsonc --persist-to "$persist_dir" >"$tmp_dir/migrations.log" 2>&1
done
CI=1 "$wrangler" d1 execute CONTROL_DB --local -c apps/api/wrangler.jsonc --persist-to "$persist_dir" --command "
  INSERT INTO control_hotels (id,slug,operational_binding,active) VALUES
    ('10000000-0000-0000-0000-000000000001','hotel-norte','HOTEL_DEMO_DB',1),
    ('20000000-0000-0000-0000-000000000002','hotel-sur','HOTEL_SECOND_DB',1);
  INSERT INTO hotel_admin_metadata (hotel_id,name,address,plan_tier) VALUES
    ('10000000-0000-0000-0000-000000000001','Hotel Norte','A Street','BASIC'),
    ('20000000-0000-0000-0000-000000000002','Hotel Sur','B Street','BASIC');
  INSERT INTO access_identity_mappings (access_subject,email,active) VALUES
    ('source-user:14000000-0000-0000-0000-000000000001','ana-admin@migration.invalid',1),
    ('source-user:14000000-0000-0000-0000-000000000002','leo-reception@migration.invalid',1),
    ('source-user:24000000-0000-0000-0000-000000000001','sol-ops@migration.invalid',1),
    ('source-user:24000000-0000-0000-0000-000000000002','max-housekeeping@migration.invalid',1),
    ('source-user:14000000-0000-0000-0000-000000000003','saas-admin@migration.invalid',1),
    ('f010-unknown','unknown@migration.invalid',1);
  INSERT INTO hotel_memberships (access_subject,hotel_id,role,active) VALUES
    ('source-user:14000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','admin',1),
    ('source-user:14000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000002','housekeeping',1),
    ('source-user:14000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','receptionist',1),
    ('source-user:14000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000002','housekeeping',1),
    ('source-user:24000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000002','ops',1),
    ('source-user:24000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000002','housekeeping',1),
    ('f010-unknown','10000000-0000-0000-0000-000000000001','future_unknown_role',1);
  INSERT INTO network_memberships (access_subject,role,active) VALUES
    ('source-user:14000000-0000-0000-0000-000000000001','saas_admin',1),
    ('source-user:14000000-0000-0000-0000-000000000002','saas_admin',1),
    ('source-user:14000000-0000-0000-0000-000000000003','saas_admin',1);
" >"$tmp_dir/seed-control.log" 2>&1
CI=1 "$wrangler" d1 execute HOTEL_DEMO_DB --local -c apps/api/wrangler.jsonc --persist-to "$persist_dir" --command "INSERT INTO rooms (id,room_number,room_type,status,price_cents) VALUES ('f010-room-a','F010-A','STANDARD','AVAILABLE',10000);" >"$tmp_dir/seed-a.log" 2>&1
CI=1 "$wrangler" d1 execute HOTEL_SECOND_DB --local -c apps/api/wrangler.jsonc --persist-to "$persist_dir" --command "INSERT INTO rooms (id,room_number,room_type,status,housekeeping_state,service_state,price_cents) VALUES ('f010-room-b','F010-B','STANDARD','DIRTY','DIRTY','IN_SERVICE',11000);" >"$tmp_dir/seed-b.log" 2>&1

if curl -fsS http://127.0.0.1:8787/health >/dev/null 2>&1; then echo "API port 8787 already occupied" >&2; exit 1; fi
"$wrangler" dev --local --ip 127.0.0.1 --port 8787 --var LOCAL_DEV_AUTH:true -c apps/api/wrangler.jsonc --persist-to "$persist_dir" >"$tmp_dir/api.log" 2>&1 & api_pid=$!
for _ in {1..40}; do curl -fsS http://127.0.0.1:8787/health >/dev/null 2>&1 && break; sleep 0.5; done
curl -fsS http://127.0.0.1:8787/health >/dev/null
if curl -fsS http://127.0.0.1:4178/ >/dev/null 2>&1; then echo "Web port 4178 already occupied" >&2; exit 1; fi
VITE_LOCAL_ACCEPTANCE_AUTH=true "$repo_dir/node_modules/.bin/vite" --host 127.0.0.1 --port 4178 --config apps/web/vite.config.ts >"$tmp_dir/web.log" 2>&1 & web_pid=$!
for _ in {1..40}; do curl -fsS http://127.0.0.1:4178/ >/dev/null 2>&1 && break; sleep 0.5; done
curl -fsS http://127.0.0.1:4178/ >/dev/null

mkdir -p output/playwright
bash "$playwright_cli" -s f0-10-capabilities open about:blank >/dev/null
browser_session_open=1
bash "$playwright_cli" -s f0-10-capabilities run-code --filename scripts/cf-f0-10-capabilities.playwright.js --raw | tee output/playwright/f0-10-capabilities-integrated.log
bash "$playwright_cli" -s f0-10-capabilities close >/dev/null
browser_session_open=0
stop_owned
trap - EXIT

CI=1 "$wrangler" d1 execute HOTEL_DEMO_DB --local -c apps/api/wrangler.jsonc --persist-to "$persist_dir" --command "SELECT COUNT(*) AS allowed_room FROM rooms WHERE room_number='F10-OK'; SELECT COUNT(*) AS denied_room FROM rooms WHERE room_number='F010-DENIED';" --json >"$tmp_dir/rooms.json"
node - "$tmp_dir/rooms.json" <<'NODE'
const fs = require("node:fs");
const rows = JSON.parse(fs.readFileSync(process.argv[2], "utf8")).flatMap(item => item.results);
if (rows[0]?.allowed_room !== 1 || rows[1]?.denied_room !== 0) throw new Error(`role downgrade D1 state mismatch: ${JSON.stringify(rows)}`);
NODE
CI=1 "$wrangler" d1 execute CONTROL_DB --local -c apps/api/wrangler.jsonc --persist-to "$persist_dir" --command "SELECT role FROM hotel_memberships WHERE access_subject='source-user:14000000-0000-0000-0000-000000000002' AND hotel_id='10000000-0000-0000-0000-000000000001'; SELECT COUNT(*) AS role_audits FROM control_audit_events WHERE target_id='source-user:14000000-0000-0000-0000-000000000002' AND action='USER_ROLE_CHANGE'; SELECT COUNT(*) AS denied_network_hotels FROM control_hotels WHERE id IN ('denied-hotel','denied-hotel-mobile');" --json >"$tmp_dir/downgrade.json"
node - "$tmp_dir/downgrade.json" <<'NODE'
const fs = require("node:fs");
const crypto = require("node:crypto");
const rows = JSON.parse(fs.readFileSync(process.argv[2], "utf8")).flatMap(item => item.results);
if (rows[0]?.role !== "receptionist" || rows[1]?.role_audits !== 2 || rows[2]?.denied_network_hotels !== 0) throw new Error(`same-subject downgrade/network denial evidence mismatch: ${JSON.stringify(rows)}`);
const roomRows = JSON.parse(fs.readFileSync(process.argv[2].replace("downgrade.json", "rooms.json"), "utf8")).flatMap(item => item.results);
if (roomRows[0]?.allowed_room !== 1 || roomRows[1]?.denied_room !== 0) throw new Error(`allowed/denied room write state mismatch: ${JSON.stringify(roomRows)}`);
const browser = JSON.parse(fs.readFileSync("output/playwright/f0-10-capabilities-integrated.log", "utf8"));
for (const key of ["desktop", "mobile", "dualScope", "outOfOrderAuthMe", "networkDeniedWritesHidden", "networkKeyboard"]) if (!browser[key]) throw new Error(`integrated browser evidence missing ${key}: ${JSON.stringify(browser)}`);
for (const key of ["authorizedDesktop", "unauthorizedDesktop", "authorizedMobile", "unauthorizedMobile"]) if (browser.networkKeyboard[key] !== "PASS") throw new Error(`Network keyboard evidence missing ${key}: ${JSON.stringify(browser.networkKeyboard)}`);
if (browser.networkKeyboard.deniedWriteDesktop !== 403 || browser.networkKeyboard.deniedWriteMobile !== 403
  || JSON.stringify(browser.networkKeyboard.unauthorizedViewports) !== JSON.stringify(["1280x900:PASS", "375x844:PASS"])) throw new Error(`Network viewport authorization evidence mismatch: ${JSON.stringify(browser.networkKeyboard)}`);
for (const viewport of ["noWriteAuthMeDesktop", "noWriteAuthMeMobile"]) {
  const auth = browser.networkKeyboard[viewport];
  if (auth?.status !== 200 || auth.appContextApplied !== true || auth.localProfile !== "2" || auth.subject !== "source-user:24000000-0000-0000-0000-000000000001"
    || auth.hotelId !== "20000000-0000-0000-0000-000000000002" || auth.role !== "ops"
    || !auth.hotelCapabilities.includes("housekeeping.read") || auth.networkCapabilities.includes("saas.hotels.write")) {
    throw new Error(`real /auth/me identity/capability context mismatch at ${viewport}: ${JSON.stringify(auth)}`);
  }
}
if (browser.beforeDowngrade !== 201 || browser.afterDowngrade !== 403 || browser.unmemberedHotel !== 403 || browser.directDenied !== "PASS") throw new Error(`integrated browser authorization mismatch: ${JSON.stringify(browser)}`);
const pngDimensions = path => {
  const image = fs.readFileSync(path);
  if (image.toString("hex", 0, 8) !== "89504e470d0a1a0a") throw new Error(`invalid PNG signature: ${path}`);
  return { width: image.readUInt32BE(16), height: image.readUInt32BE(20), sha256: crypto.createHash("sha256").update(image).digest("hex") };
};
const screenshots = {
  noWriteDesktop: pngDimensions("output/playwright/f0-10-network-no-write-keyboard.png"),
  noWriteMobile: pngDimensions("output/playwright/f0-10-network-no-write-mobile-keyboard.png"),
};
if (screenshots.noWriteDesktop.width !== 1280 || screenshots.noWriteMobile.width !== 375
  || screenshots.noWriteDesktop.sha256 === screenshots.noWriteMobile.sha256) throw new Error(`Network no-write screenshots do not prove distinct desktop/mobile viewports: ${JSON.stringify(screenshots)}`);
const result = { browser, screenshots, d1: { allowedRoomCount: roomRows[0].allowed_room, deniedRoomCount: roomRows[1].denied_room, finalRole: rows[0].role, roleAuditCount: rows[1].role_audits, deniedNetworkHotelCount: rows[2].denied_network_hotels }, cleanup: "owned Worker/Vite/Playwright processes verified stopped" };
fs.writeFileSync("output/playwright/f0-10-capabilities-integrated-result.json", JSON.stringify(result, null, 2) + "\n");
console.log(JSON.stringify(result));
NODE
echo "F0.10 real local Worker/D1/Vite capability + downgrade browser regression PASS; owned process trees verified stopped."
