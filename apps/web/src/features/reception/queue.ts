import type { Booking } from "../../domain/types";

export type QueueFilter = "attention" | "arrivals" | "departures" | "in-house" | "all";
export type QueueLane = "arrival" | "departure" | "in-house" | "reservation" | "finished" | "attention";
export type QueueReason = "departure-overdue" | "departure-today" | "arrival-overdue" | "arrival-today" | "upcoming-arrival" | "in-house" | "finished" | "review";
export type QueueItem = { booking: Booking; lane: QueueLane; reason: QueueReason; attention: boolean; priority: number; date: string };
export const queueFilters: QueueFilter[] = ["attention", "arrivals", "departures", "in-house", "all"];

export function todayKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
}
const statusKey = (value: string) => value.replace(/[\s_-]/g, "").toLowerCase();
const norm = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export function classify(booking: Booking, today: string): QueueItem {
  const status = statusKey(booking.status);
  if (status === "checkedin") {
    if (booking.check_out < today) return { booking, lane:"departure", reason:"departure-overdue", attention:true, priority:0, date:booking.check_out };
    if (booking.check_out === today) return { booking, lane:"departure", reason:"departure-today", attention:true, priority:10, date:booking.check_out };
    return { booking, lane:"in-house", reason:"in-house", attention:false, priority:40, date:booking.check_out };
  }
  if (status === "confirmed") {
    if (booking.check_in < today) return { booking, lane:"arrival", reason:"arrival-overdue", attention:true, priority:5, date:booking.check_in };
    if (booking.check_in === today) return { booking, lane:"arrival", reason:"arrival-today", attention:true, priority:20, date:booking.check_in };
    return { booking, lane:"reservation", reason:"upcoming-arrival", attention:false, priority:30, date:booking.check_in };
  }
  if (["checkedout","cancelled","canceled"].includes(status)) return { booking, lane:"finished", reason:"finished", attention:false, priority:90, date:booking.check_out };
  return { booking, lane:"attention", reason:"review", attention:true, priority:15, date:booking.check_in };
}

export function buildQueue(bookings: Booking[], today = todayKey()) {
  return bookings.map(b => classify(b, today)).sort((a,b) => a.priority-b.priority || a.date.localeCompare(b.date) || a.booking.room_number.localeCompare(b.booking.room_number, undefined, {numeric:true}) || a.booking.guest_name.localeCompare(b.booking.guest_name));
}
export function filterQueue(items: QueueItem[], filter: QueueFilter, search: string) {
  const q = norm(search.trim());
  return items.filter(item => {
    const byFilter = filter === "all" || (filter === "attention" && item.attention) || (filter === "arrivals" && item.lane === "arrival") || (filter === "departures" && item.lane === "departure") || (filter === "in-house" && item.lane === "in-house");
    if (!byFilter || !q) return byFilter;
    return norm([item.booking.guest_name,item.booking.room_number,item.booking.id,item.booking.status,item.lane,item.reason].join(" ")).includes(q);
  });
}
export function queueCounts(items: QueueItem[]) {
  return { attention:items.filter(x=>x.attention).length, arrivals:items.filter(x=>x.lane==="arrival").length, departures:items.filter(x=>x.lane==="departure").length, "in-house":items.filter(x=>x.lane==="in-house").length, all:items.length };
}
