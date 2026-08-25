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
};

export class AccessAuthenticationError extends Error {
  public readonly status = 401;

  public constructor(message = "Access identity required") {
    super(message);
    this.name = "AccessAuthenticationError";
  }
}

/**
 * The production trust boundary is Cloudflare Access. The Worker still requires
 * both the Access assertion and identity headers, and refuses to infer identity
 * from a client-provided hotel identifier. Local auth is opt-in and disabled by
 * the checked-in development configuration.
 */
export async function resolveAccessIdentity(
  request: Request,
  env: AccessEnvironment,
): Promise<AccessIdentity> {
  // Local auth is additionally restricted to loopback hostnames. This remains
  // safe under Wrangler, which may populate request.cf even for local requests,
  // while a remotely deployed Worker cannot satisfy the hostname guard.
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
