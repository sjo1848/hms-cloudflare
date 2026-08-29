import { ApiError } from "./errors";
import {
  findAvailableRoom,
  findRoomById,
  listAvailableRooms,
  type AvailableRoomRow,
} from "./modules/inventory/availability";
import { nights, totalCents } from "./modules/bookings/domain";
import {
  OperationalRoutingError,
  resolveOperationalDatabaseBinding,
  type OperationalDatabase,
} from "./routing";
import { dateRange, requiredText } from "./validation";

export type AgentHmsCallContext = {
  tenantId: string;
  hotelId: string;
  actorId: string;
  sessionId: string;
  traceId: string;
};

export type AgentAvailabilityInput = {
  start: string;
  end: string;
};

export type AgentQuoteInput = AgentAvailabilityInput & {
  roomId: string;
};

export type AgentRoom = {
  id: string;
  roomNumber: string;
  roomType: string;
  status: string;
  priceCents: number;
  currency: "ARS";
};

export type AgentAvailabilityData = {
  source: "hms";
  truth: "transactional";
  hotelId: string;
  start: string;
  end: string;
  capacityMode: "not_modeled";
  rooms: AgentRoom[];
  traceId: string;
};

export type AgentQuoteData = {
  source: "hms";
  truth: "transactional";
  hotelId: string;
  roomId: string;
  start: string;
  end: string;
  nights: number;
  nightlyRateCents: number;
  totalCents: number;
  currency: "ARS";
  traceId: string;
};

export type AgentHmsErrorCode =
  | "VALIDATION_ERROR"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "INTERNAL_ERROR";

export type AgentHmsResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: AgentHmsErrorCode; message: string; traceId: string } };

type HotelRouteRow = {
  id: string;
  operational_binding: string;
};

function agentRoom(row: AvailableRoomRow): AgentRoom {
  return {
    id: row.id,
    roomNumber: row.room_number,
    roomType: row.room_type,
    status: row.status,
    priceCents: row.price_cents,
    currency: "ARS",
  };
}

function normalizeContext(value: AgentHmsCallContext): AgentHmsCallContext {
  if (!value || typeof value !== "object") throw ApiError.badRequest("agent context is required");
  return {
    tenantId: requiredText(value.tenantId, "tenantId", 1, 100),
    hotelId: requiredText(value.hotelId, "hotelId", 1, 100),
    actorId: requiredText(value.actorId, "actorId", 1, 150),
    sessionId: requiredText(value.sessionId, "sessionId", 1, 150),
    traceId: requiredText(value.traceId, "traceId", 1, 150),
  };
}

function normalizeError(error: unknown, traceId: string): AgentHmsResult<never> {
  if (error instanceof ApiError) {
    const code: AgentHmsErrorCode =
      error.code === "INVALID_INPUT"
        ? "VALIDATION_ERROR"
        : error.code === "FORBIDDEN"
          ? "FORBIDDEN"
          : error.code === "NOT_FOUND"
            ? "NOT_FOUND"
            : error.code === "CONFLICT"
              ? "CONFLICT"
              : "INTERNAL_ERROR";
    return { ok: false, error: { code, message: error.message, traceId } };
  }
  if (error instanceof OperationalRoutingError) {
    return { ok: false, error: { code: "FORBIDDEN", message: "Hotel operational binding unavailable", traceId } };
  }
  console.error(JSON.stringify({ event: "agent_hms_error", traceId, message: error instanceof Error ? error.message : "unknown" }));
  return { ok: false, error: { code: "INTERNAL_ERROR", message: "Internal HMS error", traceId } };
}

export class AgentHmsReadService {
  public constructor(private readonly env: Env) {}

  private async resolveHotel(context: AgentHmsCallContext): Promise<{ hotelId: string; database: OperationalDatabase }> {
    const hotel = await this.env.CONTROL_DB.prepare(
      "SELECT id, operational_binding FROM control_hotels WHERE id = ?1 AND active = 1 LIMIT 1",
    ).bind(context.hotelId).first<HotelRouteRow>();
    if (!hotel) throw ApiError.notFound("Hotel not found");
    return {
      hotelId: hotel.id,
      database: resolveOperationalDatabaseBinding(this.env, hotel.operational_binding),
    };
  }

  public async checkAvailability(
    rawContext: AgentHmsCallContext,
    input: AgentAvailabilityInput,
  ): Promise<AgentHmsResult<AgentAvailabilityData>> {
    let traceId = "unknown";
    try {
      const context = normalizeContext(rawContext);
      traceId = context.traceId;
      const range = dateRange(input?.start, input?.end);
      const { hotelId, database } = await this.resolveHotel(context);
      const rooms = await listAvailableRooms(database, range.start, range.end);
      return {
        ok: true,
        data: {
          source: "hms",
          truth: "transactional",
          hotelId,
          start: range.start,
          end: range.end,
          capacityMode: "not_modeled",
          rooms: rooms.map(agentRoom),
          traceId,
        },
      };
    } catch (error) {
      return normalizeError(error, traceId);
    }
  }

  public async getQuote(
    rawContext: AgentHmsCallContext,
    input: AgentQuoteInput,
  ): Promise<AgentHmsResult<AgentQuoteData>> {
    let traceId = "unknown";
    try {
      const context = normalizeContext(rawContext);
      traceId = context.traceId;
      const roomId = requiredText(input?.roomId, "roomId", 1, 100);
      const range = dateRange(input?.start, input?.end);
      const { hotelId, database } = await this.resolveHotel(context);
      const room = await findRoomById(database, roomId);
      if (!room) throw ApiError.notFound("Room not found");
      const availableRoom = await findAvailableRoom(database, roomId, range.start, range.end);
      if (!availableRoom) throw ApiError.conflict("Room is unavailable for the requested dates");
      const stayNights = nights(range.start, range.end).length;
      const total = totalCents(availableRoom.price_cents, stayNights);
      if (total == null) throw ApiError.badRequest("quote total exceeds the supported integer range");
      return {
        ok: true,
        data: {
          source: "hms",
          truth: "transactional",
          hotelId,
          roomId: availableRoom.id,
          start: range.start,
          end: range.end,
          nights: stayNights,
          nightlyRateCents: availableRoom.price_cents,
          totalCents: total,
          currency: "ARS",
          traceId,
        },
      };
    } catch (error) {
      return normalizeError(error, traceId);
    }
  }
}
