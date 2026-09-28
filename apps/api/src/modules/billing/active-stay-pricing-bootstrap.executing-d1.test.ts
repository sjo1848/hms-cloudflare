import { afterEach, describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { convertV4MiniflareOptions, Miniflare } from "miniflare";
import type { OperationalDatabase } from "../../routing";
import { createActiveStayPricingManifest, type ActiveStayPricingSource, type HistoricalRateEvidence } from "./active-stay-pricing-bootstrap";
import { activateSyntheticActiveStayPricing, stageActiveStayPricingManifest } from "./d1-active-stay-pricing-bootstrap";
import { createReassignmentQuote } from "./d1-stay-pricing";

const miniflares: Miniflare[] = [];
afterEach(async () => Promise.all(miniflares.splice(0).map(mf => mf.dispose())));

async function applyMigration(db: D1Database, path: string) {
  const sql = readFileSync(path, "utf8");
  const statements: string[] = [];
  let buffer = "";
  let inTrigger = false;
  for (const rawLine of sql.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("--")) continue;
    const startsTrigger = !inTrigger && /^CREATE TRIGGER\b/i.test(line);
    if (startsTrigger) inTrigger = true;
    buffer += `${rawLine}\n`;
    if ((inTrigger && (line === "END;" || (startsTrigger && /\bEND;\s*$/i.test(line)))) || (!inTrigger && line.endsWith(";"))) {
      statements.push(buffer.trim()); buffer = ""; inTrigger = false;
    }
  }
  if (buffer.trim()) throw new Error(`Unterminated migration statement: ${path}`);
  for (const [index, statement] of statements.entries()) {
    try { await db.prepare(statement).run(); }
    catch (error) { throw new Error(`Migration ${path}, statement ${index + 1}: ${statement.slice(0, 260)}`, { cause: error }); }
  }
}

async function database() {
  const mf = new Miniflare(convertV4MiniflareOptions({
    script: "export default { fetch() { return new Response('ok') } }", modules: true,
    d1Databases: { DB: `active-stay-bootstrap-${crypto.randomUUID()}` },
  }));
  miniflares.push(mf);
  const db = await mf.getD1Database("DB");
  const dir = new URL("../../../schema/hotel-migrations/", import.meta.url);
  for (const name of readdirSync(dir).filter(file => file.endsWith(".sql")).sort()) await applyMigration(db, join(dir.pathname, name));
  return db;
}

const sourceRates: HistoricalRateEvidence[] = [
  { sourceRef: "fixture:rate-a-20260920", roomId: "room-a", effectiveStart: "2026-09-20", effectiveEnd: "2026-09-21", rateCents: 8000, sourceRateVersion: 0 },
  { sourceRef: "fixture:rate-b-20260921", roomId: "room-b", effectiveStart: "2026-09-21", effectiveEnd: "2026-09-23", rateCents: 12000, sourceRateVersion: 0 },
];

async function seedTraceable(db: D1Database) {
  await db.prepare("INSERT INTO guests(id,full_name,email,created_at) VALUES('guest-a','Synthetic Guest','f06@test.invalid','2026-09-01T00:00:00.000Z')").run();
  await db.batch([
    db.prepare("INSERT INTO rooms(id,room_number,room_type,status,price_cents,housekeeping_state,service_state) VALUES('room-a','A','STANDARD','DIRTY',8000,'DIRTY','IN_SERVICE')"),
    db.prepare("INSERT INTO rooms(id,room_number,room_type,status,price_cents,housekeeping_state,service_state) VALUES('room-b','B','STANDARD','OCCUPIED',12000,NULL,'IN_SERVICE')"),
    db.prepare("INSERT INTO rooms(id,room_number,room_type,status,price_cents,housekeeping_state,service_state) VALUES('room-c','C','STANDARD','AVAILABLE',17000,'READY','IN_SERVICE')"),
  ]);
  await db.prepare("UPDATE rooms SET price_cents=18000 WHERE id='room-b'").run();
  await db.prepare(`INSERT INTO bookings(id,guest_id,room_id,check_in,check_out,status,total_cents,notes,checked_in_at,checked_in_by,created_at,updated_at)
    VALUES('stay-a','guest-a','room-b','2026-09-20','2026-09-23','CHECKED_IN',32500,NULL,'2026-09-20T01:00:00.000Z','synthetic-actor','2026-09-20T00:00:00.000Z','2026-09-20T01:00:00.000Z')`).run();
  await db.batch([
    db.prepare("INSERT INTO room_inventory_nights(room_id,stay_date,booking_id) VALUES('room-a','2026-09-20','stay-a')"),
    db.prepare("INSERT INTO room_inventory_nights(room_id,stay_date,booking_id) VALUES('room-b','2026-09-21','stay-a')"),
    db.prepare("INSERT INTO room_inventory_nights(room_id,stay_date,booking_id) VALUES('room-b','2026-09-22','stay-a')"),
  ]);
  await db.prepare("INSERT INTO extra_charges(id,booking_id,description,amount_cents,category,created_at) VALUES('charge-a','stay-a','Synthetic breakfast',500,'OTHER','2026-09-20T02:00:00.000Z')").run();
  await db.prepare("INSERT INTO invoices(id,booking_id,amount_cents,paid_amount_cents,status,payment_method,payment_reference,paid_at,created_at) VALUES('invoice-a','stay-a',32500,5000,'PENDING','CARD','receipt-a',NULL,'2026-09-20T02:00:00.000Z')").run();
  await db.prepare(`INSERT INTO payment_entries(id,invoice_id,booking_id,amount_cents,payment_method,payment_reference,note,received_by_user_id,received_at,operation_token)
    VALUES('payment-a','invoice-a','stay-a',5000,'CARD','receipt-a','synthetic deposit','synthetic-actor','2026-09-20T02:30:00.000Z','f06-payment-a')`).run();
}

