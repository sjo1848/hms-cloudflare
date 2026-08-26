import { createRemoteJWKSet, jwtVerify } from "jose";

export type AccessIdentity = {
  subject: string;
  email: string;
};

type AccessEnvironment = {
  ENVIRONMENT?: string;
  ACCESS_TEAM_DOMAIN?: string;
  ACCESS_AUDIENCE?: string;
  LOCAL_DEV_AUTH?: string;
  STAGING_ACCEPTANCE_AUTH?: string;
};

export class AccessAuthenticationError extends Error {
  public readonly status = 401;

  public constructor(message = "Access identity required") {
    super(message);
    this.name = "AccessAuthenticationError";
  }
}

/**
 * Production authentication is Cloudflare Access JWT validation. Local acceptance
 * remains loopback-only. Staging acceptance has a separate explicit bridge that
 * is valid only when the private API is invoked by the Access-gated web Worker.
 */
export async function resolveAccessIdentity(
  request: Request,
  env: AccessEnvironment,
): Promise<AccessIdentity> {
  const hostname = new URL(request.url).hostname;
  const localHost = hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
  if (env.ENVIRONMENT === "development" && env.LOCAL_DEV_AUTH === "true" && localHost) {
    const subject = request.headers.get("x-local-access-subject")?.trim();
    const email = request.headers.get("x-local-access-email")?.trim();
    if (!subject || !email) {
      throw new AccessAuthenticationError();
    }
    return { subject, email };
  }

  if (
    env.ENVIRONMENT === "staging" &&
    env.STAGING_ACCEPTANCE_AUTH === "true" &&
    request.headers.get("x-hms-staging-gateway")?.trim() === "access-gated-web"
  ) {
    const subject = request.headers.get("x-staging-access-subject")?.trim();
    const email = request.headers.get("x-staging-access-email")?.trim();
    if (!subject || !email) {
      throw new AccessAuthenticationError("Staging acceptance identity required");
    }
    return { subject, email };
  }

  const assertion = request.headers.get("Cf-Access-Jwt-Assertion")?.trim();
  if (!assertion || !env.ACCESS_TEAM_DOMAIN || !env.ACCESS_AUDIENCE) {
    throw new AccessAuthenticationError();
  }

  try {
    const teamDomain = new URL(env.ACCESS_TEAM_DOMAIN);
    const jwks = createRemoteJWKSet(
      new URL("/cdn-cgi/access/certs", `${teamDomain.toString().replace(/\/$/, "")}/`),
    );
    const { payload } = await jwtVerify(assertion, jwks, {
      issuer: teamDomain.toString().replace(/\/$/, ""),
      audience: env.ACCESS_AUDIENCE,
    });
    if (typeof payload.sub !== "string" || typeof payload.email !== "string") {
      throw new AccessAuthenticationError("Access identity claims incomplete");
    }
    return { subject: payload.sub, email: payload.email };
  } catch (error) {
    if (error instanceof AccessAuthenticationError) {
      throw error;
    }
    throw new AccessAuthenticationError("Invalid Access assertion");
  }
}
