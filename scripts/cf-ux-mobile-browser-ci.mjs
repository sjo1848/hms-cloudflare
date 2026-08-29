import { readFileSync } from "node:fs";
import { chromium } from "playwright";
import { runProductFlowApiAudit } from "./cf-product-flow-api.mjs";

const housekeeping=eval(readFileSync("scripts/cf-i05-browser-regression.playwright.js","utf8"));
const roomsGuests=eval(readFileSync("scripts/cf-ux-rooms-guests-browser.playwright.js","utf8"));
const admin=eval(readFileSync("scripts/cf-ux-admin-browser.playwright.js","utf8"));
const architecture=eval(readFileSync("scripts/cf-web-arch-browser.playwright.js","utf8"));
const productFlow=eval(readFileSync("scripts/cf-product-flow-browser.playwright.js","utf8"));
const browser=await chromium.launch({headless:true});
try {
  const p1=await browser.newPage({viewport:{width:1366,height:812}});
  const housekeepingResults=await housekeeping(p1);
  const p2=await browser.newPage({viewport:{width:1366,height:812}});
  const roomsGuestsResults=await roomsGuests(p2);
  const p3=await browser.newPage({viewport:{width:1366,height:812}});
  const adminResults=await admin(p3);
  const p4=await browser.newPage({viewport:{width:390,height:844}});
  const architectureResults=await architecture(p4);
  const p5=await browser.newPage({viewport:{width:390,height:844}});
  const productFlowResults=await productFlow(p5);
  const productFlowApiResults=await runProductFlowApiAudit();
  console.log(JSON.stringify({browserRegression:"PASS",evidence:{housekeeping:housekeepingResults,roomsGuests:roomsGuestsResults,admin:adminResults,architecture:architectureResults,productFlow:productFlowResults,productFlowApi:productFlowApiResults}}));
} finally { await browser.close(); }
