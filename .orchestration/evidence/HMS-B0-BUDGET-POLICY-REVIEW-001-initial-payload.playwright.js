page => (async () => {
  await page.addInitScript(() => {
    window.__b0Lcp = [];
    window.__b0LongTasks = [];
    new PerformanceObserver(list => window.__b0Lcp.push(...list.getEntries().map(entry => Math.round(entry.startTime)))
    ).observe({ type: "largest-contentful-paint", buffered: true });
    new PerformanceObserver(list => window.__b0LongTasks.push(...list.getEntries().map(entry => Math.round(entry.duration)))
    ).observe({ type: "longtask", buffered: true });
  });
  await page.setExtraHTTPHeaders({
    "x-local-access-subject": "source-user:14000000-0000-0000-0000-000000000002",
    "x-local-access-email": "leo-reception@migration.invalid",
    "x-hotel-id": "10000000-0000-0000-0000-000000000001",
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("http://127.0.0.1:4173/bookings", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => document.querySelector(".header-context")?.textContent?.includes("Hotel Norte"));
  await page.locator(".reception-queue-row").first().waitFor();
  const result = await page.evaluate(() => ({
    lcp: window.__b0Lcp,
    fcp: Math.round(performance.getEntriesByName("first-contentful-paint")[0]?.startTime ?? 0),
    domContentLoaded: Math.round(performance.getEntriesByType("navigation")[0]?.domContentLoadedEventEnd ?? 0),
    appReady: Math.round(performance.now()),
    longTasks: window.__b0LongTasks,
    resources: performance.getEntriesByType("resource").map(e => ({
      path: new URL(e.name).pathname,
      transfer: e.transferSize,
      encoded: e.encodedBodySize,
      decoded: e.decodedBodySize,
      duration: Math.round(e.duration),
      type: e.initiatorType,
    })).filter(e => /\.(js|css|json)$/.test(e.path) || e.path === "/" || e.path === "/bookings" || e.path.startsWith("/api/v1/")),
  }));
  await page.evaluate(value => { document.title = JSON.stringify(value); }, result);
})()
