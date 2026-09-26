async page => {
  const calls = [];
  await page.addInitScript(() => localStorage.setItem("hms.locale", "en"));
  const guest = { id: "guest-a", full_name: "Guest A", email: "a@example.test", phone: null };
  const rooms = [
    { id: "room-a", room_number: "101", room_type: "STANDARD", status: "Occupied", price_cents: 10000 },
    { id: "room-b", room_number: "102", room_type: "STANDARD", status: "Available", price_cents: 12000 },
  ];
  let lifecycleStatus = "Confirmed";
  let activeRoomId = "room-a";
  let roomAStatus = "Available";
  let roomBStatus = "Available";
  let checkInAttempts = 0;
  let reassignAttempts = 0;
  const booking = { id: "booking-a", guest_id: "guest-a", guest_name: "Guest A", room_id: "room-a", room_number: "101", check_in: "2026-09-01", check_out: "2026-09-03", status: lifecycleStatus, total_cents: 20000, notes: null };
  await page.unroute("**/api/v1/**");
  await page.route("**/api/v1/**", async route => {
    const request = route.request(); const url = request.url();
    if (request.method() === "POST") {
      const body = request.postDataJSON(); calls.push({ method: request.method(), url, body });
      if (url.includes("check-in") && ++checkInAttempts === 1 && checkInAttempts === 1 && calls.filter(call => call.url.includes("check-in")).length === 1) return route.fulfill({ status: 409, contentType: "application/json", body: JSON.stringify({ error: { code: "CONFLICT", message: "Booking became unavailable during check-in" } }) });
      if (url.includes("/reassign") && ++reassignAttempts === 1) return route.fulfill({ status: 409, contentType: "application/json", body: JSON.stringify({ error: { code: "CONFLICT", message: "Synthetic destination conflict" } }) });
      lifecycleStatus = url.includes("check-out") ? "CheckedOut" : "CheckedIn";
      if (url.includes("check-in")) roomAStatus = "Occupied";
      if (url.includes("reassign")) { activeRoomId = "room-b"; roomAStatus = "Dirty"; roomBStatus = "Occupied"; }
      if (url.includes("check-out")) roomBStatus = "Dirty";
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ id: booking.id, status: lifecycleStatus, room_id: activeRoomId, room_status: url.includes("check-out") ? "Dirty" : "Occupied" }) });
    }
    if (url.endsWith("/front-desk/board")) {
      const current = { ...booking, status: lifecycleStatus, room_id: activeRoomId, room_number: activeRoomId === "room-a" ? "101" : "102" };
      const checkedIn = lifecycleStatus === "CheckedIn";
      const item = { booking: current, lane: lifecycleStatus === "Confirmed" ? "arrival" : checkedIn ? "in-house" : "finished", reason: lifecycleStatus === "Confirmed" ? "arrival-today" : checkedIn ? "in-house" : "finished", attention: lifecycleStatus === "Confirmed", priority: lifecycleStatus === "Confirmed" ? 20 : checkedIn ? 40 : 90, date: current.check_in, room_status: activeRoomId === "room-a" ? roomAStatus : roomBStatus, maintenance_case: null };
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ date: "2026-09-01", generated_at: "2026-09-01T12:00:00Z", items: [item] }) });
    }
    if (url.endsWith("/auth/me")) return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ hotel_id: "hotel-a", hotel_name: "Hotel Norte", hotel_local_date: "2026-09-01", hotel_timezone: "America/Argentina/Mendoza" }) });
    if (url.includes("/rooms/available?")) return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([rooms[1]]) });
    if (url.includes("/housekeeping/board?")) return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ date: "2026-09-01", rooms: [{ room_id: "room-b", room_number: "102", room_type: "STANDARD", room_status: "Available" }] }) });
    if (url.endsWith("/invoice")) return route.fulfill({ status: 200, contentType: "application/json", body: "null" });
    if (url.endsWith("/extra-charges")) return route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
    if (url.endsWith("/bookings?limit=100")) return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([{ ...booking, status: lifecycleStatus, room_id: activeRoomId }]) });
    if (url.endsWith("/rooms")) return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(rooms.map(room => ({ ...room, status: room.id === "room-a" ? roomAStatus : roomBStatus }))) });
    if (url.endsWith("/guests")) return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([guest]) });
    return route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
  });

  async function openCase() { await page.getByRole("button", { name: /^All / }).click(); await page.getByRole("button", { name: /Guest A/ }).click(); }
  async function completeCheckIn(width, expectConflict) {
    await openCase();
    const dialog = page.getByRole("dialog", { name: "Check in booking" });
    await dialog.waitFor();
    await dialog.getByLabel("Final guest count").fill("2");
    await dialog.getByLabel("Document verified").check();
    await dialog.getByRole("button", { name: "Next step" }).click();
    await dialog.getByLabel("Contact confirmed").check(); await dialog.getByLabel("Stay confirmed").check();
    await dialog.getByRole("button", { name: "Next step" }).click();
    await dialog.getByText("Room ready for arrival", { exact: true }).waitFor();
    await dialog.getByRole("button", { name: "Next step" }).click();
    await dialog.getByRole("button", { name: "Complete check-in" }).click();
    if (expectConflict) {
      await dialog.getByRole("alert").getByText("The booking or room changed").waitFor();
      await dialog.getByRole("button", { name: "Next step" }).click();
      await dialog.getByRole("button", { name: "Complete check-in" }).click();
    }
    await dialog.waitFor({ state: "hidden" });
  }

  for (const [width, height] of [[375, 800], [390, 800], [430, 800], [768, 900], [1024, 900]]) {
    lifecycleStatus = "Confirmed"; activeRoomId = "room-a"; roomAStatus = "Available"; roomBStatus = "Available"; checkInAttempts = width === 375 ? 0 : 1; reassignAttempts = width === 375 ? 0 : 1;
    await page.setViewportSize({ width, height }); await page.goto("http://127.0.0.1:4173/bookings");
    await completeCheckIn(width, width === 375);
    await openCase();
    const reassignForm = page.locator('form[aria-label="Reassign room"]');
    await reassignForm.getByRole("combobox").selectOption("room-b");
    if (width === 375) { await reassignForm.locator('input[name="reason"]').fill("short"); await page.getByRole("button", { name: "Reassign room" }).click(); if (reassignAttempts !== 0) throw new Error("short reassignment reason was submitted"); }
    if (width === 375) { await reassignForm.locator('input[name="reason"]').fill("Guest asks"); await page.getByRole("button", { name: "Reassign room" }).click(); if (!(await page.getByRole("alert").textContent())?.includes("The stay or destination changed")) throw new Error("reassignment conflict guidance missing"); }
    await reassignForm.locator('input[name="reason"]').fill("Guest requested room move"); await page.getByRole("button", { name: "Reassign room" }).click();
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
