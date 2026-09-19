import { describe, expect, it } from "vitest";
import {
  billingAmounts,
  integerCents,
  normalizePaymentMethod,
  paymentTarget,
  priorPaymentMatches,
  reconciliationAudit,
  reconciliationProblem,
} from "./domain";

const invoice = (overrides: Partial<{
  id: string; amount_cents: number; paid_amount_cents: number; ledger_paid_cents: number;
  status: "PENDING" | "PAID" | "VOIDED"; paid_at: string | null;
}> = {}) => ({
  id: "i1",
  amount_cents: 1000,
  paid_amount_cents: 400,
  ledger_paid_cents: 400,
  status: "PENDING" as const,
  paid_at: null,
  ...overrides,
});

describe("billing D11 domain rules", () => {
  it("accepts safe cent values and supported payment methods", () => {
    expect(integerCents(0)).toBe(0);
    expect(integerCents(1, true)).toBe(1);
    expect(integerCents(0, true)).toBeNull();
    expect(integerCents(1.5)).toBeNull();
    expect(normalizePaymentMethod("cash")).toBe("CASH");
    expect(normalizePaymentMethod("TRANSFER")).toBe("TRANSFER");
    expect(normalizePaymentMethod("crypto")).toBeNull();
  });

  it("derives remaining, credit and non-voided status from authoritative cents", () => {
    expect(billingAmounts(1000, 400)).toEqual({ remaining_cents: 600, credit_cents: 0, status: "PENDING" });
    expect(billingAmounts(1000, 1000)).toEqual({ remaining_cents: 0, credit_cents: 0, status: "PAID" });
    expect(billingAmounts(800, 1000)).toEqual({ remaining_cents: 0, credit_cents: 200, status: "PAID" });
  });

  it("fails reconciliation closed for VOIDED or ledger mismatch", () => {
    expect(reconciliationProblem(invoice())).toBeNull();
    expect(reconciliationProblem(invoice({ status: "VOIDED" }))).toBe("VOIDED");
    expect(reconciliationProblem(invoice({ paid_amount_cents: 500, ledger_paid_cents: 400 }))).toBe("LEDGER_MISMATCH");
  });

  it("calculates remaining settlement and rejects collection above remaining", () => {
    const booking = { id: "b1", total_cents: 1000 };
    expect(paymentTarget(undefined, booking, null)).toBe(1000);
    expect(paymentTarget(undefined, booking, invoice())).toBe(600);
    expect(paymentTarget(601, booking, invoice())).toBeNull();
    expect(paymentTarget(undefined, booking, invoice({ paid_amount_cents: 1000, ledger_paid_cents: 1000, status: "PAID" }))).toBeNull();
    expect(paymentTarget(undefined, booking, invoice({ status: "VOIDED" }))).toBeNull();
  });

  it("computes deterministic paid_at transitions for repricing audit", () => {
    const at = "2026-09-19T16:00:00.000Z";
    expect(reconciliationAudit(1000, 500, 600, "PENDING", null, at)).toMatchObject({
      status: "PAID", credit_cents: 100, remaining_cents: 0, paid_at: at,
    });
    expect(reconciliationAudit(500, 1000, 600, "PAID", "2026-09-18T10:00:00.000Z", at)).toMatchObject({
      status: "PENDING", credit_cents: 0, remaining_cents: 400, paid_at: null,
    });
    expect(reconciliationAudit(1000, 900, 1000, "PAID", "2026-09-18T10:00:00.000Z", at)).toMatchObject({
      status: "PAID", credit_cents: 100, paid_at: "2026-09-18T10:00:00.000Z",
    });
  });

  it("enforces operation-token equivalence", () => {
    const prior = { booking_id: "b1", amount_cents: 600, payment_method: "CASH", payment_reference: null, note: null };
    expect(priorPaymentMatches(prior, "b1", 600, "CASH", null, null)).toBe(true);
    expect(priorPaymentMatches(prior, "b1", 500, "CASH", null, null)).toBe(false);
  });
});
