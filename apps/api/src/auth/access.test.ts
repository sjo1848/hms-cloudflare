import { exportJWK, generateKeyPair, SignJWT } from "jose";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AccessAuthenticationError, resolveAccessIdentity } from "./access";

afterEach(() => {
  vi.unstubAllGlobals();
});

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

  it("rejects the staging bridge when the Access assertion is absent", async () => {
    const request = new Request("https://hms-cloudflare-web-staging.example.workers.dev/api/v1/auth/me", {
      headers: {
        "x-hms-staging-gateway": "access-gated-web",
        "x-staging-access-subject": "source-user:test",
        "x-staging-access-email": "tester@migration.invalid",
      },
    });
    await expect(resolveAccessIdentity(request, {
      ENVIRONMENT: "staging",
      STAGING_ACCEPTANCE_AUTH: "true",
      ACCESS_TEAM_DOMAIN: "https://team.cloudflareaccess.com",
      ACCESS_AUDIENCE: "audience",
    })).rejects.toThrow(AccessAuthenticationError);
  });

  it("accepts the staging bridge only after verifying the forwarded Access JWT", async () => {
    const issuer = "https://team.cloudflareaccess.com";
    const audience = "audience";
    const { publicKey, privateKey } = await generateKeyPair("RS256");
    const jwk = await exportJWK(publicKey);
    Object.assign(jwk, { kid: "test-key", alg: "RS256", use: "sig" });

    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ keys: [jwk] }), {
      status: 200,
      headers: { "content-type": "application/json", "cache-control": "public, max-age=60" },
    })));

    const assertion = await new SignJWT({ email: "access-user@example.test" })
      .setProtectedHeader({ alg: "RS256", kid: "test-key" })
      .setSubject("access-user")
      .setIssuer(issuer)
      .setAudience(audience)
      .setIssuedAt()
      .setExpirationTime("5m")
      .sign(privateKey);

    const request = new Request("https://hms-cloudflare-web-staging.example.workers.dev/api/v1/auth/me", {
      headers: {
        "Cf-Access-Jwt-Assertion": assertion,
        "x-hms-staging-gateway": "access-gated-web",
        "x-staging-access-subject": "source-user:test",
        "x-staging-access-email": "tester@migration.invalid",
      },
    });

    await expect(resolveAccessIdentity(request, {
      ENVIRONMENT: "staging",
      STAGING_ACCEPTANCE_AUTH: "true",
      ACCESS_TEAM_DOMAIN: issuer,
      ACCESS_AUDIENCE: audience,
    })).resolves.toEqual({ subject: "source-user:test", email: "tester@migration.invalid" });
  });

  it("rejects staging bridge headers when the gateway marker is missing", async () => {
    const request = new Request("https://example.test/api/v1/auth/me", {
      headers: {
        "x-staging-access-subject": "source-user:test",
        "x-staging-access-email": "tester@migration.invalid",
      },
    });
    await expect(resolveAccessIdentity(request, {
      ENVIRONMENT: "staging",
      STAGING_ACCEPTANCE_AUTH: "true",
    })).rejects.toThrow(AccessAuthenticationError);
  });

  it("rejects staging bridge headers in production", async () => {
    const request = new Request("https://example.test/api/v1/auth/me", {
      headers: {
        "x-hms-staging-gateway": "access-gated-web",
        "x-staging-access-subject": "source-user:test",
        "x-staging-access-email": "tester@migration.invalid",
      },
    });
    await expect(resolveAccessIdentity(request, {
      ENVIRONMENT: "production",
      STAGING_ACCEPTANCE_AUTH: "true",
    })).rejects.toThrow(AccessAuthenticationError);
  });
});
