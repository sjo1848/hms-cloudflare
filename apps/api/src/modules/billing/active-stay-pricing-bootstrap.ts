import { stayDates } from "./pricing-segments";

export const ACTIVE_STAY_PRICING_MODEL = "f0.6-segment-bootstrap-v1" as const;
export type ActiveStayClassification =
  | "TRACEABLE_SEGMENTS"
  | "TRACEABLE_AGGREGATE_ONLY"
  | "ACCOUNT_MISMATCH"
  | "VOIDED"
  | "ORPHAN_OR_CONFLICT";

export type HistoricalRateEvidence = {
  sourceRef: string;
  roomId: string;
  effectiveStart: string;
  effectiveEnd: string;
  rateCents: number;
  sourceRateVersion: number;
};

export type ActiveStayPricingSource = {
  hotelId: string;
  currencyBasis: string;
  booking: {
    id: string;
    status: string;
    roomId: string | null;
    checkIn: string;
    checkOut: string;
    totalCents: number;
    pricingVersion: number;
    lastPricingOperationToken: string | null;
    updatedAt: string;
  };
  rooms: Array<{ id: string; priceCents: number; pricingVersion: number; inventoryVersion: number; roomStateVersion: number }>;
  inventory: Array<{ roomId: string; stayDate: string; bookingId: string }>;
  charges: Array<{ id: string; amountCents: number; description: string; category: string; createdAt: string }>;
  invoice: null | {
    id: string;
    amountCents: number;
    paidAmountCents: number;
    status: string;
    paymentMethod: string;
    paymentReference: string | null;
    paidAt: string | null;
    createdAt: string;
  };
  payments: Array<{
    id: string;
    bookingId: string;
    amountCents: number;
    paymentMethod: string;
    paymentReference: string | null;
    note: string | null;
    receivedByUserId: string;
    receivedAt: string;
    operationToken: string | null;
  }>;
  historicalRates: HistoricalRateEvidence[];
};

export type ActiveStayPricingCandidate = {
  bookingId: string;
  classification: ActiveStayClassification;
  blockers: string[];
  currencyBasis: string;
  sourceEvidence: HistoricalRateEvidence[];
  sourceSnapshot: ActiveStayPricingSource;
  baselineDigest: string;
  lodgingTotalCents: number | null;
  accountTotalCents: number;
  segments: HistoricalRateEvidence[];
};

