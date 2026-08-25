import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import {
  BINDINGS,
  ENUMS,
  FIELD_DISPOSITION,
  REHEARSAL_ID,
  SOURCE_BASELINE,
} from "./source-target-map.mjs";

export const FIXTURE_URL = new URL(
  "./fixtures/source-synthetic.json",
  import.meta.url,
);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SOURCE_TABLES = Object.keys(FIELD_DISPOSITION);
const ACTIVE = new Set(["CONFIRMED", "CHECKED_IN"]);
const INVOICE_STATUSES = new Set(["PENDING", "PAID", "VOIDED"]);
const MAINTENANCE_STATUSES = new Set(["OPEN", "RESOLVED"]);
const MAINTENANCE_PRIORITIES = new Set(["LOW", "MEDIUM", "HIGH", "URGENT"]);

export function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object")
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
      .join(",")}}`;
  return JSON.stringify(value);
}
export const digestFixture = (fixture) =>
  createHash("sha256").update(canonicalJson(fixture)).digest("hex");
export async function loadFixture(path) {
  return JSON.parse(await readFile(path ?? FIXTURE_URL, "utf8"));
}
const fail = (message) => {
  throw new Error(`MIGRATION_PREFLIGHT_FAILED: ${message}`);
};
const assert = (condition, message) => {
  if (!condition) fail(message);
};
const utc = (value, label, nullable = false) => {
  if (value == null && nullable) return null;
  const timestamp =
    typeof value === "string" && /(?:Z|[+-]\d{2}:\d{2})$/i.test(value)
      ? value
      : `${value}Z`;
  assert(
    typeof value === "string" && !Number.isNaN(Date.parse(timestamp)),
    `${label} is not a TIMESTAMPTZ`,
  );
  return new Date(timestamp).toISOString();
};
const date = (value, label) => {
  assert(
    typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value),
    `${label} is not canonical DATE`,
  );
  assert(
    new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value,
    `${label} is invalid`,
  );
  return value;
};
const cents = (value, label) => {
  assert(
    Number.isSafeInteger(value),
    `${label} exceeds safe D1 INTEGER/JS range`,
  );
  return value;
};
const subject = (id) => (id == null ? null : `source-user:${id}`);
const unknownActor = (kind, id) => `legacy-source-user:unknown:${kind}:${id}`;
const q = (value) =>
  value == null ? "NULL" : `'${String(value).replaceAll("'", "''")}'`;
const b = (value) => (value == null ? "NULL" : value ? "1" : "0");
const ins = (table, columns, values) =>
  `INSERT INTO ${table} (${columns.join(",")}) VALUES (${values.map(q).join(",")});`;
const sorted = (rows) => [...rows].sort((a, b) => a.id.localeCompare(b.id));
const byHotel = (fixture, table, hotelId) =>
  sorted(fixture[table].filter((row) => row.hotel_id === hotelId));
const eventId = (kind, id) => `migration:${kind}:${id}`;

