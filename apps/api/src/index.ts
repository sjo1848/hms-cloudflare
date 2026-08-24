import { Hono } from "hono";
import {
  AccessAuthenticationError,
  resolveAccessIdentity,
} from "./auth/access";
import {
  listMemberships,
  selectAuthorizedMembership,
} from "./auth/membership";
import type { ApiVariables } from "./context";
import { ApiError } from "./errors";
import { createInventoryRoutes } from "./routes/inventory";
import { createBookingRoutes } from "./routes/bookings";
import { createLifecycleRoutes } from "./routes/lifecycle";
import { createHousekeepingRoutes } from "./routes/housekeeping";
import { createBillingRoutes } from "./routes/billing";
import { createAdminRoutes } from "./routes/admin";
import { OperationalRoutingError, resolveOperationalDatabase } from "./routing";
import { createAnalyticsRoutes } from "./routes/analytics";

const app = new Hono<{ Bindings: Env; Variables: ApiVariables }>();

app.use("*", async (context, next) => {
  const incoming = context.req.header("x-request-id")?.trim();
  const requestId = incoming && incoming.length <= 128 ? incoming : crypto.randomUUID();
  context.set("requestId", requestId);
  await next();
  context.header("x-request-id", requestId);
  context.header("x-content-type-options", "nosniff");
  context.header("referrer-policy", "no-referrer");
});

app.onError((error, context) => {
  const requestId = context.get("requestId");
  if (error instanceof AccessAuthenticationError) {
    return context.json({ error: { code: "UNAUTHORIZED", message: error.message, requestId } }, 401);
  }
  if (error instanceof ApiError) {
    return context.json({ error: { code: error.code, message: error.message, requestId } }, error.status);
  }
  console.error(JSON.stringify({ event: "request_error", requestId, message: error.message }));
  return context.json({ error: { code: "INTERNAL_ERROR", message: "Internal error", requestId } }, 500);
});

app.get("/health", (context) => context.json({ status: "ok" }));

app.get("/ready", (context) => {
  const ready = Boolean(context.env.CONTROL_DB && context.env.HOTEL_DEMO_DB && context.env.HOTEL_SECOND_DB);
  return context.json({ status: ready ? "ready" : "not_ready" }, ready ? 200 : 503);
});

app.use("/api/v1/*", async (context, next) => {
  const identity = await resolveAccessIdentity(context.req.raw, context.env);
  const network = await context.env.CONTROL_DB.prepare("SELECT role FROM network_memberships WHERE access_subject=?1 AND active=1").bind(identity.subject).first<{ role: string }>();
  const networkPath = /^\/api\/v1\/(hotels(?:\/|$)|auth\/me$)/.test(context.req.path);
  const memberships = await listMemberships(context.env.CONTROL_DB, identity);
  const membership = selectAuthorizedMembership(
    memberships,
    context.req.header("x-hotel-id")?.trim(),
  );
  if (!membership && !(network && networkPath)) {
    return context.json(
      {
        error: {
          code: "FORBIDDEN",
          message: "No authorized hotel membership",
          requestId: context.get("requestId"),
        },
      },
      403,
    );
  }
  let operationalDatabase;
  if (!membership) {
    context.set("identity", identity);
    context.set("networkRole", network?.role);
    await next();
    return;
  }
  try {
    operationalDatabase = resolveOperationalDatabase(context.env, membership);
  } catch (error) {
    if (error instanceof OperationalRoutingError) {
      return context.json(
        { error: { code: "FORBIDDEN", message: "Operational hotel binding unavailable", requestId: context.get("requestId") } },
        403,
      );
    }
    throw error;
  }
  context.set("identity", identity);
  context.set("membership", membership);
  context.set("networkRole", network?.role);
  context.set("operationalDatabase", operationalDatabase);
  await next();
});

app.get("/api/v1/auth/me", (context) => {
  const identity = context.get("identity");
  const membership = context.get("membership");
  const networkRole = context.get("networkRole");
  return context.json({
    subject: identity.subject,
    email: identity.email,
    hotel_id: membership?.hotelId ?? null,
    role: membership?.role ?? null,
    operational_binding: membership?.operationalBinding ?? null,
    network_role: networkRole ?? null,
  });
});

app.route("/api/v1", createInventoryRoutes());
app.route("/api/v1", createBookingRoutes());
app.route("/api/v1", createLifecycleRoutes());
app.route("/api/v1", createHousekeepingRoutes());
app.route("/api/v1", createBillingRoutes());
app.route("/api/v1", createAdminRoutes());
app.route("/api/v1", createAnalyticsRoutes());

app.all("/api/v1/*", (context) =>
  context.json(
    {
      error: {
        code: "NOT_IMPLEMENTED",
        message: "Route not found",
        requestId: context.get("requestId"),
      },
    },
    501,
  ),
);

export default app;
export { app };
