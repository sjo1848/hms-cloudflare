import { describe, expect, it } from "vitest";
import type { Booking, Room } from "../../domain/types";
import { buildRoomBoard, filterRoomBoard, roomBoardCounts } from "./roomBoard";

const room = (id: string, room_number: string, status: string): Room => ({ id, room_number, room_type: "STANDARD", status, price_cents: 18000 });
const booking = (id: string, room_id: string, status: string, check_in: string, check_out: string, guest_name = id): Booking => ({
  id, room_id, status, check_in, check_out, guest_name,
  guest_id: `g-${id}`, room_number: room_id.replace("r", ""), total_cents: 0, notes: null,
});

describe("rooms operational board", () => {
  const today = "2026-09-13";
  const rooms = [
    room("r1", "101", "Available"),
    room("r2", "102", "Occupied"),
    room("r3", "103", "Dirty"),
    room("r4", "104", "Maintenance"),
  ];
  const bookings = [
    booking("arrival", "r1", "Confirmed", today, "2026-09-15", "Pérez"),
    booking("stay", "r2", "CheckedIn", "2026-09-12", today, "López"),
  ];

  it("puts operational blockers and due work first", () => {
    expect(buildRoomBoard(rooms, bookings, today).map(item => item.room.id)).toEqual(["r4", "r3", "r2", "r1"]);
  });

  it("marks due arrivals and departures as attention", () => {
    const board = buildRoomBoard(rooms, bookings, today);
    expect(board.find(item => item.room.id === "r1")?.reason).toBe("arrival-today");
    expect(board.find(item => item.room.id === "r2")?.reason).toBe("checkout-today");
    expect(roomBoardCounts(board).attention).toBe(4);
  });

  it("filters by operational state and searches guests accent-insensitively", () => {
    const board = buildRoomBoard(rooms, bookings, today);
    expect(filterRoomBoard(board, "available", "")).toHaveLength(0);
    expect(filterRoomBoard(board, "all", "perez").map(item => item.room.id)).toEqual(["r1"]);
    expect(filterRoomBoard(board, "preparation", "").map(item => item.room.id)).toEqual(["r4", "r3", "r1"]);
  });
});