function validateKeys(table, rows) {
  const known = new Set(Object.keys(FIELD_DISPOSITION[table]));
  for (const row of rows) {
    for (const key of Object.keys(row))
      assert(
        known.has(key),
        `${table}.${key} has no explicit source-field disposition`,
      );
    for (const key of known)
      assert(
        Object.hasOwn(row, key),
        `${table}.${row.id ?? "row"} omits expected source field ${key}`,
      );
  }
}
function validateReferences(fixture) {
  const hotels = new Set(fixture.hotels.map((x) => x.id));
  const users = new Map(fixture.users.map((x) => [x.id, x]));
  const rooms = new Map(fixture.rooms.map((x) => [x.id, x]));
  const guests = new Map(fixture.guests.map((x) => [x.id, x]));
  const bookings = new Map(fixture.bookings.map((x) => [x.id, x]));
  const invoices = new Map(fixture.invoices.map((x) => [x.id, x]));
  for (const table of SOURCE_TABLES)
    for (const row of fixture[table]) {
      assert(UUID.test(row.id), `${table}.${row.id} is not a UUID`);
      if ("hotel_id" in row)
        assert(
          hotels.has(row.hotel_id),
          `${table}.${row.id} references unknown hotel`,
        );
    }
  for (const row of fixture.bookings) {
    assert(
      rooms.get(row.room_id)?.hotel_id === row.hotel_id,
      `booking ${row.id} room tenant mismatch`,
    );
    if (row.guest_id == null)
      assert(
        typeof row.guest_name === "string" && row.guest_name.trim(),
        `booking ${row.id} NULL guest_id requires nonblank guest_name reconstruction`,
      );
    else {
      assert(
        guests.get(row.guest_id)?.hotel_id === row.hotel_id,
        `booking ${row.id} guest tenant mismatch`,
      );
    }
    assert(
      ENUMS.booking_status[row.status],
      `booking ${row.id} has unknown status ${row.status}`,
    );
    assert(
      date(row.check_in, `booking ${row.id}.check_in`) <
        date(row.check_out, `booking ${row.id}.check_out`),
      `booking ${row.id} dates invalid`,
    );
    cents(row.total_price_cents, `booking ${row.id}.total_price_cents`);
    for (const key of [
      "created_at",
      "checked_in_at",
      "checked_out_at",
      "terminal_recorded_at",
      "late_arrival_eta",
      "late_arrival_recorded_at",
    ])
      utc(row[key], `booking ${row.id}.${key}`, key !== "created_at");
    for (const userKey of [
      "checked_in_by_user_id",
      "checked_out_by_user_id",
      "terminal_recorded_by_user_id",
      "late_arrival_recorded_by_user_id",
    ])
      if (row[userKey] != null)
        assert(
          users.get(row[userKey])?.hotel_id === row.hotel_id,
          `booking ${row.id} ${userKey} tenant mismatch`,
        );
  }
  for (const row of fixture.rooms) {
    assert(ENUMS.room_status[row.status], `room ${row.id} unknown status`);
    cents(row.price_cents, `room ${row.id}.price_cents`);
  }
  for (const row of fixture.users)
    assert(ENUMS.role[row.role], `user ${row.id} unknown role`);
  const sourceSaasAdmins = fixture.users
    .filter((row) => row.role === "saas_admin")
    .map((row) => row.id)
    .sort();
  const adaptedNetworkAdmins = [
    ...(fixture.target_adaptations?.network_admin_user_ids ?? []),
  ].sort();
  assert(
    canonicalJson(sourceSaasAdmins) === canonicalJson(adaptedNetworkAdmins),
    "network adaptation must exactly contain source saas_admin users; tenant admin cannot gain network capability",
  );
  for (const row of fixture.refresh_tokens) {
    assert(
      users.get(row.user_id)?.hotel_id === row.hotel_id,
      `refresh token ${row.id} user tenant mismatch`,
    );
    assert(
      UUID.test(row.session_id),
      `refresh token ${row.id} session_id is not a UUID`,
    );
    for (const key of ["expires_at", "revoked_at", "created_at"])
      utc(row[key], `refresh token ${row.id}.${key}`, key === "revoked_at");
  }
  for (const row of fixture.hotels) {
    assert(
      BINDINGS[row.id] ===
        fixture.target_adaptations.hotel_routes[row.id]?.binding,
      `hotel ${row.id} binding is not server-authoritative`,
    );
    assert(ENUMS.plan[row.plan_tier], `hotel ${row.id} unknown plan`);
    canonicalJson(row.config_json);
  }
  for (const table of [
    "extra_charges",
    "invoices",
    "payment_entries",
    "cash_closures",
  ])
    for (const row of fixture[table])
      for (const [key, value] of Object.entries(row))
        if (key.endsWith("_cents")) cents(value, `${table}.${row.id}.${key}`);
  const invoiceBookings = new Set();
  for (const row of fixture.invoices) {
    assert(
      bookings.get(row.booking_id)?.hotel_id === row.hotel_id,
      `invoice ${row.id} booking tenant mismatch`,
    );
    assert(
      !invoiceBookings.has(row.booking_id),
      `multiple source invoices for booking ${row.booking_id} cannot map to unique target invoice`,
    );
    invoiceBookings.add(row.booking_id);
    assert(
      INVOICE_STATUSES.has(row.status),
      `invoice ${row.id} has unknown status ${row.status}`,
    );
    assert(
      ENUMS.payment_method[row.payment_method],
      `invoice ${row.id} has unknown payment method ${row.payment_method}`,
    );
    assert(
      row.amount_cents >= 0 &&
        row.paid_amount_cents >= 0 &&
        row.paid_amount_cents <= row.amount_cents,
      `invoice ${row.id} has inconsistent cents`,
    );
  }
  for (const row of fixture.payment_entries) {
    assert(
      invoices.get(row.invoice_id)?.hotel_id === row.hotel_id &&
        bookings.get(row.booking_id)?.hotel_id === row.hotel_id &&
        invoices.get(row.invoice_id)?.booking_id === row.booking_id,
      `payment ${row.id} tenant/reference mismatch`,
    );
    assert(
      ENUMS.payment_method[row.payment_method],
      `payment ${row.id} has unknown payment method ${row.payment_method}`,
    );
    if (row.received_by_user_id != null)
      assert(
        users.get(row.received_by_user_id)?.hotel_id === row.hotel_id,
        `payment ${row.id} receiver tenant mismatch`,
      );
  }
  for (const row of fixture.extra_charges) {
    assert(
      bookings.get(row.booking_id)?.hotel_id === row.hotel_id,
      `charge ${row.id} booking tenant mismatch`,
    );
    assert(row.amount_cents > 0, `charge ${row.id} amount must be positive`);
  }
  for (const booking of fixture.bookings) {
    const chargeTotal = fixture.extra_charges
      .filter((charge) => charge.booking_id === booking.id)
      .reduce((sum, charge) => sum + charge.amount_cents, 0);
    assert(
      booking.total_price_cents >= chargeTotal,
      `booking ${booking.id} final total is lower than source charges`,
    );
  }
  for (const row of fixture.room_holds) {
    assert(
      rooms.get(row.room_id)?.hotel_id === row.hotel_id,
      `room hold ${row.id} room tenant mismatch`,
    );
    if (row.created_by_user_id != null)
      assert(
        users.get(row.created_by_user_id)?.hotel_id === row.hotel_id,
        `room hold ${row.id} actor tenant mismatch`,
      );
    assert(
      ENUMS.hold_type[row.hold_type],
      `room hold ${row.id} has unknown type ${row.hold_type}`,
    );
    assert(
      date(row.start_date, `room hold ${row.id}.start_date`) <
        date(row.end_date, `room hold ${row.id}.end_date`),
      `room hold ${row.id} dates invalid`,
    );
  }
  for (const row of fixture.maintenance_cases) {
    assert(
      rooms.get(row.room_id)?.hotel_id === row.hotel_id,
      `maintenance ${row.id} room tenant mismatch`,
    );
    if (row.reported_by_user_id != null)
      assert(
        users.get(row.reported_by_user_id)?.hotel_id === row.hotel_id,
        `maintenance ${row.id} reporter tenant mismatch`,
      );
    if (row.resolved_by_user_id != null)
      assert(
        users.get(row.resolved_by_user_id)?.hotel_id === row.hotel_id,
        `maintenance ${row.id} resolver tenant mismatch`,
      );
    assert(
      MAINTENANCE_STATUSES.has(row.status),
      `maintenance ${row.id} has unknown status ${row.status}`,
    );
    assert(
      MAINTENANCE_PRIORITIES.has(row.priority),
      `maintenance ${row.id} has unknown priority ${row.priority}`,
    );
    assert(
      (row.status === "OPEN" &&
        row.resolution_note == null &&
        row.resolved_by_user_id == null &&
        row.resolved_at == null &&
        row.return_status == null) ||
        (row.status === "RESOLVED" &&
          typeof row.resolution_note === "string" &&
          row.resolution_note.trim() &&
          row.resolved_by_user_id != null &&
          row.resolved_at != null &&
          row.return_status === "DIRTY"),
      `maintenance ${row.id} state/provenance mismatch`,
    );
  }
  for (const row of fixture.audit_events)
    if (row.user_id != null)
      assert(
        users.get(row.user_id)?.hotel_id === row.hotel_id,
        `audit ${row.id} actor tenant mismatch`,
      );
  for (const row of fixture.cash_closures) {
    assert(
      users.get(row.user_id)?.hotel_id === row.hotel_id,
      `cash closure ${row.id} actor tenant mismatch`,
    );
    const opening = utc(
      row.opening_time,
      `cash closure ${row.id}.opening_time`,
    );
    const closing = utc(
      row.closing_time,
      `cash closure ${row.id}.closing_time`,
    );
    assert(opening <= closing, `cash closure ${row.id} time range invalid`);
    const shiftPayments = fixture.payment_entries.filter(
      (payment) =>
        payment.hotel_id === row.hotel_id &&
        utc(payment.received_at, `payment ${payment.id}.received_at`) >=
          opening &&
        utc(payment.received_at, `payment ${payment.id}.received_at`) <=
          closing,
    );
    const total = shiftPayments.reduce(
      (sum, payment) => sum + payment.amount_cents,
      0,
    );
    const cash = shiftPayments
      .filter((payment) => payment.payment_method === "CASH")
      .reduce((sum, payment) => sum + payment.amount_cents, 0);
    const nonCash = total - cash;
    assert(
      row.payment_count === shiftPayments.length &&
        row.total_amount_cents === total &&
        row.cash_amount_cents === cash &&
        row.card_amount_cents === nonCash,
      `cash closure ${row.id} payment summary mismatch`,
    );
    assert(
      row.cash_difference_cents ===
        row.counted_cash_amount_cents - row.cash_amount_cents,
      `cash closure ${row.id} cash difference mismatch`,
    );
  }
  for (const invoice of fixture.invoices) {
    const paid = fixture.payment_entries
      .filter((payment) => payment.invoice_id === invoice.id)
      .reduce((sum, payment) => sum + payment.amount_cents, 0);
    assert(
      invoice.paid_amount_cents === paid,
      `invoice ${invoice.id} paid amount does not match payment entries`,
    );
  }
  const claims = new Set();
  for (const row of fixture.bookings.filter((x) => ACTIVE.has(x.status)))
    for (const stayDate of nights(row.check_in, row.check_out)) {
      const key = `${row.hotel_id}:${row.room_id}:${stayDate}`;
      assert(!claims.has(key), `active booking overlap ${key}`);
      claims.add(key);
    }
}

