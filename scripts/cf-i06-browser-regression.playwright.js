(page) => (async () => {
  await page.setExtraHTTPHeaders({ "x-local-access-subject": "subject-a", "x-local-access-email": "a@test", "x-hotel-id": "hotel-a" });
  const widths = [375, 390, 430, 768, 1024];
  const results = [];
  await page.goto("http://127.0.0.1:4174/bookings");
  await page.getByRole("heading", { name: "Billing and payments" }).waitFor();
  const booking = page.getByRole("combobox", { name: "Billing booking" });
  await booking.selectOption("cf-i06");
  await page.getByRole("heading", { name: /CF-I06 Guest · Invoice/ }).waitFor();
  let paymentRequest = 0;
  await page.route("**/api/v1/bookings/cf-i06/payments", async route => {
    paymentRequest += 1;
    if (paymentRequest === 1) {
      await route.fetch();
      await route.abort("connectionreset");
      return;
    }
    await route.continue();
  });
  await page.getByRole("spinbutton", { name: "Billing payment amount" }).fill("2");
  await page.getByRole("button", { name: "Register payment" }).click();
  await page.getByRole("alert").waitFor();
  await page.getByText(/Payment · 2 cents/).waitFor();
  await page.getByRole("button", { name: "Register payment" }).click();
  await page.getByText(/Payment · 2 cents/).waitFor();
  if (await page.getByText(/Payment · 2 cents/).count() !== 1) throw new Error("ambiguous retry created duplicate payment");
  await page.unroute("**/api/v1/bookings/cf-i06/payments");

  for (const width of widths) {
    await page.setViewportSize({ width, height: 812 });
    await page.waitForTimeout(100);
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    if (scrollWidth > width) throw new Error(`billing horizontal overflow at ${width}: ${scrollWidth}`);
    const description = page.getByRole("textbox", { name: "Billing charge description" });
    await description.fill(`Browser width ${width}`);
    await page.getByRole("spinbutton", { name: "Billing charge amount" }).fill("1");
    await page.getByRole("button", { name: "Add extra charge" }).click();
    await page.getByText(new RegExp(`Browser width ${width}`)).waitFor();
    await page.waitForTimeout(500);
    await page.getByRole("spinbutton", { name: "Billing payment amount" }).fill("1");
    await page.getByRole("button", { name: "Register payment" }).click();
    await page.getByText(/Payment · 1 cents/).first().waitFor();
    await page.waitForTimeout(500);
    if (width === 375) {
      await page.getByRole("spinbutton", { name: "Billing payment amount" }).fill("20000");
      await page.getByRole("button", { name: "Register payment" }).click();
      await page.getByRole("alert").waitFor();
    }
    results.push({ width, scrollWidth, selected: await booking.inputValue(), materialAction: "charge+payment" });
  }

  const refresh = page.getByRole("button", { name: "Refresh balance" });
  await refresh.click();
  const staleExpected = await page.getByRole("spinbutton", { name: "Expected cash cents" }).inputValue();
  await page.evaluate(async () => {
    await fetch("/api/v1/bookings/cf-i06/payments", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ amount_cents: 1, payment_method: "CASH", payment_reference: "browser-stale" }),
    });
  });
  await page.getByRole("spinbutton", { name: "Counted cash cents" }).fill(staleExpected);
  await page.getByRole("textbox", { name: "Handoff to" }).fill("Browser stale");
  await page.getByRole("button", { name: "Close cash shift" }).click();
  await page.getByText(/Cash shift balance changed/).waitFor();

  await refresh.click();
  const currentExpected = await page.getByRole("spinbutton", { name: "Expected cash cents" }).inputValue();
  await page.getByRole("spinbutton", { name: "Counted cash cents" }).fill(currentExpected);
  await page.getByRole("textbox", { name: "Handoff to" }).fill("Browser success");
  await page.getByRole("textbox", { name: "Close notes" }).fill("Browser close proof");
  await page.getByRole("button", { name: "Close cash shift" }).click();
  await page.getByRole("status").filter({ hasText: /Shift closed/ }).waitFor();
  await page.screenshot({ path: "output/playwright/cf-i06-billing.png", fullPage: true });
  return results;
})()
