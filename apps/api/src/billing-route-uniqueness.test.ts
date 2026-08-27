import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

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
  it("binds idempotency to booking and the complete payment payload", () => {
    const source = readFileSync(new URL("./routes/billing.ts", import.meta.url), "utf8");
    expect(source).toContain("SELECT booking_id, amount_cents, payment_method, payment_reference, note FROM payment_entries WHERE operation_token = ?1");
    expect(source).toContain("prior.booking_id !== id");
    expect(source).toContain("prior.note !== note");
  });
});
