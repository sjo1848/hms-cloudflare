export type MaintenanceCase = { id: string; status: string; priority: string; reason: string; assigned_to: string; reported_at: string; resolution_note?: string };
export type HousekeepingDeparture = { booking_id: string; room_id: string; room_number?: string; room_type?: string; room_status?: string; guest_name: string; booking_status: string };
export type HousekeepingRoom = { room_id: string; room_number: string; room_type: string; room_status: string; turnover_today: boolean; departure_guest_name?: string; departure_booking_status?: string; maintenance_case?: MaintenanceCase; departure?: HousekeepingDeparture };
export type HousekeepingBoard = { date: string; rooms: HousekeepingRoom[]; departures_today: HousekeepingDeparture[] };
export type HousekeepingQueueItem = HousekeepingRoom & { priorityRank: number; isBlocked: boolean; isOrphanDeparture: boolean };
export type HousekeepingDraft = { reason: string; priority: string; assignedTo: string; resolution: string };

const housekeepingMaintenanceRank: Record<string, number> = { Urgent: 0, High: 1, Medium: 2, Low: 3, URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
const bookingStatusSemantics: Record<string, "Confirmed" | "Cancelled" | "CheckedIn" | "CheckedOut" | string> = { CONFIRMED: "Confirmed", CANCELLED: "Cancelled", CHECKED_IN: "CheckedIn", CHECKED_OUT: "CheckedOut", Confirmed: "Confirmed", Cancelled: "Cancelled", CheckedIn: "CheckedIn", CheckedOut: "CheckedOut" };

function normalizeBookingStatus(status: string): string { return bookingStatusSemantics[status] ?? status; }

export function buildHousekeepingQueue(rooms: HousekeepingRoom[], departures: HousekeepingDeparture[]): HousekeepingQueueItem[] {
  const departureByRoom = new Map(departures.map(departure => [departure.room_id, departure]));
  const queue: HousekeepingQueueItem[] = rooms.map(room => {
    const departure = departureByRoom.get(room.room_id);
    const isBlocked = Boolean(departure && normalizeBookingStatus(departure.booking_status) === "CheckedIn") || room.room_status === "Maintenance";
    const priorityRank = room.maintenance_case
      ? (housekeepingMaintenanceRank[room.maintenance_case.priority] ?? 3)
      : room.room_status === "Dirty" && room.turnover_today ? 2
      : room.room_status === "Cleaning" && room.turnover_today ? 3
      : isBlocked ? 4
      : room.room_status === "Dirty" ? 5
      : room.room_status === "Cleaning" ? 6
      : room.room_status === "Maintenance" ? 7 : 8;
    return { ...room, departure, isBlocked, isOrphanDeparture: false, priorityRank };
  });
  const roomIds = new Set(rooms.map(room => room.room_id));
  for (const departure of departures) if (!roomIds.has(departure.room_id)) {
    queue.push({
      room_id: `departure:${departure.booking_id}`, room_number: departure.room_number ?? departure.room_id,
      room_type: departure.room_type ?? "Unknown", room_status: departure.room_status ?? "Occupied", turnover_today: true,
      departure_guest_name: departure.guest_name, departure_booking_status: departure.booking_status, departure,
      isBlocked: true, isOrphanDeparture: true, priorityRank: 4,
    });
  }
  return queue.sort((left, right) => left.priorityRank - right.priorityRank || left.room_number.localeCompare(right.room_number, "es", { numeric: true }));
}

export function filterHousekeepingQueue(queue: HousekeepingQueueItem[], filter: string, search: string): HousekeepingQueueItem[] {
  const normalizedSearch = search.trim().toLocaleLowerCase();
  return queue.filter(room => (filter === "shift" || room.room_status.toLowerCase() === filter) && `${room.room_number} ${room.room_type} ${room.room_status} ${room.departure_guest_name ?? ""}`.toLocaleLowerCase().includes(normalizedSearch));
}

export const newHousekeepingDraft = (): HousekeepingDraft => ({ reason: "", priority: "MEDIUM", assignedTo: "ops", resolution: "" });
