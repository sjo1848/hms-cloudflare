import { readFileSync } from "node:fs";
import { chromium } from "playwright";
import { runProductFlowApiAudit } from "./cf-product-flow-api.mjs";
import { runCancellationCheckInRace } from "./cf-product-flow-cancel-race.mjs";

const availabilityBrowser = eval(readFileSync("scripts/cf-product-flow-browser.playwright.js", "utf8"));
const lifecycleBrowser = eval(readFileSync("scripts/cf-product-flow-lifecycle.playwright.js", "utf8"));

// Establish backend/D1 truth first. If this fails, the browser is not allowed to mask it
// as a rendering problem.
const apiEvidence = await runProductFlowApiAudit();
const raceEvidence = await runCancellationCheckInRace();

const browser = await chromium.launch({ headless: true });
try {
  const availabilityPage = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const availabilityEvidence = await availabilityBrowser(availabilityPage);
  await availabilityPage.close();

  const lifecyclePage = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const lifecycleEvidence = await lifecycleBrowser(lifecyclePage);
  await lifecyclePage.close();

  console.log(JSON.stringify({
    integralProductFlow: "PASS",
    evidence: {
      api: apiEvidence,
      concurrency: raceEvidence,
      browser: {
        availability: availabilityEvidence,
        lifecycle: lifecycleEvidence,
      },
    },
  }, null, 2));
} finally {
  await browser.close();
}
