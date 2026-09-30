import { afterEach, describe, expect, it, vi } from "vitest";
import { loadReceptionBoard, loadReceptionGuests, loadReceptionRooms, loadRecoverableReservationOperations } from "./reception-api";

afterEach(() => vi.unstubAllGlobals());

describe("Reception progressive reads", () => {
  it("starts independent reads and lets the board resolve while all auxiliaries are pending", async () => {
    const resolve = new Map<string, (response: Response) => void>();
    const started: string[] = [];
    vi.stubGlobal("fetch", vi.fn((input: RequestInfo | URL) => {
      const path = String(input);
      started.push(path);
      return new Promise<Response>(accept => resolve.set(path, accept));
    }));

    const boardRequest = loadReceptionBoard();
    const roomsRequest = loadReceptionRooms();
    const guestsRequest = loadReceptionGuests();
    const recoveryRequest = loadRecoverableReservationOperations();
    expect(started).toEqual([
      "/api/v1/front-desk/board",
      "/api/v1/rooms",
      "/api/v1/guests",
      "/api/v1/reservation-creation-operations",
    ]);

    resolve.get("/api/v1/front-desk/board")!(new Response(JSON.stringify({ date: "2026-09-29", generated_at: "2026-09-29T12:00:00Z", items: [] }), { status: 200 }));
    await expect(boardRequest).resolves.toMatchObject({ items: [] });
    expect(resolve.has("/api/v1/rooms")).toBe(true);
    expect(resolve.has("/api/v1/guests")).toBe(true);
    expect(resolve.has("/api/v1/reservation-creation-operations")).toBe(true);

    for (const path of ["/api/v1/rooms", "/api/v1/guests", "/api/v1/reservation-creation-operations"]) {
      resolve.get(path)!(new Response("[]", { status: 200 }));
    }
    await expect(Promise.all([roomsRequest, guestsRequest, recoveryRequest])).resolves.toEqual([[], [], []]);
  });

  it("keeps a board read available when one auxiliary read fails", async () => {
    const resolve = new Map<string, (response: Response) => void>();
    vi.stubGlobal("fetch", vi.fn((input: RequestInfo | URL) => new Promise<Response>(accept => resolve.set(String(input), accept))));
    const boardRequest = loadReceptionBoard();
    const roomsRequest = loadReceptionRooms();
    resolve.get("/api/v1/front-desk/board")!(new Response(JSON.stringify({ date: "2026-09-29", generated_at: "2026-09-29T12:00:00Z", items: [{ booking: { id: "known" } }] }), { status: 200 }));
    await expect(boardRequest).resolves.toMatchObject({ items: [{ booking: { id: "known" } }] });
    resolve.get("/api/v1/rooms")!(new Response(JSON.stringify({ error: { message: "rooms unavailable" } }), { status: 503 }));
    await expect(roomsRequest).rejects.toThrow();
  });
});
