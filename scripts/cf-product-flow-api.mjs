const apiBase = process.env.PRODUCT_FLOW_API_BASE ?? "http://127.0.0.1:8787/api/v1";
const headers = {
  "content-type": "application/json",
  "x-local-access-subject": "source-user:subject-admin",
  "x-local-access-email": "admin@example.test",
  "x-hotel-id": "hotel-a",
};

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function request(path, { method = "GET", body, expected = 200 } = {}) {
  const response = await fetch(`${apiBase}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const payload = await response.json().catch(() => null);
  const allowed = Array.isArray(expected) ? expected : [expected];
  if (!allowed.includes(response.status)) {
    throw new Error(`${method} ${path}: expected ${allowed.join("/")}, got ${response.status}: ${JSON.stringify(payload)}`);
  }
  return { status: response.status, payload };
}

function roomNumbers(payload) {
  return new Set(payload.map((room) => room.room_number));
}

async function availability(start, end) {
  return (await request(`/rooms/available?start=${start}&end=${end}`)).payload;
}

export async function runProductFlowApiAudit() {
  const evidence = {};

  // 1) Reproduce the human acceptance failure with PRE-EXISTING rooms in distinct physical states.
  const futureStart = "2027-01-10";
  const futureEnd = "2027-01-12";
  const future = roomNumbers(await availability(futureStart, futureEnd));
  for (const number of ["901", "902", "903", "905", "906", "907", "908", "909"]) {
    assert(future.has(number), `pre-existing room ${number} must be advance-reservable when its dates are free`);
  }
  assert(!future.has("904"), "maintenance room 904 must not be advance-reservable");
  evidence.preExistingFutureAvailability = [...future].sort();

  // 2) Half-open boundaries and active inventory.
  const overlap = roomNumbers(await availability("2026-09-02", "2026-09-04"));
  assert(!overlap.has("909"), "room 909 must be blocked by overlapping active inventory");
  const boundary = roomNumbers(await availability("2026-09-04", "2026-09-05"));
  assert(boundary.has("909"), "checkout == next check-in boundary must be reservable");
  await request("/rooms/available?start=2027-01-10&end=2027-01-10", { expected: 400 });
  await request("/rooms/available?start=2027-01-12&end=2027-01-10", { expected: 400 });
  await request("/rooms/available?start=2027-01-10", { expected: 400 });
  evidence.dateBoundaries = "PASS";

  // 3) Guest and room uniqueness exceptions.
  const unique = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const guestEmail = `integral-${unique}@example.test`;
  const createdGuest = await request("/guests", {
    method: "POST",
    expected: 200,
    body: { full_name: "Integral Flow Guest", email: guestEmail, phone: "+54 261 555 0999" },
  });
  const guestId = createdGuest.payload.id;
  await request("/guests", {
    method: "POST",
    expected: 409,
    body: { full_name: "Duplicate Integral Guest", email: guestEmail },
  });
  await request("/rooms", {
    method: "POST",
    expected: 409,
    body: { room_number: "901", room_type: "STANDARD", price_cents: 10000 },
  });
  evidence.uniqueness = "PASS";

  // 4) A DIRTY room is sellable for future dates, but overlapping sale remains impossible.
  const futureBooking = await request("/bookings", {
    method: "POST",
    expected: 201,
    body: { guest_id: guestId, room_id: "browser-a", check_in: futureStart, check_out: futureEnd, notes: "future on dirty room" },
  });
  const futureBookingId = futureBooking.payload.id;
  assert(!roomNumbers(await availability(futureStart, futureEnd)).has("901"), "claimed dirty room must disappear for overlapping dates");
  await request("/bookings", {
    method: "POST",
    expected: 409,
    body: { guest_id: guestId, room_id: "browser-a", check_in: futureStart, check_out: futureEnd },
  });
  const bookingsAfterConflict = (await request("/bookings?limit=100")).payload.filter(
    (booking) => booking.room_id === "browser-a" && booking.check_in === futureStart && booking.check_out === futureEnd && booking.status === "Confirmed",
  );
  assert(bookingsAfterConflict.length === 1, "overlap conflict must not leave a second partial booking");
  await request(`/bookings/${futureBookingId}`, { method: "PATCH", body: { status: "CANCELLED" } });
  assert(roomNumbers(await availability(futureStart, futureEnd)).has("901"), "cancellation must release future inventory on dirty room");
  evidence.bookingConflictAndCancel = "PASS";

  // 5) Maintenance remains an operational block even for a date-free future stay.
  await request("/bookings", {
    method: "POST",
    expected: 409,
    body: { guest_id: guestId, room_id: "browser-d", check_in: "2027-01-20", check_out: "2027-01-22" },
  });
  evidence.maintenanceReservability = "PASS";

  // 6) Holds block overlap but not the checkout/check-in boundary.
  const hold = await request("/rooms/browser-g/holds", {
    method: "POST",
    expected: 201,
    body: { start_date: "2027-02-01", end_date: "2027-02-03", hold_type: "Other", reason: "Integral flow hold" },
  });
  assert(!roomNumbers(await availability("2027-02-01", "2027-02-03")).has("907"), "hold must block overlapping availability");
  assert(roomNumbers(await availability("2027-02-03", "2027-02-04")).has("907"), "hold boundary must remain reservable");
  await request(`/rooms/browser-g/holds/${hold.payload.id}`, { method: "DELETE" });
  evidence.holds = "PASS";

  // 7) Editing a confirmed future reservation uses date inventory, not current physical state.
  const editable = await request("/bookings", {
    method: "POST",
    expected: 201,
    body: { guest_id: guestId, room_id: "browser-b", check_in: "2027-03-01", check_out: "2027-03-03", notes: "editable" },
  });
  await request(`/bookings/${editable.payload.id}`, {
    method: "PATCH",
    body: { room_id: "browser-f", check_in: "2027-03-10", check_out: "2027-03-12", notes: "moved to currently occupied room" },
  });
  assert(roomNumbers(await availability("2027-03-01", "2027-03-03")).has("902"), "old inventory must be released after edit");
  assert(!roomNumbers(await availability("2027-03-10", "2027-03-12")).has("906"), "new inventory must be claimed after edit");
  await request(`/bookings/${editable.payload.id}`, { method: "PATCH", body: { notes: "self-claim update" } });
  await request(`/bookings/${editable.payload.id}`, { method: "PATCH", body: { status: "CANCELLED" } });
  evidence.bookingEdit = "PASS";

  // 8) Lifecycle stays strict: reservation can exist in advance, but check-in needs a ready room.
  const dirtyForCheckIn = await request("/bookings", {
    method: "POST",
    expected: 201,
    body: { guest_id: guestId, room_id: "browser-a", check_in: "2027-04-01", check_out: "2027-04-03" },
  });
  await request(`/bookings/${dirtyForCheckIn.payload.id}/check-in`, {
    method: "POST",
    expected: 409,
    body: { check_in_guests_count: 1, document_verified: true, contact_confirmed: true, stay_confirmed: true },
  });
  const dirtyBookingAfterFailedCheckIn = (await request(`/bookings/${dirtyForCheckIn.payload.id}`)).payload;
  assert(dirtyBookingAfterFailedCheckIn.status === "Confirmed", "failed check-in must not partially transition booking");
  await request(`/bookings/${dirtyForCheckIn.payload.id}`, { method: "PATCH", body: { status: "CANCELLED" } });

  // 9) Happy lifecycle: check-in -> reassign -> checkout -> dirty -> cleaning -> available.
  const lifecycleBooking = await request("/bookings", {
    method: "POST",
    expected: 201,
    body: { guest_id: guestId, room_id: "browser-c", check_in: "2027-04-10", check_out: "2027-04-12", notes: "lifecycle" },
  });
  await request(`/bookings/${lifecycleBooking.payload.id}/check-in`, {
    method: "POST",
    body: { check_in_guests_count: 1, document_verified: true, contact_confirmed: true, stay_confirmed: true },
  });
  await request(`/bookings/${lifecycleBooking.payload.id}/reassign`, {
    method: "POST",
    body: { room_id: "browser-e" },
  });
  let rooms = (await request("/rooms")).payload;
  assert(rooms.find((room) => room.id === "browser-c")?.status === "Available", "reassign must release old occupied room");
  assert(rooms.find((room) => room.id === "browser-e")?.status === "Occupied", "reassign must occupy destination room");
  await request(`/bookings/${lifecycleBooking.payload.id}/check-out`, {
    method: "POST",
    body: { check_out_payment_policy: "settled", charge_reviewed: true, release_confirmed: true, handoff_confirmed: true },
  });
  rooms = (await request("/rooms")).payload;
  assert(rooms.find((room) => room.id === "browser-e")?.status === "Dirty", "checkout must hand room to housekeeping as dirty");
  assert(roomNumbers(await availability("2027-04-10", "2027-04-12")).has("905"), "checkout must release date inventory even while room is dirty");
  await request("/housekeeping/browser-e/finish", { method: "POST", expected: 409 });
  await request("/housekeeping/browser-e/start", { method: "POST" });
  await request("/housekeeping/browser-e/finish", { method: "POST" });
  evidence.lifecycleAndHousekeeping = "PASS";

  // 10) Maintenance open/duplicate/resolve protects the room and returns through housekeeping.
  const maintenance = await request("/housekeeping/browser-e/maintenance", {
    method: "POST",
    expected: 201,
    body: { priority: "HIGH", reason: "Integral audit maintenance", assigned_to: "ops" },
  });
  assert(!roomNumbers(await availability("2027-05-01", "2027-05-03")).has("905"), "open maintenance must block advance availability");
  await request("/housekeeping/browser-e/maintenance", {
    method: "POST",
    expected: 409,
    body: { priority: "HIGH", reason: "Duplicate maintenance", assigned_to: "ops" },
  });
  await request("/housekeeping/browser-e/dirty", {
    method: "POST",
    body: { case_id: maintenance.payload.id, resolution_note: "Resolved by integral audit" },
  });
  await request("/housekeeping/browser-e/start", { method: "POST" });
  await request("/housekeeping/browser-e/finish", { method: "POST" });
  evidence.maintenanceLifecycle = "PASS";

  // 11) Billing: extra charge, partial payment, replay idempotency, conflicting token, overpayment.
  const charge = await request(`/bookings/${lifecycleBooking.payload.id}/extra-charges`, {
    method: "POST",
    expected: 201,
    body: { description: "Integral flow minibar", amount_cents: 500, category: "OTHER" },
  });
  assert(charge.payload.amount_cents === 500, "extra charge amount mismatch");
  const token = `integral-${crypto.randomUUID()}`;
  const firstPayment = await request(`/bookings/${lifecycleBooking.payload.id}/payments`, {
    method: "POST",
    body: { amount_cents: 1000, payment_method: "CASH", operation_token: token },
  });
  const replayPayment = await request(`/bookings/${lifecycleBooking.payload.id}/payments`, {
    method: "POST",
    body: { amount_cents: 1000, payment_method: "CASH", operation_token: token },
  });
  assert(firstPayment.payload.amount_cents === replayPayment.payload.amount_cents, "same payment token replay must be idempotent");
  await request(`/bookings/${lifecycleBooking.payload.id}/payments`, {
    method: "POST",
    expected: 409,
    body: { amount_cents: 1001, payment_method: "CASH", operation_token: token },
  });
  await request(`/bookings/${lifecycleBooking.payload.id}/payments`, {
    method: "POST",
    expected: 409,
    body: { amount_cents: 999999999, payment_method: "CASH", operation_token: `over-${crypto.randomUUID()}` },
  });
  const payments = (await request(`/bookings/${lifecycleBooking.payload.id}/payments`)).payload;
  assert(payments.filter((entry) => entry.amount_cents === 1000).length === 1, "payment replay/conflict must not create duplicate financial entry");
  evidence.billing = "PASS";

  // 12) Network-only role must remain denied from hotel operations.
  const networkHeaders = {
    ...headers,
    "x-local-access-subject": "source-user:subject-network",
    "x-local-access-email": "network@example.test",
  };
  const denied = await fetch(`${apiBase}/rooms`, { headers: networkHeaders });
  assert(denied.status === 403, `saas_admin hotel operation expected 403, got ${denied.status}`);
  evidence.rbac = "PASS";

  console.log(JSON.stringify({ productFlowApiAudit: "PASS", evidence }, null, 2));
  return evidence;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await runProductFlowApiAudit();
}
