(page) => (async () => {
  await page.addInitScript(() => { localStorage.setItem("hms.locale", "en"); localStorage.setItem("hms-local-acceptance-profile", "0"); });
  await page.setExtraHTTPHeaders({ "x-local-access-subject": "source-user:14000000-0000-0000-0000-000000000002", "x-local-access-email": "leo-reception@migration.invalid", "x-hotel-id": "10000000-0000-0000-0000-000000000001" });
  await page.setViewportSize({ width: 375, height: 812 });
  const payloads = [];
  page.on("response", async response => {
    if (response.url().includes("/api/v1/bookings?") || response.url().includes("/api/v1/rooms/available") || response.url().includes("/api/v1/housekeeping/") || response.url().endsWith("/reassign")) payloads.push({ url: response.url(), status: response.status(), body: await response.text().catch(() => "") });
  });
  await page.goto("http://127.0.0.1:4174/bookings");
  await page.getByRole("heading", { name: "Booking case workspace" }).waitFor();
  await page.getByRole("button", { name: "All" }).click();
  await page.getByText("Integrated Reassignment Guest", { exact: true }).first().waitFor({ timeout: 60000 });
  await page.getByText("Integrated Reassignment Guest", { exact: true }).first().click();
  const form = page.locator('form[aria-label="Reassign room"]'); await form.waitFor(); await page.waitForTimeout(4000);
  const options = form.getByRole("option");
  const state = await options.evaluateAll(items => items.map(item => ({ text: item.textContent, disabled: item.disabled })));
  const blocking = state.find(item => item.text.includes("blocked by maintenance"));
  if (!blocking?.disabled) throw new Error(`BLOCKING destination was selectable: ${JSON.stringify(state)}`);
  await form.getByRole("combobox").selectOption("e2e-room-b");
  await page.waitForFunction(() => Array.from(document.querySelectorAll('form[aria-label="Reassign room"] option')).some(option => option.textContent?.includes("maintenance advisory")), null, { timeout: 30000 });
  if ((await form.getByRole("option").filter({ hasText: "maintenance advisory" }).evaluate(option => option.disabled))) throw new Error("NON_BLOCKING destination disabled");
  if (!(await form.getByTestId("reassign-new-total").innerText()).includes("360")) throw new Error("repricing estimate missing");
  const reason = form.locator('input[name="reason"]'); await reason.fill("short"); await form.getByRole("button", { name: "Reassign room" }).click();
  if (payloads.some(item => item.url.endsWith("/reassign"))) throw new Error("short reason reached API");
  await reason.fill("Guest requested a quieter room"); await form.getByRole("button", { name: "Reassign room" }).click(); await page.waitForTimeout(4000);
  if (await page.getByRole("status").filter({ hasText: "Room reassigned" }).count() !== 1) throw new Error(`success notice missing: ${JSON.stringify(payloads)}`);
  const refreshed = payloads.filter(item => item.url.includes("/api/v1/bookings?limit=100")).at(-1);
  const booking = refreshed ? JSON.parse(refreshed.body).find(item => item.id === "e2e-booking-success") : null;
  if (booking?.room_id !== "e2e-room-b") throw new Error(`refresh response missing destination: ${JSON.stringify(booking)}`);
  const row = page.getByRole("button", { name: "Integrated Reassignment Guest" }); if (!(await row.innerText()).includes("102")) throw new Error(`rendered refresh missing destination: ${await row.innerText()}`);
  await page.screenshot({ path: "output/playwright/cf-wave12-reassignment-success.png", fullPage: true });
  console.log("WAVE-1.2 integrated success PASS: real API/D1, repricing, advisory/BLOCKING, reason, refresh and 375px mobile");
})()
