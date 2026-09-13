import { describe, expect, it } from "vitest";
import app from "./index";

describe("API foundation", () => {
  const database = (result: { ready: number } | null, rejects = false) => ({
    prepare: () => ({ bind: () => ({ first: async () => {
      if (rejects) throw new Error("D1 unavailable");
      return result;
    } }) }),
  }) as unknown as D1Database;
  const readyDatabase = database({ ready: 1 });

  it("serves a public health endpoint", async () => {
    const response = await app.request("http://example.test/health");
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: "ok" });
    expect(response.headers.get("x-request-id")).toBeTruthy();
  });

  it("does not expose protected application bootstrap without Access identity", async () => {
    const response = await app.request("http://example.test/api/v1/auth/me", undefined, {
      LOCAL_DEV_AUTH: "false",
      ENVIRONMENT: "development",
      ACCESS_TEAM_DOMAIN: "https://team.cloudflareaccess.com",
      ACCESS_AUDIENCE: "audience",
    });
    expect(response.status).toBe(401);
  });

  it("reports readiness only after every required D1 is queryable", async () => {
    const response = await app.request("http://example.test/ready", undefined, {
      CONTROL_DB: readyDatabase,
      HOTEL_DEMO_DB: readyDatabase,
      HOTEL_SECOND_DB: readyDatabase,
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      status: "ready",
      dependencies: {
        CONTROL_DB: "ready",
        HOTEL_DEMO_DB: "ready",
        HOTEL_SECOND_DB: "ready",
      },
    });
  });

  it("fails readiness truthfully when a required D1 cannot be queried", async () => {
    const unavailableDatabase = database(null, true);
    const response = await app.request("http://example.test/ready", undefined, {
      CONTROL_DB: readyDatabase,
      HOTEL_DEMO_DB: unavailableDatabase,
      HOTEL_SECOND_DB: readyDatabase,
    });
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      status: "not_ready",
      dependencies: {
        CONTROL_DB: "ready",
        HOTEL_DEMO_DB: "unavailable",
        HOTEL_SECOND_DB: "ready",
      },
    });
  });

  it("rejects a reachable schema-only or partially imported D1 without an APPLIED manifest", async () => {
    const response = await app.request("http://example.test/ready", undefined, {
      CONTROL_DB: readyDatabase,
      HOTEL_DEMO_DB: database(null),
      HOTEL_SECOND_DB: readyDatabase,
    });
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      status: "not_ready",
      dependencies: { HOTEL_DEMO_DB: "unavailable" },
    });
  });
  it("returns the authoritative hotel name from control-plane metadata", async () => {
    const control = {
      prepare: (query: string) => ({
        bind: (...values: string[]) => ({
          first: async () => query.includes("network_memberships") ? null : { name: "Hotel Norte" },
          all: async () => ({ results: [{ hotel_id: "hotel-a", role: "receptionist", email: "a@example.test", operational_binding: "HOTEL_DEMO_DB" }] }),
        }),
      }),
    } as unknown as D1Database;
    const response = await app.request("http://127.0.0.1/api/v1/auth/me", { headers: { "x-local-access-subject": "subject-a", "x-local-access-email": "a@example.test", "x-hotel-id": "hotel-a" } }, {
      ENVIRONMENT: "development",
      LOCAL_DEV_AUTH: "true",
      CONTROL_DB: control,
      HOTEL_DEMO_DB: control,
      HOTEL_SECOND_DB: control,
    },);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ hotel_id: "hotel-a", hotel_name: "Hotel Norte" });
  });

});
