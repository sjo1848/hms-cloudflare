async page => {
  const bookings = [];
  let createCount = 0;
  let firstBookingsLoad = true;
  const guest = { id: "guest-a", full_name: "Guest A", email: "a@example.test", phone: null };
  const room = { id: "room-a", room_number: "101", room_type: "STANDARD", status: "Available", price_cents: 10000 };
  const booking = () => ({
    id: "booking-a", guest_id: guest.id, guest_name: guest.full_name, room_id: room.id, room_number: room.room_number,
    check_in: "2026-08-23", check_out: "2026-08-25", status: "Confirmed", total_cents: 20000, notes: null,
  });
  const json = async (route, status, body) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });

  await page.unroute("**/api/v1/**");
  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const requestUrl = request.url();
    if (requestUrl.includes("/api/v1/bookings") && request.method() !== "POST" && request.method() !== "PATCH") {
      if (firstBookingsLoad) { firstBookingsLoad = false; await page.waitForTimeout(1500); }
      return json(route, 200, bookings);
    }
    if (requestUrl.endsWith("/api/v1/rooms") && request.method() === "GET") return json(route, 200, [room]);
    if (requestUrl.endsWith("/api/v1/guests") && request.method() === "GET") return json(route, 200, [guest]);
    if (requestUrl.includes("/api/v1/rooms/available") && request.method() === "GET") return json(route, 200, [room]);
    if (requestUrl.endsWith("/api/v1/bookings") && request.method() === "POST") {
      createCount += 1;
      if (createCount === 2) return json(route, 409, { error: { message: "Room is unavailable for one or more nights" } });
      bookings.push(booking());
      return json(route, 201, booking());
    }
    if (requestUrl.endsWith("/api/v1/bookings/booking-a") && request.method() === "PATCH") return json(route, 200, booking());
    return json(route, 404, { error: { message: "Not found" } });
  });

  const navigation = page.goto("http://127.0.0.1:4173/bookings", { waitUntil: "commit" });
  await navigation;
  await page.getByRole("heading", { name: "Bookings" }).waitFor();
  await page.getByText("No bookings yet.").waitFor();

  const createButton = page.getByRole("button", { name: "Create booking" });
  await createButton.click();
  if (await page.locator("select[aria-label=Guest]").evaluate((element) => element.checkValidity())) {
    throw new Error("required booking validation was not observable");
  }

  await page.getByLabel("Guest").selectOption("guest-a");
  await page.locator("input[type=date]").nth(0).fill("2026-08-23");
  await page.locator("input[type=date]").nth(1).fill("2026-08-25");
  await page.getByRole("button", { name: "Find available rooms" }).click();
  await page.getByLabel("Room").selectOption("room-a");
  await createButton.click();
  await page.getByRole("button", { name: "Guest A" }).waitFor();

  await page.getByRole("button", { name: "Guest A" }).click();
  await page.getByRole("heading", { name: "Edit booking" }).waitFor();
  await page.getByRole("button", { name: "Save changes" }).click();

  await page.getByLabel("Guest").selectOption("guest-a");
  await page.locator("input[type=date]").nth(0).fill("2026-08-26");
  await page.locator("input[type=date]").nth(1).fill("2026-08-28");
  await page.getByRole("button", { name: "Find available rooms" }).click();
  await page.getByLabel("Room").selectOption("room-a");
  await createButton.click();
  await page.getByRole("alert").filter({ hasText: "Room is unavailable" }).waitFor();

  await page.screenshot({ path: "output/playwright/cf-i03-bookings.png", fullPage: true });
  console.log("CF-I03 browser regression PASS: empty, required validation, availability, create, detail/edit and typed backend error");
}
