export type PaymentMethod = "CASH" | "CARD" | "TRANSFER";
export type InvoiceStatus = "PENDING" | "PAID" | "VOIDED";
export type BillingBooking = { id: string; total_cents: number };
export type BillingInvoice = {
  id: string;
  amount_cents: number;
  paid_amount_cents: number;
  ledger_paid_cents: number;
  status: InvoiceStatus;
  paid_at: string | null;
};
export type PriorPayment = { booking_id: string; amount_cents: number; payment_method: string; payment_reference: string | null; note: string | null };

export type BillingAmounts = {
  remaining_cents: number;
  credit_cents: number;
  status: Exclude<InvoiceStatus, "VOIDED">;
};

export type ReconciliationProblem = "VOIDED" | "LEDGER_MISMATCH";

export function integerCents(value: unknown, positive = false): number | null {
  if (!Number.isSafeInteger(value)) return null;
  const cents = value as number;
  return positive ? (cents > 0 ? cents : null) : (cents >= 0 ? cents : null);
}

export function normalizePaymentMethod(value: string): PaymentMethod | null {
  const normalized = value.toUpperCase();
  return normalized === "CASH" || normalized === "CARD" || normalized === "TRANSFER" ? normalized : null;
}

export function billingAmounts(amountCents: number, paidCents: number): BillingAmounts {
  return {
    remaining_cents: Math.max(amountCents - paidCents, 0),
    credit_cents: Math.max(paidCents - amountCents, 0),
    status: paidCents >= amountCents ? "PAID" : "PENDING",
  };
}

export function reconciliationProblem(invoice: BillingInvoice | null): ReconciliationProblem | null {
  if (!invoice) return null;
  if (invoice.status === "VOIDED") return "VOIDED";
  return invoice.paid_amount_cents === invoice.ledger_paid_cents ? null : "LEDGER_MISMATCH";
}

export function paymentTarget(explicitAmount: number | undefined, booking: BillingBooking, invoice: BillingInvoice | null): number | null {
  if (reconciliationProblem(invoice)) return null;
  const target = explicitAmount ?? (invoice ? billingAmounts(invoice.amount_cents, invoice.paid_amount_cents).remaining_cents : booking.total_cents);
  if (!Number.isSafeInteger(target) || target <= 0) return null;
  if (invoice && target > billingAmounts(invoice.amount_cents, invoice.paid_amount_cents).remaining_cents) return null;
  return target;
}

export function reconciliationAudit(
  oldAmount: number,
  newAmount: number,
  paidAmount: number,
  previousStatus: InvoiceStatus | null,
  previousPaidAt: string | null,
  reconciledAt: string,
) {
  const next = billingAmounts(newAmount, paidAmount);
  const paidAt =
    previousStatus === "PAID" && next.status === "PAID"
      ? previousPaidAt
      : previousStatus === "PENDING" && next.status === "PAID"
        ? reconciledAt
        : next.status === "PENDING"
          ? null
          : previousPaidAt;
  return {
    old_amount_cents: oldAmount,
    new_amount_cents: newAmount,
    paid_amount_cents: paidAmount,
    remaining_cents: next.remaining_cents,
    credit_cents: next.credit_cents,
    previous_status: previousStatus,
    status: next.status,
    previous_paid_at: previousPaidAt,
    paid_at: paidAt,
  };
}

export function priorPaymentMatches(prior: PriorPayment, bookingId: string, amount: number, method: PaymentMethod, reference: string | null, note: string | null): boolean {
  return prior.booking_id === bookingId && prior.amount_cents === amount && prior.payment_method === method && prior.payment_reference === reference && prior.note === note;
}
