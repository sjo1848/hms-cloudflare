import { Hono } from "hono";
import type { Context } from "hono";
import type { ApiVariables } from "../context";
import { ApiError } from "../errors";
import { dateRange, email, jsonBody, requiredText } from "../validation";
import { hasCapability } from "../auth/capabilities";
import { D1BookingRepository } from "../modules/bookings/d1-booking-repository";
import { D1ReservationCreationRepository, type ReservationCreationOperation } from "../modules/bookings/d1-reservation-creation-repository";
import {
  bookingStatusView,
  bookingView,
  isBookingListStatus,
  nights,
  totalCents,
  type BookingUpdateResult,
} from "../modules/bookings/domain";

type BookingApp = Hono<{ Bindings: Env; Variables: ApiVariables }>;

function requireCapability(context: Context<{ Bindings: Env; Variables: ApiVariables }>, capability: string): void {
  if (!hasCapability(context.get("membership").role, capability)) throw ApiError.forbidden();
}

function requireCapabilities(context: Context<{ Bindings: Env; Variables: ApiVariables }>, ...capabilities: string[]): void {
  for (const capability of capabilities) requireCapability(context, capability);
}

function reservationOperationView(operation: ReservationCreationOperation) {
  return {
    operation_token: operation.operation_token,
    stage: operation.stage,
    guest_id: operation.guest_id,
    guest_name: operation.guest_name,
    booking_id: operation.booking_id,
    room_id: operation.room_id,
    check_in: operation.check_in,
    check_out: operation.check_out,
    hotel_id: operation.hotel_id,
    created_at: operation.created_at,
  };
}

function reservationOperationConflict(
  context: Context<{ Bindings: Env; Variables: ApiVariables }>,
  operation: ReservationCreationOperation,
  message: string,
  recoveryReason: "PAYLOAD_MISMATCH" | "ROOM_UNAVAILABLE",
) {
  return context.json({
    error: { code: "CONFLICT", message, requestId: context.get("requestId") },
    operation: reservationOperationView(operation),
    recovery_reason: recoveryReason,
  }, 409);
}

async function payloadDigest(value: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
  return Array.from(digest, byte => byte.toString(16).padStart(2, "0")).join("");
}

function operationToken(value: unknown): string {
  const token = requiredText(value, "operation_token", 36, 36).toLowerCase();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(token)) {
    throw ApiError.badRequest("operation_token must be a UUID");
  }
  return token;
}

function optionalNotes(value: unknown, current: string | null = null): string | null {
  if (value == null) return current;
  if (typeof value !== "string" || value.trim().length > 500) throw ApiError.badRequest("notes length is invalid");
  const normalized = value.trim();
  return normalized || null;
}

function bookingTotal(priceCents: number, stayNights: number): number {
  const total = totalCents(priceCents, stayNights);
  if (total == null) throw ApiError.badRequest("booking total exceeds the supported integer range");
  return total;
}

export function assertBookingUpdateApplied(result: BookingUpdateResult): void {
  if (result.meta.changes !== 1) throw ApiError.conflict("Booking became unavailable during update");
}

