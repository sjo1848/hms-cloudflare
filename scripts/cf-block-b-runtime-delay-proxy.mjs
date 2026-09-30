import { createServer } from "node:http";

const upstream = "http://127.0.0.1:8788";
const delayMs = Number(process.env.HMS_BLOCK_B_AUX_DELAY_MS ?? 4000);
const auxiliary = new Set([
  "/api/v1/rooms",
  "/api/v1/guests",
  "/api/v1/reservation-creation-operations",
]);

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", "http://localhost");
  if (request.method === "GET" && url.pathname === "/health") {
    response.writeHead(200, { "content-type": "application/json" }).end('{"status":"ok"}');
    return;
  }

  const failPath = request.headers["x-hms-test-fail"];
  if (request.method === "GET" && auxiliary.has(url.pathname) && failPath === url.pathname) {
    response.writeHead(503, { "content-type": "application/json" }).end(JSON.stringify({ error: { code: "INTERNAL_ERROR", message: "Synthetic auxiliary failure injected by Block B runtime test proxy" } }));
    return;
  }

  try {
    const body = ["GET", "HEAD"].includes(request.method ?? "GET") ? undefined : await new Promise((resolve, reject) => {
      const chunks = [];
      request.on("data", chunk => chunks.push(chunk));
      request.on("end", () => resolve(Buffer.concat(chunks)));
      request.on("error", reject);
    });
    const headers = { ...request.headers };
    delete headers.host;
    delete headers["x-hms-test-fail"];
    const perRequestDelay = Number(request.headers["x-hms-test-delay"]);
    delete headers["x-hms-test-delay"];
    const result = await fetch(`${upstream}${request.url}`, { method: request.method, headers, body });
    const bytes = Buffer.from(await result.arrayBuffer());
    if (request.method === "GET" && auxiliary.has(url.pathname)) {
      const effectiveDelay = Number.isFinite(perRequestDelay) && perRequestDelay >= 0 ? perRequestDelay : delayMs;
      console.log(JSON.stringify({ type: "auxiliary-response", path: url.pathname, status: result.status, delayMs: effectiveDelay }));
      await new Promise(resolve => setTimeout(resolve, effectiveDelay));
    }
    const responseHeaders = Object.fromEntries(result.headers.entries());
    delete responseHeaders["content-encoding"];
    delete responseHeaders["content-length"];
    delete responseHeaders["transfer-encoding"];
    response.writeHead(result.status, responseHeaders);
    response.end(bytes);
  } catch (error) {
    response.writeHead(502, { "content-type": "application/json" }).end(JSON.stringify({ error: { code: "UPSTREAM_UNAVAILABLE", message: String(error) } }));
  }
});

server.listen(8787, "127.0.0.1", () => console.log(`Block B test proxy on 127.0.0.1:8787; auxiliary response hold=${delayMs}ms`));
