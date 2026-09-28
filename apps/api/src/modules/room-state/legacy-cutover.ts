import {
  deriveDateRangeSellability,
  deriveRoomOperationalState,
  type RoomOperationalState,
} from "./domain";
import { legacyStatusForRoomState } from "./read-model";

export const ROOM_STATE_CUTOVER_MAPPING_VERSION = "room-state-cutover-v1";
export const ROOM_STATE_CUTOVER_CLASSES = [
  "MAPPED", "REVIEW_REQUIRED", "CONFLICT", "ORPHAN", "DUPLICATE_OPEN_CASE", "UNSUPPORTED_VALUE",
] as const;
export type RoomStateCutoverClass = (typeof ROOM_STATE_CUTOVER_CLASSES)[number];

type RoomInput = { id: string; hotel_id: string; status: string; housekeeping_state: string | null; service_state: string | null; room_state_version: number };
type BookingInput = { id: string; hotel_id: string; room_id: string; status: string; check_in: string; check_out: string };
type InventoryNightInput = { room_id: string; stay_date: string; booking_id: string };
type HoldInput = { id: string; hotel_id: string; room_id: string; start_date: string; end_date: string };
type MaintenanceInput = { id: string; hotel_id: string; room_id: string; status: string; impact: string };
type StateEventInput = { id: string; hotel_id: string; room_id: string | null; event_type: string; actor_subject: string; request_id: string; created_at: string; details_json: string; booking_id?: string; from_room_id?: string | null };

export type LegacyRoomStateSnapshot = {
  hotel_id: string;
  hotel_local_date: string;
  sellability_range: { start_date: string; end_date: string };
  source_schema_digest: string;
  source_migration_digest: string;
  rooms: RoomInput[];
  bookings: BookingInput[];
  inventory_nights: InventoryNightInput[];
  room_holds: HoldInput[];
  maintenance_cases: MaintenanceInput[];
  housekeeping_events: StateEventInput[];
  lifecycle_events: StateEventInput[];
};

export type RoomStateCutoverResult = {
  hotel_id: string;
  room_id: string;
  legacy_status: string;
  classification: RoomStateCutoverClass;
  reasons: string[];
  mapping_rule_id: string;
  mapping_version: string;
  source_digest: string;
  source_reference_ids: string[];
  confidence: "HIGH" | "LOW";
  dimensions: RoomOperationalState;
  readiness: RoomOperationalState["readiness"];
  date_range_sellability: "SELLABLE" | "NOT_SELLABLE" | "UNRESOLVED";
  compatibility_status: string | null;
};

export type RoomStateCutoverReport = {
  hotel_id: string;
  hotel_local_date: string;
  sellability_range: { start_date: string; end_date: string };
  mapping_version: string;
  source_schema_digest: string;
  source_migration_digest: string;
  source_digest: string;
  report_checksum: string;
  input_room_count: number;
  output_room_count: number;
  class_counts: Record<RoomStateCutoverClass, number>;
  input_record_count: number;
  accounted_input_record_count: number;
  input_class_counts: Record<RoomStateCutoverClass, number>;
  source_dispositions: Array<{ source_reference_id: string; hotel_id: string; room_id: string | null; classification: RoomStateCutoverClass; reasons: string[] }>;
  rows: RoomStateCutoverResult[];
};

