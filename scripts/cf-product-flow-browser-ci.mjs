import { readFileSync } from "node:fs";
import { chromium } from "playwright";
import { runProductFlowApiAudit } from "./cf-product-flow-api.mjs";
import { runCancellationCheckInRace } from "./cf-product-flow-cancel-race.mjs";
import { runReassignmentRace } from "./cf-product-flow-reassign-race.mjs";

const availabilityBrowser = eval(readFileSync("scripts/cf-product-flow-browser.playwright.js", "utf8"));
const lifecycleBrowser = eval(readFileSync("scripts/cf-product-flow-lifecycle.playwright.js", "utf8"));
const i18nSmoke = eval(readFileSync("scripts/cf-i18n-smoke.playwright.js", "utf8"));

const phase = process.env.PRODUCT_FLOW_PHASE ?? "all";

if (phase === "api" || phase === "all") {
  // Establish backend/D1 truth first. If this fails, the browser is not allowed to mask it
  // as a rendering problem.
  const apiEvidence = await runProductFlowApiAudit();
  const cancellationRaceEvidence = await runCancellationCheckInRace();
  const reassignmentRaceEvidence = await runReassignmentRace();
  console.log(JSON.stringify({
    productFlowBackend: "PASS",
    evidence: {
      api: apiEvidence,
      concurrency: {
        cancellationCheckIn: cancellationRaceEvidence,
        reassignment: reassignmentRaceEvidence,
      },
    },
  }, null, 2));
}

if (phase === "api") process.exit(0);

const browser = await chromium.launch({ headless: true });
try {
  const browserEvidence = {};
  if (phase === "availability" || phase === "browser" || phase === "all") {
    const availabilityPage = await browser.newPage({ viewport: { width: 390, height: 844 } });
    browserEvidence.availability = await availabilityBrowser(availabilityPage);
    await availabilityPage.close();
  }
  if (phase === "lifecycle" || phase === "browser" || phase === "all") {
    const lifecyclePage = await browser.newPage({ viewport: { width: 390, height: 844 } });
    browserEvidence.lifecycle = await lifecycleBrowser(lifecyclePage);
    await lifecyclePage.close();
  }
  if (phase === "i18n" || phase === "all") {
    const i18nPage = await browser.newPage({ viewport: { width: 375, height: 844 } });
    browserEvidence.i18n = await i18nSmoke(i18nPage);
    await i18nPage.close();
  }

  console.log(JSON.stringify({
    integralProductFlow: "PASS",
    evidence: {
      browser: browserEvidence,
    },
  }, null, 2));
} finally {
  await browser.close();
}
