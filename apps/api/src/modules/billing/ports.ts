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
  expectedTotalCents: number;
  description: string;
  amountCents: number;
  category: string;
  actor: PaymentActor;
  forceAuditFailure?: boolean;
};

export interface BillingPaymentRepository {
  findBooking(id: string): Promise<BillingBooking | null>;
  findInvoice(bookingId: string): Promise<BillingInvoice | null>;
  findPriorPayment(operationToken: string): Promise<PriorPayment | null>;
  invoiceView(bookingId: string): Promise<unknown>;
  recordPayment(write: PaymentWrite, existingInvoice: BillingInvoice | null): Promise<boolean>;
  recordExtraCharge(write: ExtraChargeWrite, existingInvoice: BillingInvoice | null): Promise<boolean>;
}
