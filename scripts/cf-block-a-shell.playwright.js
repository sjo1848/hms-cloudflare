(page) => (async () => {
  const base = "http://127.0.0.1:4178";
  const hotelA = "10000000-0000-0000-0000-000000000001";
  const emailAdmin = "ana-admin@migration.invalid";
  const subjectReception = "source-user:14000000-0000-0000-0000-000000000002";
  const receptionEmail = "leo-reception@migration.invalid";
  const profileHeaders = [
    { "x-local-access-subject": "source-user:14000000-0000-0000-0000-000000000001", "x-local-access-email": emailAdmin, "x-hotel-id": hotelA },
    { "x-local-access-subject": subjectReception, "x-local-access-email": receptionEmail, "x-hotel-id": hotelA },
    { "x-local-access-subject": "source-user:24000000-0000-0000-0000-000000000001", "x-local-access-email": "sol-ops@migration.invalid", "x-hotel-id": "20000000-0000-0000-0000-000000000002" },
  ];
  const setProfile = async index => {
    await page.setExtraHTTPHeaders(profileHeaders[index]);
    await page.getByLabel("Profile").selectOption(String(index));
  };
  const assertAdminNav = async checkpoint => {
    const found = await page.getByRole("link", { name: /Users/ }).first().waitFor({ state: "visible", timeout: 5000 }).then(() => true, () => false);
    if (!found) throw new Error(`admin navigation did not refresh at ${checkpoint}: ${JSON.stringify(await page.evaluate(() => ({ profile: document.querySelector(".local-dev-identity select")?.value, capabilities: document.querySelector(".app-content")?.getAttribute("data-hotel-capabilities"), links: [...document.querySelectorAll(".desktop-sidebar a")].map(link => link.textContent) })) )}`);
  };
  await page.addInitScript(() => {
    localStorage.setItem("hms.locale", "en");
    if (sessionStorage.getItem("block-a-profile-initialized") !== "true") {
      localStorage.setItem("hms-local-acceptance-profile", "0");
      sessionStorage.setItem("block-a-profile-initialized", "true");
    }
  });
  await page.setExtraHTTPHeaders(profileHeaders[0]);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${base}/bookings?view=arrivals&search=arrival-marker#queue-top`);
  await page.getByRole("heading", { name: "Reception", level: 1 }).waitFor();
  await setProfile(0);
  const adminReady = await page.waitForFunction(() => document.querySelector(".app-content")?.getAttribute("data-hotel-capabilities")?.includes("users.read"), { timeout: 5000 }).then(() => true, () => false);
  const wideAdminState = await page.evaluate(async () => ({
    auth: await (await fetch("/api/v1/auth/me", { headers: {
      "x-local-access-subject": "source-user:14000000-0000-0000-0000-000000000001",
      "x-local-access-email": "ana-admin@migration.invalid",
      "x-hotel-id": "10000000-0000-0000-0000-000000000001",
    } })).json(),
    renderedCapabilities: document.querySelector(".app-content")?.getAttribute("data-hotel-capabilities"),
    groups: [...document.querySelectorAll(".desktop-sidebar .nav-group h2")].map(node => node.textContent),
  }));
  if (!adminReady || !wideAdminState.auth.capabilities.hotel.includes("users.read")) throw new Error(`synthetic admin profile did not become authoritative: ${JSON.stringify(wideAdminState)}`);
  if (!wideAdminState.groups.includes("Insights")) throw new Error(`admin shell group mismatch: ${JSON.stringify(wideAdminState)}`);
  await page.screenshot({ path: "output/playwright/block-a-wide-1440-reception.png", fullPage: true });
  for (const group of ["Hotel operations", "Directory", "Insights", "Hotel administration", "Platform administration"]) await page.getByRole("heading", { name: group }).waitFor();
  await page.getByRole("heading", { name: "Platform administration" }).waitFor();
  for (const route of ["/bookings", "/rooms", "/housekeeping", "/guests", "/reports", "/users", "/network"]) {
    await page.goto(`${base}${route}`);
    await page.locator(".desktop-heading h1").waitFor();
    if (new URL(page.url()).pathname !== route) throw new Error(`direct route did not retain URL: ${route}`);
  }
  await page.goto(`${base}/definitely-no-route`);
  await page.getByRole("heading", { name: "Page not found", level: 1 }).waitFor();
  await page.goto(`${base}/rooms/unknown-resource`);
  await page.getByRole("heading", { name: "Page not found", level: 1 }).waitFor();
  if (new URL(page.url()).pathname !== "/rooms/unknown-resource") throw new Error("unknown nested route did not remain a truthful not-found URL");
  await page.goto(`${base}/bookings?view=arrivals&search=arrival-marker#queue-top`);
  await page.getByRole("link", { name: /Rooms/ }).click();
  await page.waitForURL("**/rooms");
  await page.goBack();
  await page.waitForURL("**/bookings?view=arrivals&search=arrival-marker#queue-top");
  await page.getByRole("heading", { name: "Reception", level: 1 }).waitFor();
  await page.goForward();
  await page.waitForURL("**/rooms");
  await page.reload();
  await page.waitForURL("**/rooms");
  await page.screenshot({ path: "output/playwright/block-a-wide-1440.png", fullPage: true });
  await page.goto(`${base}/rooms`);
  await page.evaluate(() => {
    const spacer = document.createElement("div");
    spacer.style.height = "1500px";
    spacer.setAttribute("aria-hidden", "true");
    const anchor = document.createElement("div");
    anchor.id = "block-a-test-anchor";
    anchor.textContent = "Synthetic local fragment target";
    anchor.style.height = "80px";
    const tail = document.createElement("div");
    tail.style.height = "900px";
    tail.setAttribute("aria-hidden", "true");
    document.body.append(spacer, anchor, tail);
    window.history.pushState({}, "", `${window.location.pathname}#block-a-test-anchor`);
  });
  await page.goBack();
  await page.waitForURL("**/rooms");
  await page.goForward();
  await page.waitForURL("**/rooms#block-a-test-anchor");
  await page.locator("#block-a-test-anchor").waitFor({ state: "attached" });
  const fragmentReached = await page.waitForFunction(() => Math.abs(document.getElementById("block-a-test-anchor")?.getBoundingClientRect().top ?? 999) < 4, { timeout: 5000 }).then(() => true, () => false);
  const fragmentPosition = await page.evaluate(() => ({ scrollY: window.scrollY, targetTop: document.getElementById("block-a-test-anchor")?.getBoundingClientRect().top }));
  if (!fragmentReached || fragmentPosition.scrollY < 100 || Math.abs(fragmentPosition.targetTop ?? 999) > 4) throw new Error(`history fragment did not reach target: ${JSON.stringify(fragmentPosition)}`);
  await page.goto(`${base}/rooms`);
  await page.getByRole("heading", { name: "Rooms", level: 1 }).waitFor();

  const adminHeaders = {
    "content-type": "application/json",
    "x-local-access-subject": "source-user:14000000-0000-0000-0000-000000000001",
    "x-local-access-email": emailAdmin,
    "x-hotel-id": hotelA,
  };
  for (let index = 0; index < 16; index += 1) {
    const response = await page.evaluate(async ({ index, headers }) => fetch("/api/v1/rooms", {
      method: "POST", headers,
      body: JSON.stringify({ room_number: `A-${String(index + 10).padStart(2, "0")}`, room_type: "STANDARD", price_cents: 10000 }),
    }).then(value => value.status), { index, headers: adminHeaders });
    if (response !== 201) throw new Error(`local synthetic scroll fixture create failed at ${index}: ${response}`);
  }
  await page.reload();
  await page.locator(".rooms-board article").nth(15).waitFor();
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  const savedScroll = await page.evaluate(() => window.scrollY);
  if (savedScroll < 80) throw new Error(`WIDE room fixture did not provide a real scroll position: ${savedScroll}`);
  await page.getByRole("link", { name: /Guests/ }).click();
  await page.waitForURL("**/guests");
  await page.goBack();
  await page.waitForURL("**/rooms");
  await page.locator(".rooms-board article").nth(15).waitFor();
  const restoredScroll = await page.evaluate(() => window.scrollY);
  if (Math.abs(restoredScroll - savedScroll) > 8) throw new Error(`Back did not restore route scroll: saved=${savedScroll}, restored=${restoredScroll}`);

  await page.setViewportSize({ width: 1024, height: 700 });
  const compact = await page.evaluate(() => ({
    shellColumns: getComputedStyle(document.querySelector(".app-shell")).gridTemplateColumns,
    sidebar: getComputedStyle(document.querySelector(".desktop-sidebar")).display,
    mobileNav: getComputedStyle(document.querySelector(".mobile-primary-nav")).display,
  }));
  if (compact.sidebar === "none" || compact.mobileNav !== "none" || !compact.shellColumns.startsWith("220px")) throw new Error(`COMPACT shell composition is wrong: ${JSON.stringify(compact)}`);
  await page.getByRole("link", { name: /Housekeeping/ }).waitFor({ state: "visible" });
  await page.screenshot({ path: "output/playwright/block-a-compact-1024.png", fullPage: true });
  const compactNav = page.locator(".desktop-sidebar .nav-group a");
  const compactNavLabels = await compactNav.evaluateAll(links => links.map(link => link.textContent?.trim()));
  if (compactNavLabels.some(label => !label)) throw new Error(`COMPACT navigation has an unnamed destination: ${JSON.stringify(compactNavLabels)}`);
  await page.keyboard.press("Tab");
  const compactKeyboardVisited = new Set();
  for (let index = 0; index < 80 && compactKeyboardVisited.size < 7; index += 1) {
    const current = await page.evaluate(() => {
      const active = document.activeElement;
      return active instanceof HTMLAnchorElement && active.closest(".desktop-sidebar .nav-group") ? active.textContent?.trim() ?? null : null;
    });
    if (current) compactKeyboardVisited.add(current);
    await page.keyboard.press("Tab");
  }
  const expectedCompact = ["Reception", "Rooms", "Housekeeping", "Guests", "Reports", "Users", "Network"];
  if (expectedCompact.some(name => !compactKeyboardVisited.has(name))) throw new Error(`COMPACT Tab traversal missed navigation destinations: ${JSON.stringify([...compactKeyboardVisited])}`);
  const currentRouteSemantics = await page.locator('.desktop-sidebar a[aria-current="page"]').count();
  if (currentRouteSemantics !== 1) throw new Error(`COMPACT current route must expose one aria-current page, got ${currentRouteSemantics}`);

  await setProfile(2);
  await page.getByRole("link", { name: /Housekeeping/ }).first().waitFor({ state: "visible" });
  await page.getByText("Hotel Sur", { exact: false }).first().waitFor();
  const switchedContext = await page.evaluate(async () => (await fetch("/api/v1/auth/me", { headers: {
    "x-local-access-subject": "source-user:24000000-0000-0000-0000-000000000001",
    "x-local-access-email": "sol-ops@migration.invalid",
    "x-hotel-id": "20000000-0000-0000-0000-000000000002",
  } })).json());
  if (switchedContext.hotel_id !== "20000000-0000-0000-0000-000000000002" || switchedContext.email !== "sol-ops@migration.invalid") throw new Error(`hotel/user context did not refresh from server: ${JSON.stringify(switchedContext)}`);
  await setProfile(0);
  await assertAdminNav("return from Hotel Sur");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${base}/bookings?view=arrivals&search=mobile-marker#queue-top`);
  await page.getByRole("heading", { name: "Reception", level: 1 }).waitFor();
  const primary = page.getByRole("navigation", { name: "Primary navigation" });
  for (const name of ["Reception", "Rooms", "Housekeeping"]) await primary.getByRole("link", { name: new RegExp(name) }).waitFor({ state: "visible" });
  const touchHeights = await primary.getByRole("link").evaluateAll(links => links.map(link => Math.round(link.getBoundingClientRect().height)));
  if (touchHeights.some(height => height < 48)) throw new Error(`NARROW navigation touch target below 48px: ${JSON.stringify(touchHeights)}`);
  if (await primary.getByRole("link", { name: "Reception" }).getAttribute("aria-current") !== "page") throw new Error("NARROW active destination is not semantically marked current");
  const narrowNames = await primary.getByRole("link").evaluateAll(links => links.map(link => link.getAttribute("aria-label") || link.textContent?.trim()));
  if (narrowNames.some(name => !name)) throw new Error(`NARROW navigation has an unnamed destination: ${JSON.stringify(narrowNames)}`);
  await page.screenshot({ path: "output/playwright/block-a-narrow-390-reception.png", fullPage: true });
  const more = page.getByRole("button", { name: "More" });
  await more.click();
  const moreDialog = page.getByRole("dialog", { name: "More destinations" });
  await moreDialog.waitFor();
  for (const name of ["Guests", "Reports", "Users", "Network"]) await moreDialog.getByRole("link", { name: new RegExp(name) }).waitFor({ state: "visible" });
  if (await moreDialog.getByRole("link", { name: /Rooms/ }).count()) throw new Error("primary Rooms destination was duplicated inside More");
  await page.screenshot({ path: "output/playwright/block-a-narrow-390-more.png", fullPage: true });
  await page.keyboard.press("Escape");
  await moreDialog.waitFor({ state: "hidden" });
  const focusRestored = await more.evaluate(element => document.activeElement === element);
  if (!focusRestored) throw new Error("closing More did not restore keyboard focus to its trigger");
  if (await page.evaluate(() => document.documentElement.scrollWidth) > 390) throw new Error("NARROW shell overflows horizontally");

  await page.setViewportSize({ width: 390, height: 560 });
  await page.getByRole("button", { name: "More" }).click();
  const reducedDialog = page.getByRole("dialog", { name: "More destinations" });
  const reducedGeometry = await reducedDialog.evaluate(dialog => ({ height: dialog.getBoundingClientRect().height, clientHeight: dialog.clientHeight, scrollHeight: dialog.scrollHeight, viewport: window.innerHeight }));
  if (reducedGeometry.height > reducedGeometry.viewport || reducedGeometry.height < 300) throw new Error(`reduced-height More surface is not bounded/usable: ${JSON.stringify(reducedGeometry)}`);
  const reducedKeyboardVisited = new Set();
  await reducedDialog.getByRole("button", { name: "Close navigation" }).focus();
  for (let index = 0; index < 32 && !reducedKeyboardVisited.has("Network"); index += 1) {
    await page.keyboard.press("Tab");
    const name = await page.evaluate(() => document.activeElement instanceof HTMLAnchorElement ? document.activeElement.textContent?.trim() ?? null : null);
    if (name) reducedKeyboardVisited.add(name);
  }
  for (const name of ["Guests", "Reports", "Users", "Network"]) if (!reducedKeyboardVisited.has(name)) throw new Error(`reduced-height Drawer keyboard path missed ${name}: ${JSON.stringify([...reducedKeyboardVisited])}`);
  await page.screenshot({ path: "output/playwright/block-a-narrow-390x560-more.png", fullPage: true });
  await page.keyboard.press("Escape");
  await reducedDialog.waitFor({ state: "hidden" });
  if (!(await page.getByRole("button", { name: "More" }).evaluate(element => document.activeElement === element))) throw new Error("reduced-height More close did not restore focus");
  if (await page.evaluate(() => document.documentElement.scrollWidth) > 390) throw new Error("reduced-height NARROW shell overflows horizontally");

  await setProfile(1);
  await page.goto(`${base}/rooms`);
  await page.getByRole("heading", { name: "Rooms", level: 1 }).waitFor();
  const before = await page.evaluate(async () => {
    const headers = { "x-local-access-subject": "source-user:14000000-0000-0000-0000-000000000002", "x-local-access-email": "leo-reception@migration.invalid", "x-hotel-id": "10000000-0000-0000-0000-000000000001" };
    const response = await fetch("/api/v1/rooms", { headers });
    return { status: response.status, auth: await (await fetch("/api/v1/auth/me", { headers })).json() };
  });
  if (before.status !== 200 || before.auth.subject !== subjectReception || before.auth.role !== "receptionist") throw new Error(`same-subject allowed baseline missing: ${JSON.stringify(before)}`);
  await setProfile(0);
  await page.waitForFunction(() => document.querySelector(".app-content")?.getAttribute("data-hotel-capabilities")?.includes("users.write"));
  const promote = await page.evaluate(async ({ subject, headers }) => fetch(`/api/v1/users/${encodeURIComponent(subject)}/role`, {
    method: "PATCH", headers, body: JSON.stringify({ role: "admin" }),
  }).then(response => response.status), { subject: subjectReception, headers: adminHeaders });
  if (promote !== 200) throw new Error(`local synthetic reviewer fixture could not prepare same-subject capability refresh: ${promote}`);
  await setProfile(1);
  await page.getByRole("link", { name: /Rooms/ }).first().waitFor({ state: "visible" });
  const roomListLoaded = page.waitForResponse(response => new URL(response.url()).pathname === "/api/v1/rooms" && response.status() === 200);
  await page.goto(`${base}/rooms`);
  await page.getByRole("heading", { name: "Rooms", level: 1 }).waitFor();
  await roomListLoaded;
  const allowedRead = await page.evaluate(async () => (await fetch("/api/v1/rooms")).status);
  if (allowedRead !== 200) throw new Error(`same subject did not read Rooms before synthetic downgrade: ${allowedRead}`);
  await page.waitForLoadState("networkidle");
  if (!new URL(page.url()).pathname.endsWith("/rooms")) throw new Error(`Rooms context changed before controlled downgrade: ${page.url()}`);

  await page.setExtraHTTPHeaders(adminHeaders);
  const downgrade = await page.evaluate(async ({ subject, headers }) => fetch(`/api/v1/users/${encodeURIComponent(subject)}/role`, {
    method: "PATCH", headers, body: JSON.stringify({ role: "housekeeping" }),
  }).then(response => response.status), { subject: subjectReception, headers: adminHeaders });
  if (downgrade !== 200) throw new Error(`local synthetic same-subject downgrade failed: ${downgrade}`);
  await page.setExtraHTTPHeaders(profileHeaders[1]);
  let forbiddenRoomReads = 0;
  page.on("response", response => {
    if (response.url().includes("/api/v1/rooms") && response.request().method() === "GET" && response.status() === 403) forbiddenRoomReads += 1;
  });
  await page.waitForFunction(() => {
    const refresh = [...document.querySelectorAll(".resource-toolbar button")].find(button => button.textContent?.trim() === "Refresh");
    return refresh instanceof HTMLButtonElement && !refresh.disabled;
  }, { timeout: 15000 });
  await page.getByRole("button", { name: "Refresh" }).click();
  await page.getByRole("heading", { name: "Destination unavailable" }).waitFor();
  await page.getByRole("link", { name: /Housekeeping/ }).first().waitFor({ state: "visible" });
  if (await page.getByRole("link", { name: /Rooms/ }).count()) throw new Error("stale Rooms capability remained visible after refresh");
  if (forbiddenRoomReads !== 1) throw new Error(`403 refresh must not replay a read; observed ${forbiddenRoomReads} denied calls`);
  const after = await page.evaluate(async () => (await fetch("/api/v1/auth/me", { headers: {
    "x-local-access-subject": "source-user:14000000-0000-0000-0000-000000000002",
    "x-local-access-email": "leo-reception@migration.invalid",
    "x-hotel-id": "10000000-0000-0000-0000-000000000001",
  } })).json());
  if (after.subject !== before.auth.subject || after.role !== "housekeeping" || after.capabilities.hotel.includes("rooms.read")) throw new Error(`same-subject denied-after capability state mismatch: ${JSON.stringify(after)}`);
  await page.getByRole("link", { name: /Housekeeping/ }).first().click();
  await page.waitForURL("**/housekeeping");
  await page.getByRole("heading", { name: "Housekeeping", level: 1 }).waitFor();

  await setProfile(0);
  await page.waitForFunction(() => document.querySelector(".app-content")?.getAttribute("data-hotel-capabilities")?.includes("users.write"));
  await page.setExtraHTTPHeaders(adminHeaders);
  const restore = await page.evaluate(async ({ subject, headers }) => fetch(`/api/v1/users/${encodeURIComponent(subject)}/role`, {
    method: "PATCH", headers, body: JSON.stringify({ role: "receptionist" }),
  }).then(response => response.status), { subject: subjectReception, headers: adminHeaders });
  if (restore !== 200) throw new Error(`local synthetic role fixture cleanup failed: ${restore}`);

  return {
    viewports: { WIDE: "1440x900", COMPACT: "1024x700", NARROW: "390x844" },
    directRoutes: "7/7",
    queryHashReloadBackForward: "PASS",
    historyFragment: { position: fragmentPosition, status: "PASS" },
    scroll: { before: savedScroll, after: restoredScroll, status: "PASS" },
    identityHotelContext: "Worker /auth/me authoritative PASS",
    mobileMoreKeyboardTouchTargets: "PASS",
    accessibleNavigation: { compactTabDestinations: [...compactKeyboardVisited], compactCurrentPage: "PASS", narrowNamedDestinations: narrowNames, reducedHeightKeyboardDestinations: [...reducedKeyboardVisited], reducedHeightGeometry: { height: reducedGeometry.height, scrollHeight: reducedGeometry.scrollHeight, viewport: reducedGeometry.viewport }, status: "PASS" },
    capabilityDowngrade: { subject: before.auth.subject, allowedRead: before.status, deniedRead: 403, noReplay: forbiddenRoomReads === 1, routeGuard: "PASS" },
    fixtures: "local synthetic D1 only; same-subject role restored",
  };
})()
