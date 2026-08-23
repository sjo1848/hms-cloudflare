async page => {
  const calls = [];
  const guest = { id: "guest-a", full_name: "Guest A", email: "a@example.test", phone: null };
  const rooms = [
    { id: "room-a", room_number: "101", room_type: "STANDARD", status: "Occupied", price_cents: 10000 },
    { id: "room-b", room_number: "102", room_type: "STANDARD", status: "Available", price_cents: 12000 },
  ];
  const booking = { id: "booking-a", guest_id: "guest-a", guest_name: "Guest A", room_id: "room-a", room_number: "101", check_in: "2026-09-01", check_out: "2026-09-03", status: "CheckedIn", total_cents: 20000, notes: null };
  await page.unroute("**/api/v1/**");
  await page.route("**/api/v1/**", async route => {
    const request = route.request(); const url = request.url();
    if (request.method() === "POST") { calls.push({ method: request.method(), url, body: request.postDataJSON() }); return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ id: booking.id, status: url.includes("check-out") ? "CheckedOut" : "CheckedIn", room_id: "room-b", room_status: url.includes("check-out") ? "Dirty" : "Occupied" }) }); }
    if (url.endsWith("/bookings?limit=100")) return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([booking]) });
    if (url.endsWith("/rooms")) return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(rooms) });
    if (url.endsWith("/guests")) return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([guest]) });
    return route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
  });
  await page.goto("http://127.0.0.1:4173/bookings");
  await page.getByRole("button", { name: "Guest A" }).click();
  await page.getByRole("heading", { name: "Room reassignment" }).waitFor();
  await page.locator('form[aria-label="Reassign room"] select').selectOption("room-b");
  await page.getByRole("button", { name: "Reassign room" }).click();
  await page.getByRole("button", { name: "Guest A" }).click();
  await page.getByLabel("Payment policy accepted").check();
  await page.getByLabel("Charges reviewed").check();
  await page.getByLabel("Room release confirmed").check();
  await page.getByLabel("Housekeeping handoff confirmed").check();
  await page.getByRole("button", { name: "Complete checkout" }).click();
  if (!calls.some(call => call.url.endsWith("/bookings/booking-a/reassign"))) throw new Error("reassignment call missing");
  if (!calls.some(call => call.url.endsWith("/bookings/booking-a/check-out"))) throw new Error("checkout call missing");
  await page.screenshot({ path: "output/playwright/cf-i04-reception-lifecycle.png", fullPage: true });
  console.log("CF-I04 browser regression PASS: reassignment and checkout/handoff journey");
}
