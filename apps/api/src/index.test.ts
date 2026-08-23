import { describe, expect, it } from "vitest";
import app from "./index";

describe("API foundation", () => {
  it("serves a public health endpoint", async () => {
    const response = await app.request("http://example.test/health");
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: "ok" });
    expect(response.headers.get("x-request-id")).toBeTruthy();
  });

  it("does not expose protected application bootstrap without Access identity", async () => {
    const response = await app.request("http://example.test/api/v1/auth/me", undefined, {
      LOCAL_DEV_AUTH: "false",
      ACCESS_TEAM_DOMAIN: "https://team.cloudflareaccess.com",
      ACCESS_AUDIENCE: "audience",
    });
    expect(response.status).toBe(401);
  });
});
