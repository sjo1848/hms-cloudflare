(page) => (async () => {
  await page.addInitScript(() => localStorage.setItem("hms.locale", "en"));
  const viewports = [[1280, 900], [768, 812], [375, 812], [375, 600], [844, 390]];
  await page.setExtraHTTPHeaders({ "x-local-access-subject": "subject-a", "x-local-access-email": "a@test", "x-hotel-id": "hotel-a" });
  for (const [index, [width, height]] of viewports.entries()) {
    await page.setViewportSize({ width, height });
    if (index === 0) await page.goto("http://127.0.0.1:4175/reports");
    if (index === 0) { await page.locator(".language-selector select").selectOption("en"); await page.waitForFunction(() => document.documentElement.lang === "en"); }
    await page.getByRole("heading", { name: "Reports", level: 1 }).waitFor();
    await page.getByRole("button", { name: "Refresh report" }).click();
    await page.getByText("Revenue", { exact: true }).waitFor();
    await page.getByText("Occupied rooms", { exact: true }).waitFor();
    await page.getByText("Daily occupancy", { exact: true }).waitFor();
    await page.getByLabel("Report start").fill("2026-09-02");
    await page.getByLabel("Report end").fill("2026-09-02");
    await page.getByRole("button", { name: "Refresh report" }).click();
    const reportOverflow = await page.evaluate(() => [...document.querySelectorAll("*")].map(el => ({ tag: el.tagName, cls: (el.getAttribute("class") || "").slice(0,40), right: Math.round(el.getBoundingClientRect().right), width: Math.round(el.getBoundingClientRect().width) })).filter(x => x.right > innerWidth + 1).slice(-8));
    if (await page.evaluate(() => document.documentElement.scrollWidth) > width) throw new Error(`reports overflow ${width}: ${JSON.stringify(reportOverflow)}`);
  }
  await page.setExtraHTTPHeaders({ "x-local-access-subject": "subject-a", "x-local-access-email": "a@test", "x-hotel-id": "hotel-a" });
  const continuity = await page.evaluate(async () => {
    const mutation = await fetch("/api/v1/housekeeping/room-a1/maintenance", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ reason: "Browser continuity maintenance check", priority: "HIGH", assigned_to: "ops" }) });
    return { status: mutation.status, stage: "housekeeping-maintenance", body: await mutation.json() };
  });
  if (continuity.status !== 201 || continuity.body.room_id !== "room-a1" || continuity.body.status !== "Open") throw new Error(`cross-module mutation failed: ${JSON.stringify(continuity)}`);
  for (const [index, [width, height]] of viewports.entries()) {
    await page.setViewportSize({ width, height }); if (index === 0) { await page.goto("http://127.0.0.1:4175/rooms"); await page.getByRole("heading", { name: "Rooms", level: 1 }).waitFor(); const room = page.getByRole("button", { name: /Room 101/ }); await room.waitFor(); await room.click(); await page.waitForURL(/room_id=room-a1/); }
    const dimensions = page.locator(".rooms-state-grid > div"); await dimensions.first().waitFor(); if (await dimensions.count() !== 5) throw new Error(`Rooms must expose five independent state/readiness dimensions, got ${await dimensions.count()}`);
    if (await page.evaluate(() => document.documentElement.scrollWidth) > width) throw new Error(`integrated Rooms overflow ${width}`);
  }
  await page.setExtraHTTPHeaders({ "x-local-access-subject": "subject-network", "x-local-access-email": "network@test" });
  for (const [index, [width, height]] of viewports.entries()) {
    await page.setViewportSize({ width, height }); if (index === 0) { await page.goto("http://127.0.0.1:4175/network"); await page.locator(".workspace-heading").getByRole("heading", { name: "Hotel network", level: 2 }).waitFor(); }
    await page.getByText("Total hotels", { exact: true }).waitFor(); await page.getByText("Revenue ranking", { exact: true }).waitFor(); await page.getByText("Hotel A", { exact: true }).first().waitFor(); await page.getByText("Hotel B", { exact: true }).first().waitFor();
    await page.getByLabel("Network report start").fill("2026-09-02");
    await page.getByLabel("Network report end").fill("2026-09-02");
    await page.getByRole("button", { name: "Refresh analytics" }).click();
    await page.getByText("Hotel B", { exact: true }).last().waitFor();
    if (await page.evaluate(() => document.documentElement.scrollWidth) > width) throw new Error(`network overflow ${width}`);
  }
  await page.setExtraHTTPHeaders({ "x-local-access-subject": "subject-hk", "x-local-access-email": "hk@test", "x-hotel-id": "hotel-a" }); await page.goto("http://127.0.0.1:4175/reports"); await page.getByRole("status").filter({ hasText: "Destination unavailable" }).waitFor(); if (await page.locator(".reports-operational").count()) throw new Error("server-denied Reports route rendered operational content");
  await page.screenshot({ path: "output/playwright/cf-i08-integrated.png", fullPage: true }); return viewports;
})()
