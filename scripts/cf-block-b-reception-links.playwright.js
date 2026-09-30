page => (async () => {
  await page.unrouteAll({ behavior: "wait" });
  await page.addInitScript(() => localStorage.setItem("hms.locale", "en"));
  await page.route("**/api/v1/**", route => {
    const source = new URL(route.request().url());
    const headers = { ...route.request().headers(), "x-local-access-subject": "source-user:14000000-0000-0000-0000-000000000001", "x-local-access-email": "ana-admin@migration.invalid", "x-hotel-id": "10000000-0000-0000-0000-000000000001", "x-hms-test-delay": "0" };
    return route.continue({ url: `http://127.0.0.1:8787/api/v1${source.pathname.split("/api/v1").at(-1)}${source.search}`, headers });
  });
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  const origin = "http://127.0.0.1:4181";
  const nextArrival = () => page.locator(".reception-booking-case h3").filter({ hasText: "Next Arrival" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${origin}/bookings?lane=arrivals&q=Priority&origin=block-b&booking_id=a-next#queue`);
  await nextArrival().waitFor({ state: "visible" });
  await page.reload();
  await nextArrival().waitFor({ state: "visible" });
  const deepLink = new URL(page.url());
  assert(deepLink.searchParams.get("booking_id") === "a-next" && deepLink.searchParams.get("origin") === "block-b" && deepLink.hash === "#queue", `Direct link/reload lost case identity or context: ${page.url()}`);
  await page.unrouteAll({ behavior: "wait" });
  return { directLink: "PASS", reload: "PASS", selectedIdentity: "a-next", filterSearchOriginHashPreserved: true };
})()