export function createBookingRoutes(): BookingApp {
  const app = new Hono<{ Bindings: Env; Variables: ApiVariables }>();

  app.get("/bookings", async (context) => {
    requireCapability(context, "bookings.read");
    const status = context.req.query("status");
    if (status && !isBookingListStatus(status)) throw ApiError.badRequest("status is invalid");
    const start = context.req.query("start"); const end = context.req.query("end");
    const range = start || end ? dateRange(start, end) : null;
    const limitInput = context.req.query("limit"); const limit = limitInput == null ? 100 : Number(limitInput);
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw ApiError.badRequest("limit must be an integer from 1 to 100");
    const repository = new D1BookingRepository(context.get("operationalDatabase"));
    const rows = await repository.list({ status: status?.toUpperCase(), start: range?.start, end: range?.end, limit });
    return context.json(rows.map(row => bookingView(row, context.get("membership").hotelId)));
  });

  app.post("/bookings", async (context) => {
    requireCapability(context, "bookings.write");
    const body = await jsonBody<Record<string, unknown>>(context.req.raw);
    const guestId = requiredText(body.guest_id, "guest_id", 1, 100);
    const roomId = requiredText(body.room_id, "room_id", 1, 100);
    const range = dateRange(body.check_in, body.check_out);
    const notes = optionalNotes(body.notes);
    const repository = new D1BookingRepository(context.get("operationalDatabase"));
    const id = crypto.randomUUID(); const now = new Date().toISOString(); const claimNights = nights(range.start, range.end);
    const pricing = await repository.validatePricingReferences(guestId, roomId, null, range.start, range.end);
    if (!pricing) throw ApiError.conflict("Guest, room or availability is invalid");
    const total = bookingTotal(pricing.priceCents, claimNights.length);
    try {
      await repository.create({ id, guestId, roomId, start: range.start, end: range.end, totalCents: total, notes, now, claimNights,
        roomRateCents: pricing.priceCents, roomPricingVersion: pricing.pricingVersion,
        pricingProvenance: { actorSubject: context.get("identity").subject, hotelId: context.get("membership").hotelId, requestId: context.get("requestId") } });
    } catch { throw ApiError.conflict("Room is unavailable for one or more nights"); }
    const row = await repository.find(id);
    if (!row) throw ApiError.conflict("Guest, room or availability is invalid");
    return context.json(bookingView(row, context.get("membership").hotelId), 201);
  });

  app.get("/reservation-creation-operations", async (context) => {
    requireCapability(context, "guests.read");
    const repository = new D1ReservationCreationRepository(context.get("operationalDatabase"));
    const hotelId = context.get("membership").hotelId;
    const rows = await repository.listIncomplete();
    return context.json(rows.filter(row => row.hotel_id === hotelId).map(reservationOperationView));
  });

  app.get("/reservation-creation-operations/:token", async (context) => {
    requireCapability(context, "guests.read");
    const token = operationToken(context.req.param("token"));
    const repository = new D1ReservationCreationRepository(context.get("operationalDatabase"));
    const operation = await repository.find(token);
    if (!operation || operation.hotel_id !== context.get("membership").hotelId) throw ApiError.notFound("Reservation creation operation not found");
    const booking = operation.stage === "BOOKING_CREATED"
      ? await new D1BookingRepository(context.get("operationalDatabase")).find(operation.booking_id)
      : null;
    if (operation.stage === "BOOKING_CREATED" && !booking) throw ApiError.conflict("Completed reservation could not be reloaded");
    return context.json({ operation: reservationOperationView(operation), booking });
  });

  app.post("/reservation-creation-operations", async (context) => {
    const body = await jsonBody<Record<string, unknown>>(context.req.raw);
    const token = operationToken(body.operation_token);
    const bookingBody = body.booking;
    if (!bookingBody || typeof bookingBody !== "object" || Array.isArray(bookingBody)) throw ApiError.badRequest("booking is invalid");
    const bookingInput = bookingBody as Record<string, unknown>;
    const guestInput = body.guest;
    const existingGuestId = body.guest_id == null ? null : requiredText(body.guest_id, "guest_id", 1, 100);
    if (existingGuestId && guestInput != null) throw ApiError.badRequest("Choose either an existing guest or new guest details");
    const guest = existingGuestId ? null : (() => {
      if (!guestInput || typeof guestInput !== "object" || Array.isArray(guestInput)) throw ApiError.badRequest("guest is required");
      const value = guestInput as Record<string, unknown>;
      return {
        fullName: requiredText(value.full_name, "full_name", 2, 120),
        email: email(value.email),
        phone: value.phone == null ? null : requiredText(value.phone, "phone", 3, 50),
      };
    })();
    const roomId = requiredText(bookingInput.room_id, "room_id", 1, 100);
    const range = dateRange(bookingInput.check_in, bookingInput.check_out);
    const notes = optionalNotes(bookingInput.notes);
    const canonicalPayload = {
      guest: guest ? { mode: "NEW", full_name: guest.fullName, email: guest.email, phone: guest.phone } : { mode: "EXISTING", guest_id: existingGuestId },
      booking: { room_id: roomId, check_in: range.start, check_out: range.end, notes },
    };
    const hash = await payloadDigest(canonicalPayload);
    const hotelId = context.get("membership").hotelId;
    if (guest) requireCapabilities(context, "guests.write", "bookings.write");
    else requireCapability(context, "bookings.write");

    const database = context.get("operationalDatabase");
    const creationRepository = new D1ReservationCreationRepository(database);
    let operation = await creationRepository.find(token);
    if (operation && operation.hotel_id !== hotelId) throw ApiError.notFound("Reservation creation operation not found");
    if (operation && operation.payload_hash !== hash) {
      return reservationOperationConflict(context, operation, "This operation token is already bound to different reservation details. Start a new operation.", "PAYLOAD_MISMATCH");
    }

    const now = new Date().toISOString();
    if (!operation) {
      const record = {
        operationToken: token,
        payloadHash: hash,
        guestId: existingGuestId ?? crypto.randomUUID(),
        bookingId: crypto.randomUUID(),
        guestSource: guest ? "NEW" as const : "EXISTING" as const,
        roomId,
        checkIn: range.start,
        checkOut: range.end,
        hotelId,
        actorSubject: context.get("identity").subject,
        requestId: context.get("requestId"),
        now,
      };
      try {
        if (guest) await creationRepository.createNewGuest(record, guest);
        else {
          const inserted = await creationRepository.createExistingGuest(record);
          if (!inserted) throw ApiError.notFound("Guest not found");
        }
      } catch (error) {
        operation = await creationRepository.find(token);
        if (!operation) {
          if (!guest && error instanceof ApiError) throw error;
          if (guest) {
            if (await creationRepository.emailExists(guest.email)) throw ApiError.conflict("A guest with this email already exists. Select that guest instead of creating a duplicate.");
          }
          throw error;
        }
        if (operation.payload_hash !== hash || operation.hotel_id !== hotelId) {
          return reservationOperationConflict(context, operation, "This operation token was concurrently claimed by different reservation details.", "PAYLOAD_MISMATCH");
        }
      }
      operation ??= await creationRepository.find(token);
    }

    if (!operation) throw ApiError.conflict("Reservation operation could not be recovered");
    if (operation.hotel_id !== hotelId) throw ApiError.notFound("Reservation creation operation not found");
    if (operation.payload_hash !== hash) {
      return reservationOperationConflict(context, operation, "This operation token is already bound to different reservation details. Start a new operation.", "PAYLOAD_MISMATCH");
    }
    const bookingRepository = new D1BookingRepository(database);
    if (operation.stage === "BOOKING_CREATED") {
      const booking = await bookingRepository.find(operation.booking_id);
      if (!booking) throw ApiError.conflict("Completed reservation could not be reloaded");
      return context.json({ operation: reservationOperationView(operation), booking, replayed: true });
    }

    const pricing = await bookingRepository.validatePricingReferences(operation.guest_id, roomId, null, range.start, range.end);
    if (!pricing) return reservationOperationConflict(context, operation, "The selected room is no longer available for these dates. Use the created guest to start a new reservation.", "ROOM_UNAVAILABLE");
    const stayNights = nights(range.start, range.end);
    const lodgingTotal = bookingTotal(pricing.priceCents, stayNights.length);
    if (!Number.isSafeInteger(lodgingTotal)) throw ApiError.badRequest("booking total exceeds the supported integer range");
    const requestId = context.get("requestId");
    try {
      await bookingRepository.create({
        id: operation.booking_id,
        guestId: operation.guest_id,
        roomId,
        start: range.start,
        end: range.end,
        totalCents: lodgingTotal,
        notes,
        now,
        claimNights: stayNights,
        roomRateCents: pricing.priceCents,
        roomPricingVersion: pricing.pricingVersion,
        pricingProvenance: { actorSubject: context.get("identity").subject, hotelId, requestId },
        operationToken: `reservation-create:${operation.booking_id}`,
        recovery: { operationToken: token, payloadHash: hash, actorSubject: context.get("identity").subject, hotelId, requestId },
      });
    } catch (error) {
      const latest = await creationRepository.find(token);
      if (latest?.hotel_id === hotelId && latest.payload_hash === hash && latest.stage === "BOOKING_CREATED") {
        const booking = await bookingRepository.find(latest.booking_id);
        if (booking) return context.json({ operation: reservationOperationView(latest), booking, replayed: true });
      }
      throw error;
    }
    const completed = await creationRepository.find(token);
    if (!completed || completed.hotel_id !== hotelId || completed.payload_hash !== hash || completed.stage !== "BOOKING_CREATED") {
      const current = completed ?? operation;
      return reservationOperationConflict(context, current, "The reservation could not be completed because availability changed. The guest remains saved and can be used for a new reservation.", "ROOM_UNAVAILABLE");
    }
    const booking = await bookingRepository.find(completed.booking_id);
    if (!booking) throw ApiError.conflict("Completed reservation could not be reloaded");
    return context.json({ operation: reservationOperationView(completed), booking, replayed: false }, 201);
  });

  app.get("/bookings/:id", async (context) => {
    requireCapability(context, "bookings.read");
    const repository = new D1BookingRepository(context.get("operationalDatabase"));
    const row = await repository.find(context.req.param("id"));
    if (!row) throw ApiError.notFound("Booking not found");
    return context.json(bookingView(row, context.get("membership").hotelId));
  });

  app.patch("/bookings/:id", async (context) => {
    requireCapability(context, "bookings.write");
    const repository = new D1BookingRepository(context.get("operationalDatabase"));
    const id = context.req.param("id");
    const current = await repository.find(id);
    if (!current) throw ApiError.notFound("Booking not found");
    const body = await jsonBody<Record<string, unknown>>(context.req.raw);
    const requestedStatus = body.status == null ? null : requiredText(body.status, "status", 1, 20).toUpperCase();
    if (requestedStatus && requestedStatus !== "CANCELLED") throw ApiError.badRequest("Only cancellation is supported as a booking status update");

    if (requestedStatus === "CANCELLED") {
      if (current.status !== "CONFIRMED") throw ApiError.conflict("Cancelled bookings cannot be changed");
      assertBookingUpdateApplied(await repository.cancel(id, new Date().toISOString()));
    } else {
      if (current.status !== "CONFIRMED") throw ApiError.conflict("Cancelled bookings cannot be revived");
      const guestId = body.guest_id == null ? current.guest_id : requiredText(body.guest_id, "guest_id", 1, 100);
      const roomId = body.room_id == null ? current.room_id : requiredText(body.room_id, "room_id", 1, 100);
      const range = dateRange(body.check_in ?? current.check_in, body.check_out ?? current.check_out);
      const notes = optionalNotes(body.notes, current.notes);
      const claimNights = nights(range.start, range.end);
      const pricing = await repository.validatePricingReferences(guestId, roomId, id, range.start, range.end);
      if (!pricing) throw ApiError.conflict("Guest, room or availability is invalid");
      const lodging = bookingTotal(pricing.priceCents, claimNights.length);
      const total = lodging + await repository.extraChargeTotal(id);
      if (!Number.isSafeInteger(total)) throw ApiError.badRequest("booking account total exceeds the supported integer range");
      try {
        assertBookingUpdateApplied(await repository.update({
          bookingId: id,
          id,
          guestId,
          roomId,
          start: range.start,
          end: range.end,
          totalCents: total,
          notes,
          now: new Date().toISOString(),
          claimNights,
          roomRateCents: pricing.priceCents,
          roomPricingVersion: pricing.pricingVersion,
          pricingProvenance: { actorSubject: context.get("identity").subject, hotelId: context.get("membership").hotelId, requestId: context.get("requestId") },
        }));
      } catch (error) {
        if (error instanceof ApiError) throw error;
        throw ApiError.conflict("Room is unavailable for one or more nights");
      }
    }

    const row = await repository.find(id);
    if (!row) throw ApiError.notFound("Booking not found");
    return context.json(bookingView(row, context.get("membership").hotelId));
  });

  return app;
}

export { bookingStatusView, isBookingListStatus, nights };
