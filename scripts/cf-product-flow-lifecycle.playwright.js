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

  const queue = page.locator('[aria-label="Reception case queue"] .case-queue');
  const queueCase = (...texts) => {
    let locator = queue.locator("button");
    for (const text of texts) locator = locator.filter({ hasText: text });
    return locator;
  };

  async function searchAvailability(checkIn, checkOut) {
    const create = page.locator('form[aria-label="Create booking"]');
    await create.getByLabel("Check-in").fill(checkIn);
    await create.getByLabel("Check-out").fill(checkOut);
    const responsePromise = page.waitForResponse(response =>
      response.url().includes("/api/v1/rooms/available") && response.request().method() === "GET",
    );
    await create.getByRole("button", { name: "Find available rooms" }).click();
    const response = await responsePromise;
    if (response.status() !== 200) throw new Error(`lifecycle availability expected 200, got ${response.status()}`);
    const body = await response.json();
    await page.waitForFunction(
      expectedCount => document.querySelector('form[aria-label="Create booking"] select[aria-label="Room"]')?.querySelectorAll("option").length === expectedCount + 1,
      body.length,
    );
    return body;
  }

  async function createBooking(checkIn, checkOut, roomId, notes) {
    const create = page.locator('form[aria-label="Create booking"]');
    await create.getByLabel("Guest").selectOption("integral-browser-guest");
    await searchAvailability(checkIn, checkOut);
    await create.getByLabel("Room").selectOption(roomId);
    await create.locator('input[placeholder="Notes (optional)"]').fill(notes);
    const responsePromise = page.waitForResponse(response =>
      response.url().endsWith("/api/v1/bookings") && response.request().method() === "POST",
    );
    await create.getByRole("button", { name: "Create booking", exact: true }).click();
    const response = await responsePromise;
    if (response.status() !== 201) throw new Error(`UI create booking expected 201, got ${response.status()}`);
    const row = queueCase("Integral Browser Guest", checkIn);
    await row.waitFor();
    return row;
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("http://127.0.0.1:4174/bookings", { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "Booking case workspace", exact: true }).waitFor();

  // create -> edit -> cancel; cancellation must release inventory again.
  let row = await createBooking("2027-07-10", "2027-07-12", "integral-ready-a", "browser-edit-cancel");
  await row.click();
  const selectedCase = page.locator("article.case-panel");
  await selectedCase.getByText("Confirmed", { exact: true }).waitFor();

  const edit = page.locator('form[aria-label="Edit booking"]');
  await edit.getByLabel("Edit check-in").fill("2027-07-15");
  await edit.getByLabel("Edit check-out").fill("2027-07-17");
  await edit.locator('select[aria-label="Edit room"] option[value="integral-ready-b"]').waitFor({ state: "attached" });
  await edit.getByLabel("Edit room").selectOption("integral-ready-b");
  await edit.getByLabel("Edit notes").fill("browser-edited");
  const editResponse = page.waitForResponse(response =>
    response.url().includes("/api/v1/bookings/") && response.request().method() === "PATCH",
  );
  await edit.getByRole("button", { name: "Save changes" }).click();
  if ((await editResponse).status() !== 200) throw new Error("UI edit booking did not return 200");
  row = queueCase("Integral Browser Guest", "2027-07-15", "Room 955");
  await row.waitFor();
  await row.click();
  await selectedCase.getByText("2027-07-15 → 2027-07-17 · Room 955", { exact: true }).waitFor();

  const cancelResponse = page.waitForResponse(response =>
    response.url().includes("/api/v1/bookings/") && response.request().method() === "PATCH",
  );
  await page.locator('form[aria-label="Edit booking"]').getByRole("button", { name: "Cancel booking" }).click();
  if ((await cancelResponse).status() !== 200) throw new Error("UI cancel booking did not return 200");
  row = queueCase("Integral Browser Guest", "2027-07-15", "Cancelled", "Room 955");
  await row.waitFor();
  const released = await searchAvailability("2027-07-15", "2027-07-17");
  if (!released.some(room => room.id === "integral-ready-b")) throw new Error("UI cancellation did not release room 955 inventory");

  // create -> mobile check-in -> reassign -> checkout.
  row = await createBooking("2027-08-10", "2027-08-12", "integral-ready-a", "browser-lifecycle");
  await row.click();
  const checkIn = page.locator('form[aria-label="Check in booking"]');
  await checkIn.getByLabel("Final guest count").fill("1");
  await checkIn.getByLabel("Document verified").check();
  await checkIn.getByRole("button", { name: "Next step" }).click();
  await checkIn.getByLabel("Contact confirmed").check();
  await checkIn.getByLabel("Stay confirmed").check();
  await checkIn.getByRole("button", { name: "Next step" }).click();
  await checkIn.getByRole("button", { name: "Next step" }).click();
  const checkInResponse = page.waitForResponse(response =>
    response.url().includes("/check-in") && response.request().method() === "POST",
  );
  await checkIn.getByRole("button", { name: "Complete check-in" }).click();
  if ((await checkInResponse).status() !== 200) throw new Error("UI check-in did not return 200");
  row = queueCase("Integral Browser Guest", "2027-08-10", "CheckedIn", "Room 953");
  await row.waitFor();
  await row.click();
  await selectedCase.getByText("CheckedIn", { exact: true }).waitFor();

  const reassign = page.locator('form[aria-label="Reassign room"]');
  await reassign.locator('select[name="room_id"]').selectOption("integral-ready-b");
  const reassignResponse = page.waitForResponse(response =>
    response.url().includes("/reassign") && response.request().method() === "POST",
  );
  await reassign.getByRole("button", { name: "Reassign room" }).click();
  if ((await reassignResponse).status() !== 200) throw new Error("UI reassign did not return 200");
  row = queueCase("Integral Browser Guest", "2027-08-10", "CheckedIn", "Room 955");
  await row.waitFor();
  await row.click();

  const checkout = page.locator('form[aria-label="Checkout"]');
  await checkout.getByLabel("Charges reviewed").check();
  await checkout.getByLabel("Room release confirmed").check();
  await checkout.getByLabel("Housekeeping handoff confirmed").check();
  const checkoutResponse = page.waitForResponse(response =>
    response.url().includes("/check-out") && response.request().method() === "POST",
  );
  await checkout.getByRole("button", { name: "Complete checkout" }).click();
  if ((await checkoutResponse).status() !== 200) throw new Error("UI checkout did not return 200");
  row = queueCase("Integral Browser Guest", "2027-08-10", "CheckedOut", "Room 955");
  await row.waitFor();

  // Mobile app navigation must preserve the document and continue the operational handoff.
  await page.evaluate(() => { window.__integralProductFlowMarker = "alive"; });
  await page.getByRole("button", { name: "Abrir navegación" }).click();
  const mobileNav = page.getByRole("dialog", { name: "Navegación móvil" });
  await mobileNav.getByRole("link", { name: /Housekeeping/ }).click();
  await page.getByRole("heading", { name: "Housekeeping", exact: true }).waitFor();
  if ((await page.evaluate(() => window.__integralProductFlowMarker)) !== "alive") {
    throw new Error("mobile navigation reloaded the document during lifecycle handoff");
  }

  await page.getByLabel("Search housekeeping").fill("955");
  const task = page.locator('[aria-label="Housekeeping task queue"] button').filter({ hasText: "Room 955" });
  await task.waitFor();
  await task.click();
  const focused = page.getByRole("dialog", { name: "Focused task room 955" });
  await focused.waitFor();
  await focused.getByText("Dirty", { exact: true }).waitFor();
  const startResponse = page.waitForResponse(response =>
    response.url().includes("/housekeeping/integral-ready-b/start") && response.request().method() === "POST",
  );
  await focused.getByRole("button", { name: "Start cleaning" }).click();
  if ((await startResponse).status() !== 200) throw new Error("UI housekeeping start did not return 200");
  await focused.getByText("Cleaning", { exact: true }).waitFor();
  const finishResponse = page.waitForResponse(response =>
    response.url().includes("/housekeeping/integral-ready-b/finish") && response.request().method() === "POST",
  );
  await focused.getByRole("button", { name: "Finish cleaning" }).click();
  if ((await finishResponse).status() !== 200) throw new Error("UI housekeeping finish did not return 200");
  await focused.getByText("Available", { exact: true }).waitFor();

  for (const width of [375, 390, 430, 1366]) {
    await page.setViewportSize({ width, height: 844 });
    await page.waitForTimeout(100);
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    if (scrollWidth > width) throw new Error(`Lifecycle flow overflows at ${width}: ${scrollWidth}`);
  }

  await page.screenshot({ path: "output/playwright/cf-product-flow-lifecycle.png", fullPage: true });
  return {
    lifecycle: ["create", "edit", "cancel", "create", "check-in", "reassign", "checkout", "housekeeping"],
    mobile: true,
    navigationContinuity: "PASS",
    widths: [375, 390, 430, 1366],
  };
})()