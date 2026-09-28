import type { OperationalDatabase } from "../../routing";
import { ADVANCE_RESERVABLE_ROOM_SQL } from "../../room-availability";
import type { BookingListQuery, BookingMutationProvenance, BookingRow, BookingUpdateResult, CreateBookingRecord, UpdateBookingRecord } from "./domain";
import type { BookingPricingReference, BookingRepository } from "./ports";

const bookingSelect = `SELECT b.id, b.guest_id, g.full_name AS guest_name, g.email AS guest_email,
  b.room_id, r.room_number, r.room_type, r.price_cents, b.check_in, b.check_out,
  b.status, b.total_cents, b.notes, b.created_at, b.updated_at
  FROM bookings AS b JOIN guests AS g ON g.id = b.guest_id JOIN rooms AS r ON r.id = b.room_id`;

function claimStatements(database: OperationalDatabase, bookingId: string, roomId: string, claimNights: string[], start: string, end: string) {
  return claimNights.map(stayDate => database.prepare(
    "INSERT INTO room_inventory_nights (room_id, stay_date, booking_id) SELECT ?1, ?2, ?3 WHERE EXISTS (SELECT 1 FROM bookings WHERE id = ?3 AND room_id = ?1 AND check_in = ?4 AND check_out = ?5 AND status = 'CONFIRMED')",
  ).bind(roomId, stayDate, bookingId, start, end));
}

