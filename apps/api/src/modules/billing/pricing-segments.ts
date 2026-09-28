export type PricingSegment = {
  segment_id: string;
  room_id: string;
  effective_start: string;
  effective_end: string;
  rate_cents: number;
  room_pricing_version: number;
  segment_version: number;
  created_at: string;
};

export type PricedNight = { stay_date: string; room_id: string; rate_cents: number; segment_id: string };

function validDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00.000Z`))
    && new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10) === value;
}

export function stayDates(start: string, end: string): string[] {
  if (!validDate(start) || !validDate(end) || start >= end) throw new Error("Invalid pricing interval");
  const dates: string[] = [];
  const cursor = new Date(`${start}T00:00:00.000Z`);
  const endDate = new Date(`${end}T00:00:00.000Z`);
  while (cursor < endDate) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

export function priceStayNights(start: string, end: string, segments: readonly PricingSegment[]): PricedNight[] {
  const nights = stayDates(start, end);
  const ordered = [...segments].sort((a, b) => b.segment_version - a.segment_version);
  return nights.map(stayDate => {
    const segment = ordered.find(candidate => candidate.effective_start <= stayDate && stayDate < candidate.effective_end);
    if (!segment) throw new Error(`Unpriced stay night: ${stayDate}`);
    if (!Number.isSafeInteger(segment.rate_cents) || segment.rate_cents < 0) throw new Error("Invalid segment rate");
    return { stay_date: stayDate, room_id: segment.room_id, rate_cents: segment.rate_cents, segment_id: segment.segment_id };
  });
}

export function lodgingTotalCents(nights: readonly Pick<PricedNight, "rate_cents">[]): number {
  let total = 0;
  for (const night of nights) {
    if (!Number.isSafeInteger(night.rate_cents) || night.rate_cents < 0) throw new Error("Invalid segment rate");
    total += night.rate_cents;
    if (!Number.isSafeInteger(total)) throw new Error("Lodging total exceeds supported integer range");
  }
  return total;
}

export function accountTotalCents(lodgingCents: number, extraChargeCents: readonly number[]): number {
  if (!Number.isSafeInteger(lodgingCents) || lodgingCents < 0) throw new Error("Invalid lodging total");
  let total = lodgingCents;
  for (const amount of extraChargeCents) {
    if (!Number.isSafeInteger(amount) || amount < 0) throw new Error("Invalid extra charge amount");
    total += amount;
    if (!Number.isSafeInteger(total)) throw new Error("Booking account total exceeds supported integer range");
  }
  return total;
}

export function pricingDeltaCents(newTotalCents: number, currentTotalCents: number): number {
  if (!Number.isSafeInteger(newTotalCents) || !Number.isSafeInteger(currentTotalCents)) throw new Error("Invalid account total");
  const delta = newTotalCents - currentTotalCents;
  if (!Number.isSafeInteger(delta)) throw new Error("Pricing delta exceeds supported integer range");
  return delta;
}
