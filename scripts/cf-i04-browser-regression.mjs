async page => {
  const calls = [];
  const guest = { id: "guest-a", full_name: "Guest A", email: "a@example.test", phone: null };
  const rooms = [
    { id: "room-a", room_number: "101", room_type: "STANDARD", status: "Occupied", price_cents: 10000 },
    { id: "room-b", room_number: "102", room_type: "STANDARD", status: "Available", price_cents: 12000 },
  ];
  let lifecycleStatus = "Confirmed";
  let checkInAttempts = 0;
  const booking = { id: "booking-a", guest_id: "guest-a", guest_name: "Guest A", room_id: "room-a", room_number: "101", check_in: "2026-09-01", check_out: "2026-09-03", status: lifecycleStatus, total_cents: 20000, notes: null };
  await page.unroute("**/api/v1/**");
  await page.route("**/api/v1/**", async route => {
    const request = route.request(); const url = request.url();
    if (request.method() === "POST") {
      const body = request.postDataJSON(); calls.push({ method: request.method(), url, body });
      if (url.includes("check-in") && ++checkInAttempts === 1 && checkInAttempts === 1 && calls.filter(call => call.url.includes("check-in")).length === 1) return route.fulfill({ status: 409, contentType: "application/json", body: JSON.stringify({ error: { code: "CONFLICT", message: "Booking became unavailable during check-in" } }) });
      lifecycleStatus = url.includes("check-out") ? "CheckedOut" : url.includes("reassign") ? "CheckedIn" : "CheckedIn";
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ id: booking.id, status: lifecycleStatus, room_id: "room-b", room_status: url.includes("check-out") ? "Dirty" : "Occupied" }) });
    }
    if (url.endsWith("/bookings?limit=100")) return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([{ ...booking, status: lifecycleStatus }]) });
    if (url.endsWith("/rooms")) return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(rooms) });
    if (url.endsWith("/guests")) return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([guest]) });
    return route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
  });

  async function openCase() { await page.getByRole("button", { name: "Guest A" }).click(); await page.getByText("Selected case").waitFor(); }
  async function completeCheckIn(width, expectConflict) {
    await openCase();
    const mobile = width < 768;
    if (mobile) {
      await page.getByRole("heading", { name: "Next action: check-in verification" }).waitFor();
      await page.getByText("Verificación", { exact: true }).waitFor();
      await page.getByLabel("Final guest count").fill("2");
      await page.getByLabel("Document verified").check();
      await page.getByRole("button", { name: "Next step" }).click();
      await page.getByText("Datos / estadía", { exact: true }).waitFor();
      await page.getByLabel("Contact confirmed").check(); await page.getByLabel("Stay confirmed").check();
      await page.getByRole("button", { name: "Next step" }).click();
      await page.getByText("Habitación", { exact: true }).waitFor(); await page.getByRole("button", { name: "Next step" }).click();
      await page.getByText("Confirmar ingreso", { exact: true }).waitFor();
    } else {
      await page.getByLabel("Final guest count").fill("2"); await page.getByLabel("Document verified").check(); await page.getByLabel("Contact confirmed").check(); await page.getByLabel("Stay confirmed").check();
    }
    await page.getByRole("button", { name: "Complete check-in" }).click();
    if (expectConflict) { await page.getByRole("alert").getByText("Booking became unavailable during check-in").waitFor(); await page.getByRole("button", { name: "Complete check-in" }).click(); }
  }

  for (const [width, height] of [[375, 800], [390, 800], [430, 800], [768, 900], [1024, 900]]) {
    lifecycleStatus = "Confirmed"; checkInAttempts = width === 375 ? 0 : 1;
    await page.setViewportSize({ width, height }); await page.goto("http://127.0.0.1:4173/bookings");
    await completeCheckIn(width, width === 375);
    await openCase();
    await page.locator('form[aria-label="Reassign room"] select').selectOption("room-b"); await page.getByRole("button", { name: "Reassign room" }).click();
    await openCase();
    const checkout = page.locator('form[aria-label="Checkout"]');
    await checkout.locator('select[name="policy"]').selectOption(width === 390 || width === 430 ? "pending-approved" : "settled");
    if (width === 390 || width === 430) { await checkout.locator('input[name="reference"]').fill("short"); await checkout.getByLabel("Charges reviewed").check(); await checkout.getByLabel("Room release confirmed").check(); await checkout.getByLabel("Housekeeping handoff confirmed").check(); await checkout.getByRole("button", { name: "Complete checkout" }).click(); if (calls.some(call => call.url.includes("check-out") && call.body.check_out_reference === "short")) throw new Error(`short pending reference submitted at ${width}px`); await checkout.locator('input[name="reference"]').fill("approved-123"); }
    await checkout.getByLabel("Charges reviewed").check(); await checkout.getByLabel("Room release confirmed").check(); await checkout.getByLabel("Housekeeping handoff confirmed").check(); await checkout.getByRole("button", { name: "Complete checkout" }).click();
  }
  if (!calls.some(call => call.url.endsWith("/bookings/booking-a/reassign"))) throw new Error("reassignment call missing");
  if (!calls.some(call => call.url.endsWith("/bookings/booking-a/check-out") && call.body.check_out_payment_policy === "pending-approved" && call.body.check_out_reference === "approved-123")) throw new Error("pending-approved checkout evidence missing");
  await page.screenshot({ path: "output/playwright/cf-i04-reception-lifecycle.png", fullPage: true });
  console.log("CF-I04 browser regression PASS: staged check-in, reassignment and checkout/handoff at 375/390/430/768/1024");
}
