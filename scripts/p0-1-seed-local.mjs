import { readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { DatabaseSync } from "node:sqlite";
import { applyMigrations } from "./migration/wrangler-local.mjs";

const root = resolve(process.argv[2]);
if (!root.includes("p0-1-")) throw new Error("P0.1 fixture requires its own temporary persistence root");
process.env.CF_I09_ISOLATED_PERSISTENCE = "1";
for (const binding of ["CONTROL_DB", "HOTEL_DEMO_DB", "HOTEL_SECOND_DB"]) applyMigrations(binding, root);

function database(binding) {
  const directory = join(root, binding, "v3", "d1", "miniflare-D1DatabaseObject");
  const file = readdirSync(directory).find(name => name.endsWith(".sqlite") && name !== "metadata.sqlite");
  if (!file) throw new Error(`No local D1 for ${binding}`);
  return new DatabaseSync(join(directory, file));
}

const control = database("CONTROL_DB");
control.exec(`
  INSERT INTO control_hotels (id,slug,operational_binding,active) VALUES ('10000000-0000-0000-0000-000000000001','hotel-a','HOTEL_DEMO_DB',1);
  INSERT INTO access_identity_mappings (access_subject,email,active) VALUES
    ('source-user:14000000-0000-0000-0000-000000000001','ana-admin@migration.invalid',1),
    ('source-user:14000000-0000-0000-0000-000000000002','leo-reception@migration.invalid',1);
  INSERT INTO hotel_memberships (access_subject,hotel_id,role,active) VALUES
    ('source-user:14000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','admin',1),
    ('source-user:14000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','receptionist',1);
  INSERT INTO hotel_admin_metadata (hotel_id,name,plan_tier,timezone) VALUES
    ('10000000-0000-0000-0000-000000000001','Hotel Norte','BASIC','America/Argentina/Mendoza');
`);
control.close();

const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/Argentina/Mendoza", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
const field = type => parts.find(part => part.type === type)?.value;
const localDate = `${field("year")}-${field("month")}-${field("day")}`;
const previousDate = new Date(Date.parse(`${localDate}T00:00:00Z`) - 86400000).toISOString().slice(0, 10);
const afterDate = new Date(Date.parse(`${localDate}T00:00:00Z`) + 86400000).toISOString().slice(0, 10);
const checkoutDate = new Date(Date.parse(`${localDate}T00:00:00Z`) + 3 * 86400000).toISOString().slice(0, 10);
const hotel = database("HOTEL_DEMO_DB");
hotel.exec(`
  INSERT INTO rooms (id,room_number,room_type,status,price_cents) VALUES
    ('p01-room-a','101','STANDARD','AVAILABLE',10000),
    ('p01-room-b','102','STANDARD','AVAILABLE',12000),
    ('p01-room-c','103','STANDARD','MAINTENANCE',9000);
  INSERT INTO guests (id,full_name,email,created_at) VALUES
    ('p01-guest-a','Priority Arrival','priority@example.test','2026-01-01'),
    ('p01-guest-b','Next Arrival','next@example.test','2026-01-01'),
    ('p01-guest-c','Blocked Arrival','blocked@example.test','2026-01-01');
  INSERT INTO maintenance_cases (id,room_id,status,impact,priority,reason,assigned_to,reported_by_user_id,reported_at) VALUES
    ('p01-advisory','p01-room-b','OPEN','NON_BLOCKING','LOW','Lamp inspection planned','ops','source-user:14000000-0000-0000-0000-000000000001','2026-01-01T00:00:00Z'),
    ('p01-blocker','p01-room-c','OPEN','BLOCKING','HIGH','Electrical outlet unsafe','ops','source-user:14000000-0000-0000-0000-000000000001','2026-01-01T00:00:00Z');
`);
const insertBooking = hotel.prepare("INSERT INTO bookings (id,guest_id,room_id,check_in,check_out,status,total_cents,created_at,updated_at) VALUES (?,?,?,?,?,'CONFIRMED',?,? ,?)");
const now = new Date().toISOString();
insertBooking.run("z-priority", "p01-guest-a", "p01-room-a", previousDate, checkoutDate, 40000, now, now);
insertBooking.run("a-next", "p01-guest-b", "p01-room-b", localDate, checkoutDate, 36000, now, now);
insertBooking.run("m-blocked", "p01-guest-c", "p01-room-c", localDate, checkoutDate, 27000, now, now);
const claim = hotel.prepare("INSERT INTO room_inventory_nights (room_id,stay_date,booking_id) VALUES (?,?,?)");
for (const [room, booking, start] of [["p01-room-a", "z-priority", previousDate], ["p01-room-b", "a-next", localDate], ["p01-room-c", "m-blocked", localDate]]) {
  for (let date = start; date < checkoutDate; date = new Date(Date.parse(`${date}T00:00:00Z`) + 86400000).toISOString().slice(0, 10)) claim.run(room, date, booking);
}
hotel.exec(`INSERT INTO invoices (id,booking_id,amount_cents,paid_amount_cents,status,created_at) VALUES
  ('p01-invoice-a','z-priority',40000,0,'PENDING','2026-01-01'),
  ('p01-invoice-b','a-next',36000,0,'PENDING','2026-01-01'),
  ('p01-invoice-c','m-blocked',27000,0,'PENDING','2026-01-01');`);
hotel.close();
execFileSync(process.execPath, [resolve("scripts/migration/materialize-local-state.mjs"), root, join(root, "combined")], { stdio: "inherit" });
process.stdout.write(`P0.1 local D1 fixture ready: ${localDate} at ${root}\n`);
