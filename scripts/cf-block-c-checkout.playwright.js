async page => {
  const consoleErrors = [];
  const pageErrors = [];
  page.on("console", message => { if (message.type() === "error") consoleErrors.push(message.text()); });
  page.on("pageerror", error => pageErrors.push(error.message));
  await page.addInitScript(() => {
    try {
      localStorage.setItem("hms.locale", "en");
      localStorage.setItem("hms-local-acceptance-profile", "0");
    } catch { /* initial about:blank has an opaque origin during browser Back traversal */ }
  });
  await page.context().route("**/api/v1/**", route => {
    const source = new URL(route.request().url());
    return route.continue({ url: `http://127.0.0.1:8787${source.pathname}${source.search}` });
  });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("http://127.0.0.1:4176/bookings?lane=in-house&q=Next&booking_id=a-next&task=checkout");
  const task = page.locator('form[aria-label="Checkout"]');
  await task.waitFor();
  if (!(await task.locator("h4").first().evaluate(element => element === document.activeElement))) throw new Error("Checkout deep-linked task did not receive initial keyboard focus");
  const context = await page.evaluate(async () => {
    const headers = { "x-local-access-subject": "source-user:14000000-0000-0000-0000-000000000001", "x-local-access-email": "ana-admin@migration.invalid", "x-hotel-id": "10000000-0000-0000-0000-000000000001" };
    const [authResponse, boardResponse] = await Promise.all([fetch("/api/v1/auth/me", { headers }), fetch("/api/v1/front-desk/board", { headers })]);
    return { auth: await authResponse.json(), board: await boardResponse.json() };
  });
  if (!context.auth.capabilities.hotel.includes("bookings.checkout.override")) throw new Error("local Admin fixture lacks the existing server-owned checkout override capability");
  if (context.board.items.find(item => item.booking.id === "a-next")?.booking.status !== "CheckedIn") throw new Error("checkout deep link did not restore the authoritative checked-in Booking");
  const policy = task.locator('select[name="policy"]');
  if (!(await policy.locator('option[value="pending-approved"]').count())) throw new Error("capability-authorized pending settlement policy is not available in the task");
  const responsiveEvidence = [];
  for (const [width, height, label] of [[1280, 900, "WIDE"], [1280, 600, "WIDE reduced-height"], [900, 700, "COMPACT"], [390, 844, "NARROW"], [844, 390, "mobile landscape"]]) {
    await page.setViewportSize({ width, height });
    const action = task.getByRole("button", { name: "Complete checkout" });
    await action.scrollIntoViewIfNeeded();
    const geometry = await page.evaluate(() => {
      const content = document.querySelector(".app-content");
      const queue = document.querySelector(".reception-queue-panel");
      const action = document.querySelector('form[aria-label="Checkout"] button:not([type="button"])');
      const rect = action?.getBoundingClientRect();
      return { viewport: [innerWidth, innerHeight], documentWidth: document.documentElement.scrollWidth, contentWidth: content?.scrollWidth ?? 0, queueVisible: !!queue?.getClientRects().length, action: rect && { top: rect.top, bottom: rect.bottom } };
    });
    if (!(await action.isVisible()) || geometry.documentWidth > width || geometry.contentWidth > width) throw new Error(`${label} checkout task/CTA is unreachable or overflows: ${JSON.stringify(geometry)}`);
    if (width <= 900 && (geometry.queueVisible || !geometry.action || geometry.action.bottom > height)) throw new Error(`${label} did not present a reachable focused mobile task: ${JSON.stringify(geometry)}`);
    responsiveEvidence.push({ label, geometry });
    await page.screenshot({ path: `output/playwright/block-c-checkout-${width}x${height}.png`, fullPage: true });
  }
  await page.setViewportSize({ width: 1280, height: 900 });
  const reference = task.locator('input[name="reference"]');
  await reference.fill("discard-this-checkout-draft");
  await task.getByRole("button", { name: "Return to case" }).click();
  const discardDialog = page.getByRole("alertdialog", { name: "Discard changes?" });
  await discardDialog.getByRole("button", { name: "Keep editing" }).click();
  if (await reference.inputValue() !== "discard-this-checkout-draft") throw new Error("keeping the checkout draft did not preserve its reference");
  await task.getByRole("button", { name: "Return to case" }).click();
  await page.getByRole("alertdialog", { name: "Discard changes?" }).getByRole("button", { name: "Discard changes" }).click();
  await task.waitFor({ state: "hidden" });
  const caseUrl = new URL(page.url());
  caseUrl.searchParams.delete("task");
  await page.goto(caseUrl.toString());
  await page.getByRole("button", { name: "Next action: checkout" }).waitFor();
  const preTaskUrl = page.url();
  await page.getByRole("button", { name: "Next action: checkout" }).click();
  await task.waitFor();
  if (!(await task.locator("h4").first().evaluate(element => element === document.activeElement))) throw new Error("Checkout task opened from its Case without receiving initial focus");
  await task.getByRole("button", { name: "Return to case" }).click();
  await task.waitFor({ state: "hidden" });
  await page.waitForFunction(expected => location.href === expected, preTaskUrl);
  await page.goBack();
  if (new URL(page.url()).searchParams.get("task") === "checkout") throw new Error("Browser Back reopened the task after it had been cancelled");
  await page.goForward();
  if (new URL(page.url()).searchParams.get("task") !== null) throw new Error("Browser Forward restored a stale cancelled task entry");
  const checkoutUrl = new URL(page.url());
  checkoutUrl.searchParams.set("task", "checkout");
  await page.goto(checkoutUrl.toString());
  await task.waitFor();
  if (!(await task.locator("h4").first().evaluate(element => element === document.activeElement))) throw new Error("Checkout deep-linked task did not receive initial focus after reload");
  await policy.selectOption("pending-approved");
  await task.locator('input[name="reference"]').fill("synthetic-approved-001");
  await task.getByLabel("Charges reviewed").check();
  await task.getByLabel("Room release confirmed").check();
  await task.getByLabel("Housekeeping handoff confirmed").check();
  const formValidity = await task.evaluate(form => form.checkValidity());
  if (!formValidity) throw new Error(`checkout task did not accept its complete authorized input: ${await task.innerText()}`);
  const checkoutResponsePromise = page.waitForResponse(response => response.url().endsWith("/api/v1/bookings/a-next/check-out") && response.request().method() === "POST");
  const boardRefreshPromise = page.waitForResponse(response => response.url().endsWith("/api/v1/front-desk/board") && response.request().method() === "GET");
  await task.getByRole("button", { name: "Complete checkout" }).click();
  const checkoutResponse = await checkoutResponsePromise;
  if (checkoutResponse.status() !== 200) throw new Error(`local Worker checkout returned ${checkoutResponse.status()}: ${await checkoutResponse.text()}`);
  const refreshedBoard = await boardRefreshPromise;
  const refreshed = (await refreshedBoard.json()).items.find(item => item.booking.id === "a-next")?.booking;
  if (refreshed?.status !== "CheckedOut") throw new Error(`UI did not reconcile to authoritative CheckedOut state: ${JSON.stringify(refreshed)}`);
  await task.waitFor({ state: "hidden" });
  const roomRead = await page.evaluate(async () => {
    const headers = { "x-local-access-subject": "source-user:14000000-0000-0000-0000-000000000001", "x-local-access-email": "ana-admin@migration.invalid", "x-hotel-id": "10000000-0000-0000-0000-000000000001" };
    const [roomsResponse, invoiceResponse] = await Promise.all([fetch("/api/v1/rooms", { headers }), fetch("/api/v1/bookings/a-next/invoice", { headers })]);
    return { roomsStatus: roomsResponse.status, rooms: await roomsResponse.json(), invoiceStatus: invoiceResponse.status, invoice: await invoiceResponse.json() };
  });
  const room = roomRead.rooms.find(item => item.id === "p01-room-b");
  if (roomRead.roomsStatus !== 200 || room?.operational_state?.occupancy !== "VACANT"
    || room?.operational_state?.housekeeping !== "DIRTY"
    || room?.operational_state?.maintenanceImpact !== "NON_BLOCKING"
    || room?.operational_state?.serviceState !== "IN_SERVICE") throw new Error(`checkout changed an unrelated room dimension or failed the room handoff: ${JSON.stringify(room)}`);
  if (roomRead.invoiceStatus !== 200 || roomRead.invoice.amount_cents !== 36000 || roomRead.invoice.paid_amount_cents !== 0) throw new Error(`checkout fabricated or mutated settlement truth: ${JSON.stringify(roomRead.invoice)}`);
  const url = new URL(page.url());
  if (url.searchParams.get("lane") !== "in-house" || url.searchParams.get("q") !== "Next" || url.searchParams.get("booking_id") !== "a-next" || url.searchParams.has("task")) throw new Error(`checkout return lost Reception context: ${page.url()}`);
  if (consoleErrors.length || pageErrors.length) throw new Error(`checkout task browser errors: ${JSON.stringify({ consoleErrors, pageErrors })}`);
  await page.screenshot({ path: "output/playwright/block-c-checkout-wide-success.png", fullPage: true });
  return { workerMutation: checkoutResponse.status(), authoritativeStatus: refreshed.status, room: room.operational_state, invoice: { amount_cents: roomRead.invoice.amount_cents, paid_amount_cents: roomRead.invoice.paid_amount_cents }, context: { lane: url.searchParams.get("lane"), search: url.searchParams.get("q"), booking_id: url.searchParams.get("booking_id"), task: null }, responsiveEvidence, consoleErrors, pageErrors };
}
