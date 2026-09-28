export const CHECK_IN_STEP_COUNT = 4;

export type BookingForm = {
  guest_id: string;
  room_id: string;
  check_in: string;
  check_out: string;
  notes: string;
};

export type BookingEditForm = BookingForm;

export type CheckInData = {
  count: string;
  document: boolean;
  contact: boolean;
  stay: boolean;
};

export type ReassignmentQuote = {
  booking_id: string;
  current_room_id: string;
  destination_room_id: string;
  hotel_local_date: string;
  effective_date: string;
  check_out: string;
  destination_rate_cents: number;
  lodging_total_cents: number;
  extra_charges_cents: number;
  current_total_cents: number;
  new_total_cents: number;
  delta_cents: number;
  quote_token: string;
};

export const emptyBookingForm = (): BookingForm => ({ guest_id: "", room_id: "", check_in: "", check_out: "", notes: "" });
export const emptyCheckInData = (): CheckInData => ({ count: "1", document: false, contact: false, stay: false });
