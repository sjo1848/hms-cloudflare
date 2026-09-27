import { describe, expect, it } from "vitest";
import { deriveDateRangeSellability, deriveRoomOperationalState } from "./domain";

describe("authoritative room dimensions", () => {
  it("derives check-in readiness from independent dimensions", () => {
    expect(deriveRoomOperationalState({
      checkedInBookingCount: 0,
      housekeepingState: "READY",
      openMaintenanceImpacts: ["NON_BLOCKING"],
      serviceState: "IN_SERVICE",
    })).toEqual({
      occupancy: "VACANT", housekeeping: "READY", maintenanceImpact: "NON_BLOCKING", serviceState: "IN_SERVICE",
      readiness: { state: "READY_FOR_ARRIVAL", reasons: [] },
    });
  });

  it("keeps occupied blocking-maintenance rooms occupied and does not overwrite housekeeping", () => {
    expect(deriveRoomOperationalState({
      checkedInBookingCount: 1,
      housekeepingState: "READY",
      openMaintenanceImpacts: ["BLOCKING"],
      serviceState: "IN_SERVICE",
    })).toEqual({
      occupancy: "OCCUPIED", housekeeping: "READY", maintenanceImpact: "BLOCKING", serviceState: "IN_SERVICE",
      readiness: { state: "NOT_READY", reasons: ["ROOM_OCCUPIED", "BLOCKING_MAINTENANCE_OPEN"] },
    });
  });

  it("fails closed on absent, invalid, conflicting, and unsupported dimension evidence", () => {
    for (const state of [
      { checkedInBookingCount: 0, housekeepingState: null, openMaintenanceImpacts: [], serviceState: "IN_SERVICE" },
      { checkedInBookingCount: 2, housekeepingState: "READY", openMaintenanceImpacts: [], serviceState: "IN_SERVICE" },
      { checkedInBookingCount: 0, housekeepingState: "ALIEN", openMaintenanceImpacts: [], serviceState: "IN_SERVICE" },
      { checkedInBookingCount: 0, housekeepingState: "READY", openMaintenanceImpacts: ["BROKEN"], serviceState: "IN_SERVICE" },
      { checkedInBookingCount: 0, housekeepingState: "READY", openMaintenanceImpacts: ["NON_BLOCKING", "BROKEN"], serviceState: "IN_SERVICE" },
      { checkedInBookingCount: 0, housekeepingState: "READY", openMaintenanceImpacts: ["BLOCKING", "BROKEN"], serviceState: "IN_SERVICE" },
      { checkedInBookingCount: 0, housekeepingState: "READY", openMaintenanceImpacts: [], serviceState: null },
    ]) {
      expect(deriveRoomOperationalState(state).readiness.state).toBe("UNRESOLVED");
    }
  });

  it("derives range sellability only from valid authoritative evidence", () => {
    const available = {
      intervalValid: true,
      serviceState: "IN_SERVICE" as const,
      hasOverlappingInventory: false,
      hasOverlappingHold: false,
      hasBlockingMaintenance: false,
    };
    expect(deriveDateRangeSellability(available)).toBe("SELLABLE");
    expect(deriveDateRangeSellability({ ...available, hasOverlappingInventory: true })).toBe("NOT_SELLABLE");
    expect(deriveDateRangeSellability({ ...available, hasOverlappingHold: true })).toBe("NOT_SELLABLE");
    expect(deriveDateRangeSellability({ ...available, hasBlockingMaintenance: true })).toBe("NOT_SELLABLE");
    expect(deriveDateRangeSellability({ ...available, serviceState: "OUT_OF_ORDER" })).toBe("NOT_SELLABLE");
    expect(deriveDateRangeSellability({ ...available, serviceState: "UNRESOLVED" })).toBe("UNRESOLVED");
  });
});
