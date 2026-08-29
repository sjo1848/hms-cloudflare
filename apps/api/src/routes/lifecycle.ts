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
  requiredConfirmations,
  requiresCheckoutOverride,
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
    const id = context.req.param("id");
    const repository = new D1LifecycleRepository(context.get("operationalDatabase"));
    const current = await repository.findBooking(id);
    if (!current) throw ApiError.notFound("Booking not found");
    if (current.status !== "CHECKED_IN") throw ApiError.conflict("Only checked-in bookings can be reassigned");
    if (roomId === current.room_id) throw ApiError.badRequest("room_id must change");
    try {
      if (!(await repository.reassign(current, roomId, actor(context))).ok) throw new Error("destination unavailable");
    } catch {
      throw ApiError.conflict("Room reassignment failed without changing the booking");
    }
    return context.json({ id, status: "CheckedIn", room_id: roomId, room_status: "Occupied" });
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
    if (current.status !== "CHECKED_IN") throw ApiError.conflict("Only checked-in bookings can be checked out");
    try {
      if (!(await repository.checkout(current, policy, reference, actor(context))).ok) throw new Error("checkout guard lost");
    } catch {
      throw ApiError.conflict("Booking became unavailable during checkout");
    }
    return context.json({ id, status: "CheckedOut", room_status: "Dirty", housekeeping_handoff: true });
  });

  return app;
}
