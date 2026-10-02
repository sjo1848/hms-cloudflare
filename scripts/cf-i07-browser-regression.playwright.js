(page) => (async () => {
  const widths = [375, 390, 430, 768, 1024];
  await page.setExtraHTTPHeaders({ "x-local-access-subject": "subject-a", "x-local-access-email": "a@test.com", "x-hotel-id": "hotel-a" });
  await page.addInitScript(() => localStorage.setItem("hms.locale", "en"));
  await page.goto("http://127.0.0.1:4196/users");
  await page.getByRole("heading", { name: "Users administration" }).waitFor();
  for (const width of widths) {
    const subject = `subject-browser-${width}`;
    const email = `browser-${width}@example.com`;
    await page.setViewportSize({ width, height: 812 });
    await page.waitForTimeout(100);
    if (await page.evaluate(() => document.documentElement.scrollWidth) > width) throw new Error(`users overflow ${width}`);
    await page.getByRole("textbox", { name: "Search users" }).fill("@");
    await page.getByRole("button", { name: "View details" }).first().click();
    const details = page.getByRole("region", { name: "User details" });
    await details.waitFor();
    await details.getByRole("button", { name: "Close details" }).click();
    await page.getByRole("button", { name: "Create membership" }).click();
    await page.getByRole("textbox", { name: "Access subject" }).fill(subject);
    await page.getByRole("textbox", { name: "Email", exact: true }).fill(email);
    await page.getByRole("button", { name: "Create user" }).click();
    await page.getByRole("status").filter({ hasText: "User membership created" }).waitFor();
    await page.getByRole("button", { name: "Create membership" }).click();
    await page.getByRole("textbox", { name: "Access subject" }).fill(subject);
    await page.getByRole("textbox", { name: "Email", exact: true }).fill(email);
    await page.getByRole("button", { name: "Create user" }).click();
    const visibleError = page.getByRole("alert");
    await visibleError.waitFor();
    if (!(await visibleError.innerText()).trim()) throw new Error(`create error was not user-visible at ${width}`);
    await page.getByRole("textbox", { name: "Search users" }).fill(subject);
    const opener = page.getByRole("button", { name: "View details" }).first();
    await opener.click();
    await page.getByRole("region", { name: "User details" }).waitFor();
    const role = page.getByRole("combobox", { name: `Role for ${email}` });
    await role.selectOption("admin");
    await page.getByRole("status").filter({ hasText: "Role updated" }).waitFor();
    if (await role.inputValue() !== "admin") throw new Error(`role did not commit at ${width}`);
    await page.reload();
    await page.getByRole("heading", { name: "Users administration" }).waitFor();
    await page.getByRole("textbox", { name: "Search users" }).fill(subject);
    await opener.click();
    if (await page.getByRole("combobox", { name: `Role for ${email}` }).inputValue() !== "admin") throw new Error(`role did not persist at ${width}`);
    const deactivateButton = page.getByRole("button", { name: "Deactivate user" });
    await deactivateButton.evaluate(element => element.scrollIntoView({ block: "center", inline: "nearest" }));
    await deactivateButton.click();
    const confirmation = page.getByRole("dialog", { name: "Deactivate user" });
    await confirmation.waitFor();
    if (width === 375) {
      if (!(await confirmation.getByRole("button", { name: "Cancel", exact: true }).evaluate(element => element === document.activeElement))) throw new Error("deactivation task did not place keyboard focus on its safe action");
      await page.keyboard.press("Escape");
      await confirmation.waitFor({ state: "hidden" });
      await page.waitForFunction(() => document.activeElement?.textContent?.includes("View details"));
      await page.getByRole("button", { name: "Deactivate user" }).click();
      await confirmation.waitFor();
      await page.route("**/api/v1/users/subject-browser-375", route => route.fulfill({ status: 409, contentType: "application/json", body: JSON.stringify({ error: { message: "Synthetic deactivation conflict" } }) }));
      await confirmation.getByRole("button", { name: "Deactivate", exact: true }).click();
      await confirmation.waitFor({ state: "hidden" });
      await page.getByRole("alert").filter({ hasText: "Synthetic deactivation conflict" }).waitFor();
      if (!(await page.getByRole("button", { name: "Deactivate user" }).count())) throw new Error("409 conflict hid the still-active membership or prevented retry");
      await page.unroute("**/api/v1/users/subject-browser-375");
      await page.getByRole("button", { name: "Deactivate user" }).click();
      await confirmation.waitFor();
    }
    await confirmation.getByRole("button", { name: "Deactivate", exact: true }).click();
    await page.getByRole("status").filter({ hasText: "Membership deactivated" }).waitFor();
    await page.waitForFunction(() => document.activeElement?.getAttribute("aria-label") === "Search users", null, { timeout: 3000 }).catch(async () => { throw new Error(`focus did not return to a connected context control at ${width}; active=${await page.evaluate(() => document.activeElement?.outerHTML)}`); });
  }
  await page.setExtraHTTPHeaders({ "x-local-access-subject": "subject-hk", "x-local-access-email": "hk@test.com", "x-hotel-id": "hotel-a" });
  const membership = await page.evaluate(async () => (await fetch("/api/v1/auth/me")).json());
  if (membership?.role !== "housekeeping" || membership?.hotel_id !== "hotel-a") throw new Error("housekeeping membership fixture was not established");
  await page.goto("http://127.0.0.1:4196/users");
  await page.getByRole("status").filter({ hasText: "Destination unavailable" }).waitFor();
  if (await page.getByRole("heading", { name: "Users administration" }).count()) throw new Error("housekeeping member could access the users administration route");
  await page.setExtraHTTPHeaders({ "x-local-access-subject": "subject-network", "x-local-access-email": "network@test.com" });
  await page.goto("http://127.0.0.1:4196/network");
  await page.getByRole("heading", { name: "Hotel network" }).waitFor();
  for (const width of widths) {
    await page.setViewportSize({ width, height: 812 });
    await page.waitForTimeout(100);
    if (await page.evaluate(() => document.documentElement.scrollWidth) > width) throw new Error(`network overflow ${width}`);
    await page.getByRole("button", { name: /Hotel A/ }).click();
    const plan = page.getByRole("combobox", { name: "Property plan" });
    const targetPlan = (await plan.inputValue()) === "PRO" ? "BASIC" : "PRO";
    const planResponsePromise = page.waitForResponse(response => /\/api\/v1\/hotels\/hotel-a\/plan$/.test(new URL(response.url()).pathname));
    await plan.selectOption(targetPlan);
    const planResponse = await planResponsePromise;
    if (planResponse.status() !== 200) throw new Error(`plan change failed at ${width}: HTTP ${planResponse.status()} ${await planResponse.text()}`);
    await page.waitForFunction(expected => document.querySelector('[aria-label="Property plan"]')?.value === expected, targetPlan);
  }
  await page.setExtraHTTPHeaders({ "x-local-access-subject": "subject-a", "x-local-access-email": "a@test.com", "x-hotel-id": "hotel-a" });
  await page.goto("http://127.0.0.1:4196/reports");
  await page.getByRole("heading", { name: "Reports", level: 1 }).waitFor();
  for (const [width, height] of [[1440, 900], [1024, 768], [375, 812], [812, 375], [375, 360]]) {
    await page.setViewportSize({ width, height });
    await page.getByLabel("Report start", { exact: true }).fill("2026-09-01");
    await page.getByLabel("Report end", { exact: true }).fill("2026-09-02");
    const revenuePromise = page.waitForResponse(response => new URL(response.url()).pathname === "/api/v1/reports/revenue");
    const occupancyPromise = page.waitForResponse(response => new URL(response.url()).pathname === "/api/v1/reports/occupancy");
    await page.getByRole("button", { name: "Refresh report" }).click();
    const [revenueResponse, occupancyResponse] = await Promise.all([revenuePromise, occupancyPromise]);
    for (const response of [revenueResponse, occupancyResponse]) {
      const url = new URL(response.url());
      if (response.status() !== 200 || url.searchParams.get("start") !== "2026-09-01" || url.searchParams.get("end") !== "2026-09-02") throw new Error(`report request did not return authoritative selected range: ${response.status()} ${url}`);
    }
    if (await page.evaluate(() => document.documentElement.scrollWidth) > width) throw new Error(`reports overflow ${width}x${height}`);
  }
  await page.getByLabel("Report start", { exact: true }).fill("2026-09-03");
  await page.getByLabel("Report end", { exact: true }).fill("2026-09-02");
  await page.getByRole("button", { name: "Refresh report" }).click();
  await page.getByRole("alert").filter({ hasText: "The end date cannot be earlier" }).waitFor();
  await page.screenshot({ path: "output/playwright/cf-i07-admin.png", fullPage: true });
  return { adminNetworkWidths: widths, reportsWidths: [[1440, 900], [1024, 768], [375, 812], [812, 375], [375, 360]], reportApi: "actual local Worker/D1 200 for revenue and occupancy" };
})()
