import { afterEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { convertV4MiniflareOptions, Miniflare } from "miniflare";
import { D1PaymentRepository } from "./d1-payment-repository";
import type { OperationalDatabase } from "../../routing";

const activeMiniflares: Miniflare[] = [];
afterEach(async () => { await Promise.all(activeMiniflares.splice(0).map(mf => mf.dispose())); });

async function database() {
  const mf = new Miniflare(convertV4MiniflareOptions({
    script: "export default { fetch() { return new Response('ok') } }",
    modules: true,
    d1Databases: { DB: "billing-d11-proof" },
  }));
  activeMiniflares.push(mf);
  const db = await mf.getD1Database("DB");

  await db.batch([
    db.prepare("CREATE TABLE bookings (id TEXT PRIMARY KEY,total_cents INTEGER NOT NULL,updated_at TEXT NOT NULL)"),
    db.prepare("CREATE TABLE invoices (id TEXT PRIMARY KEY,booking_id TEXT NOT NULL UNIQUE,amount_cents INTEGER NOT NULL CHECK(amount_cents>=0),paid_amount_cents INTEGER NOT NULL DEFAULT 0 CHECK(paid_amount_cents>=0 AND paid_amount_cents<=amount_cents),status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','PAID','VOIDED')),payment_method TEXT NOT NULL DEFAULT 'CASH' CHECK(payment_method IN ('CASH','CARD','TRANSFER')),payment_reference TEXT,paid_at TEXT,created_at TEXT NOT NULL)"),
    db.prepare("CREATE INDEX idx_invoices_status ON invoices(status,created_at)"),
    db.prepare("CREATE TABLE payment_entries (id TEXT PRIMARY KEY,invoice_id TEXT NOT NULL,booking_id TEXT NOT NULL,amount_cents INTEGER NOT NULL CHECK(amount_cents>0),payment_method TEXT NOT NULL,payment_reference TEXT,note TEXT,received_by_user_id TEXT NOT NULL,received_at TEXT NOT NULL,operation_token TEXT)"),
    db.prepare("CREATE TABLE extra_charges (id TEXT PRIMARY KEY,booking_id TEXT NOT NULL,description TEXT NOT NULL,amount_cents INTEGER NOT NULL CHECK(amount_cents>0),category TEXT NOT NULL DEFAULT 'OTHER',created_at TEXT NOT NULL)"),
    db.prepare("CREATE TABLE financial_events (id TEXT PRIMARY KEY,event_type TEXT NOT NULL,booking_id TEXT,actor_subject TEXT NOT NULL,request_id TEXT NOT NULL,hotel_id TEXT NOT NULL,details_json TEXT NOT NULL,created_at TEXT NOT NULL)"),
    db.prepare("CREATE TRIGGER trg_extra_charge_total AFTER INSERT ON extra_charges BEGIN UPDATE bookings SET total_cents=total_cents+NEW.amount_cents,updated_at=NEW.created_at WHERE id=NEW.booking_id; UPDATE invoices SET amount_cents=amount_cents+NEW.amount_cents WHERE booking_id=NEW.booking_id AND status='PENDING'; END"),
  ]);

  await db.batch([
    db.prepare("INSERT INTO bookings VALUES ('main',10000,'2026-09-19T10:00:00.000Z')"),
    db.prepare("INSERT INTO invoices VALUES ('i-main','main',10000,6000,'PENDING','CARD','ref-original',NULL,'2026-09-01T00:00:00.000Z')"),
    db.prepare("INSERT INTO payment_entries VALUES ('p-main','i-main','main',6000,'CARD','ref-original',NULL,'actor','2026-09-10T00:00:00.000Z','op-main')"),

    db.prepare("INSERT INTO bookings VALUES ('mismatch',10000,'2026-09-19T10:00:00.000Z')"),
    db.prepare("INSERT INTO invoices VALUES ('i-mismatch','mismatch',10000,5000,'PENDING','CASH',NULL,NULL,'2026-09-01T00:00:00.000Z')"),
    db.prepare("INSERT INTO payment_entries VALUES ('p-mismatch','i-mismatch','mismatch',4000,'CASH',NULL,NULL,'actor','2026-09-10T00:00:00.000Z','op-mismatch')"),

    db.prepare("INSERT INTO bookings VALUES ('voided',10000,'2026-09-19T10:00:00.000Z')"),
    db.prepare("INSERT INTO invoices VALUES ('i-voided','voided',10000,0,'VOIDED','CASH',NULL,NULL,'2026-09-01T00:00:00.000Z')"),

    db.prepare("INSERT INTO bookings VALUES ('extra',10000,'2026-09-19T10:00:00.000Z')"),
    db.prepare("INSERT INTO invoices VALUES ('i-extra','extra',10000,5000,'PENDING','TRANSFER','transfer-ref',NULL,'2026-09-01T00:00:00.000Z')"),
    db.prepare("INSERT INTO payment_entries VALUES ('p-extra','i-extra','extra',5000,'TRANSFER','transfer-ref',NULL,'actor','2026-09-10T00:00:00.000Z','op-extra')"),
  ]);

  const migration = readFileSync(new URL("../../../schema/hotel-migrations/0019_billing_reconciliation.sql", import.meta.url), "utf8");
  await db.exec(migration);
  return db;
}

async function invoice(db: D1Database, bookingId: string) {
  return db.prepare(`SELECT amount_cents,paid_amount_cents,status,payment_method,payment_reference,paid_at,
    MAX(amount_cents-paid_amount_cents,0) remaining_cents,
    MAX(paid_amount_cents-amount_cents,0) credit_cents
    FROM invoices WHERE booking_id=?1`).bind(bookingId).first<any>();
}

describe("D11 reconciliation on executing D1", () => {
  it("supports upward/downward repricing with credit and deterministic paid_at transitions", async () => {
    const db = await database();

    await db.prepare("UPDATE bookings SET total_cents=12000,updated_at='2026-09-19T12:00:00.000Z' WHERE id='main'").run();
    expect(await invoice(db, "main")).toMatchObject({
      amount_cents: 12000, paid_amount_cents: 6000, status: "PENDING",
      remaining_cents: 6000, credit_cents: 0, paid_at: null,
      payment_method: "CARD", payment_reference: "ref-original",
    });

    await db.prepare("UPDATE bookings SET total_cents=5000,updated_at='2026-09-19T13:00:00.000Z' WHERE id='main'").run();
    expect(await invoice(db, "main")).toMatchObject({
      amount_cents: 5000, paid_amount_cents: 6000, status: "PAID",
      remaining_cents: 0, credit_cents: 1000, paid_at: "2026-09-19T13:00:00.000Z",
      payment_method: "CARD", payment_reference: "ref-original",
    });

    await db.prepare("UPDATE bookings SET total_cents=7000,updated_at='2026-09-19T14:00:00.000Z' WHERE id='main'").run();
    expect(await invoice(db, "main")).toMatchObject({ status: "PENDING", remaining_cents: 1000, paid_at: null });

    await db.prepare("UPDATE bookings SET total_cents=6000,updated_at='2026-09-19T15:00:00.000Z' WHERE id='main'").run();
    expect(await invoice(db, "main")).toMatchObject({ status: "PAID", remaining_cents: 0, credit_cents: 0, paid_at: "2026-09-19T15:00:00.000Z" });

    await db.prepare("UPDATE bookings SET total_cents=5500,updated_at='2026-09-19T16:00:00.000Z' WHERE id='main'").run();
    expect(await invoice(db, "main")).toMatchObject({ status: "PAID", credit_cents: 500, paid_at: "2026-09-19T15:00:00.000Z" });
  });

  it("fails closed before repricing on ledger mismatch or VOIDED invoice", async () => {
    const db = await database();

    await expect(db.prepare("UPDATE bookings SET total_cents=11000,updated_at='2026-09-19T12:00:00.000Z' WHERE id='mismatch'").run()).rejects.toThrow(/ledger mismatch/i);
    await expect(db.prepare("UPDATE bookings SET total_cents=11000,updated_at='2026-09-19T12:00:00.000Z' WHERE id='voided'").run()).rejects.toThrow(/voided/i);

    expect(await db.prepare("SELECT total_cents FROM bookings WHERE id='mismatch'").first()).toEqual({ total_cents: 10000 });
    expect(await db.prepare("SELECT total_cents FROM bookings WHERE id='voided'").first()).toEqual({ total_cents: 10000 });
  });

  it("rejects invoice paid truth that is not backed by the payment ledger", async () => {
    const db = await database();
    await expect(db.prepare("UPDATE invoices SET paid_amount_cents=7000 WHERE id='i-main'").run()).rejects.toThrow(/immutable payment ledger/i);
    expect(await invoice(db, "main")).toMatchObject({ paid_amount_cents: 6000 });
  });

  it("records extra charge + reconciliation atomically and rolls all of it back when audit fails", async () => {
    const db = await database();
    const repository = new D1PaymentRepository(db as unknown as OperationalDatabase);
    const before = await repository.findInvoice("extra");
    expect(before?.ledger_paid_cents).toBe(5000);

    const won = await repository.recordExtraCharge({
      bookingId: "extra",
      expectedTotalCents: 10000,
      description: "Late checkout",
      amountCents: 2000,
      category: "OTHER",
      actor: { subject: "actor", requestId: "req-1", hotelId: "hotel-a" },
    }, before);
    expect(won).toBe(true);
    expect(await db.prepare("SELECT total_cents FROM bookings WHERE id='extra'").first()).toEqual({ total_cents: 12000 });
    expect(await invoice(db, "extra")).toMatchObject({ amount_cents: 12000, paid_amount_cents: 5000, status: "PENDING" });
    const events = await db.prepare("SELECT event_type FROM financial_events WHERE booking_id='extra' ORDER BY rowid").all<{ event_type: string }>();
    expect(events.results.map(row => row.event_type)).toEqual(["EXTRA_CHARGE", "PRICE_RECONCILIATION"]);

    const current = await repository.findInvoice("extra");
    await expect(repository.recordExtraCharge({
      bookingId: "extra",
      expectedTotalCents: 12000,
      description: "Injected failure",
      amountCents: 1000,
      category: "OTHER",
      actor: { subject: "actor", requestId: "req-2", hotelId: "hotel-a" },
      forceAuditFailure: true,
    }, current)).rejects.toThrow();

    expect(await db.prepare("SELECT COUNT(*) count FROM extra_charges WHERE booking_id='extra'").first()).toEqual({ count: 1 });
    expect(await db.prepare("SELECT total_cents FROM bookings WHERE id='extra'").first()).toEqual({ total_cents: 12000 });
    expect(await invoice(db, "extra")).toMatchObject({ amount_cents: 12000, paid_amount_cents: 5000 });
  });
});
