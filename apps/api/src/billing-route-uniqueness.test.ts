import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { priorPaymentMatches } from "./modules/billing/domain";

describe("billing route contract", () => {
  it("registers each billing path exactly once and has no v2 endpoint", () => {
    const source = readFileSync(new URL("./routes/billing.ts", import.meta.url), "utf8");
    const paths = [...source.matchAll(/app\.(?:get|post)\("([^"]+)"/g)].map(match => match[1]);
    expect(paths.filter(path => path.startsWith("/billing/") || path.includes("/payments") || path.includes("/extra-charges") || path.includes("/invoice") || path.includes("settle-payment"))).toEqual([
      "/bookings/:id/extra-charges",
      "/bookings/:id/extra-charges",
      "/bookings/:id/invoice",
      "/invoices",
      "/bookings/:id/payments",
      "/bookings/:id/payments",
      "/bookings/:id/settle-payment",
      "/billing/balance",
      "/billing/closures",
      "/billing/close-cash",
    ]);
    expect(paths.some(path => path.endsWith("-v2"))).toBe(false);
    expect(new Set(paths).size).toBe(paths.length - 2);
  });

  it("binds idempotency to booking and the complete payment payload across the billing boundary", () => {
    const route = readFileSync(new URL("./routes/billing.ts", import.meta.url), "utf8");
    const adapter = readFileSync(new URL("./modules/billing/d1-payment-repository.ts", import.meta.url), "utf8");
    expect(route).toContain("findPriorPayment(operationToken)");
    expect(route).toContain("priorPaymentMatches(prior, id, target, pm, reference, note)");
    expect(adapter).toContain("SELECT booking_id, amount_cents, payment_method, payment_reference, note FROM payment_entries WHERE operation_token = ?1");
    const prior = { booking_id: "booking-a", amount_cents: 500, payment_method: "CASH", payment_reference: "ref", note: "note" };
    expect(priorPaymentMatches(prior, "booking-a", 500, "CASH", "ref", "note")).toBe(true);
    expect(priorPaymentMatches(prior, "booking-b", 500, "CASH", "ref", "note")).toBe(false);
    expect(priorPaymentMatches(prior, "booking-a", 500, "CASH", "ref", "changed")).toBe(false);
  });
});
