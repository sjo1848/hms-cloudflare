import type { OperationalDatabase } from "../../routing";
import {
  ACTIVE_STAY_PRICING_MODEL,
  stableActiveStayManifestJson,
  verifyActiveStayPricingManifest,
  type ActiveStayPricingCandidate,
  type ActiveStayPricingManifest,
  type HistoricalRateEvidence,
} from "./active-stay-pricing-bootstrap";

export type BootstrapActor = { subject: string; requestId: string };
export type BootstrapRun = { run_id: string; hotel_id: string; source_digest: string; model_version: string; status: string };

function runId(manifest: ActiveStayPricingManifest): string {
  return `f0.6:${manifest.hotelId}:${manifest.modelVersion}:${manifest.sourceDigest}`;
}

function candidateId(id: string, bookingId: string): string {
  return `${id}:${bookingId}`;
}

function segmentToken(id: string, bookingId: string, index: number): string {
  return `${id}:${bookingId}:${index + 1}`;
}

function json(value: unknown): string {
  return JSON.stringify(value);
}

function assertManifest(manifest: ActiveStayPricingManifest): void {
  if (manifest.schemaVersion !== 1 || manifest.modelVersion !== ACTIVE_STAY_PRICING_MODEL
    || !manifest.hotelId || !/^[a-f0-9]{64}$/.test(manifest.sourceDigest)) throw new Error("Unsupported bootstrap manifest");
  const ids = new Set<string>();
  for (const candidate of manifest.candidates) {
    if (!candidate.bookingId || ids.has(candidate.bookingId) || candidate.sourceSnapshot.hotelId !== manifest.hotelId
      || candidate.sourceSnapshot.booking.id !== candidate.bookingId || candidate.sourceSnapshot.currencyBasis !== candidate.currencyBasis) {
      throw new Error("Bootstrap manifest tenant/booking identity mismatch");
    }
    ids.add(candidate.bookingId);
    if ((candidate.classification === "TRACEABLE_SEGMENTS") !== (candidate.segments.length > 0)) {
      throw new Error("Only traceable candidates may contain activation segments");
    }
  }
}

function candidateStatements(id: string, manifest: ActiveStayPricingManifest, candidate: ActiveStayPricingCandidate, now: string) {
  const cid = candidateId(id, candidate.bookingId);
  const cStatus = candidate.classification === "TRACEABLE_SEGMENTS" ? "SHADOWED" : "HELD";
  const statements = [
    {
      sql: `INSERT OR IGNORE INTO active_stay_bootstrap_candidates
        (candidate_id,run_id,hotel_id,booking_id,classification,status,baseline_source_json,candidate_json,source_digest,currency_basis,created_at)
        VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11)`,
      values: [cid, id, manifest.hotelId, candidate.bookingId, candidate.classification, cStatus,
        JSON.stringify(candidate.sourceSnapshot), JSON.stringify(candidate), manifest.sourceDigest, candidate.currencyBasis, now],
    },
    ...candidate.segments.map((segment: HistoricalRateEvidence, index) => ({
      sql: `INSERT OR IGNORE INTO active_stay_bootstrap_candidate_segments
        (candidate_id,segment_order,source_ref,room_id,effective_start,effective_end,rate_cents,source_rate_version,operation_token)
        VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9)`,
      values: [cid, index + 1, segment.sourceRef, segment.roomId, segment.effectiveStart, segment.effectiveEnd,
        segment.rateCents, segment.sourceRateVersion, segmentToken(id, candidate.bookingId, index)],
    })),
    ...candidate.sourceSnapshot.rooms.map(room => ({
      sql: `INSERT OR IGNORE INTO active_stay_bootstrap_snapshot_rooms
        (candidate_id,room_id,price_cents,pricing_version,inventory_version,room_state_version) VALUES (?1,?2,?3,?4,?5,?6)`,
      values: [cid, room.id, room.priceCents, room.pricingVersion, room.inventoryVersion, room.roomStateVersion],
    })),
    ...candidate.sourceSnapshot.inventory.map(claim => ({
      sql: `INSERT OR IGNORE INTO active_stay_bootstrap_snapshot_inventory
        (candidate_id,room_id,stay_date,booking_id) VALUES (?1,?2,?3,?4)`,
      values: [cid, claim.roomId, claim.stayDate, claim.bookingId],
    })),
    ...candidate.sourceSnapshot.charges.map(charge => ({
      sql: `INSERT OR IGNORE INTO active_stay_bootstrap_snapshot_charges
        (candidate_id,charge_id,amount_cents,description,category,created_at) VALUES (?1,?2,?3,?4,?5,?6)`,
      values: [cid, charge.id, charge.amountCents, charge.description, charge.category, charge.createdAt],
    })),
    ...candidate.sourceSnapshot.payments.map(payment => ({
      sql: `INSERT OR IGNORE INTO active_stay_bootstrap_snapshot_payments
        (candidate_id,payment_id,booking_id,amount_cents,payment_method,payment_reference,note,received_by_user_id,received_at,operation_token)
        VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10)`,
      values: [cid, payment.id, payment.bookingId, payment.amountCents, payment.paymentMethod,
        payment.paymentReference, payment.note, payment.receivedByUserId, payment.receivedAt, payment.operationToken],
    })),
  ];
  return statements;
}

