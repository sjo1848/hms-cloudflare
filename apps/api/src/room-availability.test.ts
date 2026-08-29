import { describe, expect, it } from "vitest";
import {
  ADVANCE_RESERVABLE_ROOM_STATUSES,
  ADVANCE_RESERVABLE_ROOM_SQL,
  isAdvanceReservableRoomStatus,
} from "./room-availability";

describe("advance room reservability", () => {
  it("keeps physical readiness separate from future sale inventory", () => {
    for (const status of ["AVAILABLE", "OCCUPIED", "DIRTY", "CLEANING"]) {
      expect(isAdvanceReservableRoomStatus(status)).toBe(true);
    }
    for (const status of ["MAINTENANCE", "OUT_OF_ORDER", "UNKNOWN"]) {
      expect(isAdvanceReservableRoomStatus(status)).toBe(false);
    }
  });

  it("keeps the SQL allowlist in sync with the domain allowlist", () => {
    for (const status of ADVANCE_RESERVABLE_ROOM_STATUSES) {
      expect(ADVANCE_RESERVABLE_ROOM_SQL).toContain(`'${status}'`);
    }
    expect(ADVANCE_RESERVABLE_ROOM_SQL).not.toContain("'MAINTENANCE'");
    expect(ADVANCE_RESERVABLE_ROOM_SQL).not.toContain("'OUT_OF_ORDER'");
  });
});
