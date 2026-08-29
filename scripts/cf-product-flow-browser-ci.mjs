import { readFileSync } from "node:fs";
import { chromium } from "playwright";
import { runProductFlowApiAudit } from "./cf-product-flow-api.mjs";

const productFlowBrowser = eval(readFileSync("scripts/cf-product-flow-browser.playwright.js", "utf8"));
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const browserEvidence = await productFlowBrowser(page);
  const apiEvidence = await runProductFlowApiAudit();
  console.log(JSON.stringify({
    integralProductFlow: "PASS",
    evidence: { browser: browserEvidence, api: apiEvidence },
  }, null, 2));
} finally {
  await browser.close();
}