async function seedExistingCanonicalSegments(db: D1Database) {
  await db.prepare("UPDATE bookings SET last_pricing_operation_token='existing-segment-1' WHERE id='stay-a'").run();
  await db.prepare(`INSERT INTO booking_pricing_segments
    (segment_id,booking_id,room_id,effective_start,effective_end,rate_cents,room_pricing_version,segment_version,
     operation_token,actor_subject,hotel_id,request_id,created_at)
    VALUES('existing-segment-1','stay-a','room-b','2026-09-20','2026-09-21',8000,1,1,
      'existing-segment-1','synthetic-legacy','synthetic-hotel','existing-request-1','2026-09-20T00:00:00.000Z')`).run();
  await db.prepare("UPDATE bookings SET last_pricing_operation_token='existing-segment-2' WHERE id='stay-a'").run();
  await db.prepare(`INSERT INTO booking_pricing_segments
    (segment_id,booking_id,room_id,effective_start,effective_end,rate_cents,room_pricing_version,segment_version,
     operation_token,actor_subject,hotel_id,request_id,created_at)
    VALUES('existing-segment-2','stay-a','room-b','2026-09-21','2026-09-23',12000,1,2,
      'existing-segment-2','synthetic-legacy','synthetic-hotel','existing-request-2','2026-09-20T00:00:01.000Z')`).run();
}

async function sourceFor(db: D1Database, bookingId: string, historicalRates: HistoricalRateEvidence[] = sourceRates, hotelId = "synthetic-hotel"): Promise<ActiveStayPricingSource> {
  const b = await db.prepare(`SELECT id,status,room_id,check_in,check_out,total_cents,pricing_version,last_pricing_operation_token,updated_at
    FROM bookings WHERE id=?1`).bind(bookingId).first<any>();
  if (!b) throw new Error(`Missing fixture booking ${bookingId}`);
  const roomIds = [...new Set([b.room_id, ...historicalRates.map(rate => rate.roomId)])];
  const roomSlots = roomIds.map(() => "?").join(",");
  const rooms = await db.prepare(`SELECT id,price_cents,pricing_version,inventory_version,room_state_version FROM rooms WHERE id IN (${roomSlots}) ORDER BY id`).bind(...roomIds).all<any>();
  const inventory = await db.prepare(`SELECT room_id,stay_date,booking_id FROM room_inventory_nights
    WHERE room_id IN (${roomSlots}) AND stay_date>=? AND stay_date<? ORDER BY booking_id,room_id,stay_date`)
    .bind(...roomIds, b.check_in, b.check_out).all<any>();
  const charges = await db.prepare(`SELECT id,amount_cents,description,category,created_at FROM extra_charges WHERE booking_id=?1 ORDER BY id`).bind(bookingId).all<any>();
  const invoice = await db.prepare(`SELECT id,amount_cents,paid_amount_cents,status,payment_method,payment_reference,paid_at,created_at
    FROM invoices WHERE booking_id=?1`).bind(bookingId).first<any>();
  const payments = invoice ? await db.prepare(`SELECT id,booking_id,amount_cents,payment_method,payment_reference,note,received_by_user_id,received_at,operation_token
    FROM payment_entries WHERE invoice_id=?1 ORDER BY id`).bind(invoice.id).all<any>() : { results: [] };
  const pricingSegments = await db.prepare(`SELECT segment_id,booking_id,room_id,effective_start,effective_end,rate_cents,
    room_pricing_version,segment_version,operation_token,actor_subject,hotel_id,request_id,created_at
    FROM booking_pricing_segments WHERE booking_id=?1 ORDER BY segment_version,segment_id`).bind(bookingId).all<any>();
  return {
    hotelId, currencyBasis: "ARS", booking: {
      id: b.id, status: b.status, roomId: b.room_id, checkIn: b.check_in, checkOut: b.check_out,
      totalCents: b.total_cents, pricingVersion: b.pricing_version,
      lastPricingOperationToken: b.last_pricing_operation_token, updatedAt: b.updated_at,
    },
    rooms: rooms.results.map(row => ({ id: row.id, priceCents: row.price_cents, pricingVersion: row.pricing_version,
      inventoryVersion: row.inventory_version, roomStateVersion: row.room_state_version })),
    pricingSegments: pricingSegments.results.map(row => ({
      segmentId: row.segment_id, bookingId: row.booking_id, roomId: row.room_id,
      effectiveStart: row.effective_start, effectiveEnd: row.effective_end, rateCents: row.rate_cents,
      roomPricingVersion: row.room_pricing_version, segmentVersion: row.segment_version,
      operationToken: row.operation_token, actorSubject: row.actor_subject, hotelId: row.hotel_id,
      requestId: row.request_id, createdAt: row.created_at,
    })),
    inventory: inventory.results.map(row => ({ roomId: row.room_id, stayDate: row.stay_date, bookingId: row.booking_id })),
    charges: charges.results.map(row => ({ id: row.id, amountCents: row.amount_cents, description: row.description,
      category: row.category, createdAt: row.created_at })),
    invoice: invoice ? { id: invoice.id, amountCents: invoice.amount_cents, paidAmountCents: invoice.paid_amount_cents,
      status: invoice.status, paymentMethod: invoice.payment_method, paymentReference: invoice.payment_reference,
      paidAt: invoice.paid_at, createdAt: invoice.created_at } : null,
    payments: payments.results.map(row => ({ id: row.id, bookingId: row.booking_id, amountCents: row.amount_cents,
      paymentMethod: row.payment_method, paymentReference: row.payment_reference, note: row.note,
      receivedByUserId: row.received_by_user_id, receivedAt: row.received_at, operationToken: row.operation_token })),
    historicalRates,
  };
}

