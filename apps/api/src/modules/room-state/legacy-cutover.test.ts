import { describe, expect, it } from "vitest";
import { mapLegacyRoomState, type LegacyRoomStateSnapshot } from "./legacy-cutover";

const roomId = "room-1";
const hotelId = "hotel-1";
const room = (values: Partial<LegacyRoomStateSnapshot["rooms"][number]> = {}) => ({
  id: roomId,
  hotel_id: hotelId,
  status: "AVAILABLE",
  housekeeping_state: null,
  service_state: null,
  room_state_version: 1,
  ...values,
});
const event = (details: Record<string, unknown>, values: Partial<LegacyRoomStateSnapshot["housekeeping_events"][number]> = {}) => ({
  id: "hk-event-1",
  hotel_id: hotelId,
  room_id: roomId,
  event_type: "CLEANING_FINISH",
  actor_subject: "operator-1",
  request_id: "request-1",
  created_at: "2026-09-27T11:00:00.000Z",
  details_json: JSON.stringify(details),
  ...values,
});
function baseSnapshot(): LegacyRoomStateSnapshot {
  return {
    hotel_id: hotelId,
    hotel_local_date: "2026-09-27",
    sellability_range: { start_date: "2026-10-01", end_date: "2026-10-03" },
    source_schema_digest: "schema-sha256-synthetic",
    source_migration_digest: "migration-sha256-synthetic",
    rooms: [room()],
    bookings: [],
    inventory_nights: [],
    room_holds: [],
    maintenance_cases: [],
    housekeeping_events: [event({ room_state_version_after: 1, housekeeping_state_after: "READY", service_state_after: "IN_SERVICE" })],
    lifecycle_events: [],
  };
}

