(page) => (async () => {
  await page.setExtraHTTPHeaders({
    "x-local-access-subject": "source-user:subject-a",
    "x-local-access-email": "a@example.test",
    "x-hotel-id": "hotel-a",
  });
  const widths = [375, 390, 430, 768, 1024, 1366];
  const results = [];
  const apiStatuses = [];
  page.on("response", response => { if (response.url().includes("/api/v1/housekeeping/")) apiStatuses.push({ url: response.url(), status: response.status() }); });
  const waitForRoom = async (roomNumber) => {
    await page.getByRole("button", { name: new RegExp(`Room ${roomNumber}`) }).click();
    await page.getByRole("heading", { name: new RegExp(`Room ${roomNumber}`) }).waitFor();
  };
  const assertResponsive = async (width) => {
    const existingFocusedTask = page.getByRole("dialog", { name: /Focused task room/ });
    if (await existingFocusedTask.count()) { await page.getByRole("button", { name: "Close task" }).click(); await existingFocusedTask.waitFor({ state: "hidden", timeout: 5000 }); }
    await page.setViewportSize({ width, height: 812 });
    await page.waitForTimeout(150);
    await page.getByRole("heading", { name: "Housekeeping board" }).waitFor();
    const queueHead = await page.getByRole("complementary", { name: "Housekeeping task queue" }).getByRole("button").first().innerText();
    const expectedRoom = "Room 904";
    if (!/^Room 904\b/.test(queueHead)) throw new Error(`source priority expected Room 904 before numeric Room 901 at ${width}: ${queueHead}`);
    await page.getByRole("button", { name: "Next task" }).click();
    if (width < 768) {
      const focusedTask = page.getByRole("dialog", { name: /Focused task room/ });
      await focusedTask.waitFor({ state: "visible", timeout: 5000 });
      const focusedHeading = page.getByRole("heading", { name: new RegExp(expectedRoom) });
      if (await focusedHeading.count() !== 1) throw new Error(`next task did not open ${expectedRoom} at ${width}; headings=${JSON.stringify(await page.getByRole("heading").allTextContents())}`);
      await focusedHeading.waitFor();
      if (width === 375) {
        await page.waitForTimeout(100);
        if (!await focusedHeading.evaluate(element => document.activeElement === element)) throw new Error(`focused task did not receive focus at ${width}; active=${await page.evaluate(() => `${document.activeElement?.tagName}:${document.activeElement?.textContent}`)}`);
      }
      await page.getByRole("button", { name: "Close task" }).click();
      await focusedTask.waitFor({ state: "hidden", timeout: 5000 });
      if (width === 375 && !await page.getByRole("button", { name: "Next task" }).evaluate(element => document.activeElement === element)) throw new Error(`focus did not return to next-task control at ${width}`);
    } else {
      await page.getByRole("heading", { name: new RegExp(expectedRoom) }).waitFor({ state: "visible", timeout: 5000 });
      if (await page.getByRole("heading", { name: new RegExp(expectedRoom) }).count() !== 1) throw new Error(`next task did not open queue head ${expectedRoom} at ${width}`);
    }
    results.push({ width, scrollWidth: await page.evaluate(() => document.documentElement.scrollWidth), queue: await page.getByRole("complementary", { name: "Housekeeping task queue" }).count() });
  };

  await page.goto("http://127.0.0.1:4174/housekeeping");
  await page.getByRole("heading", { name: "Housekeeping board" }).waitFor();
  const authStatus = await page.evaluate(async () => { const response = await fetch("/api/v1/auth/me"); return { status: response.status, body: await response.text() }; });
  if (authStatus.status !== 200) throw new Error(`local acceptance auth failed: ${JSON.stringify(authStatus)}`);
  const boardEvidence = await page.evaluate(async () => { const response = await fetch("/api/v1/housekeeping/board"); const body = await response.text(); if (!response.ok) throw new Error(`housekeeping board failed ${response.status}: ${body}`); return JSON.parse(body); });
  if (boardEvidence.rooms.some(room => room.room_id === "browser-f")) throw new Error("orphan fixture unexpectedly appeared in eligible board rooms");
  if (!boardEvidence.departures_today.some(departure => departure.room_id === "browser-f" && departure.guest_name === "Orphan Departure Guest")) throw new Error("orphan departure fixture missing from departures_today");
  const checkedInDeparture = boardEvidence.departures_today.find(departure => departure.room_id === "browser-g");
  const confirmedDeparture = boardEvidence.departures_today.find(departure => departure.room_id === "browser-h");
  if (checkedInDeparture?.booking_status !== "CHECKED_IN" || confirmedDeparture?.booking_status !== "CONFIRMED") throw new Error("enum fixture did not preserve target serialized booking statuses");
  const queueButtons = await page.getByRole("complementary", { name: "Housekeeping task queue" }).getByRole("button").allTextContents();
  const queueIndex = room => queueButtons.findIndex(text => text.includes(`Room ${room}`));
  if (!(queueIndex(907) >= 0 && queueIndex(901) >= 0 && queueIndex(908) >= 0 && queueIndex(907) < queueIndex(901) && queueIndex(901) < queueIndex(908))) throw new Error(`checked-in semantic rank/order mismatch: ${JSON.stringify(queueButtons)}`);
  await assertResponsive(375);
  await waitForRoom("906");
  if (await page.getByRole("button", { name: "Start cleaning" }).count() || await page.getByRole("button", { name: "Finish cleaning" }).count() || await page.getByRole("button", { name: "Create case and block" }).count()) throw new Error("orphan departure exposed an invalid mutation");
  if (!(await page.getByText(/Blocked departure/).count())) throw new Error("orphan departure was not visibly blocked");
  await page.getByRole("button", { name: "Close task" }).click();
  await waitForRoom("907");
  if (await page.getByRole("button", { name: "Start cleaning" }).count() || await page.getByRole("button", { name: "Finish cleaning" }).count() || await page.getByRole("button", { name: "Create case and block" }).count()) throw new Error("eligible checked-in departure exposed an invalid mutation");
  if (!(await page.getByText(/Blocked departure/).count())) throw new Error("eligible checked-in departure was not visibly blocked");
  await page.getByRole("button", { name: "Close task" }).click();
  await waitForRoom("901");
  const boardDate = page.getByRole("textbox", { name: "Board date" });
  await page.route("**/api/v1/housekeeping/browser-a/start", async route => { await new Promise(resolve => setTimeout(resolve, 250)); await route.continue(); });
  const startRequest = page.getByRole("button", { name: "Start cleaning" });
  const startPromise = startRequest.click();
  await page.waitForTimeout(50);
  if (!await boardDate.isDisabled()) throw new Error("board date remained editable during housekeeping mutation");
  await startPromise;
  await page.getByRole("heading", { name: "Housekeeping board" }).waitFor();
  await assertResponsive(390);
  await waitForRoom("901");
  await page.getByRole("button", { name: "Finish cleaning" }).click();
  await page.getByRole("heading", { name: "Housekeeping board" }).waitFor();
  await assertResponsive(430);
  await waitForRoom("903");
  const reason = page.getByRole("textbox", { name: "Reason for room 903" });
  await reason.fill("bad");
  if (!await page.getByRole("button", { name: "Create case and block" }).isDisabled()) throw new Error("short maintenance reason was not blocked");
  await reason.fill("Water leak in bathroom");
  await page.getByRole("button", { name: "Close task" }).click();
  await page.getByRole("button", { name: /Room 905/ }).click();
  const roomBReason = page.getByRole("textbox", { name: "Reason for room 905" });
  if ((await roomBReason.inputValue()) !== "") throw new Error("room B inherited room A draft");
  await roomBReason.fill("Room B independent draft");
  await page.getByRole("button", { name: "Clear form" }).click();
  if ((await roomBReason.inputValue()) !== "") throw new Error("Clear form did not clear only the selected room draft");
  await page.getByRole("button", { name: "Close task" }).click();
  await page.getByRole("button", { name: /Room 903/ }).click();
  if ((await page.getByRole("textbox", { name: "Reason for room 903" }).inputValue()) !== "Water leak in bathroom") throw new Error("room A draft did not remain scoped to room A");
  await page.getByRole("button", { name: "Create case and block" }).click();
  await page.getByRole("heading", { name: "Housekeeping board" }).waitFor();
  await assertResponsive(768);
  await waitForRoom("903");
  const resolution = page.getByRole("textbox", { name: "Resolution for room 903" });
  await resolution.fill("short");
  if (!await page.getByRole("button", { name: "Resolve and return to Dirty" }).isDisabled()) throw new Error("short resolution was not blocked");
  await resolution.fill("Leak repaired and verified");
  await page.getByRole("button", { name: "Resolve and return to Dirty" }).click();
  await page.getByRole("heading", { name: "Housekeeping board" }).waitFor();
  await assertResponsive(1024);
  await waitForRoom("905");
  const room105Reason = page.getByRole("textbox", { name: "Reason for room 905" });
  await room105Reason.fill("HVAC inspection required");
  await page.getByRole("button", { name: "Create case and block" }).click();
  await page.getByRole("heading", { name: "Housekeeping board" }).waitFor();
  for (const item of results) if (item.scrollWidth !== item.width) throw new Error(`responsive overflow at ${item.width}`);
  const failedApi = apiStatuses.filter(item => item.status >= 400);
  if (failedApi.length) throw new Error(`integrated API failures: ${JSON.stringify(failedApi)}`);
  await page.screenshot({ path: "output/playwright/cf-i05-integrated-housekeeping.png", fullPage: true });
  return results;
})()
