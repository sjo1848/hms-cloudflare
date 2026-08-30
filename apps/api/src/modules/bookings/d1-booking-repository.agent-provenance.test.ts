import { describe, expect, it } from "vitest";
import { D1BookingRepository } from "./d1-booking-repository";
import type { BookingMutationProvenance } from "./domain";
import type { OperationalDatabase } from "../../routing";

type CapturedStatement = {
  sql: string;
  params: unknown[];
  bind: (...params: unknown[]) => CapturedStatement;
};

class CapturingDatabase {
  readonly batches: CapturedStatement[][] = [];

  prepare(sql: string): CapturedStatement {
    const statement: CapturedStatement = {
      sql,
      params: [],
      bind: (...params: unknown[]) => {
        statement.params = params;
        return statement;
      },
    };
    return statement;
  }

  async batch(statements: CapturedStatement[]): Promise<unknown[]> {
    this.batches.push(statements);
    return statements.map((_statement, index) => ({ meta: { changes: index === 0 ? 1 : 0 } }));
  }
}

const bookingId = "aaaaaaaa-aaaa-5aaa-8aaa-aaaaaaaaaaaa";
const provenance: BookingMutationProvenance = {
  tenantId: "hotel-demo",
  hotelId: "10000000-0000-0000-0000-000000000001",
  actorId: "visitor-demo",
  sessionId: "session-123",
  traceId: "trace-123",
};

function repository() {
  const database = new CapturingDatabase();
  return {
    database,
    repository: new D1BookingRepository(database as unknown as OperationalDatabase),
  };
}

function auditStatement(batch: CapturedStatement[], action: "CREATE" | "CANCEL") {
  const statement = batch.find((candidate) => candidate.sql.includes("agent_mutation_events"));
  expect(statement, `${action} audit statement missing from D1 batch`).toBeDefined();
  expect(statement?.params).toEqual([
    `${bookingId}:${action}`,
    bookingId,
    action,
    provenance.tenantId,
    provenance.hotelId,
    provenance.actorId,
    provenance.sessionId,
    provenance.traceId,
    "2026-08-30T02:00:00.000Z",
    action === "CREATE" ? "CONFIRMED" : "CANCELLED",
  ]);
  return statement;
}

describe("D1BookingRepository ACP mutation provenance", () => {
  it("commits booking, room-night claims and CREATE provenance in one D1 batch", async () => {
    const { database, repository: repo } = repository();

    await repo.create({
      id: bookingId,
      guestId: "guest-a",
      roomId: "room-a",
      start: "2027-02-10",
      end: "2027-02-12",
      totalCents: 20000,
      notes: "ACP E2E staging",
      now: "2026-08-30T02:00:00.000Z",
      claimNights: ["2027-02-10", "2027-02-11"],
      provenance,
    });

    expect(database.batches).toHaveLength(1);
    const batch = database.batches[0];
    expect(batch).toHaveLength(4);
    expect(batch[0].sql).toContain("INSERT INTO bookings");
    expect(batch.filter((statement) => statement.sql.includes("room_inventory_nights"))).toHaveLength(2);
    auditStatement(batch, "CREATE");
  });

  it("commits cancellation, inventory cleanup and CANCEL provenance in one D1 batch", async () => {
    const { database, repository: repo } = repository();

    const result = await repo.cancel(bookingId, "2026-08-30T02:00:00.000Z", provenance);

    expect(result.meta.changes).toBe(1);
    expect(database.batches).toHaveLength(1);
    const batch = database.batches[0];
    expect(batch).toHaveLength(3);
    expect(batch[0].sql).toContain("status = 'CANCELLED'");
    expect(batch[1].sql).toContain("DELETE FROM room_inventory_nights");
    auditStatement(batch, "CANCEL");
  });

  it("keeps non-agent booking mutations unchanged when provenance is absent", async () => {
    const createCase = repository();
    await createCase.repository.create({
      id: bookingId,
      guestId: "guest-a",
      roomId: "room-a",
      start: "2027-03-10",
      end: "2027-03-11",
      totalCents: 10000,
      notes: null,
      now: "2026-08-30T02:00:00.000Z",
      claimNights: ["2027-03-10"],
    });
    expect(createCase.database.batches[0].some((statement) => statement.sql.includes("agent_mutation_events"))).toBe(false);

    const cancelCase = repository();
    await cancelCase.repository.cancel(bookingId, "2026-08-30T02:00:00.000Z");
    expect(cancelCase.database.batches[0].some((statement) => statement.sql.includes("agent_mutation_events"))).toBe(false);
  });
});
