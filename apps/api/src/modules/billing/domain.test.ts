import { describe, expect, it } from "vitest";
import { integerCents, normalizePaymentMethod, paymentTarget, priorPaymentMatches } from "./domain";

describe("billing payment domain rules", () => {
  it("accepts safe cent values and supported payment methods", () => {
    expect(integerCents(0)).toBe(0);
    expect(integerCents(1, true)).toBe(1);
    expect(integerCents(0, true)).toBeNull();
    expect(integerCents(1.5)).toBeNull();
    expect(normalizePaymentMethod("cash")).toBe("CASH");
    expect(normalizePaymentMethod("TRANSFER")).toBe("TRANSFER");
    expect(normalizePaymentMethod("crypto")).toBeNull();
  });

  it("calculates remaining settlement and enforces operation-token equivalence", () => {
    const booking = { id: "b1", total_cents: 1000 };
    expect(paymentTarget(undefined, booking, null)).toBe(1000);
    expect(paymentTarget(undefined, booking, { id: "i1", amount_cents: 1000, paid_amount_cents: 400 })).toBe(600);
    expect(paymentTarget(undefined, booking, { id: "i1", amount_cents: 1000, paid_amount_cents: 1000 })).toBeNull();
    const prior = { booking_id: "b1", amount_cents: 600, payment_method: "CASH", payment_reference: null, note: null };
    expect(priorPaymentMatches(prior, "b1", 600, "CASH", null, null)).toBe(true);
    expect(priorPaymentMatches(prior, "b1", 500, "CASH", null, null)).toBe(false);
  });
});
