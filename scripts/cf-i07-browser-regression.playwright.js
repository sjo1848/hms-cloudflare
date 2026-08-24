(page) => (async () => {
  const widths = [375, 390, 430, 768, 1024];
  await page.setExtraHTTPHeaders({ "x-local-access-subject": "subject-a", "x-local-access-email": "a@test.com", "x-hotel-id": "hotel-a" });
  await page.goto("http://127.0.0.1:4174/users");
  await page.getByRole("heading", { name: "Users administration" }).waitFor();
  for (const width of widths) {
    const subject = `subject-browser-${width}`;
    const email = `browser-${width}@example.com`;
    await page.setViewportSize({ width, height: 812 });
    await page.waitForTimeout(100);
    if (await page.evaluate(() => document.documentElement.scrollWidth) > width) throw new Error(`users overflow ${width}`);
    await page.getByRole("textbox", { name: "Search users" }).fill("@");
    await page.getByRole("button", { name: "View details" }).first().click();
    await page.getByRole("dialog").waitFor();
    await page.getByRole("button", { name: "Close details" }).click();
    await page.getByRole("textbox", { name: "Access subject" }).fill(subject);
    await page.getByRole("textbox", { name: "User email" }).fill(email);
    await page.getByRole("button", { name: "Create user" }).click();
    await page.getByRole("status").filter({ hasText: "User membership created" }).waitFor();
    await page.getByRole("textbox", { name: "Access subject" }).fill(subject);
    await page.getByRole("textbox", { name: "User email" }).fill(email);
    await page.getByRole("button", { name: "Create user" }).click();
    const visibleError = page.getByRole("alert");
    await visibleError.waitFor();
    if (!(await visibleError.innerText()).trim()) throw new Error(`create error was not user-visible at ${width}`);
    await page.getByRole("textbox", { name: "Search users" }).fill(subject);
    const opener = page.getByRole("button", { name: "View details" }).first();
    await opener.click();
    await page.getByRole("dialog").waitFor();
    const role = page.getByRole("combobox", { name: `Role for ${email}` });
    await role.selectOption("ops");
    await page.getByRole("status").filter({ hasText: "Role updated" }).waitFor();
    if (await role.inputValue() !== "ops") throw new Error(`role did not commit at ${width}`);
    await page.reload();
    await page.getByRole("heading", { name: "Users administration" }).waitFor();
    await page.getByRole("textbox", { name: "Search users" }).fill(subject);
    await opener.click();
    if (await page.getByRole("combobox", { name: `Role for ${email}` }).inputValue() !== "ops") throw new Error(`role did not persist at ${width}`);
    page.once("dialog", dialog => dialog.accept());
    await page.getByRole("button", { name: "Deactivate user" }).click();
    await page.getByRole("status").filter({ hasText: "Membership deactivated" }).waitFor();
    if (!(await page.evaluate(() => document.activeElement?.textContent?.includes("View details")))) throw new Error(`focus did not return at ${width}`);
  }
  await page.setExtraHTTPHeaders({ "x-local-access-subject": "subject-hk", "x-local-access-email": "hk@test.com", "x-hotel-id": "hotel-a" });
  const membership = await page.evaluate(async () => (await fetch("/api/v1/auth/me")).json());
  if (membership?.role !== "housekeeping" || membership?.hotel_id !== "hotel-a") throw new Error("housekeeping membership fixture was not established");
  await page.goto("http://127.0.0.1:4174/users");
  await page.getByRole("alert").filter({ hasText: "Forbidden" }).waitFor();
  await page.setExtraHTTPHeaders({ "x-local-access-subject": "subject-network", "x-local-access-email": "network@test.com" });
  await page.goto("http://127.0.0.1:4174/network");
  await page.getByRole("heading", { name: "Hotel network" }).waitFor();
  for (const width of widths) {
    await page.setViewportSize({ width, height: 812 });
    await page.waitForTimeout(100);
    if (await page.evaluate(() => document.documentElement.scrollWidth) > width) throw new Error(`network overflow ${width}`);
    await page.getByRole("button", { name: /Hotel A/ }).click();
    const plan = page.getByRole("combobox", { name: "Property plan" });
    await plan.selectOption((await plan.inputValue()) === "PRO" ? "BASIC" : "PRO");
    await page.getByRole("status").filter({ hasText: "Plan updated" }).waitFor();
  }
  await page.screenshot({ path: "output/playwright/cf-i07-admin.png", fullPage: true });
  return widths;
})()
