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
    await target.goto("http://127.0.0.1:4176/bookings");
    await target.waitForFunction(() => document.querySelector(".header-context")?.textContent?.includes("Hotel Norte") === true && !document.querySelector(".header-context")?.textContent?.includes("Loading"));
    // The browser CLI can reuse a context whose in-memory locale predates the
    // init script. Set the app-owned selector after hydration so role names
    // used by this runner are deterministic.
    await target.locator(".language-selector select").selectOption("en");
    await target.waitForFunction(() => document.documentElement.lang === "en");
    await target.getByRole("button", { name: /^Arrivals / }).click();
    await target.getByLabel("Search this shift").fill("Arrival");
    await target.locator(".reception-queue-row").first().waitFor();
  };

  const checkInStatuses = [];
  const checkInRequests = [];
  const recoveryResponses = [];
  page.on("request", request => { if (request.url().endsWith("/bookings/z-priority/check-in")) checkInRequests.push(request); });
  page.on("response", response => { if (response.url().endsWith("/bookings/z-priority/check-in")) checkInStatuses.push(response.status()); });
  page.on("response", response => { if (/\/api\/v1\/(front-desk\/board|rooms|bookings\/z-priority\/invoice)$/.test(new URL(response.url()).pathname)) recoveryResponses.push({ path: new URL(response.url()).pathname, status: response.status() }); });
  await setupPage(page, 375);
  const desktop = await page.context().browser().newPage();
  await setupPage(desktop, 1280);
  await desktop.locator(".reception-queue-row").first().click();
  const menuButton = desktop.locator(".reception-more-actions");
  await menuButton.click();
  const actions = desktop.locator(".ui-dropdown-menu");
  const menuItems = actions.locator(".ui-dropdown-menu-item");
  await menuItems.first().waitFor();
  if (!/edit|editar/i.test(await menuItems.first().innerText())) throw new Error("First Reception action is not the existing Edit task");
  await desktop.keyboard.press("ArrowDown");
  await desktop.keyboard.press("ArrowUp");
  await desktop.keyboard.press("Tab");
  if (await actions.count()) throw new Error("Dropdown menu remained open after Tab");
  if (await menuButton.evaluate(button => button === document.activeElement) || await actions.count()) throw new Error("Dropdown Tab did not advance focus out of the menu");
  await menuButton.click();
  await desktop.keyboard.press("Enter");
  const editTask = desktop.locator("form.reception-task-form").filter({ has: desktop.locator("h4") });
  await editTask.waitFor();
  if (!/edit|editar/i.test(await editTask.getAttribute("aria-label") ?? "")) throw new Error("Keyboard menu activation did not open the existing Edit task");
  await editTask.locator("footer button[type=button]").first().click();
  await editTask.waitFor({ state: "detached" });

  await page.screenshot({ path: "output/playwright/ux-ui-checkin-mobile-reception.png" });
  const rows = page.locator(".reception-queue-row");
  if ((await rows.first().getAttribute("data-booking-id")) !== "z-priority") throw new Error("Real board priority mismatch");
  await rows.first().click();
  await page.locator(".reception-checkin-trigger").click();
  const task = page.getByRole("dialog", { name: "Next action: check-in verification" });
  await task.waitFor();
  if (!(await task.evaluate(element => element.classList.contains("ui-drawer-popup") && !element.classList.contains("ui-dialog-content")))) throw new Error("Mobile check-in did not select the Drawer surface");
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
  await page.keyboard.press("Tab");
  if (!(await task.evaluate(element => element.contains(document.activeElement)))) throw new Error("Mobile Drawer Tab navigation escaped the task");
  await page.keyboard.press("Escape");
  await task.waitFor({ state: "hidden" });
  await page.waitForFunction(() => document.activeElement?.classList.contains("reception-case-title"));
  if (new URL(page.url()).searchParams.has("task")) throw new Error(`Escape did not clear the focused check-in task route: ${page.url()}`);
  await page.locator(".reception-checkin-trigger").click();
  await task.waitFor();
  await page.waitForFunction(() => document.activeElement?.classList.contains("checkin-step-heading"));
  await enterCheckIn(task);
  await task.getByText("Room ready for arrival", { exact: true }).waitFor();
  await page.screenshot({ path: "output/playwright/ux-ui-checkin-mobile-drawer.png" });

  // Another actor opens real BLOCKING maintenance after the receptionist's preview.
  const opened = await adminPost("/housekeeping/p01-room-a/maintenance", { priority: "HIGH", impact: "BLOCKING", reason: "Electrical hazard found during arrival", assigned_to: "ops" });
  await task.getByRole("button", { name: "Next step" }).click();
  await task.getByRole("button", { name: "Complete check-in" }).evaluate(button => { (button).click(); (button).click(); });
  try { await task.getByRole("alert").getByText("The booking or room changed").waitFor({ timeout: 10000 }); }
  catch (error) { throw new Error(`Canonical 409 recovery did not reach its visible alert: responses=${JSON.stringify(recoveryResponses)} body=${(await page.locator("body").innerText()).slice(-1600)} url=${page.url()}; ${error}`); }
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
  await task.getByRole("button", { name: "Refresh status" }).click();
  await task.getByRole("button", { name: "Next step" }).click();
  await task.getByRole("button", { name: "Complete check-in" }).click();
  await task.waitFor({ state: "hidden" });
  if (checkInStatuses.join(",") !== "409,200") throw new Error(`Expected one real 409 then success: ${checkInStatuses}`);
  if (checkInRequests.length !== 2) throw new Error(`Expected one initial 409 request and one successful retry, got ${checkInRequests.length}`);
  if ((await page.locator(".reception-queue-row.selected").getAttribute("data-booking-id")) !== "a-next") throw new Error("Real refresh selected wrong next case");
  await page.waitForFunction(() => document.activeElement?.classList.contains("reception-case-title"));
  const mobileUrl = await page.evaluate(() => { const url = new URL(location.href); return { booking: url.searchParams.get("booking_id"), task: url.searchParams.has("task"), lane: url.searchParams.get("lane") }; });
  if (mobileUrl.booking !== "a-next" || mobileUrl.task || mobileUrl.lane !== "arrivals") throw new Error("Mobile URL did not preserve arrival lane and authoritative next case");
  if ((await page.getByLabel("Search this shift").inputValue()) !== "Arrival") throw new Error("Mobile search context lost");
  await page.screenshot({ path: "output/playwright/ux-ui-checkin-mobile-success-return.png" });
  await page.locator(".reception-checkin-trigger").click();
  await enterCheckIn(task);
  await task.getByText("Maintenance advisory").waitFor();
  await page.screenshot({ path: "output/playwright/ux-ui-checkin-mobile-nonblocking-advisory.png" });

  try {
    await desktop.screenshot({ path: "output/playwright/ux-ui-checkin-desktop-reception.png" });
    await desktop.locator('[data-booking-id="a-next"]').click();
    await desktop.locator(".reception-checkin-trigger").click();
    const desktopTask = desktop.getByRole("dialog", { name: "Next action: check-in verification" });
    await desktopTask.waitFor();
    const desktopBounds = await desktopTask.evaluate(element => { const rect = element.getBoundingClientRect(); const header = element.querySelector(".checkin-task-header").getBoundingClientRect(); const footer = element.querySelector(".checkin-task-actions").getBoundingClientRect(); const body = element.querySelector(".checkin-task-body"); return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, width: rect.width, height: rect.height, viewport: innerWidth, viewportHeight: innerHeight, centerX: rect.left + rect.width / 2, centerY: rect.top + rect.height / 2, headerTop: header.top, footerBottom: footer.bottom, bodyOverflow: getComputedStyle(body).overflowY, backdrop: getComputedStyle(element, "::backdrop").backgroundColor, dialogSlot: element.getAttribute("data-slot"), side: element.getAttribute("data-side"), classes: element.className }; });
    if (Math.abs(desktopBounds.centerX - desktopBounds.viewport / 2) > 1 || Math.abs(desktopBounds.centerY - desktopBounds.viewportHeight / 2) > 1 || desktopBounds.width < 560 || desktopBounds.width > 760 || desktopBounds.height >= desktopBounds.viewportHeight || desktopBounds.height < 600 || desktopBounds.bodyOverflow !== "auto" || desktopBounds.headerTop <= desktopBounds.top || desktopBounds.footerBottom >= desktopBounds.bottom || desktopBounds.backdrop === "rgba(0, 0, 0, 0)") throw new Error(`Desktop check-in Dialog is not centered, bounded, layered, and internally scrollable: ${JSON.stringify(desktopBounds)}`);
    if (desktopBounds.dialogSlot !== "dialog-content" || desktopBounds.side !== null || !desktopBounds.classes.includes("ui-dialog-content")) throw new Error(`Desktop Dialog retained Sheet semantics: ${JSON.stringify(desktopBounds)}`);
    const receptionHeadingBounds = await desktop.getByRole("heading", { name: "Reception", exact: true }).evaluate(element => { const rect = element.getBoundingClientRect(); return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, width: rect.width, height: rect.height, visible: getComputedStyle(element).visibility !== "hidden" && getComputedStyle(element).display !== "none" }; });
    const receptionHeadingOverlapped = receptionHeadingBounds.right > desktopBounds.left && receptionHeadingBounds.left < desktopBounds.right && receptionHeadingBounds.bottom > desktopBounds.top && receptionHeadingBounds.top < desktopBounds.bottom;
    if (!receptionHeadingBounds.visible || receptionHeadingBounds.width <= 0 || receptionHeadingBounds.height <= 0 || receptionHeadingOverlapped) throw new Error(`Reception page context is not visibly present outside the centered Dialog: ${JSON.stringify({ receptionHeadingBounds, desktopBounds })}`);
    await desktop.screenshot({ path: "output/playwright/ux-ui-checkin-desktop-dialog.png" });
    await desktop.setViewportSize({ width: 1280, height: 520 });
    const compactDialogScroll = await desktopTask.evaluate(element => { const header = element.querySelector(".checkin-task-header").getBoundingClientRect(); const footer = element.querySelector(".checkin-task-actions").getBoundingClientRect(); const body = element.querySelector(".checkin-task-body"); const dialog = element.getBoundingClientRect(); body.scrollTop = body.scrollHeight; return { scrollTop: body.scrollTop, scrollRange: body.scrollHeight - body.clientHeight, headerTop: header.top, dialogTop: dialog.top, footerBottom: footer.bottom, dialogBottom: dialog.bottom, viewportHeight: innerHeight }; });
    if (compactDialogScroll.scrollRange <= 0 || compactDialogScroll.scrollTop <= 0 || compactDialogScroll.headerTop <= compactDialogScroll.dialogTop || Math.abs(compactDialogScroll.footerBottom - compactDialogScroll.dialogBottom) > 1 || compactDialogScroll.footerBottom > compactDialogScroll.viewportHeight) throw new Error(`Desktop Dialog body did not scroll independently with fixed header/footer/CTA: ${JSON.stringify(compactDialogScroll)}`);
    await desktop.setViewportSize({ width: 1280, height: 900 });
    await desktopTask.locator(".checkin-task-body").evaluate(body => { body.scrollTop = 0; });
    await desktop.waitForFunction(() => document.activeElement?.classList.contains("checkin-step-heading"));
    await desktop.keyboard.press("Tab");
    if (!(await desktopTask.evaluate(element => element.contains(document.activeElement)))) throw new Error("Desktop Dialog Tab navigation escaped the task");
    await desktop.keyboard.press("Shift+Tab");
    if (!(await desktopTask.evaluate(element => element.contains(document.activeElement)))) throw new Error("Desktop Dialog reverse Tab navigation escaped the task");
    await desktop.keyboard.press("Escape");
    await desktopTask.waitFor({ state: "hidden" });
    await desktop.waitForFunction(() => document.activeElement?.classList.contains("reception-case-title"));
    await desktop.locator('[data-booking-id="a-next"]').click();
    await desktop.locator(".reception-checkin-trigger").click();
    await desktopTask.waitFor();
    await enterCheckIn(desktopTask);
    await desktopTask.getByText("Maintenance advisory").waitFor();
    await desktop.screenshot({ path: "output/playwright/ux-ui-checkin-desktop-nonblocking-advisory.png" });
    await adminPost("/housekeeping/p01-room-b/maintenance/p01-advisory/resolve", { resolution_note: "Advisory inspection completed before the concurrent blocking report" });
    const desktopOpened = await adminPost("/housekeeping/p01-room-b/maintenance", { priority: "HIGH", impact: "BLOCKING", reason: "Electrical hazard found during arrival", assigned_to: "ops" });
    await desktopTask.getByRole("button", { name: "Next step" }).click();
    await desktopTask.getByRole("button", { name: "Complete check-in" }).click();
    await desktopTask.getByRole("alert").getByText("The booking or room changed").waitFor();
    await desktopTask.getByText("Blocking maintenance: check-in cannot continue").waitFor();
    await desktop.screenshot({ path: "output/playwright/ux-ui-checkin-desktop-conflict.png" });
    await adminPost(`/housekeeping/p01-room-b/maintenance/${desktopOpened.id}/resolve`, { resolution_note: "Electrical hazard repaired and inspected" });
    await desktopTask.getByRole("button", { name: "Refresh status" }).click();
    await desktopTask.getByRole("button", { name: "Next step" }).click();
    await desktopTask.getByRole("button", { name: "Complete check-in" }).click();
    await desktopTask.waitFor({ state: "hidden" });
    await desktop.screenshot({ path: "output/playwright/ux-ui-checkin-desktop-success-return.png" });
    if ((await desktop.locator(".reception-queue-row.selected").getAttribute("data-booking-id")) !== "m-blocked") throw new Error("Desktop next case did not follow server priority");
    await desktop.locator('[data-booking-id="m-blocked"]').click();
    await desktop.locator(".reception-checkin-trigger").click();
    await desktopTask.waitFor();
    await enterCheckIn(desktopTask);
    await desktopTask.getByText("Blocking maintenance: check-in cannot continue").waitFor();
    if (await desktopTask.getByRole("button", { name: "Next step" }).isEnabled()) throw new Error("Real BLOCKING case allowed check-in");
    await desktop.screenshot({ path: "output/playwright/ux-ui-checkin-desktop-blocking.png" });
  } finally { await desktop.close(); }
  console.log("P0.1 INTEGRATED browser PASS: real Worker/D1 mobile 409→repair→success, desktop NON_BLOCKING success, BLOCKING guard, next priority");
})()