async function productSnapshot(db: D1Database, bookingId: string) {
  const [booking, rooms, inventory, segments, charges, invoice, payments, lifecycle, financial] = await Promise.all([
    db.prepare("SELECT * FROM bookings WHERE id=?1").bind(bookingId).first(),
    db.prepare("SELECT id,status,price_cents,pricing_version,inventory_version,room_state_version FROM rooms ORDER BY id").all(),
    db.prepare("SELECT room_id,stay_date,booking_id FROM room_inventory_nights WHERE booking_id=?1 ORDER BY room_id,stay_date").bind(bookingId).all(),
    db.prepare("SELECT * FROM booking_pricing_segments WHERE booking_id=?1 ORDER BY segment_version").bind(bookingId).all(),
    db.prepare("SELECT * FROM extra_charges WHERE booking_id=?1 ORDER BY id").bind(bookingId).all(),
    db.prepare("SELECT * FROM invoices WHERE booking_id=?1").bind(bookingId).all(),
    db.prepare("SELECT * FROM payment_entries WHERE booking_id=?1 ORDER BY id").bind(bookingId).all(),
    db.prepare("SELECT * FROM lifecycle_events WHERE booking_id=?1 ORDER BY id").bind(bookingId).all(),
    db.prepare("SELECT * FROM financial_events WHERE booking_id=?1 ORDER BY id").bind(bookingId).all(),
  ]);
  return { booking, rooms: rooms.results, inventory: inventory.results, segments: segments.results, charges: charges.results,
    invoice: invoice.results, payments: payments.results, lifecycle: lifecycle.results, financial: financial.results };
}

