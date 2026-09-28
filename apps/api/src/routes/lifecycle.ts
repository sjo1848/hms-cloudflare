import { Hono } from "hono";
import type { Context } from "hono";
import type { ApiVariables } from "../context";
import { ApiError } from "../errors";
import { jsonBody, requiredText } from "../validation";
import { hasCapability } from "../auth/capabilities";
import { D1LifecycleRepository } from "../modules/lifecycle/d1-lifecycle-repository";
import {
  checkoutPolicy,
  normalizedCheckoutReference,
  pendingReferenceValid,
  positiveGuestCount,
  reassignmentReason,
  requiredConfirmations,
  requiresCheckoutOverride,
  validHotelLocalDate,
  type LifecycleActor,
} from "../modules/lifecycle/domain";

type LifecycleApp = Hono<{ Bindings: Env; Variables: ApiVariables }>;
type LifecycleBody = Record<string, unknown>;

function requireLifecycle(context: Context<{ Bindings: Env; Variables: ApiVariables }>): void {
  if (!hasCapability(context.get("membership").role, "bookings.write")) throw ApiError.forbidden();
}

function actor(context: Context<{ Bindings: Env; Variables: ApiVariables }>): LifecycleActor {
  return { subject: context.get("identity").subject, requestId: context.get("requestId"), hotelId: context.get("membership").hotelId };
}