const legacyStatuses = new Set(["AVAILABLE", "OCCUPIED", "DIRTY", "CLEANING", "MAINTENANCE", "OUT_OF_ORDER"]);
const housekeepingValues = new Set(["READY", "DIRTY", "CLEANING"]);
const serviceValues = new Set(["IN_SERVICE", "OUT_OF_ORDER"]);
const impactValues = new Set(["BLOCKING", "NON_BLOCKING"]);
const bookingStatuses = new Set(["CONFIRMED", "CHECKED_IN", "CHECKED_OUT", "CANCELLED", "NO_SHOW"]);
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const housekeepingStateEventTypes = new Set(["CLEANING_START", "CLEANING_FINISH", "MAINTENANCE_OPEN", "MAINTENANCE_RESOLVE"]);
const lifecycleStateEventTypes = new Set(["CHECK_IN", "CHECK_OUT", "REASSIGN"]);
const classPriority: Record<RoomStateCutoverClass, number> = { REVIEW_REQUIRED: 0, UNSUPPORTED_VALUE: 1, CONFLICT: 2, DUPLICATE_OPEN_CASE: 3, ORPHAN: 4, MAPPED: 0 };

function validDate(value: string): boolean {
  if (!datePattern.test(value)) return false;
  const parsed = new Date(value + "T00:00:00.000Z");
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}
function canonical(value: unknown): string {
  if (Array.isArray(value)) return "[" + value.map(canonical).sort().join(",") + "]";
  if (value && typeof value === "object") {
    const object = value as Record<string, unknown>;
    return "{" + Object.keys(object).sort().map(key => JSON.stringify(key) + ":" + canonical(object[key])).join(",") + "}";
  }
  return JSON.stringify(value);
}
async function digest(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, "0")).join("");
}

function currentVersionEvents(events: StateEventInput[], room: RoomInput, allowedTypes: Set<string>) {
  const reasons: string[] = [];
  const candidates: Array<{ id: string; housekeeping: string | null; service: string | null }> = [];
  for (const event of events.filter(row => row.room_id === room.id)) {
    if (event.hotel_id !== room.hotel_id) {
      reasons.push("EVENT_TENANT_MISMATCH");
      continue;
    }
    if (!allowedTypes.has(event.event_type)) continue;
    if (!event.actor_subject || !event.request_id || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(event.created_at) || Number.isNaN(Date.parse(event.created_at))) {
      reasons.push("EVENT_PROVENANCE_INCOMPLETE");
      continue;
    }
    let details: Record<string, unknown>;
    try { details = JSON.parse(event.details_json) as Record<string, unknown>; }
    catch { reasons.push("MALFORMED_STATE_EVENT"); continue; }
    const version = details.room_state_version_after;
    if (typeof version !== "number" || !Number.isInteger(version)) continue;
    if (version > room.room_state_version) {
      reasons.push("EVENT_VERSION_AHEAD_OF_ROOM");
      continue;
    }
    if (version === room.room_state_version) candidates.push({
      id: event.id,
      housekeeping: typeof details.housekeeping_state_after === "string" ? details.housekeeping_state_after : null,
      service: typeof details.service_state_after === "string" ? details.service_state_after : null,
    });
  }
  return { reasons, candidates };
}

