import type { OperationalDatabase } from "../../routing";

export type ReservationCreationStage = "GUEST_CREATED" | "EXISTING_GUEST_SELECTED" | "BOOKING_CREATED";
export type ReservationGuestSource = "NEW" | "EXISTING";

export type ReservationCreationOperation = {
  operation_token: string;
  payload_hash: string;
  guest_id: string;
  booking_id: string;
  guest_source: ReservationGuestSource;
  stage: ReservationCreationStage;
  room_id: string;
  check_in: string;
  check_out: string;
  hotel_id: string;
  created_by_subject: string;
  created_request_id: string;
  created_at: string;
  guest_name: string;
};

export type ReservationCreationRecord = {
  operationToken: string;
  payloadHash: string;
  guestId: string;
  bookingId: string;
  guestSource: ReservationGuestSource;
  roomId: string;
  checkIn: string;
  checkOut: string;
  hotelId: string;
  actorSubject: string;
  requestId: string;
  now: string;
};

export class D1ReservationCreationRepository {
  public constructor(private readonly database: OperationalDatabase) {}

  find(operationToken: string): Promise<ReservationCreationOperation | null> {
    return this.database.prepare(`SELECT o.operation_token,o.payload_hash,o.guest_id,o.booking_id,
      o.guest_source,o.stage,o.room_id,o.check_in,o.check_out,o.hotel_id,o.created_by_subject,
      o.created_request_id,o.created_at,g.full_name AS guest_name
      FROM reservation_creation_operations o JOIN guests g ON g.id=o.guest_id
      WHERE o.operation_token=?1`).bind(operationToken).first<ReservationCreationOperation>();
  }

  async listIncomplete(): Promise<ReservationCreationOperation[]> {
    const result = await this.database.prepare(`SELECT o.operation_token,o.payload_hash,o.guest_id,o.booking_id,
      o.guest_source,o.stage,o.room_id,o.check_in,o.check_out,o.hotel_id,o.created_by_subject,
      o.created_request_id,o.created_at,g.full_name AS guest_name
      FROM reservation_creation_operations o JOIN guests g ON g.id=o.guest_id
      WHERE o.stage <> 'BOOKING_CREATED'
        AND NOT EXISTS (SELECT 1 FROM bookings recovered WHERE recovered.guest_id=o.guest_id
          AND recovered.id<>o.booking_id AND recovered.status='CONFIRMED')
      ORDER BY o.created_at DESC,o.operation_token`).all<ReservationCreationOperation>();
    return result.results;
  }

  emailExists(email: string): Promise<boolean> {
    return this.database.prepare("SELECT 1 AS found FROM guests WHERE email=?1 LIMIT 1")
      .bind(email).first<{ found: number }>().then(row => row != null);
  }

  async createNewGuest(record: ReservationCreationRecord, guest: { fullName: string; email: string; phone: string | null }): Promise<void> {
    await this.database.batch([
      this.database.prepare("INSERT INTO guests (id,full_name,email,phone,created_at) VALUES (?1,?2,?3,?4,?5)")
        .bind(record.guestId, guest.fullName, guest.email, guest.phone, record.now),
      this.database.prepare(`INSERT INTO reservation_creation_operations
        (operation_token,payload_hash,guest_id,booking_id,guest_source,stage,room_id,check_in,check_out,
         hotel_id,created_by_subject,created_request_id,created_at,updated_at)
        SELECT ?1,?2,g.id,?4,'NEW','GUEST_CREATED',?5,?6,?7,?8,?9,?10,?11,?11
        FROM guests g WHERE g.id=?3 AND g.email=?12`)
        .bind(record.operationToken, record.payloadHash, record.guestId, record.bookingId, record.roomId,
          record.checkIn, record.checkOut, record.hotelId, record.actorSubject, record.requestId, record.now, guest.email),
      this.database.prepare(`INSERT INTO reservation_creation_events
        (id,operation_token,event_type,guest_id,booking_id,actor_subject,hotel_id,request_id,created_at)
        SELECT ?1,o.operation_token,'GUEST_CREATED',o.guest_id,o.booking_id,?3,o.hotel_id,?4,?5
        FROM reservation_creation_operations o
        WHERE o.operation_token=?2 AND o.guest_source='NEW' AND o.stage='GUEST_CREATED'
          AND o.created_by_subject=?3 AND o.created_request_id=?4 AND o.created_at=?5`)
        .bind(`${record.operationToken}:GUEST_CREATED`, record.operationToken, record.actorSubject, record.requestId, record.now),
    ]);
  }

  async createExistingGuest(record: ReservationCreationRecord): Promise<boolean> {
    const result = await this.database.prepare(`INSERT INTO reservation_creation_operations
      (operation_token,payload_hash,guest_id,booking_id,guest_source,stage,room_id,check_in,check_out,
       hotel_id,created_by_subject,created_request_id,created_at,updated_at)
      SELECT ?1,?2,g.id,?4,'EXISTING','EXISTING_GUEST_SELECTED',?5,?6,?7,?8,?9,?10,?11,?11
      FROM guests g WHERE g.id=?3
      RETURNING operation_token`)
      .bind(record.operationToken, record.payloadHash, record.guestId, record.bookingId, record.roomId,
        record.checkIn, record.checkOut, record.hotelId, record.actorSubject, record.requestId, record.now).first<{ operation_token: string }>();
    return result?.operation_token === record.operationToken;
  }
}
