async page => {
  const apiRoot = "http://127.0.0.1:8787/api/v1";
  const adminHeaders = {
    "content-type": "application/json",
    "x-local-access-subject": "source-user:14000000-0000-0000-0000-000000000001",
    "x-local-access-email": "ana-admin@migration.invalid",
    "x-hotel-id": "10000000-0000-0000-0000-000000000001",
  };
  async function adminPost(path, body) {
    const response = await fetch(`${apiRoot}${path}`, { method: "POST", headers: adminHeaders, body: JSON.stringify(body) });
    const payload = await response.json();
    if (!response.ok) throw new Error(`Admin fixture command ${path} failed ${response.status}: ${JSON.stringify(payload)}`);
    return payload;
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
    await target.getByRole("button", { name: /^Arrivals / }).click();
    await target.getByLabel("Search this shift").fill("Arrival");
  };

  const checkInStatuses = [];
  page.on("response", response => { if (response.url().endsWith("/bookings/z-priority/check-in")) checkInStatuses.push(response.status()); });
  await setupPage(page, 375);
  const rows = page.locator(".reception-queue-row");
  if ((await rows.first().getAttribute("data-booking-id")) !== "z-priority") throw new Error("Real board priority mismatch");
  await rows.first().click();
  const task = page.getByRole("dialog", { name: "Check in booking" });
  await task.waitFor();
  await enterCheckIn(task);
  await task.getByText("Room ready for arrival", { exact: true }).waitFor();
  await page.screenshot({ path: "output/playwright/p0-1-integrated-mobile-task.png" });

  // Another actor opens real BLOCKING maintenance after the receptionist's preview.
  const opened = await adminPost("/housekeeping/p01-room-a/maintenance", { priority: "HIGH", impact: "BLOCKING", reason: "Electrical hazard found during arrival", assigned_to: "ops" });
  await task.getByRole("button", { name: "Next step" }).click();
  await task.getByRole("button", { name: "Complete check-in" }).click();
  await task.getByRole("alert").getByText("The booking or room changed").waitFor();
  await task.getByText("Blocking maintenance: check-in cannot continue").waitFor();
  if (await task.getByRole("button", { name: "Next step" }).isEnabled()) throw new Error("Stale room allowed retry");
  await page.screenshot({ path: "output/playwright/p0-1-integrated-mobile-conflict.png" });

  await adminPost(`/housekeeping/p01-room-a/maintenance/${opened.id}/resolve`, { resolution_note: "Electrical hazard repaired and inspected" });
  await adminPost("/housekeeping/p01-room-a/start", {});
  await adminPost("/housekeeping/p01-room-a/finish", {});
  await task.getByRole("button", { name: "Refresh status" }).click();
  await task.getByRole("button", { name: "Next step" }).click();
  await task.getByRole("button", { name: "Complete check-in" }).click();
  await task.waitFor({ state: "hidden" });
  if (checkInStatuses.join(",") !== "409,200") throw new Error(`Expected one real 409 then success: ${checkInStatuses}`);
  if ((await page.locator(".reception-queue-row.selected").getAttribute("data-booking-id")) !== "a-next") throw new Error("Real refresh selected wrong next case");
  await page.waitForFunction(() => document.activeElement?.getAttribute("data-booking-id") === "a-next");
  if (new URL(page.url()).searchParams.get("booking_id") !== "a-next" || new URL(page.url()).searchParams.has("task")) throw new Error("Mobile URL did not follow the authoritative next case");
  if ((await page.getByLabel("Search this shift").inputValue()) !== "Arrival") throw new Error("Mobile search context lost");
  await page.screenshot({ path: "output/playwright/p0-1-integrated-mobile-success.png", fullPage: true });

  const desktop = await page.context().browser().newPage();
  try {
    await setupPage(desktop, 1280);
    await desktop.locator('[data-booking-id="a-next"]').click();
    const desktopTask = desktop.getByRole("dialog", { name: "Check in booking" });
    await desktopTask.waitFor();
    await enterCheckIn(desktopTask);
    await desktopTask.getByText("Maintenance advisory").waitFor();
    await desktop.screenshot({ path: "output/playwright/p0-1-integrated-desktop-task.png" });
    await desktopTask.getByRole("button", { name: "Next step" }).click();
    await desktopTask.getByRole("button", { name: "Complete check-in" }).click();
    await desktopTask.waitFor({ state: "hidden" });
    if ((await desktop.locator(".reception-queue-row.selected").getAttribute("data-booking-id")) !== "m-blocked") throw new Error("Desktop next case did not follow server priority");
    await desktop.locator('[data-booking-id="m-blocked"]').click();
    await enterCheckIn(desktopTask);
    await desktopTask.getByText("Blocking maintenance: check-in cannot continue").waitFor();
    if (await desktopTask.getByRole("button", { name: "Next step" }).isEnabled()) throw new Error("Real BLOCKING case allowed check-in");
    await desktop.screenshot({ path: "output/playwright/p0-1-integrated-desktop-blocked.png" });
  } finally { await desktop.close(); }
  console.log("P0.1 INTEGRATED browser PASS: real Worker/D1 mobile 409→repair→success, desktop NON_BLOCKING success, BLOCKING guard, next priority");
}
