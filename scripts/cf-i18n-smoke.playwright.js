(page) => (async () => {
  const adminHeaders = {
    "x-local-access-subject": "source-user:subject-admin",
    "x-local-access-email": "admin@example.test",
    "x-hotel-id": "hotel-a",
  };

  await page.addInitScript(() => {
    if (!sessionStorage.getItem("hms.i18n-smoke-initialized")) {
      localStorage.setItem("hms.locale", "en");
      sessionStorage.setItem("hms.i18n-smoke-initialized", "true");
    }
  });
  await page.route("**/api/v1/**", async route => {
    const request = route.request();
    await route.continue({ headers: { ...request.headers(), ...adminHeaders } });
  });
  await page.goto("http://127.0.0.1:4174/bookings", { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "Booking case workspace", exact: true }).waitFor();
  if (await page.locator("html").getAttribute("lang") !== "en") throw new Error("English smoke did not set document language");

  await page.evaluate(() => { window.__i18nDocumentMarker = "alive"; });
  await page.getByLabel("Language").selectOption("es-AR");
  await page.getByRole("heading", { name: "Gestión de reservas", exact: true }).waitFor();
  if ((await page.evaluate(() => window.__i18nDocumentMarker)) !== "alive") throw new Error("Language switch reloaded the document");
  if (await page.evaluate(() => localStorage.getItem("hms.locale")) !== "es-AR") throw new Error("Spanish preference was not persisted");

  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "Gestión de reservas", exact: true }).waitFor();
  await page.getByLabel("Idioma").selectOption("en");
  await page.getByRole("heading", { name: "Booking case workspace", exact: true }).waitFor();
  if (await page.evaluate(() => localStorage.getItem("hms.locale")) !== "en") throw new Error("English preference was not persisted");

  return { englishSmoke: "PASS", switchWithoutReload: "PASS", persistence: "PASS" };
})()