function assignmentHistory(booking: BookingInput, events: StateEventInput[]) {
  const reasons: string[] = [];
  const moves: Array<{ from: string; to: string; effective: string; id: string }> = [];
  for (const event of events.filter(row => row.event_type === "REASSIGN" && row.booking_id === booking.id)) {
    if (event.hotel_id !== booking.hotel_id) reasons.push("REASSIGN_HISTORY_TENANT_MISMATCH");
    let details: Record<string, unknown>;
    try { details = JSON.parse(event.details_json) as Record<string, unknown>; }
    catch { reasons.push("REASSIGN_HISTORY_MALFORMED"); continue; }
    const from = event.from_room_id ?? details.from_room_id;
    const to = details.to_room_id;
    const effective = details.effective_date;
    if (event.from_room_id && typeof details.from_room_id === "string" && event.from_room_id !== details.from_room_id)
      reasons.push("REASSIGN_HISTORY_FROM_ROOM_MISMATCH");
    if (typeof from !== "string" || typeof to !== "string" || typeof effective !== "string" || !validDate(effective)
      || !event.actor_subject || !event.request_id || !event.hotel_id
      || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(event.created_at)
      || Number.isNaN(Date.parse(event.created_at))) {
      reasons.push("REASSIGN_HISTORY_PROVENANCE_OR_DATE_INVALID");
      continue;
    }
    if (effective < booking.check_in || effective >= booking.check_out || from === to) reasons.push("REASSIGN_HISTORY_OUTSIDE_STAY_OR_NOOP");
    moves.push({ from, to, effective, id: event.id });
  }
  moves.sort((a, b) => a.effective.localeCompare(b.effective) || a.id.localeCompare(b.id));
  if (new Set(moves.map(move => move.effective)).size !== moves.length) reasons.push("MULTIPLE_REASSIGNMENTS_AT_SAME_EFFECTIVE_DATE");
  let currentRoom = moves[0]?.from ?? booking.room_id;
  for (const move of moves) {
    if (move.from !== currentRoom) reasons.push("REASSIGNMENT_HISTORY_CHAIN_DISCONTINUITY");
    currentRoom = move.to;
  }
  if (moves.length && currentRoom !== booking.room_id) reasons.push("REASSIGNMENT_HISTORY_DOES_NOT_MATCH_CURRENT_BOOKING_ROOM");
  const roomIds = new Set<string>([booking.room_id, ...moves.flatMap(move => [move.from, move.to])]);
  return {
    reasons,
    touchesRoom: (roomId: string) => roomIds.has(roomId),
    roomForDate(date: string) {
      let assignedRoom = moves[0]?.from ?? booking.room_id;
      for (const move of moves) {
        if (date >= move.effective) assignedRoom = move.to;
        else break;
      }
      return assignedRoom;
    },
  };
}

/** Reads the complete hotel-local source set from an isolated operational D1. */
export async function readLegacyRoomStateSnapshot(
  db: D1Database,
  input: { hotel_id: string; hotel_local_date: string; sellability_range: { start_date: string; end_date: string }; source_schema_digest: string; source_migration_digest: string },
): Promise<LegacyRoomStateSnapshot> {
  const [roomsResult, bookingsResult, inventoryResult, holdsResult, maintenanceResult, housekeepingResult, lifecycleResult] = await db.batch([
    db.prepare("SELECT id, status, housekeeping_state, service_state, room_state_version FROM rooms ORDER BY id"),
    db.prepare("SELECT id, room_id, status, check_in, check_out FROM bookings ORDER BY id"),
    db.prepare("SELECT room_id, stay_date, booking_id FROM room_inventory_nights ORDER BY room_id, stay_date, booking_id"),
    db.prepare("SELECT id, room_id, start_date, end_date FROM room_holds ORDER BY id"),
    db.prepare("SELECT id, room_id, status, impact FROM maintenance_cases ORDER BY id"),
    db.prepare("SELECT id, hotel_id, room_id, event_type, actor_subject, request_id, created_at, details_json FROM housekeeping_events ORDER BY id"),
    db.prepare("SELECT id, hotel_id, booking_id, from_room_id, event_type, actor_subject, request_id, created_at, details_json FROM lifecycle_events ORDER BY id"),
  ]);
  const roomRows = roomsResult.results as Omit<RoomInput, "hotel_id">[];
  const bookingRows = bookingsResult.results as BookingInput[];
  const inventoryRows = inventoryResult.results as InventoryNightInput[];
  const holdRows = holdsResult.results as Omit<HoldInput, "hotel_id">[];
  const maintenanceRows = maintenanceResult.results as Omit<MaintenanceInput, "hotel_id">[];
  const housekeepingRows = housekeepingResult.results as StateEventInput[];
  const lifecycleRows = lifecycleResult.results as (Omit<StateEventInput, "room_id"> & { booking_id: string; from_room_id: string | null })[];
  const bookingRoom = new Map(bookingRows.map(booking => [booking.id, booking.room_id]));
  const lifecycle_events: StateEventInput[] = lifecycleRows.map(event => {
    let historicalRoom: string | null = bookingRoom.get(event.booking_id) ?? event.from_room_id ?? null;
    try {
      const details = JSON.parse(event.details_json) as Record<string, unknown>;
      if (!historicalRoom && typeof details.from_room_id === "string") historicalRoom = details.from_room_id;
      if (!historicalRoom && typeof details.to_room_id === "string") historicalRoom = details.to_room_id;
    } catch { /* malformed source remains included and is classified via its booking/room association */ }
    return { ...event, room_id: historicalRoom };
  });
  return {
    ...input,
    rooms: roomRows.map(room => ({ ...room, hotel_id: input.hotel_id })),
    bookings: bookingRows.map(booking => ({ ...booking, hotel_id: input.hotel_id })),
    inventory_nights: inventoryRows,
    room_holds: holdRows.map(hold => ({ ...hold, hotel_id: input.hotel_id })),
    maintenance_cases: maintenanceRows.map(row => ({ ...row, hotel_id: input.hotel_id })),
    housekeeping_events: housekeepingRows,
    lifecycle_events,
  };
}

