import assert from "node:assert/strict";
import {
  buildControlSql,
  buildHotelSql,
  loadFixture,
  validateFixture,
} from "./migration-core.mjs";

const source = await loadFixture();
const clone = () => structuredClone(source);
const rejected = (mutate, pattern) => {
  const fixture = clone();
  mutate(fixture);
  assert.throws(() => validateFixture(fixture), pattern);
};

rejected((x) => {
  x.bookings[0].status = "WAITLISTED";
}, /unknown status/);
rejected((x) => {
  x.bookings[0].hotel_id = x.hotels[1].id;
}, /room tenant mismatch/);
rejected((x) => {
  x.bookings.find((row) => row.guest_id == null).guest_name = " ";
}, /requires nonblank guest_name/);
rejected((x) => {
  x.bookings[0].total_price_cents = Number.MAX_SAFE_INTEGER + 1;
}, /safe D1 INTEGER/);
rejected((x) => {
  x.invoices.push({
    ...x.invoices[0],
    id: "99900000-0000-0000-0000-000000000001",
  });
}, /multiple source invoices/);
rejected((x) => {
  x.payment_entries[0].received_by_user_id = null;
}, /missing receiver/);
rejected((x) => {
  x.hotels[0].silently_dropped = true;
}, /no explicit source-field disposition/);
rejected((x) => {
  delete x.bookings[0].terminal_reason;
}, /omits expected source field/);
rejected((x) => {
  x.target_adaptations.hotel_routes[x.hotels[0].id].binding = "CLIENT_DB";
}, /server-authoritative/);
rejected((x) => {
  x.room_holds[0].hotel_id = x.hotels[1].id;
}, /room hold .* tenant mismatch/);
rejected((x) => {
  x.audit_events[0].user_id = x.users.find(
    (user) => user.hotel_id === x.hotels[1].id,
  ).id;
}, /audit .* actor tenant mismatch/);
rejected((x) => {
  x.invoices[0].status = "UNMAPPED";
}, /invoice .* unknown status/);
rejected((x) => {
  x.maintenance_cases[0].status = "UNKNOWN";
}, /maintenance .* unknown status/);
rejected((x) => {
  x.payment_entries[0].payment_method = "CRYPTO";
}, /payment .* unknown payment method/);
rejected((x) => {
  x.cash_closures[0].payment_count = 999;
}, /cash closure .* payment summary mismatch/);
rejected((x) => {
  x.refresh_tokens[0].hotel_id = x.hotels[1].id;
}, /refresh token .* tenant mismatch/);
rejected((x) => {
  const booking = x.bookings.find((row) =>
    x.extra_charges.some((charge) => charge.booking_id === row.id),
  );
  booking.total_price_cents = 1;
}, /final total is lower than source charges/);

const renamed = clone();
renamed.guests[0].full_name = "Nombre actual distinto";
validateFixture(renamed); // guest_name remains an independent historical snapshot.

const nullAuditActor = clone();
nullAuditActor.audit_events[0].user_id = null;
const nullAuditDigest = validateFixture(nullAuditActor).source_digest;
assert.match(
  buildControlSql(nullAuditActor, nullAuditDigest),
  /legacy-source-user:unknown:/,
);

const { source_digest: digest } = validateFixture(source);
const generated = [
  buildControlSql(source, digest),
  ...source.hotels.map((hotel) => buildHotelSql(source, hotel.id, digest)),
].join("\n");
assert.equal(generated.includes("$synthetic$never-import"), false);
assert.equal(generated.includes("$synthetic$refresh-never-import"), false);
assert.equal(generated.toLowerCase().includes("password_hash"), false);
assert.match(generated, /legacy-guest:13000000-0000-0000-0000-000000000001/);
assert.match(generated, /guest_name_snapshot/);
assert.match(generated, /source_ip_address/);
process.stdout.write("CF-I09 migration preflight negative tests: PASS\n");
