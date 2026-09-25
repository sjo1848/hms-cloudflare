(page) => (async () => {
  await page.addInitScript(() => { localStorage.setItem("hms.locale", "en"); localStorage.setItem("hms-local-acceptance-profile", "0"); });
  await page.setExtraHTTPHeaders({
    "x-local-access-subject": "source-user:14000000-0000-0000-0000-000000000002",
    "x-local-access-email": "leo-reception@migration.invalid",
    "x-hotel-id": "10000000-0000-0000-0000-000000000001",
  });
  await page.setViewportSize({ width: 375, height: 812 });
  const responses = [];
  const payloads = [];
  page.on("response", async response => {
    if (response.url().includes("/api/v1/bookings/") || response.url().includes("/api/v1/bookings?") || response.url().includes("/api/v1/housekeeping/") || response.url().includes("/api/v1/rooms/available")) {
      responses.push({ url: response.url(), status: response.status() });
      if (response.url().includes("rooms/available") || response.url().includes("housekeeping") || response.url().endsWith("/reassign") || response.url().includes("/api/v1/bookings?limit=100")) payloads.push({ url: response.url(), status: response.status(), body: await response.text().catch(() => "") });
    }
  });

  await page.goto("http://127.0.0.1:4174/bookings");
  await page.getByRole("heading", { name: "Booking case workspace" }).waitFor();
  await page.getByRole("button", { name: "All" }).click();
  await page.getByText("Integrated Reassignment Guest", { exact: true }).first().waitFor({ timeout: 60000 });

  async function openGuest(name) {
    await page.getByText(name, { exact: true }).first().click();
    await page.getByText("Selected case").waitFor();
    await page.locator('form[aria-label="Reassign room"]').waitFor();
  }

  await openGuest("Integrated Reassignment Guest");
  await page.waitForTimeout(5000);
  const form = page.locator('form[aria-label="Reassign room"]');
  const options = form.getByRole("option");
  const blocking = options.filter({ hasText: "blocked by maintenance" });
  const optionState = await options.evaluateAll(items => items.map(item => ({ text: item.textContent, disabled: item.disabled })));
  const blockingState = optionState.find(item => item.text.includes("blocked by maintenance"));
  if (!blockingState || !blockingState.disabled) throw new Error(`BLOCKING destination was selectable: ${JSON.stringify(optionState)}`);
  await form.getByRole("combobox").selectOption("e2e-room-b");
  const advisory = options.filter({ hasText: "maintenance advisory" });
  await page.waitForFunction(() => Array.from(document.querySelectorAll('form[aria-label="Reassign room"] option')).some(option => option.textContent?.includes("maintenance advisory")), null, { timeout: 30000 });
  if (await advisory.count() !== 1 || (await advisory.evaluate(option => option.disabled))) throw new Error(`NON_BLOCKING destination was not selectable: ${JSON.stringify(await options.allTextContents())}; payloads=${JSON.stringify(payloads)}`);
  const newTotal = form.getByTestId("reassign-new-total");
  if (!(await newTotal.innerText()).includes("360")) throw new Error(`repricing estimate missing: ${await newTotal.innerText()}`);
  const reason = form.locator('input[name="reason"]');
  await reason.fill("short");
  await form.getByRole("button", { name: "Reassign room" }).click();
  if (responses.some(item => item.url.endsWith("/reassign") && item.status < 500)) throw new Error("short reason reached the API");
  await reason.fill("Guest requested a quieter room");
  await form.getByRole("button", { name: "Reassign room" }).click();
  await page.waitForTimeout(5000);
  if (await page.getByRole("status").filter({ hasText: "Room reassigned" }).count() !== 1) throw new Error(`integrated success failed: ${JSON.stringify(payloads)}; alerts=${await page.getByRole("alert").allTextContents()}`);
  const refreshedPayload = payloads.filter(item => item.url.includes("/api/v1/bookings?limit=100")).at(-1);
  const refreshedBookings = refreshedPayload ? JSON.parse(refreshedPayload.body) : [];
  const refreshedBooking = refreshedBookings.find(item => item.id === "e2e-booking-success");
  if (refreshedBooking?.room_id !== "e2e-room-b") throw new Error(`API refresh did not show destination room: ${JSON.stringify(refreshedBooking)}; payloads=${JSON.stringify(payloads)}`);
  const refreshedRow = page.getByRole("button", { name: "Integrated Reassignment Guest" });
  if (!(await refreshedRow.innerText()).includes("102")) throw new Error(`refresh did not show destination room: ${await refreshedRow.innerText()}`);

  await openGuest("Stale Reassignment Guest");
  const staleForm = page.locator('form[aria-label="Reassign room"]');
  await staleForm.getByRole("combobox").selectOption("e2e-room-e");
  const adminMutation = await page.evaluate(async () => {
    const response = await fetch("/api/v1/housekeeping/e2e-room-e/maintenance", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-local-access-subject": "source-user:14000000-0000-0000-0000-000000000001",
        "x-local-access-email": "ana-admin@migration.invalid",
        "x-hotel-id": "10000000-0000-0000-0000-000000000001",
      },
      body: JSON.stringify({ impact: "BLOCKING", priority: "HIGH", reason: "Concurrent room blocker", assigned_to: "ops" }),
    });
    return { status: response.status, body: await response.text() };
  });
  if (adminMutation.status !== 201) throw new Error(`stale fixture mutation failed: ${adminMutation.status} ${adminMutation.body}`);
  await staleForm.locator('input[name="reason"]').fill("Guest requested a room change");
  await staleForm.getByRole("button", { name: "Reassign room" }).click();
  const conflict = page.getByRole("alert");
  await conflict.waitFor();
  if (!(await conflict.innerText()).includes("changed while you were working")) throw new Error(`operational 409 guidance missing: ${await conflict.innerText()}`);
  const failed = responses.filter(item => item.status >= 500);
  if (failed.length) throw new Error(`integrated server failures: ${JSON.stringify(failed)}`);
  await page.screenshot({ path: "output/playwright/cf-wave12-reassignment-integrated.png", fullPage: true });
  console.log("WAVE-1.2 integrated reassignment PASS: real API/D1 success, pricing, BLOCKING/NON_BLOCKING, stale 409, refresh and 375px mobile");
})()
