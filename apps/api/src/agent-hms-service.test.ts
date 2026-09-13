import { describe, expect, it } from "vitest";
import { authorizeAgentHmsCall } from "./agent-hms-authorization";
import { AgentHmsReadService } from "./agent-hms-read-service";

const HOTEL_ID = "10000000-0000-0000-0000-000000000001";
const SECOND_HOTEL_ID = "20000000-0000-0000-0000-000000000002";
const ROOM_ID = "11000000-0000-0000-0000-000000000001";

function createTestEnv(options: { unknownHotel?: boolean; badBinding?: boolean; unavailable?: boolean } = {}) {
  const queries: string[] = [];
  const room = {
    id: ROOM_ID,
    room_number: "101",
    room_type: "STANDARD",
    status: "AVAILABLE",
    price_cents: 10000,
  };

  const controlDb = {
    prepare(query: string) {
      queries.push(query);
      return {
        bind(..._values: unknown[]) {
          return {
            async first<T>() {
              if (options.unknownHotel) return null;
              return {
                id: HOTEL_ID,
                operational_binding: options.badBinding ? "UNKNOWN_DB" : "HOTEL_DEMO_DB",
              } as T;
            },
          };
        },
      };
    },
  };

  const hotelDb = {
    prepare(query: string) {
      queries.push(query);
      if (/\b(INSERT|UPDATE|DELETE|REPLACE)\b/i.test(query)) {
        throw new Error("read-only service attempted a mutation");
      }
      return {
        bind(..._values: unknown[]) {
          return {
            async all<T>() {
              return { results: [room as T] };
            },
            async first<T>() {
              if (query.includes("WHERE r.id = ?1") && options.unavailable) return null;
              return room as T;
            },
          };
        },
      };
    },
    async batch() {
      throw new Error("read-only service attempted a batch mutation");
    },
  };

  const env = {
    CONTROL_DB: controlDb,
    HOTEL_DEMO_DB: hotelDb,
    HOTEL_SECOND_DB: hotelDb,
  } as unknown as Env;

  return { env, queries };
}

const context = {
  tenantId: "hotel-demo",
  hotelId: HOTEL_ID,
  actorId: "visitor-1",
  sessionId: "session-1",
  traceId: "trace-1",
};

const callerProps = {
  clientId: "ai-commerce-platform",
  permissions: ["availability.read", "quote.read"] as Array<"availability.read" | "quote.read">,
  allowedHotelIds: [HOTEL_ID],
};

describe("AgentHms Service Binding authorization", () => {
  it("accepts the expected platform capability", () => {
    expect(() => authorizeAgentHmsCall(callerProps, context, "availability.read")).not.toThrow();
  });

  it("rejects an unknown caller", () => {
    expect(() => authorizeAgentHmsCall({ ...callerProps, clientId: "other-service" }, context, "availability.read"))
      .toThrow(/caller is not authorized/);
  });

  it("rejects an ungranted method capability", () => {
    expect(() => authorizeAgentHmsCall({ ...callerProps, permissions: ["availability.read"] }, context, "quote.read"))
      .toThrow(/capability is not authorized/);
  });

  it("rejects a hotel outside the binding resource grant", () => {
    expect(() => authorizeAgentHmsCall({ ...callerProps, allowedHotelIds: [SECOND_HOTEL_ID] }, context, "availability.read"))
      .toThrow(/hotel is not authorized/);
  });
});

describe("AgentHmsReadService", () => {
  it("returns transactional availability using only read queries", async () => {
    const { env, queries } = createTestEnv();
    const result = await new AgentHmsReadService(env).checkAvailability(context, {
      start: "2026-09-10",
      end: "2026-09-12",
    });

    expect(result).toEqual({
      ok: true,
      data: {
        source: "hms",
        truth: "transactional",
        hotelId: HOTEL_ID,
        start: "2026-09-10",
        end: "2026-09-12",
        capacityMode: "not_modeled",
        rooms: [{
          id: ROOM_ID,
          roomNumber: "101",
          roomType: "STANDARD",
          status: "AVAILABLE",
          priceCents: 10000,
          currency: "ARS",
        }],
        traceId: "trace-1",
      },
    });
    expect(queries.length).toBeGreaterThanOrEqual(2);
    expect(queries.every((query) => query.trimStart().startsWith("SELECT"))).toBe(true);
  });

  it("fails closed for an unknown hotel", async () => {
    const { env } = createTestEnv({ unknownHotel: true });
    const result = await new AgentHmsReadService(env).checkAvailability(context, {
      start: "2026-09-10",
      end: "2026-09-12",
    });
    expect(result).toEqual({
      ok: false,
      error: { code: "NOT_FOUND", message: "Hotel not found", traceId: "trace-1" },
    });
  });

  it("fails closed for an untrusted operational binding", async () => {
    const { env } = createTestEnv({ badBinding: true });
    const result = await new AgentHmsReadService(env).checkAvailability(context, {
      start: "2026-09-10",
      end: "2026-09-12",
    });
    expect(result).toEqual({
      ok: false,
      error: { code: "FORBIDDEN", message: "Hotel operational binding unavailable", traceId: "trace-1" },
    });
  });

  it("returns a deterministic quote for an available room", async () => {
    const { env } = createTestEnv();
    const result = await new AgentHmsReadService(env).getQuote(context, {
      roomId: ROOM_ID,
      start: "2026-09-10",
      end: "2026-09-13",
    });
    expect(result).toEqual({
      ok: true,
      data: {
        source: "hms",
        truth: "transactional",
        hotelId: HOTEL_ID,
        roomId: ROOM_ID,
        start: "2026-09-10",
        end: "2026-09-13",
        nights: 3,
        nightlyRateCents: 10000,
        totalCents: 30000,
        currency: "ARS",
        traceId: "trace-1",
      },
    });
  });

  it("does not quote an unavailable room", async () => {
    const { env } = createTestEnv({ unavailable: true });
    const result = await new AgentHmsReadService(env).getQuote(context, {
      roomId: ROOM_ID,
      start: "2026-09-10",
      end: "2026-09-13",
    });
    expect(result).toEqual({
      ok: false,
      error: { code: "CONFLICT", message: "Room is unavailable for the requested dates", traceId: "trace-1" },
    });
  });

  it("rejects invalid calendar ranges before touching hotel data", async () => {
    const { env, queries } = createTestEnv();
    const result = await new AgentHmsReadService(env).checkAvailability(context, {
      start: "2026-02-31",
      end: "2026-03-02",
    });
    expect(result).toEqual({
      ok: false,
      error: { code: "VALIDATION_ERROR", message: "start must be a valid date", traceId: "trace-1" },
    });
    expect(queries).toHaveLength(0);
  });
});
