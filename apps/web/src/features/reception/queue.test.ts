import { describe, expect, it } from "vitest";
import type { Booking } from "../../domain/types";
import { filterQueue, queueCounts, type QueueItem } from "./queue";

const booking = (id: string, status: string, check_in: string, check_out: string, guest_name = id, room_number = "1"): Booking => ({
  id, status, check_in, check_out, guest_name, room_number,
  guest_id:`g-${id}`, room_id:`r-${id}`, total_cents:0, notes:null,
});

describe("reception operational queue", () => {
  const today = "2026-09-13";
  const items: QueueItem[] = [
    { booking: booking("overdue-out", "CheckedIn", "2026-09-10", "2026-09-12", "Salida", "3"), lane: "departure", reason: "departure-overdue", attention: true, priority: 0, date: "2026-09-12" },
    { booking: booking("arrival", "Confirmed", today, "2026-09-15", "Pérez", "2"), lane: "arrival", reason: "arrival-today", attention: true, priority: 20, date: today },
    { booking: booking("future", "Confirmed", "2026-09-15", "2026-09-17", "Futuro", "5"), lane: "reservation", reason: "upcoming-arrival", attention: false, priority: 30, date: "2026-09-15" },
    { booking: booking("in-house", "CheckedIn", "2026-09-12", "2026-09-16", "Casa", "4"), lane: "in-house", reason: "in-house", attention: false, priority: 40, date: "2026-09-16" },
  ];

  it("preserves the board's authoritative order instead of reclassifying or resorting", () => {
    expect(filterQueue(items, "all", "").map(x => x.booking.id)).toEqual(["overdue-out", "arrival", "future", "in-house"]);
  });

  it("defaults cleanly to cases needing attention", () => {
    expect(filterQueue(items, "attention", "").map(x => x.booking.id)).toEqual(["overdue-out", "arrival"]);
  });

  it("reports filter counts", () => {
    expect(queueCounts(items)).toEqual({ attention:2, arrivals:1, departures:1, "in-house":1, all:4 });
  });

  it("searches guest names accent-insensitively and rooms", () => {
    expect(filterQueue(items, "all", "perez").map(x => x.booking.id)).toEqual(["arrival"]);
    expect(filterQueue(items, "all", "4").map(x => x.booking.id)).toEqual(["in-house"]);
  });
});