export function validateFixture(fixture) {
  assert(
    fixture.source_baseline === SOURCE_BASELINE,
    "source baseline mismatch",
  );
  assert(fixture.fixture_id === REHEARSAL_ID, "fixture/rehearsal ID mismatch");
  assert(
    Object.keys(BINDINGS).length === 2 && fixture.hotels.length === 2,
    "exactly two hotel bindings required",
  );
  const reportRange = fixture.target_adaptations?.reconciliation_report_range;
  assert(
    reportRange &&
      date(reportRange.start, "reconciliation report start") <=
        date(reportRange.end, "reconciliation report end"),
    "reconciliation report range invalid",
  );
  for (const table of SOURCE_TABLES) {
    assert(
      Array.isArray(fixture[table]),
      `missing source table fixture ${table}`,
    );
    validateKeys(table, fixture[table]);
  }
  validateReferences(fixture);
  assert(
    fixture.bookings.some((x) => x.guest_id == null),
    "legacy NULL guest fixture missing",
  );
  assert(
    fixture.bookings.some((x) => x.status === "NO_SHOW" && x.terminal_reason),
    "NO_SHOW terminal fixture missing",
  );
  assert(
    fixture.bookings.some((x) => x.late_arrival_eta),
    "late-arrival fixture missing",
  );
  return { source_digest: digestFixture(fixture) };
}

