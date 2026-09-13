(page) => (async () => {
  const adminHeaders = {
    "x-local-access-subject": "source-user:subject-admin",
    "x-local-access-email": "admin@example.test",
    "x-hotel-id": "hotel-a",
  };

  await page.addInitScript(() => {
    if (!sessionStorage.getItem("hms.i18n-smoke-cleaned")) {
      localStorage.removeItem("hms.locale");
      sessionStorage.setItem("hms.i18n-smoke-cleaned", "true");
    }
  });
  await page.route("**/api/v1/**", async route => {
    const request = route.request();
    await route.continue({ headers: { ...request.headers(), ...adminHeaders } });
  });

  await page.goto("http://127.0.0.1:4174/bookings", { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "Gestión de reservas", exact: true }).waitFor();
  if (await page.locator("html").getAttribute("lang") !== "es-AR") throw new Error("Clean storage did not default to es-AR");

  const overflow = {};
  for (const width of [375, 390, 430]) {
    await page.setViewportSize({ width, height: 844 });
    await page.waitForTimeout(50);
    const metrics = await page.evaluate(() => ({
      innerWidth: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    if (metrics.scrollWidth > metrics.innerWidth + 1) throw new Error(`Horizontal overflow at ${width}px: ${metrics.scrollWidth} > ${metrics.innerWidth}`);
    overflow[width] = "PASS";
  }

  await page.evaluate(() => { window.__i18nDocumentMarker = "alive"; });
  await page.getByLabel("Idioma").selectOption("en");
  await page.getByRole("heading", { name: "Booking case workspace", exact: true }).waitFor();
  if (await page.locator("html").getAttribute("lang") !== "en") throw new Error("English switch did not update document language");
  if ((await page.evaluate(() => window.__i18nDocumentMarker)) !== "alive") throw new Error("Language switch reloaded the document");
  if (await page.evaluate(() => localStorage.getItem("hms.locale")) !== "en") throw new Error("English preference was not persisted");

  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "Booking case workspace", exact: true }).waitFor();
  if (await page.locator("html").getAttribute("lang") !== "en") throw new Error("Reload did not preserve English locale");

  await page.getByLabel("Language").selectOption("es-AR");
  await page.getByRole("heading", { name: "Gestión de reservas", exact: true }).waitFor();
  if (await page.locator("html").getAttribute("lang") !== "es-AR") throw new Error("Spanish switch did not update document language");
  if (await page.evaluate(() => localStorage.getItem("hms.locale")) !== "es-AR") throw new Error("Spanish preference was not persisted");

  return {
    spanishDefault: "PASS",
    switchWithoutReload: "PASS",
    persistence: "PASS",
    documentLanguage: "PASS",
    mobileOverflow: overflow,
  };
})()
