import type { FrontDeskItem } from "../../domain/types";

export type QueueFilter = "attention" | "arrivals" | "departures" | "in-house" | "all";
export type QueueLane = "arrival" | "departure" | "in-house" | "reservation" | "finished" | "attention";
export type QueueReason = "departure-overdue" | "departure-today" | "arrival-overdue" | "arrival-today" | "upcoming-arrival" | "in-house" | "finished" | "review";
export type QueueItem = Pick<FrontDeskItem, "booking" | "lane" | "reason" | "attention" | "priority" | "date">;
export const queueFilters: QueueFilter[] = ["attention", "arrivals", "departures", "in-house", "all"];

const norm = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
export function filterQueue<T extends QueueItem>(items: T[], filter: QueueFilter, search: string): T[] {
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
