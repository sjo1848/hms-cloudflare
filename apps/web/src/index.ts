export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) {
      return new Response("API is routed to the API Worker", { status: 404 });
    }
    return env.ASSETS.fetch(request);
  },
};
