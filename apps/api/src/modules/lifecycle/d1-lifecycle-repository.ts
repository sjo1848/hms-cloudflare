import type { OperationalDatabase } from "../../routing";
import { claimDates, effectiveReassignmentDate, type CheckoutPolicy, type LifecycleActor, type LifecycleBooking } from "./domain";
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

  async reassign(current: LifecycleBooking, destinationRoomId: string, reason: string, hotelLocalDate: string, actor: LifecycleActor): Promise<LifecycleMutationResult> {
    const snapshot = await this.db.prepare(`SELECT
        b.room_id, b.check_in, b.check_out, b.status, b.total_cents,
        destination.price_cents AS destination_price_cents,
        COALESCE((SELECT SUM(x.amount_cents) FROM extra_charges x WHERE x.booking_id=b.id), 0) AS extra_cents,
        i.id AS invoice_id, i.status AS invoice_status, i.paid_amount_cents,
        (SELECT COALESCE(SUM(p.amount_cents), 0) FROM payment_entries p WHERE p.invoice_id=i.id) AS ledger_paid_cents
      FROM bookings b
      JOIN rooms old_room ON old_room.id=b.room_id
      JOIN rooms destination ON destination.id=?2
      LEFT JOIN invoices i ON i.booking_id=b.id
      WHERE b.id=?1
        AND b.status='CHECKED_IN'
        AND old_room.status='OCCUPIED'
        AND destination.status='AVAILABLE'
        AND NOT EXISTS (SELECT 1 FROM maintenance_cases mc WHERE mc.room_id=destination.id AND mc.status='OPEN' AND mc.impact='BLOCKING')`)
      .bind(current.id, destinationRoomId).first<{
        room_id: string; check_in: string; check_out: string; status: string; total_cents: number;
        destination_price_cents: number; extra_cents: number; invoice_id: string | null;
        invoice_status: string | null; paid_amount_cents: number | null; ledger_paid_cents: number;
      }>();
    if (!snapshot || snapshot.room_id === destinationRoomId || hotelLocalDate >= snapshot.check_out) return { ok: false };
    const effectiveDate = effectiveReassignmentDate(snapshot.check_in, hotelLocalDate);
    const dates = claimDates(effectiveDate, snapshot.check_out);
    if (dates.length === 0) return { ok: false };
    const nextTotal = snapshot.destination_price_cents * claimDates(snapshot.check_in, snapshot.check_out).length + snapshot.extra_cents;
    if (!Number.isSafeInteger(nextTotal) || nextTotal < 0) return { ok: false };
    if (snapshot.invoice_status === "VOIDED" || (snapshot.invoice_id && snapshot.paid_amount_cents !== snapshot.ledger_paid_cents)) return { ok: false };
    const now = new Date().toISOString();
    const lifecycleEventId = crypto.randomUUID();
    const financialEventId = crypto.randomUUID();
    const details = JSON.stringify({
      from_room_id: snapshot.room_id,
      to_room_id: destinationRoomId,
      effective_date: effectiveDate,
      reason,
      old_total_cents: snapshot.total_cents,
      new_total_cents: nextTotal,
    });
    try {
      await this.db.batch([
        this.db.prepare(`UPDATE bookings SET room_id=?2, total_cents=?3, updated_at=?4
          WHERE id=?1 AND status='CHECKED_IN' AND room_id=?5 AND check_out>?6 AND total_cents=?7
            AND EXISTS (SELECT 1 FROM rooms old_room WHERE old_room.id=?5 AND old_room.status='OCCUPIED')
            AND EXISTS (SELECT 1 FROM rooms destination WHERE destination.id=?2 AND destination.status='AVAILABLE' AND destination.price_cents=?8)
            AND NOT EXISTS (SELECT 1 FROM maintenance_cases mc WHERE mc.room_id=?2 AND mc.status='OPEN' AND mc.impact='BLOCKING')
            AND NOT EXISTS (SELECT 1 FROM room_holds h WHERE h.room_id=?2 AND h.start_date<?10 AND h.end_date>?9)
            AND NOT EXISTS (SELECT 1 FROM room_inventory_nights n WHERE n.room_id=?2 AND n.stay_date>=?9 AND n.stay_date<?10)
            AND NOT EXISTS (SELECT 1 FROM invoices i WHERE i.booking_id=?1 AND (i.status='VOIDED' OR i.paid_amount_cents<>(SELECT COALESCE(SUM(p.amount_cents),0) FROM payment_entries p WHERE p.invoice_id=i.id)))`)
          .bind(current.id, destinationRoomId, nextTotal, now, snapshot.room_id, hotelLocalDate, snapshot.total_cents, snapshot.destination_price_cents, effectiveDate, snapshot.check_out),
        this.db.prepare("DELETE FROM room_inventory_nights WHERE booking_id=?1 AND room_id=?2 AND stay_date>=?3 AND stay_date<?4 AND EXISTS (SELECT 1 FROM bookings WHERE id=?1 AND status='CHECKED_IN' AND room_id=?5)")
          .bind(current.id, snapshot.room_id, effectiveDate, snapshot.check_out, destinationRoomId),
        ...dates.map(date => this.db.prepare("INSERT INTO room_inventory_nights (room_id, stay_date, booking_id) SELECT ?1,?2,?3 WHERE EXISTS (SELECT 1 FROM bookings WHERE id=?3 AND status='CHECKED_IN' AND room_id=?1)").bind(destinationRoomId, date, current.id)),
        this.db.prepare("UPDATE rooms SET status=CASE WHEN EXISTS (SELECT 1 FROM maintenance_cases mc WHERE mc.room_id=?1 AND mc.status='OPEN' AND mc.impact='BLOCKING') THEN 'MAINTENANCE' ELSE 'DIRTY' END WHERE id=?1 AND status='OCCUPIED' AND EXISTS (SELECT 1 FROM bookings WHERE id=?2 AND status='CHECKED_IN' AND room_id=?3)").bind(snapshot.room_id, current.id, destinationRoomId),
        this.db.prepare("UPDATE rooms SET status='OCCUPIED' WHERE id=?1 AND status='AVAILABLE' AND EXISTS (SELECT 1 FROM bookings WHERE id=?2 AND status='CHECKED_IN' AND room_id=?1)").bind(destinationRoomId, current.id),
        this.db.prepare("INSERT INTO financial_events (id,event_type,booking_id,actor_subject,request_id,hotel_id,details_json,created_at) SELECT ?1,'PRICE_RECONCILIATION',?2,?3,?4,?5,?6,?7 WHERE ?8<>?9 AND EXISTS (SELECT 1 FROM bookings WHERE id=?2 AND total_cents=?8) AND EXISTS (SELECT 1 FROM invoices WHERE booking_id=?2 AND status<>'VOIDED')").bind(financialEventId, current.id, actor.subject, actor.requestId, actor.hotelId, details, now, nextTotal, snapshot.total_cents),
        this.db.prepare("INSERT INTO lifecycle_events (id,booking_id,event_type,from_room_id,actor_subject,request_id,hotel_id,details_json,created_at) VALUES (?1,?2,'REASSIGN',?3,?4,?5,?6,?7,?8)").bind(lifecycleEventId, current.id, snapshot.room_id, actor.subject, actor.requestId, actor.hotelId, details, now),
      ]);
    } catch {
      return { ok: false };
    }
    const final = await this.db.prepare(`SELECT
        (SELECT room_id FROM bookings WHERE id=?1 AND status='CHECKED_IN') AS room_id,
        (SELECT total_cents FROM bookings WHERE id=?1) AS total_cents,
        (SELECT status FROM rooms WHERE id=?2) AS old_status,
        (SELECT status FROM rooms WHERE id=?3) AS destination_status,
        (SELECT COUNT(*) FROM room_inventory_nights WHERE booking_id=?1 AND room_id=?2 AND stay_date>=?4) AS old_remaining,
        (SELECT COUNT(*) FROM room_inventory_nights WHERE booking_id=?1 AND room_id=?3 AND stay_date>=?4 AND stay_date<?5) AS destination_remaining,
        (SELECT COUNT(*) FROM lifecycle_events WHERE id=?6 AND booking_id=?1 AND event_type='REASSIGN') AS lifecycle_events,
        (SELECT COUNT(*) FROM financial_events WHERE id=?7 AND booking_id=?1 AND event_type='PRICE_RECONCILIATION') AS financial_events`)
      .bind(current.id, snapshot.room_id, destinationRoomId, effectiveDate, snapshot.check_out, lifecycleEventId, financialEventId).first<{
        room_id: string; total_cents: number; old_status: string; destination_status: string;
        old_remaining: number; destination_remaining: number; lifecycle_events: number; financial_events: number;
      }>();
    const expectedOldStatus = await this.db.prepare("SELECT CASE WHEN EXISTS (SELECT 1 FROM maintenance_cases WHERE room_id=?1 AND status='OPEN' AND impact='BLOCKING') THEN 'MAINTENANCE' ELSE 'DIRTY' END AS status").bind(snapshot.room_id).first<{ status: string }>();
    const ok = Boolean(final
      && final.room_id === destinationRoomId
      && final.total_cents === nextTotal
      && final.old_status === expectedOldStatus?.status
      && final.destination_status === "OCCUPIED"
      && final.old_remaining === 0
      && final.destination_remaining === dates.length
      && final.lifecycle_events === 1
      && final.financial_events === (nextTotal !== snapshot.total_cents ? 1 : 0));
    return {
      ok,
      ...(ok ? {
        reassignment: {
          oldRoomId: snapshot.room_id,
          newRoomId: destinationRoomId,
          effectiveDate,
          oldRoomStatus: final!.old_status,
          destinationPriceCents: snapshot.destination_price_cents,
          totalCents: nextTotal,
        },
      } : {}),
    };
  }

  async checkout(current: LifecycleBooking, policy: CheckoutPolicy, reference: string | null, actor: LifecycleActor): Promise<LifecycleMutationResult> {
    const now = new Date().toISOString();
    const results = await this.db.batch([
      this.db.prepare("UPDATE bookings SET status = 'CHECKED_OUT', check_out_payment_policy = ?4, check_out_reference = ?5, checked_out_at = ?2, checked_out_by = ?3, updated_at = ?2 WHERE id = ?1 AND status = 'CHECKED_IN' AND room_id = ?6 AND EXISTS (SELECT 1 FROM rooms WHERE id = ?6 AND status = 'OCCUPIED')").bind(current.id, now, actor.subject, policy, reference, current.room_id),
      this.db.prepare("DELETE FROM room_inventory_nights WHERE booking_id = ?1 AND EXISTS (SELECT 1 FROM bookings WHERE id = ?1 AND status = 'CHECKED_OUT' AND room_id = ?2)").bind(current.id, current.room_id),
      this.db.prepare("UPDATE rooms SET status = 'DIRTY' WHERE id = ?1 AND status = 'OCCUPIED' AND EXISTS (SELECT 1 FROM bookings WHERE id = ?2 AND status = 'CHECKED_OUT' AND room_id = ?1)").bind(current.room_id, current.id),
      this.db.prepare("INSERT OR IGNORE INTO invoices (id, booking_id, amount_cents, created_at) SELECT ?1, id, total_cents, ?2 FROM bookings WHERE id = ?3 AND status = 'CHECKED_OUT'").bind(crypto.randomUUID(), now, current.id),
      this.db.prepare("INSERT INTO lifecycle_events (id, booking_id, event_type, from_room_id, actor_subject, request_id, hotel_id, details_json, created_at) SELECT ?1, ?2, 'CHECK_OUT', ?3, ?4, ?5, ?6, ?7, ?8 WHERE EXISTS (SELECT 1 FROM bookings WHERE id = ?2 AND status = 'CHECKED_OUT' AND room_id = ?3) AND EXISTS (SELECT 1 FROM rooms WHERE id = ?3 AND status = 'DIRTY')").bind(crypto.randomUUID(), current.id, current.room_id, actor.subject, actor.requestId, actor.hotelId, JSON.stringify({ handoff: "housekeeping", check_out_payment_policy: policy, check_out_reference: reference, charge_reviewed: true, release_confirmed: true }), now),
    ]);
    return { ok: results[0]?.meta.changes === 1 && results[2]?.meta.changes === 1 && results[4]?.meta.changes === 1 };
  }
}
