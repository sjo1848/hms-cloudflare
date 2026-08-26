import { describe, expect, it } from "vitest";
import worker, { createStagingApiRequest } from "./index";

describe("staging Access-gated API bridge", () => {
  it("discards caller identity headers and injects only the fixed synthetic identity", () => {
    const routed = createStagingApiRequest(new Request("https://staging.example/api/v1/auth/me", {
      headers: {
        "x-local-access-subject": "attacker-local",
        "x-local-access-email": "attacker@example.test",
        "x-staging-access-subject": "attacker-staging",
        "x-staging-access-email": "attacker@example.test",
        "x-hms-staging-gateway": "attacker-gateway",
        "x-hotel-id": "attacker-hotel",
      },
    }));

    expect(routed.headers.get("x-hms-staging-gateway")).toBe("access-gated-web");
    expect(routed.headers.get("x-staging-access-subject")).toBe("source-user:14000000-0000-0000-0000-000000000001");
    expect(routed.headers.get("x-staging-access-email")).toBe("ana-admin@migration.invalid");
    expect(routed.headers.get("x-hotel-id")).toBe("10000000-0000-0000-0000-000000000001");
    expect(routed.headers.get("x-local-access-subject")).toBeNull();
  });

  it("forwards API requests through the private service binding without requiring a non-existent Worker context identity", async () => {
    let forwarded: Request | undefined;
    const api = {
      fetch: async (request: Request) => {
        forwarded = request;
        return new Response(JSON.stringify({ ok: true }), { headers: { "content-type": "application/json" } });
      },
    };
    const response = await worker.fetch(
      new Request("https://staging.example/api/v1/auth/me"),
      { API: api } as unknown as Env & { API: Fetcher },
    );

    expect(response.status).toBe(200);
    expect(forwarded?.headers.get("x-hms-staging-gateway")).toBe("access-gated-web");
  });

  it("does not expose a missing private API binding as an authenticated response", async () => {
    const response = await worker.fetch(
      new Request("https://staging.example/api/v1/auth/me"),
      {} as Env & { API?: Fetcher },
    );
    expect(response.status).toBe(503);
  });
});
