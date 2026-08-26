import { createRemoteJWKSet, jwtVerify } from "jose";

export type AccessIdentity = { subject: string; email: string; };
type AccessEnvironment = { ENVIRONMENT?: string; ACCESS_TEAM_DOMAIN?: string; ACCESS_AUDIENCE?: string; LOCAL_DEV_AUTH?: string; STAGING_ACCEPTANCE_AUTH?: string; };
const stagingAcceptanceIdentity = { subject: "source-user:14000000-0000-0000-0000-000000000001", email: "ana-admin@migration.invalid" } as const;

export class AccessAuthenticationError extends Error {
  public readonly status = 401;
  public constructor(message = "Access identity required") { super(message); this.name = "AccessAuthenticationError"; }
}

async function verifyAccessAssertion(request: Request, env: AccessEnvironment): Promise<AccessIdentity> {
  const assertion = request.headers.get("Cf-Access-Jwt-Assertion")?.trim();
  if (!assertion || !env.ACCESS_TEAM_DOMAIN || !env.ACCESS_AUDIENCE) throw new AccessAuthenticationError();
  try {
    const teamDomain = new URL(env.ACCESS_TEAM_DOMAIN);
    const jwks = createRemoteJWKSet(new URL("/cdn-cgi/access/certs", `${teamDomain.toString().replace(/\/$/, "")}/`));
    const { payload } = await jwtVerify(assertion, jwks, {
      issuer: teamDomain.toString().replace(/\/$/, ""), audience: env.ACCESS_AUDIENCE,
    });
    if (typeof payload.sub !== "string" || typeof payload.email !== "string") {
      throw new AccessAuthenticationError("Access identity claims incomplete");
    }
    return { subject: payload.sub, email: payload.email };
  } catch (error) {
    if (error instanceof AccessAuthenticationError) throw error;
    throw new AccessAuthenticationError("Invalid Access assertion");
  }
}

/** Production authenticates with Access. The staging bridge additionally requires
 * a valid Access JWT before mapping the Access-gated fixture journey to its fixed identity. */
export async function resolveAccessIdentity(request: Request, env: AccessEnvironment): Promise<AccessIdentity> {
  const hostname = new URL(request.url).hostname;
  const localHost = hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
  if (env.ENVIRONMENT === "development" && env.LOCAL_DEV_AUTH === "true" && localHost) {
    const subject = request.headers.get("x-local-access-subject")?.trim();
    const email = request.headers.get("x-local-access-email")?.trim();
    if (!subject || !email) throw new AccessAuthenticationError();
    return { subject, email };
  }
  if (env.ENVIRONMENT === "staging" && env.STAGING_ACCEPTANCE_AUTH === "true" &&
      request.headers.get("x-hms-staging-gateway")?.trim() === "access-gated-web") {
    const subject = request.headers.get("x-staging-access-subject")?.trim();
    const email = request.headers.get("x-staging-access-email")?.trim();
    if (subject !== stagingAcceptanceIdentity.subject || email !== stagingAcceptanceIdentity.email) {
      throw new AccessAuthenticationError("Invalid staging acceptance identity");
    }
    await verifyAccessAssertion(request, env);
    return stagingAcceptanceIdentity;
  }
  return verifyAccessAssertion(request, env);
}
