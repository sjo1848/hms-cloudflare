import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, resolve, sep } from "node:path";

const root = resolve("apps/web/dist");
const proxy = "http://127.0.0.1:8787";
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".woff2": "font/woff2", ".json": "application/json" };

const server = createServer(async (request, response) => {
  if ((request.url ?? "").startsWith("/api/")) {
    try {
      const body = ["GET", "HEAD"].includes(request.method ?? "GET") ? undefined : await new Promise((resolveBody, reject) => {
        const chunks = [];
        request.on("data", chunk => chunks.push(chunk));
        request.on("end", () => resolveBody(Buffer.concat(chunks)));
        request.on("error", reject);
      });
      const headers = { ...request.headers };
      delete headers.host;
      const upstream = await fetch(`${proxy}${request.url}`, { method: request.method, headers, body });
      response.writeHead(upstream.status, Object.fromEntries(upstream.headers.entries()));
      response.end(Buffer.from(await upstream.arrayBuffer()));
    } catch (error) {
      response.writeHead(502, { "content-type": "application/json" }).end(JSON.stringify({ error: String(error) }));
    }
    return;
  }

  const path = new URL(request.url ?? "/", "http://local").pathname;
  const candidate = resolve(root, `.${path}`);
  const safe = candidate === root || candidate.startsWith(`${root}${sep}`);
  const file = safe && existsSync(candidate) && statSync(candidate).isFile() ? candidate : resolve(root, "index.html");
  response.writeHead(200, { "content-type": types[extname(file)] ?? "application/octet-stream" });
  createReadStream(file).pipe(response);
});

server.listen(4181, "127.0.0.1", () => console.log("Block B production trace server on 127.0.0.1:4181; /api forwarded to delayed synthetic Worker proxy"));
