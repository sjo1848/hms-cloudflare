import { readFileSync } from "node:fs";
import { chromium } from "playwright";

const scenario = eval(readFileSync("scripts/cf-i05-browser-regression.playwright.js", "utf8"));
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1366, height: 812 } });
  const results = await scenario(page);
  console.log(JSON.stringify({ browserRegression: "PASS", results }));
} finally {
  await browser.close();
}
