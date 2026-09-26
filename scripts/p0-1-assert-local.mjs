import { readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

const root = resolve(process.argv[2]);
if (!root.includes("p0-1-")) throw new Error("Expected isolated P0.1 local D1 root");
const directory = join(root, "combined", "v3", "d1", "miniflare-D1DatabaseObject");
const file = readdirSync(directory).find(name => name.endsWith(".sqlite") && name !== "metadata.sqlite" && name.startsWith("3dd27f64"));
if (!file) throw new Error("Hotel operational D1 file missing");
const db = new DatabaseSync(join(directory, file), { readOnly: true });
try {
  const bookings = db.prepare("SELECT id,status,total_cents,check_in_guests_count FROM bookings WHERE id IN ('z-priority','a-next','m-blocked') ORDER BY id").all();
  const rooms = db.prepare("SELECT id,status FROM rooms WHERE id IN ('p01-room-a','p01-room-b','p01-room-c') ORDER BY id").all();
  const events = db.prepare("SELECT booking_id,event_type,COUNT(*) AS count FROM lifecycle_events WHERE booking_id IN ('z-priority','a-next','m-blocked') GROUP BY booking_id,event_type ORDER BY booking_id").all();
  const invoices = db.prepare("SELECT booking_id,amount_cents,paid_amount_cents,status FROM invoices WHERE booking_id IN ('z-priority','a-next','m-blocked') ORDER BY booking_id").all();
  const payments = db.prepare("SELECT COUNT(*) AS count FROM payment_entries").get();
  const find = (rows, id, key = "id") => rows.find(row => row[key] === id);
  for (const [bookingId, roomId, total] of [["z-priority", "p01-room-a", 40000], ["a-next", "p01-room-b", 36000]]) {
    const booking = find(bookings, bookingId);
    if (booking?.status !== "CHECKED_IN" || booking.check_in_guests_count !== 2 || booking.total_cents !== total) throw new Error(`Booking drift: ${JSON.stringify(bookings)}`);
    if (find(rooms, roomId)?.status !== "OCCUPIED") throw new Error(`Room did not become occupied: ${JSON.stringify(rooms)}`);
    if (!events.some(event => event.booking_id === bookingId && event.event_type === "CHECK_IN" && event.count === 1)) throw new Error(`Check-in audit not exactly once: ${JSON.stringify(events)}`);
    const invoice = find(invoices, bookingId, "booking_id");
    if (invoice?.amount_cents !== total || invoice.paid_amount_cents !== 0 || invoice.status !== "PENDING") throw new Error(`Check-in altered Billing: ${JSON.stringify(invoices)}`);
  }
  if (find(bookings, "m-blocked")?.status !== "CONFIRMED" || find(rooms, "p01-room-c")?.status !== "MAINTENANCE" || events.some(event => event.booking_id === "m-blocked") || payments?.count !== 0) throw new Error(`Blocked case or payment drift: ${JSON.stringify({ bookings, rooms, events, payments })}`);
  console.log(JSON.stringify({ p0_1_integrated_d1: "PASS", bookings, rooms, events, invoices, payments }));
} finally { db.close(); }
