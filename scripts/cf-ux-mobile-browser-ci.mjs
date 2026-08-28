import { readFileSync } from "node:fs";
import { chromium } from "playwright";
const housekeeping=eval(readFileSync("scripts/cf-i05-browser-regression.playwright.js","utf8"));
const roomsGuests=eval(readFileSync("scripts/cf-ux-rooms-guests-browser.playwright.js","utf8"));
const admin=eval(readFileSync("scripts/cf-ux-admin-browser.playwright.js","utf8"));
const browser=await chromium.launch({headless:true});
try {
  const p1=await browser.newPage({viewport:{width:1366,height:812}});
  const housekeepingResults=await housekeeping(p1);
  const p2=await browser.newPage({viewport:{width:1366,height:812}});
  const roomsGuestsResults=await roomsGuests(p2);
  const p3=await browser.newPage({viewport:{width:1366,height:812}});
  const adminResults=await admin(p3);
  console.log(JSON.stringify({browserRegression:"PASS",evidence:{housekeeping:housekeepingResults,roomsGuests:roomsGuestsResults,admin:adminResults}}));
} finally { await browser.close(); }
