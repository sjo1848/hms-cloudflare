import type { OperationalDatabase } from "../../routing";
import type { BillingBooking, BillingInvoice, PriorPayment } from "./domain";
import type { BillingPaymentRepository, PaymentWrite } from "./ports";

export class D1PaymentRepository implements BillingPaymentRepository {
  public constructor(private readonly db: OperationalDatabase) {}

  findBooking(id: string): Promise<BillingBooking | null> {
    return this.db.prepare("SELECT id, total_cents FROM bookings WHERE id = ?1").bind(id).first<BillingBooking>();
  }

  findInvoice(bookingId: string): Promise<BillingInvoice | null> {
    return this.db.prepare("SELECT id, amount_cents, paid_amount_cents FROM invoices WHERE booking_id = ?1").bind(bookingId).first<BillingInvoice>();
  }

  findPriorPayment(operationToken: string): Promise<PriorPayment | null> {
    return this.db.prepare("SELECT booking_id, amount_cents, payment_method, payment_reference, note FROM payment_entries WHERE operation_token = ?1").bind(operationToken).first<PriorPayment>();
  }

  invoiceView(bookingId: string): Promise<unknown> {
    return this.db.prepare("SELECT id, booking_id, amount_cents, paid_amount_cents, status, payment_method, payment_reference, paid_at, created_at FROM invoices WHERE booking_id = ?1").bind(bookingId).first();
  }

  async recordPayment(write: PaymentWrite, existingInvoice: BillingInvoice | null): Promise<boolean> {
    const now = new Date().toISOString();
    const invoiceId = existingInvoice?.id ?? crypto.randomUUID();
    const results = await this.db.batch([
      this.db.prepare("INSERT INTO invoices (id,booking_id,amount_cents,created_at) SELECT ?1,?2,total_cents,?4 FROM bookings WHERE id=?2 AND NOT EXISTS (SELECT 1 FROM invoices WHERE booking_id=?2) AND total_cents>=?3").bind(invoiceId, write.bookingId, write.amountCents, now),
      this.db.prepare("INSERT INTO payment_entries (id,invoice_id,booking_id,amount_cents,payment_method,payment_reference,note,received_by_user_id,received_at,operation_token) SELECT ?1,id,?2,?3,?4,?5,?6,?7,?8,?9 FROM invoices WHERE booking_id=?2 AND status='PENDING' AND paid_amount_cents + ?3 <= amount_cents").bind(crypto.randomUUID(), write.bookingId, write.amountCents, write.paymentMethod, write.reference, write.note, write.actor.subject, now, write.operationToken),
      this.db.prepare("UPDATE invoices SET paid_amount_cents=paid_amount_cents+?2, status=CASE WHEN paid_amount_cents+?2=amount_cents THEN 'PAID' ELSE 'PENDING' END, payment_method=?3, payment_reference=?4, paid_at=CASE WHEN paid_amount_cents+?2=amount_cents THEN ?5 ELSE paid_at END WHERE booking_id=?1 AND status='PENDING' AND paid_amount_cents+?2<=amount_cents AND changes()=1").bind(write.bookingId, write.amountCents, write.paymentMethod, write.reference, now),
      this.db.prepare("INSERT INTO financial_events (id,event_type,booking_id,actor_subject,request_id,hotel_id,details_json,created_at) SELECT ?1,?2,?3,?4,?5,?6,?7,?8 WHERE changes()=1").bind(crypto.randomUUID(), write.settle ? "SETTLE_PAYMENT" : "PAYMENT", write.bookingId, write.actor.subject, write.actor.requestId, write.actor.hotelId, JSON.stringify({ amount_cents: write.amountCents, payment_method: write.paymentMethod, payment_reference: write.reference }), now),
    ]);
    return results[1]?.meta.changes === 1 && results[2]?.meta.changes === 1;
  }
}
