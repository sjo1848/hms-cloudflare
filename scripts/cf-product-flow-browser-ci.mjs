import { readFileSync } from "node:fs";
import { chromium } from "playwright";
import { runProductFlowApiAudit } from "./cf-product-flow-api.mjs";

const productFlowBrowser = eval(readFileSync("scripts/cf-product-flow-browser.playwright.js", "utf8"));

// Establish backend/D1 truth first. If this fails, the browser is not allowed to mask it
// as a rendering problem.
const apiEvidence = await runProductFlowApiAudit();

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const browserEvidence = await productFlowBrowser(page);
  console.log(JSON.stringify({
    integralProductFlow: "PASS",
    evidence: { api: apiEvidence, browser: browserEvidence },
  }, null, 2));
} finally {
  await browser.close();
}
