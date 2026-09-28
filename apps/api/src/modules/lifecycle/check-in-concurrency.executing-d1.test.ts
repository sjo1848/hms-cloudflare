import { afterEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { convertV4MiniflareOptions, Miniflare } from "miniflare";
import { D1LifecycleRepository } from "./d1-lifecycle-repository";
import { D1PaymentRepository } from "../billing/d1-payment-repository";
import type { OperationalDatabase } from "../../routing";

const miniflares: Miniflare[] = [];
afterEach(async () => Promise.all(miniflares.splice(0).map(mf => mf.dispose())));

async function applyMigration(db: D1Database, migrationPath: string) {
  const sql = readFileSync(new URL(migrationPath, import.meta.url), "utf8");
  const statements: string[] = [];
  let buffer = "";
  let inTrigger = false;
  for (const rawLine of sql.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("--")) continue;
    const startsTrigger = !inTrigger && /^CREATE TRIGGER\b/i.test(line);
    if (startsTrigger) inTrigger = true;
    buffer += `${rawLine}\n`;
    if ((inTrigger && (/^END;$/i.test(line) || (startsTrigger && /\bEND;\s*$/i.test(line)))) || (!inTrigger && line.endsWith(";"))) {
      statements.push(buffer.trim());
      buffer = "";
      inTrigger = false;
    }
  }
  if (buffer.trim()) throw new Error(`Unterminated migration: ${migrationPath}`);
  for (const [index, statement] of statements.entries()) {
    try { await db.prepare(statement).run(); }
    catch (error) { throw new Error(`Migration ${migrationPath}, statement ${index + 1}: ${statement.slice(0, 240)}`, { cause: error }); }
  }
}

