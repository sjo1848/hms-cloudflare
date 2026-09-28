import type { OperationalDatabase } from "../../routing";
import { claimDates, effectiveReassignmentDate, validHotelLocalDate, type CheckoutPolicy, type LifecycleActor, type LifecycleBooking } from "./domain";
import type { LifecycleMutationResult, LifecycleRepository } from "./ports";
import { ROOM_DIMENSION_SELECT, roomOperationalReadModel, type RoomDimensionRow } from "../room-state/read-model";

export class D1LifecycleRepository implements LifecycleRepository {
  public constructor(private readonly db: OperationalDatabase) {}

  findBooking(id: string): Promise<LifecycleBooking | null> {
    return this.db.prepare("SELECT id, room_id, check_in, check_out, status FROM bookings WHERE id = ?1").bind(id).first<LifecycleBooking>();
  }

  async checkIn(current: LifecycleBooking, guestCount: number, actor: LifecycleActor): Promise<LifecycleMutationResult> {
    const now = new Date().toISOString();
    const room = await this.db.prepare(`SELECT ${ROOM_DIMENSION_SELECT} FROM rooms AS r WHERE r.id=?1`).bind(current.room_id).first<RoomDimensionRow>();
    if (!room) return { ok: false };
    const roomState = roomOperationalReadModel(room);
    if (roomState.readiness.state !== "READY_FOR_ARRIVAL") return { ok: false };
    const roomStateVersionBefore = await this.db.prepare("SELECT room_state_version FROM rooms WHERE id=?1").bind(current.room_id).first<{ room_state_version: number }>();
    if (!roomStateVersionBefore) return { ok: false };
    const versionBefore = roomStateVersionBefore.room_state_version;
    const versionAfter = versionBefore + 1;
    const results = await this.db.batch([
      this.db.prepare("UPDATE bookings SET status = 'CHECKED_IN', check_in_guests_count = ?4, checked_in_at = ?2, checked_in_by = ?3, updated_at = ?2 WHERE id = ?1 AND status = 'CONFIRMED' AND NOT EXISTS (SELECT 1 FROM bookings active WHERE active.room_id=?5 AND active.status='CHECKED_IN') AND EXISTS (SELECT 1 FROM rooms WHERE id = ?5 AND room_state_version = ?6 AND housekeeping_state = 'READY' AND service_state = 'IN_SERVICE' AND NOT EXISTS (SELECT 1 FROM maintenance_cases WHERE room_id=?5 AND status='OPEN' AND impact='BLOCKING'))").bind(current.id, now, actor.subject, guestCount, current.room_id, versionBefore),
      this.db.prepare("UPDATE rooms SET status = 'OCCUPIED', room_state_version=?3 WHERE id = ?1 AND room_state_version=?4 AND room_state_version + 1=?3 AND EXISTS (SELECT 1 FROM bookings WHERE id = ?2 AND status = 'CHECKED_IN' AND room_id = ?1)").bind(current.room_id, current.id, versionAfter, versionBefore),
      this.db.prepare("INSERT INTO lifecycle_events (id, booking_id, event_type, from_room_id, actor_subject, request_id, hotel_id, details_json, created_at) VALUES (?1, ?2, 'CHECK_IN', ?3, ?4, ?5, ?6, ?7, ?8)").bind(crypto.randomUUID(), current.id, current.room_id, actor.subject, actor.requestId, actor.hotelId, JSON.stringify({ checklist: ["document_verified", "contact_confirmed", "stay_confirmed"], check_in_guests_count: guestCount, occupancy_before: "VACANT", occupancy_after: "OCCUPIED", housekeeping_state_before: roomState.housekeeping, housekeeping_state_after: roomState.housekeeping, maintenance_impact_before: roomState.maintenanceImpact, maintenance_impact_after: roomState.maintenanceImpact, service_state_before: roomState.serviceState, service_state_after: roomState.serviceState, room_state_version_before: versionBefore, room_state_version_after: versionAfter }), now),
    ]);
    return { ok: results[0]?.meta.changes === 1 && results[1]?.meta.changes === 1 && results[2]?.meta.changes === 1 };
  }

