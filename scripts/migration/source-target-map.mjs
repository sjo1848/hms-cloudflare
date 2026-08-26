export const SOURCE_BASELINE = "4df56a6217caab611f2f5fcbd98bde8386bb5629";
export const REHEARSAL_ID = "cf-i09-synthetic-v1";

export const BINDINGS = Object.freeze({
  "10000000-0000-0000-0000-000000000001": "HOTEL_DEMO_DB",
  "20000000-0000-0000-0000-000000000002": "HOTEL_SECOND_DB",
});

export const ENUMS = Object.freeze({
  booking_status: {
    CONFIRMED: "CONFIRMED",
    CHECKED_IN: "CHECKED_IN",
    CHECKED_OUT: "CHECKED_OUT",
    CANCELLED: "CANCELLED",
    NO_SHOW: "NO_SHOW",
  },
  room_status: {
    AVAILABLE: "AVAILABLE",
    OCCUPIED: "OCCUPIED",
    DIRTY: "DIRTY",
    CLEANING: "CLEANING",
    MAINTENANCE: "MAINTENANCE",
  },
  hold_type: {
    VIP: "Vip",
    MAINTENANCE: "Maintenance",
    OWNER: "Owner",
    COMPLIANCE: "Compliance",
    COMMERCIAL: "Commercial",
    OTHER: "Other",
  },
  role: {
    admin: "admin",
    saas_admin: "saas_admin",
    ops: "ops",
    receptionist: "receptionist",
    housekeeping: "housekeeping",
  },
  plan: { BASIC: "BASIC", PRO: "PRO", ENTERPRISE: "ENTERPRISE" },
  payment_method: { CASH: "CASH", CARD: "CARD", TRANSFER: "TRANSFER" },
});

