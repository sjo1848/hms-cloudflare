type StagingEnv = Env & { API?: Fetcher };
type AccessExecutionContext = ExecutionContext & { access?: unknown };

const acceptanceIdentity = {
  subject: "source-user:14000000-0000-0000-0000-000000000001",
  email: "ana-admin@migration.invalid",
  hotelId: "10000000-0000-0000-0000-000000000001",
} as const;

export default {
  async fetch(request: Request, env: StagingEnv, ctx: AccessExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) {
      if (!env.API) {
        return new Response("API service binding unavailable", { status: 503 });
      }
      if (!ctx.access) {
        return new Response("Cloudflare Access authentication required", { status: 401 });
      }

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

      return env.API.fetch(new Request(request, { headers }));
    }
    return env.ASSETS.fetch(request);
  },
};
