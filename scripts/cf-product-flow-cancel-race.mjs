const apiBase = process.env.PRODUCT_FLOW_API_BASE ?? "http://127.0.0.1:8787/api/v1";
const headers = {
  "content-type": "application/json",
  "x-local-access-subject": "source-user:subject-admin",
  "x-local-access-email": "admin@example.test",
  "x-hotel-id": "hotel-a",
};

async function request(path, { method = "GET", body } = {}) {
  const response = await fetch(`${apiBase}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const payload = await response.json().catch(() => null);
  return { status: response.status, payload };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

export async function runCancellationCheckInRace() {
  const created = await request("/bookings", {
    method: "POST",
    body: {
      guest_id: "integral-browser-guest",
      room_id: "integral-life-a",
      check_in: "2027-09-10",
      check_out: "2027-09-12",
      notes: "cancel-vs-checkin-race",
    },
  });
  assert(created.status === 201, `race fixture creation expected 201, got ${created.status}: ${JSON.stringify(created.payload)}`);
  const id = created.payload.id;

  const [cancel, checkIn] = await Promise.all([
    request(`/bookings/${id}`, { method: "PATCH", body: { status: "CANCELLED" } }),
    request(`/bookings/${id}/check-in`, {
      method: "POST",
      body: {
        check_in_guests_count: 1,
        document_verified: true,
        contact_confirmed: true,
        stay_confirmed: true,
      },
    }),
  ]);

  const statuses = [cancel.status, checkIn.status].sort((a, b) => a - b);
  assert(statuses[0] === 200 && statuses[1] === 409,
    `cancel/check-in race must have exactly one winner; cancel=${cancel.status}, checkIn=${checkIn.status}`);

  const final = await request(`/bookings/${id}`);
  assert(final.status === 200, `race booking read expected 200, got ${final.status}`);
  const availability = await request("/rooms/available?start=2027-09-10&end=2027-09-12");
  assert(availability.status === 200 && Array.isArray(availability.payload), "race availability read failed");
  const roomIsAvailable = availability.payload.some(room => room.id === "integral-life-a");

  if (cancel.status === 200) {
    assert(final.payload.status === "Cancelled", `cancel winner left status ${final.payload.status}`);
    assert(roomIsAvailable, "cancel winner did not release inventory");
  } else {
    assert(final.payload.status === "CheckedIn", `check-in winner left status ${final.payload.status}`);
    assert(!roomIsAvailable, "check-in winner lost its inventory claim during losing cancellation");
  }

  const evidence = {
    cancellationCheckInRace: "PASS",
    winner: cancel.status === 200 ? "cancel" : "check-in",
    statuses: { cancel: cancel.status, checkIn: checkIn.status },
    finalStatus: final.payload.status,
    inventoryConsistent: true,
  };
  console.log(JSON.stringify(evidence, null, 2));
  return evidence;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await runCancellationCheckInRace();
}
