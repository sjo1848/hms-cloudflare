import type { OperationalDatabase } from "../../routing";
import { ADVANCE_RESERVABLE_ROOM_SQL } from "../../room-availability";
import type { BookingListQuery, BookingRow, BookingUpdateResult, CreateBookingRecord, UpdateBookingRecord } from "./domain";
import type { BookingRepository } from "./ports";

const bookingSelect = `SELECT b.id, b.guest_id, g.full_name AS guest_name, g.email AS guest_email,
  b.room_id, r.room_number, r.room_type, r.price_cents, b.check_in, b.check_out,
  b.status, b.total_cents, b.notes, b.created_at, b.updated_at
  FROM bookings AS b JOIN guests AS g ON g.id = b.guest_id JOIN rooms AS r ON r.id = b.room_id`;

function claimStatements(database: OperationalDatabase, bookingId: string, roomId: string, claimNights: string[], start: string, end: string) {
  return claimNights.map(stayDate => database.prepare(
    "INSERT INTO room_inventory_nights (room_id, stay_date, booking_id) SELECT ?1, ?2, ?3 WHERE EXISTS (SELECT 1 FROM bookings WHERE id = ?3 AND room_id = ?1 AND check_in = ?4 AND check_out = ?5 AND status = 'CONFIRMED')",
  ).bind(roomId, stayDate, bookingId, start, end));
}

export class D1BookingRepository implements BookingRepository {
  public constructor(private readonly database: OperationalDatabase) {}

  async list(query: BookingListQuery): Promise<BookingRow[]> {
    const conditions: string[] = [];
    const values: string[] = [];
    if (query.status) { conditions.push("b.status = ?"); values.push(query.status.toUpperCase()); }
    if (query.start && query.end) {
      conditions.push("b.check_in < ?"); values.push(query.end);
      conditions.push("b.check_out > ?"); values.push(query.start);
    }
    const where = conditions.length ? ` WHERE ${conditions.join(" AND ")}` : "";
    const statement = this.database.prepare(`${bookingSelect}${where} ORDER BY b.check_in, b.created_at DESC LIMIT ${query.limit}`);
    const rows = values.length ? await statement.bind(...values).all<BookingRow>() : await statement.all<BookingRow>();
    return rows.results;
  }

  find(id: string): Promise<BookingRow | null> {
    return this.database.prepare(`${bookingSelect} WHERE b.id = ?1`).bind(id).first<BookingRow>();
  }

  async validateReferences(guestId: string, roomId: string, bookingId: string | null, start: string, end: string): Promise<number | null> {
    const row = await this.database.prepare(
      `SELECT r.price_cents FROM rooms AS r JOIN guests AS g ON g.id = ?1
       WHERE r.id = ?2 AND ${ADVANCE_RESERVABLE_ROOM_SQL}
         AND NOT EXISTS (SELECT 1 FROM room_holds AS h WHERE h.room_id = r.id AND h.start_date < ?4 AND h.end_date > ?3)
         AND NOT EXISTS (SELECT 1 FROM room_inventory_nights AS n
                         WHERE n.room_id = r.id AND n.stay_date >= ?3 AND n.stay_date < ?4
                           AND (?5 IS NULL OR n.booking_id <> ?5))`,
    ).bind(guestId, roomId, start, end, bookingId).first<{ price_cents: number }>();
    return row?.price_cents ?? null;
  }

  async create(record: CreateBookingRecord): Promise<void> {
    await this.database.batch([
      this.database.prepare(`INSERT INTO bookings (id, guest_id, room_id, check_in, check_out, status, total_cents, notes, created_at, updated_at)
        SELECT ?1, g.id, r.id, ?4, ?5, 'CONFIRMED', ?6, ?7, ?8, ?8 FROM guests AS g JOIN rooms AS r ON r.id = ?3
        WHERE g.id = ?2 AND ${ADVANCE_RESERVABLE_ROOM_SQL}
        AND NOT EXISTS (SELECT 1 FROM room_holds AS h WHERE h.room_id = r.id AND h.start_date < ?5 AND h.end_date > ?4)`)
        .bind(record.id, record.guestId, record.roomId, record.start, record.end, record.totalCents, record.notes, record.now),
      ...claimStatements(this.database, record.id, record.roomId, record.claimNights, record.start, record.end),
    ]);
  }

  async cancel(bookingId: string, now: string): Promise<BookingUpdateResult> {
    const results = await this.database.batch([
      this.database.prepare("UPDATE bookings SET status = 'CANCELLED', updated_at = ?2 WHERE id = ?1 AND status = 'CONFIRMED'").bind(bookingId, now),
      this.database.prepare("DELETE FROM room_inventory_nights WHERE booking_id = ?1 AND EXISTS (SELECT 1 FROM bookings WHERE id = ?1 AND status = 'CANCELLED')").bind(bookingId),
    ]);
    return results[0] as BookingUpdateResult;
  }

  async update(record: UpdateBookingRecord): Promise<BookingUpdateResult> {
    const results = await this.database.batch([
      this.database.prepare(`UPDATE bookings SET guest_id = ?2, room_id = ?3, check_in = ?4, check_out = ?5, total_cents = ?6, notes = ?7, updated_at = ?8
        WHERE id = ?1 AND status = 'CONFIRMED' AND EXISTS (SELECT 1 FROM guests WHERE id = ?2)
        AND EXISTS (SELECT 1 FROM rooms AS r WHERE r.id = ?3 AND ${ADVANCE_RESERVABLE_ROOM_SQL})
        AND NOT EXISTS (SELECT 1 FROM room_holds WHERE room_id = ?3 AND start_date < ?5 AND end_date > ?4)`)
        .bind(record.bookingId, record.guestId, record.roomId, record.start, record.end, record.totalCents, record.notes, record.now),
      this.database.prepare(`DELETE FROM room_inventory_nights
        WHERE booking_id = ?1 AND EXISTS (
          SELECT 1 FROM bookings AS b WHERE b.id = ?1 AND b.room_id = ?2 AND b.check_in = ?3 AND b.check_out = ?4 AND b.status = 'CONFIRMED'
        ) AND NOT EXISTS (
          SELECT 1 FROM room_holds AS h WHERE h.room_id = ?2 AND h.start_date < ?4 AND h.end_date > ?3
        )`).bind(record.bookingId, record.roomId, record.start, record.end),
      ...claimStatements(this.database, record.bookingId, record.roomId, record.claimNights, record.start, record.end),
    ]);
    return results[0] as BookingUpdateResult;
  }
}
