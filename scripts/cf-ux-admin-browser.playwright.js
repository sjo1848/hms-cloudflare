(page) => (async () => {
  const widths = [375, 390, 430, 1366];
  const assertNoOverflow = async (name, width) => {
    if (await page.evaluate(() => document.documentElement.scrollWidth) > width) throw new Error(name + " overflow at " + width);
  };
  const delayRealApi = async (pattern) => {
    await page.route(pattern, async route => {
      await new Promise(resolve => setTimeout(resolve, 250));
      await route.fallback();
    });
  };
  const reports = async (width) => {
    await page.setViewportSize({ width, height: 812 });
    await delayRealApi("**/api/v1/reports/**");
    await page.goto("http://127.0.0.1:4174/reports");
    await page.getByRole("status").filter({ hasText: "Loading reports" }).waitFor();
    await page.getByRole("heading", { name: "Reports" }).waitFor();
    await page.getByText("Daily occupancy", { exact: true }).waitFor();
    await page.unroute("**/api/v1/reports/**");
    await assertNoOverflow("Reports", width);

    await page.getByLabel("Report start").fill("2026-09-02");
    await page.getByLabel("Report end").fill("2026-09-01");
    await page.getByRole("button", { name: "Refresh report" }).click();
    await page.getByRole("alert").waitFor();
    await page.getByRole("button", { name: "Retry" }).waitFor();

    await page.getByLabel("Report start").fill("2026-12-01");
    await page.getByLabel("Report end").fill("2026-12-02");
    await page.getByRole("button", { name: "Retry" }).click();
    const zeroOccupancyCard = page.getByText("Daily occupancy", { exact: true }).locator("..");
    await zeroOccupancyCard.getByText("2026-12-01", { exact: true }).waitFor();
    await page.getByText("Occupied rooms", { exact: true }).locator("..").getByText("0", { exact: true }).waitFor();
    await zeroOccupancyCard.getByText(/^0\/\d+ · 0\.00%$/).first().waitFor();

    await page.getByLabel("Report start").fill("2026-09-01");
    await page.getByLabel("Report end").fill("2026-10-01");
    await page.getByRole("button", { name: "Refresh report" }).click();
    const refreshedOccupancyCard = page.getByText("Daily occupancy", { exact: true }).locator("..");
    await refreshedOccupancyCard.getByText("2026-09-02", { exact: true }).waitFor();
    await assertNoOverflow("Reports retry", width);
  };
  const users = async (width) => {
    await page.setViewportSize({ width, height: 812 });
    await delayRealApi("**/api/v1/users**");
    await page.goto("http://127.0.0.1:4174/users");
    await page.getByRole("status").filter({ hasText: "Loading users" }).waitFor();
    await page.getByRole("heading", { name: "Users administration" }).waitFor();
    await page.unroute("**/api/v1/users**");
    await page.getByLabel("Search users").fill("not-present");
    await page.getByText("No users match this search").waitFor();
    await page.getByLabel("Search users").fill("@");
    await page.getByRole("button", { name: "View details" }).first().click();
    await page.getByRole("dialog").waitFor();
    await page.getByRole("button", { name: "Close details" }).click();
    await assertNoOverflow("Users", width);
  };
  const network = async (width) => {
    await page.setViewportSize({ width, height: 812 });
    await delayRealApi("**/api/v1/hotels**");
    await page.goto("http://127.0.0.1:4174/network");
    await page.getByRole("status").filter({ hasText: "Loading hotel network" }).waitFor();
    await page.getByRole("heading", { name: "Hotel network" }).waitFor();
    await page.getByText("Total hotels", { exact: true }).waitFor();
    await page.unroute("**/api/v1/hotels**");

    await page.getByLabel("Filter properties").fill("definitely-not-present");
    await page.getByText("No properties match this filter").waitFor();
    await page.getByLabel("Filter properties").fill("");
    await page.getByRole("button", { name: /Hotel Norte/ }).click();
    const plan = page.getByRole("combobox", { name: "Property plan" });
    const initialPlan = await plan.inputValue();
    const acceptedPlan = initialPlan === "PRO" ? "BASIC" : "PRO";
    await plan.selectOption(acceptedPlan);
    await page.getByRole("status").filter({ hasText: "Plan updated" }).waitFor();
    await plan.waitFor();
    const authoritativePlan = await plan.inputValue();
    if (authoritativePlan !== acceptedPlan) throw new Error(`Network accepted plan mismatch: ${authoritativePlan} != ${acceptedPlan}`);

    await page.route("**/api/v1/hotels/*/plan", async route => {
      await route.fulfill({ status: 409, contentType: "application/json", body: JSON.stringify({ error: { message: "Synthetic concurrent plan conflict" } }) });
    });
    const rejectedPlan = authoritativePlan === "PRO" ? "BASIC" : "PRO";
    await plan.selectOption(rejectedPlan);
    await page.getByRole("alert").filter({ hasText: "Synthetic concurrent plan conflict" }).waitFor();
    await page.waitForTimeout(50);
    const restoredPlan = await plan.inputValue();
    if (restoredPlan !== authoritativePlan) throw new Error(`Network rejected plan drifted: ${restoredPlan} != ${authoritativePlan}`);
    await page.unroute("**/api/v1/hotels/*/plan");

    await page.getByRole("button", { name: "Refresh analytics" }).click();
    await page.getByText("Revenue ranking", { exact: true }).waitFor();
    await assertNoOverflow("Network", width);
  };
  await page.setExtraHTTPHeaders({ "x-local-access-subject": "source-user:subject-admin", "x-local-access-email": "admin@example.test", "x-hotel-id": "hotel-a" });
  for (const width of widths) await reports(width);
  for (const width of widths) await users(width);
  await page.setExtraHTTPHeaders({ "x-local-access-subject": "source-user:subject-network", "x-local-access-email": "network@test.com" });
  for (const width of widths) await network(width);
  await page.screenshot({ path: "output/playwright/cf-ux-admin.png", fullPage: true });
  return { widths, surfaces: ["Reports", "Users", "Network"], states: ["loading", "error", "empty-or-zero-data", "retry", "success"], mockApi: false, negativeTransportInjection: "Network plan 409 only" };
})()
