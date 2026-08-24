(page) => (async () => {
  await page.setExtraHTTPHeaders({ "x-local-access-subject": "subject-a", "x-local-access-email": "a@test", "x-hotel-id": "hotel-a" });
  const widths = [375, 430, 768, 1024]; const results = [];
  await page.goto("http://127.0.0.1:4174/bookings"); await page.getByRole("heading", { name: "Billing and payments" }).waitFor();
  const booking = page.getByRole("combobox", { name: "Billing booking" }); await booking.selectOption("cf-i06"); await page.getByRole("heading", { name: /CF-I06 Guest · Invoice/ }).waitFor();
  for (const width of widths) { await page.setViewportSize({ width, height: 812 }); await page.waitForTimeout(100); const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth); if (scrollWidth > width) throw new Error(`billing horizontal overflow at ${width}: ${scrollWidth}`); results.push({ width, scrollWidth, selected: await booking.inputValue() }); }
  const chargeDescription = page.getByRole("textbox", { name: "Billing charge description" }); await chargeDescription.fill("Browser minibar charge"); await page.getByRole("spinbutton", { name: "Billing charge amount" }).fill("250"); await page.getByRole("button", { name: "Add extra charge" }).click(); await page.getByText(/Browser minibar charge/).waitFor();
  await page.getByRole("spinbutton", { name: "Billing payment amount" }).fill("250"); await page.getByRole("button", { name: "Register payment" }).click(); await page.getByText(/Payment · 250 cents/).waitFor();
  await page.screenshot({ path: "output/playwright/cf-i06-billing.png", fullPage: true }); return results;
})()
