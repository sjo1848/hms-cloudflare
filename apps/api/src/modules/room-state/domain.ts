export type Occupancy = "VACANT" | "OCCUPIED";
export type HousekeepingState = "READY" | "DIRTY" | "CLEANING";
export type MaintenanceImpact = "NONE" | "NON_BLOCKING" | "BLOCKING";
export type ServiceState = "IN_SERVICE" | "OUT_OF_ORDER";

export type RoomStateInput = {
  checkedInBookingCount: number;
  housekeepingState: string | null;
  openMaintenanceImpacts: readonly string[];
  serviceState: string | null;
};

export type RoomReadiness =
  | { state: "READY_FOR_ARRIVAL"; reasons: [] }
  | { state: "NOT_READY"; reasons: string[] }
  | { state: "UNRESOLVED"; reasons: string[] };

export type RoomOperationalState = {
  occupancy: Occupancy | "UNRESOLVED";
  housekeeping: HousekeepingState | "UNRESOLVED";
  maintenanceImpact: MaintenanceImpact | "UNRESOLVED";
  serviceState: ServiceState | "UNRESOLVED";
  readiness: RoomReadiness;
};

const housekeepingValues = new Set<HousekeepingState>(["READY", "DIRTY", "CLEANING"]);
const serviceValues = new Set<ServiceState>(["IN_SERVICE", "OUT_OF_ORDER"]);

export function deriveRoomOperationalState(input: RoomStateInput): RoomOperationalState {
  const occupancy: RoomOperationalState["occupancy"] = Number.isInteger(input.checkedInBookingCount)
    && input.checkedInBookingCount >= 0
    && input.checkedInBookingCount <= 1
    ? input.checkedInBookingCount === 1 ? "OCCUPIED" : "VACANT"
    : "UNRESOLVED";

  const housekeeping = housekeepingValues.has(input.housekeepingState as HousekeepingState)
    ? input.housekeepingState as HousekeepingState
    : "UNRESOLVED";
  const serviceState = serviceValues.has(input.serviceState as ServiceState)
    ? input.serviceState as ServiceState
    : "UNRESOLVED";

  const impacts = input.openMaintenanceImpacts;
  const maintenanceImpact: RoomOperationalState["maintenanceImpact"] = impacts.some((impact) => impact !== "BLOCKING" && impact !== "NON_BLOCKING")
    ? "UNRESOLVED"
    : impacts.some((impact) => impact === "BLOCKING")
      ? "BLOCKING"
    : impacts.some((impact) => impact === "NON_BLOCKING")
      ? "NON_BLOCKING"
      : impacts.length === 0 ? "NONE" : "UNRESOLVED";

  const unresolved: string[] = [];
  if (occupancy === "UNRESOLVED") unresolved.push("OCCUPANCY_UNKNOWN_OR_CONFLICTING");
  if (housekeeping === "UNRESOLVED") unresolved.push("HOUSEKEEPING_UNRESOLVED");
  if (maintenanceImpact === "UNRESOLVED") unresolved.push("MAINTENANCE_IMPACT_UNRESOLVED");
  if (serviceState === "UNRESOLVED") unresolved.push("SERVICE_STATE_UNRESOLVED");
  if (unresolved.length > 0) {
    return { occupancy, housekeeping, maintenanceImpact, serviceState, readiness: { state: "UNRESOLVED", reasons: unresolved } };
  }

  const reasons: string[] = [];
  if (occupancy !== "VACANT") reasons.push("ROOM_OCCUPIED");
  if (housekeeping !== "READY") reasons.push("HOUSEKEEPING_NOT_READY");
  if (maintenanceImpact === "BLOCKING") reasons.push("BLOCKING_MAINTENANCE_OPEN");
  if (serviceState !== "IN_SERVICE") reasons.push("ROOM_OUT_OF_ORDER");
  const readiness: RoomReadiness = reasons.length === 0
    ? { state: "READY_FOR_ARRIVAL", reasons: [] }
    : { state: "NOT_READY", reasons };
  return { occupancy, housekeeping, maintenanceImpact, serviceState, readiness };
}

export type SellabilityEvidence = {
  intervalValid: boolean;
  serviceState: ServiceState | "UNRESOLVED";
  hasOverlappingInventory: boolean;
  hasOverlappingHold: boolean;
  hasBlockingMaintenance: boolean;
};

export type DateRangeSellability = "SELLABLE" | "NOT_SELLABLE" | "UNRESOLVED";

/** Pure result classifier. Interval and blocker evidence must come from one authoritative hotel-scoped query. */
export function deriveDateRangeSellability(evidence: SellabilityEvidence): DateRangeSellability {
  if (!evidence.intervalValid || evidence.serviceState === "UNRESOLVED") return "UNRESOLVED";
  if (evidence.serviceState !== "IN_SERVICE" || evidence.hasOverlappingInventory || evidence.hasOverlappingHold || evidence.hasBlockingMaintenance) {
    return "NOT_SELLABLE";
  }
  return "SELLABLE";
}
