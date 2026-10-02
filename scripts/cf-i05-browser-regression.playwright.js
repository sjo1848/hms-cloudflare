(page) => (async () => {
  await page.setExtraHTTPHeaders({
    "x-local-access-subject": "source-user:subject-a",
    "x-local-access-email": "a@example.test",
    "x-hotel-id": "hotel-a",
  });
  await page.addInitScript(() => localStorage.setItem("hms.locale", "en"));
  const viewports = [
    { name: "wide", width: 1280, height: 900 },
    { name: "compact", width: 768, height: 812 },
    { name: "narrow", width: 375, height: 812 },
    { name: "reduced-height", width: 375, height: 600 },
    { name: "mobile-landscape", width: 844, height: 390 },
  ];
  const results = [];
  const apiStatuses = [];
  page.on("response", response => { if (response.url().includes("/api/v1/housekeeping/")) apiStatuses.push({ url: response.url(), status: response.status() }); });
  const closeFocusedTask = async () => {
    const focusedTask = page.getByRole("dialog", { name: /Focused task room/ });
    for (let attempt = 0; attempt < 3 && await focusedTask.count(); attempt += 1) {
      await page.evaluate(() => {
        const dialog = [...document.querySelectorAll('[role="dialog"]')].find(element => element.getAttribute("aria-label")?.startsWith("Focused task room"));
        [...(dialog?.querySelectorAll("button") ?? [])].find(button => button.textContent?.trim() === "Close task")?.click();
      });
      try { await focusedTask.waitFor({ state: "hidden", timeout: 1500 }); } catch { await page.waitForTimeout(100); }
    }
    if (await focusedTask.count()) throw new Error("focused task did not close after its UI transition");
  };
  const waitForRoom = async (roomNumber) => {
    const focusedTask = page.getByRole("dialog", { name: /Focused task room/ });
    if (await focusedTask.count()) await closeFocusedTask();
    await page.getByRole("button", { name: new RegExp(`Room ${roomNumber}`) }).click();
    await page.getByRole("heading", { name: new RegExp(`Room ${roomNumber}`) }).waitFor();
  };
  const assertResponsive = async ({ name, width, height }) => {
    const existingFocusedTask = page.getByRole("dialog", { name: /Focused task room/ });
    if (await existingFocusedTask.count()) await closeFocusedTask();
    await page.setViewportSize({ width, height });
    await page.waitForTimeout(150);
    await page.getByRole("heading", { name: "Housekeeping board" }).waitFor();
    const queueHead = await page.getByRole("complementary", { name: "Housekeeping task queue" }).getByRole("button").first().innerText();
    if (!/^Room 904\b/.test(queueHead)) throw new Error(`source priority expected Room 904 before numeric Room 901 at ${name}: ${queueHead}`);
    const dimensions = await page.evaluate(() => ({ viewport: innerWidth, page: document.documentElement.scrollWidth, viewportHeight: innerHeight, pageHeight: document.documentElement.scrollHeight }));
    results.push({ name, ...dimensions, queue: await page.getByRole("complementary", { name: "Housekeeping task queue" }).count() });
    if (dimensions.page !== dimensions.viewport) {
      const overflow = await page.evaluate(() => [...document.querySelectorAll("*")].map(element => {
        const rect = element.getBoundingClientRect();
        return { tag: element.tagName, id: element.id, className: typeof element.className === "string" ? element.className : "", right: Math.round(rect.right), width: Math.round(rect.width), client: element.clientWidth, scroll: element.scrollWidth, text: element.textContent?.trim().slice(0, 70) };
      }).filter(item => item.right > innerWidth + 1 || item.scroll > item.client + 1).filter(item => item.tag !== "HTML" && item.tag !== "BODY").slice(0, 20));
      throw new Error(`horizontal overflow in ${name}: ${JSON.stringify({ dimensions, overflow })}`);
    }
  };

  await page.goto("http://127.0.0.1:4194/housekeeping");
  // Hide only the synthetic local-auth profile switcher at phone widths; production has no such developer chrome.
  await page.addStyleTag({ content: "@media(max-width:560px){.local-dev-identity{display:none!important}}" });
  await page.getByRole("heading", { name: "Housekeeping board" }).waitFor();
  await page.waitForFunction(() => Boolean(document.querySelector('input[type="date"]')?.value));
  let releaseOldBoard;
  let oldBoardStarted;
  const oldBoardRequestStarted = new Promise(resolve => { oldBoardStarted = resolve; });
  const oldBoardGate = new Promise(resolve => { releaseOldBoard = resolve; });
  await page.route("**/api/v1/housekeeping/board?date=2099-01-01", async route => {
    oldBoardStarted();
    await oldBoardGate;
    await route.continue();
  });
  await page.goto("http://127.0.0.1:4194/housekeeping?date=2099-01-01");
  await oldBoardRequestStarted;
  const refreshButton = page.getByRole("button", { name: "Refresh housekeeping board" });
  if (await refreshButton.isDisabled()) throw new Error("refresh control was disabled during a read, preventing a newer authoritative request");
  const newerBoardResponsePromise = page.waitForResponse(response => response.url().includes("/api/v1/housekeeping/board") && !new URL(response.url()).searchParams.has("date") && response.request().method() === "GET");
  await refreshButton.click();
  const newerBoardResponse = await newerBoardResponsePromise;
  if (newerBoardResponse.status() !== 200) throw new Error(`newer integrated board read returned ${newerBoardResponse.status()}`);
  const newerBoardBody = await newerBoardResponse.json();
  if (!newerBoardBody.date || newerBoardBody.date === "2099-01-01") throw new Error(`board race fixture did not distinguish newer and older authoritative payloads: ${JSON.stringify(newerBoardBody.date)}`);
  await page.waitForFunction(expected => document.querySelector('input[type="date"]')?.value === expected, newerBoardBody.date);
  const raceSearch = page.getByRole("textbox", { name: "Search housekeeping" });
  await raceSearch.fill("904");
  const raceShiftFilter = page.getByRole("button", { name: /Shift/ });
  await raceShiftFilter.click();
  const raceSelectedRoom = page.getByRole("complementary", { name: "Housekeeping task queue" }).getByRole("button", { name: /Room 904/ });
  await raceSelectedRoom.click();
  await page.getByRole("heading", { name: /Room 904/ }).waitFor();
  releaseOldBoard();
  const oldBoardResponse = await page.waitForResponse(response => response.url().includes("/api/v1/housekeeping/board?date=2099-01-01") && response.request().method() === "GET");
  if (oldBoardResponse.status() !== 200) throw new Error(`older integrated board read returned ${oldBoardResponse.status()}`);
  const oldBoardBody = await oldBoardResponse.json();
  if (oldBoardBody.date !== "2099-01-01") throw new Error(`older response was not the expected distinguishable payload: ${JSON.stringify(oldBoardBody.date)}`);
  await page.waitForFunction(expected => {
    const date = document.querySelector('input[type="date"]')?.value;
    const selected = document.querySelector('[aria-label="Housekeeping task queue"] button.selected');
    return date === expected && selected?.textContent?.includes("904") && !document.querySelector('[role="status"]');
  }, newerBoardBody.date);
  const staleResponseContext = {
    displayedDate: await page.getByRole("textbox", { name: "Board date" }).inputValue(),
    expectedLatestDate: newerBoardBody.date,
    search: await raceSearch.inputValue(),
    filter: await raceShiftFilter.getAttribute("aria-pressed"),
    selected: (await raceSelectedRoom.getAttribute("class"))?.includes("selected"),
    selectedHeading: await page.getByRole("heading", { name: /Room 904/ }).count(),
    loading: await page.getByRole("status").filter({ hasText: "Loading" }).count(),
  };
  if (staleResponseContext.displayedDate !== newerBoardBody.date || staleResponseContext.search !== "904" || staleResponseContext.filter !== "true" || !staleResponseContext.selected || !staleResponseContext.selectedHeading || staleResponseContext.loading) throw new Error(`late older board response overwrote newer UI/context: ${JSON.stringify(staleResponseContext)}`);
  await page.unroute("**/api/v1/housekeeping/board?date=2099-01-01");
  await page.goto("http://127.0.0.1:4194/housekeeping");
  await page.addStyleTag({ content: "@media(max-width:560px){.local-dev-identity{display:none!important}}" });
  await page.getByRole("heading", { name: "Housekeeping board" }).waitFor();
  await page.waitForFunction(() => Boolean(document.querySelector('input[type="date"]')?.value));
  const authStatus = await page.evaluate(async () => { const response = await fetch("/api/v1/auth/me"); return { status: response.status, body: await response.text() }; });
  if (authStatus.status !== 200) throw new Error(`local acceptance auth failed: ${JSON.stringify(authStatus)}`);
  const boardEvidence = await page.evaluate(async () => { const response = await fetch("/api/v1/housekeeping/board"); const body = await response.text(); if (!response.ok) throw new Error(`housekeeping board failed ${response.status}: ${body}`); return JSON.parse(body); });
  if (boardEvidence.rooms.some(room => room.room_id === "browser-f")) throw new Error("orphan fixture unexpectedly appeared in eligible board rooms");
  if (!boardEvidence.departures_today.some(departure => departure.room_id === "browser-f" && departure.guest_name === "Orphan Departure Guest")) throw new Error("orphan departure fixture missing from departures_today");
  const checkedInDeparture = boardEvidence.departures_today.find(departure => departure.room_id === "browser-g");
  const confirmedDeparture = boardEvidence.departures_today.find(departure => departure.room_id === "browser-h");
  if (checkedInDeparture?.booking_status !== "CHECKED_IN" || confirmedDeparture?.booking_status !== "CONFIRMED") throw new Error("enum fixture did not preserve target serialized booking statuses");
  const riskRoom = boardEvidence.rooms.find(room => room.room_id === "browser-d");
  if (riskRoom?.at_risk_bookings?.length !== 1 || riskRoom.at_risk_bookings[0]?.id !== "browser-booking-risk-d") throw new Error("blocking case did not return exactly its overlapping future confirmed stay");
  await page.setExtraHTTPHeaders({ "x-local-access-subject": "source-user:subject-a", "x-local-access-email": "a@example.test", "x-hotel-id": "hotel-b" });
  const secondHotel = await page.evaluate(async () => {
    const response = await fetch("/api/v1/housekeeping/board");
    const body = await response.text();
    if (!response.ok) throw new Error(`second hotel board failed ${response.status}: ${body}`);
    const board = JSON.parse(body);
    const roomA = board.rooms.find(room => room.room_id === "browser-a");
    const roomD = board.rooms.find(room => room.room_id === "browser-d");
    if (roomA?.room_number !== "201" || roomD?.maintenance_case?.reason !== "Hotel Sur advisory case" || roomD.maintenance_case.impact !== "NON_BLOCKING" || roomD.maintenance_history?.[0]?.request_id !== "hotel-b-request" || roomD.at_risk_bookings?.length) throw new Error("same IDs did not return isolated second-hotel context: " + JSON.stringify({ roomA, roomD }));
    const mutation = await fetch("/api/v1/housekeeping/browser-a/start", { method: "POST" });
    if (!mutation.ok) throw new Error(`second hotel authorized write failed ${mutation.status}: ${await mutation.text()}`);
    const changedB = await fetch("/api/v1/housekeeping/board");
    const b = await changedB.json();
    if (b.rooms.find(room => room.room_id === "browser-a")?.room_status !== "Cleaning") throw new Error("second-hotel write was not persisted to its own D1");
    return { boardStatus: response.status, mutationStatus: mutation.status, hotelBStatusAfterWrite: b.rooms.find(room => room.room_id === "browser-a")?.room_status };
  });
  await page.setExtraHTTPHeaders({ "x-local-access-subject": "source-user:subject-a", "x-local-access-email": "a@example.test", "x-hotel-id": "hotel-a" });
  const firstHotelAfterSecondWrite = await page.evaluate(async () => {
    const response = await fetch("/api/v1/housekeeping/board");
    const board = await response.json();
    return { status: response.status, room: board.rooms.find(room => room.room_id === "browser-a") };
  });
  if (firstHotelAfterSecondWrite.room?.room_status !== "Dirty") throw new Error("second-hotel write changed first-hotel room");
  secondHotel.hotelAStatusAfterBWrite = firstHotelAfterSecondWrite.room?.room_status;
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.getByRole("button", { name: /^Room 904/ }).click();
  await page.getByRole("heading", { name: /Room 904/ }).waitFor();
  if (!await page.getByText("Existing maintenance case").count() || !await page.getByText(/At Risk Guest/).count() || !await page.getByText(/browser-request-d/).count()) throw new Error("selected case omitted its reason, affected guest, or audit trace");
  if (!await page.getByText("Maintenance reported").count()) throw new Error("case history event label is missing");
  const queueButtons = await page.getByRole("complementary", { name: "Housekeeping task queue" }).getByRole("button").allTextContents();
  const queueIndex = room => queueButtons.findIndex(text => text.includes(`Room ${room}`));
  if (!(queueIndex(907) >= 0 && queueIndex(901) >= 0 && queueIndex(908) >= 0 && queueIndex(907) < queueIndex(901) && queueIndex(901) < queueIndex(908))) throw new Error(`checked-in semantic rank/order mismatch: ${JSON.stringify(queueButtons)}`);

  for (const viewport of viewports) await assertResponsive(viewport);
  await page.setViewportSize({ width: 844, height: 390 });
  await waitForRoom("903");
  const landscapeSubmit = page.getByRole("button", { name: "Create case and block" });
  await landscapeSubmit.evaluate(element => element.scrollIntoView({ block: "nearest" }));
  const landscapeSubmitBounds = await landscapeSubmit.evaluate(element => { const rect = element.getBoundingClientRect(); return { top: rect.top, bottom: rect.bottom, height: innerHeight }; });
  if (landscapeSubmitBounds.top < 0 || landscapeSubmitBounds.bottom > landscapeSubmitBounds.height) throw new Error("maintenance action is not reachable in mobile landscape");
  await page.getByRole("button", { name: "Close task" }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: /^Room 904/ }).click();
  const focusedCase = page.getByRole("dialog", { name: /Focused task room 904/ });
  await focusedCase.waitFor({ state: "visible" });
  const caseHeading = page.getByRole("heading", { name: /Room 904/ });
  if (!await caseHeading.evaluate(element => document.activeElement === element)) throw new Error("narrow Case did not receive initial focus");
  await page.keyboard.press("Shift+Tab");
  const lastDialogControl = await focusedCase.locator("button:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex=\"-1\"])").last().evaluate(element => element === document.activeElement);
  if (!lastDialogControl) { const focusState = await page.evaluate(() => ({ active: document.activeElement?.outerHTML.slice(0, 180), dialog: document.querySelector('[role="dialog"]')?.innerHTML.slice(-500) })); throw new Error("Shift+Tab escaped the focused task instead of wrapping: " + JSON.stringify(focusState)); }
  await page.keyboard.press("Tab");
  const firstDialogControl = await focusedCase.locator("button:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex=\"-1\"])").first().evaluate(element => element === document.activeElement);
  if (!firstDialogControl) throw new Error("Tab did not wrap to the first focused-task control");
  await page.keyboard.press("Escape");
  await focusedCase.waitFor({ state: "hidden" });
  if (!await page.getByRole("button", { name: /^Room 904/ }).evaluate(element => document.activeElement === element)) throw new Error("closing narrow Case did not restore focus to its Queue item");

  const nextTaskButton = page.getByRole("button", { name: "Next task" });
  await nextTaskButton.click();
  const firstFocusedTask = page.getByRole("dialog", { name: /Focused task room/ });
  await firstFocusedTask.waitFor({ state: "visible", timeout: 5000 });
  const advancedHeading = page.getByRole("heading", { name: /Room 906/ });
  await advancedHeading.waitFor();
  if (!await advancedHeading.evaluate(element => document.activeElement === element)) throw new Error(`advanced task did not receive focus; active=${await page.evaluate(() => `${document.activeElement?.tagName}:${document.activeElement?.textContent}`)}`);
  await page.getByRole("button", { name: "Close task" }).click();
  await firstFocusedTask.waitFor({ state: "hidden", timeout: 5000 });
  if (!await nextTaskButton.evaluate(element => document.activeElement === element)) throw new Error("focus did not return to next-task control");

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
  let delayedStartReached;
  const delayedStart = new Promise(resolve => { delayedStartReached = resolve; });
  await page.route("**/api/v1/housekeeping/browser-a/start", async route => { delayedStartReached(); await new Promise(resolve => setTimeout(resolve, 750)); await route.continue(); });
  const startRequest = page.getByRole("button", { name: "Start cleaning" });
  const startPromise = startRequest.click();
  await delayedStart;
  await page.waitForTimeout(50);
  if (!await boardDate.isDisabled()) throw new Error("board date remained editable during housekeeping mutation");
  const startResponse = await page.waitForResponse(response => response.url().endsWith("/api/v1/housekeeping/browser-a/start") && response.request().method() === "POST");
  if (startResponse.status() !== 200) throw new Error(`integrated cleaning start returned ${startResponse.status()}: ${await startResponse.text()}`);
  await startPromise;
  await page.getByRole("heading", { name: "Housekeeping board" }).waitFor();
  await assertResponsive(viewports.find(viewport => viewport.name === "narrow"));
  await waitForRoom("901");
  const finishResponsePromise = page.waitForResponse(response => response.url().endsWith("/api/v1/housekeeping/browser-a/finish") && response.request().method() === "POST");
  await page.getByRole("button", { name: "Finish cleaning" }).click();
  const finishResponse = await finishResponsePromise;
  if (finishResponse.status() !== 200) throw new Error(`integrated cleaning finish returned ${finishResponse.status()}: ${await finishResponse.text()}`);
  await page.getByRole("heading", { name: "Housekeeping board" }).waitFor();
  await assertResponsive(viewports.find(viewport => viewport.name === "narrow"));
  await waitForRoom("903");
  const reason = page.getByRole("textbox", { name: "Reason", exact: true });
  await reason.fill("bad");
  if (!await page.getByRole("button", { name: "Create case and block" }).isDisabled()) throw new Error("short maintenance reason was not blocked");
  await reason.fill("Water leak in bathroom");
  await page.getByRole("button", { name: "Close task" }).click();
  await page.getByRole("button", { name: /Room 905/ }).click();
  const roomBReason = page.getByRole("textbox", { name: "Reason", exact: true });
  if ((await roomBReason.inputValue()) !== "") throw new Error("room B inherited room A draft");
  await roomBReason.fill("Room B independent draft");
  const clearFormButton = page.getByRole("button", { name: "Clear form" });
  await clearFormButton.evaluate(element => element.scrollIntoView({ block: "center", inline: "nearest" }));
  await clearFormButton.click();
  await page.waitForFunction(() => document.querySelector('[aria-label="Reason"]')?.value === "");
  if ((await roomBReason.inputValue()) !== "") throw new Error("Clear form did not clear only the selected room draft");
  await page.getByRole("button", { name: "Close task" }).click();
  await page.getByRole("button", { name: /Room 903/ }).click();
  if ((await page.getByRole("textbox", { name: "Reason", exact: true }).inputValue()) !== "Water leak in bathroom") throw new Error("room A draft did not remain scoped to room A");
  await page.getByRole("button", { name: "Create case and block" }).click();
  await page.getByRole("heading", { name: "Housekeeping board" }).waitFor();
  await assertResponsive(viewports.find(viewport => viewport.name === "compact"));
  await waitForRoom("903");
  const resolution = page.getByRole("textbox", { name: "Resolution performed", exact: true });
  await resolution.fill("short");
  if (!await page.getByRole("button", { name: "Resolve and return to Dirty" }).isDisabled()) throw new Error("short resolution was not blocked");
  await resolution.fill("Leak repaired and verified");
  await page.getByRole("button", { name: "Resolve and return to Dirty" }).click();
  await page.getByRole("heading", { name: "Housekeeping board" }).waitFor();
  await page.locator('[aria-label="Recent history"]').getByText("Case resolved").waitFor();
  if (!await page.getByText("Resolved", { exact: true }).count()) throw new Error("resolved case facts disappeared after authoritative refresh");
  await assertResponsive(viewports.find(viewport => viewport.name === "wide"));
  await waitForRoom("905");
  const room105Reason = page.getByRole("textbox", { name: "Reason", exact: true });
  await room105Reason.fill("HVAC inspection required");
  await page.getByRole("combobox", { name: "Impact" }).selectOption("NON_BLOCKING");
  await page.getByRole("button", { name: "Create case and block" }).click();
  await page.getByRole("heading", { name: "Housekeeping board" }).waitFor();
  await assertResponsive(viewports.find(viewport => viewport.name === "wide"));
  const escalationNote = page.getByRole("textbox", { name: "Why this case is now blocking" });
  await escalationNote.fill("short");
  const escalateButton = page.getByRole("button", { name: "Escalate to blocking" });
  if (!await escalateButton.isDisabled()) throw new Error("short escalation note was not blocked");
  await escalationNote.fill("Immediate guest safety impact confirmed");
  const escalationResponsePromise = page.waitForResponse(response => /\/api\/v1\/housekeeping\/browser-e\/maintenance\/[^/]+\/escalate$/.test(response.url()) && response.request().method() === "POST");
  await escalateButton.click();
  const escalationResponse = await escalationResponsePromise;
  if (escalationResponse.status() !== 200) throw new Error(`integrated maintenance escalation returned ${escalationResponse.status()}: ${await escalationResponse.text()}`);
  await page.getByRole("heading", { name: "Housekeeping board" }).waitFor();
  const escalatedCase = await page.evaluate(async () => { const response = await fetch("/api/v1/housekeeping/board"); const board = await response.json(); return board.rooms.find(room => room.room_id === "browser-e"); });
  if (escalatedCase?.maintenance_case?.impact !== "BLOCKING" || !escalatedCase.maintenance_history?.some(event => event.event_type === "MAINTENANCE_ESCALATE" && event.maintenance_case_id === escalatedCase.maintenance_case.id)) throw new Error("authoritative escalation state/history did not refresh");
  // A failed refresh must preserve the visible board and task context.
  await page.setViewportSize({ width: 390, height: 844 });
  const search = page.getByRole("textbox", { name: "Search housekeeping" });
  await search.fill("904");
  const shiftFilter = page.getByRole("button", { name: /Shift/ });
  await shiftFilter.click();
  await page.getByRole("button", { name: /^Room 904/ }).click();
  await page.getByRole("button", { name: "Close task" }).click();
  await page.route("**/api/v1/housekeeping/board*", route => route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "synthetic refresh failure" }) }));
  await page.getByRole("button", { name: "Refresh housekeeping board" }).click();
  await page.getByRole("alert").waitFor({ state: "visible" });
  const selectedQueueItem = page.getByRole("complementary", { name: "Housekeeping task queue" }).getByRole("button", { name: /Room 904/ });
  const failedRefreshContext = { search: await search.inputValue(), filter: await shiftFilter.getAttribute("aria-pressed"), selectedQueue: await selectedQueueItem.count(), selected: (await selectedQueueItem.getAttribute("class"))?.includes("selected") };
  if (failedRefreshContext.search !== "904" || failedRefreshContext.filter !== "true" || !failedRefreshContext.selectedQueue || !failedRefreshContext.selected) throw new Error("failed refresh discarded queue/case context: " + JSON.stringify(failedRefreshContext));
  await page.unroute("**/api/v1/housekeeping/board*");
  await page.getByRole("button", { name: "Refresh housekeeping board" }).click();
  await page.getByRole("alert").waitFor({ state: "hidden" });
  if (await search.inputValue() !== "904" || await shiftFilter.getAttribute("aria-pressed") !== "true" || !(await selectedQueueItem.getAttribute("class"))?.includes("selected")) throw new Error("successful retry discarded search/filter/selection context");
  // Supported direct links use the board-date query. Browser Back/Forward and reload must replay it.
  await page.goto("http://127.0.0.1:4194/housekeeping?date=2026-01-01");
  await page.waitForFunction(() => document.querySelector('input[type="date"]')?.value === "2026-01-01");
  if (await page.getByRole("textbox", { name: "Board date" }).inputValue() !== "2026-01-01") throw new Error("direct board-date deep link was ignored");
  await page.reload();
  await page.waitForFunction(() => document.querySelector('input[type="date"]')?.value === "2026-01-01");
  if (await page.getByRole("textbox", { name: "Board date" }).inputValue() !== "2026-01-01") throw new Error("board-date deep link was not restored on reload");
  await page.goto("http://127.0.0.1:4194/housekeeping?date=2026-01-02");
  await page.goBack();
  await page.waitForFunction(() => document.querySelector('input[type="date"]')?.value === "2026-01-01");
  if (await page.getByRole("textbox", { name: "Board date" }).inputValue() !== "2026-01-01") throw new Error("browser Back did not restore board-date context");
  await page.goForward();
  await page.waitForFunction(() => document.querySelector('input[type="date"]')?.value === "2026-01-02");
  if (await page.getByRole("textbox", { name: "Board date" }).inputValue() !== "2026-01-02") throw new Error("browser Forward did not restore board-date context");
  for (const item of results) if (item.page !== item.viewport) throw new Error(`responsive horizontal overflow at ${item.name}: ${JSON.stringify(item)}`);
  const intentionalRefreshFailure = apiStatuses.filter(item => item.status === 503 && item.url.includes("/api/v1/housekeeping/board"));
  if (intentionalRefreshFailure.length !== 1) throw new Error("expected exactly one synthetic refresh 503: " + JSON.stringify(apiStatuses));
  const failedApi = apiStatuses.filter(item => item.status >= 400 && item !== intentionalRefreshFailure[0]);
  if (failedApi.length) throw new Error(`integrated API failures: ${JSON.stringify(failedApi)}`);
  await page.screenshot({ path: "output/playwright/cf-i05-integrated-housekeeping.png", fullPage: true });
  return { responsive: results, continuity: { focusedTask: "Queue→Case→Escape→Queue with focus restoration", failedRefresh: "board, selection, filters, and search retained; retry recovered", staleBoardResponse: { olderResponseReleasedAfterNewer: true, ...staleResponseContext }, deepLink: "date query retained on reload and browser Back/Forward" }, tenantIsolation: secondHotel, atRisk: "exact overlapping future CONFIRMED booking; advisory negative", nextTask: "advances-and-restores-focus", mutations: "validated" };
})()
