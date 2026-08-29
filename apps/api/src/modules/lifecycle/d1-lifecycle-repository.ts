import type { OperationalDatabase } from "../../routing";
import { claimDates, type CheckoutPolicy, type LifecycleActor, type LifecycleBooking } from "./domain";
import type { LifecycleMutationResult, LifecycleRepository } from "./ports";

export class D1LifecycleRepository implements LifecycleRepository {
  public constructor(private readonly db: OperationalDatabase) {}

  findBooking(id: string): Promise<LifecycleBooking | null> {
    return this.db.prepare("SELECT id, room_id, check_in, check_out, status FROM bookings WHERE id = ?1").bind(id).first<LifecycleBooking>();
  }

  async checkIn(current: LifecycleBooking, guestCount: number, actor: LifecycleActor): Promise<LifecycleMutationResult> {
    const now = new Date().toISOString();
    const results = await this.db.batch([
      this.db.prepare("UPDATE bookings SET status = 'CHECKED_IN', check_in_guests_count = ?4, checked_in_at = ?2, checked_in_by = ?3, updated_at = ?2 WHERE id = ?1 AND status = 'CONFIRMED' AND EXISTS (SELECT 1 FROM rooms WHERE id = ?5 AND status = 'AVAILABLE')").bind(current.id, now, actor.subject, guestCount, current.room_id),
      this.db.prepare("UPDATE rooms SET status = 'OCCUPIED' WHERE id = ?1 AND status = 'AVAILABLE' AND EXISTS (SELECT 1 FROM bookings WHERE id = ?2 AND status = 'CHECKED_IN' AND room_id = ?1)").bind(current.room_id, current.id),
      this.db.prepare("INSERT INTO lifecycle_events (id, booking_id, event_type, from_room_id, actor_subject, request_id, hotel_id, details_json, created_at) SELECT ?1, ?2, 'CHECK_IN', ?3, ?4, ?5, ?6, ?7, ?8 WHERE EXISTS (SELECT 1 FROM bookings WHERE id = ?2 AND status = 'CHECKED_IN' AND room_id = ?3)").bind(crypto.randomUUID(), current.id, current.room_id, actor.subject, actor.requestId, actor.hotelId, JSON.stringify({ checklist: ["document_verified", "contact_confirmed", "stay_confirmed"], check_in_guests_count: guestCount }), now),
    ]);
    return { ok: results[0]?.meta.changes === 1 && results[1]?.meta.changes === 1 && results[2]?.meta.changes === 1 };
  }