export function nights(start, end) {
  const out = [];
  for (
    let value = new Date(`${start}T00:00:00Z`);
    value < new Date(`${end}T00:00:00Z`);
    value.setUTCDate(value.getUTCDate() + 1)
  )
    out.push(value.toISOString().slice(0, 10));
  return out;
}
function reconstructedGuest(row, importedAt) {
  return {
    id: `legacy-guest:${row.id}`,
    full_name: row.guest_name.trim(),
    email: `${row.id}@migration.invalid`,
    phone: null,
    created_at: utc(row.created_at, "legacy guest timestamp"),
    imported_at: importedAt,
  };
}
function updatedAt(row, charges = []) {
  return [
    row.terminal_recorded_at,
    row.late_arrival_recorded_at,
    row.checked_out_at,
    row.checked_in_at,
    row.created_at,
    ...charges.map((charge) => charge.created_at),
  ]
    .filter(Boolean)
    .map((x) => utc(x, "booking timestamp"))
    .sort()
    .at(-1);
}

export function buildControlSql(fixture, sourceDigest) {
  const lines = ["PRAGMA foreign_keys = ON;"];
  for (const hotel of sorted(fixture.hotels)) {
    lines.push(
      ins(
        "control_hotels",
        ["id", "slug", "operational_binding", "active"],
        [
          hotel.id,
          fixture.target_adaptations.hotel_routes[hotel.id].slug,
          BINDINGS[hotel.id],
          1,
        ],
      ),
    );
    lines.push(
      ins(
        "hotel_admin_metadata",
        ["hotel_id", "name", "address", "plan_tier", "features_json"],
        [
          hotel.id,
          hotel.name,
          hotel.address,
          ENUMS.plan[hotel.plan_tier],
          canonicalJson(hotel.config_json),
        ],
      ),
    );
  }
  for (const user of sorted(fixture.users)) {
    const accessSubject = subject(user.id);
    const email = `${user.username}@migration.invalid`;
    lines.push(
      ins(
        "access_identity_mappings",
        ["access_subject", "email", "active"],
        [accessSubject, email, 1],
      ),
    );
    if (user.role !== "saas_admin")
      lines.push(
        ins(
          "hotel_memberships",
          ["access_subject", "hotel_id", "role", "active"],
          [accessSubject, user.hotel_id, ENUMS.role[user.role], 1],
        ),
      );
    if (user.role === "saas_admin")
      lines.push(
        ins(
          "network_memberships",
          ["access_subject", "role", "active"],
          [accessSubject, "saas_admin", 1],
        ),
      );
  }
  for (const audit of sorted(fixture.audit_events))
    lines.push(
      ins(
        "control_audit_events",
        [
          "id",
          "actor_subject",
          "request_id",
          "hotel_id",
          "action",
          "target_type",
          "target_id",
          "details_json",
          "created_at",
        ],
        [
          audit.id,
          audit.user_id == null
            ? `legacy-source-user:unknown:${audit.id}`
            : subject(audit.user_id),
          `migration:${audit.id}`,
          audit.hotel_id,
          audit.action,
          "source_audit",
          audit.id,
          canonicalJson({
            source_ip_address: audit.ip_address,
            source_table: "audit_events",
            actor_reconstruction:
              audit.user_id == null
                ? "source user_id NULL; unknown actor retained without attributing migration operator"
                : null,
          }),
          utc(audit.created_at, "audit created_at"),
        ],
      ),
    );
  lines.push(
    ins(
      "migration_rehearsals",
      [
        "rehearsal_id",
        "source_baseline",
        "source_digest",
        "imported_at",
        "status",
      ],
      [
        REHEARSAL_ID,
        SOURCE_BASELINE,
        sourceDigest,
        fixture.imported_at,
        "APPLIED",
      ],
    ),
  );
  return `${lines.join("\n")}\n`;
}

