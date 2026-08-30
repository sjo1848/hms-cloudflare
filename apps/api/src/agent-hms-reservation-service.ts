import { ApiError } from "./errors";
import { D1BookingRepository } from "./modules/bookings/d1-booking-repository";
import { nights, totalCents, type BookingMutationProvenance, type BookingRow } from "./modules/bookings/domain";
import type { BookingRepository } from "./modules/bookings/ports";
import type { OperationalDatabase } from "./routing";
import { dateRange, requiredText } from "./validation";
import {
  normalizeAgentHmsContext,
  normalizeAgentHmsError,
  resolveAgentHotel,
  type AgentHmsCallContext,
  type AgentHmsResult,
} from "./agent-hms-read-service";

export type AgentReservationInput = {
  operationToken: string;
  guestId: string;
  roomId: string;
  start: string;
  end: string;
  notes?: string | null;
};

export type AgentCancelReservationInput = {
  operationToken: string;
  bookingId: string;
};

export type AgentReservationData = {
  source: "hms";
  truth: "transactional";
  hotelId: string;
  bookingId: string;
  guestId: string;
  roomId: string;
  start: string;
  end: string;
  status: string;
  totalCents: number;
  currency: "ARS";
  replayed: boolean;
  traceId: string;
};

type ResolveHotel = (
  env: Env,
  context: AgentHmsCallContext,
) => Promise<{ hotelId: string; database: OperationalDatabase }>;

type RepositoryFactory = (database: OperationalDatabase) => BookingRepository;

export type AgentHmsReservationServiceDeps = {
  resolveHotel?: ResolveHotel;
  repositoryFactory?: RepositoryFactory;
  now?: () => Date;
};

function optionalNotes(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value !== "string" || value.trim().length > 500) throw ApiError.badRequest("notes length is invalid");
  const normalized = value.trim();
  return normalized || null;
}

function sameReservation(
  row: BookingRow,
  input: { guestId: string; roomId: string; start: string; end: string; notes: string | null },
): boolean {
  return row.guest_id === input.guestId
    && row.room_id === input.roomId
    && row.check_in === input.start
    && row.check_out === input.end
    && row.notes === input.notes;
}

function mutationProvenance(context: AgentHmsCallContext, hotelId: string): BookingMutationProvenance {
  return {
    tenantId: context.tenantId,
    hotelId,
    actorId: context.actorId,
    sessionId: context.sessionId,
    traceId: context.traceId,
  };
}

function reservationData(
  row: BookingRow,
  hotelId: string,
  traceId: string,
  replayed: boolean,
): AgentReservationData {
  return {
    source: "hms",
    truth: "transactional",
    hotelId,
    bookingId: row.id,
    guestId: row.guest_id,
    roomId: row.room_id,
    start: row.check_in,
    end: row.check_out,
    status: row.status,
    totalCents: row.total_cents,
    currency: "ARS",
    replayed,
    traceId,
  };
}

function bytesToUuid(bytes: Uint8Array): string {
  const stable = bytes.slice(0, 16);
  stable[6] = (stable[6] & 0x0f) | 0x50;
  stable[8] = (stable[8] & 0x3f) | 0x80;
  const hex = [...stable].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export async function reservationBookingId(
  context: AgentHmsCallContext,
  operationToken: string,
): Promise<string> {
  const canonical = `${context.tenantId}\u0000${context.hotelId}\u0000${context.actorId}\u0000${operationToken}`;
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonical));
  return bytesToUuid(new Uint8Array(digest));
}

export class AgentHmsReservationService {
  private readonly resolveHotel: ResolveHotel;
  private readonly repositoryFactory: RepositoryFactory;
  private readonly now: () => Date;

  public constructor(private readonly env: Env, deps: AgentHmsReservationServiceDeps = {}) {
    this.resolveHotel = deps.resolveHotel ?? resolveAgentHotel;
    this.repositoryFactory = deps.repositoryFactory ?? ((database) => new D1BookingRepository(database));
    this.now = deps.now ?? (() => new Date());
  }

