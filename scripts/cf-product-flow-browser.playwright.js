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

  page.on("dialog", dialog => void dialog.accept());

  const roomSelect = page.getByLabel("Room");
  const optionTexts = async () => roomSelect.locator("option").allTextContents();
  const assertIncludes = (items, text, message) => {
    if (!items.some(item => item.includes(text))) throw new Error(`${message}; options=${JSON.stringify(items)}`);
  };
  const assertExcludes = (items, text, message) => {
    if (items.some(item => item.includes(text))) throw new Error(`${message}; options=${JSON.stringify(items)}`);
  };
  const queue = page.locator('[aria-label="Reception case queue"] .case-queue');
  const queueCase = text => queue.locator("button").filter({ hasText: text });
  const selectedCase = () => page.locator("article.case-panel");

  async function searchAvailability(checkIn, checkOut, { expectSuccess = true } = {}) {
    await page.getByLabel("Check-in").fill(checkIn);
    await page.getByLabel("Check-out").fill(checkOut);
    const responsePromise = page.waitForResponse(response =>
      response.url().includes("/api/v1/rooms/available") && response.request().method() === "GET",
    );
    await page.getByRole("button", { name: "Find available rooms" }).click();
    const response = await responsePromise;
    const body = await response.json().catch(() => null);
    if (expectSuccess) {
      if (response.status() !== 200 || !Array.isArray(body)) {
        throw new Error(`availability API expected 200 array, got ${response.status()}: ${JSON.stringify(body)}`);
      }
      await page.waitForFunction(
        expectedCount => document.querySelector('select[aria-label="Room"]')?.querySelectorAll("option").length === expectedCount + 1,
        body.length,
      );
      return { response: body, options: await optionTexts() };
    }
    if (response.status() < 400) {
      throw new Error(`availability API expected validation error, got ${response.status()}: ${JSON.stringify(body)}`);
    }
    await page.getByRole("alert").waitFor();
    return { response: body, options: await optionTexts() };
  }

  async function createBooking({ checkIn, checkOut, roomId, notes }) {
    const form = page.locator('form[aria-label="Create booking"]');
    await form.getByLabel("Guest").selectOption("integral-browser-guest");
    await searchAvailability(checkIn, checkOut);
    await form.getByLabel("Room").selectOption(roomId);
    await form.locator('input[placeholder="Notes (optional)"]').fill(notes);
    const created = page.waitForResponse(response => response.url().endsWith("/api/v1/bookings") && response.request().method() === "POST");
    await form.getByRole("button", { name: "Create booking", exact: true }).click();
    const response = await created;
    if (response.status() !== 201) throw new Error(`UI booking creation expected 201, got ${response.status()}`);
    const row = queueCase(checkIn).filter({ hasText: "Integral Browser Guest" });
    await row.waitFor();
    return row;
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("http://127.0.0.1:4174/bookings", { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "Recepción", exact: true }).waitFor();
  await page.getByRole("heading", { name: "Booking case workspace", exact: true }).waitFor();

  // Human-acceptance defect: PRE-EXISTING rooms are sold by date inventory, not only by current readiness.
  let result = await searchAvailability("2027-06-10", "2027-06-12");
  let options = result.options;
  assertIncludes(options, "951", "pre-existing DIRTY room 951 was not offered for free future dates");
  assertIncludes(options, "952", "pre-existing CLEANING room 952 was not offered for free future dates");
  assertIncludes(options, "956", "pre-existing OCCUPIED room 956 was not offered for a free future stay");
  assertExcludes(options, "954", "MAINTENANCE room 954 must not be offered");

  // Active inventory overlap and half-open boundary through the actual UI.
  result = await searchAvailability("2026-09-02", "2026-09-04");
  options = result.options;
  assertExcludes(options, "959", "room 959 must be hidden while its booking overlaps");

  result = await searchAvailability("2026-09-04", "2026-09-05");
  options = result.options;
  assertIncludes(options, "959", "room 959 must be offered when prior checkout equals next check-in");

  // Invalid range must be visible instead of silently looking like zero availability.
  await searchAvailability("2027-06-12", "2027-06-10", { expectSuccess: false });

  // Contracted UI flow 1: create -> edit to a different room/date -> cancel -> inventory release.
  let row = await createBooking({
    checkIn: "2027-07-10",
    checkOut: "2027-07-12",
    roomId: "integral-ready-a",
    notes: "browser-edit-cancel",
  });
  await row.click();
  await selectedCase().getByText("Confirmed", { exact: true }).waitFor();

  const edit = page.locator('form[aria-label="Edit booking"]');
  await edit.getByLabel("Edit check-in").fill("2027-07-15");
  await edit.getByLabel("Edit check-out").fill("2027-07-17");
  await edit.locator('select[aria-label="Edit room"] option[value="integral-ready-b"]').waitFor();
  await edit.getByLabel("Edit room").selectOption("integral-ready-b");
  await edit.getByLabel("Edit notes").fill("browser-edited");
  const edited = page.waitForResponse(response => response.url().includes("/api/v1/bookings/") && response.request().method() === "PATCH");
  await edit.getByRole("button", { name: "Save changes" }).click();
  if ((await edited).status() !== 200) throw new Error("UI booking edit did not return 200");
  row = queueCase("2027-07-15").filter({ hasText: "Integral Browser Guest" }).filter({ hasText: "Room 955" });
  await row.waitFor();
  await row.click();
  await selectedCase().getByText("2027-07-15 → 2027-07-17 · Room 955", { exact: true }).waitFor();

  const cancelled = page.waitForResponse(response => response.url().includes("/api/v1/bookings/") && response.request().method() === "PATCH");
  await edit.getByRole("button", { name: "Cancel booking" }).click();
  if ((await cancelled).status() !== 200) throw new Error("UI booking cancellation did not return 200");
  row = queueCase("2027-07-15").filter({ hasText: "Integral Browser Guest" }).filter({ hasText: "Cancelled" });
  await row.waitFor();
  result = await searchAvailability("2027-07-15", "2027-07-17");
  assertIncludes(result.options, "955", "cancelled UI booking did not release room 955 inventory");

  // Contracted UI flow 2: create -> mobile check-in -> reassign -> checkout.
  row = await createBooking({
    checkIn: "2027-08-10",
    checkOut: "2027-08-12",
    roomId: "integral-ready-a",
    notes: "browser-lifecycle",
  });
  await row.click();

  const checkIn = page.locator('form[aria-label="Check in booking"]');
  await checkIn.getByLabel("Final guest count").fill("1");
  await checkIn.getByLabel("Document verified").check();
  await checkIn.getByRole("button", { name: "Next step" }).click();
  await checkIn.getByLabel("Contact confirmed").check();
  await checkIn.getByLabel("Stay confirmed").check();
  await checkIn.getByRole("button", { name: "Next step" }).click();
  await checkIn.getByRole("button", { name: "Next step" }).click();
  const checkedIn = page.waitForResponse(response => response.url().includes("/check-in") && response.request().method() === "POST");
  await checkIn.getByRole("button", { name: "Complete check-in" }).click();
  if ((await checkedIn).status() !== 200) throw new Error("UI check-in did not return 200");
  row = queueCase("2027-08-10").filter({ hasText: "Integral Browser Guest" }).filter({ hasText: "CheckedIn" });
  await row.waitFor();
  await row.click();
  await selectedCase().getByText("CheckedIn", { exact: true }).waitFor();

  const reassign = page.locator('form[aria-label="Reassign room"]');
  await reassign.locator('select[name="room_id"]').selectOption("integral-ready-b");
  const reassigned = page.waitForResponse(response => response.url().includes("/reassign") && response.request().method() === "POST");
  await reassign.getByRole("button", { name: "Reassign room" }).click();
  if ((await reassigned).status() !== 200) throw new Error("UI reassignment did not return 200");
  row = queueCase("2027-08-10").filter({ hasText: "Integral Browser Guest" }).filter({ hasText: "Room 955" }).filter({ hasText: "CheckedIn" });
  await row.waitFor();
  await row.click();

  const checkout = page.locator('form[aria-label="Checkout"]');
  await checkout.getByLabel("Charges reviewed").check();
  await checkout.getByLabel("Room release confirmed").check();
  await checkout.getByLabel("Housekeeping handoff confirmed").check();
  const checkedOut = page.waitForResponse(response => response.url().includes("/check-out") && response.request().method() === "POST");
  await checkout.getByRole("button", { name: "Complete checkout" }).click();
  if ((await checkedOut).status() !== 200) throw new Error("UI checkout did not return 200");
  row = queueCase("2027-08-10").filter({ hasText: "Integral Browser Guest" }).filter({ hasText: "CheckedOut" }).filter({ hasText: "Room 955" });
  await row.waitFor();

  // Continue through the actual mobile navigation into housekeeping without document reload.
  await page.evaluate(() => { window.__integralProductFlowMarker = "alive"; });
  await page.getByRole("button", { name: "Abrir navegación" }).click();
  await page.getByRole("dialog", { name: "Navegación móvil" }).getByRole("link", { name: /Housekeeping/ }).click();
  await page.getByRole("heading", { name: "Housekeeping", exact: true }).waitFor();
  const marker = await page.evaluate(() => window.__integralProductFlowMarker);
  if (marker !== "alive") throw new Error("mobile feature navigation reloaded the document during product flow");

  await page.getByLabel("Search housekeeping").fill("955");
  const taskButton = page.locator('[aria-label="Housekeeping task queue"] button').filter({ hasText: "Room 955" });
  await taskButton.waitFor();
  await taskButton.click();
  const focusedTask = page.getByRole("dialog", { name: "Focused task room 955" });
  await focusedTask.waitFor();
  await focusedTask.getByText("Dirty", { exact: true }).waitFor();
  const cleaningStarted = page.waitForResponse(response => response.url().includes("/housekeeping/integral-ready-b/start") && response.request().method() === "POST");
  await focusedTask.getByRole("button", { name: "Start cleaning" }).click();
  if ((await cleaningStarted).status() !== 200) throw new Error("UI housekeeping start did not return 200");
  await focusedTask.getByText("Cleaning", { exact: true }).waitFor();
  const cleaningFinished = page.waitForResponse(response => response.url().includes("/housekeeping/integral-ready-b/finish") && response.request().method() === "POST");
  await focusedTask.getByRole("button", { name: "Finish cleaning" }).click();
  if ((await cleaningFinished).status() !== 200) throw new Error("UI housekeeping finish did not return 200");
  await focusedTask.getByText("Available", { exact: true }).waitFor();

  for (const width of [375, 390, 430, 1366]) {
    await page.setViewportSize({ width, height: 844 });
    await page.waitForTimeout(100);
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    if (scrollWidth > width) throw new Error(`Integral product flow overflows at ${width}: ${scrollWidth}`);
  }

  await page.screenshot({ path: "output/playwright/cf-product-flow-lifecycle.png", fullPage: true });
  return {
    realApi: true,
    preExistingRooms: ["951:DIRTY", "952:CLEANING", "956:OCCUPIED"],
    maintenanceExcluded: "954",
    overlapAndBoundary: "959",
    browserLifecycle: ["create", "edit", "cancel", "create", "check-in", "reassign", "checkout", "housekeeping"],
    navigationContinuity: "PASS",
    widths: [375, 390, 430, 1366],
  };
})()