describe("check-in exact-winner guard on executing D1", () => {
  it("rejects a stale concurrent attempt without a second event or partial state", async () => {
    const mf = new Miniflare(convertV4MiniflareOptions({
      script: "export default { fetch() { return new Response('ok') } }",
      modules: true,
      d1Databases: { DB: "check-in-race" },
    }));
    miniflares.push(mf);
    const db = await mf.getD1Database("DB");
    await db.batch([
      db.prepare("CREATE TABLE rooms (id TEXT PRIMARY KEY, room_number TEXT NOT NULL, room_type TEXT NOT NULL, status TEXT NOT NULL, price_cents INTEGER NOT NULL)"),
      db.prepare("CREATE TABLE guests (id TEXT PRIMARY KEY, full_name TEXT NOT NULL, email TEXT NOT NULL, phone TEXT, created_at TEXT NOT NULL)"),
      db.prepare("CREATE TABLE bookings (id TEXT PRIMARY KEY, guest_id TEXT NOT NULL, room_id TEXT NOT NULL, check_in TEXT NOT NULL, check_out TEXT NOT NULL, status TEXT NOT NULL, total_cents INTEGER NOT NULL DEFAULT 0, notes TEXT, checked_in_at TEXT, checked_in_by TEXT, checked_out_at TEXT, checked_out_by TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, check_in_guests_count INTEGER, check_out_payment_policy TEXT, check_out_reference TEXT)"),
      db.prepare("CREATE TABLE lifecycle_events (id TEXT PRIMARY KEY, booking_id TEXT NOT NULL, event_type TEXT NOT NULL, from_room_id TEXT, actor_subject TEXT NOT NULL, request_id TEXT NOT NULL, hotel_id TEXT NOT NULL, details_json TEXT NOT NULL, created_at TEXT NOT NULL)"),
      db.prepare("CREATE TABLE room_inventory_nights (room_id TEXT NOT NULL, stay_date TEXT NOT NULL, booking_id TEXT NOT NULL, PRIMARY KEY(room_id,stay_date))"),
      db.prepare("CREATE TABLE room_holds (id TEXT PRIMARY KEY, room_id TEXT NOT NULL, start_date TEXT NOT NULL, end_date TEXT NOT NULL)"),
      db.prepare("CREATE TABLE extra_charges (id TEXT PRIMARY KEY, booking_id TEXT NOT NULL, description TEXT NOT NULL, amount_cents INTEGER NOT NULL, category TEXT NOT NULL DEFAULT 'OTHER', created_at TEXT NOT NULL)"),
      db.prepare("CREATE TABLE invoices (id TEXT PRIMARY KEY, booking_id TEXT NOT NULL UNIQUE, amount_cents INTEGER NOT NULL, paid_amount_cents INTEGER NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'PENDING', payment_method TEXT NOT NULL DEFAULT 'CASH', payment_reference TEXT, paid_at TEXT, created_at TEXT NOT NULL)"),
      db.prepare("CREATE TABLE payment_entries (id TEXT PRIMARY KEY, invoice_id TEXT NOT NULL, booking_id TEXT NOT NULL, amount_cents INTEGER NOT NULL, payment_method TEXT NOT NULL, payment_reference TEXT, note TEXT, received_by_user_id TEXT NOT NULL, received_at TEXT NOT NULL)"),
      db.prepare("CREATE TABLE financial_events (id TEXT PRIMARY KEY, event_type TEXT NOT NULL, booking_id TEXT, actor_subject TEXT NOT NULL, request_id TEXT NOT NULL, hotel_id TEXT NOT NULL, details_json TEXT NOT NULL, created_at TEXT NOT NULL)"),
      // The deployed 0006 lifecycle guard is part of the operation's atomic contract.
      db.prepare("CREATE UNIQUE INDEX idx_lifecycle_events_checkin_once ON lifecycle_events(booking_id, event_type) WHERE event_type IN ('CHECK_IN', 'CHECK_OUT')"),
      db.prepare("INSERT INTO rooms (id,room_number,room_type,status,price_cents) VALUES ('room-1','101','Standard','AVAILABLE',10000)"),
      db.prepare("INSERT INTO guests VALUES ('guest-1','Synthetic Guest','guest@example.test',NULL,'2026-09-26T12:00:00.000Z')"),
      db.prepare("INSERT INTO bookings (id,guest_id,room_id,check_in,check_out,status,created_at,updated_at) VALUES ('booking-1','guest-1','room-1','2026-09-26','2026-09-27','CONFIRMED','2026-09-26T12:00:00.000Z','2026-09-26T12:00:00.000Z')"),
    ]);
    await applyMigration(db, "../../../schema/hotel-migrations/0007_lifecycle_atomic_guards.sql");
    await applyMigration(db, "../../../schema/hotel-migrations/0009_housekeeping_maintenance.sql");
    await applyMigration(db, "../../../schema/hotel-migrations/0013_noshow_reporting_parity.sql");
    await applyMigration(db, "../../../schema/hotel-migrations/0014_migration_source_parity.sql");
    await applyMigration(db, "../../../schema/hotel-migrations/0015_payment_operation_token.sql");
    await applyMigration(db, "../../../schema/hotel-migrations/0016_payment_operation_token_scope.sql");
    await applyMigration(db, "../../../schema/hotel-migrations/0017_reporting_indexes.sql");
    await applyMigration(db, "../../../schema/hotel-migrations/0018_agent_mutation_provenance.sql");
    await applyMigration(db, "../../../schema/hotel-migrations/0019_billing_reconciliation.sql");
    await applyMigration(db, "../../../schema/hotel-migrations/0020_maintenance_impact.sql");
    await applyMigration(db, "../../../schema/hotel-migrations/0021_reassignment_remaining_nights.sql");
    await applyMigration(db, "../../../schema/hotel-migrations/0022_room_state_dimensions.sql");
    await applyMigration(db, "../../../schema/hotel-migrations/0023_room_state_command_guards.sql");
    await applyMigration(db, "../../../schema/hotel-migrations/0024_reassignment_interval_room_versions.sql");
    await applyMigration(db, "../../../schema/hotel-migrations/0025_segmented_stay_pricing.sql");
    await applyMigration(db, "../../../schema/hotel-migrations/0026_active_stay_pricing_bootstrap_shadow.sql");
    await applyMigration(db, "../../../schema/hotel-migrations/0027_active_stay_bootstrap_segment_snapshot_guard.sql");
    await applyMigration(db, "../../../schema/hotel-migrations/0028_checkout_settlement_guard.sql");
    await db.prepare("UPDATE rooms SET housekeeping_state='READY',service_state='IN_SERVICE' WHERE id='room-1'").run();
    const repository = new D1LifecycleRepository(db);
    const stale = { id: "booking-1", room_id: "room-1", status: "CONFIRMED", check_in: "2026-09-26", check_out: "2026-09-27" } as const;
    const attempts = await Promise.allSettled([
      repository.checkIn(stale, 1, { subject: "actor-one", requestId: "request-one", hotelId: "hotel-a" }),
      repository.checkIn(stale, 2, { subject: "actor-two", requestId: "request-two", hotelId: "hotel-a" }),
    ]);
    const winners = attempts.map((attempt, index) => attempt.status === "fulfilled" && attempt.value.ok ? index : -1).filter(index => index >= 0);
    expect(winners).toHaveLength(1);
    const winner = winners[0] === 0
      ? { subject: "actor-one", requestId: "request-one", guests: 1 }
      : { subject: "actor-two", requestId: "request-two", guests: 2 };
    const booking = await db.prepare("SELECT status, check_in_guests_count, checked_in_by FROM bookings WHERE id='booking-1'").first();
    const room = await db.prepare("SELECT status FROM rooms WHERE id='room-1'").first();
    const events = await db.prepare("SELECT actor_subject, request_id, hotel_id, details_json FROM lifecycle_events WHERE booking_id='booking-1'").all();
    expect(booking).toMatchObject({ status: "CHECKED_IN", check_in_guests_count: winner.guests, checked_in_by: winner.subject });
    expect(room).toMatchObject({ status: "OCCUPIED" });
    expect(events.results).toHaveLength(1);
    expect(events.results[0]).toMatchObject({ actor_subject: winner.subject, request_id: winner.requestId, hotel_id: "hotel-a" });
    expect(JSON.parse(String(events.results[0].details_json))).toMatchObject({
      check_in_guests_count: winner.guests,
      occupancy_before: "VACANT", occupancy_after: "OCCUPIED",
      housekeeping_state_before: "READY", housekeeping_state_after: "READY",
      maintenance_impact_before: "NONE", maintenance_impact_after: "NONE",
      service_state_before: "IN_SERVICE", service_state_after: "IN_SERVICE",
      room_state_version_before: 0, room_state_version_after: 1,
    });

    await db.batch([
      db.prepare("INSERT INTO rooms (id,room_number,room_type,status,price_cents,housekeeping_state,service_state,room_state_version) VALUES ('room-2','102','Standard','AVAILABLE',10000,'READY','IN_SERVICE',0)"),
      db.prepare("INSERT INTO bookings (id,guest_id,room_id,check_in,check_out,status,total_cents,created_at,updated_at) VALUES ('booking-2','guest-1','room-2','2026-09-26','2026-09-28','CONFIRMED',0,'2026-09-26T12:00:00.000Z','2026-09-26T12:00:00.000Z')"),
      db.prepare("INSERT INTO maintenance_cases (id,room_id,status,impact,priority,reason,assigned_to,reported_at) VALUES ('advisory-room-2','room-2','OPEN','NON_BLOCKING','LOW','Advisory issue','ops','2026-09-26T12:00:00.000Z')"),
    ]);
    const advisoryCheckin = await repository.checkIn({ ...stale, id: "booking-2", room_id: "room-2", check_out: "2026-09-28" }, 1, { subject: "actor-advisory", requestId: "request-advisory", hotelId: "hotel-a" });
    expect(advisoryCheckin.ok).toBe(true);
    expect(await db.prepare("SELECT status,housekeeping_state,service_state,room_state_version FROM rooms WHERE id='room-2'").first()).toEqual({ status: "OCCUPIED", housekeeping_state: "READY", service_state: "IN_SERVICE", room_state_version: 1 });
    expect(await db.prepare("SELECT status,impact FROM maintenance_cases WHERE id='advisory-room-2'").first()).toEqual({ status: "OPEN", impact: "NON_BLOCKING" });
    const advisoryEvent = await db.prepare("SELECT details_json FROM lifecycle_events WHERE booking_id='booking-2' AND event_type='CHECK_IN'").first<{ details_json: string }>();
    expect(JSON.parse(advisoryEvent!.details_json)).toMatchObject({ maintenance_impact_before: "NON_BLOCKING", maintenance_impact_after: "NON_BLOCKING", housekeeping_state_before: "READY", housekeeping_state_after: "READY" });

    await db.prepare("INSERT INTO maintenance_cases (id,room_id,status,impact,priority,reason,assigned_to,reported_at) VALUES ('block-room-1','room-1','OPEN','BLOCKING','HIGH','Synthetic blocker','ops','2026-09-26T12:00:00.000Z')").run();
    const checkedIn = { ...stale, status: "CHECKED_IN" };
    const checkoutActor = winner.subject === "actor-one"
      ? { subject: "actor-one", requestId: "checkout-one", hotelId: "hotel-a" }
      : { subject: "actor-two", requestId: "checkout-two", hotelId: "hotel-a" };
    const checkedOut = await repository.checkout(checkedIn, "pending-approved", "ref-123456", checkoutActor);
    expect(checkedOut.ok).toBe(true);
    const finalBooking = await db.prepare("SELECT status FROM bookings WHERE id='booking-1'").first();
    const finalRoom = await db.prepare("SELECT status, housekeeping_state, service_state, room_state_version FROM rooms WHERE id='room-1'").first();
    const blockingCase = await db.prepare("SELECT status, impact FROM maintenance_cases WHERE id='block-room-1'").first();
    const checkoutEvent = await db.prepare("SELECT event_type, actor_subject, request_id, hotel_id, details_json FROM lifecycle_events WHERE event_type='CHECK_OUT'").first<any>();
    expect(finalBooking).toEqual({ status: "CHECKED_OUT" });
    expect(finalRoom).toEqual({ status: "MAINTENANCE", housekeeping_state: "DIRTY", service_state: "IN_SERVICE", room_state_version: 2 });
    expect(blockingCase).toEqual({ status: "OPEN", impact: "BLOCKING" });
    expect(checkoutEvent).toMatchObject({ event_type: "CHECK_OUT", actor_subject: checkoutActor.subject, request_id: checkoutActor.requestId, hotel_id: "hotel-a" });
    expect(JSON.parse(String(checkoutEvent.details_json))).toMatchObject({ service_state_before: "IN_SERVICE", service_state_after: "IN_SERVICE", maintenance_open_case_count_before: 1, maintenance_open_case_count_after: 1, room_state_version_before: 1, room_state_version_after: 2 });
    expect(JSON.parse(String(checkoutEvent.details_json))).toMatchObject({ booking_total_cents: 0, invoice_status: "PAID", invoice_amount_cents: 0, paid_amount_cents: 0, paid_at: null, ledger_paid_cents: 0, remaining_cents: 0, credit_cents: 0 });

    const addCheckedIn = async (bookingId: string, roomId: string, total: number) => {
      await db.batch([
        db.prepare("INSERT INTO rooms (id,room_number,room_type,status,price_cents,housekeeping_state,service_state,room_state_version) VALUES (?1,?2,'Standard','OCCUPIED',10000,'READY','IN_SERVICE',1)").bind(roomId, roomId),
        db.prepare("INSERT INTO bookings (id,guest_id,room_id,check_in,check_out,status,total_cents,created_at,updated_at) VALUES (?1,'guest-1',?2,'2026-09-26','2026-09-28','CHECKED_IN',?3,'2026-09-26T12:00:00.000Z','2026-09-26T12:00:00.000Z')").bind(bookingId, roomId, total),
        db.prepare("INSERT INTO room_inventory_nights (room_id,stay_date,booking_id) VALUES (?1,'2026-09-26',?2),(?1,'2026-09-27',?2)").bind(roomId, bookingId),
      ]);
    };
    const checkedInBooking = (id: string, room_id: string) => ({ id, room_id, check_in: "2026-09-26", check_out: "2026-09-28", status: "CHECKED_IN" });
    await addCheckedIn("unpaid-booking", "unpaid-room", 12000);
    const unpaid = await repository.checkout(checkedInBooking("unpaid-booking", "unpaid-room"), "settled", null, { subject: "actor", requestId: "unpaid", hotelId: "hotel-a" });
    expect(unpaid.ok).toBe(false);
    expect(await db.prepare("SELECT status FROM bookings WHERE id='unpaid-booking'").first()).toEqual({ status: "CHECKED_IN" });
    expect(await db.prepare("SELECT status,room_state_version FROM rooms WHERE id='unpaid-room'").first()).toEqual({ status: "OCCUPIED", room_state_version: 1 });
    expect(await db.prepare("SELECT COUNT(*) count FROM invoices WHERE booking_id='unpaid-booking'").first()).toEqual({ count: 0 });
    expect(await db.prepare("SELECT COUNT(*) count FROM lifecycle_events WHERE booking_id='unpaid-booking'").first()).toEqual({ count: 0 });

    const addInvoice = async (bookingId: string, roomId: string, paid: number, invoiceStatus: string, ledger = paid) => {
      await addCheckedIn(bookingId, roomId, 10000);
      await db.prepare("INSERT INTO invoices (id,booking_id,amount_cents,paid_amount_cents,status,created_at) VALUES (?1,?2,10000,?3,?4,'2026-09-26T12:00:00.000Z')").bind(`invoice-${bookingId}`, bookingId, paid, invoiceStatus).run();
      if (ledger > 0) await db.prepare("INSERT INTO payment_entries (id,invoice_id,booking_id,amount_cents,payment_method,received_by_user_id,received_at) VALUES (?1,?2,?3,?4,'CASH','actor','2026-09-26T12:00:00.000Z')").bind(`payment-${bookingId}`, `invoice-${bookingId}`, bookingId, ledger).run();
    };
    await addInvoice("partial-booking", "partial-room", 4000, "PENDING");
    const partial = await repository.checkout(checkedInBooking("partial-booking", "partial-room"), "settled", null, { subject: "actor", requestId: "partial", hotelId: "hotel-a" });
    expect(partial.ok).toBe(false);
    expect(await db.prepare("SELECT status FROM bookings WHERE id='partial-booking'").first()).toEqual({ status: "CHECKED_IN" });
    const approvedPartial = await repository.checkout(checkedInBooking("partial-booking", "partial-room"), "pending-approved", "approved-reference", { subject: "actor", requestId: "partial-approved", hotelId: "hotel-a" });
    expect(approvedPartial.ok).toBe(true);

    await addInvoice("paid-booking", "paid-room", 10000, "PAID");
    const paid = await repository.checkout(checkedInBooking("paid-booking", "paid-room"), "settled", null, { subject: "actor", requestId: "paid", hotelId: "hotel-a" });
    expect(paid.ok).toBe(true);
    const paidSnapshot = await db.prepare("SELECT details_json FROM lifecycle_events WHERE booking_id='paid-booking' AND event_type='CHECK_OUT'").first<{ details_json: string }>();
    expect(JSON.parse(paidSnapshot!.details_json)).toMatchObject({ booking_total_cents: 10000, paid_amount_cents: 10000, ledger_paid_cents: 10000, remaining_cents: 0, credit_cents: 0 });
    const paidAt = await db.prepare("SELECT paid_at FROM invoices WHERE booking_id='paid-booking'").first<{ paid_at: string | null }>();
    expect(JSON.parse(paidSnapshot!.details_json).paid_at).toBe(paidAt?.paid_at);

    await addInvoice("credit-booking", "credit-room", 12000, "PAID");
    const credit = await repository.checkout(checkedInBooking("credit-booking", "credit-room"), "settled", null, { subject: "actor", requestId: "credit", hotelId: "hotel-a" });
    expect(credit.ok).toBe(true);
    const creditSnapshot = await db.prepare("SELECT details_json FROM lifecycle_events WHERE booking_id='credit-booking' AND event_type='CHECK_OUT'").first<{ details_json: string }>();
    expect(JSON.parse(creditSnapshot!.details_json)).toMatchObject({ booking_total_cents: 10000, invoice_amount_cents: 10000, paid_amount_cents: 12000, ledger_paid_cents: 12000, remaining_cents: 0, credit_cents: 2000 });

    await addInvoice("voided-booking", "voided-room", 10000, "VOIDED");
    const voided = await repository.checkout(checkedInBooking("voided-booking", "voided-room"), "pending-approved", "approved-reference", { subject: "actor", requestId: "voided", hotelId: "hotel-a" });
    expect(voided.ok).toBe(false);
    expect(await db.prepare("SELECT status FROM bookings WHERE id='voided-booking'").first()).toEqual({ status: "CHECKED_IN" });

    await addInvoice("mismatch-booking", "mismatch-room", 9000, "PENDING", 8000);
    const mismatch = await repository.checkout(checkedInBooking("mismatch-booking", "mismatch-room"), "pending-approved", "approved-reference", { subject: "actor", requestId: "mismatch", hotelId: "hotel-a" });
    expect(mismatch.ok).toBe(false);
    expect(await db.prepare("SELECT status FROM bookings WHERE id='mismatch-booking'").first()).toEqual({ status: "CHECKED_IN" });

    await addCheckedIn("amount-mismatch-booking", "amount-mismatch-room", 10000);
    await db.prepare("INSERT INTO invoices (id,booking_id,amount_cents,status,created_at) VALUES ('amount-mismatch-invoice','amount-mismatch-booking',9000,'PENDING','2026-09-26T12:00:00.000Z')").run();
    const amountMismatch = await repository.checkout(checkedInBooking("amount-mismatch-booking", "amount-mismatch-room"), "pending-approved", "approved-reference", { subject: "actor", requestId: "amount-mismatch", hotelId: "hotel-a" });
    expect(amountMismatch.ok).toBe(false);
    expect(await db.prepare("SELECT status,total_cents FROM bookings WHERE id='amount-mismatch-booking'").first()).toEqual({ status: "CHECKED_IN", total_cents: 10000 });
    expect(await db.prepare("SELECT id,booking_id,amount_cents,paid_amount_cents,status,paid_at FROM invoices WHERE booking_id='amount-mismatch-booking'").first()).toEqual({ id: "amount-mismatch-invoice", booking_id: "amount-mismatch-booking", amount_cents: 9000, paid_amount_cents: 0, status: "PENDING", paid_at: null });
    expect(await db.prepare("SELECT status,housekeeping_state,room_state_version FROM rooms WHERE id='amount-mismatch-room'").first()).toEqual({ status: "OCCUPIED", housekeeping_state: "READY", room_state_version: 1 });
    expect(await db.prepare("SELECT COUNT(*) count FROM room_inventory_nights WHERE booking_id='amount-mismatch-booking'").first()).toEqual({ count: 2 });
    expect(await db.prepare("SELECT COUNT(*) count FROM lifecycle_events WHERE booking_id='amount-mismatch-booking'").first()).toEqual({ count: 0 });

    await addCheckedIn("event-failure-booking", "event-failure-room", 5000);
    await db.prepare(`CREATE TRIGGER reject_checkout_event BEFORE INSERT ON lifecycle_events
      WHEN NEW.event_type='CHECK_OUT' AND NEW.booking_id='event-failure-booking'
      BEGIN SELECT RAISE(ABORT,'injected checkout event failure'); END`).run();
    await expect(repository.checkout(checkedInBooking("event-failure-booking", "event-failure-room"), "pending-approved", "approved-reference", { subject: "actor", requestId: "event-failure", hotelId: "hotel-a" })).rejects.toThrow("injected checkout event failure");
    expect(await db.prepare("SELECT status FROM bookings WHERE id='event-failure-booking'").first()).toEqual({ status: "CHECKED_IN" });
    expect(await db.prepare("SELECT status,room_state_version FROM rooms WHERE id='event-failure-room'").first()).toEqual({ status: "OCCUPIED", room_state_version: 1 });
    expect(await db.prepare("SELECT COUNT(*) count FROM room_inventory_nights WHERE booking_id='event-failure-booking'").first()).toEqual({ count: 2 });
    expect(await db.prepare("SELECT COUNT(*) count FROM invoices WHERE booking_id='event-failure-booking'").first()).toEqual({ count: 0 });
    expect(await db.prepare("SELECT COUNT(*) count FROM lifecycle_events WHERE booking_id='event-failure-booking'").first()).toEqual({ count: 0 });

    await db.prepare("DROP TRIGGER reject_checkout_event").run();
    await addCheckedIn("race-checkout-booking", "race-checkout-room", 0);
    const checkoutRace = await Promise.allSettled([
      repository.checkout(checkedInBooking("race-checkout-booking", "race-checkout-room"), "settled", null, { subject: "actor-a", requestId: "race-a", hotelId: "hotel-a" }),
      repository.checkout(checkedInBooking("race-checkout-booking", "race-checkout-room"), "settled", null, { subject: "actor-b", requestId: "race-b", hotelId: "hotel-a" }),
    ]);
    expect(checkoutRace.filter(result => result.status === "fulfilled" && result.value.ok)).toHaveLength(1);
    expect(checkoutRace.filter(result => result.status === "rejected")).toHaveLength(1);
    expect(await db.prepare("SELECT status FROM bookings WHERE id='race-checkout-booking'").first()).toEqual({ status: "CHECKED_OUT" });
    expect(await db.prepare("SELECT COUNT(*) count FROM lifecycle_events WHERE booking_id='race-checkout-booking' AND event_type='CHECK_OUT'").first()).toEqual({ count: 1 });

    const billing = new D1PaymentRepository(db);
    const paymentWrite = (bookingId: string, amountCents: number, token: string) => ({ bookingId, amountCents, paymentMethod: "CASH" as const, reference: null, note: null, operationToken: token, settle: true, actor: { subject: "actor", requestId: token, hotelId: "hotel-a" } });
    await addCheckedIn("paid-before-booking", "paid-before-room", 10000);
    expect(await billing.recordPayment(paymentWrite("paid-before-booking", 10000, "paid-before-token"), null)).toBe(true);
    expect((await repository.checkout(checkedInBooking("paid-before-booking", "paid-before-room"), "settled", null, { subject: "actor", requestId: "paid-before-checkout", hotelId: "hotel-a" })).ok).toBe(true);

    await addCheckedIn("paid-after-booking", "paid-after-room", 10000);
    expect((await repository.checkout(checkedInBooking("paid-after-booking", "paid-after-room"), "pending-approved", "approved-reference", { subject: "actor", requestId: "checkout-before-payment", hotelId: "hotel-a" })).ok).toBe(true);
    const afterCheckoutInvoice = await billing.findInvoice("paid-after-booking");
    expect(afterCheckoutInvoice).not.toBeNull();
    expect(await billing.recordPayment(paymentWrite("paid-after-booking", 10000, "paid-after-token"), afterCheckoutInvoice)).toBe(true);
    const beforePaymentEvent = await db.prepare("SELECT details_json FROM lifecycle_events WHERE booking_id='paid-after-booking' AND event_type='CHECK_OUT'").first<{ details_json: string }>();
    expect(JSON.parse(beforePaymentEvent!.details_json)).toMatchObject({ paid_amount_cents: 0, ledger_paid_cents: 0, remaining_cents: 10000 });
    expect(await billing.findInvoice("paid-after-booking")).toMatchObject({ amount_cents: 10000, paid_amount_cents: 10000, ledger_paid_cents: 10000, status: "PAID" });

    await addCheckedIn("charge-after-booking", "charge-after-room", 10000);
    expect((await repository.checkout(checkedInBooking("charge-after-booking", "charge-after-room"), "pending-approved", "approved-reference", { subject: "actor", requestId: "checkout-before-charge", hotelId: "hotel-a" })).ok).toBe(true);
    const invoiceBeforeCharge = await billing.findInvoice("charge-after-booking");
    const chargeAfter = await billing.recordExtraCharge({ bookingId: "charge-after-booking", expectedTotalCents: 10000, description: "Post-checkout service", amountCents: 2500, category: "OTHER", actor: { subject: "actor", requestId: "charge-after", hotelId: "hotel-a" } }, invoiceBeforeCharge);
    expect(chargeAfter).toBe(true);
    expect(await db.prepare("SELECT total_cents FROM bookings WHERE id='charge-after-booking'").first()).toEqual({ total_cents: 12500 });
    expect(await billing.findInvoice("charge-after-booking")).toMatchObject({ amount_cents: 12500, paid_amount_cents: 0, status: "PENDING" });
    const beforeChargeEvent = await db.prepare("SELECT details_json FROM lifecycle_events WHERE booking_id='charge-after-booking' AND event_type='CHECK_OUT'").first<{ details_json: string }>();
    expect(JSON.parse(beforeChargeEvent!.details_json)).toMatchObject({ booking_total_cents: 10000, invoice_amount_cents: 10000 });

    await addCheckedIn("charge-before-booking", "charge-before-room", 10000);
    expect(await billing.recordExtraCharge({ bookingId: "charge-before-booking", expectedTotalCents: 10000, description: "Pre-checkout service", amountCents: 2500, category: "OTHER", actor: { subject: "actor", requestId: "charge-before", hotelId: "hotel-a" } }, null)).toBe(true);
    expect(await billing.recordPayment(paymentWrite("charge-before-booking", 12500, "charge-before-payment-token"), null)).toBe(true);
    expect((await repository.checkout(checkedInBooking("charge-before-booking", "charge-before-room"), "settled", null, { subject: "actor", requestId: "charge-before-checkout", hotelId: "hotel-a" })).ok).toBe(true);
    const afterChargeEvent = await db.prepare("SELECT details_json FROM lifecycle_events WHERE booking_id='charge-before-booking' AND event_type='CHECK_OUT'").first<{ details_json: string }>();
    expect(JSON.parse(afterChargeEvent!.details_json)).toMatchObject({ booking_total_cents: 12500, invoice_amount_cents: 12500, paid_amount_cents: 12500, ledger_paid_cents: 12500, remaining_cents: 0 });

    await addCheckedIn("payment-race-booking", "payment-race-room", 10000);
    const paymentRace = await Promise.all([
      repository.checkout(checkedInBooking("payment-race-booking", "payment-race-room"), "settled", null, { subject: "actor", requestId: "payment-race-checkout", hotelId: "hotel-a" }),
      billing.recordPayment(paymentWrite("payment-race-booking", 10000, "payment-race-token"), null),
    ]);
    expect(paymentRace[1]).toBe(true);
    const paymentRaceBooking = await db.prepare("SELECT status FROM bookings WHERE id='payment-race-booking'").first<{ status: string }>();
    const paymentRaceEvent = await db.prepare("SELECT details_json FROM lifecycle_events WHERE booking_id='payment-race-booking' AND event_type='CHECK_OUT'").first<{ details_json: string }>();
    if (paymentRace[0].ok) {
      expect(paymentRaceBooking).toEqual({ status: "CHECKED_OUT" });
      expect(JSON.parse(paymentRaceEvent!.details_json)).toMatchObject({ paid_amount_cents: 10000, ledger_paid_cents: 10000, remaining_cents: 0 });
    } else {
      expect(paymentRaceBooking).toEqual({ status: "CHECKED_IN" });
      expect(paymentRaceEvent).toBeNull();
      expect(await billing.findInvoice("payment-race-booking")).toMatchObject({ paid_amount_cents: 10000, ledger_paid_cents: 10000, status: "PAID" });
    }

    await addCheckedIn("stale-snapshot-booking", "stale-snapshot-room", 10000);
    const staleBilling = new D1PaymentRepository(db);
    let paymentCommittedBetweenReadAndBatch = false;
    const interposedDb = {
      prepare: (...args: Parameters<D1Database["prepare"]>) => db.prepare(...args),
      batch: async (statements: Parameters<D1Database["batch"]>[0]) => {
        if (!paymentCommittedBetweenReadAndBatch) {
          paymentCommittedBetweenReadAndBatch = true;
          expect(await staleBilling.recordPayment(paymentWrite("stale-snapshot-booking", 10000, "stale-snapshot-payment"), null)).toBe(true);
        }
        return db.batch(statements);
      },
    } as OperationalDatabase;
    const staleRepository = new D1LifecycleRepository(interposedDb);
    const staleSettled = await staleRepository.checkout(checkedInBooking("stale-snapshot-booking", "stale-snapshot-room"), "settled", null, { subject: "actor", requestId: "stale-snapshot-checkout", hotelId: "hotel-a" });
    expect(paymentCommittedBetweenReadAndBatch).toBe(true);
    expect(staleSettled.ok).toBe(false);
    expect(await db.prepare("SELECT status FROM bookings WHERE id='stale-snapshot-booking'").first()).toEqual({ status: "CHECKED_IN" });
    expect(await db.prepare("SELECT status,room_state_version FROM rooms WHERE id='stale-snapshot-room'").first()).toEqual({ status: "OCCUPIED", room_state_version: 1 });
    expect(await db.prepare("SELECT COUNT(*) count FROM lifecycle_events WHERE booking_id='stale-snapshot-booking'").first()).toEqual({ count: 0 });
    expect(await staleBilling.findInvoice("stale-snapshot-booking")).toMatchObject({ amount_cents: 10000, paid_amount_cents: 10000, ledger_paid_cents: 10000, status: "PAID" });
    expect(await db.prepare("SELECT id,room_id,status,total_cents FROM bookings WHERE id='stale-snapshot-booking'").first()).toEqual({ id: "stale-snapshot-booking", room_id: "stale-snapshot-room", status: "CHECKED_IN", total_cents: 10000 });
    expect(await db.prepare("SELECT status,housekeeping_state,room_state_version FROM rooms WHERE id='stale-snapshot-room'").first()).toEqual({ status: "OCCUPIED", housekeeping_state: "READY", room_state_version: 1 });
    expect(await db.prepare("SELECT room_id,stay_date FROM room_inventory_nights WHERE booking_id='stale-snapshot-booking' ORDER BY stay_date").all()).toMatchObject({ results: [{ room_id: "stale-snapshot-room", stay_date: "2026-09-26" }, { room_id: "stale-snapshot-room", stay_date: "2026-09-27" }] });
    expect(await db.prepare("SELECT COUNT(*) count FROM extra_charges WHERE booking_id='stale-snapshot-booking'").first()).toEqual({ count: 0 });
    expect(await db.prepare("SELECT COUNT(*) count FROM payment_entries WHERE booking_id='stale-snapshot-booking'").first()).toEqual({ count: 1 });
    expect(await db.prepare("SELECT amount_cents,paid_amount_cents,status,paid_at FROM invoices WHERE booking_id='stale-snapshot-booking'").first()).toMatchObject({ amount_cents: 10000, paid_amount_cents: 10000, status: "PAID", paid_at: expect.any(String) });
    expect(await db.prepare("SELECT id,invoice_id,booking_id,amount_cents,payment_method FROM payment_entries WHERE booking_id='stale-snapshot-booking'").first()).toMatchObject({ id: expect.any(String), invoice_id: expect.any(String), booking_id: "stale-snapshot-booking", amount_cents: 10000, payment_method: "CASH" });
    expect(await db.prepare("SELECT COUNT(*) count FROM financial_events WHERE booking_id='stale-snapshot-booking'").first()).toEqual({ count: 1 });

    await addCheckedIn("stale-charge-booking", "stale-charge-room", 10000);
    let chargeCommittedBetweenReadAndBatch = false;
    const interposedChargeDb = {
      prepare: (...args: Parameters<D1Database["prepare"]>) => db.prepare(...args),
      batch: async (statements: Parameters<D1Database["batch"]>[0]) => {
        if (!chargeCommittedBetweenReadAndBatch) {
          chargeCommittedBetweenReadAndBatch = true;
          expect(await billing.recordExtraCharge({ bookingId: "stale-charge-booking", expectedTotalCents: 10000, description: "Interleaved charge", amountCents: 2500, category: "OTHER", actor: { subject: "actor", requestId: "stale-charge", hotelId: "hotel-a" } }, null)).toBe(true);
        }
        return db.batch(statements);
      },
    } as OperationalDatabase;
    const staleChargeRepository = new D1LifecycleRepository(interposedChargeDb);
    const staleChargeCheckout = await staleChargeRepository.checkout(checkedInBooking("stale-charge-booking", "stale-charge-room"), "pending-approved", "approved-reference", { subject: "actor", requestId: "stale-charge-checkout", hotelId: "hotel-a" });
    expect(chargeCommittedBetweenReadAndBatch).toBe(true);
    expect(staleChargeCheckout.ok).toBe(false);
    expect(await db.prepare("SELECT status,total_cents FROM bookings WHERE id='stale-charge-booking'").first()).toEqual({ status: "CHECKED_IN", total_cents: 12500 });
    expect(await db.prepare("SELECT status,room_state_version FROM rooms WHERE id='stale-charge-room'").first()).toEqual({ status: "OCCUPIED", room_state_version: 1 });
    expect(await db.prepare("SELECT COUNT(*) count FROM room_inventory_nights WHERE booking_id='stale-charge-booking'").first()).toEqual({ count: 2 });
    expect(await db.prepare("SELECT COUNT(*) count FROM extra_charges WHERE booking_id='stale-charge-booking'").first()).toEqual({ count: 1 });
    expect(await db.prepare("SELECT COUNT(*) count FROM invoices WHERE booking_id='stale-charge-booking'").first()).toEqual({ count: 0 });
    expect(await db.prepare("SELECT COUNT(*) count FROM lifecycle_events WHERE booking_id='stale-charge-booking'").first()).toEqual({ count: 0 });
    expect(await db.prepare("SELECT event_type FROM financial_events WHERE booking_id='stale-charge-booking' ORDER BY event_type").all()).toMatchObject({ results: [{ event_type: "EXTRA_CHARGE" }, { event_type: "PRICE_RECONCILIATION" }] });
    const refreshedChargeCheckout = await repository.checkout(checkedInBooking("stale-charge-booking", "stale-charge-room"), "pending-approved", "approved-reference", { subject: "actor", requestId: "stale-charge-checkout-refreshed", hotelId: "hotel-a" });
    expect(refreshedChargeCheckout.ok).toBe(true);
    const refreshedChargeEvent = await db.prepare("SELECT details_json FROM lifecycle_events WHERE booking_id='stale-charge-booking' AND event_type='CHECK_OUT'").first<{ details_json: string }>();
    expect(JSON.parse(refreshedChargeEvent!.details_json)).toMatchObject({ booking_total_cents: 12500, invoice_amount_cents: 12500, paid_amount_cents: 0, ledger_paid_cents: 0, remaining_cents: 12500, credit_cents: 0, paid_at: null });
  }, 30000);
});
