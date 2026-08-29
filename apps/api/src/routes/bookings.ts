import { Hono } from "hono";
import type { Context } from "hono";
import type { ApiVariables } from "../context";
import { ApiError } from "../errors";
import { dateRange, jsonBody, requiredText } from "../validation";
import { hasCapability } from "../auth/capabilities";
import { D1BookingRepository } from "../modules/bookings/d1-booking-repository";
import {
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
    const priceCents = await repository.validateReferences(guestId, roomId, null, range.start, range.end);
    if (priceCents == null) throw ApiError.conflict("Guest, room or availability is invalid");
    const total = bookingTotal(priceCents, claimNights.length);
    try {
      await repository.create({ id, guestId, roomId, start: range.start, end: range.end, totalCents: total, notes, now, claimNights });
    } catch { throw ApiError.conflict("Room is unavailable for one or more nights"); }
    const row = await repository.find(id);
    if (!row) throw ApiError.conflict("Guest, room or availability is invalid");
    return context.json(bookingView(row, context.get("membership").hotelId), 201);
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
      const priceCents = await repository.validateReferences(guestId, roomId, id, range.start, range.end);
      if (priceCents == null) throw ApiError.conflict("Guest, room or availability is invalid");
      const total = bookingTotal(priceCents, claimNights.length);
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

export { nights };