  public async createReservation(
    rawContext: AgentHmsCallContext,
    input: AgentReservationInput,
  ): Promise<AgentHmsResult<AgentReservationData>> {
    let traceId = "unknown";
    try {
      const context = normalizeAgentHmsContext(rawContext);
      traceId = context.traceId;
      const operationToken = requiredText(input?.operationToken, "operationToken", 8, 200);
      const guestId = requiredText(input?.guestId, "guestId", 1, 100);
      const roomId = requiredText(input?.roomId, "roomId", 1, 100);
      const range = dateRange(input?.start, input?.end);
      const notes = optionalNotes(input?.notes);
      const { hotelId, database } = await this.resolveHotel(this.env, context);
      const repository = this.repositoryFactory(database);
      const bookingId = await reservationBookingId(context, operationToken);
      const expected = { guestId, roomId, start: range.start, end: range.end, notes };

      const existing = await repository.find(bookingId);
      if (existing) {
        if (!sameReservation(existing, expected)) {
          throw ApiError.conflict("Idempotency token was already used for a different reservation");
        }
        return { ok: true, data: reservationData(existing, hotelId, traceId, true) };
      }

      const claimNights = nights(range.start, range.end);
      const priceCents = await repository.validateReferences(guestId, roomId, null, range.start, range.end);
      if (priceCents == null) {
        const raced = await repository.find(bookingId);
        if (raced && sameReservation(raced, expected)) {
          return { ok: true, data: reservationData(raced, hotelId, traceId, true) };
        }
        if (raced) throw ApiError.conflict("Idempotency token was already used for a different reservation");
        throw ApiError.conflict("Guest, room or availability is invalid");
      }

      const total = totalCents(priceCents, claimNights.length);
      if (total == null) throw ApiError.badRequest("booking total exceeds the supported integer range");

      try {
        const now = this.now().toISOString();
        await repository.create({
          id: bookingId,
          guestId,
          roomId,
          start: range.start,
          end: range.end,
          totalCents: total,
          notes,
          now,
          claimNights,
          provenance: mutationProvenance(context, hotelId),
        });
      } catch (createError) {
        const raced = await repository.find(bookingId);
        if (raced && sameReservation(raced, expected)) {
          return { ok: true, data: reservationData(raced, hotelId, traceId, true) };
        }
        if (raced) throw ApiError.conflict("Idempotency token was already used for a different reservation");

        const stillValid = await repository.validateReferences(guestId, roomId, null, range.start, range.end);
        if (stillValid == null) throw ApiError.conflict("Room is unavailable for one or more nights");
        throw createError;
      }

      const row = await repository.find(bookingId);
      if (!row) {
        // D1 INSERT ... SELECT may validly affect zero rows without throwing when
        // guest/room/hold/reservability changes between validation and create.
        // Classify that ordinary stale-state race like the canonical booking path.
        const stillValid = await repository.validateReferences(guestId, roomId, null, range.start, range.end);
        if (stillValid == null) throw ApiError.conflict("Guest, room or availability changed before reservation creation");
        throw new Error("Reservation create returned without a booking row");
      }
      if (!sameReservation(row, expected)) {
        throw ApiError.conflict("Idempotency token was already used for a different reservation");
      }
      return { ok: true, data: reservationData(row, hotelId, traceId, false) };
    } catch (error) {
      return normalizeAgentHmsError(error, traceId);
    }
  }

  public async cancelReservation(
    rawContext: AgentHmsCallContext,
    input: AgentCancelReservationInput,
  ): Promise<AgentHmsResult<AgentReservationData>> {
    let traceId = "unknown";
    try {
      const context = normalizeAgentHmsContext(rawContext);
      traceId = context.traceId;
      const operationToken = requiredText(input?.operationToken, "operationToken", 8, 200);
      const bookingId = requiredText(input?.bookingId, "bookingId", 1, 100);
      const expectedBookingId = await reservationBookingId(context, operationToken);
      if (bookingId !== expectedBookingId) {
        throw ApiError.forbidden("Reservation does not belong to this operation token");
      }

      const { hotelId, database } = await this.resolveHotel(this.env, context);
      const repository = this.repositoryFactory(database);
      const current = await repository.find(expectedBookingId);
      if (!current) throw ApiError.notFound("Booking not found");
      if (current.status === "CANCELLED") {
        return { ok: true, data: reservationData(current, hotelId, traceId, true) };
      }
      if (current.status !== "CONFIRMED") {
        throw ApiError.conflict("Only confirmed reservations can be cancelled");
      }

      const update = await repository.cancel(
        expectedBookingId,
        this.now().toISOString(),
        mutationProvenance(context, hotelId),
      );
      if (update.meta.changes !== 1) {
        const raced = await repository.find(expectedBookingId);
        if (raced?.status === "CANCELLED") {
          return { ok: true, data: reservationData(raced, hotelId, traceId, true) };
        }
        throw ApiError.conflict("Reservation changed before cancellation");
      }

      const row = await repository.find(expectedBookingId);
      if (!row) throw new Error("Reservation was cancelled but could not be read back");
      if (row.status !== "CANCELLED") throw new Error("Reservation cancellation was not applied");
      return { ok: true, data: reservationData(row, hotelId, traceId, false) };
    } catch (error) {
      return normalizeAgentHmsError(error, traceId);
    }
  }
}