/** Pure, hotel-scoped shadow mapper. It never mutates canonical rows or history. */
export async function mapLegacyRoomState(snapshot: LegacyRoomStateSnapshot): Promise<RoomStateCutoverReport> {
  const sourceDigest = await digest(canonical({
    hotel_id: snapshot.hotel_id,
    hotel_local_date: snapshot.hotel_local_date,
    sellability_range: snapshot.sellability_range,
    source_schema_digest: snapshot.source_schema_digest,
    source_migration_digest: snapshot.source_migration_digest,
    rooms: snapshot.rooms,
    bookings: snapshot.bookings,
    inventory_nights: snapshot.inventory_nights,
    room_holds: snapshot.room_holds,
    maintenance_cases: snapshot.maintenance_cases,
    housekeeping_events: snapshot.housekeeping_events,
    lifecycle_events: snapshot.lifecycle_events,
  }));
  const localRooms = new Map(snapshot.rooms.map(room => [room.id, room]));
  const bookingsById = new Map(snapshot.bookings.map(booking => [booking.id, booking]));
  const allEvents = [...snapshot.housekeeping_events, ...snapshot.lifecycle_events];
  const rows: RoomStateCutoverResult[] = [...snapshot.rooms].sort((a, b) => a.id.localeCompare(b.id)).map(room => {
    const reasons = new Set<string>();
    const refs = new Set<string>(["rooms:" + room.id]);
    let forced: RoomStateCutoverClass | null = null;
    const flag = (kind: RoomStateCutoverClass, reason: string) => {
      if (!forced || classPriority[kind] > classPriority[forced]) forced = kind;
      reasons.add(reason);
    };
    if (room.hotel_id !== snapshot.hotel_id) flag("ORPHAN", "ROOM_TENANT_MISMATCH");
    if (!legacyStatuses.has(room.status)) flag("UNSUPPORTED_VALUE", "UNSUPPORTED_LEGACY_ROOM_STATUS");
    if (!Number.isInteger(room.room_state_version) || room.room_state_version < 0) flag("CONFLICT", "INVALID_ROOM_STATE_VERSION");

    const bookings = snapshot.bookings.filter(row => row.room_id === room.id);
    const claims = snapshot.inventory_nights.filter(row => row.room_id === room.id);
    const relatedActiveBookings = snapshot.bookings.filter(row =>
      ["CHECKED_IN", "CONFIRMED"].includes(row.status)
      && (row.room_id === room.id || claims.some(claim => claim.booking_id === row.id)
        || assignmentHistory(row, snapshot.lifecycle_events).touchesRoom(room.id)));
    const holds = snapshot.room_holds.filter(row => row.room_id === room.id);
    const cases = snapshot.maintenance_cases.filter(row => row.room_id === room.id);
    const openCases = cases.filter(row => row.status === "OPEN");
    const events = allEvents.filter(row => row.room_id === room.id);
    bookings.forEach(row => refs.add("bookings:" + row.id));
    claims.forEach(row => refs.add("room_inventory_nights:" + row.room_id + ":" + row.stay_date + ":" + row.booking_id));
    holds.forEach(row => refs.add("room_holds:" + row.id));
    cases.forEach(row => refs.add("maintenance_cases:" + row.id));
    events.forEach(row => refs.add("events:" + row.id));

    if (bookings.some(row => row.hotel_id !== snapshot.hotel_id)) flag("ORPHAN", "BOOKING_TENANT_MISMATCH");
    const checkedIn = bookings.filter(row => row.status === "CHECKED_IN");
    if (checkedIn.length > 1) flag("CONFLICT", "MULTIPLE_CHECKED_IN_ASSIGNMENTS");
    if (room.status === "OCCUPIED" && checkedIn.length === 0) flag("CONFLICT", "LEGACY_OCCUPIED_WITHOUT_CHECKED_IN_STAY");
    if (checkedIn.length > 0 && ["AVAILABLE", "DIRTY", "CLEANING"].includes(room.status)) flag("CONFLICT", "LEGACY_PHYSICAL_STATUS_CONFLICTS_WITH_ACTIVE_OCCUPANCY");
    for (const booking of snapshot.bookings.filter(row => row.room_id === room.id || claims.some(claim => claim.booking_id === row.id))) {
      if (!bookingStatuses.has(booking.status)) flag("UNSUPPORTED_VALUE", "UNSUPPORTED_BOOKING_STATUS");
      if (!validDate(booking.check_in) || !validDate(booking.check_out) || booking.check_in >= booking.check_out)
        flag("CONFLICT", "INVALID_BOOKING_INTERVAL");
      if (booking.status === "CHECKED_IN" && (snapshot.hotel_local_date < booking.check_in || snapshot.hotel_local_date >= booking.check_out))
        flag("CONFLICT", "CHECKED_IN_STAY_OUTSIDE_CURRENT_LOCAL_DATE");
    }
    for (const booking of relatedActiveBookings) {
      const history = assignmentHistory(booking, snapshot.lifecycle_events);
      history.reasons.forEach(reason => flag("CONFLICT", reason));
      snapshot.lifecycle_events.filter(event => event.booking_id === booking.id && event.event_type === "REASSIGN")
        .forEach(event => refs.add("lifecycle_events:" + event.id));
      if (snapshot.lifecycle_events.filter(event => event.booking_id === booking.id && event.event_type === "REASSIGN").some(event => {
        try {
          const details = JSON.parse(event.details_json) as Record<string, unknown>;
          return !localRooms.has(String(event.from_room_id ?? details.from_room_id)) || !localRooms.has(String(details.to_room_id));
        } catch { return true; }
      })) flag("ORPHAN", "REASSIGNMENT_HISTORY_REFERENCES_MISSING_ROOM");
      if (booking.status === "CONFIRMED" && snapshot.lifecycle_events.some(event => event.booking_id === booking.id && event.event_type === "REASSIGN"))
        flag("CONFLICT", "UNEXPECTED_REASSIGNMENT_BEFORE_CHECK_IN");
      if (booking.hotel_id === snapshot.hotel_id && validDate(booking.check_in) && validDate(booking.check_out)) {
        for (let night = booking.check_in; night < booking.check_out; ) {
          const expectedRoom = history.roomForDate(night);
          const expectedClaimExists = snapshot.inventory_nights.some(claim => claim.booking_id === booking.id && claim.room_id === expectedRoom && claim.stay_date === night);
          if (!expectedClaimExists && (history.touchesRoom(room.id)))
            flag("CONFLICT", "ACTIVE_BOOKING_MISSING_EXPECTED_ROOM_NIGHT_CLAIM");
          if (expectedRoom !== room.id && claims.some(claim => claim.booking_id === booking.id && claim.stay_date === night))
            flag("CONFLICT", "ACTIVE_BOOKING_ROOM_NIGHT_DISAGREES_WITH_ASSIGNMENT_HISTORY");
          const next = new Date(night + "T00:00:00.000Z");
          next.setUTCDate(next.getUTCDate() + 1);
          night = next.toISOString().slice(0, 10);
        }
      }
    }
    if (checkedIn.length === 1 && !claims.some(claim => claim.booking_id === checkedIn[0].id && claim.stay_date === snapshot.hotel_local_date))
      flag("CONFLICT", "CHECKED_IN_STAY_MISSING_CURRENT_ROOM_NIGHT_CLAIM");

    if (openCases.length > 1) flag("DUPLICATE_OPEN_CASE", "MULTIPLE_OPEN_MAINTENANCE_CASES");
    if (cases.some(row => row.status !== "OPEN" && row.status !== "RESOLVED")) flag("UNSUPPORTED_VALUE", "UNSUPPORTED_MAINTENANCE_STATUS");
    if (cases.some(row => row.hotel_id !== snapshot.hotel_id)) flag("ORPHAN", "MAINTENANCE_TENANT_MISMATCH");
    if (openCases.some(row => !impactValues.has(row.impact))) flag("UNSUPPORTED_VALUE", "UNSUPPORTED_MAINTENANCE_IMPACT");
    if (room.status === "MAINTENANCE" && !openCases.some(row => row.impact === "BLOCKING"))
      reasons.add("LEGACY_MAINTENANCE_WITHOUT_BLOCKING_CASE");

    const orphanClaim = claims.some(claim => {
      const booking = bookingsById.get(claim.booking_id);
      if (!booking || booking.hotel_id !== snapshot.hotel_id || !localRooms.has(claim.room_id)) return true;
      if (["CHECKED_IN", "CONFIRMED"].includes(booking.status) && validDate(claim.stay_date))
        return assignmentHistory(booking, snapshot.lifecycle_events).roomForDate(claim.stay_date) !== room.id;
      return booking.room_id !== room.id;
    });
    if (orphanClaim) flag("ORPHAN", "ORPHAN_INVENTORY_CLAIM");
    const dates = new Set<string>();
    for (const claim of claims) {
      if (!validDate(claim.stay_date)) flag("CONFLICT", "INVALID_ROOM_NIGHT_DATE");
      if (dates.has(claim.stay_date)) flag("CONFLICT", "DUPLICATE_ROOM_NIGHT_CLAIM");
      dates.add(claim.stay_date);
      const booking = bookingsById.get(claim.booking_id);
      if (booking && (claim.stay_date < booking.check_in || claim.stay_date >= booking.check_out))
        flag("CONFLICT", "INVENTORY_CLAIM_OUTSIDE_BOOKING_INTERVAL");
    }
    for (const claim of snapshot.inventory_nights.filter(row => row.room_id !== room.id)) {
      if (claims.some(own => own.booking_id === claim.booking_id && own.stay_date === claim.stay_date)) {
        flag("CONFLICT", "OVERLAPPING_ROOM_NIGHT_CLAIMS_ACROSS_ROOMS");
      }
    }
    if (holds.some(row => row.hotel_id !== snapshot.hotel_id)) flag("ORPHAN", "HOLD_TENANT_MISMATCH");
    if (holds.some(row => !validDate(row.start_date) || !validDate(row.end_date) || row.start_date >= row.end_date))
      flag("CONFLICT", "INVALID_HOLD_INTERVAL");

    const hkEventResult = currentVersionEvents(snapshot.housekeeping_events, room, housekeepingStateEventTypes);
    const lifecycleEventResult = currentVersionEvents(snapshot.lifecycle_events, room, lifecycleStateEventTypes);
    const eventResult = {
      reasons: [...hkEventResult.reasons, ...lifecycleEventResult.reasons],
      candidates: [...hkEventResult.candidates, ...lifecycleEventResult.candidates],
    };
    eventResult.reasons.forEach(reason => flag("CONFLICT", reason));
    if (eventResult.candidates.length > 1) flag("CONFLICT", "MULTIPLE_EVENTS_CLAIM_CURRENT_ROOM_VERSION");
    const event = eventResult.candidates[0];
    let housekeeping = room.housekeeping_state;
    let service = room.service_state;
    if (event) {
      if (housekeeping && event.housekeeping && housekeeping !== event.housekeeping) flag("CONFLICT", "HOUSEKEEPING_COLUMN_EVENT_MISMATCH");
      if (service && event.service && service !== event.service) flag("CONFLICT", "SERVICE_COLUMN_EVENT_MISMATCH");
      housekeeping ??= event.housekeeping;
      service ??= event.service;
    }
    if (!housekeeping && room.status === "DIRTY") housekeeping = "DIRTY";
    if (!housekeeping && room.status === "CLEANING") housekeeping = "CLEANING";
    if (!service && room.status === "OUT_OF_ORDER") service = "OUT_OF_ORDER";
    if (housekeeping && !housekeepingValues.has(housekeeping)) flag("UNSUPPORTED_VALUE", "UNSUPPORTED_HOUSEKEEPING_STATE");
    if (service && !serviceValues.has(service)) flag("UNSUPPORTED_VALUE", "UNSUPPORTED_SERVICE_STATE");
    if (!housekeeping) reasons.add("HOUSEKEEPING_EVIDENCE_INSUFFICIENT");
    if (!service) reasons.add("SERVICE_STATE_EVIDENCE_INSUFFICIENT");
    if (room.status === "MAINTENANCE" && !openCases.some(row => row.impact === "BLOCKING"))
      reasons.add("MAINTENANCE_IMPACT_EVIDENCE_INSUFFICIENT");

    const state = deriveRoomOperationalState({
      checkedInBookingCount: checkedIn.length > 1 ? -1 : checkedIn.length,
      housekeepingState: housekeeping,
      openMaintenanceImpacts: openCases.map(row => row.impact),
      serviceState: service,
    });
    if (state.readiness.state === "UNRESOLVED" && !forced) reasons.add("ROOM_DIMENSIONS_NOT_FULLY_PROVEN");
    const range = snapshot.sellability_range;
    const rangeValid = validDate(range.start_date) && validDate(range.end_date) && range.start_date < range.end_date;
    if (!validDate(snapshot.hotel_local_date) || !rangeValid) reasons.add("SELLABILITY_INTERVAL_UNRESOLVED");
    const classification: RoomStateCutoverClass = forced ?? (reasons.size ? "REVIEW_REQUIRED" : "MAPPED");
    const readiness = classification === "MAPPED" ? state.readiness : { state: "UNRESOLVED" as const, reasons: ["CUTOVER_ROW_NOT_MAPPED"] };
    const dimensions: RoomOperationalState = { ...state, readiness };
    const sellability: RoomStateCutoverResult["date_range_sellability"] = classification !== "MAPPED" || !rangeValid
      ? "UNRESOLVED"
      : deriveDateRangeSellability({
        intervalValid: true,
        serviceState: serviceValues.has(service ?? "") ? service as "IN_SERVICE" | "OUT_OF_ORDER" : "UNRESOLVED",
        hasOverlappingInventory: claims.some(row => row.stay_date >= range.start_date && row.stay_date < range.end_date),
        hasOverlappingHold: holds.some(row => row.start_date < range.end_date && row.end_date > range.start_date),
        hasBlockingMaintenance: openCases.some(row => row.impact === "BLOCKING"),
      });
    return {
      hotel_id: room.hotel_id,
      room_id: room.id,
      legacy_status: room.status,
      classification,
      reasons: [...reasons].sort(),
      mapping_rule_id: "legacy-room-status-plus-authoritative-related-evidence-v1",
      mapping_version: ROOM_STATE_CUTOVER_MAPPING_VERSION,
      source_digest: sourceDigest,
      source_reference_ids: [...refs].sort(),
      confidence: classification === "MAPPED" ? "HIGH" : "LOW",
      dimensions,
      readiness,
      date_range_sellability: sellability,
      compatibility_status: classification === "MAPPED" ? legacyStatusForRoomState(dimensions) : null,
    };
  });

  const classCounts = Object.fromEntries(ROOM_STATE_CUTOVER_CLASSES.map(value => [value, 0])) as Record<RoomStateCutoverClass, number>;
  rows.forEach(row => classCounts[row.classification]++);
  const rowById = new Map(rows.map(row => [row.room_id, row]));
  const sourceInputs: Array<{ source_reference_id: string; hotel_id: string; room_id: string | null }> = [
    ...snapshot.rooms.map(row => ({ source_reference_id: `rooms:${row.id}`, hotel_id: row.hotel_id, room_id: row.id })),
    ...snapshot.bookings.map(row => ({ source_reference_id: `bookings:${row.id}`, hotel_id: row.hotel_id, room_id: row.room_id })),
    ...snapshot.inventory_nights.map(row => ({ source_reference_id: `room_inventory_nights:${row.room_id}:${row.stay_date}:${row.booking_id}`, hotel_id: snapshot.hotel_id, room_id: row.room_id })),
    ...snapshot.room_holds.map(row => ({ source_reference_id: `room_holds:${row.id}`, hotel_id: row.hotel_id, room_id: row.room_id })),
    ...snapshot.maintenance_cases.map(row => ({ source_reference_id: `maintenance_cases:${row.id}`, hotel_id: row.hotel_id, room_id: row.room_id })),
    ...snapshot.housekeeping_events.map(row => ({ source_reference_id: `housekeeping_events:${row.id}`, hotel_id: row.hotel_id, room_id: row.room_id })),
    ...snapshot.lifecycle_events.map(row => ({ source_reference_id: `lifecycle_events:${row.id}`, hotel_id: row.hotel_id, room_id: row.room_id })),
  ];
  const inputClassCounts = Object.fromEntries(ROOM_STATE_CUTOVER_CLASSES.map(value => [value, 0])) as Record<RoomStateCutoverClass, number>;
  const sourceDispositions: RoomStateCutoverReport["source_dispositions"] = sourceInputs.map(input => {
    const roomResult = input.room_id ? rowById.get(input.room_id) : undefined;
    const orphan = input.hotel_id !== snapshot.hotel_id || !roomResult || roomResult.hotel_id !== snapshot.hotel_id;
    const classification: RoomStateCutoverClass = orphan ? "ORPHAN" : roomResult.classification;
    const reasons = orphan ? ["SOURCE_ROW_WITHOUT_LOCAL_ROOM"] : roomResult.reasons;
    inputClassCounts[classification]++;
    return { ...input, classification, reasons };
  }).sort((a, b) => a.source_reference_id.localeCompare(b.source_reference_id));
  const report = {
    hotel_id: snapshot.hotel_id,
    hotel_local_date: snapshot.hotel_local_date,
    sellability_range: snapshot.sellability_range,
    mapping_version: ROOM_STATE_CUTOVER_MAPPING_VERSION,
    source_schema_digest: snapshot.source_schema_digest,
    source_migration_digest: snapshot.source_migration_digest,
    source_digest: sourceDigest,
    input_room_count: snapshot.rooms.length,
    output_room_count: rows.length,
    class_counts: classCounts,
    input_record_count: sourceInputs.length,
    accounted_input_record_count: sourceDispositions.length,
    input_class_counts: inputClassCounts,
    source_dispositions: sourceDispositions,
    rows,
  };
  return { ...report, report_checksum: await digest(canonical(report)) };
}
