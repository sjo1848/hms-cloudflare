import type { OperationalDatabase } from "../../routing";
import { accountTotalCents, lodgingTotalCents, priceStayNights, pricingDeltaCents, type PricingSegment } from "./pricing-segments";

export type StayPricingQuote = {
  bookingId: string;
  currentRoomId: string;
  destinationRoomId: string;
  hotelLocalDate: string;
  effectiveDate: string;
  checkOut: string;
  destinationRateCents: number;
  destinationPricingVersion: number;
  lodgingTotalCents: number;
  extraChargesCents: number;
  currentTotalCents: number;
  currentLodgingTotalCents: number;
  newTotalCents: number;
  deltaCents: number;
  invoiceId: string | null;
  invoiceStatus: string | null;
  invoiceAmountCents: number | null;
  invoicePaidCents: number | null;
  ledgerPaidCents: number;
  chargeSnapshot: Array<{ id: string; amount_cents: number }>;
  bookingPricingVersion: number;
  currentRoomStateVersion: number;
  currentInventoryVersion: number;
  destinationRoomStateVersion: number;
  destinationInventoryVersion: number;
  quoteToken: string;
};

type QuoteSnapshot = {
  bookingId: string;
  status: string;
  currentRoomId: string;
  destinationRoomId: string;
  checkIn: string;
  checkOut: string;
  assignmentStartDate: string;
  effectiveDate: string;
  hotelLocalDate: string;
  currentTotalCents: number;
  bookingPricingVersion: number;
  currentRoomStateVersion: number;
  currentInventoryVersion: number;
  destinationRoomStateVersion: number;
  destinationInventoryVersion: number;
  destinationRateCents: number;
  destinationPricingVersion: number;
  segments: PricingSegment[];
  charges: Array<{ id: string; amount_cents: number }>;
  invoice: { id: string; amount_cents: number; status: string; paid_amount_cents: number } | null;
  ledgerPaidCents: number;
};

function validHotelDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00.000Z`))
    && new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10) === value;
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, "0")).join("");
}

export async function createReassignmentQuote(
  db: OperationalDatabase,
  bookingId: string,
  destinationRoomId: string,
  hotelLocalDate: string,
): Promise<StayPricingQuote | null> {
  if (!validHotelDate(hotelLocalDate)) return null;
  const row = await db.prepare(`SELECT b.id AS booking_id,b.status,b.room_id AS current_room_id,b.check_in,b.check_out,
      b.total_cents,b.pricing_version AS booking_pricing_version,
      current_room.room_state_version AS current_room_state_version,current_room.inventory_version AS current_inventory_version,
      COALESCE((SELECT json_extract(e.details_json,'$.effective_date') FROM lifecycle_events e
        WHERE e.booking_id=b.id AND e.event_type='REASSIGN' AND json_extract(e.details_json,'$.to_room_id')=b.room_id
        ORDER BY e.created_at DESC,e.rowid DESC LIMIT 1),b.check_in) AS assignment_start_date,
      destination.price_cents AS destination_rate_cents,destination.pricing_version AS destination_pricing_version,
      destination.room_state_version AS destination_room_state_version,destination.inventory_version AS destination_inventory_version,
      (SELECT id FROM invoices i WHERE i.booking_id=b.id LIMIT 1) AS invoice_id,
      (SELECT amount_cents FROM invoices i WHERE i.booking_id=b.id LIMIT 1) AS invoice_amount_cents,
      (SELECT status FROM invoices i WHERE i.booking_id=b.id LIMIT 1) AS invoice_status,
      (SELECT paid_amount_cents FROM invoices i WHERE i.booking_id=b.id LIMIT 1) AS paid_amount_cents,
      (SELECT COALESCE(SUM(p.amount_cents),0) FROM payment_entries p
        WHERE p.invoice_id=(SELECT id FROM invoices i WHERE i.booking_id=b.id LIMIT 1)) AS ledger_paid_cents
    FROM bookings b JOIN rooms current_room ON current_room.id=b.room_id JOIN rooms destination ON destination.id=?2
    WHERE b.id=?1 AND b.status='CHECKED_IN' AND destination.status='AVAILABLE'
      AND destination.housekeeping_state='READY' AND destination.service_state='IN_SERVICE'
      AND NOT EXISTS (SELECT 1 FROM bookings active WHERE active.room_id=destination.id AND active.status='CHECKED_IN')
      AND NOT EXISTS (SELECT 1 FROM maintenance_cases mc WHERE mc.room_id=destination.id AND mc.status='OPEN' AND mc.impact='BLOCKING')
      AND NOT EXISTS (SELECT 1 FROM room_holds h WHERE h.room_id=destination.id AND h.start_date<b.check_out AND h.end_date>MAX(b.check_in,?3))
      AND NOT EXISTS (SELECT 1 FROM room_inventory_nights n WHERE n.room_id=destination.id AND n.stay_date>=MAX(b.check_in,?3) AND n.stay_date<b.check_out)`)
    .bind(bookingId, destinationRoomId, hotelLocalDate).first<{
      booking_id: string; status: string; current_room_id: string; check_in: string; check_out: string;
      total_cents: number; booking_pricing_version: number; assignment_start_date: string;
      destination_rate_cents: number; destination_pricing_version: number;
      current_room_state_version: number; current_inventory_version: number;
      destination_room_state_version: number; destination_inventory_version: number;
      invoice_id: string | null; invoice_status: string | null; paid_amount_cents: number | null; ledger_paid_cents: number;
      invoice_amount_cents: number | null;
    }>();
  if (!row || row.status !== "CHECKED_IN" || row.current_room_id === destinationRoomId || hotelLocalDate >= row.check_out
    || row.assignment_start_date < row.check_in || row.assignment_start_date >= row.check_out
    || !validHotelDate(row.assignment_start_date)) return null;
  if (row.invoice_status === "VOIDED" || (row.invoice_id && (row.invoice_amount_cents !== row.total_cents
    || row.paid_amount_cents !== row.ledger_paid_cents
    || row.invoice_status !== (row.paid_amount_cents! >= row.invoice_amount_cents! ? "PAID" : "PENDING")))) return null;
  const effectiveDate = row.check_in > hotelLocalDate ? row.check_in : hotelLocalDate;
  if (effectiveDate < row.assignment_start_date || effectiveDate >= row.check_out) return null;
  const [segmentRows, chargeRows] = await Promise.all([
    db.prepare(`SELECT segment_id,room_id,effective_start,effective_end,rate_cents,room_pricing_version,segment_version,created_at
      FROM booking_pricing_segments WHERE booking_id=?1 ORDER BY segment_version`).bind(bookingId).all<PricingSegment>(),
    db.prepare("SELECT id,amount_cents FROM extra_charges WHERE booking_id=?1 ORDER BY id").bind(bookingId).all<{ id: string; amount_cents: number }>(),
  ]);
  const segments = segmentRows.results;
  let priorNights;
  try { priorNights = priceStayNights(row.check_in, row.check_out, segments); }
  catch { return null; }
  const currentLodging = lodgingTotalCents(priorNights);
  const chargesTotal = chargeRows.results.reduce((sum, charge) => {
    const next = sum + charge.amount_cents;
    return Number.isSafeInteger(next) ? next : Number.NaN;
  }, 0);
  if (!Number.isSafeInteger(chargesTotal) || accountTotalCents(currentLodging, [chargesTotal]) !== row.total_cents) return null;
  const candidateSegments: PricingSegment[] = [...segments, {
    segment_id: "quote-candidate", room_id: destinationRoomId, effective_start: effectiveDate, effective_end: row.check_out,
    rate_cents: row.destination_rate_cents, room_pricing_version: row.destination_pricing_version,
    segment_version: row.booking_pricing_version + 1, created_at: "9999-12-31T23:59:59.999Z",
  }];
  const nextNights = priceStayNights(row.check_in, row.check_out, candidateSegments);
  const lodging = lodgingTotalCents(nextNights);
  const newTotal = accountTotalCents(lodging, [chargesTotal]);
  const snapshot: QuoteSnapshot = {
    bookingId, status: row.status, currentRoomId: row.current_room_id, destinationRoomId,
    checkIn: row.check_in, checkOut: row.check_out, assignmentStartDate: row.assignment_start_date,
    effectiveDate, hotelLocalDate, currentTotalCents: row.total_cents,
    bookingPricingVersion: row.booking_pricing_version, destinationRateCents: row.destination_rate_cents,
    destinationPricingVersion: row.destination_pricing_version,
    currentRoomStateVersion: row.current_room_state_version, currentInventoryVersion: row.current_inventory_version,
    destinationRoomStateVersion: row.destination_room_state_version, destinationInventoryVersion: row.destination_inventory_version,
    segments, charges: chargeRows.results,
    invoice: row.invoice_id && row.invoice_status && row.paid_amount_cents != null
      ? { id: row.invoice_id, amount_cents: row.invoice_amount_cents!, status: row.invoice_status, paid_amount_cents: row.paid_amount_cents } : null,
    ledgerPaidCents: row.ledger_paid_cents,
  };
  const quoteToken = await sha256(JSON.stringify(snapshot));
  return {
    bookingId, currentRoomId: row.current_room_id, destinationRoomId, hotelLocalDate,
    effectiveDate, checkOut: row.check_out, destinationRateCents: row.destination_rate_cents,
    destinationPricingVersion: row.destination_pricing_version, lodgingTotalCents: lodging,
    extraChargesCents: chargesTotal, currentTotalCents: row.total_cents, newTotalCents: newTotal,
    currentLodgingTotalCents: currentLodging, deltaCents: pricingDeltaCents(newTotal, row.total_cents),
    invoiceId: row.invoice_id, invoiceStatus: row.invoice_status, invoiceAmountCents: row.invoice_amount_cents,
    invoicePaidCents: row.paid_amount_cents,
    ledgerPaidCents: row.ledger_paid_cents,
    chargeSnapshot: chargeRows.results.map(({ id, amount_cents }) => ({ id, amount_cents })),
    bookingPricingVersion: row.booking_pricing_version,
    currentRoomStateVersion: row.current_room_state_version, currentInventoryVersion: row.current_inventory_version,
    destinationRoomStateVersion: row.destination_room_state_version, destinationInventoryVersion: row.destination_inventory_version,
    quoteToken,
  };
}
