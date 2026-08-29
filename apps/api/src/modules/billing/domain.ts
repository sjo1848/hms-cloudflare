export type PaymentMethod = "CASH" | "CARD" | "TRANSFER";
export type BillingBooking = { id: string; total_cents: number };
export type BillingInvoice = { id: string; amount_cents: number; paid_amount_cents: number };
export type PriorPayment = { booking_id: string; amount_cents: number; payment_method: string; payment_reference: string | null; note: string | null };

export function integerCents(value: unknown, positive = false): number | null {
  if (!Number.isSafeInteger(value)) return null;
  const cents = value as number;
  return positive ? (cents > 0 ? cents : null) : (cents >= 0 ? cents : null);
}

export function normalizePaymentMethod(value: string): PaymentMethod | null {
  const normalized = value.toUpperCase();
  return normalized === "CASH" || normalized === "CARD" || normalized === "TRANSFER" ? normalized : null;
}

export function paymentTarget(explicitAmount: number | undefined, booking: BillingBooking, invoice: BillingInvoice | null): number | null {
  const target = explicitAmount ?? (invoice ? invoice.amount_cents - invoice.paid_amount_cents : booking.total_cents);
  return Number.isSafeInteger(target) && target > 0 ? target : null;
}

export function priorPaymentMatches(prior: PriorPayment, bookingId: string, amount: number, method: PaymentMethod, reference: string | null, note: string | null): boolean {
  return prior.booking_id === bookingId && prior.amount_cents === amount && prior.payment_method === method && prior.payment_reference === reference && prior.note === note;
}
