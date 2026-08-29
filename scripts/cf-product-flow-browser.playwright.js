(page) => (async () => {
  const adminHeaders = {
    "x-local-access-subject": "source-user:subject-admin",
    "x-local-access-email": "admin@example.test",
    "x-hotel-id": "hotel-a",
  };

  await page.route("**/api/v1/**", async route => {
    const request = route.request();
    await route.continue({ headers: { ...request.headers(), ...adminHeaders } });
  });

  const optionTexts = async () => page.getByLabel("Room").locator("option").allTextContents();
  const assertIncludes = (items, text, message) => {
    if (!items.some(item => item.includes(text))) throw new Error(`${message}; options=${JSON.stringify(items)}`);
  };
  const assertExcludes = (items, text, message) => {
    if (items.some(item => item.includes(text))) throw new Error(`${message}; options=${JSON.stringify(items)}`);
  };

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("http://127.0.0.1:4174/bookings", { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "Recepción", exact: true }).waitFor();
  await page.getByRole("heading", { name: "Booking case workspace", exact: true }).waitFor();

  // Human-acceptance defect: PRE-EXISTING rooms are sold by date inventory, not only by current readiness.
  await page.getByLabel("Check-in").fill("2027-06-10");
  await page.getByLabel("Check-out").fill("2027-06-12");
  await page.getByRole("button", { name: "Find available rooms" }).click();
  let options = await optionTexts();
  assertIncludes(options, "951", "pre-existing DIRTY room 951 was not offered for free future dates");
  assertIncludes(options, "952", "pre-existing CLEANING room 952 was not offered for free future dates");
  assertIncludes(options, "956", "pre-existing OCCUPIED room 956 was not offered for a free future stay");
  assertExcludes(options, "954", "MAINTENANCE room 954 must not be offered");

  // Active inventory overlap and half-open boundary through the actual UI.
  await page.getByLabel("Check-in").fill("2026-09-02");
  await page.getByLabel("Check-out").fill("2026-09-04");
  await page.getByRole("button", { name: "Find available rooms" }).click();
  options = await optionTexts();
  assertExcludes(options, "959", "room 959 must be hidden while its booking overlaps");

  await page.getByLabel("Check-in").fill("2026-09-04");
  await page.getByLabel("Check-out").fill("2026-09-05");
  await page.getByRole("button", { name: "Find available rooms" }).click();
  options = await optionTexts();
  assertIncludes(options, "959", "room 959 must be offered when prior checkout equals next check-in");

  // Invalid range must be visible instead of silently looking like zero availability.
  await page.getByLabel("Check-in").fill("2027-06-12");
  await page.getByLabel("Check-out").fill("2027-06-10");
  await page.getByRole("button", { name: "Find available rooms" }).click();
  await page.getByRole("alert").waitFor();

  for (const width of [375, 390, 430, 1366]) {
    await page.setViewportSize({ width, height: 844 });
    await page.waitForTimeout(100);
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    if (scrollWidth > width) throw new Error(`Reception availability flow overflows at ${width}: ${scrollWidth}`);
  }

  await page.screenshot({ path: "output/playwright/cf-product-flow-availability.png", fullPage: true });
  return {
    realApi: true,
    preExistingRooms: ["951:DIRTY", "952:CLEANING", "956:OCCUPIED"],
    maintenanceExcluded: "954",
    overlapAndBoundary: "959",
    widths: [375, 390, 430, 1366],
  };
})()