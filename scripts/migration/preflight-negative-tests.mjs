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
const legacyNullPayment = clone();
legacyNullPayment.payment_entries[0].received_by_user_id = null;
const legacyPaymentDigest = validateFixture(legacyNullPayment).source_digest;
const legacyPaymentSql = buildHotelSql(
  legacyNullPayment,
  legacyNullPayment.hotels[0].id,
  legacyPaymentDigest,
);
assert.match(legacyPaymentSql, /legacy-source-user:unknown:payment:19200000-0000-0000-0000-000000000001/);
assert.match(legacyPaymentSql, /source received_by_user_id NULL in legacy backfill/);
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
  x.target_adaptations.network_admin_user_ids = [
    "14000000-0000-0000-0000-000000000001",
  ];
}, /network adaptation must exactly contain source saas_admin/);
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
assert.match(generated, /legacy-source-user:unknown:maintenance:26000000-0000-0000-0000-000000000001/);
assert.match(generated, /migration:checkin:13000000-0000-0000-0000-000000000002/);
assert.match(generated, /legacy-source-user:unknown:checkin:13000000-0000-0000-0000-000000000002/);
assert.match(generated, /legacy-source-user:unknown:payment:19200000-0000-0000-0000-000000000001/);
const bookingLines = buildHotelSql(source, source.hotels[0].id, digest).split("\n").filter((line) => line.startsWith("INSERT INTO bookings"));
const bookingLine = (id) => bookingLines.find((line) => line.includes(`VALUES ('${id}'`));
// no event + NULL (001), event + NULL (002), event + real actor (003)
assert.equal(bookingLines.length, source.bookings.filter((row) => row.hotel_id === source.hotels[0].id).length);
assert.match(bookingLine("13000000-0000-0000-0000-000000000001"), /'2026-08-25','2026-08-27','CONFIRMED','20000',NULL,NULL,NULL,NULL/);
assert.equal(
  bookingLine("13000000-0000-0000-0000-000000000002").includes(
    "'2026-08-24T15:00:00.000Z',NULL,NULL,NULL",
  ),
  true,
);
assert.match(bookingLine("13000000-0000-0000-0000-000000000003"), /'2026-08-20T15:00:00\.000Z','source-user:14000000-0000-0000-0000-000000000002','2026-08-22T13:00:00\.000Z','source-user:14000000-0000-0000-0000-000000000002'/);
const noEventRealActor = clone();
noEventRealActor.bookings.find((row) => row.id === "13000000-0000-0000-0000-000000000001").checked_in_by_user_id = "14000000-0000-0000-0000-000000000002";
const noEventRealSql = buildHotelSql(noEventRealActor, noEventRealActor.hotels[0].id, validateFixture(noEventRealActor).source_digest);
assert.match(noEventRealSql, /VALUES \('13000000-0000-0000-0000-000000000001'.*'source-user:14000000-0000-0000-0000-000000000002'/);
assert.equal(noEventRealSql.includes("legacy-source-user:unknown:checkin:13000000-0000-0000-0000-000000000001"), false);
assert.match(generated, /INSERT INTO network_memberships .*source-user:14000000-0000-0000-0000-000000000003/s);
assert.equal((buildControlSql(source, digest).match(/INSERT INTO hotel_memberships/g) ?? []).length, 4);
assert.equal(buildControlSql(source, digest).includes("source-user:14000000-0000-0000-0000-000000000003','10000000"), false);
assert.equal(buildControlSql(source, digest).includes("source-user:14000000-0000-0000-0000-000000000001','saas_admin'"), false);
process.stdout.write("CF-I09 migration preflight negative tests: PASS\n");
