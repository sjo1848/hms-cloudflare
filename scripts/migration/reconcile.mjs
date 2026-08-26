#!/usr/bin/env node
import { resolve } from "node:path";
import {
  BINDINGS,
  REHEARSAL_ID,
  SOURCE_BASELINE,
} from "./source-target-map.mjs";
import {
  canonicalJson,
  expectedForHotel,
  loadFixture,
  validateFixture,
} from "./migration-core.mjs";
import { query } from "./wrangler-local.mjs";

function options(argv) {
  const result = {
    persistTo: resolve("apps/api/.wrangler/state"),
    fixture: null,
  };
  for (let index = 0; index < argv.length; index++) {
    if (argv[index] === "--persist-to")
      result.persistTo = resolve(argv[++index]);
    else if (argv[index] === "--fixture")
      result.fixture = resolve(argv[++index]);
    else throw new Error(`unknown argument ${argv[index]}`);
  }
  return result;
}
const sqlList = (values) =>
  values.length
    ? values.map((x) => `'${String(x).replaceAll("'", "''")}'`).join(",")
    : "NULL";
const sqlValue = (value) =>
  value == null
    ? "NULL"
    : typeof value === "number"
      ? String(value)
      : `'${String(value).replaceAll("'", "''")}'`;
const normalizedTime = (value) =>
  value == null
    ? null
    : new Date(
        /(?:Z|[+-]\d{2}:\d{2})$/i.test(value) ? value : `${value}Z`,
      ).toISOString();
const sourceSubject = (value) =>
  value == null ? null : `source-user:${value}`;
const exactExists = (table, rows, expectedColumns) =>
  rows.length === 0
    ? "0"
    : rows
        .map((row) => {
          const expected = expectedColumns(row);
          return `(CASE WHEN EXISTS (SELECT 1 FROM ${table} WHERE ${Object.entries(
            expected,
          )
            .map(([column, value]) => `${column} IS ${sqlValue(value)}`)
            .join(" AND ")}) THEN 0 ELSE 1 END)`;
        })
        .join("+");
const actualObject = (payload) =>
  JSON.parse(payload[0].results[0].reconciliation);
function assertEqual(actual, expected, label) {
  if (canonicalJson(actual) !== canonicalJson(expected))
    throw new Error(
      `RECONCILIATION_FAILED ${label}: expected=${canonicalJson(expected)} actual=${canonicalJson(actual)}`,
    );
}

