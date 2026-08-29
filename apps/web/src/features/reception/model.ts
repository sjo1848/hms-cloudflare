export const checkInSteps = ["Verificación", "Datos / estadía", "Habitación", "Confirmar ingreso"] as const;

export type BookingForm = {
  guest_id: string;
  room_id: string;
  check_in: string;
  check_out: string;
  notes: string;
};

export type BookingEditForm = BookingForm;

export type BillingForm = {
  charge: string;
  description: string;
  payment: string;
  method: string;
  reference: string;
};

export type CheckInData = {
  count: string;
  document: boolean;
  contact: boolean;
  stay: boolean;
};

export const emptyBookingForm = (): BookingForm => ({ guest_id: "", room_id: "", check_in: "", check_out: "", notes: "" });
export const emptyBillingForm = (): BillingForm => ({ charge: "", description: "", payment: "", method: "CASH", reference: "" });
export const emptyCheckInData = (): CheckInData => ({ count: "1", document: false, contact: false, stay: false });
