(page) => (async () => {
  // The preceding Reception synthetic runner installs catch-all API routes on
  // this reused browser page. Cross-module navigation must exercise Worker/D1.
  await page.unrouteAll({ behavior: "wait" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("http://127.0.0.1:4176/bookings?lane=arrivals&q=Arrival");
  await page.locator(".language-selector select").selectOption("en");
  await page.waitForFunction(() => document.documentElement.lang === "en");
  // The integrated Reception flow leaves the browser on the receptionist
  // local profile. Cross-module navigation must use a server-authorized
  // synthetic identity with Rooms and Housekeeping capabilities.
  await page.getByLabel("Profile", { exact: true }).selectOption("0");
  await page.waitForFunction(() => {
    const capabilities = document.querySelector(".app-content")?.getAttribute("data-hotel-capabilities") ?? "";
    return capabilities.includes("rooms.read") && capabilities.includes("housekeeping.read");
  });
  await page.locator(".language-selector select").selectOption("en");
  await page.waitForFunction(() => document.documentElement.lang === "en");
  await page.getByRole("heading", { name: "Reception", level: 1, exact: true }).waitFor();
  await page.getByRole("heading", { name: "Booking case workspace", level: 2, exact: true }).waitFor();
  const receptionEntry = new URL(page.url());
  if (receptionEntry.searchParams.get("lane") !== "arrivals" || receptionEntry.searchParams.get("q") !== "Arrival") throw new Error(`Reception deep link lost lane/search: ${page.url()}`);

  const marker = `nav-${Date.now()}-${Math.random()}`;
  await page.evaluate(value => { window.__hmsNavigationMarker = value; }, marker);

  await page.locator('.mobile-primary-nav a[href="/housekeeping"]').click();
  await page.waitForURL("**/housekeeping");
  await page.getByRole("heading", { name: "Housekeeping", level: 1, exact: true }).waitFor({ timeout: 10000 }).catch(async () => {
    throw new Error(`Housekeeping route did not render its shell heading: url=${page.url()} body=${(await page.locator("body").innerText()).slice(0, 1200)}`);
  });
  await page.getByRole("heading", { name: "Housekeeping board", level: 2, exact: true }).waitFor();
  const markerAfterHousekeeping = await page.evaluate(() => window.__hmsNavigationMarker);
  if (markerAfterHousekeeping !== marker) throw new Error("Internal navigation reloaded the document on mobile");

  await page.locator('.mobile-primary-nav a[href="/rooms"]').click();
  await page.waitForURL("**/rooms");
  await page.getByRole("heading", { name: "Rooms", level: 1, exact: true }).waitFor();
  const markerAfterRooms = await page.evaluate(() => window.__hmsNavigationMarker);
  if (markerAfterRooms !== marker) throw new Error("Second internal navigation reloaded the document on mobile");

  await page.goBack();
  await page.getByRole("heading", { name: "Housekeeping", level: 1, exact: true }).waitFor();
  const markerAfterBack = await page.evaluate(() => window.__hmsNavigationMarker);
  if (markerAfterBack !== marker) throw new Error("Browser back caused a document reload");
  await page.goForward();
  await page.getByRole("heading", { name: "Rooms", level: 1, exact: true }).waitFor();
  const forwardUrl = await page.evaluate(() => `${location.pathname}${location.search}${location.hash}`);
  if (forwardUrl !== "/rooms") throw new Error(`Browser forward restored the wrong route: ${forwardUrl}`);
  await page.goBack();
  await page.getByRole("heading", { name: "Housekeeping", level: 1, exact: true }).waitFor();

  await page.setViewportSize({ width: 1366, height: 812 });
  await page.getByRole("link", { name: /Reports/ }).click();
  await page.waitForURL("**/reports");
  await page.getByRole("heading", { name: "Reports", level: 1, exact: true }).waitFor();
  const markerAfterDesktop = await page.evaluate(() => window.__hmsNavigationMarker);
  if (markerAfterDesktop !== marker) throw new Error("Desktop internal navigation reloaded the document");

  return { navigationContinuity: "PASS", locale: "en", mobile: true, desktop: true, backForward: true, queryPreserved: "reception lane/search on route entry", history: true };
})()