// Exhaustive source-field disposition. The executable validator rejects keys
// not present here so fixture evolution cannot silently drop a source field.
export const FIELD_DISPOSITION = Object.freeze({
  hotels: {
    id: "migrated:control_hotels.id/hotel_admin_metadata.hotel_id",
    name: "migrated:hotel_admin_metadata.name",
    address: "migrated:hotel_admin_metadata.address",
    config_json: "migrated:hotel_admin_metadata.features_json",
    plan_tier: "mapped-enum:hotel_admin_metadata.plan_tier",
    created_at:
      "not-applicable:target control registry has no created timestamp",
  },
  users: {
    id: "migrated-provenance:subject is source-user:<uuid>",
    hotel_id:
      "migrated:hotel_memberships.hotel_id for tenant roles; retained legacy source column for saas_admin without operational membership",
    username: "reconstructed:synthetic Access email local fixture only",
    password_hash:
      "not-applicable:Cloudflare Access substitution; forbidden target value",
    role: "mapped-enum:hotel_memberships.role",
    created_at: "migrated-provenance:control audit details",
  },
  refresh_tokens: {
    id: "not-applicable:Cloudflare Access substitution; source session is not recreated",
    user_id:
      "not-applicable:source credential session relationship is not recreated",
    token_hash: "not-applicable:secret credential material is never emitted",
    expires_at: "not-applicable:source credential session is not recreated",
    revoked_at: "not-applicable:source credential session is not recreated",
    created_at: "not-applicable:source credential session is not recreated",
    hotel_id: "not-applicable:source credential session is not recreated",
    session_id: "not-applicable:source credential session is not recreated",
    device_id:
      "not-applicable:source credential session metadata is not recreated",
  },
  rooms: {
    id: "migrated",
    hotel_id: "routing-only",
    room_number: "migrated",
    room_type: "migrated",
    status: "mapped-enum",
    price_cents: "migrated:INTEGER exact cents",
    version: "deprecated:target transitions use atomic domain guards",
  },
  guests: {
    id: "migrated",
    hotel_id: "routing-only",
    full_name: "migrated",
    email: "migrated",
    phone: "migrated",
    created_at: "normalized:UTC",
  },
  bookings: {
    id: "migrated",
    hotel_id: "routing-only",
    room_id: "migrated",
    guest_id:
      "migrated when present; NULL reconstructed to tenant-local .invalid guest with migration_provenance",
    guest_name:
      "migrated:bookings.guest_name_snapshot independent of the current guest name; guest row reconstructed when guest_id is NULL and name is nonblank",
    check_in: "normalized:YYYY-MM-DD",
    check_out: "normalized:YYYY-MM-DD",
    total_price_cents:
      "migrated:source final total cents; importer subtracts source charges before the target trigger restores the exact final total",
    status: "mapped-enum",
    created_at:
      "normalized:UTC; target updated_at reconstructed from latest source operational timestamp",
    check_in_guests_count: "migrated",
    check_in_reference: "migrated snapshot",
    check_in_document_verified: "migrated 0/1 snapshot",
    check_in_contact_confirmed: "migrated 0/1 snapshot",
    check_in_stay_confirmed: "migrated 0/1 snapshot",
    checked_in_at: "normalized:UTC",
    checked_in_by_user_id:
      "mapped:source user UUID to Access subject; NULL preserved in nullable booking snapshot (event reconstruction may use unknown sentinel only when checked_in_at proves an event)",
    check_out_payment_policy: "migrated",
    check_out_reference: "migrated",
    check_out_charges_reviewed: "migrated 0/1 snapshot",
    check_out_room_release_confirmed: "migrated 0/1 snapshot",
    check_out_housekeeping_handoff: "migrated 0/1 snapshot",
    checked_out_at: "normalized:UTC",
    checked_out_by_user_id:
      "mapped:Access subject; NULL preserved in nullable booking snapshot (event reconstruction may use unknown sentinel only when checked_out_at proves an event)",
    terminal_reason: "migrated snapshot",
    terminal_recorded_at: "normalized:UTC",
    terminal_recorded_by_user_id: "mapped:Access subject",
    late_arrival_eta: "normalized:UTC",
    late_arrival_note: "migrated snapshot",
    late_arrival_recorded_at: "normalized:UTC",
    late_arrival_recorded_by_user_id: "mapped:Access subject",
  },
  room_holds: {
    id: "migrated",
    hotel_id: "routing-only",
    room_id: "migrated",
    start_date: "normalized:DATE",
    end_date: "normalized:DATE",
    reason: "migrated",
    created_by_user_id: "mapped:Access subject",
    created_at: "normalized:UTC",
    hold_type: "mapped-enum",
  },
  maintenance_cases: {
    id: "migrated",
    hotel_id: "routing-only",
    room_id: "migrated",
    status: "mapped-enum",
    priority: "mapped-enum",
    reason: "migrated",
    assigned_to: "migrated",
    reported_by_user_id:
      "mapped:Access subject; NULL legacy backfill remains unknown and reconstructed event uses unknown-legacy provenance",
    reported_at: "normalized:UTC",
    resolution_note: "migrated",
    resolved_by_user_id: "mapped:Access subject",
    resolved_at: "normalized:UTC",
    return_status: "mapped-enum",
  },
  extra_charges: {
    id: "migrated",
    hotel_id: "routing-only",
    booking_id: "migrated",
    description: "migrated",
    amount_cents: "migrated:INTEGER exact cents",
    category: "migrated",
    created_at: "normalized:UTC",
  },
  invoices: {
    id: "migrated",
    hotel_id: "routing-only",
    booking_id: "migrated",
    amount_cents: "migrated:INTEGER exact cents",
    paid_amount_cents: "migrated:INTEGER exact cents",
    status: "mapped-enum",
    payment_method: "mapped-enum",
    payment_reference: "migrated",
    paid_at: "normalized:UTC",
    created_at: "normalized:UTC",
  },
  payment_entries: {
    id: "migrated",
    hotel_id: "routing-only",
    invoice_id: "migrated",
    booking_id: "migrated",
    amount_cents: "migrated:INTEGER exact cents",
    payment_method: "mapped-enum",
    payment_reference: "migrated",
    note: "migrated",
    received_by_user_id:
      "mapped:Access subject; NULL legacy backfill uses deterministic unknown-legacy provenance",
    received_at: "normalized:UTC",
    created_at: "not-applicable:target uses received_at as event timestamp",
  },
  cash_closures: {
    id: "migrated",
    hotel_id: "routing-only",
    user_id: "mapped:actor_subject",
    total_amount_cents: "migrated",
    cash_amount_cents: "migrated",
    card_amount_cents: "migrated",
    payment_count: "migrated",
    counted_cash_amount_cents: "migrated",
    cash_difference_cents: "migrated",
    opening_time: "normalized:UTC",
    closing_time: "normalized:UTC",
    handoff_to: "migrated",
    notes: "migrated",
    created_at: "not-applicable:closing_time is canonical target event time",
  },
  audit_events: {
    id: "migrated",
    hotel_id: "migrated:control audit scope",
    user_id: "mapped:Access subject",
    action: "migrated",
    ip_address: "migrated:control_audit_events.details_json source_ip_address",
    created_at: "normalized:UTC",
  },
});

export const TARGET_RECONSTRUCTIONS = Object.freeze({
  hotel_slug_binding:
    "explicit target_adaptations.hotel_routes; binding must equal the server-owned BINDINGS allow-list",
  access_email: "source username + @migration.invalid; source has no email",
  network_membership:
    "source saas_admin role maps to network membership only; legacy hotel_id does not grant hotel operational membership",
  booking_updated_at:
    "latest source terminal/late-arrival/check-in/check-out timestamp, else created_at",
  lifecycle_events:
    "deterministic events derived only from source checked_in_at/checked_out_at snapshots",
  housekeeping_events:
    "deterministic events derived only from source maintenance case state/provenance",
  financial_events:
    "deterministic events derived from source payments; cash closure trigger ID is normalized deterministically",
  cash_request_id: "deterministic migration request ID",
  cash_operation_token: "deterministic server-only replay token",
});
