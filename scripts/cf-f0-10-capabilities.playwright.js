(page) => (async () => {
  const hotelA = "10000000-0000-0000-0000-000000000001";
  const hotelB = "20000000-0000-0000-0000-000000000002";
  await page.addInitScript(() => {
    localStorage.setItem("hms.locale", "en");
    localStorage.setItem("hms-local-acceptance-profile", "0");
  });
  await page.setExtraHTTPHeaders({
    "x-local-access-subject": "source-user:14000000-0000-0000-0000-000000000001",
    "x-local-access-email": "ana-admin@migration.invalid",
    "x-hotel-id": hotelA,
  });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("http://127.0.0.1:4178/rooms");
  const profile = page.getByLabel("Profile");
  const roomWrite = page.getByRole("button", { name: "Manage rooms" });

  const adminContext = await page.evaluate(async () => (await fetch("/api/v1/auth/me")).json());
  if (adminContext.capabilities.hotel.includes("rooms.write") !== true
    || adminContext.capabilities.network.includes("saas.hotels.read") !== true) throw new Error("dual hotel/network context was not exposed from server authority");
  await roomWrite.waitFor({ state: "visible" });
  await page.screenshot({ path: "output/playwright/f0-10-capabilities-desktop-admin.png", fullPage: true });
  await page.goto("http://127.0.0.1:4178/guests");
  await page.locator(".guests-operational-workspace").waitFor();
  await page.locator(".guests-heading-actions > button").waitFor({ state: "visible" });
  await page.goto("http://127.0.0.1:4178/users");
  await page.locator(".users-operational .workspace-heading-actions > button").waitFor({ state: "visible" });

  const targetSubject = "source-user:14000000-0000-0000-0000-000000000002";
  const adminHeaders = {
    "x-local-access-subject": "source-user:14000000-0000-0000-0000-000000000001",
    "x-local-access-email": "ana-admin@migration.invalid",
    "x-hotel-id": hotelA,
    "content-type": "application/json",
  };
  const patchRole = async role => page.evaluate(async ({ subject, role, headers }) => {
    const response = await fetch(`/api/v1/users/${encodeURIComponent(subject)}/role`, {
      method: "PATCH", headers, body: JSON.stringify({ role }),
    });
    return { status: response.status, body: await response.json().catch(() => null) };
  }, { subject: targetSubject, role, headers: adminHeaders });

  const promoted = await patchRole("admin");
  if (promoted.status !== 200) throw new Error(`synthetic setup could not authorize target role: ${JSON.stringify(promoted)}`);
  await profile.selectOption("1");
  await page.setExtraHTTPHeaders({
    "x-local-access-subject": "source-user:14000000-0000-0000-0000-000000000002",
    "x-local-access-email": "leo-reception@migration.invalid",
    "x-hotel-id": hotelA,
  });
  await page.goto("http://127.0.0.1:4178/rooms");
  const beforeDowngrade = await page.evaluate(async () => (await fetch("/api/v1/auth/me")).json());
  if (beforeDowngrade.role !== "admin" || !beforeDowngrade.capabilities.hotel.includes("rooms.write")) throw new Error(`same target subject did not have server-confirmed room-write capability before downgrade: ${JSON.stringify(beforeDowngrade)}`);
  await roomWrite.waitFor({ state: "visible" });

  const allowedWrite = await page.evaluate(async () => {
    const response = await fetch("/api/v1/rooms", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ room_number: "F10-OK", room_type: "STANDARD", price_cents: 12000 }) });
    return { status: response.status, body: await response.json().catch(() => null) };
  });
  if (allowedWrite.status !== 201) throw new Error(`authorized operation failed before downgrade: ${JSON.stringify(allowedWrite)}`);

  await profile.selectOption("0");
  await page.setExtraHTTPHeaders({
    "x-local-access-subject": "source-user:14000000-0000-0000-0000-000000000001",
    "x-local-access-email": "ana-admin@migration.invalid",
    "x-hotel-id": hotelA,
  });
  const downgraded = await patchRole("receptionist");
  if (downgraded.status !== 200) throw new Error(`admin downgrade failed: ${JSON.stringify(downgraded)}`);
  await profile.selectOption("1");
  await page.setExtraHTTPHeaders({
    "x-local-access-subject": "source-user:14000000-0000-0000-0000-000000000002",
    "x-local-access-email": "leo-reception@migration.invalid",
    "x-hotel-id": hotelA,
  });
  await page.reload();
  await page.locator("header").getByRole("heading", { name: "Rooms" }).waitFor();
  const afterDowngrade = await page.evaluate(async () => (await fetch("/api/v1/auth/me")).json());
  if (afterDowngrade.subject !== beforeDowngrade.subject || afterDowngrade.role !== "receptionist" || afterDowngrade.capabilities.hotel.includes("rooms.write")) throw new Error("same subject retained stale server capability after role downgrade");
  await roomWrite.waitFor({ state: "hidden" });
  await page.screenshot({ path: "output/playwright/f0-10-capabilities-desktop-receptionist.png", fullPage: true });
  await page.getByRole("link", { name: /Rooms/ }).waitFor({ state: "visible" });
  for (const inaccessible of ["Housekeeping", "Users", "Reports"]) {
    if (await page.getByRole("link", { name: new RegExp(inaccessible) }).count()) throw new Error(`inaccessible navigation remained visible after downgrade: ${inaccessible}`);
  }
  await page.goto("http://127.0.0.1:4178/users");
  await page.locator(".users-operational").waitFor();
  await page.locator(".users-operational .workspace-heading-actions > button").waitFor({ state: "hidden" });
  await page.goto("http://127.0.0.1:4178/bookings");
  await page.locator(".billing-cash-workspace").waitFor();
  await page.locator(".billing-close-cash-form").waitFor({ state: "hidden" });
  const deniedWrite = await page.evaluate(async () => {
    const response = await fetch("/api/v1/rooms", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ room_number: "F010-DENIED", room_type: "STANDARD", price_cents: 12000 }) });
    return { status: response.status, body: await response.json().catch(() => null) };
  });
  if (deniedWrite.status !== 403) throw new Error(`direct API did not enforce downgraded role: ${JSON.stringify(deniedWrite)}`);

  await page.setExtraHTTPHeaders({
    "x-local-access-subject": "source-user:14000000-0000-0000-0000-000000000002",
    "x-local-access-email": "leo-reception@migration.invalid",
    "x-hotel-id": hotelB,
  });
  const secondHotelContext = await page.evaluate(async () => {
    const response = await fetch("/api/v1/auth/me");
    return { status: response.status, body: await response.json() };
  });
  if (secondHotelContext.status !== 200 || secondHotelContext.body.hotel_id !== hotelB
    || secondHotelContext.body.capabilities.hotel.includes("rooms.write")
    || !secondHotelContext.body.capabilities.hotel.includes("housekeeping.read")
    || !secondHotelContext.body.capabilities.network.includes("saas.hotels.read")) throw new Error(`selected hotel/network scopes leaked or mismatched: ${JSON.stringify(secondHotelContext)}`);
  await page.setExtraHTTPHeaders({
    "x-local-access-subject": "source-user:24000000-0000-0000-0000-000000000002",
    "x-local-access-email": "max-housekeeping@migration.invalid",
    "x-hotel-id": "unknown-hotel",
  });
  const unmemberedContext = await page.evaluate(async () => {
    const response = await fetch("/api/v1/auth/me");
    return { status: response.status, body: await response.json() };
  });
  if (unmemberedContext.status !== 403) throw new Error(`unmembered hotel unexpectedly received auth context: ${JSON.stringify(unmemberedContext)}`);

  await profile.selectOption("2");
  await page.setExtraHTTPHeaders({
    "x-local-access-subject": "source-user:24000000-0000-0000-0000-000000000001",
    "x-local-access-email": "sol-ops@migration.invalid",
    "x-hotel-id": hotelB,
  });
  await page.goto("http://127.0.0.1:4178/rooms");
  await page.getByRole("link", { name: /Housekeeping/ }).waitFor({ state: "visible" });
  await roomWrite.waitFor({ state: "hidden" });
  const opsContext = await page.evaluate(async () => (await fetch("/api/v1/auth/me")).json());
  if (opsContext.role !== "ops" || opsContext.capabilities.hotel.includes("rooms.write")) throw new Error(`ops role received an unexpected rooms.write capability: ${JSON.stringify(opsContext)}`);

  await profile.selectOption("3");
  await page.setExtraHTTPHeaders({
    "x-local-access-subject": "source-user:24000000-0000-0000-0000-000000000002",
    "x-local-access-email": "max-housekeeping@migration.invalid",
    "x-hotel-id": hotelB,
  });
  await page.goto("http://127.0.0.1:4178/housekeeping");
  await page.getByRole("link", { name: /Housekeeping/ }).waitFor({ state: "visible" });
  await page.locator("header").getByRole("heading", { name: "Housekeeping", exact: true }).waitFor();
  await page.getByRole("button", { name: "Start cleaning" }).waitFor({ state: "visible" });

  await page.setExtraHTTPHeaders({
    "x-local-access-subject": "f010-unknown",
    "x-local-access-email": "unknown@migration.invalid",
    "x-hotel-id": hotelA,
  });
  await page.goto("http://127.0.0.1:4178/rooms");
  const unknownContext = await page.evaluate(async () => (await fetch("/api/v1/auth/me")).json());
  if (unknownContext.capabilities.hotel.length !== 0 || unknownContext.capabilities.network.length !== 0) throw new Error(`unknown role received capabilities: ${JSON.stringify(unknownContext)}`);
  if (await page.getByRole("link", { name: /Rooms/ }).count()) throw new Error("unknown role received protected navigation");
  if (await page.evaluate(async () => (await fetch("/api/v1/rooms")).status) !== 403) throw new Error("unknown role accessed a protected hotel API");

  await profile.selectOption("4");
  await page.setExtraHTTPHeaders({
    "x-local-access-subject": "source-user:14000000-0000-0000-0000-000000000003",
    "x-local-access-email": "saas-admin@migration.invalid",
  });
  await page.goto("http://127.0.0.1:4178/network");
  await page.getByRole("heading", { name: "Hotel network" }).waitFor();
  const networkOnly = await page.evaluate(async () => (await fetch("/api/v1/auth/me")).json());
  if (networkOnly.hotel_id !== null || networkOnly.capabilities.hotel.length !== 0
    || !networkOnly.capabilities.network.includes("saas.hotels.read")
    || !networkOnly.capabilities.network.includes("saas.hotels.write")) throw new Error(`network-only identity has incorrect scopes: ${JSON.stringify(networkOnly)}`);
  await page.getByRole("link", { name: /Network/ }).waitFor({ state: "visible" });
  if (!(await page.locator(".network-operational details").isVisible())) throw new Error("network registration control was hidden despite saas.hotels.write");
  for (const inaccessible of ["Reception", "Rooms", "Guests", "Housekeeping", "Reports", "Users"]) {
    if (await page.getByRole("link", { name: new RegExp(inaccessible) }).count()) throw new Error(`network-only identity saw hotel navigation: ${inaccessible}`);
  }
  const deniedHotelRead = await page.evaluate(async () => (await fetch("/api/v1/rooms")).status);
  if (deniedHotelRead !== 403) throw new Error(`network-only identity accessed hotel API: ${deniedHotelRead}`);
  await page.screenshot({ path: "output/playwright/f0-10-network-only-navigation.png", fullPage: true });

  await profile.selectOption("1");
  await page.setExtraHTTPHeaders({
    "x-local-access-subject": "source-user:14000000-0000-0000-0000-000000000002",
    "x-local-access-email": "leo-reception@migration.invalid",
    "x-hotel-id": hotelA,
  });
  await page.setViewportSize({ width: 375, height: 844 });
  await page.goto("http://127.0.0.1:4178/rooms");
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("dialog", { name: "Mobile navigation" }).waitFor();
  await page.getByRole("link", { name: /Rooms/ }).waitFor({ state: "visible" });
  await roomWrite.waitFor({ state: "hidden" });
  if (await page.evaluate(() => document.documentElement.scrollWidth) > 375) throw new Error("mobile capability navigation overflows viewport");
  await page.screenshot({ path: "output/playwright/f0-10-receptionist-mobile-navigation.png", fullPage: true });

  const directDenied = await page.evaluate(async () => {
    const response = await fetch("/api/v1/users");
    return response.status;
  });
  if (directDenied !== 403) throw new Error(`hidden Users route API did not remain authoritative: ${directDenied}`);

  const staleAdminContext = await page.evaluate(async () => (await fetch("/api/v1/auth/me", { headers: {
    "x-local-access-subject": "source-user:14000000-0000-0000-0000-000000000001",
    "x-local-access-email": "ana-admin@migration.invalid",
    "x-hotel-id": "10000000-0000-0000-0000-000000000001",
  } })).json());
  let releaseStaleResponse;
  let resolveStaleResponse;
  const staleResponseReleased = new Promise(resolve => { resolveStaleResponse = resolve; });
  let requestCount = 0;
  await page.route("**/api/v1/auth/me", async route => {
    requestCount += 1;
    if (requestCount === 1) {
      await new Promise(resolve => { releaseStaleResponse = resolve; });
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(staleAdminContext) });
      resolveStaleResponse();
      return;
    }
    await route.continue();
  });
  await page.setExtraHTTPHeaders({
    "x-local-access-subject": "source-user:14000000-0000-0000-0000-000000000001",
    "x-local-access-email": "ana-admin@migration.invalid",
    "x-hotel-id": hotelA,
  });
  const firstAuthRequest = page.waitForRequest(request => request.url().endsWith("/api/v1/auth/me"));
  await profile.selectOption("0");
  await firstAuthRequest;
  await page.setExtraHTTPHeaders({
    "x-local-access-subject": "source-user:14000000-0000-0000-0000-000000000002",
    "x-local-access-email": "leo-reception@migration.invalid",
    "x-hotel-id": hotelA,
  });
  const currentAuthResponse = page.waitForResponse(response => response.url().endsWith("/api/v1/auth/me") && response.status() === 200);
  await profile.selectOption("1");
  await currentAuthResponse;
  await page.waitForFunction(() => {
    const value = document.querySelector(".app-content")?.getAttribute("data-hotel-capabilities") ?? "";
    return value.includes("bookings.read") && !value.includes("rooms.write");
  });
  releaseStaleResponse();
  await staleResponseReleased;
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const afterStaleResponse = await page.locator(".app-content").getAttribute("data-hotel-capabilities");
  if (!afterStaleResponse?.includes("bookings.read") || afterStaleResponse.includes("rooms.write")
    || await roomWrite.isVisible()) throw new Error(`out-of-order /auth/me response restored stale capabilities: ${afterStaleResponse}`);
  await page.unroute("**/api/v1/auth/me");
  return { desktop: "1280x900", mobile: "375x844", dualScope: "PASS", adminRoomGuestUserControls: "visible", beforeDowngrade: allowedWrite.status, afterDowngrade: deniedWrite.status, roomActionHidden: true, userControlsHidden: true, cashCloseHidden: true, opsRoomWrite: false, housekeepingRoleAction: "visible", networkOnlyNavigation: "PASS", networkWriteAction: "visible", directDenied: "PASS", unmemberedHotel: unmemberedContext.status, outOfOrderAuthMe: "PASS" };
})()
