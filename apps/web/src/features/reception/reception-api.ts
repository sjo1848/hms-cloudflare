import { api } from "../../api/client";
import type { Booking, Guest, Room } from "../../domain/types";
import type { BookingEditForm, BookingForm, CheckInData } from "./model";

export async function loadReceptionQueue() {
  const [bookings, rooms, guests] = await Promise.all([
    api<Booking[]>("/bookings?limit=100"),
    api<Room[]>("/rooms"),
    api<Guest[]>("/guests"),
  ]);
  return { bookings, rooms, guests };
}

export function loadAvailableRooms(start: string, end: string, excludeBookingId?: string) {
  const query = new URLSearchParams({ start, end });
  if (excludeBookingId) query.set("exclude_booking_id", excludeBookingId);
  return api<Room[]>(`/rooms/available?${query.toString()}`);
}

export function createBooking(form: BookingForm) {
  return api<Booking>("/bookings", { method: "POST", body: JSON.stringify(form) });
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

export function reassignBooking(bookingId: string, roomId: FormDataEntryValue | null) {
  return api(`/bookings/${bookingId}/reassign`, { method: "POST", body: JSON.stringify({ room_id: roomId }) });
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
