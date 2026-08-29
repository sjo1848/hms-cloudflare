(page) => (async () => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("http://127.0.0.1:4174/bookings");
  await page.getByRole("heading", { name: "Booking case workspace", exact: true }).waitFor();

  const marker = `nav-${Date.now()}-${Math.random()}`;
  await page.evaluate(value => { window.__hmsNavigationMarker = value; }, marker);

  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("dialog", { name: "Mobile navigation" }).getByRole("link", { name: /Housekeeping/ }).click();
  await page.waitForURL("**/housekeeping");
  await page.getByRole("heading", { name: "Housekeeping board", exact: true }).waitFor();
  const markerAfterHousekeeping = await page.evaluate(() => window.__hmsNavigationMarker);
  if (markerAfterHousekeeping !== marker) throw new Error("Internal navigation reloaded the document on mobile");

  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("dialog", { name: "Mobile navigation" }).getByRole("link", { name: /Rooms/ }).click();
  await page.waitForURL("**/rooms");
  await page.getByRole("heading", { name: "Rooms", exact: true }).waitFor();
  const markerAfterRooms = await page.evaluate(() => window.__hmsNavigationMarker);
  if (markerAfterRooms !== marker) throw new Error("Second internal navigation reloaded the document on mobile");

  await page.goBack();
  await page.getByRole("heading", { name: "Housekeeping board", exact: true }).waitFor();
  const markerAfterBack = await page.evaluate(() => window.__hmsNavigationMarker);
  if (markerAfterBack !== marker) throw new Error("Browser back caused a document reload");

  await page.setViewportSize({ width: 1366, height: 812 });
  await page.getByRole("link", { name: /Reports/ }).click();
  await page.waitForURL("**/reports");
  await page.getByRole("heading", { name: "Reports", exact: true }).waitFor();
  const markerAfterDesktop = await page.evaluate(() => window.__hmsNavigationMarker);
  if (markerAfterDesktop !== marker) throw new Error("Desktop internal navigation reloaded the document");

  return { navigationContinuity: "PASS", locale: "en", mobile: true, desktop: true, history: true };
})()