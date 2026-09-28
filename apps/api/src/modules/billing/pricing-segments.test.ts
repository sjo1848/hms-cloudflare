import { describe, expect, it } from "vitest";
import { accountTotalCents, lodgingTotalCents, priceStayNights, pricingDeltaCents, type PricingSegment } from "./pricing-segments";

const segment = (segment_id: string, room_id: string, effective_start: string, effective_end: string, rate_cents: number, segment_version: number, created_at: string): PricingSegment => ({
  segment_id, room_id, effective_start, effective_end, rate_cents, room_pricing_version: 0, segment_version, created_at,
});

describe("F0.5 pricing segment projection", () => {
  it("applies later segments only to their half-open interval and preserves consumed nightly prices", () => {
    const nights = priceStayNights("2026-09-20", "2026-09-25", [
      segment("initial", "room-a", "2026-09-20", "2026-09-25", 10000, 1, "2026-09-01T00:00:00Z"),
      segment("move-one", "room-b", "2026-09-22", "2026-09-25", 15000, 2, "2026-09-22T12:00:00Z"),
      segment("move-two", "room-c", "2026-09-24", "2026-09-25", 12000, 3, "2026-09-24T12:00:00Z"),
    ]);
    expect(nights).toEqual([
      { stay_date: "2026-09-20", room_id: "room-a", rate_cents: 10000, segment_id: "initial" },
      { stay_date: "2026-09-21", room_id: "room-a", rate_cents: 10000, segment_id: "initial" },
      { stay_date: "2026-09-22", room_id: "room-b", rate_cents: 15000, segment_id: "move-one" },
      { stay_date: "2026-09-23", room_id: "room-b", rate_cents: 15000, segment_id: "move-one" },
      { stay_date: "2026-09-24", room_id: "room-c", rate_cents: 12000, segment_id: "move-two" },
    ]);
    expect(lodgingTotalCents(nights)).toBe(62000);
  });

  it("keeps charges separate and reports exact-cent delta", () => {
    expect(accountTotalCents(62000, [750, 1250])).toBe(64000);
    expect(pricingDeltaCents(64000, 70000)).toBe(-6000);
  });

  it("fails closed on gaps, invalid intervals and unsafe arithmetic", () => {
    expect(() => priceStayNights("2026-09-20", "2026-09-22", [])).toThrow(/Unpriced/);
    expect(() => priceStayNights("2026-09-22", "2026-09-20", [])).toThrow(/interval/i);
    expect(() => lodgingTotalCents([{ rate_cents: Number.MAX_SAFE_INTEGER }, { rate_cents: 1 }])).toThrow(/integer range/i);
  });
});
