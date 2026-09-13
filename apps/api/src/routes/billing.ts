import { Hono } from "hono";
import type { Context } from "hono";
import type { ApiVariables } from "../context";
import { ApiError } from "../errors";
import { jsonBody, requiredText } from "../validation";
import { hasCapability } from "../auth/capabilities";

type BillingApp = Hono<{ Bindings: Env; Variables: ApiVariables }>;
type Db = ApiVariables["operationalDatabase"];
type Ctx = Context<{ Bindings: Env; Variables: ApiVariables }>;
type Body = Record<string, unknown>;

function requireCap(c: Ctx, capability: string) {
  const role = c.get("membership").role;
  if (!hasCapability(role, capability)) throw ApiError.forbidden();
}

function cents(value: unknown, field: string, positive = false): number {
  if (!Number.isSafeInteger(value) || (positive ? (value as number) <= 0 : (value as number) < 0)) throw ApiError.badRequest(`${field} must be an integer number of cents`);
  return value as number;
}

function paymentMethod(value: unknown): string {
  const result = requiredText(value, "payment_method", 4, 8).toUpperCase();
  if (!["CASH", "CARD", "TRANSFER"].includes(result)) throw ApiError.badRequest("payment_method is invalid");
  return result;
}

async function bookingExists(db: Db, id: string) {
  return db.prepare("SELECT id, total_cents FROM bookings WHERE id = ?1").bind(id).first<{ id: string; total_cents: number }>();
}

async function invoiceView(db: Db, bookingId: string) {
  return db.prepare("SELECT id, booking_id, amount_cents, paid_amount_cents, status, payment_method, payment_reference, paid_at, created_at FROM invoices WHERE booking_id = ?1").bind(bookingId).first();
}

async function shiftOpening(db: Db): Promise<string> {
  const last = await db.prepare("SELECT closing_time FROM cash_closures ORDER BY closing_time DESC LIMIT 1").first<{ closing_time: string }>();
  if (last?.closing_time) return last.closing_time;
  const first = await db.prepare("SELECT MIN(received_at) received_at FROM payment_entries").first<{ received_at: string | null }>();
  return first?.received_at ?? new Date().toISOString();
}

async function shiftSnapshot(db: Db, opening: string) {
  return db.prepare("SELECT COALESCE(SUM(amount_cents),0) total_amount_cents, COALESCE(SUM(CASE WHEN payment_method='CASH' THEN amount_cents ELSE 0 END),0) cash_amount_cents, COALESCE(SUM(CASE WHEN payment_method<>'CASH' THEN amount_cents ELSE 0 END),0) non_cash_amount_cents, COUNT(*) payment_count FROM payment_entries WHERE received_at >= ?1").bind(opening).first<{ total_amount_cents: number; cash_amount_cents: number; non_cash_amount_cents: number; payment_count: number }>();
}

async function recordPayment(c: Ctx, id: string, body: Body, settle: boolean) {
  requireCap(c, "bookings.update");
  const db = c.get("operationalDatabase");
  const booking = await bookingExists(db, id);
  if (!booking) throw ApiError.notFound("Booking not found");
  const amount = settle ? undefined : cents(body.amount_cents, "amount_cents", true);
  const pm = paymentMethod(body.payment_method);
  const reference = body.payment_reference == null ? null : requiredText(body.payment_reference, "payment_reference", 1, 120);
  const note = body.note == null ? null : requiredText(body.note, "note", 1, 250);
  const now = new Date().toISOString();
  const invoiceId = crypto.randomUUID();
  const invoice = await db.prepare("SELECT id, amount_cents, paid_amount_cents FROM invoices WHERE booking_id = ?1").bind(id).first<{ id: string; amount_cents: number; paid_amount_cents: number }>();
  const target = amount ?? (invoice ? invoice.amount_cents - invoice.paid_amount_cents : booking.total_cents);
  if (!Number.isSafeInteger(target) || target <= 0) throw ApiError.conflict("Booking is already settled");
  try {
    const results = await db.batch([
      db.prepare("INSERT INTO invoices (id,booking_id,amount_cents,created_at) SELECT ?1,?2,total_cents,?4 FROM bookings WHERE id=?2 AND NOT EXISTS (SELECT 1 FROM invoices WHERE booking_id=?2) AND total_cents>=?3").bind(invoice?.id ?? invoiceId, id, target, now),
      db.prepare("INSERT INTO payment_entries (id,invoice_id,booking_id,amount_cents,payment_method,payment_reference,note,received_by_user_id,received_at) SELECT ?1,id,?2,?3,?4,?5,?6,?7,?8 FROM invoices WHERE booking_id=?2 AND status='PENDING' AND paid_amount_cents + ?3 <= amount_cents").bind(crypto.randomUUID(), id, target, pm, reference, note, c.get("identity").subject, now),
      db.prepare("UPDATE invoices SET paid_amount_cents=paid_amount_cents+?2, status=CASE WHEN paid_amount_cents+?2=amount_cents THEN 'PAID' ELSE 'PENDING' END, payment_method=?3, payment_reference=?4, paid_at=CASE WHEN paid_amount_cents+?2=amount_cents THEN ?5 ELSE paid_at END WHERE booking_id=?1 AND status='PENDING' AND paid_amount_cents+?2<=amount_cents AND changes()=1").bind(id, target, pm, reference, now),
      db.prepare("INSERT INTO financial_events (id,event_type,booking_id,actor_subject,request_id,hotel_id,details_json,created_at) SELECT ?1,?2,?3,?4,?5,?6,?7,?8 WHERE changes()=1").bind(crypto.randomUUID(), settle ? "SETTLE_PAYMENT" : "PAYMENT", id, c.get("identity").subject, c.get("requestId"), c.get("membership").hotelId, JSON.stringify({ amount_cents: target, payment_method: pm, payment_reference: reference }), now),
    ]);
    if (results[1]?.meta.changes !== 1 || results[2]?.meta.changes !== 1) throw new Error("payment did not win");
  } catch {
    throw ApiError.conflict("Payment exceeds the remaining balance or booking changed");
  }
  return { ok: true, amount_cents: target, invoice: await invoiceView(db, id) };
}

