page => (async () => {
  const origin = "http://127.0.0.1:4177";
  const apiOrigin = "http://127.0.0.1:8787";
  const localHeaders = {
    "x-local-access-subject": "source-user:14000000-0000-0000-0000-000000000001",
    "x-local-access-email": "ana-admin@migration.invalid",
    "x-hotel-id": "10000000-0000-0000-0000-000000000001",
  };
  await page.context().route("**/api/v1/**", async route => {
    const source = new URL(route.request().url());
    const target = `${apiOrigin}${source.pathname}${source.search}`;
    const headers = { ...route.request().headers(), ...localHeaders };
    return route.continue({ url: target, headers });
  });
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(`${origin}/rooms`);
  await page.locator(".language-selector select").selectOption("en");
  try { await page.getByRole("heading", { name: "Rooms", level: 2 }).waitFor({ timeout: 5000 }); }
  catch {
    const diagnostic = await page.evaluate(() => ({ title: document.title, body: document.body.innerText, root: document.querySelector("#root")?.innerHTML.slice(0, 2000) }));
    await page.screenshot({ path: "output/playwright/f0-11-built-debug.png", fullPage: true });
    throw new Error(`minified UI did not render Rooms: ${JSON.stringify(diagnostic)}`);
  }
  const search = page.getByLabel("Search rooms");
  await search.fill("711");
  await page.getByRole("button", { name: "Manage rooms" }).click();
  const form = page.locator(".rooms-create-form");
  await form.getByLabel("Room number").fill("711");
  await form.getByLabel("Room type").fill("STANDARD");
  await form.getByLabel("Price in cents").fill("1000");
  const created = page.waitForResponse(response => response.url().endsWith("/api/v1/rooms") && response.request().method() === "POST");
  const authoritative = page.waitForResponse(response => response.url().endsWith("/api/v1/rooms") && response.request().method() === "GET" && response.status() === 200);
  await form.getByRole("button", { name: "Add room" }).click();
  const mutationResponse = await created;
  if (mutationResponse.status() !== 201) throw new Error(`built UI room create returned ${mutationResponse.status()}`);
  const boardResponse = await authoritative;
  const rooms = await boardResponse.json();
  if (!rooms.some(room => room.room_number === "711" && room.price_cents === 1000)) throw new Error("built UI authoritative D1-backed Rooms read omitted room 711");
  await page.getByRole("button", { name: /Room 711/ }).waitFor();
  if (await search.inputValue() !== "711") throw new Error("built UI mutation refresh lost Rooms search context");
  await page.screenshot({ path: "output/playwright/f0-11-built-rooms-mobile.png", fullPage: true });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.getByRole("button", { name: "Refresh", exact: true }).click();
  await page.getByRole("button", { name: /Room 711/ }).waitFor();
  if (await search.inputValue() !== "711") throw new Error("built UI desktop refresh lost Rooms search context");
  await page.screenshot({ path: "output/playwright/f0-11-built-rooms-desktop.png", fullPage: true });
  return { minifiedBundle: true, localWorkerD1: true, mutation: mutationResponse.status(), authoritativeRead: boardResponse.status(), room: "711", viewports: ["375x812", "1280x900"], preservedSearch: await search.inputValue() };
})()
