import type { BillingBooking, BillingInvoice, PaymentMethod, PriorPayment } from "./domain";

export type PaymentActor = { subject: string; requestId: string; hotelId: string };
export type PaymentWrite = {
  bookingId: string;
  amountCents: number;
  paymentMethod: PaymentMethod;
  reference: string | null;
  note: string | null;
  operationToken: string;
  settle: boolean;
  actor: PaymentActor;
};

export type ExtraChargeWrite = {
  bookingId: string;
  operationToken: string;
  expectedTotalCents: number;
  description: string;
  amountCents: number;
  category: string;
  actor: PaymentActor;
  forceAuditFailure?: boolean;
};

export type ExtraChargeOperation = {
  id: string;
  booking_id: string;
  description: string;
  amount_cents: number;
  category: string;
  created_at: string;
  operation_token: string;
};

export type ExtraChargeOutcome = { charge: ExtraChargeOperation; replayed: boolean; statementChanges?: number[] };

export interface BillingPaymentRepository {
  findBooking(id: string): Promise<BillingBooking | null>;
  findInvoice(bookingId: string): Promise<BillingInvoice | null>;
  findPriorPayment(bookingId: string, operationToken: string): Promise<PriorPayment | null>;
  findExtraChargeOperation(bookingId: string, operationToken: string): Promise<ExtraChargeOperation | null>;
  invoiceView(bookingId: string): Promise<unknown>;
  recordPayment(write: PaymentWrite, existingInvoice: BillingInvoice | null): Promise<boolean>;
  recordExtraCharge(write: ExtraChargeWrite, existingInvoice: BillingInvoice | null): Promise<ExtraChargeOutcome>;
}