/** Persist only isolated shadow/report state; this never touches operational pricing or account tables. */
export async function stageActiveStayPricingManifest(
  db: OperationalDatabase,
  manifest: ActiveStayPricingManifest,
  now: string,
): Promise<BootstrapRun> {
  assertManifest(manifest);
  if (!await verifyActiveStayPricingManifest(manifest)) throw new Error("Bootstrap manifest digest/classification verification failed");
  if (!/^\d{4}-\d\d-\d\dT/.test(now)) throw new Error("Bootstrap timestamp must be explicit ISO-8601");
  const id = runId(manifest);
  const statements = [
    db.prepare(`INSERT OR IGNORE INTO active_stay_bootstrap_runs
      (run_id,hotel_id,source_digest,model_version,status,manifest_json,created_at,updated_at)
      VALUES (?1,?2,?3,?4,'SHADOWED',?5,?6,?6)`)
      .bind(id, manifest.hotelId, manifest.sourceDigest, manifest.modelVersion, stableActiveStayManifestJson(manifest), now),
    ...manifest.candidates.flatMap(candidate => candidateStatements(id, manifest, candidate, now).map(statement =>
      db.prepare(statement.sql).bind(...statement.values))),
    db.prepare(`UPDATE active_stay_bootstrap_runs SET status='BLOCKED',updated_at=?3
      WHERE hotel_id=?1 AND model_version=?2 AND source_digest<>?4 AND status='SHADOWED'`)
      .bind(manifest.hotelId, manifest.modelVersion, now, manifest.sourceDigest),
    db.prepare(`INSERT INTO active_stay_bootstrap_heads(hotel_id,model_version,source_digest,run_id,updated_at)
      VALUES (?1,?2,?3,?4,?5)
      ON CONFLICT(hotel_id,model_version) DO UPDATE SET source_digest=excluded.source_digest,run_id=excluded.run_id,updated_at=excluded.updated_at`)
      .bind(manifest.hotelId, manifest.modelVersion, manifest.sourceDigest, id, now),
  ];
  await db.batch(statements);
  const stored = await db.prepare(`SELECT run_id,hotel_id,source_digest,model_version,status,manifest_json
    FROM active_stay_bootstrap_runs WHERE run_id=?1`).bind(id).first<BootstrapRun & { manifest_json: string }>();
  if (!stored || stored.manifest_json !== stableActiveStayManifestJson(manifest)) throw new Error("Bootstrap digest replay conflicts with stored manifest");
  return stored;
}

