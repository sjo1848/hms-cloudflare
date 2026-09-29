(page) => (async () => {
  const hotelA = "10000000-0000-0000-0000-000000000001";
  const hotelB = "20000000-0000-0000-0000-000000000002";
  await page.addInitScript(() => {
    localStorage.setItem("hms.locale", "en");
    if (sessionStorage.getItem("f0-10-profile-initialized") !== "true") {
      localStorage.setItem("hms-local-acceptance-profile", "0");
      sessionStorage.setItem("f0-10-profile-initialized", "true");
    }
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

  await page.setViewportSize({ width: 1280, height: 900 });
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
  if (!(await page.locator(".admin-surface > details").isVisible())) throw new Error("network registration control was hidden despite saas.hotels.write");
  const tabTo = async selector => {
    for (let i = 0; i < 40; i += 1) {
      await page.keyboard.press("Tab");
      if (await page.evaluate(value => document.activeElement?.matches(value) ?? false, selector)) return;
    }
    throw new Error(`keyboard traversal did not reach ${selector}`);
  };
  await tabTo(".admin-surface > details > summary");
  await page.keyboard.press("Enter");
  await page.locator(".admin-surface > details[open]").waitFor();
  await tabTo("#hotel-id");
  const hotelNorth = page.getByRole("button", { name: /Hotel Norte/ });
  await hotelNorth.click();
  await tabTo(".network-detail select");
  if (!(await page.locator(".network-detail select").isVisible())) throw new Error("authorized plan editor is not visible and keyboard reachable");
  for (const inaccessible of ["Reception", "Rooms", "Guests", "Housekeeping", "Reports", "Users"]) {
    if (await page.getByRole("link", { name: new RegExp(inaccessible) }).count()) throw new Error(`network-only identity saw hotel navigation: ${inaccessible}`);
  }
  const deniedHotelRead = await page.evaluate(async () => (await fetch("/api/v1/rooms")).status);
  if (deniedHotelRead !== 403) throw new Error(`network-only identity accessed hotel API: ${deniedHotelRead}`);
  await page.screenshot({ path: "output/playwright/f0-10-network-only-navigation.png", fullPage: true });

  await page.setViewportSize({ width: 375, height: 844 });
  const authorizedMobileAuth = page.waitForResponse(response => response.url().endsWith("/api/v1/auth/me") && response.status() === 200);
  await page.goto("http://127.0.0.1:4178/network");
  await page.getByRole("heading", { name: "Hotel network" }).waitFor();
  await authorizedMobileAuth;
  await page.locator(".admin-surface > details").waitFor({ state: "visible" });
  await tabTo(".admin-surface > details > summary");
  await page.keyboard.press("Enter");
  await page.locator(".admin-surface > details[open]").waitFor();
  await tabTo("#hotel-id");
  await page.getByRole("button", { name: /Hotel Norte/ }).click();
  await tabTo(".network-detail select");
  if (!(await page.locator(".network-detail select").isVisible())) throw new Error("authorized mobile plan editor is not keyboard reachable");
  if (await page.evaluate(() => document.documentElement.scrollWidth) > 375) throw new Error("authorized mobile Network surface overflows viewport");
  await page.screenshot({ path: "output/playwright/f0-10-network-admin-mobile-keyboard.png", fullPage: true });

  await profile.selectOption("2");
  await page.setExtraHTTPHeaders({
    "x-local-access-subject": "source-user:24000000-0000-0000-0000-000000000001",
    "x-local-access-email": "sol-ops@migration.invalid",
    "x-hotel-id": hotelB,
  });
  await page.route("**/api/v1/hotels", async route => {
    if (route.request().method() !== "GET") return route.continue();
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([
      { id: hotelB, slug: "hotel-sur", name: "Hotel Sur", address: "B Street", plan_tier: "BASIC", operational_binding: "HOTEL_SECOND_DB", active: 1 },
    ]) });
  });
  await page.setViewportSize({ width: 1280, height: 900 });
  const noWriteDesktopViewport = page.viewportSize();
  if (noWriteDesktopViewport?.width !== 1280 || noWriteDesktopViewport?.height !== 900) throw new Error(`no-write desktop check has wrong viewport: ${JSON.stringify(noWriteDesktopViewport)}`);
  const networkNoWriteViewportResults = [];
  await page.goto("http://127.0.0.1:4178/network");
  const noWriteDesktopProfile = await profile.inputValue();
  if (noWriteDesktopProfile !== "2") throw new Error(`desktop no-write UI profile selector is not the ops fixture: ${noWriteDesktopProfile}`);
  await page.waitForFunction(() => document.querySelector(".header-context")?.textContent?.includes("Hotel Sur"));
  const noWriteDesktopResponse = await page.evaluate(async () => {
    const response = await fetch("/api/v1/auth/me");
    return { status: response.status, body: await response.json() };
  });
  const noWriteDesktopAuth = noWriteDesktopResponse.body;
  if (noWriteDesktopResponse.status !== 200 || noWriteDesktopAuth.subject !== "source-user:24000000-0000-0000-0000-000000000001"
    || noWriteDesktopAuth.hotel_id !== hotelB || noWriteDesktopAuth.role !== "ops"
    || !noWriteDesktopAuth.capabilities.hotel.includes("housekeeping.read")
    || noWriteDesktopAuth.capabilities.network.includes("saas.hotels.write")) throw new Error(`desktop no-write UI received unexpected /auth/me context: ${JSON.stringify(noWriteDesktopResponse)}`);
  await page.getByRole("button", { name: /Hotel Sur/ }).waitFor({ state: "visible" });
  await page.getByRole("button", { name: /Hotel Sur/ }).click();
  await page.locator(".network-detail").waitFor({ state: "visible" });
  if (await page.locator(".admin-surface > details").count() !== 0
    || await page.locator(".network-detail select").count() !== 0) throw new Error("network write affordances remained in DOM without saas.hotels.write");
  if (!(await page.getByRole("button", { name: /Hotel Sur/ }).innerText()).includes("Basic")
    || !(await page.locator(".network-detail").innerText()).includes("Basic")) throw new Error("read-only hotel plan is not legible without network write capability");
  await page.locator("body").click({ position: { x: 2, y: 2 } });
  for (let i = 0; i < 40; i += 1) {
    await page.keyboard.press("Tab");
    const focusedWriteControl = await page.evaluate(() => document.activeElement?.matches("#hotel-id, #hotel-slug, #hotel-name, #hotel-binding, .network-detail select") ?? false);
    if (focusedWriteControl) throw new Error("keyboard traversal reached a network write control without saas.hotels.write");
  }
  await page.screenshot({ path: "output/playwright/f0-10-network-no-write-keyboard.png", fullPage: true });
  networkNoWriteViewportResults.push(`${noWriteDesktopViewport.width}x${noWriteDesktopViewport.height}:PASS`);
  const deniedNetworkWrite = await page.evaluate(async () => {
    const response = await fetch("/api/v1/hotels", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: "denied-hotel", slug: "denied", name: "Denied", operational_binding: "HOTEL_SECOND_DB", plan_tier: "BASIC" }) });
    return response.status;
  });
  if (deniedNetworkWrite !== 403) throw new Error(`hotel member without network write capability received network write: ${deniedNetworkWrite}`);
  await page.setViewportSize({ width: 375, height: 844 });
  const noWriteMobileViewport = page.viewportSize();
  if (noWriteMobileViewport?.width !== 375 || noWriteMobileViewport?.height !== 844) throw new Error(`no-write mobile check has wrong viewport: ${JSON.stringify(noWriteMobileViewport)}`);
  await page.goto("http://127.0.0.1:4178/network");
  const noWriteMobileProfile = await profile.inputValue();
  if (noWriteMobileProfile !== "2") throw new Error(`mobile no-write UI profile selector is not the ops fixture: ${noWriteMobileProfile}`);
  await page.waitForFunction(() => document.querySelector(".header-context")?.textContent?.includes("Hotel Sur"));
  const noWriteMobileResponse = await page.evaluate(async () => {
    const response = await fetch("/api/v1/auth/me");
    return { status: response.status, body: await response.json() };
  });
  const noWriteMobileAuth = noWriteMobileResponse.body;
  if (noWriteMobileResponse.status !== 200 || noWriteMobileAuth.subject !== "source-user:24000000-0000-0000-0000-000000000001"
    || noWriteMobileAuth.hotel_id !== hotelB || noWriteMobileAuth.role !== "ops"
    || !noWriteMobileAuth.capabilities.hotel.includes("housekeeping.read")
    || noWriteMobileAuth.capabilities.network.includes("saas.hotels.write")) throw new Error(`mobile no-write UI received unexpected /auth/me context: ${JSON.stringify(noWriteMobileResponse)}`);
  await page.getByRole("button", { name: /Hotel Sur/ }).waitFor({ state: "visible" });
  await page.getByRole("button", { name: /Hotel Sur/ }).click();
  await page.locator(".network-detail").waitFor({ state: "visible" });
  if (await page.locator(".admin-surface > details").count() !== 0
    || await page.locator(".network-detail select").count() !== 0) throw new Error("mobile network write affordances remained in DOM without saas.hotels.write");
  if (!(await page.locator(".network-detail").innerText()).includes("Basic")) throw new Error("mobile read-only hotel plan is not legible without network write capability");
  await page.locator("body").click({ position: { x: 2, y: 2 } });
  for (let i = 0; i < 40; i += 1) {
    await page.keyboard.press("Tab");
    const focusedWriteControl = await page.evaluate(() => document.activeElement?.matches("#hotel-id, #hotel-slug, #hotel-name, #hotel-binding, .network-detail select") ?? false);
    if (focusedWriteControl) throw new Error("mobile keyboard traversal reached a network write control without saas.hotels.write");
  }
  if (await page.evaluate(() => document.documentElement.scrollWidth) > 375) throw new Error("unauthorized mobile Network surface overflows viewport");
  await page.screenshot({ path: "output/playwright/f0-10-network-no-write-mobile-keyboard.png", fullPage: true });
  networkNoWriteViewportResults.push(`${noWriteMobileViewport.width}x${noWriteMobileViewport.height}:PASS`);
  const deniedNetworkWriteMobile = await page.evaluate(async () => {
    const response = await fetch("/api/v1/hotels", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: "denied-hotel-mobile", slug: "denied-mobile", name: "Denied Mobile", operational_binding: "HOTEL_SECOND_DB", plan_tier: "BASIC" }) });
    return response.status;
  });
  if (deniedNetworkWriteMobile !== 403) throw new Error(`mobile direct API did not deny hotel member network write: ${deniedNetworkWriteMobile}`);
  await page.unroute("**/api/v1/hotels");

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
  return { desktop: "1280x900", mobile: "375x844", dualScope: "PASS", adminRoomGuestUserControls: "visible", beforeDowngrade: allowedWrite.status, afterDowngrade: deniedWrite.status, roomActionHidden: true, userControlsHidden: true, cashCloseHidden: true, opsRoomWrite: false, housekeepingRoleAction: "visible", networkOnlyNavigation: "PASS", networkWriteAction: "visible-and-keyboard-reachable", networkDeniedWritesHidden: "PASS", networkKeyboard: { authorizedDesktop: "PASS", unauthorizedDesktop: "PASS", authorizedMobile: "PASS", unauthorizedMobile: "PASS", noWriteAuthMeDesktop: { localProfile: noWriteDesktopProfile, subject: noWriteDesktopAuth.subject, hotelId: noWriteDesktopAuth.hotel_id, role: noWriteDesktopAuth.role, hotelCapabilities: noWriteDesktopAuth.capabilities.hotel, networkCapabilities: noWriteDesktopAuth.capabilities.network, status: noWriteDesktopResponse.status, appContextApplied: true }, noWriteAuthMeMobile: { localProfile: noWriteMobileProfile, subject: noWriteMobileAuth.subject, hotelId: noWriteMobileAuth.hotel_id, role: noWriteMobileAuth.role, hotelCapabilities: noWriteMobileAuth.capabilities.hotel, networkCapabilities: noWriteMobileAuth.capabilities.network, status: noWriteMobileResponse.status, appContextApplied: true }, deniedWriteDesktop: deniedNetworkWrite, deniedWriteMobile: deniedNetworkWriteMobile, unauthorizedViewports: networkNoWriteViewportResults }, directDenied: "PASS", unmemberedHotel: unmemberedContext.status, outOfOrderAuthMe: "PASS" };
})()
