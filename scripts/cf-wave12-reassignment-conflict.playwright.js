(page) => (async () => {
  await page.addInitScript(() => { localStorage.setItem("hms.locale", "en"); localStorage.setItem("hms-local-acceptance-profile", "0"); });
  await page.setExtraHTTPHeaders({ "x-local-access-subject": "source-user:14000000-0000-0000-0000-000000000002", "x-local-access-email": "leo-reception@migration.invalid", "x-hotel-id": "10000000-0000-0000-0000-000000000001" });
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("http://127.0.0.1:4174/bookings"); await page.getByRole("heading", { name: "Booking case workspace" }).waitFor(); await page.getByRole("button", { name: "All" }).click();
  await page.getByText("Stale Reassignment Guest", { exact: true }).first().waitFor({ timeout: 60000 }); await page.getByText("Stale Reassignment Guest", { exact: true }).first().click();
  const form = page.locator('form[aria-label="Reassign room"]'); await form.waitFor(); await page.waitForTimeout(3000); await form.getByRole("combobox").selectOption("e2e-room-e");
  const blocker = await page.evaluate(async () => { const response = await fetch("/api/v1/housekeeping/e2e-room-e/maintenance", { method: "POST", headers: { "content-type": "application/json", "x-local-access-subject": "source-user:14000000-0000-0000-0000-000000000001", "x-local-access-email": "ana-admin@migration.invalid", "x-hotel-id": "10000000-0000-0000-0000-000000000001" }, body: JSON.stringify({ impact: "BLOCKING", priority: "HIGH", reason: "Concurrent room blocker", assigned_to: "ops" }) }); return { status: response.status, body: await response.text() }; });
  if (blocker.status !== 201) throw new Error(`blocking fixture failed: ${blocker.status} ${blocker.body}`);
  await form.locator('input[name="reason"]').fill("Guest requested a room change"); await form.getByRole("button", { name: "Reassign room" }).click();
  const alert = page.getByRole("alert"); await alert.waitFor(); if (!(await alert.innerText()).includes("changed while you were working")) throw new Error(`conflict guidance missing: ${await alert.innerText()}`);
  if (await page.getByRole("status").filter({ hasText: "Room reassigned" }).count()) throw new Error("stale conflict claimed success");
  await page.screenshot({ path: "output/playwright/cf-wave12-reassignment-conflict.png", fullPage: true });
  console.log("WAVE-1.2 integrated conflict PASS: real API/D1 stale BLOCKING mutation produced operational 409 at 375px mobile");
})()
