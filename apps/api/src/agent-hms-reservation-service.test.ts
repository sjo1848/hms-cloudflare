import { describe, expect, it } from "vitest";
import { authorizeAgentHmsCall } from "./agent-hms-authorization";
import { AgentHmsReservationService, reservationBookingId } from "./agent-hms-reservation-service";
import type { BookingListQuery, BookingMutationProvenance, BookingRow, BookingUpdateResult, CreateBookingRecord, UpdateBookingRecord } from "./modules/bookings/domain";
import type { BookingRepository } from "./modules/bookings/ports";
import type { OperationalDatabase } from "./routing";

const HOTEL_ID = "10000000-0000-0000-0000-000000000001";
const ROOM_ID = "11000000-0000-0000-0000-000000000001";
const OTHER_ROOM_ID = "11000000-0000-0000-0000-000000000002";
const GUEST_ID = "12000000-0000-0000-0000-000000000001";

const context = {
  tenantId: "hotel-demo",
  hotelId: HOTEL_ID,
  actorId: "visitor-1",
  sessionId: "session-1",
  traceId: "trace-reserve-1",
};

const expectedProvenance = {
  tenantId: "hotel-demo",
  hotelId: HOTEL_ID,
  actorId: "visitor-1",
  sessionId: "session-1",
  traceId: "trace-reserve-1",
};

type FakeOptions = {
  unavailable?: boolean;
  throwBeforeCreate?: boolean;
  throwAfterCreate?: boolean;
};

class FakeBookingRepository implements BookingRepository {
  readonly rows = new Map<string, BookingRow>();
  readonly createProvenance: BookingMutationProvenance[] = [];
  readonly cancelProvenance: BookingMutationProvenance[] = [];
  createCalls = 0;

  constructor(private readonly options: FakeOptions = {}) {}

  async list(_query: BookingListQuery): Promise<BookingRow[]> {
    return [...this.rows.values()];
  }

  async find(id: string): Promise<BookingRow | null> {
    return this.rows.get(id) ?? null;
  }

  async validateReferences(
    _guestId: string,
    _roomId: string,
    _bookingId: string | null,
    _start: string,
    _end: string,
  ): Promise<number | null> {
    return this.options.unavailable ? null : 10000;
  }

  async create(record: CreateBookingRecord): Promise<void> {
    this.createCalls += 1;
    if (record.provenance) this.createProvenance.push(structuredClone(record.provenance));
    if (this.options.throwBeforeCreate) throw new Error("simulated persistence failure");
    if (this.rows.has(record.id)) throw new Error("duplicate booking id");
    this.rows.set(record.id, {
      id: record.id,
      guest_id: record.guestId,
      guest_name: "Ada Norte",
      guest_email: "ada@example.invalid",
      room_id: record.roomId,
      room_number: "101",
      room_type: "STANDARD",
      price_cents: 10000,
      check_in: record.start,
      check_out: record.end,
      status: "CONFIRMED",
      total_cents: record.totalCents,
      notes: record.notes,
      created_at: record.now,
      updated_at: record.now,
    });
    if (this.options.throwAfterCreate) throw new Error("simulated concurrent completion");
  }

  async cancel(bookingId: string, now: string, provenance?: BookingMutationProvenance): Promise<BookingUpdateResult> {
    if (provenance) this.cancelProvenance.push(structuredClone(provenance));
    const row = this.rows.get(bookingId);
    if (!row || row.status !== "CONFIRMED") return { meta: { changes: 0 } };
    this.rows.set(bookingId, { ...row, status: "CANCELLED", updated_at: now });
    return { meta: { changes: 1 } };
  }

  async update(_record: UpdateBookingRecord): Promise<BookingUpdateResult> {
    return { meta: { changes: 0 } };
  }
}

function createService(repository: FakeBookingRepository) {
  return new AgentHmsReservationService({} as Env, {
    resolveHotel: async () => ({ hotelId: HOTEL_ID, database: {} as OperationalDatabase }),
    repositoryFactory: () => repository,
    now: () => new Date("2026-08-30T01:00:00.000Z"),
  });
}

const input = {
  operationToken: "op-reservation-0001",
  guestId: GUEST_ID,
  roomId: ROOM_ID,
  start: "2027-02-10",
  end: "2027-02-12",
  notes: "ACP E2E staging",
};

describe("AgentHms reservation authorization", () => {
  it("requires the reservation.write Service Binding capability", () => {
    expect(() => authorizeAgentHmsCall({
      clientId: "ai-commerce-platform",
      permissions: ["availability.read", "quote.read"],
      allowedHotelIds: [HOTEL_ID],
    }, context, "reservation.write")).toThrow(/capability is not authorized/);

    expect(() => authorizeAgentHmsCall({
      clientId: "ai-commerce-platform",
      permissions: ["reservation.write"],
      allowedHotelIds: [HOTEL_ID],
    }, context, "reservation.write")).not.toThrow();
  });
});

