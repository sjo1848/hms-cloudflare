import { readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

const root = resolve(process.argv[2] ?? "");
const role = process.argv[3];
if (!root.includes("p0-1-block-b-") || !["admin", "housekeeping"].includes(role)) {
  throw new Error("Usage: cf-block-b-set-synthetic-role.mjs .hms-local/p0-1-block-b-* admin|housekeeping");
}
const directory = join(root, "combined", "v3", "d1", "miniflare-D1DatabaseObject");
const file = readdirSync(directory).find(name => {
  if (!name.endsWith(".sqlite") || name === "metadata.sqlite") return false;
  const probe = new DatabaseSync(join(directory, name), { readOnly: true });
  try { return Boolean(probe.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='hotel_memberships'").get()); }
  finally { probe.close(); }
});
if (!file) throw new Error("Block B synthetic control-plane D1 file not found");
const db = new DatabaseSync(join(directory, file));
try {
  const subject = "source-user:14000000-0000-0000-0000-000000000001";
  const hotel = "10000000-0000-0000-0000-000000000001";
  const prior = db.prepare("SELECT role FROM hotel_memberships WHERE access_subject = ? AND hotel_id = ? AND active = 1").get(subject, hotel);
  if (!prior) throw new Error("Expected one active synthetic same-subject hotel membership");
  db.prepare("UPDATE hotel_memberships SET role = ? WHERE access_subject = ? AND hotel_id = ? AND active = 1").run(role, subject, hotel);
  const current = db.prepare("SELECT role FROM hotel_memberships WHERE access_subject = ? AND hotel_id = ? AND active = 1").get(subject, hotel);
  if (current?.role !== role) throw new Error(`Synthetic membership role update did not persist: ${JSON.stringify(current)}`);
  console.log(JSON.stringify({ syntheticOnly: true, accessSubject: subject, hotelId: hotel, priorRole: prior.role, role: current.role }));
} finally { db.close(); }
