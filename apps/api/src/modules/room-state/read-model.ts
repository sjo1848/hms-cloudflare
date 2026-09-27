import { deriveRoomOperationalState, type RoomOperationalState } from "./domain";

export const ROOM_DIMENSION_SELECT = `
  r.status AS legacy_room_status,
  r.housekeeping_state,
  r.service_state,
  (SELECT COUNT(*) FROM bookings b WHERE b.room_id = r.id AND b.status = 'CHECKED_IN') AS checked_in_booking_count,
  (SELECT COUNT(*) FROM maintenance_cases mc WHERE mc.room_id = r.id AND mc.status = 'OPEN' AND mc.impact = 'BLOCKING') AS blocking_maintenance_count,
  (SELECT COUNT(*) FROM maintenance_cases mc WHERE mc.room_id = r.id AND mc.status = 'OPEN' AND mc.impact = 'NON_BLOCKING') AS non_blocking_maintenance_count,
  (SELECT COUNT(*) FROM maintenance_cases mc WHERE mc.room_id = r.id AND mc.status = 'OPEN') AS open_maintenance_count`;

export type RoomDimensionRow = {
  legacy_room_status: string;
  housekeeping_state: string | null;
  service_state: string | null;
  checked_in_booking_count: number;
  blocking_maintenance_count: number;
  non_blocking_maintenance_count: number;
  open_maintenance_count: number;
};

export function roomOperationalReadModel(row: RoomDimensionRow): RoomOperationalState {
  const knownImpactCount = row.blocking_maintenance_count + row.non_blocking_maintenance_count;
  const impacts = [
    ...Array.from({ length: row.blocking_maintenance_count }, () => "BLOCKING"),
    ...Array.from({ length: row.non_blocking_maintenance_count }, () => "NON_BLOCKING"),
    ...Array.from({ length: Math.max(0, row.open_maintenance_count - knownImpactCount) }, () => "UNKNOWN"),
  ];
  if (row.legacy_room_status === "MAINTENANCE" && row.blocking_maintenance_count === 0) impacts.push("UNKNOWN");
  const legacyOccupancyConflict = (row.legacy_room_status === "OCCUPIED" && row.checked_in_booking_count === 0)
    || (row.legacy_room_status !== "OCCUPIED" && row.checked_in_booking_count > 0);
  const checkedInBookingCount = legacyOccupancyConflict ? -1 : row.checked_in_booking_count;
  return deriveRoomOperationalState({
    checkedInBookingCount,
    housekeepingState: row.housekeeping_state,
    openMaintenanceImpacts: impacts,
    serviceState: row.service_state,
  });
}

export function legacyStatusForRoomState(state: RoomOperationalState): string {
  if (state.occupancy === "OCCUPIED") return "OCCUPIED";
  if (state.serviceState === "OUT_OF_ORDER") return "OUT_OF_ORDER";
  if (state.maintenanceImpact === "BLOCKING") return "MAINTENANCE";
  if (state.housekeeping === "READY") return "AVAILABLE";
  if (state.housekeeping === "DIRTY") return "DIRTY";
  if (state.housekeeping === "CLEANING") return "CLEANING";
  return "UNRESOLVED";
}

export function unresolvedSellability(reason = "DATE_RANGE_NOT_EVALUATED") {
  return { state: "UNRESOLVED" as const, reason };
}