  async reassign(current: LifecycleBooking, destinationRoomId: string, actor: LifecycleActor): Promise<LifecycleMutationResult> {
    const target = await this.db.prepare(`SELECT r.id FROM rooms AS r
      WHERE r.id = ?1 AND r.status = 'AVAILABLE'
      AND NOT EXISTS (SELECT 1 FROM room_holds h WHERE h.room_id = r.id AND h.start_date < ?3 AND h.end_date > ?2)
      AND NOT EXISTS (SELECT 1 FROM room_inventory_nights n WHERE n.room_id = r.id AND n.stay_date >= ?2 AND n.stay_date < ?3)`)
      .bind(destinationRoomId, current.check_in, current.check_out).first<{ id: string }>();
    if (!target) return { ok: false };
    const dates = claimDates(current.check_in, current.check_out);
    const now = new Date().toISOString();
    const results = await this.db.batch([
      this.db.prepare("UPDATE bookings SET room_id = ?2, updated_at = ?3 WHERE id = ?1 AND status = 'CHECKED_IN' AND room_id = ?4").bind(current.id, destinationRoomId, now, current.room_id),
      this.db.prepare("DELETE FROM room_inventory_nights WHERE booking_id = ?1 AND EXISTS (SELECT 1 FROM bookings WHERE id = ?1 AND status = 'CHECKED_IN' AND room_id = ?2)").bind(current.id, destinationRoomId),
      ...dates.map(date => this.db.prepare("INSERT INTO room_inventory_nights (room_id, stay_date, booking_id) SELECT ?1, ?2, ?3 WHERE EXISTS (SELECT 1 FROM bookings WHERE id = ?3 AND status = 'CHECKED_IN' AND room_id = ?1)").bind(destinationRoomId, date, current.id)),
      this.db.prepare("UPDATE rooms SET status = 'AVAILABLE' WHERE id = ?1 AND status = 'OCCUPIED' AND EXISTS (SELECT 1 FROM bookings WHERE id = ?2 AND status = 'CHECKED_IN' AND room_id = ?3)").bind(current.room_id, current.id, destinationRoomId),
      this.db.prepare("UPDATE rooms SET status = 'OCCUPIED' WHERE id = ?1 AND status = 'AVAILABLE' AND EXISTS (SELECT 1 FROM bookings WHERE id = ?2 AND status = 'CHECKED_IN' AND room_id = ?1)").bind(destinationRoomId, current.id),
      this.db.prepare("INSERT INTO lifecycle_events (id, booking_id, event_type, from_room_id, actor_subject, request_id, hotel_id, details_json, created_at) VALUES (?1, ?2, 'REASSIGN', ?3, ?4, ?5, ?6, ?7, ?8)").bind(crypto.randomUUID(), current.id, current.room_id, actor.subject, actor.requestId, actor.hotelId, JSON.stringify({ from_room_id: current.room_id, to_room_id: destinationRoomId }), now),
    ]);
    const first = results[0]?.meta.changes === 1;
    const oldReleased = results[2 + dates.length]?.meta.changes === 1;
    const newOccupied = results[3 + dates.length]?.meta.changes === 1;
    const eventWritten = results[4 + dates.length]?.meta.changes === 1;
    return { ok: first && oldReleased && newOccupied && eventWritten };
  }

  async checkout(current: LifecycleBooking, policy: CheckoutPolicy, reference: string | null, actor: LifecycleActor): Promise<LifecycleMutationResult> {
    const now = new Date().toISOString();
    const results = await this.db.batch([
      this.db.prepare("UPDATE bookings SET status = 'CHECKED_OUT', check_out_payment_policy = ?4, check_out_reference = ?5, checked_out_at = ?2, checked_out_by = ?3, updated_at = ?2 WHERE id = ?1 AND status = 'CHECKED_IN'").bind(current.id, now, actor.subject, policy, reference),
      this.db.prepare("DELETE FROM room_inventory_nights WHERE booking_id = ?1 AND EXISTS (SELECT 1 FROM bookings WHERE id = ?1 AND status = 'CHECKED_OUT' AND room_id = ?2)").bind(current.id, current.room_id),
      this.db.prepare("UPDATE rooms SET status = 'DIRTY' WHERE id = ?1 AND status = 'OCCUPIED' AND EXISTS (SELECT 1 FROM bookings WHERE id = ?2 AND status = 'CHECKED_OUT' AND room_id = ?1)").bind(current.room_id, current.id),
      this.db.prepare("INSERT OR IGNORE INTO invoices (id, booking_id, amount_cents, created_at) SELECT ?1, id, total_cents, ?2 FROM bookings WHERE id = ?3 AND status = 'CHECKED_OUT'").bind(crypto.randomUUID(), now, current.id),
      this.db.prepare("INSERT INTO lifecycle_events (id, booking_id, event_type, from_room_id, actor_subject, request_id, hotel_id, details_json, created_at) VALUES (?1, ?2, 'CHECK_OUT', ?3, ?4, ?5, ?6, ?7, ?8)").bind(crypto.randomUUID(), current.id, current.room_id, actor.subject, actor.requestId, actor.hotelId, JSON.stringify({ handoff: "housekeeping", check_out_payment_policy: policy, check_out_reference: reference, charge_reviewed: true, release_confirmed: true }), now),
    ]);
    return { ok: results[0]?.meta.changes === 1 && results[2]?.meta.changes === 1 && results[4]?.meta.changes === 1 };
  }
}
