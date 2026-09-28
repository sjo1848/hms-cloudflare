import { afterEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { convertV4MiniflareOptions, Miniflare } from "miniflare";
import { D1PaymentRepository } from "./d1-payment-repository";
import type { OperationalDatabase } from "../../routing";

const activeMiniflares: Miniflare[] = [];
afterEach(async () => { await Promise.all(activeMiniflares.splice(0).map(mf => mf.dispose())); });

async function applyMigration(db: D1Database, filename: string) {
  const migration = readFileSync(new URL(`../../../schema/hotel-migrations/${filename}`, import.meta.url), "utf8");
  const statements: string[] = [];
  let buffer = "";
  let inTrigger = false;
  for (const rawLine of migration.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("--")) continue;
    if (!inTrigger && /^CREATE TRIGGER\b/i.test(line)) inTrigger = true;
    buffer += `${rawLine}\n`;
    if ((inTrigger && /^END;$/i.test(line)) || (!inTrigger && line.endsWith(";"))) {
      statements.push(buffer.trim());
      buffer = "";
      inTrigger = false;
    }
  }
  if (buffer.trim()) throw new Error(`Unterminated migration statement in ${filename}`);
  for (const statement of statements) await db.prepare(statement).run();
}

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

  await applyMigration(db, "0019_billing_reconciliation.sql");
  await db.batch([
    db.prepare("INSERT INTO bookings VALUES ('legacy-charge',2000,'2026-09-19T10:00:00.000Z')"),
    db.prepare("INSERT INTO invoices VALUES ('i-legacy-charge','legacy-charge',2000,0,'PENDING','CASH',NULL,NULL,'2026-09-01T00:00:00.000Z')"),
    db.prepare("INSERT INTO extra_charges (id,booking_id,description,amount_cents,category,created_at) VALUES ('legacy-charge-row','legacy-charge','Historical minibar',500,'OTHER','2026-09-01T00:00:00.000Z')"),
  ]);
  await applyMigration(db, "0030_extra_charge_operation_identity.sql");
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
    const repository = new D1PaymentRepository(db as unknown as OperationalDatabase);

    await expect(db.prepare("UPDATE bookings SET total_cents=11000,updated_at='2026-09-19T12:00:00.000Z' WHERE id='mismatch'").run()).rejects.toThrow(/ledger mismatch/i);
    await expect(db.prepare("UPDATE bookings SET total_cents=11000,updated_at='2026-09-19T12:00:00.000Z' WHERE id='voided'").run()).rejects.toThrow(/voided/i);

    expect(await db.prepare("SELECT total_cents FROM bookings WHERE id='mismatch'").first()).toEqual({ total_cents: 10000 });
    expect(await db.prepare("SELECT total_cents FROM bookings WHERE id='voided'").first()).toEqual({ total_cents: 10000 });
    await expect(repository.recordExtraCharge({ bookingId: "mismatch", operationToken: "f09-ledger-mismatch", expectedTotalCents: 10000, description: "Blocked mismatch", amountCents: 500, category: "OTHER", actor: { subject: "actor", requestId: "req-mismatch", hotelId: "hotel-a" } }, await repository.findInvoice("mismatch"))).rejects.toThrow();
    await expect(repository.recordExtraCharge({ bookingId: "voided", operationToken: "f09-voided-invoice", expectedTotalCents: 10000, description: "Blocked voided", amountCents: 500, category: "OTHER", actor: { subject: "actor", requestId: "req-voided", hotelId: "hotel-a" } }, await repository.findInvoice("voided"))).rejects.toThrow();
    for (const bookingId of ["mismatch", "voided"]) {
      expect(await db.prepare("SELECT COUNT(*) count FROM extra_charges WHERE booking_id=?1").bind(bookingId).first()).toEqual({ count: 0 });
      expect(await db.prepare("SELECT COUNT(*) count FROM financial_events WHERE booking_id=?1").bind(bookingId).first()).toEqual({ count: 0 });
    }
    expect(await db.prepare("SELECT amount_cents FROM payment_entries WHERE booking_id='mismatch'").all()).toMatchObject({ results: [{ amount_cents: 4000 }] });
    expect(await db.prepare("SELECT amount_cents FROM payment_entries WHERE booking_id='voided'").all()).toMatchObject({ results: [] });
  });

  it("rejects invoice paid truth that is not backed by the payment ledger", async () => {
    const db = await database();
    await expect(db.prepare("UPDATE invoices SET paid_amount_cents=7000 WHERE id='i-main'").run()).rejects.toThrow(/immutable payment ledger/i);
    expect(await invoice(db, "main")).toMatchObject({ paid_amount_cents: 6000 });
  });

  it("records extra charge + reconciliation atomically and rolls all of it back when audit fails", async () => {
    const db = await database();
    const batchChanges: number[][] = [];
    const observedDb = {
      prepare: (...args: Parameters<D1Database["prepare"]>) => db.prepare(...args),
      batch: async (statements: Parameters<D1Database["batch"]>[0]) => {
        const result = await db.batch(statements);
        batchChanges.push(result.map(item => item.meta.changes ?? 0));
        return result;
      },
    } as OperationalDatabase;
    const repository = new D1PaymentRepository(observedDb);
    const before = await repository.findInvoice("extra");
    expect(before?.ledger_paid_cents).toBe(5000);

    const write = {
      bookingId: "extra",
      operationToken: "f09-extra-charge-retry-001",
      expectedTotalCents: 10000,
      description: "Late checkout",
      amountCents: 2000,
      category: "OTHER",
      actor: { subject: "actor", requestId: "req-1", hotelId: "hotel-a" },
    };
    const won = await repository.recordExtraCharge(write, before);
    expect(won.replayed).toBe(false);
    expect(won.statementChanges).toEqual([1, 2, 1, 1]);
    expect(batchChanges).toEqual([[1, 2, 1, 1]]);
    expect(await db.prepare("SELECT total_cents FROM bookings WHERE id='extra'").first()).toEqual({ total_cents: 12000 });
    expect(await invoice(db, "extra")).toMatchObject({ amount_cents: 12000, paid_amount_cents: 5000, status: "PENDING" });
    expect(await db.prepare("SELECT id,operation_token FROM extra_charges WHERE booking_id='extra'").all()).toMatchObject({ results: [{ id: won.charge.id, operation_token: write.operationToken }] });
    const events = await db.prepare("SELECT event_type,details_json FROM financial_events WHERE booking_id='extra' ORDER BY rowid").all<{ event_type: string; details_json: string }>();
    expect(events.results.map(row => row.event_type)).toEqual(["EXTRA_CHARGE", "PRICE_RECONCILIATION"]);
    expect(JSON.parse(events.results[0].details_json)).toMatchObject({ charge_id: won.charge.id, operation_token: write.operationToken, amount_cents: 2000, category: "OTHER" });
    expect(JSON.parse(events.results[1].details_json)).toMatchObject({ charge_id: won.charge.id, operation_token: write.operationToken, cause_event_id: expect.any(String), new_amount_cents: 12000 });

    const replay = await repository.recordExtraCharge(write, before);
    expect(replay.replayed).toBe(true);
    expect(replay.charge.id).toBe(won.charge.id);
    await expect(repository.recordExtraCharge({ ...write, amountCents: 2100 }, before)).rejects.toThrow(/reused with different details/i);
    expect(await db.prepare("SELECT COUNT(*) count FROM extra_charges WHERE booking_id='extra'").first()).toEqual({ count: 1 });
    expect(await db.prepare("SELECT total_cents FROM bookings WHERE id='extra'").first()).toEqual({ total_cents: 12000 });
    expect(await db.prepare("SELECT COUNT(*) count FROM financial_events WHERE booking_id='extra'").first()).toEqual({ count: 2 });
    expect(await db.prepare("SELECT id,amount_cents,payment_method,payment_reference FROM payment_entries WHERE booking_id='extra'").all()).toMatchObject({ results: [{ id: "p-extra", amount_cents: 5000, payment_method: "TRANSFER", payment_reference: "transfer-ref" }] });

    const current = await repository.findInvoice("extra");
    await expect(repository.recordExtraCharge({
      bookingId: "extra",
      operationToken: "f09-audit-failure-002",
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
    expect(await db.prepare("SELECT COUNT(*) count FROM financial_events WHERE booking_id='extra'").first()).toEqual({ count: 2 });
    expect(await repository.findExtraChargeOperation("extra", "f09-audit-failure-002")).toBeNull();
    expect(await db.prepare("SELECT id,amount_cents,payment_method,payment_reference FROM payment_entries WHERE booking_id='extra'").all()).toMatchObject({ results: [{ id: "p-extra", amount_cents: 5000, payment_method: "TRANSFER", payment_reference: "transfer-ref" }] });
  });

  it("keeps legacy charges readable without fabricated operation identities", async () => {
    const db = await database();
    const historical = await db.prepare("SELECT id,booking_id,description,amount_cents,operation_token FROM extra_charges WHERE id='legacy-charge-row'").first<any>();
    expect(historical).toEqual({ id: "legacy-charge-row", booking_id: "legacy-charge", description: "Historical minibar", amount_cents: 500, operation_token: null });
    await expect(db.prepare("UPDATE extra_charges SET operation_token='invented-legacy-token' WHERE id='legacy-charge-row'").run()).rejects.toThrow(/legacy extra charge operation identity is immutable/i);
    expect(await db.prepare("SELECT operation_token FROM extra_charges WHERE id='legacy-charge-row'").first()).toEqual({ operation_token: null });
  });

  it("requires the complete event pair for replay and lookup while returning the current invoice view", async () => {
    const db = await database();
    const repository = new D1PaymentRepository(db as unknown as OperationalDatabase);
    const write = { bookingId: "extra", operationToken: "f09-lookup-pair-001", expectedTotalCents: 10000, description: "Lookup proof", amountCents: 1000, category: "OTHER", actor: { subject: "actor", requestId: "req-lookup", hotelId: "hotel-a" } };
    const created = await repository.recordExtraCharge(write, await repository.findInvoice("extra"));

    // A later, independent D11 reconciliation changes the current invoice; the historical operation remains discoverable.
    await db.prepare("UPDATE bookings SET total_cents=12000,updated_at='2026-09-19T18:00:00.000Z' WHERE id='extra'").run();
    const recovered = await repository.findExtraChargeOperation("extra", write.operationToken, "hotel-a");
    expect(recovered?.id).toBe(created.charge.id);
    expect(await repository.invoiceView("extra")).toMatchObject({ amount_cents: 12000, paid_amount_cents: 5000, remaining_cents: 7000, credit_cents: 0 });

    await db.prepare(`DELETE FROM financial_events
      WHERE booking_id='extra' AND event_type='PRICE_RECONCILIATION'
        AND json_extract(details_json,'$.operation_token')=?1`).bind(write.operationToken).run();
    await expect(repository.findExtraChargeOperation("extra", write.operationToken, "hotel-a")).rejects.toThrow(/event pair is incomplete or inconsistent/i);
    await expect(repository.recordExtraCharge(write, await repository.findInvoice("extra"))).rejects.toThrow(/event pair is incomplete or inconsistent/i);
    expect(await db.prepare("SELECT COUNT(*) count FROM extra_charges WHERE booking_id='extra'").first()).toEqual({ count: 1 });
    expect(await db.prepare("SELECT total_cents FROM bookings WHERE id='extra'").first()).toEqual({ total_cents: 12000 });
    expect(await invoice(db, "extra")).toMatchObject({ amount_cents: 12000, paid_amount_cents: 5000, status: "PENDING" });
    expect(await db.prepare("SELECT COUNT(*) count FROM financial_events WHERE booking_id='extra'").first()).toEqual({ count: 1 });
    expect(await db.prepare("SELECT id,amount_cents,payment_method,payment_reference FROM payment_entries WHERE booking_id='extra'").all()).toMatchObject({ results: [{ id: "p-extra", amount_cents: 5000, payment_method: "TRANSFER", payment_reference: "transfer-ref" }] });
  });

  it("rolls back charge, D11 and the first event when the second audit event fails", async () => {
    const db = await database();
    const repository = new D1PaymentRepository(db as unknown as OperationalDatabase);
    const token = "f09-second-audit-failure-001";
    await db.prepare(`CREATE TRIGGER reject_reconciliation_audit BEFORE INSERT ON financial_events
      WHEN NEW.event_type='PRICE_RECONCILIATION' AND json_extract(NEW.details_json,'$.operation_token')='${token}'
      BEGIN SELECT RAISE(ABORT,'injected second audit failure'); END`).run();
    const beforeInvoice = await repository.findInvoice("extra");
    const write = { bookingId: "extra", operationToken: token, expectedTotalCents: 10000, description: "Second audit failure", amountCents: 1750, category: "OTHER", actor: { subject: "actor", requestId: "req-second-audit", hotelId: "hotel-a" } };

    await expect(repository.recordExtraCharge(write, beforeInvoice)).rejects.toThrow(/injected second audit failure/i);
    expect(await db.prepare("SELECT total_cents FROM bookings WHERE id='extra'").first()).toEqual({ total_cents: 10000 });
    expect(await invoice(db, "extra")).toMatchObject({ amount_cents: 10000, paid_amount_cents: 5000, status: "PENDING", payment_method: "TRANSFER", payment_reference: "transfer-ref" });
    expect(await db.prepare("SELECT COUNT(*) count FROM extra_charges WHERE booking_id='extra'").first()).toEqual({ count: 0 });
    expect(await db.prepare("SELECT COUNT(*) count FROM financial_events WHERE booking_id='extra'").first()).toEqual({ count: 0 });
    expect(await repository.findExtraChargeOperation("extra", token)).toBeNull();
    expect(await db.prepare("SELECT id,amount_cents,payment_method,payment_reference FROM payment_entries WHERE booking_id='extra'").all()).toMatchObject({ results: [{ id: "p-extra", amount_cents: 5000, payment_method: "TRANSFER", payment_reference: "transfer-ref" }] });
  });

  it("linearizes concurrent identical submissions to one charge and one event pair", async () => {
    const db = await database();
    const repository = new D1PaymentRepository(db as unknown as OperationalDatabase);
    const invoiceBefore = await repository.findInvoice("extra");
    const write = { bookingId: "extra", operationToken: "f09-concurrent-same-001", expectedTotalCents: 10000, description: "Room service", amountCents: 1000, category: "FOOD", actor: { subject: "actor", requestId: "req-race-a", hotelId: "hotel-a" } };
    const outcomes = await Promise.all([repository.recordExtraCharge(write, invoiceBefore), repository.recordExtraCharge(write, invoiceBefore)]);
    expect(outcomes.map(item => item.replayed).sort()).toEqual([false, true]);
    expect(outcomes[0].charge.id).toBe(outcomes[1].charge.id);
    expect(await db.prepare("SELECT id,operation_token FROM extra_charges WHERE booking_id='extra'").all()).toMatchObject({ results: [{ id: outcomes[0].charge.id, operation_token: write.operationToken }] });
    expect(await db.prepare("SELECT total_cents FROM bookings WHERE id='extra'").first()).toEqual({ total_cents: 11000 });
    expect(await db.prepare("SELECT event_type FROM financial_events WHERE booking_id='extra' ORDER BY event_type").all()).toMatchObject({ results: [{ event_type: "EXTRA_CHARGE" }, { event_type: "PRICE_RECONCILIATION" }] });
    expect(await invoice(db, "extra")).toMatchObject({ amount_cents: 11000, paid_amount_cents: 5000, remaining_cents: 6000, credit_cents: 0, status: "PENDING" });
    expect(await db.prepare("SELECT id,amount_cents FROM payment_entries WHERE booking_id='extra'").all()).toMatchObject({ results: [{ id: "p-extra", amount_cents: 5000 }] });
  });

  it("rejects a concurrent same-token changed payload without a second effect", async () => {
    const db = await database();
    const repository = new D1PaymentRepository(db as unknown as OperationalDatabase);
    const invoiceBefore = await repository.findInvoice("extra");
    const base = { bookingId: "extra", operationToken: "f09-concurrent-diff-001", expectedTotalCents: 10000, description: "Room service", category: "FOOD", actor: { subject: "actor", requestId: "req-race", hotelId: "hotel-a" } };
    const outcomes = await Promise.allSettled([
      repository.recordExtraCharge({ ...base, amountCents: 1000 }, invoiceBefore),
      repository.recordExtraCharge({ ...base, amountCents: 2000 }, invoiceBefore),
    ]);
    expect(outcomes.filter(item => item.status === "fulfilled")).toHaveLength(1);
    expect(outcomes.filter(item => item.status === "rejected")).toHaveLength(1);
    const winner = outcomes.find(item => item.status === "fulfilled") as PromiseFulfilledResult<Awaited<ReturnType<typeof repository.recordExtraCharge>>>;
    expect(await db.prepare("SELECT COUNT(*) count FROM extra_charges WHERE booking_id='extra'").first()).toEqual({ count: 1 });
    expect(await db.prepare("SELECT total_cents FROM bookings WHERE id='extra'").first()).toEqual({ total_cents: 10000 + winner.value.charge.amount_cents });
    expect(await db.prepare("SELECT event_type FROM financial_events WHERE booking_id='extra' ORDER BY event_type").all()).toMatchObject({ results: [{ event_type: "EXTRA_CHARGE" }, { event_type: "PRICE_RECONCILIATION" }] });
    expect(await db.prepare("SELECT COUNT(*) count FROM payment_entries WHERE booking_id='extra'").first()).toEqual({ count: 1 });
  });

  it("allows only one distinct-token charge against the same stale booking snapshot", async () => {
    const db = await database();
    const repository = new D1PaymentRepository(db as unknown as OperationalDatabase);
    const invoiceBefore = await repository.findInvoice("extra");
    const base = { bookingId: "extra", expectedTotalCents: 10000, category: "OTHER", actor: { subject: "actor", requestId: "req-distinct-race", hotelId: "hotel-a" } };
    const outcomes = await Promise.allSettled([
      repository.recordExtraCharge({ ...base, operationToken: "f09-distinct-token-a", description: "First race charge", amountCents: 1000 }, invoiceBefore),
      repository.recordExtraCharge({ ...base, operationToken: "f09-distinct-token-b", description: "Second race charge", amountCents: 2000 }, invoiceBefore),
    ]);
    expect(outcomes.filter(item => item.status === "fulfilled")).toHaveLength(1);
    expect(outcomes.filter(item => item.status === "rejected")).toHaveLength(1);
    const winner = outcomes.find(item => item.status === "fulfilled") as PromiseFulfilledResult<Awaited<ReturnType<typeof repository.recordExtraCharge>>>;
    expect(await db.prepare("SELECT total_cents FROM bookings WHERE id='extra'").first()).toEqual({ total_cents: 10000 + winner.value.charge.amount_cents });
    expect(await db.prepare("SELECT COUNT(*) count FROM extra_charges WHERE booking_id='extra'").first()).toEqual({ count: 1 });
    expect(await db.prepare("SELECT event_type,COUNT(*) count FROM financial_events WHERE booking_id='extra' GROUP BY event_type ORDER BY event_type").all()).toMatchObject({ results: [{ event_type: "EXTRA_CHARGE", count: 1 }, { event_type: "PRICE_RECONCILIATION", count: 1 }] });
    expect(await invoice(db, "extra")).toMatchObject({ amount_cents: 10000 + winner.value.charge.amount_cents, paid_amount_cents: 5000, status: "PENDING" });
    expect(await db.prepare("SELECT id,amount_cents,payment_method,payment_reference FROM payment_entries WHERE booking_id='extra'").all()).toMatchObject({ results: [{ id: "p-extra", amount_cents: 5000, payment_method: "TRANSFER", payment_reference: "transfer-ref" }] });
  });

  it("recovers a committed result after simulated response loss without resubmitting a new operation", async () => {
    const db = await database();
    const repository = new D1PaymentRepository(db as unknown as OperationalDatabase);
    const token = "f09-response-lost-001";
    const write = { bookingId: "extra", operationToken: token, expectedTotalCents: 10000, description: "Breakfast delivery", amountCents: 1750, category: "FOOD", actor: { subject: "actor", requestId: "req-lost", hotelId: "hotel-a" } };
    const committed = await repository.recordExtraCharge(write, await repository.findInvoice("extra"));
    // The caller intentionally discards the POST result: this models response loss after commit.
    const recovered = await repository.findExtraChargeOperation("extra", token);
    expect(recovered).toMatchObject({ id: committed.charge.id, description: write.description, amount_cents: 1750 });
    expect(await repository.invoiceView("extra")).toMatchObject({ amount_cents: 11750, paid_amount_cents: 5000, remaining_cents: 6750, credit_cents: 0 });
    const retried = await repository.recordExtraCharge(write, await repository.findInvoice("extra"));
    expect(retried.replayed).toBe(true);
    expect(retried.charge.id).toBe(committed.charge.id);
    expect(await db.prepare("SELECT COUNT(*) count FROM extra_charges WHERE booking_id='extra'").first()).toEqual({ count: 1 });
    expect(await db.prepare("SELECT COUNT(*) count FROM financial_events WHERE booking_id='extra'").first()).toEqual({ count: 2 });
  });
});