async function main() {
  const selected = options(process.argv.slice(2));
  const fixture = await loadFixture(selected.fixture);
  const { source_digest: digest } = validateFixture(fixture);
  const hotelIds = fixture.hotels.map((x) => x.id);
  const subjects = fixture.users.map((x) => `source-user:${x.id}`);
  const exactControlRows = [
    exactExists("control_hotels", fixture.hotels, (row) => ({
      id: row.id,
      slug: fixture.target_adaptations.hotel_routes[row.id].slug,
      operational_binding: BINDINGS[row.id],
      active: 1,
    })),
    exactExists("hotel_admin_metadata", fixture.hotels, (row) => ({
      hotel_id: row.id,
      name: row.name,
      address: row.address,
      plan_tier: row.plan_tier,
      features_json: canonicalJson(row.config_json),
    })),
    exactExists("access_identity_mappings", fixture.users, (row) => ({
      access_subject: sourceSubject(row.id),
      email: `${row.username}@migration.invalid`,
      active: 1,
    })),
    exactExists("hotel_memberships", fixture.users.filter((row) => row.role !== "saas_admin"), (row) => ({
      access_subject: sourceSubject(row.id),
      hotel_id: row.hotel_id,
      role: row.role,
      active: 1,
    })),
    exactExists(
      "network_memberships",
      fixture.target_adaptations.network_admin_user_ids.map((id) => ({ id })),
      (row) => ({
        access_subject: sourceSubject(row.id),
        role: "saas_admin",
        active: 1,
      }),
    ),
    exactExists("control_audit_events", fixture.audit_events, (row) => ({
      id: row.id,
      actor_subject:
        row.user_id == null
          ? `legacy-source-user:unknown:${row.id}`
          : sourceSubject(row.user_id),
      request_id: `migration:${row.id}`,
      hotel_id: row.hotel_id,
      action: row.action,
      target_type: "source_audit",
      target_id: row.id,
      details_json: canonicalJson({
        source_ip_address: row.ip_address,
        source_table: "audit_events",
        actor_reconstruction:
          row.user_id == null
            ? "source user_id NULL; unknown actor retained without attributing migration operator"
            : null,
      }),
      created_at: normalizedTime(row.created_at),
    })),
  ].join("+");
  const controlExpected = {
    hotels: fixture.hotels.length,
    identities: fixture.users.length,
    memberships: fixture.users.filter((row) => row.role !== "saas_admin").length,
    network_memberships: fixture.users.filter((row) => row.role === "saas_admin").length,
    metadata: fixture.hotels.length,
    audit_events: fixture.audit_events.length,
    manifest: 1,
    bad_bindings: 0,
    duplicate_active_bindings: 0,
    unexpected_subjects: 0,
    password_columns: 0,
    exact_rows_mismatch: 0,
  };
  const controlSql = `SELECT json_object(
    'hotels',(SELECT COUNT(*) FROM control_hotels),'identities',(SELECT COUNT(*) FROM access_identity_mappings),
    'memberships',(SELECT COUNT(*) FROM hotel_memberships),'network_memberships',(SELECT COUNT(*) FROM network_memberships),
    'metadata',(SELECT COUNT(*) FROM hotel_admin_metadata),'audit_events',(SELECT COUNT(*) FROM control_audit_events),
    'manifest',(SELECT COUNT(*) FROM migration_rehearsals WHERE rehearsal_id='${REHEARSAL_ID}' AND source_baseline='${SOURCE_BASELINE}' AND source_digest='${digest}' AND status='APPLIED'),
    'bad_bindings',(SELECT COUNT(*) FROM control_hotels WHERE (id='${hotelIds[0]}' AND operational_binding<>'${BINDINGS[hotelIds[0]]}') OR (id='${hotelIds[1]}' AND operational_binding<>'${BINDINGS[hotelIds[1]]}')),
    'duplicate_active_bindings',(SELECT COUNT(*) FROM (SELECT operational_binding FROM control_hotels WHERE active=1 GROUP BY operational_binding HAVING COUNT(*)>1)),
    'unexpected_subjects',(SELECT COUNT(*) FROM access_identity_mappings WHERE access_subject NOT IN (${sqlList(subjects)})),
    'password_columns',(SELECT COUNT(*) FROM pragma_table_info('access_identity_mappings') WHERE lower(name) LIKE '%password%'),
    'exact_rows_mismatch',(${exactControlRows})) AS reconciliation`;
  const controlActual = actualObject(
    query("CONTROL_DB", selected.persistTo, controlSql),
  );
  assertEqual(controlActual, controlExpected, "CONTROL_DB");
  const results = [];
  for (const hotel of [...fixture.hotels].sort((a, b) =>
    a.id.localeCompare(b.id),
  )) {
    const expected = expectedForHotel(fixture, hotel.id);
    const bookingIds = fixture.bookings
      .filter((x) => x.hotel_id === hotel.id)
      .map((x) => x.id);
    const roomIds = fixture.rooms
      .filter((x) => x.hotel_id === hotel.id)
      .map((x) => x.id);
    const guestIds = fixture.guests
      .filter((x) => x.hotel_id === hotel.id)
      .map((x) => x.id)
      .concat(
        fixture.bookings
          .filter((x) => x.hotel_id === hotel.id && x.guest_id == null)
          .map((x) => `legacy-guest:${x.id}`),
      );
    const hotelRows = (table) =>
      fixture[table].filter((row) => row.hotel_id === hotel.id);
    const legacyBookings = hotelRows("bookings").filter(
      (row) => row.guest_id == null,
    );
    const bookingUpdatedAt = (row) =>
      [
        row.terminal_recorded_at,
        row.late_arrival_recorded_at,
        row.checked_out_at,
        row.checked_in_at,
        row.created_at,
        ...hotelRows("extra_charges")
          .filter((charge) => charge.booking_id === row.id)
          .map((charge) => charge.created_at),
      ]
        .filter(Boolean)
        .map(normalizedTime)
        .sort()
        .at(-1);
    const exactHotelRows = [
      exactExists("rooms", hotelRows("rooms"), (row) => ({
        id: row.id,
        room_number: row.room_number,
        status: row.status,
        price_cents: row.price_cents,
        room_type: row.room_type,
      })),
      exactExists("guests", hotelRows("guests"), (row) => ({
        id: row.id,
        full_name: row.full_name,
        email: row.email,
        phone: row.phone,
        created_at: normalizedTime(row.created_at),
      })),
      exactExists("guests", legacyBookings, (row) => ({
        id: `legacy-guest:${row.id}`,
        full_name: row.guest_name.trim(),
        email: `${row.id}@migration.invalid`,
        phone: null,
        created_at: normalizedTime(row.created_at),
      })),
      exactExists("bookings", hotelRows("bookings"), (row) => ({
        id: row.id,
        guest_id: row.guest_id ?? `legacy-guest:${row.id}`,
        room_id: row.room_id,
        check_in: row.check_in,
        check_out: row.check_out,
        status: row.status,
        total_cents: row.total_price_cents,
        created_at: normalizedTime(row.created_at),
        updated_at: bookingUpdatedAt(row),
        guest_name_snapshot: row.guest_name,
        check_in_reference: row.check_in_reference,
        check_in_document_verified:
          row.check_in_document_verified == null
            ? null
            : Number(row.check_in_document_verified),
        check_in_contact_confirmed:
          row.check_in_contact_confirmed == null
            ? null
            : Number(row.check_in_contact_confirmed),
        check_in_stay_confirmed:
          row.check_in_stay_confirmed == null
            ? null
            : Number(row.check_in_stay_confirmed),
        checked_in_by: sourceSubject(row.checked_in_by_user_id),
        checked_in_at: normalizedTime(row.checked_in_at),
        check_out_charges_reviewed:
          row.check_out_charges_reviewed == null
            ? null
            : Number(row.check_out_charges_reviewed),
        check_out_room_release_confirmed:
          row.check_out_room_release_confirmed == null
            ? null
            : Number(row.check_out_room_release_confirmed),
        check_out_housekeeping_handoff:
          row.check_out_housekeeping_handoff == null
            ? null
            : Number(row.check_out_housekeeping_handoff),
        checked_out_by: sourceSubject(row.checked_out_by_user_id),
        checked_out_at: normalizedTime(row.checked_out_at),
        terminal_reason: row.terminal_reason,
        terminal_recorded_at: normalizedTime(row.terminal_recorded_at),
        terminal_recorded_by: sourceSubject(row.terminal_recorded_by_user_id),
        late_arrival_eta: normalizedTime(row.late_arrival_eta),
        late_arrival_note: row.late_arrival_note,
        late_arrival_recorded_at: normalizedTime(row.late_arrival_recorded_at),
        late_arrival_recorded_by: sourceSubject(
          row.late_arrival_recorded_by_user_id,
        ),
      })),
      exactExists(
        "lifecycle_events",
        hotelRows("bookings").flatMap((row) => {
          const events = [];
          if (row.checked_in_at)
            events.push({
              id: `migration:checkin:${row.id}`,
              booking_id: row.id,
              event_type: "CHECK_IN",
              actor_subject:
                row.checked_in_by_user_id == null
                  ? `legacy-source-user:unknown:checkin:${row.id}`
                  : sourceSubject(row.checked_in_by_user_id),
              request_id: `migration:request-checkin:${row.id}`,
              hotel_id: hotel.id,
              details_json: canonicalJson({
                source_snapshot: true,
                actor_reconstruction:
                  row.checked_in_by_user_id == null
                    ? "source checked_in_by_user_id NULL; unknown actor retained without attributing migration operator"
                    : null,
              }),
              created_at: normalizedTime(row.checked_in_at),
              from_room_id: null,
            });
          if (row.checked_out_at)
            events.push({
              id: `migration:checkout:${row.id}`,
              booking_id: row.id,
              event_type: "CHECK_OUT",
              actor_subject:
                row.checked_out_by_user_id == null
                  ? `legacy-source-user:unknown:checkout:${row.id}`
                  : sourceSubject(row.checked_out_by_user_id),
              request_id: `migration:request-checkout:${row.id}`,
              hotel_id: hotel.id,
              details_json: canonicalJson({
                source_snapshot: true,
                actor_reconstruction:
                  row.checked_out_by_user_id == null
                    ? "source checked_out_by_user_id NULL; unknown actor retained without attributing migration operator"
                    : null,
              }),
              created_at: normalizedTime(row.checked_out_at),
              from_room_id: row.room_id,
            });
          return events;
        }),
        (row) => row,
      ),
      exactExists("extra_charges", hotelRows("extra_charges"), (row) => ({
        id: row.id,
        booking_id: row.booking_id,
        description: row.description,
        amount_cents: row.amount_cents,
        category: row.category,
        created_at: normalizedTime(row.created_at),
      })),
      exactExists("invoices", hotelRows("invoices"), (row) => ({
        id: row.id,
        booking_id: row.booking_id,
        amount_cents: row.amount_cents,
        paid_amount_cents: row.paid_amount_cents,
        status: row.status,
        payment_method: row.payment_method,
        payment_reference: row.payment_reference,
        paid_at: normalizedTime(row.paid_at),
        created_at: normalizedTime(row.created_at),
      })),
      exactExists("payment_entries", hotelRows("payment_entries"), (row) => ({
        id: row.id,
        invoice_id: row.invoice_id,
        booking_id: row.booking_id,
        amount_cents: row.amount_cents,
        payment_method: row.payment_method,
        payment_reference: row.payment_reference,
        note: row.note,
        received_by_user_id:
          row.received_by_user_id == null
            ? `legacy-source-user:unknown:payment:${row.id}`
            : sourceSubject(row.received_by_user_id),
        received_at: normalizedTime(row.received_at),
      })),
      exactExists("cash_closures", hotelRows("cash_closures"), (row) => ({
        id: row.id,
        actor_subject: sourceSubject(row.user_id),
        total_amount_cents: row.total_amount_cents,
        cash_amount_cents: row.cash_amount_cents,
        card_amount_cents: row.card_amount_cents,
        payment_count: row.payment_count,
        counted_cash_amount_cents: row.counted_cash_amount_cents,
        cash_difference_cents: row.cash_difference_cents,
        opening_time: normalizedTime(row.opening_time),
        closing_time: normalizedTime(row.closing_time),
        handoff_to: row.handoff_to,
        notes: row.notes,
        request_id: `migration:request-cash:${row.id}`,
        hotel_id: hotel.id,
        operation_token: `migration:operation-cash:${row.id}`,
      })),
      exactExists("housekeeping_events", hotelRows("maintenance_cases"), (row) => {
        const actor = row.status === "OPEN" ? row.reported_by_user_id : row.resolved_by_user_id;
        return {
          id: `migration:maintenance:${row.id}`,
          room_id: row.room_id,
          maintenance_case_id: row.id,
          event_type: row.status === "OPEN" ? "MAINTENANCE_OPEN" : "MAINTENANCE_RESOLVE",
          actor_subject: actor == null ? `legacy-source-user:unknown:maintenance:${row.id}` : sourceSubject(actor),
          request_id: `migration:request-maintenance:${row.id}`,
          hotel_id: hotel.id,
          "json_extract(details_json,'$.source_maintenance_case_id')": row.id,
          created_at: normalizedTime(row.status === "OPEN" ? row.reported_at : row.resolved_at),
        };
      }),
      exactExists("financial_events", hotelRows("payment_entries"), (row) => ({
        id: `migration:payment:${row.id}`,
        event_type: "PAYMENT_RECORDED",
        booking_id: row.booking_id,
        actor_subject:
          row.received_by_user_id == null
            ? `legacy-source-user:unknown:payment:${row.id}`
            : sourceSubject(row.received_by_user_id),
        request_id: `migration:request-payment:${row.id}`,
        hotel_id: hotel.id,
        "json_extract(details_json,'$.amount_cents')": row.amount_cents,
        "json_extract(details_json,'$.source_payment_id')": row.id,
        created_at: normalizedTime(row.received_at),
      })),
      exactExists("financial_events", hotelRows("cash_closures"), (row) => ({
        id: `migration:cash:${row.id}`,
        event_type: "CASH_CLOSURE",
        booking_id: null,
        actor_subject: sourceSubject(row.user_id),
        request_id: `migration:request-cash:${row.id}`,
        hotel_id: hotel.id,
        "json_extract(details_json,'$.total_amount_cents')":
          row.total_amount_cents,
        "json_extract(details_json,'$.payment_count')": row.payment_count,
        created_at: normalizedTime(row.closing_time),
      })),
    ].join("+");
    const reportRange = fixture.target_adaptations.reconciliation_report_range;
    const reportDayCount =
      Math.round(
        (Date.parse(`${reportRange.end}T00:00:00Z`) -
          Date.parse(`${reportRange.start}T00:00:00Z`)) /
          86400000,
      ) + 1;
    const dashboardDate = fixture.imported_at.slice(0, 10);
    const dashboardMonth = `${dashboardDate.slice(0, 8)}01`;
    const actualSql = `SELECT json_object(
      'hotel_id','${hotel.id}','binding','${BINDINGS[hotel.id]}','rooms',(SELECT COUNT(*) FROM rooms),'guests',(SELECT COUNT(*) FROM guests),
      'reconstructed_guests',(SELECT COUNT(*) FROM migration_provenance WHERE reason LIKE 'source guest_id NULL%'),'bookings',(SELECT COUNT(*) FROM bookings),
      'inventory_nights',(SELECT COUNT(*) FROM room_inventory_nights),'booking_state_counts',json_object('CONFIRMED',(SELECT COUNT(*) FROM bookings WHERE status='CONFIRMED'),'CHECKED_IN',(SELECT COUNT(*) FROM bookings WHERE status='CHECKED_IN'),'CHECKED_OUT',(SELECT COUNT(*) FROM bookings WHERE status='CHECKED_OUT'),'CANCELLED',(SELECT COUNT(*) FROM bookings WHERE status='CANCELLED'),'NO_SHOW',(SELECT COUNT(*) FROM bookings WHERE status='NO_SHOW')),
      'booking_total_cents',(SELECT COALESCE(SUM(total_cents),0) FROM bookings),'report_revenue_cents',(SELECT COALESCE(SUM(total_cents),0) FROM bookings WHERE status NOT IN ('CANCELLED','NO_SHOW') AND check_in>='${reportRange.start}' AND check_in<='${reportRange.end}'),
      'report_occupied_room_nights',(SELECT COUNT(*) FROM room_inventory_nights WHERE stay_date>='${reportRange.start}' AND stay_date<='${reportRange.end}'),
      'report_total_room_nights',(SELECT COUNT(*) FROM rooms)*${reportDayCount},
      'report_occupancy_rate_milli',CASE WHEN (SELECT COUNT(*) FROM rooms)=0 THEN 0 ELSE ((SELECT COUNT(*) FROM room_inventory_nights WHERE stay_date>='${reportRange.start}' AND stay_date<='${reportRange.end}')*100000)/((SELECT COUNT(*) FROM rooms)*${reportDayCount}) END,
      'dashboard_active_bookings',(SELECT COUNT(*) FROM bookings WHERE status IN ('CONFIRMED','CHECKED_IN')),
      'dashboard_occupied_rooms',(SELECT COUNT(DISTINCT room_id) FROM bookings WHERE status IN ('CONFIRMED','CHECKED_IN') AND check_in<='${dashboardDate}' AND check_out>'${dashboardDate}'),
      'dashboard_occupancy_rate_milli',CASE WHEN (SELECT COUNT(*) FROM rooms)=0 THEN 0 ELSE ((SELECT COUNT(DISTINCT room_id) FROM bookings WHERE status IN ('CONFIRMED','CHECKED_IN') AND check_in<='${dashboardDate}' AND check_out>'${dashboardDate}')*100000)/(SELECT COUNT(*) FROM rooms) END,
      'dashboard_adr_cents',CASE WHEN (SELECT COUNT(*) FROM bookings WHERE status IN ('CONFIRMED','CHECKED_IN'))=0 THEN 0 ELSE (SELECT COALESCE(SUM(total_cents),0) FROM bookings WHERE status NOT IN ('CANCELLED','NO_SHOW') AND check_in>='${dashboardMonth}')/(SELECT COUNT(*) FROM bookings WHERE status IN ('CONFIRMED','CHECKED_IN')) END,
      'dashboard_rev_par_cents',CASE WHEN (SELECT COUNT(*) FROM rooms)=0 THEN 0 ELSE ((SELECT COUNT(DISTINCT room_id) FROM bookings WHERE status IN ('CONFIRMED','CHECKED_IN') AND check_in<='${dashboardDate}' AND check_out>'${dashboardDate}')*(CASE WHEN (SELECT COUNT(*) FROM bookings WHERE status IN ('CONFIRMED','CHECKED_IN'))=0 THEN 0 ELSE (SELECT COALESCE(SUM(total_cents),0) FROM bookings WHERE status NOT IN ('CANCELLED','NO_SHOW') AND check_in>='${dashboardMonth}')/(SELECT COUNT(*) FROM bookings WHERE status IN ('CONFIRMED','CHECKED_IN')) END))/(SELECT COUNT(*) FROM rooms) END,
      'excluded_no_show_total_cents',(SELECT COALESCE(SUM(total_cents),0) FROM bookings WHERE status='NO_SHOW'),
      'no_show_inventory_nights',(SELECT COUNT(*) FROM room_inventory_nights n JOIN bookings b ON b.id=n.booking_id WHERE b.status='NO_SHOW'),
      'extra_charges',(SELECT COUNT(*) FROM extra_charges),'charge_total_cents',(SELECT COALESCE(SUM(amount_cents),0) FROM extra_charges),
      'invoices',(SELECT COUNT(*) FROM invoices),'invoice_total_cents',(SELECT COALESCE(SUM(amount_cents),0) FROM invoices),
      'payments',(SELECT COUNT(*) FROM payment_entries),'payment_total_cents',(SELECT COALESCE(SUM(amount_cents),0) FROM payment_entries),
      'cash_closures',(SELECT COUNT(*) FROM cash_closures),'cash_closure_total_cents',(SELECT COALESCE(SUM(total_amount_cents),0) FROM cash_closures),
      'maintenance_cases',(SELECT COUNT(*) FROM maintenance_cases),'lifecycle_events',(SELECT COUNT(*) FROM lifecycle_events),
      'housekeeping_events',(SELECT COUNT(*) FROM housekeeping_events),'financial_events',(SELECT COUNT(*) FROM financial_events)) AS reconciliation`;
    const actual = actualObject(
      query(BINDINGS[hotel.id], selected.persistTo, actualSql),
    );
    assertEqual(actual, expected, BINDINGS[hotel.id]);
    const integritySql = `SELECT json_object('foreign_key_violations',(SELECT COUNT(*) FROM pragma_foreign_key_check),
      'unexpected_bookings',(SELECT COUNT(*) FROM bookings WHERE id NOT IN (${sqlList(bookingIds)})),
      'unexpected_rooms',(SELECT COUNT(*) FROM rooms WHERE id NOT IN (${sqlList(roomIds)})),
      'unexpected_guests',(SELECT COUNT(*) FROM guests WHERE id NOT IN (${sqlList(guestIds)})),
      'wrong_event_hotel',(SELECT COUNT(*) FROM lifecycle_events WHERE hotel_id<>'${hotel.id}')+(SELECT COUNT(*) FROM housekeeping_events WHERE hotel_id<>'${hotel.id}')+(SELECT COUNT(*) FROM financial_events WHERE hotel_id<>'${hotel.id}'),
      'invoice_payment_mismatch',(SELECT COUNT(*) FROM invoices i WHERE i.paid_amount_cents<>(SELECT COALESCE(SUM(p.amount_cents),0) FROM payment_entries p WHERE p.invoice_id=i.id)),
      'closure_arithmetic_mismatch',(SELECT COUNT(*) FROM cash_closures WHERE total_amount_cents<>cash_amount_cents+card_amount_cents OR cash_difference_cents<>counted_cash_amount_cents-cash_amount_cents),
      'exact_rows_mismatch',(${exactHotelRows}),
      'no_show_housekeeping_turnover',(SELECT COUNT(*) FROM bookings b JOIN housekeeping_events h ON h.room_id=b.room_id WHERE b.status='NO_SHOW' AND h.created_at>=b.check_in AND h.created_at<b.check_out),
      'manifest',(SELECT COUNT(*) FROM migration_rehearsals WHERE rehearsal_id='${REHEARSAL_ID}' AND source_digest='${digest}' AND status='APPLIED')) AS reconciliation`;
    const integrity = actualObject(
      query(BINDINGS[hotel.id], selected.persistTo, integritySql),
    );
    assertEqual(
      integrity,
      {
        foreign_key_violations: 0,
        unexpected_bookings: 0,
        unexpected_rooms: 0,
        unexpected_guests: 0,
        wrong_event_hotel: 0,
        invoice_payment_mismatch: 0,
        closure_arithmetic_mismatch: 0,
        exact_rows_mismatch: 0,
        no_show_housekeeping_turnover: 0,
        manifest: 1,
      },
      `${BINDINGS[hotel.id]} integrity`,
    );
    results.push({ ...actual, integrity });
  }
  process.stdout.write(
    `${JSON.stringify({ status: "RECONCILED", rehearsal_id: REHEARSAL_ID, source_baseline: SOURCE_BASELINE, source_digest: digest, control: controlActual, hotels: results }, null, 2)}\n`,
  );
}
main().then(() => process.exit(0)).catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
});
