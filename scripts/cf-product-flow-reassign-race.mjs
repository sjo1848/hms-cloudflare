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

async function createCheckedIn(sourceRoomId, note) {
  const created = await request("/bookings", {
    method: "POST",
    body: {
      guest_id: "integral-browser-guest",
      room_id: sourceRoomId,
      check_in: "2027-10-10",
      check_out: "2027-10-12",
      notes: note,
    },
  });
  assert(created.status === 201, `reassign race fixture creation failed for ${sourceRoomId}: ${created.status}`);
  const checkIn = await request(`/bookings/${created.payload.id}/check-in`, {
    method: "POST",
    body: {
      check_in_guests_count: 1,
      document_verified: true,
      contact_confirmed: true,
      stay_confirmed: true,
    },
  });
  assert(checkIn.status === 200, `reassign race fixture check-in failed for ${sourceRoomId}: ${checkIn.status}`);
  return created.payload.id;
}

export async function runReassignmentRace() {
  const bookingA = await createCheckedIn("integral-race-source-a", "reassign-race-a");
  const bookingB = await createCheckedIn("integral-race-source-b", "reassign-race-b");

  const [moveA, moveB] = await Promise.all([
    request(`/bookings/${bookingA}/reassign`, { method: "POST", body: { room_id: "integral-race-target" } }),
    request(`/bookings/${bookingB}/reassign`, { method: "POST", body: { room_id: "integral-race-target" } }),
  ]);

  const statuses = [moveA.status, moveB.status].sort((left, right) => left - right);
  assert(statuses[0] === 200 && statuses[1] === 409,
    `reassignment race must have exactly one winner; A=${moveA.status}, B=${moveB.status}`);

  const [finalA, finalB, rooms, availability] = await Promise.all([
    request(`/bookings/${bookingA}`),
    request(`/bookings/${bookingB}`),
    request("/rooms"),
    request("/rooms/available?start=2027-10-10&end=2027-10-12"),
  ]);
  for (const response of [finalA, finalB, rooms, availability]) assert(response.status === 200, "reassignment race verification read failed");

  const winnerIsA = moveA.status === 200;
  const winner = winnerIsA ? finalA.payload : finalB.payload;
  const loser = winnerIsA ? finalB.payload : finalA.payload;
  const winnerSource = winnerIsA ? "integral-race-source-a" : "integral-race-source-b";
  const loserSource = winnerIsA ? "integral-race-source-b" : "integral-race-source-a";

  assert(winner.status === "CheckedIn" && winner.room_id === "integral-race-target", "reassignment winner did not own target room");
  assert(loser.status === "CheckedIn" && loser.room_id === loserSource, "reassignment loser was partially moved");

  const roomMap = new Map(rooms.payload.map(room => [room.id, room]));
  assert(roomMap.get("integral-race-target")?.status === "Occupied", "target room is not occupied by winner");
  assert(roomMap.get(winnerSource)?.status === "Available", "winner source room was not released");
  assert(roomMap.get(loserSource)?.status === "Occupied", "loser source room was partially released");

  const availableIds = new Set(availability.payload.map(room => room.id));
  assert(!availableIds.has("integral-race-target"), "target inventory was not retained by winner");
  assert(!availableIds.has(loserSource), "loser inventory was released by losing reassignment");
  assert(availableIds.has(winnerSource), "winner source inventory was not released");

  const evidence = {
    reassignmentRace: "PASS",
    winner: winnerIsA ? "A" : "B",
    statuses: { A: moveA.status, B: moveB.status },
    targetOwner: winner.id,
    loserStayedInSource: true,
    roomStatesConsistent: true,
    inventoryConsistent: true,
  };
  console.log(JSON.stringify(evidence, null, 2));
  return evidence;
}

if (import.meta.url === `file://${process.argv[1]}`) await runReassignmentRace();
