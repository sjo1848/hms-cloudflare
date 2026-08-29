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

  // The original human-acceptance defect: pre-existing rooms must be offered by future date inventory,
  // even when their CURRENT housekeeping/occupancy state is not AVAILABLE.
  await page.getByLabel("Check-in").fill("2027-06-10");
  await page.getByLabel("Check-out").fill("2027-06-12");
  await page.getByRole("button", { name: "Find available rooms" }).click();
  let options = await optionTexts();
  assertIncludes(options, "901", "pre-existing DIRTY room 901 was not offered for free future dates");
  assertIncludes(options, "902", "pre-existing CLEANING room 902 was not offered for free future dates");
  assertIncludes(options, "906", "pre-existing OCCUPIED room 906 was not offered after its non-overlapping stay");
  assertExcludes(options, "904", "MAINTENANCE room 904 must not be offered");

  // Active inventory overlap and half-open boundary through the actual UI.
  await page.getByLabel("Check-in").fill("2026-09-02");
  await page.getByLabel("Check-out").fill("2026-09-04");
  await page.getByRole("button", { name: "Find available rooms" }).click();
  options = await optionTexts();
  assertExcludes(options, "909", "room 909 must be hidden while its booking overlaps");

  await page.getByLabel("Check-in").fill("2026-09-04");
  await page.getByLabel("Check-out").fill("2026-09-05");
  await page.getByRole("button", { name: "Find available rooms" }).click();
  options = await optionTexts();
  assertIncludes(options, "909", "room 909 must be offered when prior checkout equals next check-in");

  // Invalid range must be visible to the operator instead of silently yielding an empty room selector.
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
    preExistingRooms: ["901:DIRTY", "902:CLEANING", "906:OCCUPIED"],
    maintenanceExcluded: "904",
    overlapAndBoundary: "909",
    widths: [375, 390, 430, 1366],
  };
})()