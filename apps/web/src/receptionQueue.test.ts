import { describe, expect, it } from "vitest";
import { buildReceptionQueue, filterReceptionQueue, receptionQueueCounts } from "./receptionQueue";

const booking = (overrides: Partial<{ id: string; guest_name: string; room_number: string; check_in: string; check_out: string; status: string }> = {}) => ({
  id: "booking-1",
  guest_name: "Ana Pérez",
  room_number: "10",
  check_in: "2026-09-13",
  check_out: "2026-09-15",
  status: "Confirmed",
  ...overrides,
});

describe("reception queue", () => {
  it("prioritizes overdue departures before arrivals and routine stays", () => {
    const queue = buildReceptionQueue([
      booking({ id: "future", guest_name: "Future", check_in: "2026-09-15" }),
      booking({ id: "arrival", guest_name: "Arrival" }),
      booking({ id: "stay", guest_name: "Stay", status: "CheckedIn", check_out: "2026-09-15" }),
      booking({ id: "departure", guest_name: "Departure", status: "CheckedIn", check_out: "2026-09-12" }),
    ], "2026-09-13");

    expect(queue.map(item => item.booking.id)).toEqual(["departure", "arrival", "future", "stay"]);
    expect(queue[0].attention).toBe(true);
    expect(queue[0].title).toContain("Salida");
  });

  it("keeps attention focused on work requiring action now", () => {
    const queue = buildReceptionQueue([
      booking({ id: "arrival" }),
      booking({ id: "future", check_in: "2026-09-16" }),
      booking({ id: "stay", status: "CheckedIn", check_out: "2026-09-17" }),
    ], "2026-09-13");

    expect(filterReceptionQueue(queue, "attention", "").map(item => item.booking.id)).toEqual(["arrival"]);
    expect(receptionQueueCounts(queue)).toEqual({ attention: 1, arrivals: 2, departures: 0, "in-house": 1, all: 3 });
  });

  it("searches accent-insensitively by guest and room", () => {
    const queue = buildReceptionQueue([
      booking({ id: "ana", guest_name: "Ana Pérez", room_number: "12" }),
      booking({ id: "leo", guest_name: "Leonardo Gómez", room_number: "4" }),
    ], "2026-09-13");

    expect(filterReceptionQueue(queue, "all", "perez").map(item => item.booking.id)).toEqual(["ana"]);
    expect(filterReceptionQueue(queue, "all", "hab 12").length).toBe(0);
    expect(filterReceptionQueue(queue, "all", "12").map(item => item.booking.id)).toEqual(["ana"]);
  });

  it("routes checked-in departures and future confirmed reservations into their operational lanes", () => {
    const queue = buildReceptionQueue([
      booking({ id: "departure", status: "CHECKED_IN", check_out: "2026-09-13" }),
      booking({ id: "arrival", status: "CONFIRMED", check_in: "2026-09-14" }),
    ], "2026-09-13");

    expect(filterReceptionQueue(queue, "departures", "")[0].booking.id).toBe("departure");
    expect(filterReceptionQueue(queue, "arrivals", "")[0].booking.id).toBe("arrival");
  });
});