describe("F0.6 active-stay bootstrap classifier and D1 shadow/activation", () => {
  it("classifies all five contract classes without inferring rates and is deterministic", async () => {
    const db = await database();
    await seedTraceable(db);
    const traceable = await sourceFor(db, "stay-a");
    const aggregate = { ...traceable, booking: { ...traceable.booking, id: "aggregate", roomId: "room-c", totalCents: 10000 },
      rooms: [...traceable.rooms, { id: "room-c", priceCents: 17000, pricingVersion: 0, inventoryVersion: 0, roomStateVersion: 0 }],
      invoice: { ...traceable.invoice!, id: "invoice-aggregate", amountCents: 10000, paidAmountCents: 0, status: "PENDING" },
      charges: [], payments: [], inventory: [], historicalRates: [] };
    const mismatch = { ...aggregate, booking: { ...aggregate.booking, id: "mismatch" },
      invoice: { ...aggregate.invoice!, id: "invoice-mismatch", paidAmountCents: 1 } };
    const voided = { ...aggregate, booking: { ...aggregate.booking, id: "voided" },
      invoice: { ...aggregate.invoice!, id: "invoice-voided", status: "VOIDED" } };
    const conflict = { ...aggregate, booking: { ...aggregate.booking, id: "conflict" },
      historicalRates: [sourceRates[0], sourceRates[0]], inventory: [] };
    const sources = [traceable, aggregate, mismatch, voided, conflict].map(source => ({ ...source, hotelId: "synthetic-hotel" }));
    const before = await productSnapshot(db, "stay-a");
    const manifest = await createActiveStayPricingManifest("synthetic-hotel", sources);
    const again = await createActiveStayPricingManifest("synthetic-hotel", [...sources].reverse());
    expect(manifest).toEqual(again);
    expect(manifest.candidates.map(candidate => [candidate.bookingId, candidate.classification])).toEqual([
      ["aggregate", "TRACEABLE_AGGREGATE_ONLY"], ["conflict", "ORPHAN_OR_CONFLICT"],
      ["mismatch", "ACCOUNT_MISMATCH"], ["stay-a", "TRACEABLE_SEGMENTS"], ["voided", "VOIDED"],
    ]);
    expect(manifest.candidates.find(candidate => candidate.bookingId === "stay-a")?.lodgingTotalCents).toBe(32000);
    expect(manifest.candidates.find(candidate => candidate.bookingId === "aggregate")?.segments).toEqual([]);
    expect(manifest.candidates.find(candidate => candidate.bookingId === "aggregate")?.sourceSnapshot.rooms.find(room => room.id === "room-c")?.priceCents).toBe(17000);
    expect(manifest.candidates.find(candidate => candidate.bookingId === "conflict")?.blockers).toContain("HISTORICAL_RATE_OVERLAP_OR_OUTSIDE_STAY");
    expect(await productSnapshot(db, "stay-a")).toEqual(before);

    const run = await stageActiveStayPricingManifest(db as unknown as OperationalDatabase, manifest, "2026-09-24T00:00:00.000Z");
    expect(run.status).toBe("SHADOWED");
    expect(await db.prepare("SELECT booking_id,classification,status FROM active_stay_bootstrap_candidates ORDER BY booking_id").all())
      .toMatchObject({ results: [
        { booking_id: "aggregate", classification: "TRACEABLE_AGGREGATE_ONLY", status: "HELD" },
        { booking_id: "conflict", classification: "ORPHAN_OR_CONFLICT", status: "HELD" },
        { booking_id: "mismatch", classification: "ACCOUNT_MISMATCH", status: "HELD" },
        { booking_id: "stay-a", classification: "TRACEABLE_SEGMENTS", status: "SHADOWED" },
        { booking_id: "voided", classification: "VOIDED", status: "HELD" },
      ] });
    expect(await productSnapshot(db, "stay-a")).toEqual(before);

    expect((await activateSyntheticActiveStayPricing(db as unknown as OperationalDatabase, manifest,
      { subject: "synthetic-fixture-operator", requestId: "synthetic-mixed-rehearsal" }, "2026-09-24T00:00:30.000Z")).status).toBe("COMPLETE");
    expect(await db.prepare("SELECT booking_id,status FROM active_stay_bootstrap_candidates ORDER BY booking_id").all())
      .toMatchObject({ results: [
        { booking_id: "aggregate", status: "HELD" }, { booking_id: "conflict", status: "HELD" },
        { booking_id: "mismatch", status: "HELD" }, { booking_id: "stay-a", status: "ACTIVATED" },
        { booking_id: "voided", status: "HELD" },
      ] });
    expect(await db.prepare("SELECT total_cents FROM bookings WHERE id='stay-a'").first()).toEqual({ total_cents: 32500 });

    const paidSources = [
      { ...traceable, booking: { ...traceable.booking, id: "full-paid" },
        invoice: { ...traceable.invoice!, id: "invoice-full", paidAmountCents: 32500, status: "PAID", paidAt: "2026-09-23T12:00:00.000Z" },
        inventory: traceable.inventory.map(claim => ({ ...claim, bookingId: "full-paid" })),
        payments: traceable.payments.map(payment => ({ ...payment, id: "payment-full", bookingId: "full-paid", amountCents: 32500 })) },
      { ...traceable, booking: { ...traceable.booking, id: "overpaid-credit" },
        invoice: { ...traceable.invoice!, id: "invoice-credit", paidAmountCents: 33000, status: "PAID", paidAt: "2026-09-23T12:00:00.000Z" },
        inventory: traceable.inventory.map(claim => ({ ...claim, bookingId: "overpaid-credit" })),
        payments: traceable.payments.map(payment => ({ ...payment, id: "payment-credit", bookingId: "overpaid-credit", amountCents: 33000 })) },
    ];
    const accountStates = await createActiveStayPricingManifest("synthetic-hotel", paidSources);
    expect(accountStates.candidates.map(candidate => candidate.classification)).toEqual(["TRACEABLE_SEGMENTS", "TRACEABLE_SEGMENTS"]);
    expect(accountStates.candidates.map(candidate => candidate.accountTotalCents)).toEqual([32500, 32500]);
    await expect(createActiveStayPricingManifest("synthetic-hotel", [{ ...traceable, hotelId: "foreign-hotel" }])).rejects.toThrow(/cross-hotel/i);
  }, 30_000);

  it("shadows and activates only exact traceable synthetic evidence; replay is idempotent and D11 truth stays byte-equivalent", async () => {
    const db = await database();
    await seedTraceable(db);
    const before = await productSnapshot(db, "stay-a");
    const beforeQuote = await createReassignmentQuote(db as unknown as OperationalDatabase, "stay-a", "room-c", "2026-09-21");
    const manifest = await createActiveStayPricingManifest("synthetic-hotel", [await sourceFor(db, "stay-a")]);
    const staged = await stageActiveStayPricingManifest(db as unknown as OperationalDatabase, manifest, "2026-09-24T00:00:00.000Z");
    expect(staged.status).toBe("SHADOWED");
    expect(await stageActiveStayPricingManifest(db as unknown as OperationalDatabase, manifest, "2026-09-24T00:00:01.000Z")).toMatchObject({ status: "SHADOWED" });
    expect(await createReassignmentQuote(db as unknown as OperationalDatabase, "stay-a", "room-c", "2026-09-21")).toEqual(beforeQuote);
    expect(await productSnapshot(db, "stay-a")).toEqual(before);
    expect(await db.prepare("SELECT COUNT(*) count FROM active_stay_bootstrap_candidates WHERE booking_id='stay-a'").first()).toEqual({ count: 1 });
    expect(await db.prepare("SELECT COUNT(*) count FROM active_stay_bootstrap_candidate_segments").first()).toEqual({ count: 2 });

    const activated = await activateSyntheticActiveStayPricing(db as unknown as OperationalDatabase, manifest,
      { subject: "synthetic-f0.6-operator", requestId: "synthetic-f0.6-activation" }, "2026-09-24T00:01:00.000Z");
    expect(activated.status).toBe("COMPLETE");
    const after = await productSnapshot(db, "stay-a");
    expect(after.booking).toMatchObject({ total_cents: 32500, status: "CHECKED_IN", room_id: "room-b", pricing_version: 2 });
    expect(after.charges).toEqual(before.charges);
    expect(after.invoice).toEqual(before.invoice);
    expect(after.payments).toEqual(before.payments);
    expect(after.inventory).toEqual(before.inventory);
    expect(after.lifecycle).toEqual(before.lifecycle);
    expect(after.financial).toEqual(before.financial);
    expect(after.rooms.map((room: any) => ({ id: room.id, status: room.status, price_cents: room.price_cents })))
      .toEqual(before.rooms.map((room: any) => ({ id: room.id, status: room.status, price_cents: room.price_cents })));
    expect(after.segments).toMatchObject([
      { room_id: "room-a", effective_start: "2026-09-20", effective_end: "2026-09-21", rate_cents: 8000, room_pricing_version: 0, segment_version: 1 },
      { room_id: "room-b", effective_start: "2026-09-21", effective_end: "2026-09-23", rate_cents: 12000, room_pricing_version: 0, segment_version: 2 },
    ]);
    expect(after.segments.map((segment: any) => ({ actor_subject: segment.actor_subject, hotel_id: segment.hotel_id, request_id: segment.request_id })))
      .toEqual([
        { actor_subject: "synthetic-f0.6-operator", hotel_id: "synthetic-hotel", request_id: "synthetic-f0.6-activation" },
        { actor_subject: "synthetic-f0.6-operator", hotel_id: "synthetic-hotel", request_id: "synthetic-f0.6-activation" },
      ]);
    expect(await createReassignmentQuote(db as unknown as OperationalDatabase, "stay-a", "room-c", "2026-09-21"))
      .toMatchObject({ currentLodgingTotalCents: 32000, currentTotalCents: 32500, extraChargesCents: 500 });
    const replay = await activateSyntheticActiveStayPricing(db as unknown as OperationalDatabase, manifest,
      { subject: "synthetic-f0.6-operator", requestId: "synthetic-f0.6-activation" }, "2026-09-24T00:02:00.000Z");
    expect(replay.status).toBe("COMPLETE");
    expect(await productSnapshot(db, "stay-a")).toEqual(after);
  }, 30_000);

  it("quarantines conflicting duplicate room snapshot identities instead of silently collapsing them", async () => {
    const db = await database();
    await seedTraceable(db);
    const source = await sourceFor(db, "stay-a");
    source.rooms.push({ ...source.rooms[0], priceCents: source.rooms[0].priceCents + 1 });
    const manifest = await createActiveStayPricingManifest("synthetic-hotel", [source]);
    expect(manifest.candidates[0]).toMatchObject({
      classification: "ORPHAN_OR_CONFLICT",
      blockers: expect.arrayContaining(["DUPLICATE_ROOM_SNAPSHOT_ID"]),
      segments: [],
    });

    const before = await productSnapshot(db, "stay-a");
    await stageActiveStayPricingManifest(db as unknown as OperationalDatabase, manifest, "2026-09-24T00:00:00.000Z");
    expect(await db.prepare("SELECT status,classification FROM active_stay_bootstrap_candidates WHERE booking_id='stay-a'").first())
      .toEqual({ status: "HELD", classification: "ORPHAN_OR_CONFLICT" });
    await expect(activateSyntheticActiveStayPricing(db as unknown as OperationalDatabase, manifest,
      { subject: "synthetic", requestId: "duplicate-room-attempt" }, "2026-09-24T00:01:00.000Z"))
      .rejects.toThrow(/No traceable synthetic stay/);
    expect(await productSnapshot(db, "stay-a")).toEqual(before);
    expect(await db.prepare("SELECT COUNT(*) count FROM booking_pricing_segments WHERE booking_id='stay-a'").first()).toEqual({ count: 0 });
  }, 30_000);

  it("holds an already segmented canonical stay without layering bootstrap segments over F0.5 pricing", async () => {
    const db = await database();
    await seedTraceable(db);
    await seedExistingCanonicalSegments(db);
    const before = await productSnapshot(db, "stay-a");
    const manifest = await createActiveStayPricingManifest("synthetic-hotel", [await sourceFor(db, "stay-a")]);
    expect(manifest.candidates[0]).toMatchObject({
      classification: "ORPHAN_OR_CONFLICT",
      blockers: expect.arrayContaining(["CANONICAL_PRICING_SEGMENTS_PRESENT"]),
      segments: [],
    });

    await stageActiveStayPricingManifest(db as unknown as OperationalDatabase, manifest, "2026-09-24T00:00:00.000Z");
    expect(await db.prepare("SELECT status FROM active_stay_bootstrap_candidates WHERE booking_id='stay-a'").first())
      .toEqual({ status: "HELD" });
    await expect(activateSyntheticActiveStayPricing(db as unknown as OperationalDatabase, manifest,
      { subject: "synthetic", requestId: "already-segmented-attempt" }, "2026-09-24T00:01:00.000Z"))
      .rejects.toThrow(/No traceable synthetic stay/);
    expect(await productSnapshot(db, "stay-a")).toEqual(before);
    expect(await db.prepare("SELECT COUNT(*) count FROM booking_pricing_segments WHERE booking_id='stay-a'").first()).toEqual({ count: 2 });
  }, 30_000);

  it("rejects a canonical segment set added after shadowing even when booking version fields are restored", async () => {
    const db = await database();
    await seedTraceable(db);
    const source = await sourceFor(db, "stay-a");
    const manifest = await createActiveStayPricingManifest("synthetic-hotel", [source]);
    await stageActiveStayPricingManifest(db as unknown as OperationalDatabase, manifest, "2026-09-24T00:00:00.000Z");
    await db.prepare("UPDATE bookings SET last_pricing_operation_token='external-segment' WHERE id='stay-a'").run();
    await db.prepare(`INSERT INTO booking_pricing_segments
      (segment_id,booking_id,room_id,effective_start,effective_end,rate_cents,room_pricing_version,segment_version,
       operation_token,actor_subject,hotel_id,request_id,created_at)
      VALUES('external-segment','stay-a','room-b','2026-09-20','2026-09-23',10000,1,1,
        'external-segment','synthetic-external','synthetic-hotel','external-request','2026-09-24T00:00:30.000Z')`).run();
    await db.prepare(`UPDATE bookings SET pricing_version=?2,last_pricing_operation_token=?3,updated_at=?4 WHERE id=?1`)
      .bind(source.booking.id, source.booking.pricingVersion, source.booking.lastPricingOperationToken, source.booking.updatedAt).run();
    const beforeAttempt = await productSnapshot(db, "stay-a");
    expect(beforeAttempt.booking).toMatchObject({ pricing_version: 0, last_pricing_operation_token: null });
    expect(beforeAttempt.segments).toHaveLength(1);

    await expect(activateSyntheticActiveStayPricing(db as unknown as OperationalDatabase, manifest,
      { subject: "synthetic", requestId: "segment-set-stale-attempt" }, "2026-09-24T00:01:00.000Z"))
      .rejects.toThrow(/canonical pricing segment snapshot is stale/i);
    expect(await productSnapshot(db, "stay-a")).toEqual(beforeAttempt);
    expect(await db.prepare("SELECT status FROM active_stay_bootstrap_runs").first()).toEqual({ status: "SHADOWED" });
    expect(await db.prepare("SELECT status FROM active_stay_bootstrap_candidates WHERE booking_id='stay-a'").first())
      .toEqual({ status: "SHADOWED" });
  }, 30_000);

  it("converges concurrent activation attempts without duplicate segments or financial drift", async () => {
    const db = await database();
    await seedTraceable(db);
    const manifest = await createActiveStayPricingManifest("synthetic-hotel", [await sourceFor(db, "stay-a")]);
    await stageActiveStayPricingManifest(db as unknown as OperationalDatabase, manifest, "2026-09-24T00:00:00.000Z");
    const before = await productSnapshot(db, "stay-a");

    const results = await Promise.all([
      activateSyntheticActiveStayPricing(db as unknown as OperationalDatabase, manifest,
        { subject: "synthetic-a", requestId: "concurrent-activation-a" }, "2026-09-24T00:01:00.000Z"),
      activateSyntheticActiveStayPricing(db as unknown as OperationalDatabase, manifest,
        { subject: "synthetic-b", requestId: "concurrent-activation-b" }, "2026-09-24T00:01:00.001Z"),
    ]);
    expect(results.map(result => result.status)).toEqual(["COMPLETE", "COMPLETE"]);
    expect(await db.prepare("SELECT COUNT(*) count FROM booking_pricing_segments WHERE booking_id='stay-a'").first()).toEqual({ count: 2 });
    expect(await db.prepare("SELECT status FROM active_stay_bootstrap_candidates WHERE booking_id='stay-a'").first()).toEqual({ status: "ACTIVATED" });
    const after = await productSnapshot(db, "stay-a");
    expect(after.booking.total_cents).toBe(before.booking.total_cents);
    expect(after.charges).toEqual(before.charges);
    expect(after.invoice).toEqual(before.invoice);
    expect(after.payments).toEqual(before.payments);
    expect(after.inventory).toEqual(before.inventory);
  }, 30_000);

  it("isolates per-hotel checkpoints across independent operational D1 databases", async () => {
    const dbA = await database();
    const dbB = await database();
    await Promise.all([seedTraceable(dbA), seedTraceable(dbB)]);
    const manifestA = await createActiveStayPricingManifest("hotel-a", [await sourceFor(dbA, "stay-a", sourceRates, "hotel-a")]);
    const manifestB = await createActiveStayPricingManifest("hotel-b", [await sourceFor(dbB, "stay-a", sourceRates, "hotel-b")]);
    const runA = await stageActiveStayPricingManifest(dbA as unknown as OperationalDatabase, manifestA, "2026-09-24T00:00:00.000Z");
    const runB = await stageActiveStayPricingManifest(dbB as unknown as OperationalDatabase, manifestB, "2026-09-24T00:00:00.000Z");
    expect(runA.run_id).not.toBe(runB.run_id);

    await activateSyntheticActiveStayPricing(dbA as unknown as OperationalDatabase, manifestA,
      { subject: "synthetic-hotel-a", requestId: "hotel-a-activation" }, "2026-09-24T00:01:00.000Z");
    expect(await dbA.prepare("SELECT status FROM active_stay_bootstrap_runs").first()).toEqual({ status: "COMPLETE" });
    expect(await dbB.prepare("SELECT status FROM active_stay_bootstrap_runs").first()).toEqual({ status: "SHADOWED" });
    expect(await dbA.prepare("SELECT COUNT(*) count FROM booking_pricing_segments WHERE booking_id='stay-a'").first()).toEqual({ count: 2 });
    expect(await dbB.prepare("SELECT COUNT(*) count FROM booking_pricing_segments WHERE booking_id='stay-a'").first()).toEqual({ count: 0 });
  }, 30_000);

  it("rolls back a partial shadow checkpoint and resumes from the same manifest", async () => {
    const db = await database();
    await seedTraceable(db);
    const manifest = await createActiveStayPricingManifest("synthetic-hotel", [await sourceFor(db, "stay-a")]);
    await db.prepare(`CREATE TRIGGER f06_injected_shadow_failure BEFORE INSERT ON active_stay_bootstrap_snapshot_inventory
      BEGIN SELECT RAISE(ABORT,'injected F0.6 shadow checkpoint failure'); END`).run();

    await expect(stageActiveStayPricingManifest(db as unknown as OperationalDatabase, manifest, "2026-09-24T00:00:00.000Z"))
      .rejects.toThrow(/injected F0.6 shadow checkpoint failure/);
    expect(await db.prepare("SELECT COUNT(*) count FROM active_stay_bootstrap_runs").first()).toEqual({ count: 0 });
    expect(await db.prepare("SELECT COUNT(*) count FROM active_stay_bootstrap_candidates").first()).toEqual({ count: 0 });
    expect(await db.prepare("SELECT COUNT(*) count FROM active_stay_bootstrap_heads").first()).toEqual({ count: 0 });
    expect(await db.prepare("SELECT COUNT(*) count FROM booking_pricing_segments").first()).toEqual({ count: 0 });

    await db.prepare("DROP TRIGGER f06_injected_shadow_failure").run();
    expect((await stageActiveStayPricingManifest(db as unknown as OperationalDatabase, manifest, "2026-09-24T00:01:00.000Z")).status)
      .toBe("SHADOWED");
    expect(await db.prepare("SELECT COUNT(*) count FROM active_stay_bootstrap_snapshot_inventory").first()).toEqual({ count: 3 });
  }, 30_000);

  it("rejects changed equal-count payment truth and source-digest supersession with zero activation drift", async () => {
    const db = await database();
    await seedTraceable(db);
    const first = await createActiveStayPricingManifest("synthetic-hotel", [await sourceFor(db, "stay-a")]);
    await stageActiveStayPricingManifest(db as unknown as OperationalDatabase, first, "2026-09-24T00:00:00.000Z");
    await db.prepare("UPDATE payment_entries SET payment_reference='substituted-equal-count' WHERE id='payment-a'").run();
    const drifted = await productSnapshot(db, "stay-a");
    await expect(activateSyntheticActiveStayPricing(db as unknown as OperationalDatabase, first,
      { subject: "synthetic", requestId: "stale-attempt" }, "2026-09-24T00:01:00.000Z")).rejects.toThrow(/stale|digest|snapshot/i);
    expect(await productSnapshot(db, "stay-a")).toEqual(drifted);
    expect(await db.prepare("SELECT status FROM active_stay_bootstrap_runs").first()).toEqual({ status: "SHADOWED" });

    const second = await createActiveStayPricingManifest("synthetic-hotel", [await sourceFor(db, "stay-a",
      sourceRates.map(rate => ({ ...rate, sourceRef: `${rate.sourceRef}:corrected` })))]);
    await stageActiveStayPricingManifest(db as unknown as OperationalDatabase, second, "2026-09-24T00:02:00.000Z");
    expect(await db.prepare("SELECT status FROM active_stay_bootstrap_runs WHERE source_digest=?1").bind(first.sourceDigest).first()).toEqual({ status: "BLOCKED" });
    await expect(activateSyntheticActiveStayPricing(db as unknown as OperationalDatabase, first,
      { subject: "synthetic", requestId: "superseded-attempt" }, "2026-09-24T00:03:00.000Z")).rejects.toThrow(/digest|current/i);
    expect(await productSnapshot(db, "stay-a")).toEqual(drifted);
    expect(await db.prepare("SELECT COUNT(*) count FROM booking_pricing_segments WHERE booking_id='stay-a'").first()).toEqual({ count: 0 });
  }, 30_000);

  it("rejects inventory ABA even when visible room-night keys are restored", async () => {
    const db = await database();
    await seedTraceable(db);
    const manifest = await createActiveStayPricingManifest("synthetic-hotel", [await sourceFor(db, "stay-a")]);
    await stageActiveStayPricingManifest(db as unknown as OperationalDatabase, manifest, "2026-09-24T00:00:00.000Z");
    const claimsBefore = (await db.prepare("SELECT room_id,stay_date,booking_id FROM room_inventory_nights WHERE booking_id='stay-a' ORDER BY room_id,stay_date").all()).results;
    await db.prepare("UPDATE room_inventory_nights SET room_id='room-c' WHERE booking_id='stay-a' AND room_id='room-a' AND stay_date='2026-09-20'").run();
    await db.prepare("UPDATE room_inventory_nights SET room_id='room-a' WHERE booking_id='stay-a' AND room_id='room-c' AND stay_date='2026-09-20'").run();
    expect((await db.prepare("SELECT room_id,stay_date,booking_id FROM room_inventory_nights WHERE booking_id='stay-a' ORDER BY room_id,stay_date").all()).results).toEqual(claimsBefore);
    const drifted = await productSnapshot(db, "stay-a");
    await expect(activateSyntheticActiveStayPricing(db as unknown as OperationalDatabase, manifest,
      { subject: "synthetic", requestId: "inventory-aba-attempt" }, "2026-09-24T00:01:00.000Z")).rejects.toThrow(/stale|digest|snapshot/i);
    expect(await productSnapshot(db, "stay-a")).toEqual(drifted);
    expect(await db.prepare("SELECT status FROM active_stay_bootstrap_runs").first()).toEqual({ status: "SHADOWED" });
    expect(await db.prepare("SELECT COUNT(*) count FROM booking_pricing_segments WHERE booking_id='stay-a'").first()).toEqual({ count: 0 });
  }, 30_000);

  it("rolls back all activation writes when a later canonical segment insert fails", async () => {
    const db = await database();
    await seedTraceable(db);
    const manifest = await createActiveStayPricingManifest("synthetic-hotel", [await sourceFor(db, "stay-a")]);
    await stageActiveStayPricingManifest(db as unknown as OperationalDatabase, manifest, "2026-09-24T00:00:00.000Z");
    const before = await productSnapshot(db, "stay-a");
    await db.prepare(`CREATE TRIGGER f06_injected_segment_failure BEFORE INSERT ON booking_pricing_segments
      WHEN NEW.segment_version=2 BEGIN SELECT RAISE(ABORT,'injected F0.6 late activation failure'); END`).run();
    await expect(activateSyntheticActiveStayPricing(db as unknown as OperationalDatabase, manifest,
      { subject: "synthetic", requestId: "rollback-attempt" }, "2026-09-24T00:01:00.000Z")).rejects.toThrow(/injected F0.6/);
    expect(await productSnapshot(db, "stay-a")).toEqual(before);
    expect(await db.prepare("SELECT status FROM active_stay_bootstrap_runs").first()).toEqual({ status: "SHADOWED" });
    expect(await db.prepare("SELECT status FROM active_stay_bootstrap_candidates WHERE booking_id='stay-a'").first()).toEqual({ status: "SHADOWED" });
  }, 30_000);
});
