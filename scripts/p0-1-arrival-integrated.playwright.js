page => (async () => {
  const apiRoot = "/api/v1";
  const adminHeaders = {
    "content-type": "application/json",
    "x-local-access-subject": "source-user:14000000-0000-0000-0000-000000000001",
    "x-local-access-email": "ana-admin@migration.invalid",
    "x-hotel-id": "10000000-0000-0000-0000-000000000001",
  };
  async function adminPost(path, body) {
    return page.evaluate(async ({ path, body, apiRoot, adminHeaders }) => {
      const response = await fetch(`${apiRoot}${path}`, { method: "POST", headers: adminHeaders, body: JSON.stringify(body) });
      const payload = await response.json();
      if (!response.ok) throw new Error(`Admin fixture command ${path} failed ${response.status}: ${JSON.stringify(payload)}`);
      return payload;
    }, { path, body, apiRoot, adminHeaders });
  }
  async function enterCheckIn(dialog) {
    await dialog.getByLabel("Final guest count").fill("2");
    await dialog.getByLabel("Document verified").check();
    await dialog.getByRole("button", { name: "Next step" }).click();
    await dialog.getByLabel("Contact confirmed").check();
    await dialog.getByLabel("Stay confirmed").check();
    await dialog.getByRole("button", { name: "Next step" }).click();
  }
  const setupPage = async (target, width) => {
    await target.addInitScript(() => { localStorage.setItem("hms.locale", "en"); localStorage.setItem("hms-local-acceptance-profile", "1"); });
    await target.setViewportSize({ width, height: width < 500 ? 812 : 900 });
    await target.goto("http://127.0.0.1:4174/bookings");
    await target.waitForFunction(() => document.querySelector(".header-context")?.textContent?.includes("Hotel Norte") === true && !document.querySelector(".header-context")?.textContent?.includes("Loading"));
    await target.getByRole("button", { name: /^Arrivals / }).click();
    await target.getByLabel("Search this shift").fill("Arrival");
    await target.locator(".reception-queue-row").first().waitFor();
  };

  const checkInStatuses = [];
  const checkInRequests = [];
  page.on("request", request => { if (request.url().endsWith("/bookings/z-priority/check-in")) checkInRequests.push(request); });
  page.on("response", response => { if (response.url().endsWith("/bookings/z-priority/check-in")) checkInStatuses.push(response.status()); });
  await setupPage(page, 375);
  await page.screenshot({ path: "output/playwright/ux-ui-checkin-mobile-reception.png" });
  const rows = page.locator(".reception-queue-row");
  if ((await rows.first().getAttribute("data-booking-id")) !== "z-priority") throw new Error("Real board priority mismatch");
  await rows.first().click();
  const task = page.getByRole("dialog", { name: "Next action: check-in verification" });
  await task.waitFor();
  const mobileBounds = await task.evaluate(element => { const rect = element.getBoundingClientRect(); return { left: rect.left, right: rect.right, width: rect.width, viewport: innerWidth }; });
  if (mobileBounds.left < 0 || Math.abs(mobileBounds.width - mobileBounds.viewport) > 1) throw new Error(`Mobile check-in is not full-screen: ${JSON.stringify(mobileBounds)}`);
  if ((await task.getAttribute("aria-labelledby")) !== "checkin-task-title" || (await task.getAttribute("aria-describedby")) !== "checkin-task-description") throw new Error("Mobile task title/description are not programmatically associated");
  const mobileLayout = await task.evaluate(element => {
    const headerElement = element.querySelector(".checkin-task-header");
    const body = element.querySelector(".checkin-task-body");
    const footerElement = element.querySelector(".checkin-task-actions");
    const ctaElement = element.querySelector(".checkin-task-actions button[type=submit]");
    if (!headerElement || !body || !footerElement || !ctaElement) throw new Error("Check-in layout elements missing");
    const header = headerElement.getBoundingClientRect();
    const footer = footerElement.getBoundingClientRect();
    const cta = ctaElement.getBoundingClientRect();
    return { headerTop: header.top, footerBottom: footer.bottom, bodyOverflow: getComputedStyle(body).overflowY, ctaHeight: cta.height, viewport: innerHeight };
  });
  if (mobileLayout.headerTop !== 0 || Math.abs(mobileLayout.footerBottom - mobileLayout.viewport) > 1 || mobileLayout.bodyOverflow !== "auto" || mobileLayout.ctaHeight < 44) throw new Error(`Mobile task layout is not a full-height scrollable task: ${JSON.stringify(mobileLayout)}`);
  await page.waitForFunction(() => document.activeElement?.classList.contains("checkin-step-heading"));
  await enterCheckIn(task);
  await task.getByText("Room ready for arrival", { exact: true }).waitFor();
  await page.screenshot({ path: "output/playwright/ux-ui-checkin-mobile-drawer.png" });

  // Another actor opens real BLOCKING maintenance after the receptionist's preview.
  const opened = await adminPost("/housekeeping/p01-room-a/maintenance", { priority: "HIGH", impact: "BLOCKING", reason: "Electrical hazard found during arrival", assigned_to: "ops" });
  await task.getByRole("button", { name: "Next step" }).click();
  await task.getByRole("button", { name: "Complete check-in" }).evaluate(button => { (button).click(); (button).click(); });
  await task.getByRole("alert").getByText("The booking or room changed").waitFor();
  await task.getByText("Blocking maintenance: check-in cannot continue").waitFor();
  if (await task.getByRole("button", { name: "Next step" }).isEnabled()) throw new Error("Stale room allowed retry");
  const conflictSnapshot = await page.evaluate(async () => {
    const headers = { "x-local-access-subject": "source-user:14000000-0000-0000-0000-000000000002", "x-local-access-email": "leo-reception@migration.invalid", "x-hotel-id": "10000000-0000-0000-0000-000000000001" };
    const read = async path => { const response = await fetch(path, { headers }); return { status: response.status, body: await response.json() }; };
    const [bookings, rooms, invoice, payments] = await Promise.all([read("/api/v1/bookings?limit=100"), read("/api/v1/rooms"), read("/api/v1/bookings/z-priority/invoice"), read("/api/v1/bookings/z-priority/payments")]);
    return { bookings, rooms, invoice, payments };
  });
  if ([conflictSnapshot.bookings, conflictSnapshot.rooms, conflictSnapshot.invoice, conflictSnapshot.payments].some(result => result.status !== 200)) throw new Error(`Reception could not read the authoritative conflict snapshot: ${JSON.stringify(conflictSnapshot)}`);
  const conflictBooking = conflictSnapshot.bookings.body.find(item => item.id === "z-priority");
  const conflictRoom = conflictSnapshot.rooms.body.find(item => item.id === "p01-room-a");
  if (conflictBooking?.status !== "Confirmed" || conflictBooking?.room_id !== "p01-room-a" || conflictBooking?.total_cents !== 40000 || conflictRoom?.status !== "Maintenance" || conflictSnapshot.invoice.body?.amount_cents !== 40000 || conflictSnapshot.invoice.body?.paid_amount_cents !== 0 || conflictSnapshot.payments.body.length !== 0) throw new Error(`409 changed authoritative booking/billing state before retry: ${JSON.stringify(conflictSnapshot)}`);
  const mobileSummary = await task.locator(".checkin-status-summary").evaluate(element => {
    const bounds = element.getBoundingClientRect();
    const headerBounds = element.closest(".checkin-task").querySelector(".checkin-task-header").getBoundingClientRect();
    return { visible: bounds.top >= headerBounds.bottom && bounds.bottom <= innerHeight, top: bounds.top, headerBottom: headerBounds.bottom };
  });
  if (!mobileSummary.visible) throw new Error(`Mobile conflict summary is clipped by the stable header: ${JSON.stringify(mobileSummary)}`);
  await page.screenshot({ path: "output/playwright/ux-ui-checkin-mobile-blocking-conflict.png" });
  await task.locator(".checkin-task-body").evaluate(body => { body.scrollTop = body.scrollHeight; });
  const visibleBlocker = await task.locator(".checkin-readiness").evaluate(element => {
    const bounds = element.getBoundingClientRect();
    const bodyBounds = element.closest(".checkin-task-body").getBoundingClientRect();
    const blockingText = element.querySelector(".checkin-not-ready").getBoundingClientRect();
    return { visible: bounds.top >= bodyBounds.top && bounds.bottom <= bodyBounds.bottom, blockingTextVisible: blockingText.top >= bodyBounds.top && blockingText.bottom <= bodyBounds.bottom, scrollTop: element.closest(".checkin-task-body").scrollTop };
  });
  if (!visibleBlocker.visible || !visibleBlocker.blockingTextVisible || visibleBlocker.scrollTop <= 0) throw new Error(`Mobile blocker details cannot be fully scrolled above the sticky CTA: ${JSON.stringify(visibleBlocker)}`);
  await page.screenshot({ path: "output/playwright/ux-ui-checkin-mobile-blocking-conflict-detail.png" });

  await adminPost(`/housekeeping/p01-room-a/maintenance/${opened.id}/resolve`, { resolution_note: "Electrical hazard repaired and inspected" });
  await adminPost("/housekeeping/p01-room-a/start", {});
  await adminPost("/housekeeping/p01-room-a/finish", {});
  await task.getByRole("button", { name: "Refresh status" }).click();
  await task.getByRole("button", { name: "Next step" }).click();
  await task.getByRole("button", { name: "Complete check-in" }).click();
  await task.waitFor({ state: "hidden" });
  if (checkInStatuses.join(",") !== "409,200") throw new Error(`Expected one real 409 then success: ${checkInStatuses}`);
  if (checkInRequests.length !== 2) throw new Error(`Expected one initial 409 request and one successful retry, got ${checkInRequests.length}`);
  if ((await page.locator(".reception-queue-row.selected").getAttribute("data-booking-id")) !== "a-next") throw new Error("Real refresh selected wrong next case");
  await page.waitForFunction(() => document.activeElement?.getAttribute("data-booking-id") === "a-next");
  const mobileUrl = await page.evaluate(() => { const url = new URL(location.href); return { booking: url.searchParams.get("booking_id"), task: url.searchParams.has("task"), lane: url.searchParams.get("lane") }; });
  if (mobileUrl.booking !== "a-next" || mobileUrl.task || mobileUrl.lane !== "arrivals") throw new Error("Mobile URL did not preserve arrival lane and authoritative next case");
  if ((await page.getByLabel("Search this shift").inputValue()) !== "Arrival") throw new Error("Mobile search context lost");
  await page.screenshot({ path: "output/playwright/ux-ui-checkin-mobile-success-return.png" });
  await page.locator('[data-booking-id="a-next"]').click();
  await enterCheckIn(task);
  await task.getByText("Maintenance advisory").waitFor();
  await page.screenshot({ path: "output/playwright/ux-ui-checkin-mobile-nonblocking-advisory.png" });

  const desktop = await page.context().browser().newPage();
  try {
    await setupPage(desktop, 1280);
    await desktop.screenshot({ path: "output/playwright/ux-ui-checkin-desktop-reception.png" });
    await desktop.locator('[data-booking-id="a-next"]').click();
    const desktopTask = desktop.getByRole("dialog", { name: "Next action: check-in verification" });
    await desktopTask.waitFor();
    const desktopBounds = await desktopTask.evaluate(element => { const rect = element.getBoundingClientRect(); return { left: rect.left, right: rect.right, width: rect.width, viewport: innerWidth }; });
    if (Math.abs(desktopBounds.right - desktopBounds.viewport) > 1 || desktopBounds.left < desktopBounds.viewport / 2) throw new Error(`Desktop Sheet is not anchored to the right: ${JSON.stringify(desktopBounds)}`);
    const queueBounds = await desktop.locator(".reception-queue-panel").evaluate(element => { const rect = element.getBoundingClientRect(); return { left: rect.left, right: rect.right, width: rect.width, display: getComputedStyle(element).display }; });
    if (queueBounds.display === "none" || queueBounds.width < 200 || queueBounds.left >= desktopBounds.left) throw new Error(`Reception queue is not retained beside the Sheet: ${JSON.stringify({ queueBounds, desktopBounds })}`);
    await desktop.waitForFunction(() => document.activeElement?.classList.contains("checkin-step-heading"));
    await desktop.keyboard.press("Escape");
    await desktopTask.waitFor({ state: "hidden" });
    await desktop.waitForFunction(() => document.activeElement?.getAttribute("data-booking-id") === "a-next");
    await desktop.getByRole("button", { name: "More actions" }).click();
    const actions = desktop.getByRole("menu", { name: "More actions" });
    await actions.getByRole("menuitem", { name: "Edit booking" }).waitFor();
    await desktop.keyboard.press("ArrowDown");
    await desktop.keyboard.press("ArrowUp");
    await desktop.keyboard.press("Tab");
    if (await actions.count()) throw new Error("Dropdown menu remained open after Tab");
    if (await desktop.getByRole("button", { name: "More actions" }).evaluate(button => button === document.activeElement) || await actions.count()) throw new Error("Dropdown Tab did not advance focus out of the menu");
    await desktop.getByRole("button", { name: "More actions" }).click();
    await desktop.keyboard.press("Enter");
    await desktop.getByRole("form", { name: "Edit booking" }).waitFor();
    await desktop.getByRole("button", { name: "More actions" }).click();
    await desktop.getByRole("menuitem", { name: "Close", exact: true }).click();
    await desktop.getByRole("form", { name: "Edit booking" }).waitFor({ state: "detached" });
    await desktop.locator(".reception-checkin-trigger").click();
    await desktopTask.waitFor();
    await enterCheckIn(desktopTask);
    await desktopTask.getByText("Maintenance advisory").waitFor();
    await desktop.screenshot({ path: "output/playwright/ux-ui-checkin-desktop-nonblocking-advisory.png" });
    await desktopTask.getByRole("button", { name: "Next step" }).click();
    await desktopTask.getByRole("button", { name: "Complete check-in" }).click();
    await desktopTask.waitFor({ state: "hidden" });
    await desktop.screenshot({ path: "output/playwright/ux-ui-checkin-desktop-success-return.png" });
    if ((await desktop.locator(".reception-queue-row.selected").getAttribute("data-booking-id")) !== "m-blocked") throw new Error("Desktop next case did not follow server priority");
    await desktop.locator('[data-booking-id="m-blocked"]').click();
    await enterCheckIn(desktopTask);
    await desktopTask.getByText("Blocking maintenance: check-in cannot continue").waitFor();
    if (await desktopTask.getByRole("button", { name: "Next step" }).isEnabled()) throw new Error("Real BLOCKING case allowed check-in");
    await desktop.screenshot({ path: "output/playwright/ux-ui-checkin-desktop-blocking.png" });
  } finally { await desktop.close(); }
  console.log("P0.1 INTEGRATED browser PASS: real Worker/D1 mobile 409→repair→success, desktop NON_BLOCKING success, BLOCKING guard, next priority");
})()
