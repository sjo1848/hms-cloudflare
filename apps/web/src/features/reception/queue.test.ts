import { describe, expect, it } from "vitest";
import type { Booking } from "../../domain/types";
import { buildQueue, filterQueue, queueCounts } from "./queue";

const booking = (id: string, status: string, check_in: string, check_out: string, guest_name = id, room_number = "1"): Booking => ({
  id, status, check_in, check_out, guest_name, room_number,
  guest_id:`g-${id}`, room_id:`r-${id}`, total_cents:0, notes:null,
});

describe("reception operational queue", () => {
  const today = "2026-09-13";
  const items = [
    booking("future", "Confirmed", "2026-09-15", "2026-09-17", "Futuro", "5"),
    booking("arrival", "Confirmed", today, "2026-09-15", "Pérez", "2"),
    booking("overdue-out", "CheckedIn", "2026-09-10", "2026-09-12", "Salida", "3"),
    booking("in-house", "CheckedIn", "2026-09-12", "2026-09-16", "Casa", "4"),
  ];

  it("prioritizes overdue operational work", () => {
    expect(buildQueue(items, today).map(x => x.booking.id)).toEqual(["overdue-out", "arrival", "future", "in-house"]);
  });

  it("defaults cleanly to cases needing attention", () => {
    const queue = buildQueue(items, today);
    expect(filterQueue(queue, "attention", "").map(x => x.booking.id)).toEqual(["overdue-out", "arrival"]);
  });

  it("reports filter counts", () => {
    expect(queueCounts(buildQueue(items, today))).toEqual({ attention:2, arrivals:1, departures:1, "in-house":1, all:4 });
  });

  it("searches guest names accent-insensitively and rooms", () => {
    const queue = buildQueue(items, today);
    expect(filterQueue(queue, "all", "perez").map(x => x.booking.id)).toEqual(["arrival"]);
    expect(filterQueue(queue, "all", "4").map(x => x.booking.id)).toEqual(["in-house"]);
  });
});
