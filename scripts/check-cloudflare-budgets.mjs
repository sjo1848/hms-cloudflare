import { readdirSync, readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { join } from "node:path";

const assetsDir = "apps/web/dist/assets";
const files = readdirSync(assetsDir);
const jsFiles = files.filter(file => file.endsWith(".js"));
const cssFiles = files.filter(file => file.endsWith(".css"));
if (!jsFiles.length) throw new Error("Web bundle budget cannot run before web:build");

const sum = (items, transform = value => value.length) => items.reduce((total, file) => total + transform(readFileSync(join(assetsDir, file))), 0);
const jsRaw = sum(jsFiles);
const jsGzip = sum(jsFiles, value => gzipSync(value).length);
const cssRaw = sum(cssFiles);
const cssGzip = sum(cssFiles, value => gzipSync(value).length);

// Baseline before Architecture Hardening II was ~254 KB JS raw / ~75 KB gzip.
// Budgets allow modest feature growth without letting architectural dependencies
// silently consume Cloudflare/browser headroom.
const budgets = { jsRaw: 320_000, jsGzip: 100_000, cssRaw: 50_000, cssGzip: 15_000 };
const actual = { jsRaw, jsGzip, cssRaw, cssGzip };
for (const [name, budget] of Object.entries(budgets)) {
  if (actual[name] > budget) throw new Error(`${name} budget exceeded: ${actual[name]} > ${budget}`);
}

console.log(JSON.stringify({ cloudflareWebBudget: "PASS", actual, budgets, staticAssets: true }));
