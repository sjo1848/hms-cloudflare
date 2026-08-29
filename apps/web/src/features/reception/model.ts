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

export const emptyBookingForm = (): BookingForm => ({ guest_id: "", room_id: "", check_in: "", check_out: "", notes: "" });
export const emptyCheckInData = (): CheckInData => ({ count: "1", document: false, contact: false, stay: false });
