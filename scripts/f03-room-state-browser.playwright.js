(page) => (async () => {
  const desktop = { width: 1280, height: 800 };
  await page.setViewportSize(desktop);
  const roomsResponse = page.waitForResponse(response => response.url().includes("/api/v1/rooms") && response.status() === 200);
  await page.goto("http://127.0.0.1:4176/rooms");
  await page.getByRole("heading", { name: "Habitaciones", level: 1 }).waitFor();
  await page.locator(".header-context").getByText("Hotel Norte").waitFor();
  const response = await roomsResponse;
  const rooms = await response.json();
  if (rooms.length !== 3 || rooms.some(room => room.operational_state?.readiness.state !== "UNRESOLVED")) {
    throw new Error(`Expected three unresolved synthetic room states from Worker/D1, got ${JSON.stringify(rooms.map(room => [room.id, room.operational_state?.readiness.state]))}`);
  }
  await page.getByText("Estado de habitación sin confirmar", { exact: true }).first().waitFor();
  const readyCount = await page.locator(".rooms-status-strip strong").first().textContent();
  if (readyCount?.trim() !== "0") throw new Error(`Unresolved legacy rooms were counted ready: ${readyCount}`);
  await page.screenshot({ path: "output/playwright/f03-rooms-desktop.png", fullPage: true });
  await page.locator(".room-operational-select").filter({ hasText: "101" }).click();
  await page.locator(".rooms-detail").getByText("Estado de habitación sin confirmar", { exact: true }).waitFor();
  await page.screenshot({ path: "output/playwright/f03-rooms-desktop-selected.png", fullPage: true });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("heading", { name: "Habitaciones", level: 1 }).waitFor();
  await page.getByText("Estado de habitación sin confirmar", { exact: true }).first().waitFor();
  await page.screenshot({ path: "output/playwright/f03-rooms-mobile.png", fullPage: true });
  const mobileCard = page.locator(".room-operational-select").filter({ hasText: "101" });
  if (!(await mobileCard.isVisible())) throw new Error("Room 101 readiness is not visible at narrow viewport");
  await mobileCard.getByText("Estado de habitación sin confirmar", { exact: true }).waitFor();
  return {
    api: "real local Worker + D1",
    rooms: rooms.length,
    unresolved: rooms.filter(room => room.operational_state.readiness.state === "UNRESOLVED").length,
    readyMetric: readyCount?.trim(),
    desktop: "PASS",
    mobile: "PASS",
    screenshots: ["f03-rooms-desktop.png", "f03-rooms-desktop-selected.png", "f03-rooms-mobile.png"],
  };
})()
