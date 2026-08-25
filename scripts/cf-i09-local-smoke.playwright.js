(page) => (async () => {
  await page.setViewportSize({ width: 1024, height: 800 });
  await page.goto("http://127.0.0.1:4174/rooms");
  await page.getByRole("heading", { name: "Rooms" }).waitFor();
  const selector = page.getByLabel("Local acceptance profile");
  await selector.waitFor();
  await page.getByText("101", { exact: true }).waitFor();
  if (await page.getByText("201", { exact: true }).count()) throw new Error("Hotel Sur room leaked into Hotel Norte profile");
  await selector.selectOption({ label: "Hotel Sur · Operations" });
  await page.getByText("201", { exact: true }).waitFor();
  if (await page.getByText("101", { exact: true }).count()) throw new Error("Hotel Norte room remained after switching to Hotel Sur profile");
  await page.goto("http://127.0.0.1:4174/network");
  await page.getByRole("heading", { name: "Hotel network" }).waitFor();
  await page.getByText("Hotel Norte", { exact: true }).first().waitFor();
  await page.getByText("Hotel Sur", { exact: true }).first().waitFor();
  return { selector: true, hotelA: true, hotelB: true, network: true };
})()