export function createBillingRoutes(): BillingApp {
  const app = new Hono<{ Bindings: Env; Variables: ApiVariables }>();
  app.get("/bookings/:id/extra-charges", async c => { requireCap(c, "bookings.extra_charges.read"); const rows = await c.get("operationalDatabase").prepare("SELECT id, booking_id, description, amount_cents, category, created_at FROM extra_charges WHERE booking_id = ?1 ORDER BY created_at, id").bind(c.req.param("id")).all(); return c.json(rows.results); });
  app.post("/bookings/:id/extra-charges", async c => {
    requireCap(c, "bookings.extra_charges.write"); const id = c.req.param("id"); const db = c.get("operationalDatabase"); if (!await bookingExists(db, id)) throw ApiError.notFound("Booking not found");
    const body = await jsonBody<Body>(c.req.raw); const description = requiredText(body.description, "description", 1, 200); const amount = cents(body.amount_cents, "amount_cents", true); const category = body.category == null ? "OTHER" : requiredText(body.category, "category", 1, 40).toUpperCase(); const now = new Date().toISOString();
    const audit = String(c.env.LOCAL_DEV_AUTH) === "true" && c.req.header("x-test-fail-financial-write") === "extra-charge"
      ? db.prepare("INSERT INTO financial_events (id,event_type,booking_id,actor_subject,request_id,hotel_id,details_json,created_at) VALUES (?1,'EXTRA_CHARGE',?2,NULL,?3,?4,?5,?6)").bind(crypto.randomUUID(), id, c.get("requestId"), c.get("membership").hotelId, JSON.stringify({ amount_cents: amount, category }), now)
      : db.prepare("INSERT INTO financial_events (id,event_type,booking_id,actor_subject,request_id,hotel_id,details_json,created_at) VALUES (?1,'EXTRA_CHARGE',?2,?3,?4,?5,?6,?7)").bind(crypto.randomUUID(), id, c.get("identity").subject, c.get("requestId"), c.get("membership").hotelId, JSON.stringify({ amount_cents: amount, category }), now);
    try { await db.batch([db.prepare("INSERT INTO extra_charges (id,booking_id,description,amount_cents,category,created_at) VALUES (?1,?2,?3,?4,?5,?6)").bind(crypto.randomUUID(), id, description, amount, category, now), audit]); } catch { throw ApiError.conflict("Extra charge could not be recorded atomically"); }
    return c.json({ ok: true, amount_cents: amount }, 201);
  });
  app.get("/bookings/:id/invoice", async c => { requireCap(c, "billing.invoice.read"); const db = c.get("operationalDatabase"); if (!await bookingExists(db, c.req.param("id"))) throw ApiError.notFound("Booking not found"); return c.json(await invoiceView(db, c.req.param("id"))); });
  app.get("/invoices", async c => { requireCap(c, "billing.invoices.read"); const rows = await c.get("operationalDatabase").prepare("SELECT id, booking_id, amount_cents, paid_amount_cents, status, payment_method, payment_reference, paid_at, created_at FROM invoices ORDER BY created_at DESC").all(); return c.json(rows.results); });
  app.get("/bookings/:id/payments", async c => { requireCap(c, "billing.invoice.read"); const rows = await c.get("operationalDatabase").prepare("SELECT id, invoice_id, booking_id, amount_cents, payment_method, payment_reference, note, received_by_user_id, received_at FROM payment_entries WHERE booking_id = ?1 ORDER BY received_at DESC, id DESC").bind(c.req.param("id")).all(); return c.json(rows.results); });
  app.post("/bookings/:id/payments", async c => c.json(await recordPayment(c, c.req.param("id"), await jsonBody<Body>(c.req.raw), false)));
  app.post("/bookings/:id/settle-payment", async c => c.json(await recordPayment(c, c.req.param("id"), await jsonBody<Body>(c.req.raw), true)));
  app.get("/billing/balance", async c => { requireCap(c, "billing.balance.read"); const db = c.get("operationalDatabase"); const opening = await shiftOpening(db); const row = await shiftSnapshot(db, opening); const pending = await db.prepare("SELECT COALESCE(SUM(amount_cents-paid_amount_cents),0) pending_amount_cents, COUNT(*) pending_bookings_count FROM invoices WHERE status='PENDING'").first(); return c.json({ ...row, card_amount_cents: row?.non_cash_amount_cents ?? 0, ...pending, opening_time: opening }); });
  app.get("/billing/closures", async c => { requireCap(c, "billing.balance.read"); const rows = await c.get("operationalDatabase").prepare("SELECT id, actor_subject, total_amount_cents, cash_amount_cents, card_amount_cents, payment_count, counted_cash_amount_cents, cash_difference_cents, opening_time, closing_time, handoff_to, notes FROM cash_closures ORDER BY closing_time DESC").all(); return c.json(rows.results); });
  app.post("/billing/close-cash", async c => {
    requireCap(c, "billing.close_cash.write"); const body = await jsonBody<Body>(c.req.raw); const expectedCash = cents(body.expected_cash_amount_cents, "expected_cash_amount_cents"); const expectedTotal = cents(body.expected_total_amount_cents, "expected_total_amount_cents"); const expectedNonCash = cents(body.expected_non_cash_amount_cents, "expected_non_cash_amount_cents"); const expectedCount = cents(body.expected_payment_count, "expected_payment_count"); const counted = cents(body.counted_cash_amount_cents ?? expectedCash, "counted_cash_amount_cents"); const handoff = requiredText(body.handoff_to, "handoff_to", 1, 120); const notes = body.notes == null ? null : requiredText(body.notes, "notes", 1, 250); const db = c.get("operationalDatabase"); const opening = await shiftOpening(db); const closing = new Date().toISOString(); const operationToken = crypto.randomUUID();
    try {
      await db.batch([db.prepare("INSERT INTO cash_closures (id,actor_subject,total_amount_cents,cash_amount_cents,card_amount_cents,payment_count,counted_cash_amount_cents,cash_difference_cents,opening_time,closing_time,handoff_to,notes,request_id,hotel_id,operation_token) SELECT ?1,?2,?3,?4,?5,?6,?7,?7-?4,?8,?9,?10,?11,?12,?13,?14 FROM (SELECT COALESCE(SUM(amount_cents),0) total,COALESCE(SUM(CASE WHEN payment_method='CASH' THEN amount_cents ELSE 0 END),0) cash,COALESCE(SUM(CASE WHEN payment_method<>'CASH' THEN amount_cents ELSE 0 END),0) non_cash,COUNT(*) count FROM payment_entries WHERE received_at >= ?8) s WHERE s.total=?15 AND s.cash=?16 AND s.non_cash=?17 AND s.count=?18 AND NOT EXISTS (SELECT 1 FROM cash_closures WHERE opening_time=?8)").bind(crypto.randomUUID(), c.get("identity").subject, expectedTotal, expectedCash, expectedNonCash, expectedCount, counted, opening, closing, handoff, notes, c.get("requestId"), c.get("membership").hotelId, operationToken, expectedTotal, expectedCash, expectedNonCash, expectedCount)]);
      const winner = await db.prepare("SELECT id FROM cash_closures WHERE operation_token = ?1 AND opening_time = ?2").bind(operationToken, opening).first();
      if (!winner) throw new Error("this request did not win");
    } catch {
      throw ApiError.conflict("Cash shift balance changed or was already closed");
    }
    return c.json({ ok: true, total_amount_cents: expectedTotal, cash_amount_cents: expectedCash, card_amount_cents: expectedNonCash, payment_count: expectedCount, counted_cash_amount_cents: counted, cash_difference_cents: counted - expectedCash, opening_time: opening, closing_time: closing, handoff_to: handoff, notes });
  });
  return app;
}
