type StagingEnv = Env & { API?: Fetcher };

const acceptanceIdentity = {
  subject: "source-user:14000000-0000-0000-0000-000000000001",
  email: "ana-admin@migration.invalid",
  hotelId: "10000000-0000-0000-0000-000000000001",
} as const;

/**
 * The API Worker has no public route. This bridge is reachable only through the
 * Web Worker, whose entire staging hostname is protected by Cloudflare Access.
 * Caller-controlled identity headers are always discarded before the fixed,
 * synthetic staging identity is injected.
 */
export function createStagingApiRequest(request: Request): Request {
  const headers = new Headers(request.headers);
  for (const name of [
    "x-local-access-subject",
    "x-local-access-email",
    "x-staging-access-subject",
    "x-staging-access-email",
    "x-hms-staging-gateway",
    "x-hotel-id",
  ]) {
    headers.delete(name);
  }
  headers.set("x-hms-staging-gateway", "access-gated-web");
  headers.set("x-staging-access-subject", acceptanceIdentity.subject);
  headers.set("x-staging-access-email", acceptanceIdentity.email);
  headers.set("x-hotel-id", acceptanceIdentity.hotelId);
  return new Request(request, { headers });
}

export default {
  async fetch(request: Request, env: StagingEnv): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) {
      if (!env.API) {
        return new Response("API service binding unavailable", { status: 503 });
      }
      return env.API.fetch(createStagingApiRequest(request));
    }
    return env.ASSETS.fetch(request);
  },
};
