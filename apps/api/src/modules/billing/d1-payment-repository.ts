import type { OperationalDatabase } from "../../routing";
import { extraChargeOperationMatches, reconciliationAudit } from "./domain";
import type { BillingBooking, BillingInvoice, PriorPayment } from "./domain";
import type { BillingPaymentRepository, ExtraChargeWrite, PaymentWrite } from "./ports";

export class ExtraChargeIntegrityError extends Error {}

export class D1PaymentRepository implements BillingPaymentRepository {
  public constructor(private readonly db: OperationalDatabase) {}

  findBooking(id: string): Promise<BillingBooking | null> {
    return this.db.prepare("SELECT id, total_cents FROM bookings WHERE id = ?1").bind(id).first<BillingBooking>();
  }

  findInvoice(bookingId: string): Promise<BillingInvoice | null> {
    return this.db.prepare(`SELECT
      i.id, i.amount_cents, i.paid_amount_cents, i.status, i.paid_at,
      (SELECT COALESCE(SUM(p.amount_cents),0) FROM payment_entries p WHERE p.invoice_id=i.id) AS ledger_paid_cents
      FROM invoices i WHERE i.booking_id = ?1`).bind(bookingId).first<BillingInvoice>();
  }

  findPriorPayment(operationToken: string): Promise<PriorPayment | null> {
    return this.db.prepare("SELECT booking_id, amount_cents, payment_method, payment_reference, note FROM payment_entries WHERE operation_token = ?1").bind(operationToken).first<PriorPayment>();
  }

  async findExtraChargeOperation(bookingId: string, operationToken: string, expectedHotelId?: string) {
    const charge = await this.db.prepare(`SELECT id,booking_id,description,amount_cents,category,created_at,operation_token
      FROM extra_charges WHERE booking_id=?1 AND operation_token=?2`).bind(bookingId, operationToken).first<{
        id: string; booking_id: string; description: string; amount_cents: number; category: string; created_at: string; operation_token: string;
      }>();
    if (!charge) return null;

    const events = await this.db.prepare(`SELECT id,event_type,booking_id,actor_subject,request_id,hotel_id,details_json
      FROM financial_events
      WHERE booking_id=?1 AND json_extract(details_json,'$.operation_token')=?2
      ORDER BY event_type,id`).bind(bookingId, operationToken).all<{
      id: string; event_type: string; booking_id: string; actor_subject: string; request_id: string; hotel_id: string; details_json: string;
      }>();
    const businessEvent = events.results.find(event => event.event_type === "EXTRA_CHARGE");
    const reconciliationEvent = events.results.find(event => event.event_type === "PRICE_RECONCILIATION");
    let businessDetails: Record<string, unknown> | null = null;
    let reconciliationDetails: Record<string, unknown> | null = null;
    try {
      businessDetails = businessEvent ? JSON.parse(businessEvent.details_json) as Record<string, unknown> : null;
      reconciliationDetails = reconciliationEvent ? JSON.parse(reconciliationEvent.details_json) as Record<string, unknown> : null;
    } catch {
      throw new ExtraChargeIntegrityError("Extra charge operation event details are invalid");
    }
    const sameProvenance = events.results.length === 2
      && events.results.every(event => event.booking_id === bookingId
        && event.actor_subject === businessEvent?.actor_subject
        && event.request_id === businessEvent?.request_id
        && event.hotel_id === businessEvent?.hotel_id
        && (!expectedHotelId || event.hotel_id === expectedHotelId));
    if (!sameProvenance || !businessEvent || !reconciliationEvent
      || businessDetails?.charge_id !== charge.id
      || businessDetails.amount_cents !== charge.amount_cents
      || businessDetails.category !== charge.category
      || reconciliationDetails?.charge_id !== charge.id
      || reconciliationDetails.reason !== "EXTRA_CHARGE"
      || reconciliationDetails.cause_event_id !== businessEvent.id) {
      throw new ExtraChargeIntegrityError("Extra charge operation event pair is incomplete or inconsistent");
    }
    return charge;
  }

  invoiceView(bookingId: string): Promise<unknown> {
    return this.db.prepare(`SELECT
      i.id, i.booking_id, i.amount_cents, i.paid_amount_cents,
      MAX(i.amount_cents-i.paid_amount_cents,0) AS remaining_cents,
      MAX(i.paid_amount_cents-i.amount_cents,0) AS credit_cents,
      i.status, i.payment_method, i.payment_reference, i.paid_at, i.created_at
      FROM invoices i WHERE i.booking_id = ?1`).bind(bookingId).first();
  }

