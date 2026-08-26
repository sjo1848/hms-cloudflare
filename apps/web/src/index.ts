type StagingEnv = Env & { API?: Fetcher };

export default {
  async fetch(request: Request, env: StagingEnv): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) {
      if (!env.API) {
        return new Response("API service binding unavailable", { status: 503 });
      }
      return env.API.fetch(request);
    }
    return env.ASSETS.fetch(request);
  },
};