describe("AgentHmsReservationService", () => {
  it("creates a confirmed reservation through the canonical repository with trusted provenance", async () => {
    const repository = new FakeBookingRepository();
    const result = await createService(repository).createReservation(context, input);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data).toMatchObject({
      source: "hms",
      truth: "transactional",
      hotelId: HOTEL_ID,
      guestId: GUEST_ID,
      roomId: ROOM_ID,
      start: "2027-02-10",
      end: "2027-02-12",
      status: "CONFIRMED",
      totalCents: 20000,
      currency: "ARS",
      replayed: false,
      traceId: "trace-reserve-1",
    });
    expect(repository.createCalls).toBe(1);
    expect(repository.createProvenance).toEqual([expectedProvenance]);
    expect(JSON.stringify(repository.createProvenance)).not.toContain(input.operationToken);
  });

  it("replays the same operation token without creating a duplicate or second mutation event", async () => {
    const repository = new FakeBookingRepository();
    const service = createService(repository);
    const first = await service.createReservation(context, input);
    const second = await service.createReservation(context, input);

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    if (!first.ok || !second.ok) return;
    expect(second.data.bookingId).toBe(first.data.bookingId);
    expect(second.data.replayed).toBe(true);
    expect(repository.createCalls).toBe(1);
    expect(repository.rows.size).toBe(1);
    expect(repository.createProvenance).toHaveLength(1);
  });

  it("rejects reuse of the same token for a different reservation", async () => {
    const repository = new FakeBookingRepository();
    const service = createService(repository);
    await service.createReservation(context, input);
    const result = await service.createReservation(context, { ...input, roomId: OTHER_ROOM_ID });

    expect(result).toEqual({
      ok: false,
      error: {
        code: "CONFLICT",
        message: "Idempotency token was already used for a different reservation",
        traceId: "trace-reserve-1",
      },
    });
    expect(repository.createCalls).toBe(1);
  });

  it("recovers a concurrent same-token completion as a replay", async () => {
    const repository = new FakeBookingRepository({ throwAfterCreate: true });
    const result = await createService(repository).createReservation(context, input);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.replayed).toBe(true);
    expect(repository.rows.size).toBe(1);
    expect(repository.createProvenance).toEqual([expectedProvenance]);
  });

  it("preserves an unexpected persistence failure as INTERNAL_ERROR when inventory is still valid", async () => {
    const repository = new FakeBookingRepository({ throwBeforeCreate: true });
    const result = await createService(repository).createReservation(context, input);

    expect(result).toEqual({
      ok: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Internal HMS error",
        traceId: "trace-reserve-1",
      },
    });
    expect(repository.rows.size).toBe(0);
  });

  it("cancels only the reservation derived from the original operation token and replays cleanup safely", async () => {
    const repository = new FakeBookingRepository();
    const service = createService(repository);
    const created = await service.createReservation(context, input);
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const first = await service.cancelReservation(context, {
      operationToken: input.operationToken,
      bookingId: created.data.bookingId,
    });
    const second = await service.cancelReservation(context, {
      operationToken: input.operationToken,
      bookingId: created.data.bookingId,
    });
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    if (!first.ok || !second.ok) return;
    expect(first.data.status).toBe("CANCELLED");
    expect(first.data.replayed).toBe(false);
    expect(second.data.status).toBe("CANCELLED");
    expect(second.data.replayed).toBe(true);
    expect(repository.cancelProvenance).toEqual([expectedProvenance]);
  });

  it("rejects cleanup when booking id does not match the original operation token", async () => {
    const repository = new FakeBookingRepository();
    const service = createService(repository);
    const result = await service.cancelReservation(context, {
      operationToken: input.operationToken,
      bookingId: "00000000-0000-0000-0000-000000000000",
    });
    expect(result).toEqual({
      ok: false,
      error: {
        code: "FORBIDDEN",
        message: "Reservation does not belong to this operation token",
        traceId: "trace-reserve-1",
      },
    });
    expect(repository.cancelProvenance).toHaveLength(0);
  });

  it("returns a conflict when the canonical booking references are unavailable", async () => {
    const repository = new FakeBookingRepository({ unavailable: true });
    const result = await createService(repository).createReservation(context, input);

    expect(result).toEqual({
      ok: false,
      error: {
        code: "CONFLICT",
        message: "Guest, room or availability is invalid",
        traceId: "trace-reserve-1",
      },
    });
    expect(repository.createCalls).toBe(0);
    expect(repository.createProvenance).toHaveLength(0);
  });

  it("rejects an invalid range before resolving hotel data", async () => {
    let resolved = false;
    const service = new AgentHmsReservationService({} as Env, {
      resolveHotel: async () => {
        resolved = true;
        return { hotelId: HOTEL_ID, database: {} as OperationalDatabase };
      },
      repositoryFactory: () => new FakeBookingRepository(),
    });
    const result = await service.createReservation(context, { ...input, start: "2027-02-31" });

    expect(result).toEqual({
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "start must be a valid date",
        traceId: "trace-reserve-1",
      },
    });
    expect(resolved).toBe(false);
  });

  it("scopes deterministic booking ids by actor and tenant context", async () => {
    const one = await reservationBookingId(context, "op-reservation-0001");
    const replay = await reservationBookingId(context, "op-reservation-0001");
    const otherActor = await reservationBookingId({ ...context, actorId: "visitor-2" }, "op-reservation-0001");

    expect(one).toBe(replay);
    expect(one).not.toBe(otherActor);
    expect(one).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });
});