function mutationEventStatement(
  database: OperationalDatabase,
  bookingId: string,
  action: "CREATE" | "CANCEL",
  provenance: BookingMutationProvenance,
  now: string,
) {
  return database.prepare(`INSERT OR IGNORE INTO agent_mutation_events
    (id, booking_id, action, tenant_id, hotel_id, actor_id, session_id, trace_id, created_at)
    SELECT ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9
    WHERE EXISTS (SELECT 1 FROM bookings WHERE id = ?2 AND status = 'CONFIRMED')`)
    .bind(
      `${bookingId}:${action}`,
      bookingId,
      action,
      provenance.tenantId,
      provenance.hotelId,
      provenance.actorId,
      provenance.sessionId,
      provenance.traceId,
      now,
    );
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
    return (await this.validatePricingReferences(guestId, roomId, bookingId, start, end))?.priceCents ?? null;
  }

  async validatePricingReferences(guestId: string, roomId: string, bookingId: string | null, start: string, end: string): Promise<BookingPricingReference | null> {
    const row = await this.database.prepare(
      `SELECT r.price_cents,r.pricing_version FROM rooms AS r JOIN guests AS g ON g.id = ?1
       WHERE r.id = ?2 AND ${ADVANCE_RESERVABLE_ROOM_SQL}
         AND NOT EXISTS (SELECT 1 FROM room_holds AS h WHERE h.room_id = r.id AND h.start_date < ?4 AND h.end_date > ?3)
         AND NOT EXISTS (SELECT 1 FROM room_inventory_nights AS n
                         WHERE n.room_id = r.id AND n.stay_date >= ?3 AND n.stay_date < ?4
                           AND (?5 IS NULL OR n.booking_id <> ?5))`,
    ).bind(guestId, roomId, start, end, bookingId).first<{ price_cents: number; pricing_version: number }>();
    return row ? { priceCents: row.price_cents, pricingVersion: row.pricing_version } : null;
  }

  async extraChargeTotal(bookingId: string): Promise<number> {
    const row = await this.database.prepare("SELECT COALESCE(SUM(amount_cents),0) AS total FROM extra_charges WHERE booking_id=?1")
      .bind(bookingId).first<{ total: number }>();
    return row?.total ?? 0;
  }

  async create(record: CreateBookingRecord): Promise<BookingUpdateResult> {
    const operationToken = record.operationToken ?? `booking:${record.id}`;
    const results = await this.database.batch([
      this.database.prepare(`INSERT INTO bookings (id, guest_id, room_id, check_in, check_out, status, total_cents, notes, created_at, updated_at,last_pricing_operation_token)
        SELECT ?1, g.id, r.id, ?4, ?5, 'CONFIRMED', ?6, ?7, ?8, ?8,?9 FROM guests AS g JOIN rooms AS r ON r.id = ?3
        WHERE g.id = ?2 AND ${ADVANCE_RESERVABLE_ROOM_SQL}
        AND r.price_cents=?10 AND r.pricing_version=?11
        AND NOT EXISTS (SELECT 1 FROM room_holds AS h WHERE h.room_id = r.id AND h.start_date < ?5 AND h.end_date > ?4)
        AND (?12 IS NULL OR EXISTS (SELECT 1 FROM reservation_creation_operations o
          WHERE o.operation_token=?12 AND o.payload_hash=?13 AND o.booking_id=?1 AND o.guest_id=g.id
            AND o.room_id=r.id AND o.check_in=?4 AND o.check_out=?5
            AND o.stage IN ('GUEST_CREATED','EXISTING_GUEST_SELECTED')))`)
        .bind(record.id, record.guestId, record.roomId, record.start, record.end, record.totalCents, record.notes, record.now,
          operationToken, record.roomRateCents, record.roomPricingVersion,
          record.recovery?.operationToken ?? null, record.recovery?.payloadHash ?? null),
      this.database.prepare(`INSERT INTO booking_pricing_segments
        (segment_id,booking_id,room_id,effective_start,effective_end,rate_cents,room_pricing_version,segment_version,operation_token,actor_subject,hotel_id,request_id,created_at)
        SELECT ?1,?2,?3,?4,?5,r.price_cents,r.pricing_version,1,?6,?7,?8,?9,?10
        FROM rooms r JOIN bookings b ON b.room_id=r.id AND b.id=?2
        WHERE r.id=?3 AND b.status='CONFIRMED' AND b.last_pricing_operation_token=?6
          AND b.total_cents=?11 AND r.price_cents=?12 AND r.pricing_version=?13`)
        .bind(`${record.id}:segment`, record.id, record.roomId, record.start, record.end, operationToken,
          record.pricingProvenance.actorSubject, record.pricingProvenance.hotelId, record.pricingProvenance.requestId,
          record.now, record.totalCents, record.roomRateCents, record.roomPricingVersion),
      ...claimStatements(this.database, record.id, record.roomId, record.claimNights, record.start, record.end),
      ...(record.provenance ? [mutationEventStatement(this.database, record.id, "CREATE", record.provenance, record.now)] : []),
      ...(record.recovery ? [
        this.database.prepare(`UPDATE reservation_creation_operations
          SET stage='BOOKING_CREATED',updated_at=?7,booking_created_by_subject=?4,
              booking_request_id=?5,booking_created_at=?6
          WHERE operation_token=?1 AND payload_hash=?2 AND booking_id=?3
            AND stage IN ('GUEST_CREATED','EXISTING_GUEST_SELECTED')
            AND EXISTS (
              SELECT 1 FROM bookings b
              WHERE b.id=?3 AND b.guest_id=reservation_creation_operations.guest_id
                AND b.room_id=reservation_creation_operations.room_id
                AND b.check_in=reservation_creation_operations.check_in
                AND b.check_out=reservation_creation_operations.check_out
                AND b.status='CONFIRMED' AND b.last_pricing_operation_token=?8
                AND (SELECT COUNT(*) FROM room_inventory_nights n WHERE n.booking_id=b.id)=json_array_length(?9)
                AND NOT EXISTS (SELECT 1 FROM room_inventory_nights n WHERE n.booking_id=b.id
                  AND NOT EXISTS (SELECT 1 FROM json_each(?9) expected WHERE expected.value=n.stay_date AND n.room_id=b.room_id))
                AND NOT EXISTS (SELECT 1 FROM json_each(?9) expected
                  WHERE NOT EXISTS (SELECT 1 FROM room_inventory_nights n WHERE n.booking_id=b.id
                    AND n.room_id=b.room_id AND n.stay_date=expected.value))
                AND EXISTS (SELECT 1 FROM booking_pricing_segments s WHERE s.booking_id=b.id
                  AND s.room_id=b.room_id AND s.effective_start=b.check_in AND s.effective_end=b.check_out
                  AND s.operation_token=b.last_pricing_operation_token AND s.segment_version=b.pricing_version)
            )
          RETURNING operation_token`)
          .bind(record.recovery.operationToken, record.recovery.payloadHash, record.id,
            record.recovery.actorSubject, record.recovery.requestId, record.now, record.now,
            operationToken, JSON.stringify(record.claimNights)),
        this.database.prepare(`INSERT INTO reservation_creation_events
          (id,operation_token,event_type,guest_id,booking_id,actor_subject,hotel_id,request_id,created_at)
          SELECT ?1,o.operation_token,'BOOKING_CREATED',o.guest_id,o.booking_id,?3,o.hotel_id,?4,?5
          FROM reservation_creation_operations o
          WHERE o.operation_token=?2 AND o.stage='BOOKING_CREATED'
            AND o.booking_created_by_subject=?3 AND o.booking_request_id=?4 AND o.booking_created_at=?5`)
          .bind(`${record.recovery.operationToken}:BOOKING_CREATED`, record.recovery.operationToken,
            record.recovery.actorSubject, record.recovery.requestId, record.now),
      ] : []),
    ]);
    return results[0] as BookingUpdateResult;
  }

  async cancel(bookingId: string, now: string, provenance?: BookingMutationProvenance): Promise<BookingUpdateResult> {
    const update = this.database.prepare("UPDATE bookings SET status = 'CANCELLED', updated_at = ?2 WHERE id = ?1 AND status = 'CONFIRMED'").bind(bookingId, now);
    const cleanup = this.database.prepare("DELETE FROM room_inventory_nights WHERE booking_id = ?1 AND EXISTS (SELECT 1 FROM bookings WHERE id = ?1 AND status = 'CANCELLED')").bind(bookingId);
    // The provenance claim runs first while the booking must still be CONFIRMED.
    // D1 batch is one transaction: once this write starts, a competing cancellation
    // cannot interleave between the claim and our conditional transition. If another
    // caller already won, the claim inserts zero rows and this operation is a replay.
    const statements = provenance
      ? [mutationEventStatement(this.database, bookingId, "CANCEL", provenance, now), update, cleanup]
      : [update, cleanup];
    const results = await this.database.batch(statements);
    return results[provenance ? 1 : 0] as BookingUpdateResult;
  }

  async update(record: UpdateBookingRecord): Promise<BookingUpdateResult> {
    const before = await this.database.prepare("SELECT room_id,check_in,check_out,total_cents,pricing_version FROM bookings WHERE id=?1 AND status='CONFIRMED'")
      .bind(record.bookingId).first<{ room_id: string; check_in: string; check_out: string; total_cents: number; pricing_version: number }>();
    if (!before) return { meta: { changes: 0 } };
    const operationToken = `booking-edit:${crypto.randomUUID()}`;
    const results = await this.database.batch([
      this.database.prepare(`UPDATE bookings SET guest_id = ?2, room_id = ?3, check_in = ?4, check_out = ?5, total_cents = ?6, notes = ?7, updated_at = ?8,last_pricing_operation_token=?9
        WHERE id = ?1 AND status = 'CONFIRMED' AND room_id=?10 AND check_in=?11 AND check_out=?12 AND total_cents=?13 AND pricing_version=?14
        AND EXISTS (SELECT 1 FROM guests WHERE id = ?2)
        AND EXISTS (SELECT 1 FROM rooms AS r WHERE r.id = ?3 AND ${ADVANCE_RESERVABLE_ROOM_SQL})
        AND EXISTS (SELECT 1 FROM rooms r WHERE r.id=?3 AND r.price_cents=?15 AND r.pricing_version=?16)
        AND NOT EXISTS (SELECT 1 FROM room_holds WHERE room_id = ?3 AND start_date < ?5 AND end_date > ?4)`)
        .bind(record.bookingId, record.guestId, record.roomId, record.start, record.end, record.totalCents, record.notes, record.now,
          operationToken, before.room_id, before.check_in, before.check_out, before.total_cents, before.pricing_version,
          record.roomRateCents, record.roomPricingVersion),
      this.database.prepare(`INSERT INTO booking_pricing_segments
        (segment_id,booking_id,room_id,effective_start,effective_end,rate_cents,room_pricing_version,segment_version,operation_token,actor_subject,hotel_id,request_id,created_at)
        SELECT ?1,?2,?3,?4,?5,r.price_cents,r.pricing_version,?6,?7,?8,?9,?10,?11
        FROM rooms r JOIN bookings b ON b.room_id=r.id AND b.id=?2
        WHERE b.status='CONFIRMED' AND b.last_pricing_operation_token=?7 AND b.total_cents=?12 AND b.pricing_version=?13
          AND r.id=?3 AND r.price_cents=?14 AND r.pricing_version=?15`)
        .bind(`${record.bookingId}:${operationToken}`, record.bookingId, record.roomId, record.start, record.end,
          before.pricing_version + 1, operationToken, record.pricingProvenance.actorSubject, record.pricingProvenance.hotelId,
          record.pricingProvenance.requestId, record.now, record.totalCents, before.pricing_version,
          record.roomRateCents, record.roomPricingVersion),
      this.database.prepare(`DELETE FROM room_inventory_nights
        WHERE booking_id = ?1 AND EXISTS (
          SELECT 1 FROM bookings AS b WHERE b.id = ?1 AND b.room_id = ?6 AND b.check_in = ?7 AND b.check_out = ?8 AND b.status = 'CONFIRMED' AND b.last_pricing_operation_token=?5
        ) AND NOT EXISTS (
          SELECT 1 FROM room_holds AS h WHERE h.room_id = ?6 AND h.start_date < ?8 AND h.end_date > ?7
        )`).bind(record.bookingId, before.room_id, before.check_in, before.check_out, operationToken,
          record.roomId, record.start, record.end),
      ...claimStatements(this.database, record.bookingId, record.roomId, record.claimNights, record.start, record.end),
    ]);
    return results[0] as BookingUpdateResult;
  }
}
