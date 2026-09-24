import type { OperationalDatabase } from "../../routing";
import { reconciliationAudit } from "./domain";
import type { BillingBooking, BillingInvoice, PriorPayment } from "./domain";
import type { BillingPaymentRepository, ExtraChargeWrite, PaymentWrite } from "./ports";

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

  async recordExtraCharge(write: ExtraChargeWrite, existingInvoice: BillingInvoice | null): Promise<boolean> {
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
    const results = await this.db.batch([
      this.db.prepare(`INSERT INTO extra_charges (id,booking_id,description,amount_cents,category,created_at)
        SELECT ?1,b.id,?3,?4,?5,?6
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
            now, write.expectedTotalCents, invoiceId, invoiceStatus, paidAmount,
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
            JSON.stringify({ amount_cents: write.amountCents, category: write.category }),
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
            JSON.stringify({ reason: "EXTRA_CHARGE", ...auditDetails }),
            now, businessEventId, nextTotal,
          ),
    ]);
    return results[0]?.meta.changes === 1
      && (results[1]?.meta.changes ?? 0) >= 1
      && results[2]?.meta.changes === 1
      && results[3]?.meta.changes === 1;
  }
}
