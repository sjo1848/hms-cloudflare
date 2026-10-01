import { useContext, useEffect, useRef, useState } from "react";
import { DropdownMenu, DropdownMenuItem } from "../../components/ui/dropdown-menu";
import { DialogContent } from "../../components/ui/dialog";
import { useReceptionWorkspace } from "./useReceptionWorkspace";
import { useI18n } from "../../i18n";
import { CapabilitiesContext } from "../../app/capabilities";
import { AppLink, useAppRouter } from "../../app/router";
import type { MessageKey } from "../../i18n";
import { filterQueue, queueCounts, queueFilters } from "./queue";
import type { QueueFilter, QueueLane, QueueReason } from "./queue";
import { CheckInTask } from "./CheckInTask";
import type { FrontDeskBoard } from "../../domain/types";
import "./reception-queue.css";

const filterLabelKeys: Record<QueueFilter, MessageKey> = {
  attention: "reception.queueFilterAttention",
  arrivals: "reception.queueFilterArrivals",
  departures: "reception.queueFilterDepartures",
  "in-house": "reception.queueFilterInHouse",
  reservations: "reception.queueFilterReservations",
  all: "reception.queueFilterAll",
};
const laneLabelKeys: Record<QueueLane, MessageKey> = {
  arrival: "reception.queueLaneArrival",
  departure: "reception.queueLaneDeparture",
  "in-house": "reception.queueLaneInHouse",
  reservation: "reception.queueLaneReservation",
  finished: "reception.queueLaneFinished",
  attention: "reception.queueLaneAttention",
};
const reasonLabelKeys: Record<QueueReason, MessageKey> = {
  "departure-overdue": "reception.queueReasonDepartureOverdue",
  "departure-today": "reception.queueReasonDepartureToday",
  "arrival-overdue": "reception.queueReasonArrivalOverdue",
  "arrival-today": "reception.queueReasonArrivalToday",
  "upcoming-arrival": "reception.queueReasonUpcomingArrival",
  "in-house": "reception.queueReasonInHouse",
  finished: "reception.queueReasonFinished",
  review: "reception.queueReasonReview",
};

