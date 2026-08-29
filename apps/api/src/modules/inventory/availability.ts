import type { OperationalDatabase } from "../../routing";
import { ADVANCE_RESERVABLE_ROOM_SQL } from "../../room-availability";

export type AvailableRoomRow = {
  id: string;
  room_number: string;
  room_type: string;
  status: string;
  price_cents: number;
};

export async function listAvailableRooms(
  database: OperationalDatabase,
  start: string,
  end: string,
  excludeBookingId: string | null = null,
): Promise<AvailableRoomRow[]> {
  const rows = await database.prepare(
    `SELECT r.id, r.room_number, r.room_type, r.status, r.price_cents
     FROM rooms AS r
     WHERE ${ADVANCE_RESERVABLE_ROOM_SQL}
     AND NOT EXISTS (
       SELECT 1 FROM room_holds AS h
       WHERE h.room_id = r.id AND h.start_date < ?2 AND h.end_date > ?1
     )
     AND NOT EXISTS (
       SELECT 1 FROM room_inventory_nights AS n
       WHERE n.room_id = r.id AND n.stay_date >= ?1 AND n.stay_date < ?2
         AND (?3 IS NULL OR n.booking_id <> ?3)
     )
     ORDER BY r.room_number`,
  ).bind(start, end, excludeBookingId).all<AvailableRoomRow>();
  return rows.results;
}

export function findRoomById(
  database: OperationalDatabase,
  roomId: string,
): Promise<AvailableRoomRow | null> {
  return database.prepare(
    "SELECT id, room_number, room_type, status, price_cents FROM rooms WHERE id = ?1",
  ).bind(roomId).first<AvailableRoomRow>();
}

export function findAvailableRoom(
  database: OperationalDatabase,
  roomId: string,
  start: string,
  end: string,
): Promise<AvailableRoomRow | null> {
  return database.prepare(
    `SELECT r.id, r.room_number, r.room_type, r.status, r.price_cents
     FROM rooms AS r
     WHERE r.id = ?1 AND ${ADVANCE_RESERVABLE_ROOM_SQL}
     AND NOT EXISTS (
       SELECT 1 FROM room_holds AS h
       WHERE h.room_id = r.id AND h.start_date < ?3 AND h.end_date > ?2
     )
     AND NOT EXISTS (
       SELECT 1 FROM room_inventory_nights AS n
       WHERE n.room_id = r.id AND n.stay_date >= ?2 AND n.stay_date < ?3
     )
     LIMIT 1`,
  ).bind(roomId, start, end).first<AvailableRoomRow>();
}
