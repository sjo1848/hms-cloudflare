(page) => (async () => {
  const widths = [375, 390, 430, 1366];
  const assertNoOverflow = async (name, width) => {
    if (await page.evaluate(() => document.documentElement.scrollWidth) > width) throw new Error(name + " overflow at " + width);
  };
  const reports = async (width) => {
    await page.setViewportSize({ width, height: 812 });
    await page.goto("http://127.0.0.1:4174/reports");
    await page.getByRole("status").filter({ hasText: "Loading reports" }).waitFor({ state: "attached", timeout: 1500 }).catch(() => {});
    await page.getByRole("heading", { name: "Reports" }).waitFor();
    await page.getByText("Daily occupancy", { exact: true }).waitFor();
    await assertNoOverflow("Reports", width);
    await page.getByLabel("Report start").fill("2026-09-02");
    await page.getByLabel("Report end").fill("2026-09-01");
    await page.getByRole("button", { name: "Refresh report" }).click();
    await page.getByRole("alert").waitFor();
    await page.getByRole("button", { name: "Retry" }).waitFor();
    await page.getByLabel("Report start").fill("2026-12-01");
    await page.getByLabel("Report end").fill("2026-12-02");
    await page.getByRole("button", { name: "Retry" }).click();
    await page.getByText("No report data in this range").waitFor();
    await page.getByLabel("Report start").fill("2026-09-01");
    await page.getByLabel("Report end").fill("2026-10-01");
    await page.getByRole("button", { name: "Refresh report" }).click();
    await page.getByText("Daily occupancy", { exact: true }).waitFor();
    await assertNoOverflow("Reports retry", width);
  };
  const users = async (width) => {
    await page.setViewportSize({ width, height: 812 });
    await page.goto("http://127.0.0.1:4174/users");
    await page.getByRole("heading", { name: "Users administration" }).waitFor();
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
    await page.goto("http://127.0.0.1:4174/network");
    await page.getByRole("heading", { name: "Hotel network" }).waitFor();
    await page.getByText("Total hotels", { exact: true }).waitFor();
    await page.getByRole("button", { name: /Hotel Norte/ }).click();
    const plan = page.getByRole("combobox", { name: "Property plan" });
    await plan.selectOption((await plan.inputValue()) === "PRO" ? "BASIC" : "PRO");
    await page.getByRole("status").filter({ hasText: "Plan updated" }).waitFor();
    await page.getByRole("button", { name: "Refresh analytics" }).click();
    await page.getByText("Revenue ranking", { exact: true }).waitFor();
    await assertNoOverflow("Network", width);
  };
  await page.setExtraHTTPHeaders({ "x-local-access-subject": "subject-admin", "x-local-access-email": "admin@example.test", "x-hotel-id": "hotel-a" });
  for (const width of widths) await reports(width);
  for (const width of widths) await users(width);
  await page.setExtraHTTPHeaders({ "x-local-access-subject": "subject-network", "x-local-access-email": "network@test.com" });
  for (const width of widths) await network(width);
  await page.screenshot({ path: "output/playwright/cf-ux-admin.png", fullPage: true });
  return { widths, surfaces: ["Reports", "Users", "Network"], states: ["loading", "error", "empty", "retry", "success"], mockApi: false };
})()
