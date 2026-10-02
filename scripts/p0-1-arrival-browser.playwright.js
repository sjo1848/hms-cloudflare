page => (async () => {
  await page.addInitScript(() => { localStorage.setItem("hms.locale", "en"); localStorage.setItem("hms-local-acceptance-profile", "1"); });
  let roomA = "Available";
  let statusA = "Confirmed";
  let checkInAttempts = 0;
  let failBoardOnce = false;
  let simulateRefreshFailure = false;
  const posts = [];
  const bookings = [
    { id: "a-later", guest_id: "guest-b", guest_name: "Guest Later", room_id: "room-b", room_number: "102", check_in: "2026-09-01", check_out: "2026-09-04", status: "Confirmed", total_cents: 30000, notes: null },
    { id: "m-blocked", guest_id: "guest-c", guest_name: "Guest Blocked", room_id: "room-c", room_number: "103", check_in: "2026-09-01", check_out: "2026-09-03", status: "Confirmed", total_cents: 20000, notes: null },
    { id: "z-priority", guest_id: "guest-a", guest_name: "Guest Priority", room_id: "room-a", room_number: "101", check_in: "2026-08-31", check_out: "2026-09-03", status: "Confirmed", total_cents: 20000, notes: null },
  ];
  const rooms = [
    { id: "room-a", room_number: "101", room_type: "STANDARD", price_cents: 10000, status: "Available" },
    { id: "room-b", room_number: "102", room_type: "STANDARD", price_cents: 10000, status: "Available" },
    { id: "room-c", room_number: "103", room_type: "STANDARD", price_cents: 10000, status: "Maintenance" },
  ];
  const board = () => ({
    date: "2026-09-01", generated_at: "2026-09-01T12:00:00Z",
    items: [
      { booking: { ...bookings[2], status: statusA }, lane: statusA === "Confirmed" ? "arrival" : "in-house", reason: statusA === "Confirmed" ? "arrival-overdue" : "in-house", attention: statusA === "Confirmed", priority: statusA === "Confirmed" ? 5 : 40, date: "2026-08-31", room_status: roomA, maintenance_case: null },
      { booking: bookings[0], lane: "arrival", reason: "arrival-today", attention: true, priority: 20, date: "2026-09-01", room_status: "Available", maintenance_case: { id: "advisory", status: "Open", impact: "NON_BLOCKING", reason: "Lamp inspection" } },
      { booking: bookings[1], lane: "arrival", reason: "arrival-today", attention: true, priority: 20, date: "2026-09-01", room_status: "Maintenance", maintenance_case: { id: "blocker", status: "Open", impact: "BLOCKING", reason: "Unsafe electrical outlet" } },
    ],
  });
  await page.route("**/api/v1/**", async route => {
    const url = route.request().url();
    const json = (body, status = 200) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
    // Capabilities remain server-owned. Let the real local Worker provide
    // auth/me; only the journey data and injected conflict/read failures below
    // are synthetic.
    if (url.endsWith("/auth/me")) return route.continue();
    if (url.endsWith("/front-desk/board")) {
      if (failBoardOnce) { failBoardOnce = false; return json({ error: { code: "INTERNAL_ERROR", message: "Temporary board failure" } }, 500); }
      return json(board());
    }
    if (url.endsWith("/bookings/z-priority/check-in") && route.request().method() === "POST") {
      posts.push(route.request().postDataJSON());
      if (++checkInAttempts === 1) { roomA = "Dirty"; failBoardOnce = simulateRefreshFailure; return json({ error: { code: "CONFLICT", message: "Room changed" } }, 409); }
      statusA = "CheckedIn"; roomA = "Occupied";
      return json({ id: "z-priority", status: "CheckedIn", room_status: "Occupied" });
    }
    if (url.endsWith("/rooms")) return json(rooms.map(room => room.id === "room-a" ? { ...room, status: roomA } : room));
    if (url.endsWith("/guests")) return json(bookings.map(booking => ({ id: booking.guest_id, full_name: booking.guest_name, email: `${booking.guest_id}@example.test`, phone: null })));
    if (url.endsWith("/bookings?limit=100")) return json(bookings.map(booking => booking.id === "z-priority" ? { ...booking, status: statusA } : booking));
    if (url.endsWith("/invoice")) return json(null);
    if (url.endsWith("/payments") || url.endsWith("/extra-charges") || url.includes("/rooms/available?")) return json([]);
    return json([]);
  });

  for (const width of [375, 1280]) {
    statusA = "Confirmed"; roomA = "Available"; checkInAttempts = 0; posts.length = 0; simulateRefreshFailure = width === 375;
    await page.setViewportSize({ width, height: width === 375 ? 812 : 900 });
    await page.goto("http://127.0.0.1:4176/bookings");
    await page.locator(".language-selector select").selectOption("en");
    await page.waitForFunction(() => document.documentElement.lang === "en");
    const arrivalsFilter = page.locator(".reception-queue-filters button").nth(1);
    await arrivalsFilter.click();
    if (await arrivalsFilter.getAttribute("aria-pressed") !== "true") throw new Error("Arrival lane filter was not selected");
    await page.getByLabel("Search this shift").fill("Guest");
    const rows = page.locator(".reception-queue-row");
    if ((await rows.first().getAttribute("data-booking-id")) !== "z-priority") throw new Error("Queue did not follow canonical priority");
    await rows.first().click();
    await page.locator(".reception-checkin-trigger").click();
    const dialog = page.getByRole("dialog", { name: "Next action: check-in verification" });
    await dialog.waitFor();
    await page.waitForFunction(() => document.activeElement?.classList.contains("checkin-step-heading"));
    await dialog.getByLabel("Final guest count").fill("2");
    await dialog.getByLabel("Document verified").check();
    await dialog.getByRole("button", { name: "Next step" }).click();
    await dialog.getByLabel("Contact confirmed").check();
    await dialog.getByLabel("Stay confirmed").check();
    await dialog.getByRole("button", { name: "Next step" }).click();
    await dialog.getByText("Room ready for arrival", { exact: true }).waitFor();
    await page.screenshot({ path: width === 375 ? "output/playwright/p0-1-checkin-mobile-task.png" : "output/playwright/p0-1-checkin-desktop-task.png", fullPage: true });
    await dialog.getByRole("button", { name: "Next step" }).click();
    await dialog.getByRole("button", { name: "Complete check-in" }).click();
    if (simulateRefreshFailure) {
      await dialog.getByRole("alert").getByText("could not be loaded").waitFor();
      if (await dialog.getByRole("button", { name: "Next step" }).isEnabled()) throw new Error("Retry enabled after failed authoritative refresh");
      await dialog.getByRole("button", { name: "Refresh status" }).click();
    } else await dialog.getByRole("alert").getByText("The booking or room changed").waitFor();
    if (await dialog.getByRole("button", { name: "Next step" }).isEnabled()) throw new Error("Stale room allowed retry");
    roomA = "Available";
    await dialog.getByRole("button", { name: "Refresh status" }).click();
    await dialog.getByRole("button", { name: "Next step" }).click();
    await dialog.getByRole("button", { name: "Complete check-in" }).evaluate(button => { (button).click(); (button).click(); });
    await dialog.waitFor({ state: "hidden" });
    await page.waitForFunction(() => document.activeElement?.classList.contains("reception-case-title") || document.activeElement?.matches(".reception-queue-row.selected"));
    if (posts.length !== 2 || posts[1].check_in_guests_count !== 2) throw new Error(`Check-in request count/payload mismatch: ${JSON.stringify(posts)}`);
    if (!(await page.getByRole("status").filter({ hasText: "Next case: Guest Later" }).count())) throw new Error("Next case feedback missing");
    if ((await page.locator(".reception-queue-row.selected").getAttribute("data-booking-id")) !== "a-later") throw new Error("Wrong next selected case");
    if ((await page.getByLabel("Search this shift").inputValue()) !== "Guest") throw new Error("Search context lost");
    if (await arrivalsFilter.getAttribute("aria-pressed") !== "true") throw new Error("Filter context lost");
    if (width === 375) await page.screenshot({ path: "output/playwright/p0-1-arrival-mobile.png", fullPage: true });
    else await page.screenshot({ path: "output/playwright/p0-1-arrival-desktop.png", fullPage: true });
  }
  await page.getByRole("button", { name: /^All / }).click();
  await page.locator('[data-booking-id="z-priority"]').click();
  const selectedUrl = await page.evaluate(() => { const url = new URL(location.href); return { booking: url.searchParams.get("booking_id"), task: url.searchParams.has("task") }; });
  if (selectedUrl.booking !== "z-priority" || selectedUrl.task) throw new Error("Non-arrival selection left a stale task URL");

  statusA = "Confirmed"; roomA = "Available"; checkInAttempts = 1;
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("http://127.0.0.1:4176/bookings");
  const finalArrivalsFilter = page.locator(".reception-queue-filters button").nth(1);
  await finalArrivalsFilter.click();
  await page.getByLabel("Search this shift").fill("Guest Priority");
  await page.locator('[data-booking-id="z-priority"]').click();
  await page.locator(".reception-checkin-trigger").click();
  const lastTask = page.getByRole("dialog", { name: "Next action: check-in verification" });
  await lastTask.getByLabel("Final guest count").fill("2");
  await lastTask.getByLabel("Document verified").check();
  await lastTask.getByRole("button", { name: "Next step" }).click();
  await lastTask.getByLabel("Contact confirmed").check();
  await lastTask.getByLabel("Stay confirmed").check();
  await lastTask.getByRole("button", { name: "Next step" }).click();
  await lastTask.getByRole("button", { name: "Next step" }).click();
  await lastTask.getByRole("button", { name: "Complete check-in" }).click();
    await lastTask.waitFor({ state: "hidden" });
  await page.getByRole("status").getByText("Check-in confirmed. The queue is up to date.").waitFor();
  await page.waitForFunction(() => document.activeElement?.closest(".reception-queue-tools") !== null);
  const noNextUrl = await page.evaluate(() => { const url = new URL(location.href); return { booking: url.searchParams.has("booking_id"), task: url.searchParams.has("task") }; });
  if (noNextUrl.booking || noNextUrl.task) throw new Error("No-next success left stale booking/task URL");

  statusA = "Confirmed"; roomA = "Available";
  const responsiveViewports = [[1280, 900], [768, 812], [375, 812], [375, 600], [844, 390]];
  for (const [width, height] of responsiveViewports) {
    await page.setViewportSize({ width, height });
    await page.goto("http://127.0.0.1:4176/bookings?lane=arrivals&q=Guest+Priority");
    await page.locator(".reception-queue-filters button").nth(1).waitFor();
    await page.getByLabel("Search this shift").fill("Guest Priority");
    const caseRow = page.locator('[data-booking-id="z-priority"]');
    await caseRow.waitFor();
    await caseRow.click();
    await page.locator(".reception-checkin-trigger").scrollIntoViewIfNeeded();
    await page.locator(".reception-checkin-trigger").click();
    const responsiveTask = page.getByRole("dialog", { name: "Next action: check-in verification" });
    await responsiveTask.waitFor();
    const nextStep = responsiveTask.getByRole("button", { name: "Next step" });
    await nextStep.scrollIntoViewIfNeeded();
    const bounds = await nextStep.boundingBox();
    if (!bounds || bounds.x < 0 || bounds.x + bounds.width > width || await page.evaluate(() => document.documentElement.scrollWidth) > width) {
      throw new Error(`Check-in task control overflow/unreachable at ${width}x${height}: ${JSON.stringify(bounds)}`);
    }
    await page.waitForFunction(() => document.activeElement?.classList.contains("checkin-step-heading"));
    await page.keyboard.press("Escape");
    await responsiveTask.waitFor({ state: "hidden" });
    await page.waitForFunction(() => document.activeElement?.classList.contains("reception-case-title"));
    const taskRoute = await page.evaluate(() => new URL(location.href).searchParams.has("task"));
    if (taskRoute) throw new Error(`Responsive Check-in close kept a stale task route at ${width}x${height}`);
  }
  console.log(JSON.stringify({ result: "P0.1 MOCK browser PASS", integratedMutations: ["mobile", "desktop"], responsiveTaskViewports: responsiveViewports, cases: ["priority", "BLOCKING", "409 recovery", "authoritative refresh", "next case"] }));
})()