function Bookings() {
  const { t, statusLabel, formatDate, formatCurrency } = useI18n();
  const router = useAppRouter();
  const { hotel } = useContext(CapabilitiesContext);
  const canWriteBookings = hotel.includes("bookings.write");
  const canCreateGuest = hotel.includes("guests.write");
  const {
    bookings, frontDeskBoard, rooms, guests, recoverableOperations, roomsLoading, guestsLoading, recoveryLoading, roomsError, guestsError, recoveryError, accountSummary, accountLoading, accountError, retryRooms, retryGuests, retryRecovery, retryAccountSummary, newGuestMode, newGuest, availableRooms, editAvailableRooms, reassignAvailableIds, reassignBoard, reassignMaintenanceCase, reassignHotelDate, reassignQuote, loading, refreshing, error, notice, checkInConflict, checkInNeedsRefresh, checkInAccepted, selected, actionBusy,
    checkInStep, checkInData, form, editForm,
    setCheckInStep, setCheckInData, setForm, setEditForm, setNewGuestMode, setNewGuest,
    selectCase, restoreCase, closeCase, refreshQueue, refreshCheckInContext, refreshAvailability, submit, checkIn, reassign, checkout, selectReassignDestination,
    saveEdit, cancelBooking, useRecoveredGuest, discardReservationDraft,
  } = useReceptionWorkspace();
  const [queueFilter, setQueueFilter] = useState<QueueFilter>(() => {
    const value = new URLSearchParams(window.location.search).get("lane");
    return queueFilters.find(filter => filter === value) ?? "attention";
  });
  const [queueSearch, setQueueSearch] = useState(() => new URLSearchParams(window.location.search).get("q") ?? "");
  type FocusedTask = "new-reservation" | "edit" | "reassign" | "checkout" | null;
  const [focusedTask, setFocusedTask] = useState<FocusedTask>(() => {
    const task = new URLSearchParams(window.location.search).get("task");
    return task === "new-reservation" || task === "edit" || task === "reassign" || task === "checkout" ? task : null;
  });
  const [createStep, setCreateStep] = useState(0);
  const [editStep, setEditStep] = useState(0);
  const [guestSearch, setGuestSearch] = useState("");
  const [reassignTargetId, setReassignTargetId] = useState("");
  const [checkInTaskId, setCheckInTaskId] = useState<string | null>(null);
  const [discardRequest, setDiscardRequest] = useState(0);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [checkInSuccess, setCheckInSuccess] = useState("");
  const [queueElement, setQueueElement] = useState<HTMLDivElement | null>(null);
  const pendingQueueFocusId = useRef<string | null>(null);
  const pendingDiscardAction = useRef<(() => void) | null>(null);
  const allowDirtyPop = useRef(false);
  const previousFocusedTask = useRef<FocusedTask>(focusedTask);
  const queue = frontDeskBoard?.items ?? [];
  const counts = queueCounts(queue);
  const visibleQueue = filterQueue(queue, queueFilter, queueSearch);
  const selectedBoardItem = frontDeskBoard?.items.find(item => item.booking.id === selected?.id);
  const selectedRoom = selected ? rooms.find(room => room.id === selected.room_id) : undefined;
  const roomReadinessState = (roomId: string) => rooms.find(room => room.id === roomId)?.operational_state?.readiness.state ?? "UNKNOWN";
  const roomReadinessLabel = (roomId: string) => {
    const readiness = roomReadinessState(roomId);
    return readiness === "READY_FOR_ARRIVAL" ? t("reception.roomReady") : readiness === "NOT_READY" ? t("reception.arrivalNeedsReadiness") : t("reception.readinessUnknown");
  };
  const reassignRooms = selected?.status === "CheckedIn" ? rooms.filter(room => room.id !== selected.room_id) : [];
  const boardByRoom = new Map((reassignBoard?.rooms ?? []).map(room => [room.room_id, room]));
  const effectiveDate = selected ? (reassignHotelDate && reassignHotelDate > selected.check_in ? reassignHotelDate : selected.check_in) : "";
  const createGuestReady = newGuestMode
    ? !!newGuest.full_name.trim() && !!newGuest.email.trim()
    : !!form.guest_id || (!recoveryLoading && recoverableOperations.length > 0);
  const createStepReady = createStep === 0
    ? createGuestReady && !!form.check_in && !!form.check_out
    : !!form.room_id;
  const editStepReady = !!editForm.guest_id && !!editForm.room_id && !!editForm.check_in && !!editForm.check_out
    && editForm.check_in < editForm.check_out && editAvailableRooms.some(room => room.id === editForm.room_id);
  useEffect(() => { setReassignTargetId(""); }, [selected?.id]);
  useEffect(() => {
    if (focusedTask !== "new-reservation") setCreateStep(0);
    if (focusedTask !== "edit") setEditStep(0);
  }, [focusedTask, selected?.id]);

  useEffect(() => {
    const authorized = focusedTask === "new-reservation"
      ? canWriteBookings
      : focusedTask === "edit"
        ? canWriteBookings && selected?.status === "Confirmed"
        : focusedTask === "reassign" || focusedTask === "checkout"
          ? canWriteBookings && selected?.status === "CheckedIn"
          : true;
    if (focusedTask && !authorized && (focusedTask === "new-reservation" || selected)) {
      setFocusedTask(null);
      updateLocation({ task: null, booking_id: selected?.id ?? null }, "replace");
    }
  }, [focusedTask, selected?.id, selected?.status, canWriteBookings]);

  useEffect(() => {
    if (!focusedTask) return;
    const frame = window.requestAnimationFrame(() => document.querySelector<HTMLElement>(".reception-focused-task .reception-task-fields h4, .reception-focused-task .reception-task-review h4, .reception-focused-task .reception-task-form h4")?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [focusedTask, createStep, editStep, selected?.id]);

  useEffect(() => {
    if (previousFocusedTask.current && !focusedTask) {
      const frame = window.requestAnimationFrame(() => {
        if (selected) document.querySelector<HTMLElement>(".reception-case-title")?.focus();
        else document.querySelector<HTMLElement>(".reception-create-trigger, .reception-queue-search input")?.focus();
      });
      previousFocusedTask.current = focusedTask;
      return () => window.cancelAnimationFrame(frame);
    }
    previousFocusedTask.current = focusedTask;
  }, [focusedTask, selected?.id]);

  useEffect(() => {
    if (!frontDeskBoard || loading) return;
    const frame = window.requestAnimationFrame(() => window.performance.mark("hms:reception-queue-ready"));
    return () => window.cancelAnimationFrame(frame);
  }, [frontDeskBoard, loading]);

  useEffect(() => {
    if (!selected) {
      const pendingId = pendingQueueFocusId.current;
      if (pendingId) {
        const frame = window.requestAnimationFrame(() => {
          const row = document.querySelector<HTMLButtonElement>(`[data-booking-id="${CSS.escape(pendingId)}"]`);
          if (row && row.getClientRects().length) row.focus();
          else document.querySelector<HTMLElement>(".reception-queue-tools button, .reception-queue-tools input")?.focus();
          pendingQueueFocusId.current = null;
        });
        return () => window.cancelAnimationFrame(frame);
      }
      return;
    }
    const compact = window.matchMedia("(max-width: 1000px)").matches;
    if (compact) window.requestAnimationFrame(() => document.querySelector<HTMLElement>(".reception-case-title")?.focus());
  }, [selected?.id]);

  useEffect(() => {
    const y = window.history.state?.__hmsReceptionQueueScroll;
    if (typeof y === "number" && queueElement) queueElement.scrollTop = y;
  }, [router.search, selected?.id, queueElement]);

  useEffect(() => {
    const state = window.history.state;
    const destination = state?.__hmsReceptionFocusTarget;
    if (destination !== "task" && destination !== "case" && destination !== "queue") return;
    const bookingId = typeof state.__hmsReceptionFocusBookingId === "string" ? state.__hmsReceptionFocusBookingId : null;
    const frame = window.requestAnimationFrame(() => {
      const selector = destination === "task"
        ? ".reception-focused-task .reception-task-form > h4, .reception-focused-task .reception-task-fields h4, .reception-focused-task .reception-task-review h4, .reception-focused-task h3[tabindex='-1']"
        : destination === "case"
          ? ".reception-case-title"
          : (bookingId ? `[data-booking-id='${CSS.escape(bookingId)}']` : ".reception-queue-search input");
      document.querySelector<HTMLElement>(selector)?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [focusedTask, frontDeskBoard, loading, router.search, selected?.id]);

  function updateLocation(changes: Record<string, string | null>, mode: "push" | "replace" = "replace") {
    const url = new URL(window.location.href);
    for (const [key, value] of Object.entries(changes)) {
      if (value) url.searchParams.set(key, value);
      else url.searchParams.delete(key);
    }
    router.navigate(url.pathname + url.search + url.hash, { replace: mode === "replace" });
  }

  function markReceptionHistoryFocus(target: "task" | "case" | "queue" | "check-in", bookingId?: string) {
    window.history.replaceState({ ...(window.history.state ?? {}), __hmsReceptionFocusTarget: target, __hmsReceptionFocusBookingId: bookingId }, "", window.location.href);
  }

  function openTask(task: Exclude<FocusedTask, null>) {
    if (actionBusy || (task !== "new-reservation" && !selected)) return;
    setFocusedTask(task);
    setCreateStep(0);
    setEditStep(0);
    if (selected) markReceptionHistoryFocus("case", selected.id);
    updateLocation({ task, booking_id: selected?.id ?? null }, "push");
    markReceptionHistoryFocus("task", selected?.id);
    window.history.replaceState({ ...(window.history.state ?? {}), __hmsReceptionTaskEntry: true }, "", window.location.href);
    window.requestAnimationFrame(() => document.querySelector<HTMLElement>(".reception-focused-task h4")?.focus());
  }

  function focusedTaskIsDirty() {
    if (focusedTask === "new-reservation") return !!form.guest_id || !!form.room_id || !!form.check_in || !!form.check_out || !!form.notes.trim() || newGuestMode || !!newGuest.full_name.trim() || !!newGuest.email.trim() || !!newGuest.phone.trim();
    if (focusedTask === "edit" && selected) return editForm.guest_id !== selected.guest_id || editForm.room_id !== selected.room_id || editForm.check_in !== selected.check_in || editForm.check_out !== selected.check_out || editForm.notes !== (selected.notes ?? "");
    if (focusedTask === "reassign") return !!reassignTargetId || !!document.querySelector<HTMLInputElement>(".reassign-surface input[name=reason]")?.value.trim();
    if (focusedTask === "checkout") {
      const policy = (document.querySelector('.reception-task-form select[name="policy"]') as HTMLSelectElement | null)?.value;
      return (!!policy && policy !== "settled") || !!document.querySelector<HTMLInputElement>('.reception-task-form input[name="reference"]')?.value.trim() || [...document.querySelectorAll<HTMLInputElement>('.reception-task-form input[type="checkbox"]')].some(input => input.checked);
    }
    return false;
  }

  function discardFocusedTaskDraft() {
    if (focusedTask === "new-reservation") {
      discardReservationDraft();
      setGuestSearch("");
      setCreateStep(0);
    }
    if (focusedTask === "edit" && selected) setEditForm({ guest_id: selected.guest_id, room_id: selected.room_id, check_in: selected.check_in, check_out: selected.check_out, notes: selected.notes ?? "" });
    if (focusedTask === "reassign") setReassignTargetId("");
    setEditStep(0);
  }

  function returnToCase(discardConfirmed = false) {
    if (actionBusy && !discardConfirmed) return;
    if (focusedTaskIsDirty() && !discardConfirmed) { requestDiscard(() => returnToCase(true)); return; }
    discardFocusedTaskDraft();
    setFocusedTask(null);
    setCreateStep(0);
    if (window.history.state?.__hmsReceptionTaskEntry === true) window.history.back();
    else updateLocation({ task: null, booking_id: selected?.id ?? null }, "replace");
    window.requestAnimationFrame(() => document.querySelector<HTMLElement>(selected ? ".reception-case-title" : ".reception-create-trigger, .reception-queue-search input")?.focus());
  }

  function requestDiscard(action: () => void) {
    pendingDiscardAction.current = action;
    setShowDiscardConfirm(true);
  }

  function cancelDiscard() {
    pendingDiscardAction.current = null;
    setShowDiscardConfirm(false);
  }

  function confirmDiscard() {
    const action = pendingDiscardAction.current;
    pendingDiscardAction.current = null;
    setShowDiscardConfirm(false);
    action?.();
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const bookingId = params.get("booking_id");
    const urlTask = params.get("task");
    setFocusedTask(urlTask === "new-reservation" || urlTask === "edit" || urlTask === "reassign" || urlTask === "checkout" ? urlTask : null);
    const taskId = params.get("task") === "check-in" ? bookingId : null;
    if (bookingId && selected?.id !== bookingId) {
      if (selected) closeCase();
      void restoreCase(bookingId).then(valid => {
        if (valid === false) updateLocation({ booking_id: null, task: null }, "replace");
      });
    }
    else if (!bookingId && selected) closeCase();
    if (taskId && checkInTaskId !== taskId) setCheckInTaskId(taskId);
  }, [router.search, frontDeskBoard]);

  useEffect(() => {
    function onPopState() {
      const params = new URLSearchParams(window.location.search);
      const nextBookingId = params.get("booking_id");
      if (!nextBookingId && selected?.id) pendingQueueFocusId.current = selected.id;
      const lane = params.get("lane");
      setQueueFilter(queueFilters.find(filter => filter === lane) ?? "attention");
      setQueueSearch(params.get("q") ?? "");
      const taskId = params.get("task") === "check-in" ? params.get("booking_id") : null;
      const routeTask = params.get("task");
      const nextFocusedTask = routeTask === "new-reservation" || routeTask === "edit" || routeTask === "reassign" || routeTask === "checkout" ? routeTask : null;
      if (focusedTask && nextFocusedTask !== focusedTask && focusedTaskIsDirty() && !allowDirtyPop.current) {
        if (!showDiscardConfirm) requestDiscard(() => { allowDirtyPop.current = true; window.history.back(); });
        const currentTaskUrl = `${router.pathname}${router.search}${router.hash}`;
        window.history.pushState({ ...(window.history.state ?? {}), __hmsReceptionTaskEntry: true }, "", currentTaskUrl);
        window.dispatchEvent(new PopStateEvent("popstate", { state: window.history.state }));
        return;
      }
      allowDirtyPop.current = false;
      if (focusedTask && nextFocusedTask !== focusedTask && focusedTaskIsDirty()) discardFocusedTaskDraft();
      setFocusedTask(nextFocusedTask);
      if (checkInTaskId && taskId !== checkInTaskId) {
        const dirty = checkInData.count !== "1" || checkInData.document || checkInData.contact || checkInData.stay;
        if (dirty) {
          updateLocation({ task: "check-in", booking_id: checkInTaskId }, "push");
          setDiscardRequest(current => current + 1);
          return;
        }
      }
      if (taskId !== checkInTaskId) {
        if (taskId) { void restoreCase(taskId); setCheckInTaskId(taskId); }
        else { setCheckInTaskId(null); const bookingId = params.get("booking_id"); if (bookingId) void restoreCase(bookingId); else closeCase(); }
      }
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [checkInTaskId, checkInData, editForm, focusedTask, form, frontDeskBoard, newGuest, newGuestMode, reassignTargetId, router.hash, router.pathname, router.search, selected?.id, selected?.guest_id, selected?.room_id, selected?.check_in, selected?.check_out, selected?.notes, showDiscardConfirm, t]);

  function closeCheckIn() {
    const currentId = checkInTaskId;
    if (window.history.state?.__hmsReceptionCheckInTask === true) window.history.back();
    else updateLocation({ task: null, booking_id: selected?.id ?? null });
    setCheckInTaskId(null);
    window.requestAnimationFrame(() => document.querySelector<HTMLElement>(selected ? ".reception-case-title" : `[data-booking-id="${currentId}"]`)?.focus());
  }

  function openNonArrivalCase(booking: typeof bookings[number], discardConfirmed = false) {
    if (focusedTaskIsDirty() && !discardConfirmed) { requestDiscard(() => openNonArrivalCase(booking, true)); return; }
    discardFocusedTaskDraft();
    setFocusedTask(null);
    if (queueElement) window.history.replaceState({ ...(window.history.state ?? {}), __hmsReceptionQueueScroll: queueElement.scrollTop }, "", window.location.href);
    markReceptionHistoryFocus("queue", booking.id);
    selectCase(booking);
    updateLocation({ task: null, booking_id: booking.id }, "push");
    window.history.replaceState({ ...(window.history.state ?? {}), __hmsReceptionCase: true, __hmsReceptionFocusTarget: "case", __hmsReceptionFocusBookingId: booking.id }, "", window.location.href);
  }

  function clearSelectedCase() {
    closeCase();
    updateLocation({ task: null, booking_id: null });
  }

  function openCheckIn(booking: typeof bookings[number]) {
    setFocusedTask(null);
    if (queueElement) window.history.replaceState({ ...(window.history.state ?? {}), __hmsReceptionQueueScroll: queueElement.scrollTop }, "", window.location.href);
    markReceptionHistoryFocus("case", booking.id);
    selectCase(booking);
    setCheckInSuccess("");
    updateLocation({ task: "check-in", booking_id: booking.id }, "push");
    window.history.replaceState({ ...(window.history.state ?? {}), __hmsReceptionCase: true, __hmsReceptionCheckInTask: true, __hmsReceptionFocusTarget: "check-in", __hmsReceptionFocusBookingId: booking.id }, "", window.location.href);
    setCheckInTaskId(booking.id);
  }

  function applicationBack() {
    if (focusedTask) { returnToCase(); return; }
    const row = selected?.id;
    if (window.history.state?.__hmsReceptionCase) {
      if (row) pendingQueueFocusId.current = row;
      window.history.back();
    }
    else {
      updateLocation({ task: null, booking_id: null }, "replace");
      if (row) pendingQueueFocusId.current = row;
      closeCase();
    }
  }

  function finishCheckIn(updated: FrontDeskBoard, completedId: string) {
    const next = filterQueue(updated.items, queueFilter, queueSearch).find(item => item.booking.id !== completedId);
    updateLocation({ task: null, booking_id: next?.booking.id ?? null });
    setCheckInTaskId(null);
    if (next) selectCase(next.booking);
    else closeCase();
    setCheckInSuccess(next ? t("reception.checkInSuccessNext", { guest: next.booking.guest_name }) : t("reception.checkInSuccess"));
    window.setTimeout(() => {
      const target = next
        ? document.querySelector<HTMLButtonElement>(`[data-booking-id="${next.booking.id}"]`)
        : document.querySelector<HTMLButtonElement>(".reception-queue-tools button");
      target?.focus();
    }, 0);
  }

  async function completeCheckIn() {
    const completedId = selected?.id;
    const updated = await checkIn();
    if (updated && completedId) finishCheckIn(updated, completedId);
  }

  async function refreshCheckIn() {
    const updated = await refreshCheckInContext();
    if (checkInAccepted && checkInTaskId && updated?.items.find(item => item.booking.id === checkInTaskId)?.booking.status === "CheckedIn") finishCheckIn(updated, checkInTaskId);
  }

  return <section className={`reception-workspace ${focusedTask ? "task-open" : ""}`}>
    <DialogContent open={showDiscardConfirm} onOpenChange={open => { if (!open) cancelDiscard(); }} onKeyDown={event => { if (event.key !== "Tab") return; const buttons = event.currentTarget.querySelectorAll<HTMLButtonElement>("button"); const first = buttons[0], last = buttons[buttons.length - 1]; if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); } }} className="checkin-discard" style={{ width: "min(440px,calc(100vw - 32px))", height: "auto", minHeight: 0, maxHeight: "calc(100dvh - 32px)", borderRadius: 16 }} role="alertdialog" aria-modal="true" aria-labelledby="reception-discard-title" aria-describedby="reception-discard-body"><h3 id="reception-discard-title">{t("reception.discardTaskTitle")}</h3><p id="reception-discard-body">{t("reception.discardTaskConfirm")}</p><div className="reception-task-actions"><button type="button" className="secondary-button" data-discard-cancel autoFocus onClick={cancelDiscard}>{t("reception.keepEditing")}</button><button type="button" onClick={confirmDiscard}>{t("reception.discardTask")}</button></div></DialogContent>
    <div className="workspace-heading reception-workspace-heading">
      <div><p className="eyebrow">{t("reception.eyebrow")}</p><h2>{t("reception.title")}</h2><p className="muted">{t("reception.subtitle")}</p></div>
      <div className="reception-heading-actions">
        <span className="case-count">{t("reception.queueSummary", { attention: counts.attention, all: counts.all })}</span>
        {canWriteBookings && <button type="button" className="secondary-button reception-create-trigger" disabled={actionBusy} onClick={() => openTask("new-reservation")}>{t("reception.createBooking")}</button>}
      </div>
    </div>

    {error && <p className="error" role="alert">{error}</p>}
    {notice && <p className="success" role="status">{notice}</p>}
    {checkInSuccess && <p className="success" role="status">{checkInSuccess}</p>}
    {loading ? <p className="muted" role="status">{t("reception.loadingQueue")}</p> : null}
    {refreshing ? <p className="muted reception-refreshing" role="status">{t("reception.refreshingQueue")}</p> : null}

    <div className="reception-ancillary-status" aria-live="polite">
      {(roomsLoading || roomsError) && <span>{roomsError ? <>{roomsError} <button type="button" onClick={() => void retryRooms()}>{t("common.retry")}</button></> : t("reception.roomsLoading")}</span>}
      {(guestsLoading || guestsError) && <span>{guestsError ? <>{guestsError} <button type="button" onClick={() => void retryGuests()}>{t("common.retry")}</button></> : t("reception.guestsLoading")}</span>}
      {(recoveryLoading || recoveryError) && <span>{recoveryError ? <>{recoveryError} <button type="button" onClick={() => void retryRecovery()}>{t("common.retry")}</button></> : t("reception.recoveryLoading")}</span>}
    </div>

    <div className={`case-layout reception-case-layout ${selected || focusedTask === "new-reservation" ? "case-open" : "queue-open"}`}>
      <aside className="reception-queue-panel" aria-label={t("reception.queueAria")}>
        <div className="reception-queue-heading">
          <div><h3>{t("reception.caseQueue")}</h3><p className="muted">{t("reception.queueNow")}{frontDeskBoard && ` · ${formatDate(frontDeskBoard.date)}`}</p></div>
          <div className="reception-queue-tools"><span className="reception-attention-count">{counts.attention}</span><button type="button" className="secondary-button" disabled={refreshing} onClick={() => void refreshQueue()}>{t("common.refresh")}</button></div>
        </div>
        <label className="reception-queue-search">
          <span>{t("reception.queueSearch")}</span>
          <input value={queueSearch} onChange={event => { setQueueSearch(event.target.value); updateLocation({ q: event.target.value }); }} placeholder={t("reception.queueSearchPlaceholder")} />
        </label>
        <div className="reception-queue-filters" role="group" aria-label={t("reception.queueAria")}>
          {queueFilters.map(filter => <button type="button" key={filter} aria-pressed={queueFilter === filter} className={queueFilter === filter ? "selected" : ""} onClick={() => { setQueueFilter(filter); updateLocation({ lane: filter }, "push"); }}>{t(filterLabelKeys[filter])} <span>{counts[filter]}</span></button>)}
        </div>
        <div className="case-queue reception-case-queue" ref={setQueueElement}>
          {visibleQueue.map(item => {
            const booking = item.booking;
            const readiness = roomReadinessState(booking.room_id);
            const actionKey: MessageKey = "reception.queueActionOpen";
            return <button type="button" disabled={actionBusy} data-booking-id={booking.id} className={`reception-queue-row lane-${item.lane} ${selected?.id === booking.id ? "selected" : ""}`} key={booking.id} onClick={() => openNonArrivalCase(booking)}>
              <span className="reception-row-primary">
                <strong className="reception-guest-name">{booking.guest_name}</strong>
                <strong className="reception-room-number">{t("common.room")} {booking.room_number}</strong>
              </span>
              <span className="reception-row-context">
                <span className="reception-lane-badge">{t(laneLabelKeys[item.lane])}</span>
                <span className="reception-row-reason">{t(reasonLabelKeys[item.reason])}</span>
              </span>
              <span className="reception-row-footer">
                <small>{formatDate(booking.check_in)} → {formatDate(booking.check_out)}</small>
                <span className="reception-row-action">{t(actionKey)} →</span>
              </span>
              {item.lane === "arrival" && <span className={readiness === "READY_FOR_ARRIVAL" ? "reception-row-ready" : readiness === "NOT_READY" ? "reception-row-blocked" : "reception-row-readiness-unknown"}>{roomReadinessLabel(booking.room_id)}</span>}
            </button>;
          })}
          {!loading && visibleQueue.length === 0 && <div className="reception-queue-empty"><strong>{queueFilter === "attention" ? t("reception.queueEmptyAttention") : t("reception.queueEmpty")}</strong></div>}
        </div>
      </aside>

      {selected || focusedTask === "new-reservation" ? <article className={`case-panel reception-booking-case ${focusedTask ? "reception-focused-task" : ""}`}>
        <button type="button" className="secondary-button reception-case-back" onClick={() => focusedTask ? returnToCase() : applicationBack()}>← {focusedTask ? t("reception.taskCancel") : t("reception.back")}</button>
        {focusedTask && error && <p className="error" role="alert">{error}</p>}
        {focusedTask && notice && <p className="success" role="status">{notice}</p>}
        {focusedTask === "new-reservation" ? <>
          <div className="reception-task-heading"><p className="eyebrow">{t(createStep === 0 ? "reception.taskStepGuestDates" : createStep === 1 ? "reception.taskStepRoom" : "reception.taskStepReview")} · {createStep + 1}/3</p><h3 tabIndex={-1}>{t("reception.taskTitleCreate")}</h3><p className="muted">{t("reception.availabilitySnapshot")}</p></div>
          <form onSubmit={event => { event.preventDefault(); if (createStep !== 2 || actionBusy) return; void submit(event).then(id => { if (id) { setFocusedTask(null); setCreateStep(0); updateLocation({ task: null, booking_id: id }, "replace"); } }); }} aria-label={t("reception.createAria")} className="reception-task-form">
            {createStep === 0 && <section className="reception-task-fields"><h4 tabIndex={-1}>{t("reception.taskStepGuestDates")}</h4>
              {guestsLoading && <p role="status">{t("reception.guestsLoading")}</p>}{!form.guest_id && !newGuestMode && recoveryLoading && <p role="status">{t("reception.recoveryLoading")}</p>}{guestsError && <p role="alert">{guestsError} <button type="button" onClick={() => void retryGuests()}>{t("common.retry")}</button></p>}
          <label>{t("reception.guestSearch")} {!newGuestMode && <><input type="search" value={guestSearch} onChange={event => setGuestSearch(event.target.value)} aria-label={t("reception.guestSearch")} placeholder={t("guests.searchPlaceholder")} /><select required aria-label={t("common.guest")} value={form.guest_id} onChange={e => setForm({ ...form, guest_id: e.target.value })}><option value="">{t("reception.selectGuest")}</option>{guests.filter(guest => guest.full_name.toLocaleLowerCase().includes(guestSearch.toLocaleLowerCase())).map(guest => <option key={guest.id} value={guest.id}>{guest.full_name}</option>)}</select></>}</label>
              {canCreateGuest && <label><input type="checkbox" checked={newGuestMode} onChange={event => setNewGuestMode(event.target.checked)} />{t("guests.add")}</label>}
              {newGuestMode && canCreateGuest && <><input required autoComplete="name" aria-label={t("guests.fullName")} placeholder={t("guests.namePlaceholder")} value={newGuest.full_name} onChange={event => setNewGuest({ ...newGuest, full_name: event.target.value })} /><input required type="email" autoComplete="email" aria-label={t("reception.guestEmail")} placeholder={t("reception.guestEmail")} value={newGuest.email} onChange={event => setNewGuest({ ...newGuest, email: event.target.value })} /><input type="tel" autoComplete="tel" aria-label={t("guests.phone")} placeholder={t("guests.phone")} value={newGuest.phone} onChange={event => setNewGuest({ ...newGuest, phone: event.target.value })} /></>}
              <label>{t("reception.checkIn")} <input required type="date" value={form.check_in} onChange={e => setForm({ ...form, check_in: e.target.value })} /></label><label>{t("reception.checkOut")} <input required type="date" value={form.check_out} onChange={e => setForm({ ...form, check_out: e.target.value })} /></label>
            </section>}
            {createStep === 1 && <section className="reception-task-fields"><h4 tabIndex={-1}>{t("reception.taskStepRoom")}</h4>{roomsLoading && <p role="status">{t("reception.roomsLoading")}</p>}{recoveryLoading && <p role="status">{t("reception.recoveryLoading")}</p>}{recoveryError && <p role="alert">{recoveryError} <button type="button" onClick={() => void retryRecovery()}>{t("common.retry")}</button></p>}<button type="button" onClick={() => void refreshAvailability()}>{t("reception.findRooms")}</button><select required aria-label={t("common.room")} value={form.room_id} onChange={e => setForm({ ...form, room_id: e.target.value })}><option value="">{t("reception.selectAvailableRoom")}</option>{availableRooms.map(room => <option key={room.id} value={room.id}>{room.room_number} · {room.room_type} · {formatCurrency(room.price_cents)}</option>)}</select><label>{t("common.notes")} <input placeholder={t("reception.notesOptional")} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></label>{recoverableOperations.length > 0 && <section className="reception-recovery-list"><h4>{t("reception.recoveryPendingTitle")}</h4>{recoverableOperations.map(operation => <div key={operation.operation_token} className="reception-recovery-item"><span><strong>{operation.guest_name}</strong><small>{formatDate(operation.check_in)} → {formatDate(operation.check_out)}</small></span><button type="button" onClick={() => useRecoveredGuest(operation)}>{t("reception.recoverGuest")}</button></div>)}</section>}</section>}
            {createStep === 2 && <section className="reception-task-review"><h4 tabIndex={-1}>{t("reception.taskStepReview")}</h4><p>{newGuestMode ? newGuest.full_name : guests.find(guest => guest.id === form.guest_id)?.full_name}</p><p>{formatDate(form.check_in)} → {formatDate(form.check_out)}</p><p>{t("common.room")} {availableRooms.find(room => room.id === form.room_id)?.room_number}</p><p>{form.notes || t("common.noAdditionalContext")}</p></section>}
            <footer className="reception-task-actions">{createStep > 0 && <button type="button" className="secondary-button" onClick={() => setCreateStep(step => step - 1)}>{t("reception.back")}</button>}<button type="button" className="secondary-button" onClick={() => returnToCase()}>{t("reception.taskCancel")}</button>{createStep < 2 ? <button type="button" disabled={!createStepReady} onClick={event => { event.preventDefault(); if (!createStepReady) return; if (createStep === 0) { setCreateStep(1); void refreshAvailability(); } else setCreateStep(2); }}>{t("reception.taskContinue")}</button> : <button type="submit" disabled={actionBusy}>{actionBusy ? t("common.saving") : t("reception.createBooking")}</button>}</footer>
          </form>
        </> : selected && <>
        <div className="case-panel-heading reception-case-title" tabIndex={-1}>
          <div><p className="eyebrow">{t("reception.selectedCase")}</p><h3>{selected.guest_name}</h3><p className="muted">{formatDate(selected.check_in)} → {formatDate(selected.check_out)} · {t("common.room")} {selected.room_number}</p></div>
        </div>
        <section className="reception-case-signals" aria-label={t("reception.caseSignals")}>
          <div><span>{t("reception.caseState")}</span><strong>{statusLabel(selected.status)}</strong></div>
          {selectedBoardItem && <div><span>{t("reception.caseAttention")}</span><strong>{t(reasonLabelKeys[selectedBoardItem.reason])}</strong></div>}
          <div><span>{t("reception.caseImpact")}</span><strong>{selectedBoardItem?.maintenance_case ? selectedBoardItem.maintenance_case.impact === "BLOCKING" ? t("reception.impactBlocking") : t("reception.impactAdvisory") : t("reception.noKnownImpact")}</strong></div>
          {selectedRoom && <div><span>{t("reception.roomReadiness")}</span><strong>{roomReadinessLabel(selected.room_id)}</strong></div>}
        </section>

        {hotel.includes("billing.invoice.read") && <section className="reception-account-summary" aria-label={t("billing.invoice")}>
          <h4>{t("billing.invoice")}</h4>
          {accountLoading ? <p role="status">{t("common.loading")}</p> : accountError ? <p role="alert">{accountError} <button type="button" onClick={() => void retryAccountSummary()}>{t("common.retry")}</button></p> : accountSummary ? <dl>
            <div><dt>{t("billing.total")}</dt><dd>{formatCurrency(accountSummary.amount_cents)}</dd></div>
            <div><dt>{t("billing.paid")}</dt><dd>{formatCurrency(accountSummary.paid_amount_cents)}</dd></div>
            <div><dt>{t("billing.remaining")}</dt><dd>{formatCurrency(Math.max(accountSummary.amount_cents - accountSummary.paid_amount_cents, 0))}</dd></div>
            <div><dt>{t("billing.credit")}</dt><dd>{formatCurrency(Math.max(accountSummary.paid_amount_cents - accountSummary.amount_cents, 0))}</dd></div>
          </dl> : <p className="muted">{t("reception.noAccountSummary")}</p>}
          {hotel.includes("billing.read") && hotel.includes("bookings.read") && <AppLink className="reception-account-link" to={`/billing?booking_id=${encodeURIComponent(selected.id)}&return_to=${encodeURIComponent(router.pathname + router.search + router.hash)}`} onBeforeNavigate={() => window.history.replaceState({ ...(window.history.state ?? {}), __hmsReceptionFocusTarget: "case", __hmsReceptionFocusBookingId: selected.id }, "", window.location.href)}>{t("billing.title")}</AppLink>}
        </section>}
        {selected.status === "Confirmed" && selectedBoardItem?.lane === "arrival" && <div className="reception-arrival-actions">{canWriteBookings && <button type="button" className="reception-checkin-trigger" onClick={() => openCheckIn(selected)}>{t("reception.queueActionCheckIn")} →</button>}<DropdownMenu label={t("reception.moreActions")}>{canWriteBookings && <><DropdownMenuItem onClick={() => openTask("edit")}>{t("reception.editAria")}</DropdownMenuItem><DropdownMenuItem onClick={() => void cancelBooking()}>{t("reception.cancelBooking")}</DropdownMenuItem></>}<DropdownMenuItem onClick={clearSelectedCase}>{t("reception.closeCase")}</DropdownMenuItem></DropdownMenu></div>}

        {selected.status === "Confirmed" && canWriteBookings && focusedTask === "edit" ? <form onSubmit={event => { event.preventDefault(); if (editStep !== 1 || actionBusy) return; void saveEdit(event).then(ok => { if (ok) returnToCase(true); }); }} aria-label={t("reception.editAria")} className="reception-task-form">
          <h4 tabIndex={-1}>{t("reception.taskTitleEdit")}</h4><p className="eyebrow">{editStep === 0 ? `1/2 · ${t("reception.stayDetails")}` : `2/2 · ${t("reception.editReview")}`}</p>
          {guestsError && <p role="alert">{guestsError} <button type="button" onClick={() => void retryGuests()}>{t("common.retry")}</button></p>}
          {editStep === 0 ? <>
            <h4>{t("reception.stayDetails")}</h4>
            <label>{t("common.guest")} <select aria-label={t("reception.editGuest")} value={editForm.guest_id} onChange={e => setEditForm({ ...editForm, guest_id: e.target.value })} required>{guests.map(guest => <option key={guest.id} value={guest.id}>{guest.full_name}</option>)}</select></label>
            <label>{t("common.room")} <select aria-label={t("reception.editRoom")} value={editForm.room_id} onChange={e => setEditForm({ ...editForm, room_id: e.target.value })} required><option value="">{t("reception.selectRoomDates")}</option>{editAvailableRooms.map(room => <option key={room.id} value={room.id}>{room.room_number} · {room.room_type}</option>)}</select></label>
            <label>{t("reception.checkIn")} <input aria-label={t("reception.editCheckIn")} type="date" value={editForm.check_in} onChange={e => setEditForm({ ...editForm, check_in: e.target.value })} required /></label>
            <label>{t("reception.checkOut")} <input aria-label={t("reception.editCheckOut")} type="date" value={editForm.check_out} onChange={e => setEditForm({ ...editForm, check_out: e.target.value })} required /></label>
            <label>{t("common.notes")} <input aria-label={t("reception.editNotes")} value={editForm.notes} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} placeholder={t("reception.notesOptional")} /></label>
            <p className="muted" role="status">{t("reception.availabilitySnapshot")}</p>
            <footer className="reception-task-actions"><button type="button" className="secondary-button" onClick={() => returnToCase()}>{t("reception.taskCancel")}</button><button type="button" disabled={!editStepReady} onClick={() => setEditStep(1)}>{t("reception.taskContinue")}</button></footer>
          </> : <>
            <section className="reception-task-review"><h4 tabIndex={-1}>{t("reception.editReview")}</h4>
              <p><strong>{t("common.guest")}</strong> · {guests.find(guest => guest.id === editForm.guest_id)?.full_name ?? editForm.guest_id}</p>
              <p><strong>{t("common.room")}</strong> · {editAvailableRooms.find(room => room.id === editForm.room_id)?.room_number ?? editForm.room_id}</p>
              <p><strong>{t("reception.stayDetails")}</strong> · {formatDate(editForm.check_in)} → {formatDate(editForm.check_out)}</p>
              <p><strong>{t("common.notes")}</strong> · {editForm.notes || t("common.noAdditionalContext")}</p>
              <p className="muted">{t("reception.editReviewAuthoritative")}</p>
            </section>
            <footer className="reception-task-actions"><button type="button" className="secondary-button" onClick={() => setEditStep(0)}>{t("reception.back")}</button><button type="button" className="secondary-button" onClick={() => returnToCase()}>{t("reception.taskCancel")}</button><button disabled={actionBusy}>{actionBusy ? t("common.saving") : t("reception.saveChanges")}</button></footer>
          </>}
        </form> : selected.status !== "Confirmed" ? <div className="locked-stay-details"><h4>{t("reception.stayDetails")}</h4><p className="muted">{t("reception.assignmentLocked")}</p></div> : null}

        {selected.status === "Confirmed" && selectedBoardItem?.lane !== "arrival" && canWriteBookings && <div className="reception-arrival-actions"><button type="button" className="reception-checkin-trigger" onClick={() => openCheckIn(selected)}>{t("reception.queueActionCheckIn")} →</button><button type="button" className="secondary-button" onClick={() => openTask("edit")}>{t("reception.editAria")}</button><DropdownMenu label={t("reception.moreActions")}><DropdownMenuItem onClick={() => void cancelBooking()}>{t("reception.cancelBooking")}</DropdownMenuItem></DropdownMenu></div>}

        {selected.status === "CheckedIn" && canWriteBookings && <div className="reception-case-actions">
          {focusedTask === null && <><button type="button" className="secondary-button" onClick={() => openTask("reassign")}>{t("reception.nextReassign")}</button><button type="button" className="secondary-button" onClick={() => openTask("checkout")}>{t("reception.nextCheckout")}</button></>}
          {focusedTask === "reassign" && <form onSubmit={event => { void reassign(event).then(ok => { if (ok) returnToCase(true); }); }} aria-label={t("reception.reassignAria")} className="reassign-surface reception-task-form">
            <div className="reassign-surface-heading"><div><p className="eyebrow">{t("reception.reassignContext")}</p><h4 tabIndex={-1}>{t("reception.nextReassign")}</h4><p className="muted">{t("reception.reassignStayContext", { room: selected.room_number, checkout: formatDate(selected.check_out) })}</p></div><span className="reassign-date-chip">{effectiveDate ? formatDate(effectiveDate) : t("common.loading")}</span></div>
            <div className="reassign-room-summary"><div><span className="muted">{t("reception.reassignCurrentRoom")}</span><strong>{selected.room_number}</strong></div><span aria-hidden="true">→</span><div><span className="muted">{t("reception.reassignDestinationRoom")}</span><strong>{t("reception.reassignChooseRoom")}</strong></div></div>
            <label>{t("reception.selectDestination")} <select name="room_id" required disabled={!reassignBoard || actionBusy} value={reassignTargetId} onChange={event => { setReassignTargetId(event.target.value); void selectReassignDestination(event.target.value); }} aria-describedby="reassign-room-help"><option value="">{t("reception.selectDestination")}</option>{reassignRooms.map(room => {
              const boardRoom = boardByRoom.get(room.id);
              const selectedMaintenance = room.id === reassignTargetId ? reassignMaintenanceCase : boardRoom?.maintenance_case;
              const blocking = selectedMaintenance?.impact === "BLOCKING" || room.status === "Maintenance";
              const inventoryFree = reassignAvailableIds.has(room.id);
              const selectable = room.status === "Available" && inventoryFree && !blocking;
              const reason = blocking ? t("reception.reassignBlockedMaintenance") : room.status !== "Available" ? t("reception.reassignPhysicalUnavailable") : !inventoryFree ? t("reception.reassignInventoryUnavailable") : selectedMaintenance?.impact === "NON_BLOCKING" ? t("reception.reassignNonBlockingAdvisory") : "";
              return <option key={room.id} value={room.id} disabled={!selectable}>{room.room_number} · {room.room_type} · {formatCurrency(room.price_cents)}{reason ? ` · ${reason}` : ""}</option>;
            })}</select></label>
            <p id="reassign-room-help" className="muted reassign-room-help">{t("reception.reassignRoomHelp")}</p>
            {reassignTargetId && <section className="reassign-price-impact" aria-live="polite" aria-label={t("reception.reassignPriceSummary")}>
              <h5>{t("reception.reassignPriceSummary")}</h5>
              {reassignQuote?.destination_room_id === reassignTargetId ? <>
                <p className="muted">{t("reception.reassignPriceNote")}</p>
                <dl>
                  <div><dt>{t("reception.reassignCurrentTotal")}</dt><dd>{formatCurrency(reassignQuote.current_total_cents)}</dd></div>
                  <div><dt>{t("reception.reassignNewTotal")}</dt><dd>{formatCurrency(reassignQuote.new_total_cents)}</dd></div>
                  <div><dt>{t("reception.reassignPriceDifference")}</dt><dd>{reassignQuote.delta_cents > 0 ? t("reception.reassignIncrease", { amount: formatCurrency(reassignQuote.delta_cents) }) : reassignQuote.delta_cents < 0 ? t("reception.reassignCredit", { amount: formatCurrency(Math.abs(reassignQuote.delta_cents)) }) : t("reception.reassignNoPriceChange")}</dd></div>
                </dl>
              </> : <p className="muted" role="status">{t("reception.reassignQuoteLoading")}</p>}
            </section>}
            <label>{t("common.reason")} <input name="reason" minLength={6} maxLength={250} required aria-describedby="reassign-reason-help" disabled={actionBusy} /><span id="reassign-reason-help" className="field-hint">{t("reception.reassignReasonHint")}</span></label>
            <footer className="reception-task-actions"><button type="button" className="secondary-button" onClick={() => returnToCase()}>{t("reception.taskCancel")}</button><button disabled={actionBusy || !reassignBoard || !reassignQuote || reassignQuote.destination_room_id !== reassignTargetId}>{actionBusy ? t("reception.reassignSubmitting") : t("reception.reassignRoom")}</button></footer>
          </form>
          }
          {focusedTask === "checkout" && <form onSubmit={event => { void checkout(event).then(ok => { if (ok) returnToCase(true); }); }} aria-label={t("reception.checkoutAria")} className="reception-task-form">
            <h4 tabIndex={-1}>{t("reception.nextCheckout")}</h4>
            <label>{t("reception.paymentPolicy")} <select name="policy" required><option value="settled">{t("reception.settled")}</option>{hotel.includes("bookings.checkout.override") && <option value="pending-approved">{t("reception.pendingApproved")}</option>}</select></label>
            <label>{t("reception.closingReference")} <input name="reference" minLength={6} placeholder={t("reception.referenceHint")} /></label>
            {([["charges", "reception.chargesReviewed"], ["release", "reception.roomReleaseConfirmed"], ["handoff", "reception.housekeepingHandoffConfirmed"]] as const satisfies ReadonlyArray<readonly [string, MessageKey]>).map(([name, label]) => <label key={name}><input type="checkbox" name={name} required />{t(label)}</label>)}
            <footer className="reception-task-actions"><button type="button" className="secondary-button" onClick={() => returnToCase()}>{t("reception.taskCancel")}</button><button disabled={actionBusy}>{t("reception.completeCheckout")}</button></footer>
          </form>
          }
        </div>}
        </>}
      </article> : <div className="empty-case"><h3>{t("reception.selectCase")}</h3><p className="muted">{t("reception.selectCaseHint")}</p></div>}
    </div>
    {checkInTaskId && selected?.id === checkInTaskId && <CheckInTask booking={selected} item={selectedBoardItem} step={checkInStep} setStep={setCheckInStep} data={checkInData} setData={setCheckInData} busy={actionBusy} conflict={checkInConflict} needsRefresh={checkInNeedsRefresh} error={error} discardRequest={discardRequest} onRefresh={refreshCheckIn} onComplete={completeCheckIn} onClose={closeCheckIn} />}
  </section>;
}

export function ReceptionPage() {
  return <Bookings />;
}