export function createLifecycleRoutes(): LifecycleApp {
  const app = new Hono<{ Bindings: Env; Variables: ApiVariables }>();

  app.post("/bookings/:id/check-in", async context => {
    requireLifecycle(context);
    const body = await jsonBody<LifecycleBody>(context.req.raw);
    const missing = requiredConfirmations(body, ["document_verified", "contact_confirmed", "stay_confirmed"]);
    if (missing) throw ApiError.badRequest(`${missing} must be confirmed`);
    const guestCount = positiveGuestCount(body.check_in_guests_count);
    if (guestCount == null) throw ApiError.badRequest("check_in_guests_count must be a positive integer");
    const id = context.req.param("id");
    const repository = new D1LifecycleRepository(context.get("operationalDatabase"));
    const current = await repository.findBooking(id);
    if (!current) throw ApiError.notFound("Booking not found");
    if (current.status !== "CONFIRMED") throw ApiError.conflict("Only confirmed bookings can be checked in");
    try {
      if (!(await repository.checkIn(current, guestCount, actor(context))).ok) throw new Error("check-in guard lost");
    } catch {
      throw ApiError.conflict("Booking became unavailable during check-in");
    }
    return context.json({ id, status: "CheckedIn", room_status: "Occupied" });
  });

  app.post("/bookings/:id/reassign", async context => {
    requireLifecycle(context);
    const body = await jsonBody<LifecycleBody>(context.req.raw);
    const roomId = requiredText(body.room_id, "room_id", 1, 100);
    const reason = reassignmentReason(body.reason);
    if (!reason) throw ApiError.badRequest("reason must be between 6 and 250 characters");
    const id = context.req.param("id");
    const repository = new D1LifecycleRepository(context.get("operationalDatabase"));
    const current = await repository.findBooking(id);
    if (!current) throw ApiError.notFound("Booking not found");
    if (current.status !== "CHECKED_IN") throw ApiError.conflict("Only checked-in bookings can be reassigned");
    if (roomId === current.room_id) throw ApiError.badRequest("room_id must change");
    const hotelLocalDate = context.get("hotelTime")?.localDate;
    if (!validHotelLocalDate(hotelLocalDate)) throw ApiError.unavailable("Hotel-local date context is unavailable");
    const quoteToken = requiredText(body.quote_token, "quote_token", 64, 64);
    try {
      const result = await repository.reassign(current, roomId, reason, hotelLocalDate, quoteToken, actor(context));
      if (!result.ok || !result.reassignment) throw new Error("destination unavailable");
      return context.json({
        id,
        status: "CheckedIn",
        room_id: roomId,
        room_status: "Occupied",
        old_room_id: result.reassignment.oldRoomId,
        new_room_id: result.reassignment.newRoomId,
        hotel_local_date: result.reassignment.hotelLocalDate,
        effective_date: result.reassignment.effectiveDate,
        remaining_interval: {
          start_date: result.reassignment.remainingInterval.startDate,
          end_date_exclusive: result.reassignment.remainingInterval.endDateExclusive,
        },
        total_cents: result.reassignment.totalCents,
        previous_total_cents: result.reassignment.previousTotalCents,
        price_delta_cents: result.reassignment.priceDeltaCents,
      });
    } catch {
      throw ApiError.conflict("Room reassignment failed without changing the booking");
    }
  });

  app.post("/bookings/:id/reassignment-quote", async context => {
    requireLifecycle(context);
    const body = await jsonBody<LifecycleBody>(context.req.raw);
    const roomId = requiredText(body.room_id, "room_id", 1, 100);
    const id = context.req.param("id");
    const repository = new D1LifecycleRepository(context.get("operationalDatabase"));
    const current = await repository.findBooking(id);
    if (!current) throw ApiError.notFound("Booking not found");
    if (current.status !== "CHECKED_IN") throw ApiError.conflict("Only checked-in bookings can be repriced by reassignment");
    const hotelLocalDate = context.get("hotelTime")?.localDate;
    if (!validHotelLocalDate(hotelLocalDate)) throw ApiError.unavailable("Hotel-local date context is unavailable");
    const quote = await repository.quoteReassignment(current, roomId, hotelLocalDate);
    if (!quote) throw ApiError.conflict("Room or booking is not eligible for a current reassignment quote");
    return context.json({
      booking_id: quote.bookingId,
      current_room_id: quote.currentRoomId,
      destination_room_id: quote.destinationRoomId,
      hotel_local_date: quote.hotelLocalDate,
      effective_date: quote.effectiveDate,
      check_out: quote.checkOut,
      destination_rate_cents: quote.destinationRateCents,
      lodging_total_cents: quote.lodgingTotalCents,
      extra_charges_cents: quote.extraChargesCents,
      current_total_cents: quote.currentTotalCents,
      new_total_cents: quote.newTotalCents,
      delta_cents: quote.deltaCents,
      quote_token: quote.quoteToken,
    });
  });

  app.post("/bookings/:id/check-out", async context => {
    requireLifecycle(context);
    const body = await jsonBody<LifecycleBody>(context.req.raw);
    const missing = requiredConfirmations(body, ["charge_reviewed", "release_confirmed", "handoff_confirmed"]);
    if (missing) throw ApiError.badRequest(`${missing} must be confirmed`);
    const policyText = requiredText(body.check_out_payment_policy, "check_out_payment_policy", 1, 30);
    const policy = checkoutPolicy(policyText);
    if (!policy) throw ApiError.badRequest("check_out_payment_policy is invalid");
    if (requiresCheckoutOverride(policy) && !hasCapability(context.get("membership").role, "bookings.checkout.override")) throw ApiError.forbidden();
    const reference = normalizedCheckoutReference(body.check_out_reference);
    if (reference === undefined) throw ApiError.badRequest("check_out_reference length is invalid");
    if (!pendingReferenceValid(policy, reference)) throw ApiError.badRequest("check_out_reference must be at least 6 characters for pending-approved");
    const id = context.req.param("id");
    const repository = new D1LifecycleRepository(context.get("operationalDatabase"));
    const current = await repository.findBooking(id);
    if (!current) throw ApiError.notFound("Booking not found");
    if (current.status !== "CHECKED_IN") {
      if (current.status === "CHECKED_OUT") throw ApiError.conflict("Checkout is already recorded. Refresh the booking and review its current account before taking another action.");
      throw ApiError.conflict("Only checked-in bookings can be checked out");
    }
    try {
      const result = await repository.checkout(current, policy, reference, actor(context));
      if (!result.ok) {
        const account = await repository.checkoutAccount(id);
        if (account) {
          const status = account.invoice_status ?? "not created";
          throw ApiError.conflict(`Checkout was not completed; refresh and review the booking account. Total ${account.amount_cents} cents; paid ${account.paid_cents} cents; ledger ${account.ledger_paid_cents} cents; remaining ${account.remaining_cents} cents; credit ${account.credit_cents} cents; invoice ${status}.`);
        }
        throw ApiError.conflict("Checkout was not completed because the booking or room changed. Refresh the booking before retrying.");
      }
    } catch {
      const account = await repository.checkoutAccount(id);
      if (account?.booking_status === "CHECKED_OUT") throw ApiError.conflict("Checkout is already recorded. Refresh the booking and review its current account before taking another action.");
      if (account) throw ApiError.conflict(`Checkout was rolled back; refresh and review the booking account. Total ${account.amount_cents} cents; paid ${account.paid_cents} cents; ledger ${account.ledger_paid_cents} cents; remaining ${account.remaining_cents} cents; credit ${account.credit_cents} cents; invoice ${account.invoice_status ?? "not created"}.`);
      throw ApiError.conflict("Checkout was rolled back because the booking or room changed. Refresh the booking before retrying.");
    }
    return context.json({ id, status: "CheckedOut", room_status: "Dirty", housekeeping_handoff: true });
  });

  return app;
}
