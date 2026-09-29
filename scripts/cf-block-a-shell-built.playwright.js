(page) => (async () => {
  const web = "http://127.0.0.1:4179";
  const identity = {
    "x-local-access-subject": "source-user:14000000-0000-0000-0000-000000000001",
    "x-local-access-email": "ana-admin@migration.invalid",
    "x-hotel-id": "10000000-0000-0000-0000-000000000001",
  };
  await page.setExtraHTTPHeaders(identity);
  await page.route("**/api/v1/**", async route => {
    const url = new URL(route.request().url());
    const response = await route.fetch({ url: `http://127.0.0.1:8787${url.pathname}${url.search}` });
    await route.fulfill({ response });
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${web}/bookings?view=arrivals&search=built-marker#queue-top`);
  await page.getByRole("heading", { name: "Reception", level: 1 }).waitFor();
  for (const group of ["Hotel operations", "Directory", "Insights", "Hotel administration", "Platform administration"]) {
    await page.getByRole("heading", { name: group }).waitFor();
  }
  await page.screenshot({ path: "output/playwright/block-a-built-wide.png", fullPage: true });
  await page.getByRole("link", { name: /Rooms/ }).click();
  await page.waitForURL("**/rooms");
  await page.goBack();
  await page.waitForURL("**/bookings?view=arrivals&search=built-marker#queue-top");
  await page.getByRole("heading", { name: "Reception", level: 1 }).waitFor();
  const receptionist = {
    "x-local-access-subject": "source-user:14000000-0000-0000-0000-000000000002",
    "x-local-access-email": "leo-reception@migration.invalid",
    "x-hotel-id": "10000000-0000-0000-0000-000000000001",
  };
  await page.setExtraHTTPHeaders(receptionist);
  await page.goto(`${web}/users`);
  await page.getByRole("heading", { name: "Destination unavailable" }).waitFor();
  if (await page.getByRole("link", { name: /Users/ }).count()) throw new Error("production bundle exposed Users without server capability");

  await page.setExtraHTTPHeaders(identity);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${web}/bookings`);
  await page.getByRole("heading", { name: "Reception", level: 1 }).waitFor();
  const primary = page.getByRole("navigation", { name: "Primary navigation" });
  for (const name of ["Reception", "Rooms", "Housekeeping"]) await primary.getByRole("link", { name: new RegExp(name) }).waitFor({ state: "visible" });
  const more = page.getByRole("button", { name: "More" });
  await more.click();
  const dialog = page.getByRole("dialog", { name: "More destinations" });
  await dialog.waitFor();
  for (const name of ["Guests", "Reports", "Users", "Network"]) await dialog.getByRole("link", { name: new RegExp(name) }).waitFor({ state: "visible" });
  await page.screenshot({ path: "output/playwright/block-a-built-mobile-more.png", fullPage: true });
  await page.keyboard.press("Escape");
  await dialog.waitFor({ state: "hidden" });
  if (!await more.evaluate(element => document.activeElement === element)) throw new Error("production bundle failed More focus restoration");
  return {
    bundle: "Vite production/minified asset",
    worker: "local Worker with disposable D1; API traffic forwarded without mocks",
    desktop: "1440x900; grouped navigation, direct route, Back/query/hash PASS",
    capabilityGuard: "same local Worker /auth/me; Users denied for receptionist PASS",
    mobile: "390x844; primary + More + Escape/focus PASS",
  };
})()
