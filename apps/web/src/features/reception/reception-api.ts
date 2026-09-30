import { api } from "../../api/client";
import type { ActiveHotelContext, Booking, ExtraCharge, FrontDeskBoard, Guest, HousekeepingBoard, Invoice, MaintenanceCase, Room } from "../../domain/types";
import type { BookingEditForm, BookingForm, CheckInData, ReassignmentQuote } from "./model";

export function loadReceptionBoard() {
  return api<FrontDeskBoard>("/front-desk/board");
}

export function loadReceptionRooms() {
  return api<Room[]>("/rooms");
}

export function loadReceptionGuests() {
  return api<Guest[]>("/guests");
}

export function loadRecoverableReservationOperations() {
  return api<ReservationCreationOperation[]>("/reservation-creation-operations");
}

export type ReservationCreationOperation = {
  operation_token: string; stage: "GUEST_CREATED" | "EXISTING_GUEST_SELECTED"; guest_id: string;
  guest_name: string; booking_id: string; room_id: string; check_in: string; check_out: string;
};

export function loadAvailableRooms(start: string, end: string, excludeBookingId?: string) {
  const query = new URLSearchParams({ start, end });
  if (excludeBookingId) query.set("exclude_booking_id", excludeBookingId);
  return api<Room[]>(`/rooms/available?${query.toString()}`);
}

export function loadHotelContext() {
  return api<ActiveHotelContext>("/auth/me");
}

export function loadBooking(bookingId: string) {
  return api<Booking>(`/bookings/${encodeURIComponent(bookingId)}`);
}

export function loadRoomMaintenanceCase(roomId: string) {
  return api<MaintenanceCase>(`/housekeeping/${roomId}/maintenance`);
}

export function loadBillingContext(bookingId: string) {
  return Promise.all([
    api<Invoice>(`/bookings/${bookingId}/invoice`),
    api<ExtraCharge[]>(`/bookings/${bookingId}/extra-charges`),
  ]);
}

export function loadBookingInvoice(bookingId: string) {
  return api<Invoice>(`/bookings/${encodeURIComponent(bookingId)}/invoice`);
}

export function createBooking(form: BookingForm) {
  return api<Booking>("/bookings", { method: "POST", body: JSON.stringify(form) });
}

export function createReservationOperation(input: {
  operation_token: string; guest_id?: string; guest?: { full_name: string; email: string; phone?: string | null };
  booking: { room_id: string; check_in: string; check_out: string; notes: string };
}) {
  return api<{ operation: ReservationCreationOperation; booking: Booking | null; replayed: boolean }>(
    "/reservation-creation-operations", { method: "POST", body: JSON.stringify(input) },
  );
}

export function updateBooking(bookingId: string, form: BookingEditForm) {
  return api(`/bookings/${bookingId}`, { method: "PATCH", body: JSON.stringify(form) });
}

export function cancelBooking(bookingId: string) {
  return api(`/bookings/${bookingId}`, { method: "PATCH", body: JSON.stringify({ status: "CANCELLED" }) });
}

export function checkInBooking(bookingId: string, data: CheckInData) {
  return api(`/bookings/${bookingId}/check-in`, {
    method: "POST",
    body: JSON.stringify({
      check_in_guests_count: Number(data.count),
      document_verified: data.document,
      contact_confirmed: data.contact,
      stay_confirmed: data.stay,
    }),
  });
}

export function loadReassignmentQuote(bookingId: string, roomId: string) {
  return api<ReassignmentQuote>(`/bookings/${bookingId}/reassignment-quote`, { method: "POST", body: JSON.stringify({ room_id: roomId }) });
}

export function reassignBooking(bookingId: string, roomId: FormDataEntryValue | null, reason: FormDataEntryValue | null, quoteToken: string) {
  return api(`/bookings/${bookingId}/reassign`, { method: "POST", body: JSON.stringify({ room_id: roomId, reason, quote_token: quoteToken }) });
}

export function checkoutBooking(bookingId: string, data: FormData) {
  return api(`/bookings/${bookingId}/check-out`, {
    method: "POST",
    body: JSON.stringify({
      check_out_payment_policy: data.get("policy"),
      check_out_reference: data.get("reference"),
      charge_reviewed: data.get("charges") === "on",
      release_confirmed: data.get("release") === "on",
      handoff_confirmed: data.get("handoff") === "on",
    }),
  });
}
