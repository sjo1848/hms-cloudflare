import type { Booking, Room } from "../../domain/types";

export type RoomBoardFilter = "attention" | "occupied" | "preparation" | "available" | "all";
export type RoomBoardState = "maintenance" | "dirty" | "cleaning" | "occupied" | "arrival" | "available" | "blocked" | "review";
export type RoomBoardReason =
  | "maintenance"
  | "dirty"
  | "cleaning"
  | "checkout-overdue"
  | "checkout-today"
  | "arrival-overdue"
  | "arrival-today"
  | "occupied"
  | "upcoming-arrival"
  | "available"
  | "blocked"
  | "review";

export type RoomBoardItem = {
  room: Room;
  currentBooking: Booking | null;
  nextBooking: Booking | null;
  state: RoomBoardState;
  reason: RoomBoardReason;
  attention: boolean;
  priority: number;
};

export const roomBoardFilters: RoomBoardFilter[] = ["attention", "occupied", "preparation", "available", "all"];

function normalize(value: string) {
  return value.toLowerCase().replace(/[\s_-]+/g, "");
}

function normalizeSearch(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

export function todayKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function roomNumberValue(roomNumber: string) {
  const value = Number(roomNumber.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(value) ? value : Number.MAX_SAFE_INTEGER;
}

function bookingDateSort(a: Booking, b: Booking) {
  return a.check_in.localeCompare(b.check_in) || a.check_out.localeCompare(b.check_out);
}

export function buildRoomBoard(rooms: Room[], bookings: Booking[], today = todayKey()): RoomBoardItem[] {
  return rooms.map(room => {
    const roomBookings = bookings.filter(booking => booking.room_id === room.id);
    const currentBooking = roomBookings
      .filter(booking => normalize(booking.status) === "checkedin")
      .sort((a, b) => a.check_out.localeCompare(b.check_out))[0] ?? null;
    const nextBooking = roomBookings
      .filter(booking => normalize(booking.status) === "confirmed")
      .sort(bookingDateSort)[0] ?? null;
    const status = normalize(room.status);

    if (status === "maintenance") return { room, currentBooking, nextBooking, state: "maintenance", reason: "maintenance", attention: true, priority: 0 };
    if (status === "dirty") return { room, currentBooking, nextBooking, state: "dirty", reason: "dirty", attention: true, priority: 5 };
    if (status === "cleaning") return { room, currentBooking, nextBooking, state: "cleaning", reason: "cleaning", attention: true, priority: 10 };
    if (currentBooking && currentBooking.check_out < today) return { room, currentBooking, nextBooking, state: "occupied", reason: "checkout-overdue", attention: true, priority: 15 };
    if (currentBooking && currentBooking.check_out === today) return { room, currentBooking, nextBooking, state: "occupied", reason: "checkout-today", attention: true, priority: 20 };
    if (nextBooking && nextBooking.check_in < today) return { room, currentBooking, nextBooking, state: "arrival", reason: "arrival-overdue", attention: true, priority: 25 };
    if (nextBooking && nextBooking.check_in === today) return { room, currentBooking, nextBooking, state: "arrival", reason: "arrival-today", attention: true, priority: 30 };
    if (currentBooking || status === "occupied") return { room, currentBooking, nextBooking, state: "occupied", reason: "occupied", attention: false, priority: 40 };
    if (status === "blocked" || status === "unavailable" || status === "outofservice" || status === "outoforder") return { room, currentBooking, nextBooking, state: "blocked", reason: "blocked", attention: true, priority: 45 };
    if (status === "available" && nextBooking) return { room, currentBooking, nextBooking, state: "available", reason: "upcoming-arrival", attention: false, priority: 50 };
    if (status === "available") return { room, currentBooking, nextBooking, state: "available", reason: "available", attention: false, priority: 60 };
    return { room, currentBooking, nextBooking, state: "review", reason: "review", attention: true, priority: 35 };
  }).sort((a, b) => a.priority - b.priority || roomNumberValue(a.room.room_number) - roomNumberValue(b.room.room_number) || a.room.room_number.localeCompare(b.room.room_number));
}

export function filterRoomBoard(items: RoomBoardItem[], filter: RoomBoardFilter, search: string) {
  const needle = normalizeSearch(search);
  return items.filter(item => {
    const matchesFilter = filter === "all"
      || (filter === "attention" && item.attention)
      || (filter === "occupied" && item.state === "occupied")
      || (filter === "preparation" && ["maintenance", "dirty", "cleaning", "arrival", "blocked"].includes(item.state))
      || (filter === "available" && item.state === "available");
    if (!matchesFilter) return false;
    if (!needle) return true;
    const haystack = normalizeSearch([
      item.room.room_number,
      item.room.room_type,
      item.room.status,
      item.currentBooking?.guest_name ?? "",
      item.nextBooking?.guest_name ?? "",
      item.reason,
    ].join(" "));
    return haystack.includes(needle);
  });
}

export function roomBoardCounts(items: RoomBoardItem[]) {
  return {
    attention: items.filter(item => item.attention).length,
    occupied: items.filter(item => item.state === "occupied").length,
    preparation: items.filter(item => ["maintenance", "dirty", "cleaning", "arrival", "blocked"].includes(item.state)).length,
    available: items.filter(item => item.state === "available").length,
    all: items.length,
  };
}
