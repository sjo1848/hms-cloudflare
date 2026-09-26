import { api } from "../../api/client";
import type { ActiveHotelContext, Booking, ExtraCharge, FrontDeskBoard, Guest, HousekeepingBoard, Invoice, MaintenanceCase, Room } from "../../domain/types";
import type { BookingEditForm, BookingForm, CheckInData } from "./model";

export async function loadReceptionQueue() {
  const [board, rooms, guests] = await Promise.all([
    api<FrontDeskBoard>("/front-desk/board"),
    api<Room[]>("/rooms"),
    api<Guest[]>("/guests"),
  ]);
  return { board, bookings: board.items.map(item => item.booking), rooms, guests };
}

export function loadAvailableRooms(start: string, end: string, excludeBookingId?: string) {
  const query = new URLSearchParams({ start, end });
  if (excludeBookingId) query.set("exclude_booking_id", excludeBookingId);
  return api<Room[]>(`/rooms/available?${query.toString()}`);
}

export function loadHotelContext() {
  return api<ActiveHotelContext>("/auth/me");
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

export function reassignBooking(bookingId: string, roomId: FormDataEntryValue | null, reason: FormDataEntryValue | null) {
  return api(`/bookings/${bookingId}/reassign`, { method: "POST", body: JSON.stringify({ room_id: roomId, reason }) });
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