export function buildHotelSql(fixture, hotelId, sourceDigest) {
  const lines = ["PRAGMA foreign_keys = ON;"];
  const importedAt = utc(fixture.imported_at, "imported_at");
  const rooms = byHotel(fixture, "rooms", hotelId);
  const guests = byHotel(fixture, "guests", hotelId);
  const bookings = byHotel(fixture, "bookings", hotelId);
  const chargeTotalByBooking = new Map();
  for (const charge of byHotel(fixture, "extra_charges", hotelId))
    chargeTotalByBooking.set(
      charge.booking_id,
      (chargeTotalByBooking.get(charge.booking_id) ?? 0) + charge.amount_cents,
    );
  for (const room of rooms)
    lines.push(
      ins(
        "rooms",
        ["id", "room_number", "status", "price_cents", "room_type"],
        [
          room.id,
          room.room_number,
          ENUMS.room_status[room.status],
          room.price_cents,
          room.room_type,
        ],
      ),
    );
  for (const guest of guests)
    lines.push(
      ins(
        "guests",
        ["id", "full_name", "email", "phone", "created_at"],
        [
          guest.id,
          guest.full_name,
          guest.email,
          guest.phone,
          utc(guest.created_at, "guest created_at"),
        ],
      ),
    );
  for (const booking of bookings.filter((x) => x.guest_id == null)) {
    const guest = reconstructedGuest(booking, importedAt);
    lines.push(
      ins(
        "guests",
        ["id", "full_name", "email", "phone", "created_at"],
        [guest.id, guest.full_name, guest.email, guest.phone, guest.created_at],
      ),
    );
    lines.push(
      ins(
        "migration_provenance",
        [
          "id",
          "source_table",
          "source_id",
          "target_table",
          "target_id",
          "actor_subject",
          "source_timestamp",
          "imported_at",
          "reason",
        ],
        [
          eventId("legacy-guest", booking.id),
          "bookings",
          booking.id,
          "guests",
          guest.id,
          "migration:cf-i09",
          utc(booking.created_at, "booking created_at"),
          importedAt,
          "source guest_id NULL; reconstructed from nonblank guest_name without asserting real identity",
        ],
      ),
    );
  }
  for (const row of bookings) {
    const guestId = row.guest_id ?? reconstructedGuest(row, importedAt).id;
    lines.push(
      ins(
        "bookings",
        [
          "id",
          "guest_id",
          "room_id",
          "check_in",
          "check_out",
          "status",
          "total_cents",
          "notes",
          "checked_in_at",
          "checked_in_by",
          "checked_out_at",
          "checked_out_by",
          "created_at",
          "updated_at",
          "check_in_guests_count",
          "check_out_payment_policy",
          "check_out_reference",
          "guest_name_snapshot",
          "check_in_reference",
          "check_in_document_verified",
          "check_in_contact_confirmed",
          "check_in_stay_confirmed",
          "check_out_charges_reviewed",
          "check_out_room_release_confirmed",
          "check_out_housekeeping_handoff",
          "terminal_reason",
          "terminal_recorded_at",
          "terminal_recorded_by",
          "late_arrival_eta",
          "late_arrival_note",
          "late_arrival_recorded_at",
          "late_arrival_recorded_by",
        ],
        [
          row.id,
          guestId,
          row.room_id,
          date(row.check_in, "check_in"),
          date(row.check_out, "check_out"),
          ENUMS.booking_status[row.status],
          row.total_price_cents - (chargeTotalByBooking.get(row.id) ?? 0),
          null,
          utc(row.checked_in_at, "checked_in_at", true),
          row.checked_in_by_user_id == null
            ? unknownActor("checkin", row.id)
            : subject(row.checked_in_by_user_id),
          utc(row.checked_out_at, "checked_out_at", true),
          row.checked_out_by_user_id == null
            ? unknownActor("checkout", row.id)
            : subject(row.checked_out_by_user_id),
          utc(row.created_at, "created_at"),
          updatedAt(
            row,
            byHotel(fixture, "extra_charges", hotelId).filter(
              (charge) => charge.booking_id === row.id,
            ),
          ),
          row.check_in_guests_count,
          row.check_out_payment_policy,
          row.check_out_reference,
          row.guest_name,
          row.check_in_reference,
          row.check_in_document_verified == null
            ? null
            : Number(row.check_in_document_verified),
          row.check_in_contact_confirmed == null
            ? null
            : Number(row.check_in_contact_confirmed),
          row.check_in_stay_confirmed == null
            ? null
            : Number(row.check_in_stay_confirmed),
          row.check_out_charges_reviewed == null
            ? null
            : Number(row.check_out_charges_reviewed),
          row.check_out_room_release_confirmed == null
            ? null
            : Number(row.check_out_room_release_confirmed),
          row.check_out_housekeeping_handoff == null
            ? null
            : Number(row.check_out_housekeeping_handoff),
          row.terminal_reason,
          utc(row.terminal_recorded_at, "terminal_recorded_at", true),
          subject(row.terminal_recorded_by_user_id),
          utc(row.late_arrival_eta, "late_arrival_eta", true),
          row.late_arrival_note,
          utc(row.late_arrival_recorded_at, "late_arrival_recorded_at", true),
          subject(row.late_arrival_recorded_by_user_id),
        ],
      ),
    );
    if (ACTIVE.has(row.status))
      for (const stayDate of nights(row.check_in, row.check_out))
        lines.push(
          ins(
            "room_inventory_nights",
            ["room_id", "stay_date", "booking_id"],
            [row.room_id, stayDate, row.id],
          ),
        );
  }
  for (const row of byHotel(fixture, "room_holds", hotelId))
    lines.push(
      ins(
        "room_holds",
        [
          "id",
          "room_id",
          "start_date",
          "end_date",
          "hold_type",
          "reason",
          "created_by_user_id",
          "created_at",
        ],
        [
          row.id,
          row.room_id,
          row.start_date,
          row.end_date,
          ENUMS.hold_type[row.hold_type],
          row.reason,
          subject(row.created_by_user_id),
          utc(row.created_at, "hold created_at"),
        ],
      ),
    );
  for (const row of byHotel(fixture, "maintenance_cases", hotelId))
    lines.push(
      ins(
        "maintenance_cases",
        [
          "id",
          "room_id",
          "status",
          "priority",
          "reason",
          "assigned_to",
          "reported_by_user_id",
          "reported_at",
          "resolution_note",
          "resolved_by_user_id",
          "resolved_at",
          "return_status",
        ],
        [
          row.id,
          row.room_id,
          row.status,
          row.priority,
          row.reason,
          row.assigned_to,
          subject(row.reported_by_user_id),
          utc(row.reported_at, "reported_at"),
          row.resolution_note,
          subject(row.resolved_by_user_id),
          utc(row.resolved_at, "resolved_at", true),
          row.return_status,
        ],
      ),
    );
  for (const row of byHotel(fixture, "extra_charges", hotelId))
    lines.push(
      ins(
        "extra_charges",
        [
          "id",
          "booking_id",
          "description",
          "amount_cents",
          "category",
          "created_at",
        ],
        [
          row.id,
          row.booking_id,
          row.description,
          row.amount_cents,
          row.category,
          utc(row.created_at, "charge created_at"),
        ],
      ),
    );
  for (const row of byHotel(fixture, "invoices", hotelId))
    lines.push(
      ins(
        "invoices",
        [
          "id",
          "booking_id",
          "amount_cents",
          "paid_amount_cents",
          "status",
          "payment_method",
          "payment_reference",
          "paid_at",
          "created_at",
        ],
        [
          row.id,
          row.booking_id,
          row.amount_cents,
          row.paid_amount_cents,
          row.status,
          ENUMS.payment_method[row.payment_method],
          row.payment_reference,
          utc(row.paid_at, "paid_at", true),
          utc(row.created_at, "invoice created_at"),
        ],
      ),
    );
  for (const row of byHotel(fixture, "payment_entries", hotelId)) {
    lines.push(
      ins(
        "payment_entries",
        [
          "id",
          "invoice_id",
          "booking_id",
          "amount_cents",
          "payment_method",
          "payment_reference",
          "note",
          "received_by_user_id",
          "received_at",
        ],
        [
          row.id,
          row.invoice_id,
          row.booking_id,
          row.amount_cents,
          ENUMS.payment_method[row.payment_method],
          row.payment_reference,
          row.note,
          row.received_by_user_id == null
            ? unknownActor("payment", row.id)
            : subject(row.received_by_user_id),
          utc(row.received_at, "received_at"),
        ],
      ),
    );
    lines.push(
      ins(
        "financial_events",
        [
          "id",
          "event_type",
          "booking_id",
          "actor_subject",
          "request_id",
          "hotel_id",
          "details_json",
          "created_at",
        ],
        [
          eventId("payment", row.id),
          "PAYMENT_RECORDED",
          row.booking_id,
          row.received_by_user_id == null
            ? unknownActor("payment", row.id)
            : subject(row.received_by_user_id),
          eventId("request-payment", row.id),
          hotelId,
          canonicalJson({
            amount_cents: row.amount_cents,
            source_payment_id: row.id,
            actor_reconstruction:
              row.received_by_user_id == null
                ? "source received_by_user_id NULL in legacy backfill; unknown actor retained without attributing migration operator"
                : null,
          }),
          utc(row.received_at, "received_at"),
        ],
      ),
    );
  }
  for (const row of byHotel(fixture, "cash_closures", hotelId)) {
    const requestId = eventId("request-cash", row.id);
    const closureEventId = eventId("cash", row.id);
    lines.push(
      ins(
        "cash_closures",
        [
          "id",
          "actor_subject",
          "total_amount_cents",
          "cash_amount_cents",
          "card_amount_cents",
          "payment_count",
          "counted_cash_amount_cents",
          "cash_difference_cents",
          "opening_time",
          "closing_time",
          "handoff_to",
          "notes",
          "request_id",
          "hotel_id",
          "operation_token",
        ],
        [
          row.id,
          subject(row.user_id),
          row.total_amount_cents,
          row.cash_amount_cents,
          row.card_amount_cents,
          row.payment_count,
          row.counted_cash_amount_cents,
          row.cash_difference_cents,
          utc(row.opening_time, "opening_time"),
          utc(row.closing_time, "closing_time"),
          row.handoff_to,
          row.notes,
          requestId,
          hotelId,
          eventId("operation-cash", row.id),
        ],
      ),
    );
    lines.push(
      `UPDATE financial_events SET id=${q(closureEventId)} WHERE request_id=${q(requestId)} AND event_type='CASH_CLOSURE';`,
    );
  }
  for (const row of bookings.filter((x) => x.checked_in_at))
    lines.push(
      ins(
        "lifecycle_events",
        [
          "id",
          "booking_id",
          "event_type",
          "actor_subject",
          "request_id",
          "hotel_id",
          "details_json",
          "created_at",
          "from_room_id",
        ],
        [
          eventId("checkin", row.id),
          row.id,
          "CHECK_IN",
          row.checked_in_by_user_id == null
            ? unknownActor("checkin", row.id)
            : subject(row.checked_in_by_user_id),
          eventId("request-checkin", row.id),
          hotelId,
          canonicalJson({
            source_snapshot: true,
            actor_reconstruction:
              row.checked_in_by_user_id == null
                ? "source checked_in_by_user_id NULL; unknown actor retained without attributing migration operator"
                : null,
          }),
          utc(row.checked_in_at, "checked_in_at"),
          null,
        ],
      ),
    );
  for (const row of bookings.filter((x) => x.checked_out_at))
    lines.push(
      ins(
        "lifecycle_events",
        [
          "id",
          "booking_id",
          "event_type",
          "actor_subject",
          "request_id",
          "hotel_id",
          "details_json",
          "created_at",
          "from_room_id",
        ],
        [
          eventId("checkout", row.id),
          row.id,
          "CHECK_OUT",
          row.checked_out_by_user_id == null
            ? unknownActor("checkout", row.id)
            : subject(row.checked_out_by_user_id),
          eventId("request-checkout", row.id),
          hotelId,
          canonicalJson({
            source_snapshot: true,
            actor_reconstruction:
              row.checked_out_by_user_id == null
                ? "source checked_out_by_user_id NULL; unknown actor retained without attributing migration operator"
                : null,
          }),
          utc(row.checked_out_at, "checked_out_at"),
          row.room_id,
        ],
      ),
    );
  for (const row of byHotel(fixture, "maintenance_cases", hotelId)) {
    const type =
      row.status === "OPEN" ? "MAINTENANCE_OPEN" : "MAINTENANCE_RESOLVE";
    const from = row.status === "OPEN" ? "AVAILABLE" : "MAINTENANCE";
    const to = row.status === "OPEN" ? "MAINTENANCE" : "DIRTY";
    const actor =
      row.status === "OPEN" ? row.reported_by_user_id : row.resolved_by_user_id;
    const at = row.status === "OPEN" ? row.reported_at : row.resolved_at;
    lines.push(
      ins(
        "housekeeping_events",
        [
          "id",
          "room_id",
          "maintenance_case_id",
          "event_type",
          "from_status",
          "to_status",
          "actor_subject",
          "request_id",
          "hotel_id",
          "details_json",
          "created_at",
        ],
        [
          eventId("maintenance", row.id),
          row.room_id,
          row.id,
          type,
          from,
          to,
          actor == null ? unknownActor("maintenance", row.id) : subject(actor),
          eventId("request-maintenance", row.id),
          hotelId,
          canonicalJson({
            source_maintenance_case_id: row.id,
            source_snapshot: true,
            actor_reconstruction:
              actor == null
                ? "source reporter NULL in legacy backfill; unknown actor retained without attributing migration operator"
                : null,
          }),
          utc(at, "maintenance event timestamp"),
        ],
      ),
    );
  }
  lines.push(
    ins(
      "migration_rehearsals",
      [
        "rehearsal_id",
        "source_baseline",
        "source_digest",
        "imported_at",
        "status",
      ],
      [REHEARSAL_ID, SOURCE_BASELINE, sourceDigest, importedAt, "APPLIED"],
    ),
  );
  return `${lines.join("\n")}\n`;
}