/** Activate traceable rows in one guarded D1 batch; only synthetic disposable databases may call this helper. */
export async function activateSyntheticActiveStayPricing(
  db: OperationalDatabase,
  manifest: ActiveStayPricingManifest,
  actor: BootstrapActor,
  now: string,
): Promise<BootstrapRun> {
  assertManifest(manifest);
  if (!await verifyActiveStayPricingManifest(manifest)) throw new Error("Bootstrap manifest digest/classification verification failed");
  if (!actor.subject.trim() || !actor.requestId.trim() || !/^\d{4}-\d\d-\d\dT/.test(now)) throw new Error("Explicit synthetic activation provenance is required");
  const id = runId(manifest);
  const traceable = manifest.candidates.filter(candidate => candidate.classification === "TRACEABLE_SEGMENTS");
  if (traceable.length === 0) throw new Error("No traceable synthetic stay is eligible for activation");
  const statements = [
    db.prepare(`UPDATE active_stay_bootstrap_runs SET status='ACTIVATING',activation_token=?2,updated_at=?3
      WHERE run_id=?1 AND source_digest=?4 AND status='SHADOWED'`).bind(id, id, now, manifest.sourceDigest),
    ...traceable.flatMap(candidate => {
      const cid = candidateId(id, candidate.bookingId);
      return [
        db.prepare(`UPDATE active_stay_bootstrap_candidates SET status='ACTIVATING'
          WHERE candidate_id=?1 AND run_id=?2 AND status='SHADOWED' AND classification='TRACEABLE_SEGMENTS'`).bind(cid, id),
        ...candidate.segments.flatMap((segment, index) => [
          db.prepare(`UPDATE bookings SET last_pricing_operation_token=?2
            WHERE id=?1 AND EXISTS (SELECT 1 FROM active_stay_bootstrap_runs r WHERE r.run_id=?3 AND r.status='ACTIVATING')
              AND EXISTS (SELECT 1 FROM active_stay_bootstrap_candidates c WHERE c.candidate_id=?4 AND c.status='ACTIVATING')`)
            .bind(candidate.bookingId, segmentToken(id, candidate.bookingId, index), id, cid),
          db.prepare(`INSERT INTO booking_pricing_segments
            (segment_id,booking_id,room_id,effective_start,effective_end,rate_cents,room_pricing_version,segment_version,
             operation_token,actor_subject,hotel_id,request_id,created_at)
            SELECT ?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13
            WHERE EXISTS (SELECT 1 FROM active_stay_bootstrap_runs WHERE run_id=?14 AND status='ACTIVATING')
              AND EXISTS (SELECT 1 FROM active_stay_bootstrap_candidates WHERE candidate_id=?15
                AND status='ACTIVATING' AND classification='TRACEABLE_SEGMENTS')`)
            .bind(`f0.6-segment:${candidate.bookingId}:${index + 1}`, candidate.bookingId, segment.roomId,
              segment.effectiveStart, segment.effectiveEnd, segment.rateCents, segment.sourceRateVersion,
              candidate.sourceSnapshot.booking.pricingVersion + index + 1, segmentToken(id, candidate.bookingId, index),
              actor.subject, manifest.hotelId, actor.requestId, now, id, cid),
        ]),
        db.prepare(`UPDATE active_stay_bootstrap_candidates SET status='ACTIVATED' WHERE candidate_id=?1 AND status='ACTIVATING'`).bind(cid),
      ];
    }),
    db.prepare(`UPDATE active_stay_bootstrap_runs SET status='COMPLETE',updated_at=?2
      WHERE run_id=?1 AND status IN ('SHADOWED','ACTIVATING')`).bind(id, now),
  ];
  await db.batch(statements);
  const stored = await db.prepare(`SELECT run_id,hotel_id,source_digest,model_version,status
    FROM active_stay_bootstrap_runs WHERE run_id=?1`).bind(id).first<BootstrapRun>();
  if (!stored || stored.status !== "COMPLETE") throw new Error("Synthetic bootstrap activation did not complete");
  return stored;
}
