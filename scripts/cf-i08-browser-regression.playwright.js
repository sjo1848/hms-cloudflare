(page) => (async () => {
  const widths = [375, 390, 430, 768, 1024];
  await page.setExtraHTTPHeaders({ "x-local-access-subject": "subject-a", "x-local-access-email": "a@test", "x-hotel-id": "hotel-a" });
  for (const width of widths) {
    await page.setViewportSize({ width, height: 812 });
    await page.goto("http://127.0.0.1:4174/reports");
    await page.getByRole("heading", { name: "Reports" }).waitFor();
    await page.getByRole("button", { name: "Refresh report" }).click();
    await page.getByText("Revenue", { exact: true }).waitFor();
    await page.getByText("Occupancy", { exact: true }).waitFor();
    await page.getByText("ADR", { exact: true }).waitFor();
    await page.getByText("RevPAR", { exact: true }).waitFor();
    const reportOverflow = await page.evaluate(() => [...document.querySelectorAll("*")].map(el => ({ tag: el.tagName, cls: (el.getAttribute("class") || "").slice(0,40), right: Math.round(el.getBoundingClientRect().right), width: Math.round(el.getBoundingClientRect().width) })).filter(x => x.right > innerWidth + 1).slice(-8));
    if (await page.evaluate(() => document.documentElement.scrollWidth) > width) throw new Error(`reports overflow ${width}: ${JSON.stringify(reportOverflow)}`);
    for (const [path, heading] of [["/bookings", "Booking case workspace"], ["/rooms", "Rooms"], ["/guests", "Guests"], ["/housekeeping", "Housekeeping board"], ["/users", "Users administration"]]) {
      await page.goto(`http://127.0.0.1:4174${path}`); await page.getByRole("heading", { name: heading }).waitFor();
      if (await page.evaluate(() => document.documentElement.scrollWidth) > width) throw new Error(`integrated ${path} overflow ${width}`);
    }
  }
  await page.setExtraHTTPHeaders({ "x-local-access-subject": "subject-network", "x-local-access-email": "network@test" });
  for (const width of widths) {
    await page.setViewportSize({ width, height: 812 }); await page.goto("http://127.0.0.1:4174/network"); await page.getByRole("heading", { name: "Hotel network" }).waitFor();
    await page.getByText("Total hotels", { exact: true }).waitFor(); await page.getByText("Revenue ranking", { exact: true }).waitFor(); await page.getByText("Hotel A", { exact: true }).first().waitFor(); await page.getByText("Hotel B", { exact: true }).first().waitFor();
    if (await page.evaluate(() => document.documentElement.scrollWidth) > width) throw new Error(`network overflow ${width}`);
  }
  await page.setExtraHTTPHeaders({ "x-local-access-subject": "subject-hk", "x-local-access-email": "hk@test", "x-hotel-id": "hotel-a" }); await page.goto("http://127.0.0.1:4174/reports"); await page.getByRole("alert").filter({ hasText: "Capability required" }).waitFor();
  await page.screenshot({ path: "output/playwright/cf-i08-integrated.png", fullPage: true }); return widths;
})()