export function expectedForHotel(fixture, hotelId) {
  const bookings = byHotel(fixture, "bookings", hotelId);
  const charges = byHotel(fixture, "extra_charges", hotelId);
  const states = Object.fromEntries(
    Object.keys(ENUMS.booking_status).map((state) => [
      state,
      bookings.filter((x) => x.status === state).length,
    ]),
  );
  const reportRange = fixture.target_adaptations.reconciliation_report_range;
  const reportDays = nights(
    reportRange.start,
    new Date(Date.parse(`${reportRange.end}T00:00:00Z`) + 86400000)
      .toISOString()
      .slice(0, 10),
  );
  const reportBookings = bookings.filter(
    (row) =>
      !["CANCELLED", "NO_SHOW"].includes(row.status) &&
      row.check_in >= reportRange.start &&
      row.check_in <= reportRange.end,
  );
  const activeReportBookings = bookings.filter((row) => ACTIVE.has(row.status));
  const occupiedRoomNights = activeReportBookings.reduce(
    (sum, row) =>
      sum +
      nights(row.check_in, row.check_out).filter(
        (day) => day >= reportRange.start && day <= reportRange.end,
      ).length,
    0,
  );
  const totalRoomNights =
    byHotel(fixture, "rooms", hotelId).length * reportDays.length;
  const reportRevenue = reportBookings.reduce(
    (sum, row) => sum + row.total_price_cents,
    0,
  );
  const dashboardDate = fixture.imported_at.slice(0, 10);
  const dashboardMonth = `${dashboardDate.slice(0, 8)}01`;
  const dashboardRevenue = bookings
    .filter(
      (row) =>
        !["CANCELLED", "NO_SHOW"].includes(row.status) &&
        row.check_in >= dashboardMonth,
    )
    .reduce((sum, row) => sum + row.total_price_cents, 0);
  const dashboardOccupiedRooms = new Set(
    activeReportBookings
      .filter(
        (row) => row.check_in <= dashboardDate && row.check_out > dashboardDate,
      )
      .map((row) => row.room_id),
  ).size;
  const totalRooms = byHotel(fixture, "rooms", hotelId).length;
  const dashboardAdr =
    activeReportBookings.length === 0
      ? 0
      : Math.trunc(dashboardRevenue / activeReportBookings.length);
  return {
    hotel_id: hotelId,
    binding: BINDINGS[hotelId],
    rooms: byHotel(fixture, "rooms", hotelId).length,
    guests:
      byHotel(fixture, "guests", hotelId).length +
      bookings.filter((x) => x.guest_id == null).length,
    reconstructed_guests: bookings.filter((x) => x.guest_id == null).length,
    bookings: bookings.length,
    inventory_nights: bookings
      .filter((x) => ACTIVE.has(x.status))
      .reduce((sum, x) => sum + nights(x.check_in, x.check_out).length, 0),
    booking_state_counts: states,
    booking_total_cents: bookings.reduce(
      (sum, x) => sum + x.total_price_cents,
      0,
    ),
    report_revenue_cents: reportRevenue,
    report_occupied_room_nights: occupiedRoomNights,
    report_total_room_nights: totalRoomNights,
    report_occupancy_rate_milli:
      totalRoomNights === 0
        ? 0
        : Math.trunc((occupiedRoomNights * 100000) / totalRoomNights),
    dashboard_active_bookings: activeReportBookings.length,
    dashboard_occupied_rooms: dashboardOccupiedRooms,
    dashboard_occupancy_rate_milli:
      totalRooms === 0
        ? 0
        : Math.trunc((dashboardOccupiedRooms * 100000) / totalRooms),
    dashboard_adr_cents: dashboardAdr,
    dashboard_rev_par_cents:
      totalRooms === 0
        ? 0
        : Math.trunc((dashboardOccupiedRooms * dashboardAdr) / totalRooms),
    excluded_no_show_total_cents: bookings
      .filter((row) => row.status === "NO_SHOW")
      .reduce((sum, row) => sum + row.total_price_cents, 0),
    no_show_inventory_nights: 0,
    extra_charges: charges.length,
    charge_total_cents: charges.reduce((s, x) => s + x.amount_cents, 0),
    invoices: byHotel(fixture, "invoices", hotelId).length,
    invoice_total_cents: byHotel(fixture, "invoices", hotelId).reduce(
      (s, x) => s + x.amount_cents,
      0,
    ),
    payments: byHotel(fixture, "payment_entries", hotelId).length,
    payment_total_cents: byHotel(fixture, "payment_entries", hotelId).reduce(
      (s, x) => s + x.amount_cents,
      0,
    ),
    cash_closures: byHotel(fixture, "cash_closures", hotelId).length,
    cash_closure_total_cents: byHotel(fixture, "cash_closures", hotelId).reduce(
      (s, x) => s + x.total_amount_cents,
      0,
    ),
    maintenance_cases: byHotel(fixture, "maintenance_cases", hotelId).length,
    lifecycle_events:
      bookings.filter((x) => x.checked_in_at).length +
      bookings.filter((x) => x.checked_out_at).length,
    housekeeping_events: byHotel(fixture, "maintenance_cases", hotelId).length,
    financial_events:
      byHotel(fixture, "payment_entries", hotelId).length +
      byHotel(fixture, "cash_closures", hotelId).length,
  };
}
