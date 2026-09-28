import { DatabaseSync } from "node:sqlite";
import { join, resolve } from "node:path";

const root = resolve(process.argv[2] ?? "");
if (!root.includes(".hms-local/p0-1-f03-")) throw new Error("F0.3 browser assertion requires its dedicated synthetic fixture path");
const db = new DatabaseSync(join(root, "HOTEL_DEMO_DB", "v3", "d1", "miniflare-D1DatabaseObject", "3dd27f64a8e6b7092b4dc42ea2a5f93d01d65d27a0f4927b2e4bc344a6a2f6f6.sqlite"));
try {
  const rooms = db.prepare("SELECT id,status,housekeeping_state,service_state,room_state_version FROM rooms ORDER BY id").all();
  if (JSON.stringify(rooms) !== JSON.stringify([
    { id: "p01-room-a", status: "AVAILABLE", housekeeping_state: null, service_state: null, room_state_version: 0 },
    { id: "p01-room-b", status: "AVAILABLE", housekeeping_state: null, service_state: null, room_state_version: 0 },
    { id: "p01-room-c", status: "MAINTENANCE", housekeeping_state: null, service_state: null, room_state_version: 0 },
  ])) throw new Error(`Read-only browser flow drifted canonical room state: ${JSON.stringify(rooms)}`);
  const bookings = db.prepare("SELECT status,COUNT(*) AS count FROM bookings GROUP BY status ORDER BY status").all();
  if (JSON.stringify(bookings) !== JSON.stringify([{ status: "CONFIRMED", count: 3 }])) throw new Error(`Read-only browser flow drifted booking state: ${JSON.stringify(bookings)}`);
  const paymentRows = db.prepare("SELECT COUNT(*) AS count FROM payment_entries").get();
  if (paymentRows.count !== 0) throw new Error(`Read-only browser flow created payments: ${paymentRows.count}`);
  const eventRows = db.prepare("SELECT (SELECT COUNT(*) FROM housekeeping_events) AS housekeeping,(SELECT COUNT(*) FROM lifecycle_events) AS lifecycle").get();
  if (eventRows.housekeeping !== 0 || eventRows.lifecycle !== 0) throw new Error(`Read-only browser flow created events: ${JSON.stringify(eventRows)}`);
  process.stdout.write(JSON.stringify({ rooms: rooms.length, bookings: bookings.reduce((sum, row) => sum + row.count, 0), payment_entries: paymentRows.count, housekeeping_events: eventRows.housekeeping, lifecycle_events: eventRows.lifecycle, canonical_state: "UNCHANGED" }) + "\n");
} finally {
  db.close();
}
