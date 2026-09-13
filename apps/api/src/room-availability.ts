export const ADVANCE_RESERVABLE_ROOM_STATUSES = [
  "AVAILABLE",
  "OCCUPIED",
  "DIRTY",
  "CLEANING",
] as const;

const reservableStatusSet = new Set<string>(ADVANCE_RESERVABLE_ROOM_STATUSES);

/**
 * Advance reservation inventory is date-based. A room can be occupied/dirty/cleaning
 * right now and still be sellable for a non-overlapping future stay. Maintenance and
 * out-of-order states remain blocked until their operational state is cleared.
 */
export function isAdvanceReservableRoomStatus(status: string): boolean {
  return reservableStatusSet.has(status.toUpperCase());
}

/** SQL predicate for queries that consistently alias the rooms table as `r`. */
export const ADVANCE_RESERVABLE_ROOM_SQL =
  "r.status IN ('AVAILABLE', 'OCCUPIED', 'DIRTY', 'CLEANING')";