describe("F0.3 deterministic legacy room-state shadow mapping", () => {
  it("maps fully evidenced dimensions and produces stable digest/checksum independent of row order", async () => {
    const input = baseSnapshot();
    const first = await mapLegacyRoomState(input);
    const reordered = await mapLegacyRoomState({ ...input, housekeeping_events: [...input.housekeeping_events].reverse() });
    expect(first.rows[0]).toMatchObject({
      classification: "MAPPED",
      confidence: "HIGH",
      dimensions: {
        occupancy: "VACANT",
        housekeeping: "READY",
        maintenanceImpact: "NONE",
        serviceState: "IN_SERVICE",
        readiness: { state: "READY_FOR_ARRIVAL" },
      },
      date_range_sellability: "SELLABLE",
      compatibility_status: "AVAILABLE",
      source_reference_ids: ["events:hk-event-1", "rooms:room-1"],
    });
    expect(reordered.source_digest).toBe(first.source_digest);
    expect(reordered.report_checksum).toBe(first.report_checksum);
    expect(first.class_counts).toMatchObject({ MAPPED: 1, REVIEW_REQUIRED: 0 });
  });

  it.each([
    ["DIRTY", "DIRTY", "IN_SERVICE", "DIRTY", "VACANT", "NONE"],
    ["CLEANING", "CLEANING", "IN_SERVICE", "CLEANING", "VACANT", "NONE"],
    ["OUT_OF_ORDER", "READY", "OUT_OF_ORDER", "READY", "VACANT", "NONE"],
  ])("maps supported legacy state %s only with explicit independent dimensions", async (legacy, housekeeping, service, expectedHousekeeping, occupancy, impact) => {
    const input = baseSnapshot();
    input.rooms = [room({ status: legacy, housekeeping_state: housekeeping, service_state: service })];
    input.housekeeping_events = [];
    const result = await mapLegacyRoomState(input);
    expect(result.rows[0]).toMatchObject({
      classification: "MAPPED",
      dimensions: { housekeeping: expectedHousekeeping, serviceState: service, occupancy, maintenanceImpact: impact },
    });
  });

  it("keeps NON_BLOCKING maintenance advisory and sellable while BLOCKING maintenance blocks sellability", async () => {
    const input = baseSnapshot();
    input.rooms = [room({ housekeeping_state: "READY", service_state: "IN_SERVICE" })];
    input.housekeeping_events = [];
    input.maintenance_cases = [{ id: "advisory", hotel_id: hotelId, room_id: roomId, status: "OPEN", impact: "NON_BLOCKING" }];
    const advisory = await mapLegacyRoomState(input);
    expect(advisory.rows[0]).toMatchObject({ classification: "MAPPED", dimensions: { maintenanceImpact: "NON_BLOCKING" }, date_range_sellability: "SELLABLE" });
    input.rooms = [room({ status: "MAINTENANCE", housekeeping_state: "READY", service_state: "IN_SERVICE" })];
    input.maintenance_cases = [{ id: "blocker", hotel_id: hotelId, room_id: roomId, status: "OPEN", impact: "BLOCKING" }];
    const blocking = await mapLegacyRoomState(input);
    expect(blocking.rows[0]).toMatchObject({ classification: "MAPPED", dimensions: { maintenanceImpact: "BLOCKING" }, readiness: { state: "NOT_READY" }, date_range_sellability: "NOT_SELLABLE" });
  });

  it("does not infer Housekeeping READY or service state from legacy AVAILABLE", async () => {
    const input = baseSnapshot();
    input.housekeeping_events = [];
    const result = await mapLegacyRoomState(input);
    expect(result.rows[0]).toMatchObject({
      classification: "REVIEW_REQUIRED",
      readiness: { state: "UNRESOLVED" },
      date_range_sellability: "UNRESOLVED",
      compatibility_status: null,
    });
  });

  it("derives occupied blocking maintenance from authoritative checked-in assignment without erasing other dimensions", async () => {
    const input = baseSnapshot();
    input.rooms = [room({ status: "MAINTENANCE" })];
    input.bookings = [{
      id: "stay-1", hotel_id: hotelId, room_id: roomId, status: "CHECKED_IN",
      check_in: "2026-09-25", check_out: "2026-09-29",
    }];
    input.inventory_nights = ["2026-09-25", "2026-09-26", "2026-09-27", "2026-09-28"]
      .map(stay_date => ({ room_id: roomId, stay_date, booking_id: "stay-1" }));
    input.maintenance_cases = [{
      id: "case-1", hotel_id: hotelId, room_id: roomId, status: "OPEN", impact: "BLOCKING",
    }];
    input.housekeeping_events = [];
    input.lifecycle_events = [event({
      room_state_version_after: 1,
      housekeeping_state_after: "READY",
      service_state_after: "IN_SERVICE",
      occupancy_after: "OCCUPIED",
    }, { id: "lifecycle-1", event_type: "CHECK_IN" })];
    const result = await mapLegacyRoomState(input);
    expect(result.rows[0]).toMatchObject({
      classification: "MAPPED",
      dimensions: { occupancy: "OCCUPIED", housekeeping: "READY", maintenanceImpact: "BLOCKING", serviceState: "IN_SERVICE" },
      readiness: { state: "NOT_READY" },
      date_range_sellability: "NOT_SELLABLE",
      compatibility_status: "OCCUPIED",
    });
  });

  it("holds a legacy MAINTENANCE row for review when only NON_BLOCKING evidence exists", async () => {
    const input = baseSnapshot();
    input.rooms = [room({ status: "MAINTENANCE", housekeeping_state: "READY", service_state: "IN_SERVICE" })];
    input.maintenance_cases = [{
      id: "case-1", hotel_id: hotelId, room_id: roomId, status: "OPEN", impact: "NON_BLOCKING",
    }];
    input.housekeeping_events = [];
    const result = await mapLegacyRoomState(input);
    expect(result.rows[0].classification).toBe("REVIEW_REQUIRED");
    expect(result.rows[0].reasons).toContain("LEGACY_MAINTENANCE_WITHOUT_BLOCKING_CASE");
    expect(result.rows[0].readiness.state).toBe("UNRESOLVED");
    expect(result.rows[0].date_range_sellability).toBe("UNRESOLVED");
  });

  it("classifies duplicate open cases, orphan claims and unsupported values without readiness", async () => {
    const duplicate = baseSnapshot();
    duplicate.rooms = [room({ housekeeping_state: "READY", service_state: "IN_SERVICE" })];
    duplicate.housekeeping_events = [];
    duplicate.maintenance_cases = [
      { id: "case-1", hotel_id: hotelId, room_id: roomId, status: "OPEN", impact: "NON_BLOCKING" },
      { id: "case-2", hotel_id: hotelId, room_id: roomId, status: "OPEN", impact: "BLOCKING" },
    ];
    const duplicateResult = await mapLegacyRoomState(duplicate);
    expect(duplicateResult.rows[0].classification).toBe("DUPLICATE_OPEN_CASE");
    expect(duplicateResult.rows[0].readiness.state).toBe("UNRESOLVED");

    const orphan = baseSnapshot();
    orphan.rooms = [room({ housekeeping_state: "READY", service_state: "IN_SERVICE" })];
    orphan.housekeeping_events = [];
    orphan.inventory_nights = [{ room_id: roomId, stay_date: "2026-10-01", booking_id: "missing-booking" }];
    const orphanResult = await mapLegacyRoomState(orphan);
    expect(orphanResult.rows[0].classification).toBe("ORPHAN");
    expect(orphanResult.rows[0].date_range_sellability).toBe("UNRESOLVED");

    const unsupported = baseSnapshot();
    unsupported.rooms = [room({ status: "BROKEN" })];
    unsupported.housekeeping_events = [];
    const unsupportedResult = await mapLegacyRoomState(unsupported);
    expect(unsupportedResult.rows[0].classification).toBe("UNSUPPORTED_VALUE");
    expect(unsupportedResult.rows[0].readiness.state).toBe("UNRESOLVED");
  });

  it("distinguishes date-range inventory/hold blockers and invalidates a changed source digest", async () => {
    const input = baseSnapshot();
    const baseline = await mapLegacyRoomState(input);
    input.room_holds = [{
      id: "hold-1", hotel_id: hotelId, room_id: roomId, start_date: "2026-10-02", end_date: "2026-10-04",
    }];
    const held = await mapLegacyRoomState(input);
    expect(held.rows[0].classification).toBe("MAPPED");
    expect(held.rows[0].date_range_sellability).toBe("NOT_SELLABLE");
    expect(held.source_digest).not.toBe(baseline.source_digest);

    input.room_holds[0].start_date = "2026-10-03";
    input.room_holds[0].end_date = "2026-10-04";
    const edgeTouch = await mapLegacyRoomState(input);
    expect(edgeTouch.rows[0].date_range_sellability).toBe("SELLABLE");
  });

  it("detects stale event versions and malformed/invalid source intervals", async () => {
    const stale = baseSnapshot();
    stale.housekeeping_events = [event({ room_state_version_after: 2, housekeeping_state_after: "READY", service_state_after: "IN_SERVICE" })];
    const staleResult = await mapLegacyRoomState(stale);
    expect(staleResult.rows[0].classification).toBe("CONFLICT");
    expect(staleResult.rows[0].reasons).toContain("EVENT_VERSION_AHEAD_OF_ROOM");
    expect(staleResult.rows[0].readiness.state).toBe("UNRESOLVED");

    const invalid = baseSnapshot();
    invalid.hotel_local_date = "2026-99-99";
    invalid.sellability_range = { start_date: "2026-10-03", end_date: "2026-10-01" };
    const invalidResult = await mapLegacyRoomState(invalid);
    expect(invalidResult.rows[0].classification).toBe("REVIEW_REQUIRED");
    expect(invalidResult.rows[0].date_range_sellability).toBe("UNRESOLVED");
  });

  it("accounts every related source row and explicitly classifies source rows with no local room", async () => {
    const input = baseSnapshot();
    input.rooms = [room({ housekeeping_state: "READY", service_state: "IN_SERVICE" })];
    input.housekeeping_events = [];
    input.bookings = [{ id: "orphan-booking", hotel_id: hotelId, room_id: "missing-room", status: "CONFIRMED", check_in: "2026-10-01", check_out: "2026-10-02" }];
    input.room_holds = [{ id: "orphan-hold", hotel_id: hotelId, room_id: "missing-room", start_date: "2026-10-01", end_date: "2026-10-02" }];
    const result = await mapLegacyRoomState(input);
    expect(result.accounted_input_record_count).toBe(result.input_record_count);
    expect(result.source_dispositions).toEqual(expect.arrayContaining([
      expect.objectContaining({ source_reference_id: "bookings:orphan-booking", classification: "ORPHAN" }),
      expect.objectContaining({ source_reference_id: "room_holds:orphan-hold", classification: "ORPHAN" }),
    ]));
    expect(result.input_class_counts.ORPHAN).toBe(2);
  });

  it("quarantines a source event whose explicit hotel identity differs even when its type is unrelated", async () => {
    const input = baseSnapshot();
    input.housekeeping_events = [event({ arbitrary: true }, { hotel_id: "foreign-hotel", event_type: "REPORT_VIEWED" })];
    const result = await mapLegacyRoomState(input);
    expect(result.rows[0].classification).toBe("CONFLICT");
    expect(result.rows[0].reasons).toContain("EVENT_TENANT_MISMATCH");
    expect(result.source_dispositions).toContainEqual(expect.objectContaining({
      source_reference_id: "housekeeping_events:hk-event-1",
      hotel_id: "foreign-hotel",
      classification: "ORPHAN",
    }));
  });

  it("does not confuse separate bookings on the same night with a cross-room claim collision", async () => {
    const input = baseSnapshot();
    input.rooms = [
      room({ id: "room-1", housekeeping_state: "READY", service_state: "IN_SERVICE" }),
      room({ id: "room-2", housekeeping_state: "READY", service_state: "IN_SERVICE" }),
    ];
    input.housekeeping_events = [];
    input.bookings = [
      { id: "stay-1", hotel_id: hotelId, room_id: "room-1", status: "CONFIRMED", check_in: "2026-10-01", check_out: "2026-10-03" },
      { id: "stay-2", hotel_id: hotelId, room_id: "room-2", status: "CONFIRMED", check_in: "2026-10-01", check_out: "2026-10-03" },
    ];
    input.inventory_nights = [
      { room_id: "room-1", stay_date: "2026-10-01", booking_id: "stay-1" },
      { room_id: "room-1", stay_date: "2026-10-02", booking_id: "stay-1" },
      { room_id: "room-2", stay_date: "2026-10-01", booking_id: "stay-2" },
      { room_id: "room-2", stay_date: "2026-10-02", booking_id: "stay-2" },
    ];
    const result = await mapLegacyRoomState(input);
    expect(result.rows.map(row => row.classification)).toEqual(["MAPPED", "MAPPED"]);
    expect(result.rows.some(row => row.reasons.includes("OVERLAPPING_ROOM_NIGHT_CLAIMS_ACROSS_ROOMS"))).toBe(false);

    input.inventory_nights.push({ room_id: "room-2", stay_date: "2026-10-01", booking_id: "stay-1" });
    const collision = await mapLegacyRoomState(input);
    expect(collision.rows.map(row => row.classification)).toEqual(["CONFLICT", "ORPHAN"]);
    expect(collision.rows[0].reasons).toContain("OVERLAPPING_ROOM_NIGHT_CLAIMS_ACROSS_ROOMS");

    input.inventory_nights.pop();
    input.inventory_nights.push({ room_id: "room-2", stay_date: "not-a-date", booking_id: "stay-2" });
    const invalidDate = await mapLegacyRoomState(input);
    expect(invalidDate.rows[1].classification).toBe("CONFLICT");
    expect(invalidDate.rows[1].reasons).toContain("INVALID_ROOM_NIGHT_DATE");
  });

  it("does not use unrelated or insufficiently-provenanced events as dimension evidence", async () => {
    const input = baseSnapshot();
    input.housekeeping_events = [event({ room_state_version_after: 1, housekeeping_state_after: "READY", service_state_after: "IN_SERVICE" }, { event_type: "REPORT_VIEWED" })];
    const unrelated = await mapLegacyRoomState(input);
    expect(unrelated.rows[0].classification).toBe("REVIEW_REQUIRED");
    expect(unrelated.rows[0].readiness.state).toBe("UNRESOLVED");

    input.housekeeping_events = [event({ room_state_version_after: 1, housekeeping_state_after: "READY", service_state_after: "IN_SERVICE" }, { created_at: "2026-09-27" })];
    const weakProvenance = await mapLegacyRoomState(input);
    expect(weakProvenance.rows[0].classification).toBe("CONFLICT");
    expect(weakProvenance.rows[0].reasons).toContain("EVENT_PROVENANCE_INCOMPLETE");
  });

  it("reconciles a valid in-stay reassignment while preserving past room-night claims", async () => {
    const input = baseSnapshot();
    input.rooms = [
      room({ id: "old-room", status: "DIRTY", housekeeping_state: "DIRTY", service_state: "IN_SERVICE" }),
      room({ id: "new-room", status: "OCCUPIED", housekeeping_state: "READY", service_state: "IN_SERVICE" }),
    ];
    input.bookings = [{ id: "stay-moved", hotel_id: hotelId, room_id: "new-room", status: "CHECKED_IN", check_in: "2026-09-25", check_out: "2026-09-29" }];
    input.inventory_nights = [
      { room_id: "old-room", stay_date: "2026-09-25", booking_id: "stay-moved" },
      { room_id: "old-room", stay_date: "2026-09-26", booking_id: "stay-moved" },
      { room_id: "new-room", stay_date: "2026-09-27", booking_id: "stay-moved" },
      { room_id: "new-room", stay_date: "2026-09-28", booking_id: "stay-moved" },
    ];
    input.housekeeping_events = [];
    input.lifecycle_events = [event({
      from_room_id: "old-room", to_room_id: "new-room", effective_date: "2026-09-27",
      room_state_version_after: 1, housekeeping_state_after: "READY", service_state_after: "IN_SERVICE",
    }, { id: "move-1", room_id: "new-room", booking_id: "stay-moved", from_room_id: "old-room", event_type: "REASSIGN" })];
    const result = await mapLegacyRoomState(input);
    expect(result.rows.map(row => [row.room_id, row.classification, row.dimensions.occupancy])).toEqual([
      ["new-room", "MAPPED", "OCCUPIED"],
      ["old-room", "MAPPED", "VACANT"],
    ]);
    expect(result.rows.find(row => row.room_id === "old-room")?.source_reference_ids).toContain("lifecycle_events:move-1");
    expect(result.accounted_input_record_count).toBe(result.input_record_count);

    input.lifecycle_events[0].details_json = JSON.stringify({
      from_room_id: "different-old-room", to_room_id: "new-room", effective_date: "2026-09-27",
      room_state_version_after: 1, housekeeping_state_after: "READY", service_state_after: "IN_SERVICE",
    });
    const mismatchedHistory = await mapLegacyRoomState(input);
    expect(mismatchedHistory.rows.every(row => row.classification === "CONFLICT")).toBe(true);
    expect(mismatchedHistory.rows.find(row => row.room_id === "new-room")?.reasons).toContain("REASSIGN_HISTORY_FROM_ROOM_MISMATCH");
    input.lifecycle_events[0].details_json = JSON.stringify({
      from_room_id: "old-room", to_room_id: "new-room", effective_date: "2026-09-27",
      room_state_version_after: 1, housekeeping_state_after: "READY", service_state_after: "IN_SERVICE",
    });

    input.inventory_nights = input.inventory_nights.filter(claim => claim.stay_date !== "2026-09-25");
    const missingPastClaim = await mapLegacyRoomState(input);
    expect(missingPastClaim.rows.every(row => row.classification === "CONFLICT")).toBe(true);
    expect(missingPastClaim.rows.find(row => row.room_id === "old-room")?.reasons).toContain("ACTIVE_BOOKING_MISSING_EXPECTED_ROOM_NIGHT_CLAIM");
  });
});
