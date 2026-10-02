(page) => (async () => {
  const guests = [{ id: "guest-a", full_name: "Ana Guest", email: "ana@example.test", phone: null }];
  const booking = { id: "booking-a", guest_id: "guest-a", guest_name: "Ana Guest", room_id: "room-a", room_number: "101", check_in: "2026-09-01", check_out: "2099-01-01", status: "CheckedIn", total_cents: 18000, notes: null };
  let allowBookingContextSuccess = false;
  await page.route("**/api/v1/**", async route => {
    const request = route.request();
    const url = request.url();
    if (url.endsWith("/api/v1/auth/me")) return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ subject: "subject-a", email: "a@example.test", hotel_id: "hotel-a", hotel_name: "Hotel Norte", capabilities: { hotel: ["guests.read", "guests.write", "bookings.read"], network: [] } }) });
    if (url.endsWith("/api/v1/guests") && request.method() === "GET") return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(guests) });
    if (url.includes("/api/v1/bookings") && request.method() === "GET") {
      if (!allowBookingContextSuccess) {
        return route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: { message: "Synthetic booking context read failure" } }) });
      }
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([booking]) });
    }
    return route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ error: { message: "Not found" } }) });
  });

  await page.goto("http://127.0.0.1:4197/guests", { waitUntil: "domcontentloaded" });
  await page.locator(".guest-operational-card").first().waitFor();
  const contextError = page.locator(".guest-context-error [role=alert]");
  await contextError.waitFor();
  if (await page.locator(".guest-operational-card").first().innerText().then(text => /No related stays|Sin estadías asociadas/i.test(text))) throw new Error("failed booking context was presented as an empty stay history");
  await page.locator(".guest-operational-card").first().click();
  await page.getByRole("heading", { name: "Ana Guest" }).waitFor();
  if (await page.locator(".guest-stay-history").innerText().then(text => /No stays are recorded|No hay estadías registradas/i.test(text))) throw new Error("selected guest detail falsely reports no stays while the read failed");
  allowBookingContextSuccess = true;
  await page.locator(".guest-context-error button").click();
  await contextError.waitFor({ state: "detached" });
  await page.locator(".guest-current-stay").getByText(/101/).waitFor();

  const viewports = [{ width: 1440, height: 900 }, { width: 900, height: 768 }, { width: 375, height: 812 }, { width: 812, height: 375 }];
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.waitForTimeout(75);
    if (await page.evaluate(() => document.documentElement.scrollWidth) > viewport.width) throw new Error(`Guests overflow ${viewport.width}x${viewport.height}`);
    if (!(await page.locator(".guest-context-error").count()) && !(await page.locator(".guest-current-stay").isVisible())) throw new Error(`selected guest context was lost at ${viewport.width}x${viewport.height}`);
  }
  return { browser: "real local Chromium", api: "MOCKED; one synthetic booking-context 503 then success", contextFailureAndRetry: "PASS", widths: viewports, noFalseEmptyHistory: "PASS" };
})()
