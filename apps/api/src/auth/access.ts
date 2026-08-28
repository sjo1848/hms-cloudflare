import { createRemoteJWKSet, decodeJwt, jwtVerify } from "jose";

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

function resolveIssuer(assertion: string, env: AccessEnvironment): string {
  if (env.ACCESS_TEAM_DOMAIN) {
    try {
      return new URL(env.ACCESS_TEAM_DOMAIN).toString().replace(/\/$/, "");
    } catch {
      throw new AccessAuthenticationError("Access team domain invalid");
    }
  }

  // Production keeps an explicitly configured issuer. Staging may derive the
  // Cloudflare Access issuer from the token only because the app's random AUD is
  // pinned independently from the Access Apps API during the release workflow.
  if (env.ENVIRONMENT !== "staging") {
    throw new AccessAuthenticationError();
  }

  try {
    const payload = decodeJwt(assertion);
    if (typeof payload.iss !== "string") {
      throw new AccessAuthenticationError("Access issuer missing");
    }
    const issuer = new URL(payload.iss);
    if (
      issuer.protocol !== "https:" ||
      !issuer.hostname.endsWith(".cloudflareaccess.com") ||
      issuer.username ||
      issuer.password ||
      (issuer.pathname !== "/" && issuer.pathname !== "") ||
      issuer.search ||
      issuer.hash
    ) {
      throw new AccessAuthenticationError("Access issuer invalid");
    }
    return issuer.toString().replace(/\/$/, "");
  } catch (error) {
    if (error instanceof AccessAuthenticationError) throw error;
    throw new AccessAuthenticationError("Access issuer invalid");
  }
}

async function verifyAccessAssertion(
  request: Request,
  env: AccessEnvironment,
): Promise<AccessIdentity> {
  const assertion = request.headers.get("Cf-Access-Jwt-Assertion")?.trim();
  if (!assertion || !env.ACCESS_AUDIENCE) {
    throw new AccessAuthenticationError();
  }

  try {
    const issuer = resolveIssuer(assertion, env);
    const jwks = createRemoteJWKSet(new URL("/cdn-cgi/access/certs", `${issuer}/`));
    const { payload } = await jwtVerify(assertion, jwks, {
      issuer,
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

/**
 * Production authentication is Cloudflare Access JWT validation. Local acceptance
 * remains loopback-only. Staging acceptance has a separate explicit bridge, but
 * the bridge is honored only after a Cloudflare-signed assertion whose audience is
 * pinned to the exact staging Access application is verified.
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
    await verifyAccessAssertion(request, env);
    const subject = request.headers.get("x-staging-access-subject")?.trim();
    const email = request.headers.get("x-staging-access-email")?.trim();
    if (!subject || !email) {
      throw new AccessAuthenticationError("Staging acceptance identity required");
    }
    return { subject, email };
  }

  return verifyAccessAssertion(request, env);
}
