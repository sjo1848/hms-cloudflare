export type RoomRow = { id: string; room_number: string; room_type: string; status: string; price_cents: number };
export type GuestRow = { id: string; full_name: string; email: string; phone: string | null; created_at: string };
export type HoldRow = { id: string; room_id: string; room_number?: string; room_type?: string; start_date: string; end_date: string; hold_type: string; reason: string; created_by_user_id: string | null; created_at: string };

const roomStatusView: Record<string, string> = {
  AVAILABLE: "Available",
  OCCUPIED: "Occupied",
  DIRTY: "Dirty",
  CLEANING: "Cleaning",
  MAINTENANCE: "Maintenance",
  OUT_OF_ORDER: "OutOfOrder",
};

export const allowedHoldTypes = new Set(["Vip", "Maintenance", "Owner", "Compliance", "Commercial", "Other"]);

export function roomView(row: RoomRow, hotelId: string) {
  return { id: row.id, hotel_id: hotelId, room_number: row.room_number, room_type: row.room_type, status: roomStatusView[row.status] ?? row.status, price_cents: row.price_cents };
}

export function holdView(row: HoldRow, hotelId: string) {
  return { id: row.id, hotel_id: hotelId, room_id: row.room_id, start_date: row.start_date, end_date: row.end_date, hold_type: row.hold_type, reason: row.reason, created_by_user_id: row.created_by_user_id, created_at: row.created_at };
}
