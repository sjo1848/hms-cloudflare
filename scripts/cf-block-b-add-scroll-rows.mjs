import { readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

const root = resolve(process.argv[2] ?? "");
if (!root.includes("p0-1-block-b-")) throw new Error("Extra scroll rows are restricted to the Block B disposable synthetic fixture");
const directory = join(root, "combined", "v3", "d1", "miniflare-D1DatabaseObject");
const file = readdirSync(directory).find(name => {
  if (!name.endsWith(".sqlite") || name === "metadata.sqlite") return false;
  const probe = new DatabaseSync(join(directory, name), { readOnly: true });
  try { return Boolean(probe.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='bookings'").get()) && Boolean(probe.prepare("SELECT 1 FROM bookings WHERE id='a-next'").get()); }
  finally { probe.close(); }
});
if (!file) throw new Error("Block B synthetic HOTEL_DEMO_DB not found");
const db = new DatabaseSync(join(directory, file));
try {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/Argentina/Mendoza", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const field = type => parts.find(part => part.type === type)?.value;
  const checkIn = `${field("year")}-${field("month")}-${field("day")}`;
  const checkOut = new Date(Date.parse(`${checkIn}T00:00:00Z`) + 3 * 86400000).toISOString().slice(0, 10);
  const now = new Date().toISOString();
  const room = db.prepare("INSERT OR IGNORE INTO rooms (id,room_number,room_type,status,price_cents,housekeeping_state,service_state) VALUES (?,?,?,'AVAILABLE',10000,'READY','IN_SERVICE')");
  const guest = db.prepare("INSERT OR IGNORE INTO guests (id,full_name,email,created_at) VALUES (?,?,?,?)");
  const booking = db.prepare("INSERT OR IGNORE INTO bookings (id,guest_id,room_id,check_in,check_out,status,total_cents,created_at,updated_at) VALUES (?,?,?,?,?,'CONFIRMED',30000,?,?)");
  const inventory = db.prepare("INSERT OR IGNORE INTO room_inventory_nights (room_id,stay_date,booking_id) VALUES (?,?,?)");
  db.exec("BEGIN IMMEDIATE");
  try {
    for (let index = 0; index < 12; index += 1) {
      const suffix = String(index).padStart(2, "0");
      const roomId = `block-b-scroll-room-${suffix}`;
      const guestId = `block-b-scroll-guest-${suffix}`;
      const bookingId = `block-b-scroll-booking-${suffix}`;
      room.run(roomId, `B${suffix}`, "STANDARD");
      guest.run(guestId, `Scroll Guest ${suffix}`, `block-b-scroll-${suffix}@example.test`, now);
      booking.run(bookingId, guestId, roomId, checkIn, checkOut, now, now);
      for (let night = Date.parse(`${checkIn}T00:00:00Z`); night < Date.parse(`${checkOut}T00:00:00Z`); night += 86400000) inventory.run(roomId, new Date(night).toISOString().slice(0, 10), bookingId);
    }
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
  const count = db.prepare("SELECT COUNT(*) AS count FROM bookings WHERE id LIKE 'block-b-scroll-booking-%'").get().count;
  if (count !== 12) throw new Error(`Expected twelve synthetic scroll bookings; found ${count}`);
  console.log(JSON.stringify({ syntheticOnly: true, extraQueueRows: count, checkIn, checkOut }));
} finally { db.close(); }