  async reassign(current: LifecycleBooking, destinationRoomId: string, reason: string, hotelLocalDate: string, actor: LifecycleActor): Promise<LifecycleMutationResult> {
    if (!validHotelLocalDate(hotelLocalDate)) return { ok: false };
    const snapshot = await this.db.prepare(`SELECT
        b.room_id, b.check_in, b.check_out, b.status, b.total_cents,
        COALESCE((SELECT json_extract(e.details_json,'$.effective_date') FROM lifecycle_events e
          WHERE e.booking_id=b.id AND e.event_type='REASSIGN'
            AND json_extract(e.details_json,'$.to_room_id')=b.room_id
          ORDER BY e.created_at DESC,e.rowid DESC LIMIT 1), b.check_in) AS assignment_start_date,
        old_room.status AS old_status, old_room.housekeeping_state AS old_housekeeping_state,
        old_room.service_state AS old_service_state, old_room.room_state_version AS old_room_version,
        (SELECT COUNT(*) FROM bookings active WHERE active.room_id=old_room.id AND active.status='CHECKED_IN') AS old_checked_in_count,
        (SELECT COUNT(*) FROM maintenance_cases mc WHERE mc.room_id=old_room.id AND mc.status='OPEN') AS old_open_maintenance_count,
        (SELECT COUNT(*) FROM maintenance_cases mc WHERE mc.room_id=old_room.id AND mc.status='OPEN' AND mc.impact='BLOCKING') AS old_blocking_count,
        (SELECT COUNT(*) FROM maintenance_cases mc WHERE mc.room_id=old_room.id AND mc.status='OPEN' AND mc.impact='NON_BLOCKING') AS old_non_blocking_count,
        destination.status AS destination_status, destination.housekeeping_state AS destination_housekeeping_state,
        destination.service_state AS destination_service_state, destination.room_state_version AS destination_room_version,
        (SELECT COUNT(*) FROM bookings active WHERE active.room_id=destination.id AND active.status='CHECKED_IN') AS destination_checked_in_count,
        (SELECT COUNT(*) FROM maintenance_cases mc WHERE mc.room_id=destination.id AND mc.status='OPEN') AS destination_open_maintenance_count,
        (SELECT COUNT(*) FROM maintenance_cases mc WHERE mc.room_id=destination.id AND mc.status='OPEN' AND mc.impact='BLOCKING') AS destination_blocking_count,
        (SELECT COUNT(*) FROM maintenance_cases mc WHERE mc.room_id=destination.id AND mc.status='OPEN' AND mc.impact='NON_BLOCKING') AS destination_non_blocking_count,
        (SELECT i.id FROM invoices i WHERE i.booking_id=b.id LIMIT 1) AS invoice_id,
        (SELECT i.status FROM invoices i WHERE i.booking_id=b.id LIMIT 1) AS invoice_status,
        (SELECT i.paid_amount_cents FROM invoices i WHERE i.booking_id=b.id LIMIT 1) AS paid_amount_cents,
        (SELECT COALESCE(SUM(p.amount_cents),0) FROM payment_entries p
          WHERE p.invoice_id=(SELECT i.id FROM invoices i WHERE i.booking_id=b.id LIMIT 1)) AS ledger_paid_cents,
        (SELECT COUNT(*) FROM room_inventory_nights n WHERE n.booking_id=b.id AND n.room_id=old_room.id
          AND n.stay_date >= COALESCE((SELECT json_extract(e.details_json,'$.effective_date') FROM lifecycle_events e
            WHERE e.booking_id=b.id AND e.event_type='REASSIGN' AND json_extract(e.details_json,'$.to_room_id')=b.room_id
            ORDER BY e.created_at DESC,e.rowid DESC LIMIT 1),b.check_in)
          AND n.stay_date < b.check_out) AS current_claim_count,
        (SELECT json_group_array(expected.stay_date) FROM (
          SELECT n.stay_date FROM room_inventory_nights n WHERE n.booking_id=b.id AND n.room_id=old_room.id
            AND n.stay_date >= COALESCE((SELECT json_extract(e.details_json,'$.effective_date') FROM lifecycle_events e
              WHERE e.booking_id=b.id AND e.event_type='REASSIGN' AND json_extract(e.details_json,'$.to_room_id')=b.room_id
              ORDER BY e.created_at DESC,e.rowid DESC LIMIT 1),b.check_in)
            AND n.stay_date < b.check_out ORDER BY n.stay_date
        ) expected) AS current_claim_dates,
        (SELECT COUNT(*) FROM room_inventory_nights n WHERE n.booking_id=b.id AND n.room_id<>old_room.id
          AND n.stay_date >= COALESCE((SELECT json_extract(e.details_json,'$.effective_date') FROM lifecycle_events e
            WHERE e.booking_id=b.id AND e.event_type='REASSIGN' AND json_extract(e.details_json,'$.to_room_id')=b.room_id
            ORDER BY e.created_at DESC,e.rowid DESC LIMIT 1),b.check_in)
          AND n.stay_date < b.check_out) AS stray_current_claim_count
      FROM bookings b
      JOIN rooms old_room ON old_room.id=b.room_id
      JOIN rooms destination ON destination.id=?2
      WHERE b.id=?1 AND b.status='CHECKED_IN'`)
      .bind(current.id, destinationRoomId).first<{
        room_id: string; check_in: string; check_out: string; status: string; total_cents: number;
        assignment_start_date: string; old_status: string; old_housekeeping_state: string | null;
        old_service_state: string | null; old_room_version: number; old_checked_in_count: number;
        old_open_maintenance_count: number; old_blocking_count: number; old_non_blocking_count: number;
        destination_status: string; destination_housekeeping_state: string | null; destination_service_state: string | null;
        destination_room_version: number; destination_checked_in_count: number;
        destination_open_maintenance_count: number; destination_blocking_count: number; destination_non_blocking_count: number;
        invoice_id: string | null; invoice_status: string | null; paid_amount_cents: number | null; ledger_paid_cents: number;
        current_claim_count: number; current_claim_dates: string; stray_current_claim_count: number;
      }>();
    if (!snapshot || snapshot.room_id !== current.room_id || snapshot.check_in !== current.check_in
      || snapshot.check_out !== current.check_out || snapshot.status !== current.status
      || snapshot.room_id === destinationRoomId || hotelLocalDate >= snapshot.check_out
      || reason.trim().length < 6) return { ok: false };
    const effectiveDate = effectiveReassignmentDate(snapshot.check_in, hotelLocalDate);
    const dates = claimDates(effectiveDate, snapshot.check_out);
    if (!dates.length || !validHotelLocalDate(snapshot.assignment_start_date)
      || snapshot.assignment_start_date < snapshot.check_in || snapshot.assignment_start_date >= snapshot.check_out) return { ok: false };
    const expectedCurrentClaimCount = claimDates(snapshot.assignment_start_date, snapshot.check_out).length;
    if (snapshot.current_claim_count !== expectedCurrentClaimCount || snapshot.stray_current_claim_count !== 0) return { ok: false };
    const expectedCurrentClaimDates = claimDates(snapshot.assignment_start_date, snapshot.check_out);
    let observedCurrentClaimDates: unknown;
    try { observedCurrentClaimDates = JSON.parse(snapshot.current_claim_dates); } catch { return { ok: false }; }
    if (!Array.isArray(observedCurrentClaimDates)
      || JSON.stringify(observedCurrentClaimDates) !== JSON.stringify(expectedCurrentClaimDates)) return { ok: false };
    const oldState = roomOperationalReadModel({
      legacy_room_status: snapshot.old_status,
      housekeeping_state: snapshot.old_housekeeping_state,
      service_state: snapshot.old_service_state,
      checked_in_booking_count: snapshot.old_checked_in_count,
      blocking_maintenance_count: snapshot.old_blocking_count,
      non_blocking_maintenance_count: snapshot.old_non_blocking_count,
      open_maintenance_count: snapshot.old_open_maintenance_count,
    });
    const destinationState = roomOperationalReadModel({
      legacy_room_status: snapshot.destination_status,
      housekeeping_state: snapshot.destination_housekeeping_state,
      service_state: snapshot.destination_service_state,
      checked_in_booking_count: snapshot.destination_checked_in_count,
      blocking_maintenance_count: snapshot.destination_blocking_count,
      non_blocking_maintenance_count: snapshot.destination_non_blocking_count,
      open_maintenance_count: snapshot.destination_open_maintenance_count,
    });
    if (oldState.occupancy !== "OCCUPIED" || oldState.maintenanceImpact === "UNRESOLVED"
      || destinationState.readiness.state !== "READY_FOR_ARRIVAL") return { ok: false };
    if (snapshot.invoice_status === "VOIDED" || (snapshot.invoice_id && snapshot.paid_amount_cents !== snapshot.ledger_paid_cents)) return { ok: false };
    const now = new Date().toISOString();
    const lifecycleEventId = crypto.randomUUID();
    const details = JSON.stringify({
      from_room_id: snapshot.room_id,
      to_room_id: destinationRoomId,
      operation_token: lifecycleEventId,
      hotel_local_date: hotelLocalDate,
      effective_date: effectiveDate,
      assignment_start_date: snapshot.assignment_start_date,
      expected_elapsed_claim_dates: claimDates(snapshot.assignment_start_date, effectiveDate),
      expected_remaining_claim_dates: dates,
      reason,
      old_total_cents: snapshot.total_cents,
      new_total_cents: snapshot.total_cents,
      old_occupancy_before: "OCCUPIED",
      old_occupancy_after: "VACANT",
      old_housekeeping_state_before: snapshot.old_housekeeping_state,
      old_housekeeping_state_after: "DIRTY",
      old_maintenance_impact_before: oldState.maintenanceImpact,
      old_maintenance_impact_after: oldState.maintenanceImpact,
      old_service_state_before: snapshot.old_service_state,
      old_service_state_after: snapshot.old_service_state,
      old_room_version_before: snapshot.old_room_version,
      old_room_version_after: snapshot.old_room_version + 1,
      new_occupancy_before: "VACANT",
      new_occupancy_after: "OCCUPIED",
      new_housekeeping_state_before: snapshot.destination_housekeeping_state,
      new_housekeeping_state_after: snapshot.destination_housekeeping_state,
      new_maintenance_impact_before: destinationState.maintenanceImpact,
      new_maintenance_impact_after: destinationState.maintenanceImpact,
      new_service_state_before: snapshot.destination_service_state,
      new_service_state_after: snapshot.destination_service_state,
      new_room_version_before: snapshot.destination_room_version,
      new_room_version_after: snapshot.destination_room_version + 1,
    });
    try {
      const results = await this.db.batch([
        this.db.prepare(`UPDATE bookings SET room_id=?2,updated_at=?3,last_reassignment_token=?13
          WHERE id=?1 AND status='CHECKED_IN' AND room_id=?4 AND check_in=?5 AND check_out=?6 AND total_cents=?7
            AND check_out>?8
            AND EXISTS (SELECT 1 FROM rooms old_room WHERE old_room.id=?4 AND old_room.status='OCCUPIED' AND old_room.room_state_version=?9)
            AND EXISTS (SELECT 1 FROM rooms destination WHERE destination.id=?2 AND destination.status='AVAILABLE'
              AND destination.housekeeping_state='READY' AND destination.service_state='IN_SERVICE'
              AND destination.room_state_version=?10
              AND (SELECT COUNT(*) FROM bookings active WHERE active.room_id=destination.id AND active.status='CHECKED_IN')=0
              AND NOT EXISTS (SELECT 1 FROM maintenance_cases mc WHERE mc.room_id=destination.id AND mc.status='OPEN' AND mc.impact='BLOCKING'))
            AND COALESCE((SELECT json_extract(e.details_json,'$.effective_date') FROM lifecycle_events e
              WHERE e.booking_id=?1 AND e.event_type='REASSIGN' AND json_extract(e.details_json,'$.to_room_id')=?4
              ORDER BY e.created_at DESC,e.rowid DESC LIMIT 1),?5)=?11
            AND (SELECT COUNT(*) FROM room_inventory_nights n WHERE n.booking_id=?1 AND n.room_id=?4
              AND n.stay_date>=?11 AND n.stay_date<?6)=CAST(julianday(?6)-julianday(?11) AS INTEGER)
            AND NOT EXISTS (SELECT 1 FROM room_inventory_nights n WHERE n.booking_id=?1 AND n.room_id=?4
              AND n.stay_date>=?11 AND n.stay_date<?6
              AND NOT EXISTS (SELECT 1 FROM json_each(?14) expected WHERE expected.value=n.stay_date))
            AND NOT EXISTS (SELECT 1 FROM json_each(?14) expected WHERE NOT EXISTS (
              SELECT 1 FROM room_inventory_nights n WHERE n.booking_id=?1 AND n.room_id=?4 AND n.stay_date=expected.value))
            AND NOT EXISTS (SELECT 1 FROM room_inventory_nights n WHERE n.booking_id=?1 AND n.room_id<>?4
              AND n.stay_date>=?11 AND n.stay_date<?6)
            AND NOT EXISTS (SELECT 1 FROM room_holds h WHERE h.room_id=?2 AND h.start_date<?6 AND h.end_date>?12)
            AND NOT EXISTS (SELECT 1 FROM room_inventory_nights n WHERE n.room_id=?2 AND n.stay_date>=?12 AND n.stay_date<?6)
            AND NOT EXISTS (SELECT 1 FROM invoices i WHERE i.booking_id=?1 AND
              (i.status='VOIDED' OR i.paid_amount_cents<>(SELECT COALESCE(SUM(p.amount_cents),0) FROM payment_entries p WHERE p.invoice_id=i.id)))`)
          .bind(current.id, destinationRoomId, now, snapshot.room_id, snapshot.check_in, snapshot.check_out, snapshot.total_cents, hotelLocalDate,
            snapshot.old_room_version, snapshot.destination_room_version, snapshot.assignment_start_date, effectiveDate, lifecycleEventId,
            JSON.stringify(expectedCurrentClaimDates)),
        this.db.prepare(`DELETE FROM room_inventory_nights WHERE booking_id=?1 AND room_id=?2 AND stay_date>=?3 AND stay_date<?4
          AND EXISTS (SELECT 1 FROM bookings WHERE id=?1 AND status='CHECKED_IN' AND room_id=?5)
          AND EXISTS (SELECT 1 FROM rooms WHERE id=?2 AND room_state_version=?6)`)
          .bind(current.id, snapshot.room_id, effectiveDate, snapshot.check_out, destinationRoomId, snapshot.old_room_version),
        ...dates.map(date => this.db.prepare(`INSERT INTO room_inventory_nights (room_id,stay_date,booking_id)
          SELECT ?1,?2,?3 WHERE EXISTS (SELECT 1 FROM bookings WHERE id=?3 AND status='CHECKED_IN' AND room_id=?1)
          AND EXISTS (SELECT 1 FROM rooms WHERE id=?1 AND status='AVAILABLE' AND room_state_version=?4)`)
          .bind(destinationRoomId, date, current.id, snapshot.destination_room_version)),
        this.db.prepare(`UPDATE rooms SET status=CASE
            WHEN EXISTS (SELECT 1 FROM maintenance_cases mc WHERE mc.room_id=?1 AND mc.status='OPEN' AND mc.impact='BLOCKING') THEN 'MAINTENANCE'
            WHEN service_state='OUT_OF_ORDER' THEN 'OUT_OF_ORDER' ELSE 'DIRTY' END,
            housekeeping_state='DIRTY',room_state_version=?3
          WHERE id=?1 AND status='OCCUPIED' AND room_state_version=?4
            AND housekeeping_state IS ?5 AND service_state IS ?6
            AND EXISTS (SELECT 1 FROM bookings WHERE id=?2 AND status='CHECKED_IN' AND room_id=?7)
            AND (SELECT COUNT(*) FROM bookings active WHERE active.room_id=?1 AND active.status='CHECKED_IN')=0
            AND room_state_version+1=?3`)
          .bind(snapshot.room_id, current.id, snapshot.old_room_version + 1, snapshot.old_room_version,
            snapshot.old_housekeeping_state, snapshot.old_service_state, destinationRoomId),
        this.db.prepare(`UPDATE rooms SET status='OCCUPIED',room_state_version=?3
          WHERE id=?1 AND status='AVAILABLE' AND room_state_version=?4
            AND housekeeping_state='READY' AND service_state='IN_SERVICE'
            AND EXISTS (SELECT 1 FROM bookings WHERE id=?2 AND status='CHECKED_IN' AND room_id=?1)
            AND (SELECT COUNT(*) FROM bookings active WHERE active.room_id=?1 AND active.status='CHECKED_IN')=1
            AND NOT EXISTS (SELECT 1 FROM maintenance_cases mc WHERE mc.room_id=?1 AND mc.status='OPEN' AND mc.impact='BLOCKING')
            AND room_state_version+1=?3`)
          .bind(destinationRoomId, current.id, snapshot.destination_room_version + 1, snapshot.destination_room_version),
        this.db.prepare(`INSERT INTO lifecycle_events
          (id,booking_id,event_type,from_room_id,actor_subject,request_id,hotel_id,details_json,created_at)
          VALUES (?1,?2,'REASSIGN',?3,?4,?5,?6,?7,?8)`)
          .bind(lifecycleEventId, current.id, snapshot.room_id, actor.subject, actor.requestId, actor.hotelId, details, now),
      ]);
      if (results.at(-1)?.meta.changes !== 1) return { ok: false };
    } catch {
      return { ok: false };
    }
    return {
      ok: true,
      reassignment: {
        oldRoomId: snapshot.room_id,
        newRoomId: destinationRoomId,
        hotelLocalDate,
        effectiveDate,
        remainingInterval: { startDate: effectiveDate, endDateExclusive: snapshot.check_out },
        oldRoomStatus: oldState.maintenanceImpact === "BLOCKING" ? "MAINTENANCE" : oldState.serviceState === "OUT_OF_ORDER" ? "OUT_OF_ORDER" : "DIRTY",
        totalCents: snapshot.total_cents,
      },
    };
  }

