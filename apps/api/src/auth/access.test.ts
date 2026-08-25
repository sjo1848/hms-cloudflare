import { describe, expect, it } from "vitest";
import { AccessAuthenticationError, resolveAccessIdentity } from "./access";

describe("Cloudflare Access identity boundary", () => {
  it("fails closed when the Access assertion is absent", async () => {
    await expect(
      resolveAccessIdentity(new Request("https://example.test/api/v1/auth/me"), {
        ACCESS_TEAM_DOMAIN: "https://team.cloudflareaccess.com",
        ACCESS_AUDIENCE: "audience",
      }),
    ).rejects.toThrow(AccessAuthenticationError);
  });

  it("rejects an unsigned or malformed assertion", async () => {
    await expect(
      resolveAccessIdentity(
        new Request("https://example.test/api/v1/auth/me", {
          headers: { "Cf-Access-Jwt-Assertion": "not-a-jwt" },
        }),
        {
          ACCESS_TEAM_DOMAIN: "https://team.cloudflareaccess.com",
          ACCESS_AUDIENCE: "audience",
        },
      ),
    ).rejects.toThrow(AccessAuthenticationError);
  });

  it("requires explicit opt-in for local identity headers", async () => {
    const identity = await resolveAccessIdentity(
      new Request("http://127.0.0.1:8787/api/v1/auth/me", {
        headers: {
          "x-local-access-subject": "local-user",
          "x-local-access-email": "local@example.test",
        },
      }),
      { ENVIRONMENT: "development", LOCAL_DEV_AUTH: "true" },
    );
    expect(identity).toEqual({ subject: "local-user", email: "local@example.test" });
  });

  it("does not enable local auth outside development", async () => {
    await expect(
      resolveAccessIdentity(
        new Request("https://example.test/api/v1/auth/me", {
          headers: {
            "x-local-access-subject": "local-user",
            "x-local-access-email": "local@example.test",
          },
        }),
        { ENVIRONMENT: "production", LOCAL_DEV_AUTH: "true" },
      ),
    ).rejects.toThrow(AccessAuthenticationError);
  });

  it("does not enable local auth on a non-loopback host even with development vars", async () => {
    const request = new Request("https://example.test/api/v1/auth/me", {
      headers: {
        "x-local-access-subject": "local-user",
        "x-local-access-email": "local@example.test",
      },
    });
    Object.defineProperty(request, "cf", { value: { colo: "EZE" } });
    await expect(resolveAccessIdentity(request, { ENVIRONMENT: "development", LOCAL_DEV_AUTH: "true" }))
      .rejects.toThrow(AccessAuthenticationError);
  });

  it("accepts loopback local auth even when Wrangler supplies request.cf", async () => {
    const request = new Request("http://127.0.0.1:8787/api/v1/auth/me", {
      headers: {
        "x-local-access-subject": "local-user",
        "x-local-access-email": "local@example.test",
      },
    });
    Object.defineProperty(request, "cf", { value: { colo: "EZE" } });
    await expect(resolveAccessIdentity(request, { ENVIRONMENT: "development", LOCAL_DEV_AUTH: "true" }))
      .resolves.toEqual({ subject: "local-user", email: "local@example.test" });
  });
});
