page => (async () => {
  const origin = "http://127.0.0.1:4181";
  const proxyOrigin = "http://127.0.0.1:8787";
  const failures = new Set();
  const observed = [];
  const networkTimings = {};
  let navigationStarted = 0;
  let slowAncillaries = true;
  let staleOverlapEnabled = false;
  let staleRaceRequest = 0;
  let staleBoardPreparedResolve;
  let staleBoardReleaseResolve;
  const staleBoardPrepared = new Promise(resolve => { staleBoardPreparedResolve = resolve; });
  const staleBoardReleased = new Promise(resolve => { staleBoardReleaseResolve = resolve; });
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  await page.addInitScript(() => localStorage.setItem("hms.locale", "en"));
  await page.route("**/api/v1/**", async route => {
    const source = new URL(route.request().url());
    const pathname = source.pathname;
    const headers = {
      ...route.request().headers(),
      "x-local-access-subject": "source-user:14000000-0000-0000-0000-000000000001",
      "x-local-access-email": "ana-admin@migration.invalid",
      "x-hotel-id": "10000000-0000-0000-0000-000000000001",
    };
    for (const endpoint of failures) {
      if (pathname === `/api/v1${endpoint}`) headers["x-hms-test-fail"] = `/api/v1${endpoint}`;
    }
    if (!slowAncillaries) headers["x-hms-test-delay"] = "0";
    const target = `${proxyOrigin}/api/v1${pathname.split("/api/v1").at(-1)}${source.search}`;
    if (staleOverlapEnabled && pathname === "/api/v1/front-desk/board") {
      staleRaceRequest += 1;
      if (staleRaceRequest === 1) {
        const response = await route.fetch({ url: target, headers });
        const body = await response.json();
        const selectedBoardRow = body.items.find(item => item.booking.id === "z-priority");
        assert(selectedBoardRow, "Race fixture is missing z-priority board row");
        selectedBoardRow.booking.guest_name = "STALE_OLDER_BOARD_RESULT";
        staleBoardPreparedResolve();
        await staleBoardReleased;
        await route.fulfill({ response, headers: { ...response.headers(), "x-hms-e2e-generation": "stale" }, body: JSON.stringify(body) });
        return;
      }
      const response = await route.fetch({ url: target, headers });
      await route.fulfill({ response, headers: { ...response.headers(), "x-hms-e2e-generation": "new" } });
      return;
    }
    return route.continue({ url: target, headers });
  });
  page.on("response", response => {
    const url = new URL(response.url());
    if (["/api/v1/front-desk/board", "/api/v1/rooms", "/api/v1/guests", "/api/v1/reservation-creation-operations"].includes(url.pathname)) {
      observed.push({ path: url.pathname, status: response.status(), at: Date.now() });
      const timing = networkTimings[url.pathname];
      if (timing && timing.endMs === undefined) {
        timing.endMs = Date.now() - navigationStarted;
        timing.status = response.status();
      }
    }
  });
  page.on("request", request => {
    const url = new URL(request.url());
    if (["/api/v1/front-desk/board", "/api/v1/rooms", "/api/v1/guests", "/api/v1/reservation-creation-operations"].includes(url.pathname) && !networkTimings[url.pathname]) {
      networkTimings[url.pathname] = { startMs: Date.now() - navigationStarted };
    }
  });

  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  const noHorizontalOverflow = async label => {
    const dimensions = await page.evaluate(() => ({ width: innerWidth, document: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
    assert(dimensions.document <= dimensions.width && dimensions.body <= dimensions.width, `${label}: horizontal overflow ${JSON.stringify(dimensions)}`);
  };
  const queueReady = async () => {
    await page.locator('[data-booking-id="z-priority"]').waitFor({ state: "visible", timeout: 12000 });
    const queue = await page.locator(".reception-case-queue").isVisible();
    if (!queue) {
      const diagnostic = await page.evaluate(() => ({ layout: document.querySelector(".reception-case-layout")?.className, panel: document.querySelector(".reception-queue-panel")?.getBoundingClientRect().toJSON(), queue: document.querySelector(".reception-case-queue")?.getBoundingClientRect().toJSON(), display: document.querySelector(".reception-queue-panel") && getComputedStyle(document.querySelector(".reception-queue-panel")).display }));
      assert(false, `Queue hidden when ready at ${page.url()}: ${JSON.stringify(diagnostic)}`);
    }

  };

  const assertNoFalseStateText = async label => {
    const looseZeros = await page.locator(".reception-workspace").evaluate(root => [...root.childNodes].filter(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim() === "0").length);
    assert(looseZeros === 0, `${label}: false state leaked numeric text into Reception (${looseZeros})`);
    assert(await page.locator(".mobile-primary-nav button").getAttribute("aria-expanded") === "false", `${label}: closed More navigation has a non-boolean aria-expanded value`);
  };

  await page.setViewportSize({ width: 1280, height: 900 });
  const started = Date.now();
  navigationStarted = started;
  await page.goto(`${origin}/bookings?origin=block-b#queue`);
  await queueReady();
  const queueDomReadyAt = Date.now();
  const pendingBeforeScreenshot = ["/api/v1/rooms", "/api/v1/guests", "/api/v1/reservation-creation-operations"].filter(path => networkTimings[path]?.endMs === undefined);
  assert(pendingBeforeScreenshot.length === 3, `Ancillary responses settled before initial Queue evidence: ${JSON.stringify(networkTimings)}`);
  await page.screenshot({ path: "output/playwright/block-b-queue-before-aux-settle.png", fullPage: false });
  const queueScreenshotAt = Date.now();
  const queueScreenshotEvidence = { queueDomReadyMs: queueDomReadyAt - started, screenshotCapturedMs: queueScreenshotAt - started, pendingAuxiliaryPaths: pendingBeforeScreenshot };
  const unknownArrivalReadiness = page.locator(".reception-queue-row.lane-arrival .reception-row-readiness-unknown");
  assert(await unknownArrivalReadiness.count() > 0 && await unknownArrivalReadiness.first().isVisible(), "Unknown arrival readiness must be neutral while /rooms is pending");
  assert(await page.locator(".reception-queue-row.lane-arrival .reception-row-blocked").count() === 0, "Unknown arrival readiness must not be styled as a confirmed blocker");
  await assertNoFalseStateText("initial Queue");
  await page.locator(".reception-queue-filters button").filter({ hasText: "All" }).click();
  await page.locator(".reception-queue-filters button").filter({ hasText: "Arrivals" }).click();
  await page.locator(".reception-queue-search input").fill("Priority");
  await page.waitForFunction(() => new URL(location.href).searchParams.get("q") === "Priority");
  const filteredUrl = new URL(page.url());
  assert(filteredUrl.searchParams.get("lane") === "arrivals" && filteredUrl.searchParams.get("q") === "Priority", `Filter/search did not persist in URL: ${page.url()}`);
  const queueVisibleAt = Date.now();
  const queueVisibleMs = queueVisibleAt - started;
  const settledAncillaries = ["/api/v1/rooms", "/api/v1/guests", "/api/v1/reservation-creation-operations"].filter(path => networkTimings[path]?.endMs !== undefined && networkTimings[path].endMs <= queueVisibleMs);
  assert(settledAncillaries.length === 0, `At least one ancillary settled before Queue became visible; elapsed=${queueVisibleMs}; timings=${JSON.stringify(networkTimings)}`);
  await Promise.all(["/api/v1/front-desk/board", "/api/v1/rooms", "/api/v1/guests", "/api/v1/reservation-creation-operations"].filter(path => networkTimings[path]?.endMs === undefined).map(path => page.waitForResponse(response => new URL(response.url()).pathname === path, { timeout: 15000 })));
  assert(["/api/v1/rooms", "/api/v1/guests", "/api/v1/reservation-creation-operations"].every(path => networkTimings[path]?.endMs > queueVisibleMs), `Ancillary requests did not all finish after Queue-ready: ${JSON.stringify(networkTimings)}`);
  slowAncillaries = false;
  await noHorizontalOverflow("WIDE 1280x900");
  await page.screenshot({ path: "output/playwright/block-b-1280x900-queue.png", fullPage: false });
  await page.locator('[data-booking-id="z-priority"]').click();
  await page.getByRole("dialog", { name: /Next action: check-in verification/ }).waitFor();
  await page.getByRole("button", { name: "Close check-in task" }).click();
  await page.locator(".reception-booking-case").waitFor({ state: "visible" });
  await page.screenshot({ path: "output/playwright/block-b-1280x900-case.png", fullPage: false });
  await page.goBack();
  await queueReady();
  await page.waitForFunction(() => document.activeElement?.getAttribute("data-booking-id") === "z-priority");
  const returnFocus = await page.evaluate(() => document.activeElement?.getAttribute("data-booking-id"));
  assert(returnFocus === "z-priority", `Application Back did not restore queue-row focus: ${returnFocus}`);
  await page.goForward();
  await page.locator(".reception-booking-case").waitFor({ state: "visible" });
  await page.goBack();
  await queueReady();
  await page.waitForFunction(() => document.activeElement?.getAttribute("data-booking-id") === "z-priority");
  const baseline = { queueVisibleMs };

  await page.locator(".reception-queue-search input").fill("");
  await page.waitForFunction(() => !new URL(location.href).searchParams.has("q"));
  staleOverlapEnabled = true;
  await page.locator(".reception-queue-tools button").click();
  await staleBoardPrepared;
  const newestBoardResponse = page.waitForResponse(response => new URL(response.url()).pathname === "/api/v1/front-desk/board" && response.headers()["x-hms-e2e-generation"] === "new", { timeout: 12000 });
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  const newestBoard = await newestBoardResponse;
  assert(newestBoard.status() === 200, `Newer overlapping board read failed: ${newestBoard.status()}`);
  await page.locator('[data-booking-id="z-priority"]').waitFor({ state: "visible" });
  const currentBeforeOldCompletion = await page.locator('[data-booking-id="z-priority"]').innerText();
  staleBoardReleaseResolve();
  const staleBoardResponse = await page.waitForResponse(response => new URL(response.url()).pathname === "/api/v1/front-desk/board" && response.headers()["x-hms-e2e-generation"] === "stale", { timeout: 12000 });
  assert(staleBoardResponse.status() === 200, `Held stale board read failed: ${staleBoardResponse.status()}`);
  await page.waitForTimeout(100);
  const currentAfterOldCompletion = await page.locator('[data-booking-id="z-priority"]').innerText();
  assert(!currentAfterOldCompletion.includes("STALE_OLDER_BOARD_RESULT"), "Older overlapping board response overwrote the newer Queue result");
  const staleOverlap = { staleOldResponse: staleBoardResponse.status(), freshNewResponse: newestBoard.status(), currentBeforeOldCompletion, currentAfterOldCompletion, oldResultIgnored: true };
  staleOverlapEnabled = false;

  const viewports = [
    [1280, 600, "WIDE reduced height"], [900, 700, "COMPACT"], [768, 1024, "COMPACT"],
    [390, 844, "NARROW"], [320, 700, "NARROW"], [844, 390, "NARROW landscape"],
  ];
  const viewportEvidence = [];
  await page.locator(".reception-queue-search input").fill("");
  await page.waitForFunction(() => !new URL(location.href).searchParams.has("q"));
  for (const [width, height, name] of viewports) {
    await page.setViewportSize({ width, height });
    await queueReady();
    await assertNoFalseStateText(`${name} Queue ${width}x${height}`);
    await noHorizontalOverflow(`${name} ${width}x${height} Queue`);
    const queueState = await page.evaluate(() => {
      document.documentElement.style.scrollBehavior = "auto";
      window.scrollTo(0, 0);
      const panel = document.querySelector(".reception-queue-panel");
      const nav = document.querySelector(".mobile-primary-nav");
      const search = document.querySelector(".reception-queue-search");
      const filters = document.querySelector(".reception-queue-filters");
      const list = document.querySelector(".reception-case-queue");
      const rect = (element) => element ? { top: element.getBoundingClientRect().top, bottom: element.getBoundingClientRect().bottom } : null;
      return {
        queueVisible: !!panel?.getClientRects().length,
        caseVisible: !!document.querySelector(".reception-booking-case")?.getClientRects().length,
        queue: rect(panel), search: rect(search), filters: rect(filters), list: rect(list),
        filterButtonHeight: filters?.querySelector("button")?.getBoundingClientRect().height ?? 0,
        navTop: nav?.getBoundingClientRect().top ?? innerHeight,
        viewportHeight: innerHeight,
      };
    });
    if (width <= 900) assert([queueState.queue.bottom, queueState.search.bottom, queueState.filters.bottom].every(bottom => bottom <= queueState.navTop), `${name} Queue controls are occluded by mobile navigation: ${JSON.stringify(queueState)}`);
    assert(queueState.queueVisible && !queueState.caseVisible, `${name} Queue state is not presented separately: ${JSON.stringify(queueState)}`);
    if (width <= 900) {
      assert(await page.locator(".reception-queue-search input").isVisible() && await page.locator(".reception-queue-tools button").isVisible(), `${name} Queue search/refresh controls are unreachable`);
      assert(queueState.filters.bottom - queueState.filters.top >= 30 && queueState.filterButtonHeight >= 30, `${name} Queue filters are clipped/unusable: ${JSON.stringify(queueState)}`);
      assert(queueState.list.bottom - queueState.list.top >= 32, `${name} Queue list has no usable scroll area: ${JSON.stringify(queueState)}`);
      const allFilter = page.locator(".reception-queue-filters button").filter({ hasText: "All" });
      await allFilter.click();
      assert(await allFilter.evaluate(button => button.classList.contains("selected")), `${name} Queue filter could not be operated`);
    }
    if ([1280, 900, 768, 390, 320, 844].includes(width)) {
      await page.screenshot({ path: `output/playwright/block-b-${width}x${height}-queue.png`, fullPage: false });
    }
    viewportEvidence.push({ viewport: `${width}x${height}`, name, mode: "Queue", queueState });
  }

  await page.setViewportSize({ width: 320, height: 700 });
  const queue = page.locator(".reception-case-queue");
  const queueScrollBefore = await queue.evaluate(element => { element.scrollTop = element.scrollHeight; return element.scrollTop; });
  const selectedRow = page.locator(".reception-case-queue [data-booking-id]").last();
  const selectedId = await selectedRow.getAttribute("data-booking-id");
  await selectedRow.focus();
  await selectedRow.press("Enter");
  await page.getByRole("dialog", { name: /Next action: check-in verification/ }).waitFor();
  const closeTask = page.getByRole("button", { name: "Close check-in task" });
  await closeTask.focus();
  await closeTask.press("Enter");
  await page.locator(".reception-booking-case").waitFor({ state: "visible" });
  const caseBack = page.locator(".reception-case-back");
  await caseBack.focus();
  await caseBack.press("Enter");
  await queueReady();
  await page.waitForFunction(id => document.activeElement?.getAttribute("data-booking-id") === id, selectedId);
  const queueScrollAfter = await queue.evaluate(element => element.scrollTop);
  assert(queueScrollBefore > 0 && queueScrollAfter === queueScrollBefore, `NARROW queue scroll did not restore: ${queueScrollBefore} -> ${queueScrollAfter}`);
  assert(await page.evaluate(() => document.activeElement?.matches(":focus-visible")), "Keyboard-activated case did not restore a visible keyboard focus indicator");
  const keyboardContext = { viewport: "320x700", selectedId, queueScrollBefore, queueScrollAfter, focusRestored: true, focusVisible: true };
  await selectedRow.press("Enter");
  await page.getByRole("dialog", { name: /Next action: check-in verification/ }).waitFor();
  await closeTask.focus();
  await closeTask.press("Enter");
  await page.locator(".reception-booking-case").waitFor({ state: "visible" });

  for (const [width, height, name] of viewports) {
    await page.setViewportSize({ width, height });
    await noHorizontalOverflow(`${name} ${width}x${height} Case`);
    const caseState = await page.evaluate(() => ({
      queueVisible: !!document.querySelector(".reception-queue-panel")?.getClientRects().length,
      caseVisible: !!document.querySelector(".reception-booking-case")?.getClientRects().length,
      backVisible: !!document.querySelector(".reception-case-back")?.getClientRects().length,
      caseScrollHeight: document.querySelector(".reception-booking-case")?.scrollHeight ?? null,
      caseClientHeight: document.querySelector(".reception-booking-case")?.clientHeight ?? null,
    }));
    assert(caseState.caseVisible && (caseState.backVisible || width > 900), `${name} selected state lacks visible case/back: ${JSON.stringify(caseState)}`);
    if (width > 900) assert(caseState.queueVisible, `${name} did not preserve the Queue beside the selected Case`);
    if (width <= 900) assert(!caseState.queueVisible, `${name} stacked the Queue and Case instead of navigating between states`);
    const primaryAction = page.locator(".reception-booking-case .reception-checkin-trigger").first();
    await primaryAction.scrollIntoViewIfNeeded();
    assert(await primaryAction.isVisible(), `${name} selected case primary action is unreachable`);
    if (width <= 900) {
      await primaryAction.evaluate(element => element.scrollIntoView({ block: "center", inline: "nearest" }));
      const reachable = await primaryAction.evaluate(element => ({ bottom: element.getBoundingClientRect().bottom, navTop: document.querySelector(".mobile-primary-nav")?.getBoundingClientRect().top ?? innerHeight }));
      assert(reachable.bottom <= reachable.navTop, `${name} primary action is obscured by mobile navigation: ${JSON.stringify(reachable)}`);
    }
    if ([1280, 900, 768, 390, 320, 844].includes(width)) await page.screenshot({ path: `output/playwright/block-b-${width}x${height}-case.png`, fullPage: false });
    viewportEvidence.push({ viewport: `${width}x${height}`, name, mode: "Case", caseState });
  }
  viewportEvidence.push({ viewport: "320x700", mode: "Keyboard and continuity", ...keyboardContext });
  assert(pageErrors.length === 0, `Browser errors: ${JSON.stringify(pageErrors)}`);
  return { integratedWorkerD1: true, queueVisibleUpperBoundMs: baseline.queueVisibleMs, queueScreenshotEvidence, queueTimeline: structuredClone(networkTimings), staleOverlap, viewportEvidence, filtersSearchAndHistory: "PASS", appBackAndFocus: "PASS", keyboardScrollContext: keyboardContext, pageErrors };
})()
