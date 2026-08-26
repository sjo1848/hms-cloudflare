#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const wrangler = path.join(repo, "node_modules/.bin/wrangler");
const config = path.join(repo, "apps/api/wrangler.jsonc");
const persist = path.join(repo, "apps/api/.wrangler/state");
const api = "http://127.0.0.1:8787/api/v1";

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { cwd: repo, encoding: "utf8", stdio: options.capture ? "pipe" : "inherit", env: { ...process.env, WRANGLER_SEND_METRICS: "false", CI: "1" } });
  if (result.status !== 0) throw new Error(`${command} ${args.join(" ")} failed${result.stderr ? `: ${result.stderr}` : ""}`);
  return result.stdout ?? "";
}

function queryControl(sql) {
  const output = run(wrangler, ["d1", "execute", "CONTROL_DB", "--local", "--config", config, "--persist-to", persist, "--command", sql, "--json"], { capture: true });
  const parsed = JSON.parse(output);
  const result = Array.isArray(parsed) ? parsed.find((entry) => Array.isArray(entry?.results)) : parsed;
  return result?.results ?? [];
}

async function request(identity, hotelId, route, options = {}, expected = 200) {
  const headers = new Headers(options.headers);
  headers.set("x-local-access-subject", identity.access_subject);
  headers.set("x-local-access-email", identity.email);
  if (hotelId) headers.set("x-hotel-id", hotelId);
  if (options.body) headers.set("content-type", "application/json");
  const response = await fetch(`${api}${route}`, { ...options, headers });
  const text = await response.text();
  if (response.status !== expected) throw new Error(`${options.method ?? "GET"} ${route}: expected ${expected}, got ${response.status}: ${text}`);
  return text ? JSON.parse(text) : null;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

let started = false;
try {
  run(path.join(repo, "scripts/cf-i09-local-start.sh"), ["--reset"]);
  started = true;

  const codexHome = process.env.CODEX_HOME ?? path.join(process.env.HOME ?? "", ".codex");
  const playwrightCli = path.join(codexHome, "skills/playwright/scripts/playwright_cli.sh");
  const browserSession = `cf-i09-local-${process.pid}`;
  try {
    run("bash", [playwrightCli, "-s", browserSession, "open", "http://127.0.0.1:4174/rooms"]);
    run("bash", [playwrightCli, "-s", browserSession, "run-code", "--filename", path.join(repo, "scripts/cf-i09-local-smoke.playwright.js")]);
  } finally {
    spawnSync("bash", [playwrightCli, "-s", browserSession, "close"], { cwd: repo, stdio: "ignore" });
  }

  const identities = queryControl(`SELECT h.id AS hotel_id,m.access_subject,i.email,m.role
    FROM control_hotels h JOIN hotel_memberships m ON m.hotel_id=h.id
    JOIN access_identity_mappings i ON i.access_subject=m.access_subject
    WHERE h.active=1 AND m.active=1 AND i.active=1
    ORDER BY CASE WHEN m.role='admin' THEN 0 ELSE 1 END,h.id,m.access_subject`);
  const first = identities.find((row) => row.role === "admin");
  assert(first, "smoke requires one migrated hotel admin");
  const second = identities.find((row) => row.hotel_id !== first.hotel_id);
  assert(second, "smoke requires two distinct migrated hotels");
  const networks = queryControl(`SELECT n.access_subject,i.email FROM network_memberships n
    JOIN access_identity_mappings i ON i.access_subject=n.access_subject
    WHERE n.active=1 AND i.active=1 AND n.role='saas_admin' ORDER BY n.access_subject LIMIT 1`);
  assert(networks.length === 1, "smoke requires one migrated saas_admin identity");
  const network = networks[0];
  const networkHotelMemberships = queryControl(`SELECT COUNT(*) AS count FROM hotel_memberships
    WHERE access_subject='${network.access_subject}' AND active=1`);
  assert(Number(networkHotelMemberships[0]?.count ?? -1) === 0, "saas_admin unexpectedly has an operational hotel membership");

  const meA = await request(first, first.hotel_id, "/auth/me");
  const meB = await request(second, second.hotel_id, "/auth/me");
  assert(meA.hotel_id === first.hotel_id && meB.hotel_id === second.hotel_id, "hotel routing identity mismatch");
  await request(first, second.hotel_id, "/rooms", {}, 403);

  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.parse(`${today}T00:00:00Z`) + 86400000).toISOString().slice(0, 10);
  const revenueBefore = await request(first, first.hotel_id, `/reports/revenue?start=${today}&end=${today}`);
  const occupancyBefore = await request(first, first.hotel_id, `/reports/occupancy?start=${today}&end=${today}`);
  const analyticsBefore = await request(first, first.hotel_id, "/analytics/kpis");
  const revenueTotal = (rows) => rows.reduce((sum, row) => sum + Number(row.revenue_cents), 0);
  const suffix = `${Date.now()}-${process.pid}`;
  const roomA = await request(first, first.hotel_id, "/rooms", { method: "POST", body: JSON.stringify({ room_number: `S${String(process.pid).slice(-4)}A`, room_type: "SMOKE", price_cents: 12345 }) }, 201);
  const roomB = await request(first, first.hotel_id, "/rooms", { method: "POST", body: JSON.stringify({ room_number: `S${String(process.pid).slice(-4)}B`, room_type: "SMOKE", price_cents: 23456 }) }, 201);
  const guest = await request(first, first.hotel_id, "/guests", { method: "POST", body: JSON.stringify({ full_name: "CF-I09 Smoke Guest", email: `cf-i09-smoke-${suffix}@example.test`, phone: "+100000000" }) }, 200);
  const guests = await request(first, first.hotel_id, "/guests");
  assert(guests.some((row) => row.id === guest.id), "guest mutation was not readable");

  const booking = await request(first, first.hotel_id, "/bookings", { method: "POST", body: JSON.stringify({ guest_id: guest.id, room_id: roomA.id, check_in: today, check_out: tomorrow, notes: "CF-I09 integrated smoke" }) }, 201);
  await request(first, first.hotel_id, `/bookings/${booking.id}/check-in`, { method: "POST", body: JSON.stringify({ document_verified: true, contact_confirmed: true, stay_confirmed: true, check_in_guests_count: 1 }) });
  await request(first, first.hotel_id, `/bookings/${booking.id}/reassign`, { method: "POST", body: JSON.stringify({ room_id: roomB.id }) });
  const charge = await request(first, first.hotel_id, `/bookings/${booking.id}/extra-charges`, { method: "POST", body: JSON.stringify({ description: "Smoke minibar", amount_cents: 321, category: "MINIBAR" }) }, 201);
  assert(charge.ok === true && charge.amount_cents === 321, "extra charge exact cents mismatch");
  const charges = await request(first, first.hotel_id, `/bookings/${booking.id}/extra-charges`);
  assert(charges.some((row) => row.amount_cents === 321 && row.category === "MINIBAR"), "extra charge readback missing");
  await request(first, first.hotel_id, `/bookings/${booking.id}/check-out`, { method: "POST", body: JSON.stringify({ charge_reviewed: true, release_confirmed: true, handoff_confirmed: true, check_out_payment_policy: "pending-approved", check_out_reference: "CF-I09-SMOKE" }) });
  const invoice = await request(first, first.hotel_id, `/bookings/${booking.id}/invoice`);
  const invoiceTotal = 12345 + 321;
  assert(invoice.amount_cents === invoiceTotal && invoice.paid_amount_cents === 0 && invoice.status === "PENDING", "checkout invoice exact baseline mismatch");
  const balanceBefore = await request(first, first.hotel_id, "/billing/balance");
  const partial = await request(first, first.hotel_id, `/bookings/${booking.id}/payments`, { method: "POST", body: JSON.stringify({ amount_cents: 2345, payment_method: "CASH", payment_reference: "SMOKE-CASH", note: "partial smoke payment" }) });
  assert(partial.amount_cents === 2345 && partial.invoice.paid_amount_cents === 2345 && partial.invoice.status === "PENDING", "partial payment exact readback mismatch");
  const settled = await request(first, first.hotel_id, `/bookings/${booking.id}/settle-payment`, { method: "POST", body: JSON.stringify({ payment_method: "CARD", payment_reference: "SMOKE-CARD", note: "settled by smoke" }) });
  assert(settled.amount_cents === invoiceTotal - 2345 && settled.invoice.paid_amount_cents === invoiceTotal && settled.invoice.status === "PAID", "settlement exact readback mismatch");
  const payments = await request(first, first.hotel_id, `/bookings/${booking.id}/payments`);
  assert(payments.length === 2 && payments.reduce((sum, row) => sum + row.amount_cents, 0) === invoiceTotal, "payment list exact total/count mismatch");
  const balance = await request(first, first.hotel_id, "/billing/balance");
  assert(balance.total_amount_cents === balanceBefore.total_amount_cents + invoiceTotal && balance.cash_amount_cents === balanceBefore.cash_amount_cents + 2345 && balance.card_amount_cents === balanceBefore.card_amount_cents + (invoiceTotal - 2345) && balance.payment_count === balanceBefore.payment_count + 2, "cash balance exact delta mismatch");
  const closure = await request(first, first.hotel_id, "/billing/close-cash", { method: "POST", body: JSON.stringify({ expected_cash_amount_cents: balance.cash_amount_cents, expected_total_amount_cents: balance.total_amount_cents, expected_non_cash_amount_cents: balance.card_amount_cents, expected_payment_count: balance.payment_count, counted_cash_amount_cents: balance.cash_amount_cents, handoff_to: "CF-I09 acceptance", notes: "integrated smoke close" }) });
  assert(closure.ok === true && closure.total_amount_cents === balance.total_amount_cents && closure.cash_difference_cents === 0, "cash closure exact result mismatch");
  const closures = await request(first, first.hotel_id, "/billing/closures");
  assert(closures.some((row) => row.closing_time === closure.closing_time && row.total_amount_cents === balance.total_amount_cents && row.payment_count === balance.payment_count), "cash closure durable readback missing");
  const balanceAfterClose = await request(first, first.hotel_id, "/billing/balance");
  assert(balanceAfterClose.total_amount_cents === 0 && balanceAfterClose.payment_count === 0, "post-close balance did not reset at the closure boundary");

  await request(first, first.hotel_id, `/housekeeping/${roomB.id}/start`, { method: "POST", body: "{}" });
  await request(first, first.hotel_id, `/housekeeping/${roomB.id}/finish`, { method: "POST", body: "{}" });
  const maintenance = await request(first, first.hotel_id, `/housekeeping/${roomA.id}/maintenance`, { method: "POST", body: JSON.stringify({ priority: "HIGH", reason: "CF-I09 smoke maintenance", assigned_to: "ops" }) }, 201);
  await request(first, first.hotel_id, `/housekeeping/${roomA.id}/dirty`, { method: "POST", body: JSON.stringify({ case_id: maintenance.id, resolution_note: "CF-I09 smoke resolved" }) });
  await request(first, first.hotel_id, `/housekeeping/${roomA.id}/start`, { method: "POST", body: "{}" });
  await request(first, first.hotel_id, `/housekeeping/${roomA.id}/finish`, { method: "POST", body: "{}" });

  const subject = `cf-i09-smoke-user-${suffix}`;
  await request(first, first.hotel_id, "/users", { method: "POST", body: JSON.stringify({ access_subject: subject, email: `${subject}@example.test`, role: "housekeeping" }) }, 201);
  const users = await request(first, first.hotel_id, "/users");
  assert(users.some((row) => row.access_subject === subject), "RBAC membership mutation was not readable");
  const revenueAfter = await request(first, first.hotel_id, `/reports/revenue?start=${today}&end=${today}`);
  assert(revenueTotal(revenueAfter) === revenueTotal(revenueBefore) + invoiceTotal, "report revenue did not include exact checked-out booking cents");
  const occupancyAfter = await request(first, first.hotel_id, `/reports/occupancy?start=${today}&end=${today}`);
  assert(occupancyAfter[0].occupied_rooms === occupancyBefore[0].occupied_rooms && occupancyAfter[0].total_rooms === occupancyBefore[0].total_rooms + 2, "report occupancy state/room denominator semantics mismatch");
  const analyticsAfter = await request(first, first.hotel_id, "/analytics/kpis");
  assert(analyticsAfter.revenue_month_cents === analyticsBefore.revenue_month_cents + invoiceTotal, "analytics revenue exact delta mismatch");
  const hotels = await request(network, null, "/hotels");
  const networkKpis = await request(network, null, `/hotels/network-kpis?start=${today}&end=${tomorrow}`);
  assert(hotels.length >= 2 && networkKpis.total_hotels >= 2, "network read did not include both hotels");
  // A migrated saas_admin has network scope only. Keep the positive network
  // proof above and exercise the backend tenant boundary with hotel context:
  // a legacy/source hotel_id must never grant operational access.
  await request(network, first.hotel_id, "/rooms", {}, 403);

  for (const route of ["/rooms", "/guests", "/bookings", "/housekeeping", "/billing", "/users", "/reports", "/network"]) {
    const response = await fetch(`http://127.0.0.1:4174${route}`);
    assert(response.ok && (await response.text()).includes('id="root"'), `frontend route ${route} is unavailable`);
  }
  console.log("CF-I09 real local Worker + D1 complete-product smoke PASS");
} finally {
  if (started) {
    run(path.join(repo, "scripts/cf-i09-local-stop.sh"), []);
    run(path.join(repo, "scripts/cf-i09-local-reset.sh"), []);
  }
}
