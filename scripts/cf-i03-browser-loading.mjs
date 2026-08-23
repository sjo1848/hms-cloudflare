async page => {
  await page.unroute("**/api/v1/**");
  await page.route("**/api/v1/**", async route => {
    if (route.request().url().includes("/bookings")) {
      await page.waitForTimeout(10000);
      return route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
    }
    return route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
  });
  const navigation = page.goto("http://127.0.0.1:4173/bookings", { waitUntil: "commit" });
  await page.getByRole("heading", { name: "Bookings" }).waitFor();
  if ((await page.locator('[role="status"]').count()) === 0) throw new Error("loading state was not observable");
  await page.screenshot({ path: "output/playwright/cf-i03-bookings-loading.png", fullPage: true });
  await navigation.catch(() => undefined);
  console.log("CF-I03 browser loading PASS");
}