  async recordPayment(write: PaymentWrite, existingInvoice: BillingInvoice | null): Promise<boolean> {
    const now = new Date().toISOString();
    const invoiceId = existingInvoice?.id ?? crypto.randomUUID();
    const results = await this.db.batch([
      this.db.prepare("INSERT INTO invoices (id,booking_id,amount_cents,created_at) SELECT ?1,?2,total_cents,?4 FROM bookings WHERE id=?2 AND NOT EXISTS (SELECT 1 FROM invoices WHERE booking_id=?2) AND total_cents>=?3").bind(invoiceId, write.bookingId, write.amountCents, now),
      this.db.prepare(`INSERT INTO payment_entries
        (id,invoice_id,booking_id,amount_cents,payment_method,payment_reference,note,received_by_user_id,received_at,operation_token)
        SELECT ?1,i.id,?2,?3,?4,?5,?6,?7,?8,?9
        FROM invoices i
        WHERE i.booking_id=?2
          AND i.status='PENDING'
          AND i.paid_amount_cents=(SELECT COALESCE(SUM(p.amount_cents),0) FROM payment_entries p WHERE p.invoice_id=i.id)
          AND i.amount_cents-i.paid_amount_cents>=?3`).bind(
            crypto.randomUUID(), write.bookingId, write.amountCents, write.paymentMethod,
            write.reference, write.note, write.actor.subject, now, write.operationToken,
          ),
      this.db.prepare(`UPDATE invoices
        SET paid_amount_cents=(SELECT COALESCE(SUM(p.amount_cents),0) FROM payment_entries p WHERE p.invoice_id=invoices.id),
            status=CASE
              WHEN (SELECT COALESCE(SUM(p.amount_cents),0) FROM payment_entries p WHERE p.invoice_id=invoices.id)>=amount_cents THEN 'PAID'
              ELSE 'PENDING'
            END,
            payment_method=?3,
            payment_reference=?4,
            paid_at=CASE
              WHEN (SELECT COALESCE(SUM(p.amount_cents),0) FROM payment_entries p WHERE p.invoice_id=invoices.id)>=amount_cents THEN ?5
              ELSE NULL
            END
        WHERE booking_id=?1 AND status='PENDING' AND changes()=1`).bind(
          write.bookingId, write.amountCents, write.paymentMethod, write.reference, now,
        ),
      this.db.prepare("INSERT INTO financial_events (id,event_type,booking_id,actor_subject,request_id,hotel_id,details_json,created_at) SELECT ?1,?2,?3,?4,?5,?6,?7,?8 WHERE changes()=1").bind(
        crypto.randomUUID(), write.settle ? "SETTLE_PAYMENT" : "PAYMENT", write.bookingId,
        write.actor.subject, write.actor.requestId, write.actor.hotelId,
        JSON.stringify({ amount_cents: write.amountCents, payment_method: write.paymentMethod, payment_reference: write.reference }),
        now,
      ),
    ]);
    return results[1]?.meta.changes === 1 && results[2]?.meta.changes === 1;
  }

