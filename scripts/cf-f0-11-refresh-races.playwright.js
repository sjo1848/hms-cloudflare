(page) => (async () => {
  const base = "http://127.0.0.1:4181";
  const hotelId = "10000000-0000-0000-0000-000000000001";
  const guest = { id: "f011-guest", guest_name: "Refresh Guest", full_name: "Refresh Guest", email: "refresh@example.test", phone: null };
  const room = { id: "f011-room", room_number: "711", room_type: "STANDARD", status: "AVAILABLE", price_cents: 10000, operational_state: { readiness: { state: "READY_FOR_ARRIVAL" } } };
  const bookingA = { id: "f011-booking-a", guest_id: guest.id, guest_name: "Account A", room_id: room.id, room_number: room.room_number, check_in: "2026-10-01", check_out: "2026-10-03", status: "Confirmed", total_cents: 10000, notes: null };
  const bookingB = { ...bookingA, id: "f011-booking-b", guest_name: "Account B", total_cents: 20000 };
  let roomPrice = room.price_cents;
  let roomReads = 0;
  let releaseStaleRooms;
  let staleRoomsStarted;
  const staleRoomsStartedPromise = new Promise(resolve => { staleRoomsStarted = resolve; });
  const staleRoomsGate = new Promise(resolve => { releaseStaleRooms = resolve; });
  let releasePatch;
  let patchStarted;
  const patchStartedPromise = new Promise(resolve => { patchStarted = resolve; });
  const patchGate = new Promise(resolve => { releasePatch = resolve; });
  let holdAccountA = true;
  let releaseAccountA;
  let accountAStarted;
  const accountAStartedPromise = new Promise(resolve => { accountAStarted = resolve; });
  const accountAGate = new Promise(resolve => { releaseAccountA = resolve; });
  let failBillingPath = null;
  let receptionScenario = false;
  let receptionQueueHasBooking = true;
  let receptionDetailReads = 0;
  let failReceptionDetail = false;
  let gateReceptionDetail = false;
  let releaseReceptionDetail;
  let receptionDetailStarted;
  const receptionDetailStartedPromise = new Promise(resolve => { receptionDetailStarted = resolve; });
  const receptionDetailGate = new Promise(resolve => { releaseReceptionDetail = resolve; });
  let housekeepingScenario = false;
  let failNextHousekeepingBoardRead = false;
  let housekeepingStatus = "Cleaning";
  const json = (route, body, status = 200) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });

  await page.addInitScript(() => localStorage.setItem("hms.locale", "en"));
  await page.route("**/api/v1/**", async route => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace("/api/v1", "");
    if (path === "/auth/me") return json(route, { hotel_id: hotelId, hotel_name: "F0.11 Synthetic", hotel_timezone: "America/Argentina/Mendoza", hotel_local_date: "2026-09-28", capabilities: { hotel: ["bookings.read", "bookings.write", "billing.read", "billing.write", "billing.balance.read", "billing.invoice.read", "bookings.extra_charges.read", "bookings.update", "bookings.extra_charges.write", "rooms.read", "rooms.write", "housekeeping.read", "housekeeping.write"], network: [] } });
    if (path === "/front-desk/board") {
      const bookings = receptionScenario ? (receptionQueueHasBooking ? [bookingA, bookingB] : [bookingB]) : [];
      return json(route, { date: "2026-09-28", generated_at: "2026-09-28T15:00:00Z", items: bookings.map((booking, index) => ({ booking, lane: "reservation", reason: "upcoming-arrival", attention: false, priority: 8 + index, date: booking.check_in, room_status: "Available", maintenance_case: null })) });
    }
    if (path === "/guests") return json(route, [guest]);
    if (path === "/reservation-creation-operations") return json(route, []);
    if (path === "/housekeeping/board") {
      if (!housekeepingScenario) return json(route, { date: "2026-09-28", rooms: [], departures_today: [] });
      if (failNextHousekeepingBoardRead) { failNextHousekeepingBoardRead = false; return json(route, { error: { code: "INTERNAL", message: "Synthetic refresh read failure" } }, 500); }
      return json(route, { date: "2026-09-28", rooms: [
        { room_id: "f011-hk-a", room_number: "712", room_type: "STANDARD", room_status: housekeepingStatus, turnover_today: true },
        { room_id: "f011-hk-b", room_number: "713", room_type: "STANDARD", room_status: "Dirty", turnover_today: true },
      ], departures_today: [] });
    }
    if (path === "/billing/balance") return json(route, { total_amount_cents: 0, cash_amount_cents: 0, card_amount_cents: 0, non_cash_amount_cents: 0, payment_count: 0, pending_amount_cents: 0, opening_time: "2026-09-28T00:00:00Z" });
    if (path === "/bookings" && request.method() === "GET") return json(route, [bookingA, bookingB]);
    if (path === "/rooms" && request.method() === "GET") {
      const read = ++roomReads;
      const body = [{ ...room, price_cents: roomPrice }];
      if (read === 3) { staleRoomsStarted(); await staleRoomsGate; }
      return json(route, body);
    }
    if (path === "/rooms/f011-room" && request.method() === "PATCH") {
      patchStarted();
      await patchGate;
      roomPrice = JSON.parse(request.postData() || "{}").price_cents;
      return json(route, { ...room, price_cents: roomPrice });
    }
    if (path === "/rooms/f011-room/holds") return json(route, []);
    if (path === "/housekeeping/f011-hk-a/finish" && request.method() === "POST") { housekeepingStatus = "Available"; failNextHousekeepingBoardRead = true; return json(route, { ok: true }); }
    if (receptionScenario && path === `/bookings/${bookingA.id}` && request.method() === "GET") {
      receptionDetailReads++;
      if (receptionDetailReads === 2) return json(route, { error: { code: "NOT_FOUND", message: "Booking not found" } }, 404);
      if (failReceptionDetail) { failReceptionDetail = false; return json(route, { error: { code: "INTERNAL", message: "Synthetic detail read failure" } }, 500); }
      if (gateReceptionDetail) { receptionDetailStarted(); await receptionDetailGate; }
      return json(route, { ...bookingA, guest_name: "Authoritatively Updated Account A" });
    }
    if (path.endsWith("/invoice")) {
      const id = path.split("/")[2];
      if (failBillingPath === "invoice" && id === bookingB.id) { failBillingPath = null; return json(route, { error: { code: "INTERNAL", message: "Synthetic account read failure" } }, 500); }
      if (id === bookingA.id && holdAccountA) { holdAccountA = false; accountAStarted(); await accountAGate; }
      return json(route, { id: `invoice-${id}`, booking_id: id, amount_cents: id === bookingA.id ? 10000 : 20000, paid_amount_cents: 0, status: "PENDING", payment_method: null, payment_reference: null });
    }
    if (path.endsWith("/payments")) {
      const id = path.split("/")[2];
      if (failBillingPath === "payments" && id === bookingB.id) { failBillingPath = null; return json(route, { error: { code: "INTERNAL", message: "Synthetic account read failure" } }, 500); }
      return json(route, []);
    }
    if (path.endsWith("/extra-charges")) {
      const id = path.split("/")[2];
      if (failBillingPath === "extra-charges" && id === bookingB.id) { failBillingPath = null; return json(route, { error: { code: "INTERNAL", message: "Synthetic account read failure" } }, 500); }
      return json(route, [{ id: `charge-${id}`, booking_id: id, description: `Folio ${id === bookingA.id ? "A" : "B"}`, amount_cents: 100, category: "OTHER", created_at: "2026-09-28T15:00:00Z" }]);
    }
    return json(route, []);
  });

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(`${base}/rooms`);
  await page.getByRole("heading", { name: "Rooms", level: 2 }).waitFor();
  await page.getByRole("button").filter({ hasText: "Room 711" }).last().click();
  await page.getByRole("button", { name: "Edit room" }).click();
  await page.getByLabel("Price in cents").fill("20000");
  const save = page.getByRole("button", { name: "Save changes" });
  const savePromise = save.click();
  await patchStartedPromise;
  await page.getByRole("button", { name: "Refresh", exact: true }).click();
  await staleRoomsStartedPromise;
  releasePatch();
  await savePromise;
  const waitForSavedPrice = async () => {
    try { await page.waitForFunction(() => /200[.,]00/.test(document.querySelector(".rooms-detail")?.textContent ?? ""), null, { timeout: 5000 }); }
    catch { throw new Error(`saved room price did not become authoritative; reads=${roomReads}; detail=${await page.locator(".rooms-detail").innerText()}`); }
  };
  await waitForSavedPrice();
  releaseStaleRooms();
  await waitForSavedPrice();
  const selectedRoomDetails = await page.locator(".rooms-detail").innerText();
  if (!/200[.,]00/.test(selectedRoomDetails)) throw new Error(`an older Rooms response overwrote the latest saved room price: ${selectedRoomDetails}`);

  await page.goto(`${base}/`);
  await page.waitForFunction(() => document.querySelector(".app-content")?.getAttribute("data-hotel-capabilities")?.includes("billing.invoice.read"), null, { timeout: 10000 });
  const bookingSelect = page.getByLabel("Billing booking");
  await bookingSelect.waitFor();
  await accountAStartedPromise;
  await bookingSelect.selectOption(bookingB.id);
  await page.getByText("Folio B", { exact: false }).waitFor();
  releaseAccountA();
  await page.getByText("Folio B", { exact: false }).waitFor();
  if (await page.getByText("Folio A", { exact: false }).count()) throw new Error("late booking-A account response rendered beneath booking B");
  if (!(await page.getByText("Account B · Invoice", { exact: false }).count())) throw new Error("the selected booking B account identity was not preserved");
  await page.screenshot({ path: "output/playwright/f0-11-billing-latest-account.png", fullPage: true });
  for (const failedRead of ["invoice", "payments", "extra-charges"]) {
    await bookingSelect.selectOption(bookingA.id);
    await page.getByText("Folio A", { exact: false }).waitFor();
    failBillingPath = failedRead;
    await bookingSelect.selectOption(bookingB.id);
    await page.getByRole("alert").filter({ hasText: "Synthetic account read failure" }).waitFor();
    const failedAccount = await page.locator(".case-panel").innerText();
    if (failedAccount.includes("Folio A") || failedAccount.includes("Folio B") || failedAccount.includes("Total")) throw new Error(`failed ${failedRead} read left a partial/stale booking account visible: ${failedAccount}`);
    await bookingSelect.selectOption(bookingA.id);
    await page.getByText("Folio A", { exact: false }).waitFor();
  }

  receptionScenario = true;
  await page.goto(`${base}/bookings?lane=all&q=Account`);
  await page.locator(`[data-booking-id="${bookingA.id}"]`).click();
  receptionQueueHasBooking = false;
  await page.getByRole("button", { name: "Refresh", exact: true }).click();
  await page.getByRole("heading", { name: "Authoritatively Updated Account A" }).waitFor();
  await page.getByRole("button", { name: "Refresh", exact: true }).click();
  await page.getByRole("heading", { name: "Authoritatively Updated Account A" }).waitFor({ state: "detached" });
  if (await page.getByLabel("Search this shift").inputValue() !== "Account") throw new Error("Reception search context was not preserved after authoritative 404");
  const receptionUrl = new URL(page.url());
  if (receptionUrl.searchParams.get("lane") !== "all" || receptionUrl.searchParams.get("q") !== "Account") throw new Error("Reception lane/search URL context changed during authoritative refresh");

  receptionQueueHasBooking = true;
  await page.getByRole("button", { name: "Refresh", exact: true }).click();
  await page.locator(`[data-booking-id="${bookingA.id}"]`).waitFor();
  await page.locator(`[data-booking-id="${bookingB.id}"]`).waitFor();
  await page.locator(`[data-booking-id="${bookingA.id}"]`).click();
  receptionQueueHasBooking = false;
  failReceptionDetail = true;
  await page.getByRole("button", { name: "Refresh", exact: true }).click();
  await page.getByRole("alert").filter({ hasText: "Synthetic detail read failure" }).waitFor();
  await page.getByRole("heading", { name: "Account A · Invoice" }).waitFor();
  await page.getByRole("button", { name: "Refresh", exact: true }).click();
  await page.getByRole("heading", { name: "Authoritatively Updated Account A" }).waitFor();

  receptionQueueHasBooking = true;
  await page.getByRole("button", { name: "Refresh", exact: true }).click();
  await page.locator(`[data-booking-id="${bookingA.id}"]`).waitFor();
  await page.locator(`[data-booking-id="${bookingB.id}"]`).waitFor();
  await page.locator(`[data-booking-id="${bookingA.id}"]`).click();
  receptionQueueHasBooking = false;
  gateReceptionDetail = true;
  await page.getByRole("button", { name: "Refresh", exact: true }).click();
  await receptionDetailStartedPromise;
  await page.locator(`[data-booking-id="${bookingB.id}"]`).click();
  await page.getByRole("heading", { name: "Account B", level: 3 }).waitFor();
  gateReceptionDetail = false;
  releaseReceptionDetail();
  await page.getByRole("heading", { name: "Account B", level: 3 }).waitFor();
  if (await page.getByRole("heading", { name: "Authoritatively Updated Account A" }).count()) throw new Error("late selected-booking detail response overwrote a newer booking selection");

  housekeepingScenario = true;
  await page.goto(`${base}/housekeeping`);
  await page.locator(".housekeeping-room-workspace").waitFor();
  await page.locator(".housekeeping-queue").getByRole("button", { name: /Room 712/ }).click();
  await page.getByRole("heading", { name: /Room 712/ }).waitFor();
  await page.getByRole("button", { name: "Finish cleaning" }).click();
  await page.getByRole("alert").waitFor();
  if (!(await page.getByRole("heading", { name: /Room 712/ }).count())) throw new Error("Housekeeping advanced selection after its post-mutation authoritative read failed");
  await page.getByRole("button", { name: "Refresh housekeeping board" }).click();
  await page.locator(".housekeeping-room-workspace").getByText("Available", { exact: true }).waitFor();
  if (!(await page.getByRole("heading", { name: /Room 712/ }).count())) throw new Error("Housekeeping explicit refresh lost the selected room context");
  return { mockRaceEvidence: true, rooms: "late pre-mutation read discarded after saved-price reread", billing: "late prior-booking snapshot discarded; invoice/payments/extra-charges subread failures clear snapshot, surface error, and recover", reception: "queue omission GET 200 updates, 404 clears, 500 retains selection/error and recovers; late detail cannot replace newer selection", housekeeping: "failed post-action reread exposed error, retained selected task; explicit refresh reconciled state", viewport: "1280x900", integrated: false };
})()