export type ActiveStayPricingManifest = {
  schemaVersion: 1;
  modelVersion: typeof ACTIVE_STAY_PRICING_MODEL;
  hotelId: string;
  sourceDigest: string;
  candidates: ActiveStayPricingCandidate[];
};

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).sort().map(key => `${JSON.stringify(key)}:${stableJson(record[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

async function digest(value: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(stableJson(value));
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(hash)].map(byte => byte.toString(16).padStart(2, "0")).join("");
}

function safeCents(value: number): boolean {
  return Number.isSafeInteger(value) && value >= 0;
}

function isValidDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
    && !Number.isNaN(Date.parse(`${value}T00:00:00.000Z`))
    && new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10) === value;
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values)].sort();
}

function classify(source: ActiveStayPricingSource, baselineDigest: string): ActiveStayPricingCandidate {
  const blockers: string[] = [];
  const booking = source.booking;
  const roomIds = new Set(source.rooms.map(room => room.id));
  if (roomIds.size !== source.rooms.length) blockers.push("DUPLICATE_ROOM_SNAPSHOT_ID");
  const chargeIds = new Set<string>();
  const paymentIds = new Set<string>();
  let accountTotal = booking.totalCents;
  let lodging: number | null = null;

  if (booking.status !== "CHECKED_IN") blockers.push("BOOKING_NOT_CHECKED_IN");
  if (!booking.roomId || !roomIds.has(booking.roomId)) blockers.push("CURRENT_ROOM_MISSING_OR_FOREIGN");
  if (!isValidDate(booking.checkIn) || !isValidDate(booking.checkOut) || booking.checkIn >= booking.checkOut) blockers.push("INVALID_STAY_INTERVAL");
  if (!safeCents(booking.totalCents) || !Number.isSafeInteger(booking.pricingVersion) || booking.pricingVersion < 0) blockers.push("INVALID_BOOKING_ACCOUNT_VALUE");
  if (!source.currencyBasis.trim()) blockers.push("CURRENCY_BASIS_MISSING");

  let chargeTotal = 0;
  for (const charge of source.charges) {
    if (chargeIds.has(charge.id)) blockers.push("DUPLICATE_EXTRA_CHARGE_ID");
    chargeIds.add(charge.id);
    if (!safeCents(charge.amountCents)) blockers.push("INVALID_EXTRA_CHARGE_AMOUNT");
    else chargeTotal += charge.amountCents;
    if (!Number.isSafeInteger(chargeTotal)) blockers.push("EXTRA_CHARGE_TOTAL_OUT_OF_RANGE");
  }

  if (!source.invoice) blockers.push("INVOICE_MISSING");
  else {
    if (!safeCents(source.invoice.amountCents) || source.invoice.amountCents !== booking.totalCents) blockers.push("INVOICE_AMOUNT_MISMATCH");
    if (!safeCents(source.invoice.paidAmountCents)) blockers.push("INVOICE_PAID_AMOUNT_INVALID");
    if (source.invoice.status === "VOIDED") blockers.push("INVOICE_VOIDED");
    else if (source.invoice.status !== "PENDING" && source.invoice.status !== "PAID") blockers.push("INVOICE_STATUS_INVALID");
  }

  let paidTotal = 0;
  for (const payment of source.payments) {
    if (paymentIds.has(payment.id)) blockers.push("DUPLICATE_PAYMENT_ID");
    paymentIds.add(payment.id);
    if (!Number.isSafeInteger(payment.amountCents) || payment.amountCents <= 0) blockers.push("INVALID_PAYMENT_AMOUNT");
    else paidTotal += payment.amountCents;
    if (payment.bookingId !== booking.id) blockers.push("PAYMENT_BOOKING_ID_MISMATCH");
    if (!Number.isSafeInteger(paidTotal)) blockers.push("PAYMENT_TOTAL_OUT_OF_RANGE");
  }
  if (source.invoice && source.invoice.paidAmountCents !== paidTotal) blockers.push("PAYMENT_LEDGER_MISMATCH");
  if (source.invoice && source.invoice.status !== "VOIDED") {
    const derivedStatus = paidTotal >= source.invoice.amountCents ? "PAID" : "PENDING";
    if (source.invoice.status !== derivedStatus) blockers.push("INVOICE_STATUS_LEDGER_MISMATCH");
  }

  const dates = (() => {
    try { return stayDates(booking.checkIn, booking.checkOut); } catch { return []; }
  })();
  const rates = [...source.historicalRates].sort((a, b) =>
    a.effectiveStart.localeCompare(b.effectiveStart) || a.effectiveEnd.localeCompare(b.effectiveEnd)
      || a.roomId.localeCompare(b.roomId) || a.sourceRef.localeCompare(b.sourceRef));
  let historyComplete = dates.length > 0 && rates.length > 0;
  const perDate = new Map<string, HistoricalRateEvidence>();
  const sourceReferences = new Map<string, string>();
  for (const rate of rates) {
    if (!rate.sourceRef.trim() || !roomIds.has(rate.roomId) || !Number.isSafeInteger(rate.sourceRateVersion) || rate.sourceRateVersion < 0
      || !safeCents(rate.rateCents)) blockers.push("HISTORICAL_RATE_EVIDENCE_INVALID");
    const evidenceValue = stableJson(rate);
    if (sourceReferences.has(rate.sourceRef) && sourceReferences.get(rate.sourceRef) !== evidenceValue) blockers.push("HISTORICAL_SOURCE_CONFLICT");
    sourceReferences.set(rate.sourceRef, evidenceValue);
    let interval: string[];
    try { interval = stayDates(rate.effectiveStart, rate.effectiveEnd); }
    catch { blockers.push("HISTORICAL_RATE_INTERVAL_INVALID"); historyComplete = false; continue; }
    for (const date of interval) {
      if (date < booking.checkIn || date >= booking.checkOut || perDate.has(date)) {
        blockers.push("HISTORICAL_RATE_OVERLAP_OR_OUTSIDE_STAY");
        historyComplete = false;
      } else perDate.set(date, rate);
    }
  }
  if (dates.some(date => !perDate.has(date))) historyComplete = false;
  if (historyComplete && dates.length > 0 && perDate.get(dates[dates.length - 1])?.roomId !== booking.roomId) blockers.push("CURRENT_ROOM_HISTORY_MISMATCH");

  const expectedClaims = dates.map(date => {
    const rate = perDate.get(date);
    return rate ? { roomId: rate.roomId, stayDate: date, bookingId: booking.id } : null;
  });
  const actualClaims = source.inventory
    .filter(claim => claim.bookingId === booking.id)
    .map(claim => ({ roomId: claim.roomId, stayDate: claim.stayDate, bookingId: claim.bookingId }))
    .sort((a, b) => a.stayDate.localeCompare(b.stayDate) || a.roomId.localeCompare(b.roomId));
  const expectedNonNull = expectedClaims.filter((claim): claim is NonNullable<typeof claim> => claim !== null)
    .sort((a, b) => a.stayDate.localeCompare(b.stayDate) || a.roomId.localeCompare(b.roomId));
  if (source.inventory.some(claim => actualClaims.some(own => own.roomId === claim.roomId
    && own.stayDate === claim.stayDate && claim.bookingId !== booking.id))) blockers.push("OVERLAPPING_STAY_NIGHT_CLAIM");
  if (source.inventory.some(claim => claim.bookingId === booking.id && (!roomIds.has(claim.roomId) || !dates.includes(claim.stayDate)))) blockers.push("INVENTORY_CLAIM_ORPHAN");
  if (new Set(actualClaims.map(claim => claim.stayDate)).size !== actualClaims.length) blockers.push("DUPLICATE_STAY_NIGHT_CLAIM");
  if (source.inventory.some(claim => expectedNonNull.some(expected => expected.roomId === claim.roomId
    && expected.stayDate === claim.stayDate && claim.bookingId !== booking.id))) blockers.push("OVERLAPPING_STAY_NIGHT_CLAIM");
  if (historyComplete && stableJson(actualClaims) !== stableJson(expectedNonNull)) blockers.push("INVENTORY_HISTORY_MISMATCH");
  if (historyComplete) {
    try {
      lodging = rates.reduce((sum, rate) => {
        const count = stayDates(rate.effectiveStart, rate.effectiveEnd).length;
        const segmentTotal = rate.rateCents * count;
        if (!Number.isSafeInteger(segmentTotal)) throw new Error("segment cents out of range");
        const next = sum + segmentTotal;
        if (!Number.isSafeInteger(next)) throw new Error("lodging cents out of range");
        return next;
      }, 0);
      if (!safeCents(lodging)) blockers.push("LODGING_TOTAL_INVALID");
    } catch { blockers.push("LODGING_TOTAL_INVALID"); lodging = null; }
  }

  if (Number.isSafeInteger(chargeTotal) && Number.isSafeInteger(lodging ?? 0)) accountTotal = (lodging ?? 0) + chargeTotal;
  if (!Number.isSafeInteger(accountTotal)) blockers.push("ACCOUNT_TOTAL_OUT_OF_RANGE");
  if (historyComplete && accountTotal !== booking.totalCents) blockers.push("HISTORICAL_ACCOUNT_TOTAL_MISMATCH");

  const normalizedBlockers = uniqueStrings(blockers);
  let classification: ActiveStayClassification;
  if (normalizedBlockers.some(code => ["BOOKING_NOT_CHECKED_IN", "CURRENT_ROOM_MISSING_OR_FOREIGN", "CURRENT_ROOM_HISTORY_MISMATCH", "INVALID_STAY_INTERVAL", "DUPLICATE_ROOM_SNAPSHOT_ID", "INVENTORY_CLAIM_ORPHAN", "DUPLICATE_STAY_NIGHT_CLAIM", "OVERLAPPING_STAY_NIGHT_CLAIM", "INVENTORY_HISTORY_MISMATCH", "HISTORICAL_RATE_OVERLAP_OR_OUTSIDE_STAY", "HISTORICAL_RATE_INTERVAL_INVALID", "HISTORICAL_RATE_EVIDENCE_INVALID", "HISTORICAL_SOURCE_CONFLICT"].includes(code))) {
    classification = "ORPHAN_OR_CONFLICT";
  } else if (source.invoice?.status === "VOIDED") {
    classification = "VOIDED";
  } else if (normalizedBlockers.length > 0) {
    classification = "ACCOUNT_MISMATCH";
  } else if (!historyComplete) {
    classification = "TRACEABLE_AGGREGATE_ONLY";
  } else {
    classification = "TRACEABLE_SEGMENTS";
  }

  if (classification !== "TRACEABLE_SEGMENTS") lodging = null;
  return {
    bookingId: booking.id,
    classification,
    blockers: normalizedBlockers,
    currencyBasis: source.currencyBasis,
    sourceEvidence: rates,
    sourceSnapshot: source,
    baselineDigest,
    lodgingTotalCents: lodging,
    accountTotalCents: booking.totalCents,
    segments: classification === "TRACEABLE_SEGMENTS" ? rates : [],
  };
}

export async function createActiveStayPricingManifest(
  hotelId: string,
  sources: readonly ActiveStayPricingSource[],
): Promise<ActiveStayPricingManifest> {
  if (!hotelId.trim()) throw new Error("Hotel identity is required");
  const ordered = [...sources].sort((a, b) => a.booking.id.localeCompare(b.booking.id));
  if (ordered.some(source => source.hotelId !== hotelId)) throw new Error("Cross-hotel source row rejected");
  if (new Set(ordered.map(source => source.booking.id)).size !== ordered.length) throw new Error("Duplicate booking source row");
  const sourceDigest = await digest({ schemaVersion: 1, modelVersion: ACTIVE_STAY_PRICING_MODEL, hotelId, sources: ordered });
  const candidates = await Promise.all(ordered.map(async source => {
    const baselineDigest = await digest(source);
    return classify(source, baselineDigest);
  }));
  return { schemaVersion: 1, modelVersion: ACTIVE_STAY_PRICING_MODEL, hotelId, sourceDigest, candidates };
}

export function stableActiveStayManifestJson(manifest: ActiveStayPricingManifest): string {
  return stableJson(manifest);
}

export async function verifyActiveStayPricingManifest(manifest: ActiveStayPricingManifest): Promise<boolean> {
  if (manifest.schemaVersion !== 1 || manifest.modelVersion !== ACTIVE_STAY_PRICING_MODEL || !manifest.hotelId) return false;
  const sources = [...manifest.candidates].sort((a, b) => a.bookingId.localeCompare(b.bookingId)).map(candidate => candidate.sourceSnapshot);
  const expected = await createActiveStayPricingManifest(manifest.hotelId, sources);
  return stableActiveStayManifestJson(expected) === stableActiveStayManifestJson(manifest);
}