  async recordExtraCharge(write: ExtraChargeWrite, existingInvoice: BillingInvoice | null) {
    const prior = await this.findExtraChargeOperation(write.bookingId, write.operationToken);
    if (prior) {
      if (!extraChargeOperationMatches(prior, write.bookingId, write.description, write.amountCents, write.category)) {
        throw new Error("Extra charge operation token was reused with different details");
      }
      return { charge: prior, replayed: true };
    }

    const now = new Date().toISOString();
    const nextTotal = write.expectedTotalCents + write.amountCents;
    const invoiceId = existingInvoice?.id ?? null;
    const invoiceStatus = existingInvoice?.status ?? null;
    const paidAmount = existingInvoice?.paid_amount_cents ?? 0;
    const chargeId = crypto.randomUUID();
    const businessEventId = crypto.randomUUID();
    const reconciliationEventId = crypto.randomUUID();
    const auditDetails = reconciliationAudit(
      write.expectedTotalCents,
      nextTotal,
      paidAmount,
      existingInvoice?.status ?? null,
      existingInvoice?.paid_at ?? null,
      now,
    );
    let results: Awaited<ReturnType<OperationalDatabase["batch"]>>;
    try {
      results = await this.db.batch([
      this.db.prepare(`INSERT INTO extra_charges (id,booking_id,description,amount_cents,category,created_at,operation_token)
        SELECT ?1,b.id,?3,?4,?5,?6,?11
        FROM bookings b
        WHERE b.id=?2
          AND b.total_cents=?7
          AND (
            (?8 IS NULL AND NOT EXISTS (SELECT 1 FROM invoices i WHERE i.booking_id=b.id))
            OR EXISTS (
              SELECT 1 FROM invoices i
              WHERE i.booking_id=b.id
                AND i.id=?8
                AND i.status=?9
                AND i.status<>'VOIDED'
                AND i.paid_amount_cents=?10
                AND i.paid_amount_cents=(SELECT COALESCE(SUM(p.amount_cents),0) FROM payment_entries p WHERE p.invoice_id=i.id)
            )
          )`).bind(
            chargeId, write.bookingId, write.description, write.amountCents, write.category,
            now, write.expectedTotalCents, invoiceId, invoiceStatus, paidAmount, write.operationToken,
          ),
      this.db.prepare(`UPDATE bookings
        SET total_cents=total_cents+?2, updated_at=?3
        WHERE id=?1 AND total_cents=?4
          AND EXISTS (SELECT 1 FROM extra_charges WHERE id=?5 AND booking_id=?1)`).bind(
            write.bookingId, write.amountCents, now, write.expectedTotalCents, chargeId,
          ),
      this.db.prepare(`INSERT INTO financial_events
        (id,event_type,booking_id,actor_subject,request_id,hotel_id,details_json,created_at)
        VALUES (?1,'EXTRA_CHARGE',?2,
          CASE
            WHEN EXISTS (SELECT 1 FROM extra_charges WHERE id=?8 AND booking_id=?2)
              AND EXISTS (SELECT 1 FROM bookings WHERE id=?2 AND total_cents=?9)
            THEN ?3 ELSE NULL
          END,
          ?4,?5,?6,?7)`).bind(
            businessEventId, write.bookingId, write.forceAuditFailure ? null : write.actor.subject,
            write.actor.requestId, write.actor.hotelId,
            JSON.stringify({ charge_id: chargeId, operation_token: write.operationToken, amount_cents: write.amountCents, category: write.category }),
            now, chargeId, nextTotal,
          ),
      this.db.prepare(`INSERT INTO financial_events
        (id,event_type,booking_id,actor_subject,request_id,hotel_id,details_json,created_at)
        VALUES (?1,'PRICE_RECONCILIATION',?2,
          CASE
            WHEN EXISTS (SELECT 1 FROM financial_events WHERE id=?8 AND booking_id=?2)
              AND EXISTS (SELECT 1 FROM bookings WHERE id=?2 AND total_cents=?9)
            THEN ?3 ELSE NULL
          END,
          ?4,?5,?6,?7)`).bind(
            reconciliationEventId, write.bookingId, write.actor.subject, write.actor.requestId, write.actor.hotelId,
            JSON.stringify({ reason: "EXTRA_CHARGE", cause_event_id: businessEventId, charge_id: chargeId, operation_token: write.operationToken, ...auditDetails }),
            now, businessEventId, nextTotal,
          ),
      ]);
    } catch (error) {
      const winner = await this.findExtraChargeOperation(write.bookingId, write.operationToken);
      if (winner && extraChargeOperationMatches(winner, write.bookingId, write.description, write.amountCents, write.category)) {
        return { charge: winner, replayed: true };
      }
      if (winner) throw new Error("Extra charge operation token was reused with different details");
      throw error;
    }

    // D1 meta.changes is observational only here: the booking UPDATE also fires
    // D11's invoice trigger, so its count is not a direct-row winner proof.
    if (results.length !== 4 || results.some(result => !result.success)) throw new Error("Extra charge batch did not complete");
    const committed = await this.findExtraChargeOperation(write.bookingId, write.operationToken);
    if (!committed || committed.id !== chargeId || !extraChargeOperationMatches(committed, write.bookingId, write.description, write.amountCents, write.category)) {
      throw new Error("Extra charge durable operation identity did not match the request");
    }
    const verified = await this.findExtraChargeOperation(write.bookingId, write.operationToken, write.actor.hotelId);
    if (!verified || verified.id !== chargeId) throw new ExtraChargeIntegrityError("Extra charge event pair did not match the committed operation");
    const businessEvent = await this.db.prepare(`SELECT actor_subject,request_id,hotel_id FROM financial_events
      WHERE booking_id=?1 AND event_type='EXTRA_CHARGE' AND json_extract(details_json,'$.operation_token')=?2`)
      .bind(write.bookingId, write.operationToken).first<{ actor_subject: string; request_id: string; hotel_id: string }>();
    if (!businessEvent || businessEvent.actor_subject !== write.actor.subject || businessEvent.request_id !== write.actor.requestId || businessEvent.hotel_id !== write.actor.hotelId) {
      throw new ExtraChargeIntegrityError("Extra charge event provenance did not match the committed operation");
    }
    return { charge: committed, replayed: false, statementChanges: results.map(result => result.meta.changes ?? 0) };
  }
}