  async checkout(current: LifecycleBooking, policy: CheckoutPolicy, reference: string | null, actor: LifecycleActor): Promise<LifecycleMutationResult> {
    const now = new Date().toISOString();
    const snapshot = await this.db.prepare(`SELECT r.room_state_version, r.housekeeping_state, r.service_state,
        EXISTS (SELECT 1 FROM maintenance_cases mc WHERE mc.room_id=r.id AND mc.status='OPEN' AND mc.impact='BLOCKING') AS blocking,
        (SELECT COUNT(*) FROM maintenance_cases mc WHERE mc.room_id=r.id AND mc.status='OPEN') AS maintenance_open_case_count,
        (SELECT COUNT(*) FROM bookings active WHERE active.room_id=r.id AND active.status='CHECKED_IN') AS checked_in_count
      FROM rooms r WHERE r.id=?1 AND r.status='OCCUPIED'`).bind(current.room_id).first<{ room_state_version: number; housekeeping_state: string | null; service_state: string | null; blocking: number; maintenance_open_case_count: number; checked_in_count: number }>();
    if (!snapshot || snapshot.checked_in_count !== 1) return { ok: false };
    const versionBefore = snapshot.room_state_version;
    const versionAfter = versionBefore + 1;
    const legacyStatus = snapshot.service_state === "OUT_OF_ORDER" ? "OUT_OF_ORDER" : snapshot.blocking ? "MAINTENANCE" : "DIRTY";
    const results = await this.db.batch([
      this.db.prepare("UPDATE bookings SET status = 'CHECKED_OUT', check_out_payment_policy = ?4, check_out_reference = ?5, checked_out_at = ?2, checked_out_by = ?3, updated_at = ?2 WHERE id = ?1 AND status = 'CHECKED_IN' AND room_id = ?6 AND EXISTS (SELECT 1 FROM rooms WHERE id = ?6 AND status = 'OCCUPIED' AND room_state_version=?7)").bind(current.id, now, actor.subject, policy, reference, current.room_id, versionBefore),
      this.db.prepare("DELETE FROM room_inventory_nights WHERE booking_id = ?1 AND EXISTS (SELECT 1 FROM bookings WHERE id = ?1 AND status = 'CHECKED_OUT' AND room_id = ?2)").bind(current.id, current.room_id),
      this.db.prepare("UPDATE rooms SET status=?2, housekeeping_state='DIRTY', room_state_version=?3 WHERE id=?1 AND status='OCCUPIED' AND room_state_version=?4 AND housekeeping_state IS ?6 AND service_state IS ?7 AND EXISTS (SELECT 1 FROM bookings WHERE id=?5 AND status='CHECKED_OUT' AND room_id=?1)").bind(current.room_id, legacyStatus, versionAfter, versionBefore, current.id, snapshot.housekeeping_state, snapshot.service_state),
      this.db.prepare("INSERT OR IGNORE INTO invoices (id, booking_id, amount_cents, created_at) SELECT ?1, id, total_cents, ?2 FROM bookings WHERE id = ?3 AND status = 'CHECKED_OUT'").bind(crypto.randomUUID(), now, current.id),
      this.db.prepare("INSERT INTO lifecycle_events (id, booking_id, event_type, from_room_id, actor_subject, request_id, hotel_id, details_json, created_at) VALUES (?1, ?2, 'CHECK_OUT', ?3, ?4, ?5, ?6, ?7, ?8)").bind(crypto.randomUUID(), current.id, current.room_id, actor.subject, actor.requestId, actor.hotelId, JSON.stringify({ handoff: "housekeeping", check_out_payment_policy: policy, check_out_reference: reference, charge_reviewed: true, release_confirmed: true, occupancy_before: "OCCUPIED", occupancy_after: "VACANT", housekeeping_state_before: snapshot.housekeeping_state, housekeeping_state_after: "DIRTY", room_state_version_before: versionBefore, room_state_version_after: versionAfter, service_state_before: snapshot.service_state, service_state_after: snapshot.service_state, maintenance_open_case_count_before: snapshot.maintenance_open_case_count, maintenance_open_case_count_after: snapshot.maintenance_open_case_count }), now),
    ]);
    return { ok: results[0]?.meta.changes === 1 && results[2]?.meta.changes === 1 && results[4]?.meta.changes === 1 };
  }
}
