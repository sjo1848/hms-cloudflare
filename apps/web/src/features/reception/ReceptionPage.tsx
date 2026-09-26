import { useEffect, useState } from "react";
import { BillingWorkspace } from "../billing/BillingWorkspace";
import { StatusBadge } from "../../components/StatusBadge";
import { useReceptionWorkspace } from "./useReceptionWorkspace";
import { useI18n } from "../../i18n";
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
  const {
    bookings, frontDeskBoard, rooms, guests, availableRooms, editAvailableRooms, reassignAvailableIds, reassignBoard, reassignMaintenanceCase, reassignInvoice, reassignExtraCents, reassignHotelDate, loading, refreshing, error, notice, checkInConflict, checkInNeedsRefresh, checkInAccepted, selected, actionBusy,
    checkInStep, checkInData, form, editForm,
    setCheckInStep, setCheckInData, setForm, setEditForm,
    selectCase, closeCase, refreshQueue, refreshCheckInContext, refreshAvailability, submit, checkIn, reassign, checkout, selectReassignDestination,
    saveEdit, cancelBooking,
  } = useReceptionWorkspace();
  const [queueFilter, setQueueFilter] = useState<QueueFilter>(() => {
    const value = new URLSearchParams(window.location.search).get("lane");
    return queueFilters.find(filter => filter === value) ?? "attention";
  });
  const [queueSearch, setQueueSearch] = useState(() => new URLSearchParams(window.location.search).get("q") ?? "");
  const [showCreate, setShowCreate] = useState(false);
  const [showArrivalEdit, setShowArrivalEdit] = useState(false);
  const [reassignTargetId, setReassignTargetId] = useState("");
  const [checkInTaskId, setCheckInTaskId] = useState<string | null>(null);
  const [discardRequest, setDiscardRequest] = useState(0);
  const [checkInSuccess, setCheckInSuccess] = useState("");
  const queue = frontDeskBoard?.items ?? [];
  const counts = queueCounts(queue);
  const visibleQueue = filterQueue(queue, queueFilter, queueSearch);
  const selectedBoardItem = frontDeskBoard?.items.find(item => item.booking.id === selected?.id);
  const currentRoom = selected ? rooms.find(room => room.id === selected.room_id) : undefined;
  const stayNights = selected ? Math.max(0, (Date.parse(`${selected.check_out}T00:00:00Z`) - Date.parse(`${selected.check_in}T00:00:00Z`)) / 86400000) : 0;
  const extraCents = selected ? reassignExtraCents || Math.max(0, selected.total_cents - (currentRoom?.price_cents ?? 0) * stayNights) : 0;
  const reassignRooms = selected?.status === "CheckedIn" ? rooms.filter(room => room.id !== selected.room_id) : [];
  const boardByRoom = new Map((reassignBoard?.rooms ?? []).map(room => [room.room_id, room]));
  const effectiveDate = selected ? (reassignHotelDate && reassignHotelDate > selected.check_in ? reassignHotelDate : selected.check_in) : "";
  const reassignTarget = rooms.find(room => room.id === reassignTargetId);
  const reassignNewTotal = reassignTarget ? reassignTarget.price_cents * stayNights + extraCents : null;
  const reassignDifference = reassignNewTotal == null || !selected ? null : reassignNewTotal - selected.total_cents;
  useEffect(() => { setReassignTargetId(""); }, [selected?.id]);
  useEffect(() => { setShowArrivalEdit(false); }, [selected?.id]);

  function updateLocation(changes: Record<string, string | null>, mode: "push" | "replace" = "replace") {
    const url = new URL(window.location.href);
    for (const [key, value] of Object.entries(changes)) {
      if (value) url.searchParams.set(key, value);
      else url.searchParams.delete(key);
    }
    window.history[mode === "push" ? "pushState" : "replaceState"]({}, "", url);
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const taskId = params.get("task") === "check-in" ? params.get("booking_id") : null;
    if (!taskId || checkInTaskId || !frontDeskBoard) return;
    const match = frontDeskBoard.items.find(item => item.booking.id === taskId);
    if (match) { selectCase(match.booking); setCheckInTaskId(taskId); }
  }, [frontDeskBoard]);

  useEffect(() => {
    function onPopState() {
      const params = new URLSearchParams(window.location.search);
      const lane = params.get("lane");
      setQueueFilter(queueFilters.find(filter => filter === lane) ?? "attention");
      setQueueSearch(params.get("q") ?? "");
      const taskId = params.get("task") === "check-in" ? params.get("booking_id") : null;
      if (checkInTaskId && taskId !== checkInTaskId) {
        const dirty = checkInData.count !== "1" || checkInData.document || checkInData.contact || checkInData.stay;
        if (dirty) {
          updateLocation({ task: "check-in", booking_id: checkInTaskId }, "push");
          setDiscardRequest(current => current + 1);
          return;
        }
      }
      if (taskId !== checkInTaskId) {
        const match = taskId ? frontDeskBoard?.items.find(item => item.booking.id === taskId) : null;
        if (match) { selectCase(match.booking); setCheckInTaskId(taskId); }
        else setCheckInTaskId(null);
      }
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [checkInTaskId, checkInData, frontDeskBoard]);

  function closeCheckIn() {
    const currentId = checkInTaskId;
    updateLocation({ task: null, booking_id: selected?.id ?? null });
    setCheckInTaskId(null);
    window.requestAnimationFrame(() => document.querySelector<HTMLButtonElement>(`[data-booking-id="${currentId}"]`)?.focus());
  }

  function openNonArrivalCase(booking: typeof bookings[number]) {
    selectCase(booking);
    updateLocation({ task: null, booking_id: booking.id }, "push");
  }

  function clearSelectedCase() {
    closeCase();
    updateLocation({ task: null, booking_id: null });
  }

  function openCheckIn(booking: typeof bookings[number]) {
    selectCase(booking);
    setShowArrivalEdit(false);
    setCheckInSuccess("");
    updateLocation({ task: "check-in", booking_id: booking.id }, "push");
    setCheckInTaskId(booking.id);
  }

  function finishCheckIn(updated: FrontDeskBoard, completedId: string) {
    const next = filterQueue(updated.items, queueFilter, queueSearch).find(item => item.booking.id !== completedId);
    updateLocation({ task: null, booking_id: next?.booking.id ?? null });
    setCheckInTaskId(null);
    if (next) selectCase(next.booking);
    else closeCase();
    setCheckInSuccess(next ? t("reception.checkInSuccessNext", { guest: next.booking.guest_name }) : t("reception.checkInSuccess"));
    window.requestAnimationFrame(() => {
      const target = next
        ? document.querySelector<HTMLButtonElement>(`[data-booking-id="${next.booking.id}"]`)
        : document.querySelector<HTMLButtonElement>(".reception-queue-tools button");
      target?.focus();
    });
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

  return <section className="reception-workspace">
    <div className="workspace-heading reception-workspace-heading">
      <div><p className="eyebrow">{t("reception.eyebrow")}</p><h2>{t("reception.title")}</h2><p className="muted">{t("reception.subtitle")}</p></div>
      <div className="reception-heading-actions">
        <span className="case-count">{t("reception.queueSummary", { attention: counts.attention, all: counts.all })}</span>
        <button type="button" className="secondary-button reception-create-trigger" onClick={() => setShowCreate(current => !current)}>{showCreate ? t("common.close") : t("reception.createBooking")}</button>
      </div>
    </div>

    {showCreate && <form onSubmit={submit} aria-label={t("reception.createAria")} className="case-create reception-create-panel">
      <h3>{t("reception.openCase")}</h3>
      <select required aria-label={t("common.guest")} value={form.guest_id} onChange={e => setForm({ ...form, guest_id: e.target.value })}>
        <option value="">{t("reception.selectGuest")}</option>{guests.map(guest => <option key={guest.id} value={guest.id}>{guest.full_name}</option>)}
      </select>
      <select required aria-label={t("common.room")} value={form.room_id} onChange={e => setForm({ ...form, room_id: e.target.value })}>
        <option value="">{t("reception.selectAvailableRoom")}</option>{availableRooms.map(room => <option key={room.id} value={room.id}>{room.room_number} · {room.room_type}</option>)}
      </select>
      <label>{t("reception.checkIn")} <input required type="date" value={form.check_in} onChange={e => setForm({ ...form, check_in: e.target.value })} /></label>
      <label>{t("reception.checkOut")} <input required type="date" value={form.check_out} onChange={e => setForm({ ...form, check_out: e.target.value })} /></label>
      <button type="button" onClick={() => void refreshAvailability()}>{t("reception.findRooms")}</button>
      <input placeholder={t("reception.notesOptional")} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
      <button>{t("reception.createBooking")}</button>
    </form>}

    {error && <p className="error" role="alert">{error}</p>}
    {notice && <p className="success" role="status">{notice}</p>}
    {checkInSuccess && <p className="success" role="status">{checkInSuccess}</p>}
    {loading && <p className="muted" role="status">{t("reception.loadingQueue")}</p>}
    {refreshing && <p className="muted reception-refreshing" role="status">{t("reception.refreshingQueue")}</p>}

    <div className="case-layout reception-case-layout">
      <aside className="reception-queue-panel" aria-label={t("reception.queueAria")}>
        <div className="reception-queue-heading">
          <div><h3>{t("reception.caseQueue")}</h3><p className="muted">{t("reception.queueNow")}{frontDeskBoard && ` · ${formatDate(frontDeskBoard.date)}`}</p></div>
          <div className="reception-queue-tools"><span className="reception-attention-count">{counts.attention}</span><button type="button" className="secondary-button" disabled={refreshing} onClick={() => void refreshQueue()}>{t("common.refresh")}</button></div>
        </div>
        <label className="reception-queue-search">
          <span>{t("reception.queueSearch")}</span>
          <input value={queueSearch} onChange={event => { setQueueSearch(event.target.value); updateLocation({ q: event.target.value }); }} placeholder={t("reception.queueSearchPlaceholder")} />
        </label>
        <div className="reception-queue-filters" aria-label={t("reception.queueAria")}>
          {queueFilters.map(filter => <button type="button" key={filter} className={queueFilter === filter ? "selected" : ""} onClick={() => { setQueueFilter(filter); updateLocation({ lane: filter }, "push"); }}>{t(filterLabelKeys[filter])} <span>{counts[filter]}</span></button>)}
        </div>
        <div className="case-queue reception-case-queue">
          {visibleQueue.map(item => {
            const booking = item.booking;
            const actionKey: MessageKey = item.lane === "arrival" ? "reception.queueActionCheckIn" : item.lane === "departure" ? "reception.queueActionCheckout" : "reception.queueActionOpen";
            return <button type="button" data-booking-id={booking.id} className={`reception-queue-row lane-${item.lane} ${selected?.id === booking.id ? "selected" : ""}`} key={booking.id} onClick={() => item.lane === "arrival" ? openCheckIn(booking) : openNonArrivalCase(booking)}>
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
              {item.lane === "arrival" && <span className={item.room_status === "Available" && item.maintenance_case?.impact !== "BLOCKING" ? "reception-row-ready" : "reception-row-blocked"}>{item.room_status === "Available" && item.maintenance_case?.impact !== "BLOCKING" ? t("reception.roomReady") : t("reception.arrivalNeedsReadiness")}</span>}
            </button>;
          })}
          {!loading && visibleQueue.length === 0 && <div className="reception-queue-empty"><strong>{queueFilter === "attention" ? t("reception.queueEmptyAttention") : t("reception.queueEmpty")}</strong></div>}
        </div>
      </aside>

      {selected ? <article className="case-panel">
        <div className="case-panel-heading">
          <div><p className="eyebrow">{t("reception.selectedCase")}</p><h3>{selected.guest_name}</h3><p className="muted">{formatDate(selected.check_in)} → {formatDate(selected.check_out)} · {t("common.room")} {selected.room_number}</p></div>
          <StatusBadge>{statusLabel(selected.status)}</StatusBadge>
        </div>

        {selected.status === "Confirmed" && selectedBoardItem?.lane === "arrival" && <div className="reception-arrival-actions"><button type="button" className="reception-checkin-trigger" onClick={() => openCheckIn(selected)}>{t("reception.queueActionCheckIn")} →</button><button type="button" className="secondary-button" onClick={() => setShowArrivalEdit(current => !current)}>{showArrivalEdit ? t("common.close") : t("reception.editAria")}</button><button type="button" className="secondary-button" onClick={clearSelectedCase}>{t("reception.closeCase")}</button></div>}

        {selected.status === "Confirmed" && (selectedBoardItem?.lane !== "arrival" || showArrivalEdit) ? <form onSubmit={saveEdit} aria-label={t("reception.editAria")}>
          <h4>{t("reception.stayDetails")}</h4>
          <label>{t("common.guest")} <select aria-label={t("reception.editGuest")} value={editForm.guest_id} onChange={e => setEditForm({ ...editForm, guest_id: e.target.value })} required>{guests.map(guest => <option key={guest.id} value={guest.id}>{guest.full_name}</option>)}</select></label>
          <label>{t("common.room")} <select aria-label={t("reception.editRoom")} value={editForm.room_id} onChange={e => setEditForm({ ...editForm, room_id: e.target.value })} required><option value="">{t("reception.selectRoomDates")}</option>{editAvailableRooms.map(room => <option key={room.id} value={room.id}>{room.room_number} · {room.room_type}</option>)}</select></label>
          <label>{t("reception.checkIn")} <input aria-label={t("reception.editCheckIn")} type="date" value={editForm.check_in} onChange={e => setEditForm({ ...editForm, check_in: e.target.value })} required /></label>
          <label>{t("reception.checkOut")} <input aria-label={t("reception.editCheckOut")} type="date" value={editForm.check_out} onChange={e => setEditForm({ ...editForm, check_out: e.target.value })} required /></label>
          <label>{t("common.notes")} <input aria-label={t("reception.editNotes")} value={editForm.notes} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} placeholder={t("reception.notesOptional")} /></label>
          <button>{t("reception.saveChanges")}</button>
          <button type="button" onClick={() => void cancelBooking()}>{t("reception.cancelBooking")}</button>
          <button type="button" onClick={clearSelectedCase}>{t("reception.closeCase")}</button>
        </form> : selected.status !== "Confirmed" ? <div className="locked-stay-details"><h4>{t("reception.stayDetails")}</h4><p className="muted">{t("reception.assignmentLocked")}</p></div> : null}

        {selected.status === "Confirmed" && selectedBoardItem?.lane !== "arrival" && <button type="button" className="reception-checkin-trigger" onClick={() => openCheckIn(selected)}>{t("reception.queueActionCheckIn")} →</button>}

        {selected.status === "CheckedIn" && <>
          <form onSubmit={reassign} aria-label={t("reception.reassignAria")} className="reassign-surface">
            <div className="reassign-surface-heading"><div><p className="eyebrow">{t("reception.reassignContext")}</p><h4>{t("reception.nextReassign")}</h4><p className="muted">{t("reception.reassignStayContext", { room: selected.room_number, checkout: formatDate(selected.check_out) })}</p></div><span className="reassign-date-chip">{effectiveDate ? formatDate(effectiveDate) : t("common.loading")}</span></div>
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
            <div className="reassign-price-summary" aria-label={t("reception.reassignPriceSummary")}>
              <div><span className="muted">{t("billing.total")}</span><strong>{formatCurrency(selected.total_cents)}</strong></div>
              <div><span className="muted">{t("reception.reassignNewTotal")}</span><strong data-testid="reassign-new-total">{reassignNewTotal == null ? t("reception.reassignChooseRoom") : formatCurrency(reassignNewTotal)}</strong></div>
              <div><span className="muted">{t("billing.paid")}</span><strong>{formatCurrency(reassignInvoice?.paid_amount_cents ?? 0)}</strong></div>
            </div>
            <p className="muted reassign-price-note">{reassignDifference == null ? t("reception.reassignPriceNote", { nights: stayNights }) : reassignDifference > 0 ? t("reception.reassignIncrease", { amount: formatCurrency(reassignDifference) }) : reassignDifference < 0 ? t("reception.reassignCredit", { amount: formatCurrency(Math.abs(reassignDifference)) }) : t("reception.reassignNoPriceChange")}</p>
            {reassignNewTotal != null && <p className="reassign-balance-note">{t("billing.remaining")}: {formatCurrency(Math.max(0, reassignNewTotal - (reassignInvoice?.paid_amount_cents ?? 0)))} · {t("reception.reassignCreditBalance")}: {formatCurrency(Math.max(0, (reassignInvoice?.paid_amount_cents ?? 0) - reassignNewTotal))}</p>}
            <label>{t("common.reason")} <input name="reason" minLength={6} maxLength={250} required aria-describedby="reassign-reason-help" disabled={actionBusy} /><span id="reassign-reason-help" className="field-hint">{t("reception.reassignReasonHint")}</span></label>
            <button disabled={actionBusy || !reassignBoard}>{actionBusy ? t("reception.reassignSubmitting") : t("reception.reassignRoom")}</button>
          </form>
          <form onSubmit={checkout} aria-label={t("reception.checkoutAria")}>
            <h4>{t("reception.nextCheckout")}</h4>
            <label>{t("reception.paymentPolicy")} <select name="policy" required><option value="settled">{t("reception.settled")}</option><option value="pending-approved">{t("reception.pendingApproved")}</option></select></label>
            <label>{t("reception.closingReference")} <input name="reference" minLength={6} placeholder={t("reception.referenceHint")} /></label>
            {([["charges", "reception.chargesReviewed"], ["release", "reception.roomReleaseConfirmed"], ["handoff", "reception.housekeepingHandoffConfirmed"]] as const satisfies ReadonlyArray<readonly [string, MessageKey]>).map(([name, label]) => <label key={name}><input type="checkbox" name={name} required />{t(label)}</label>)}
            <button>{t("reception.completeCheckout")}</button>
          </form>
        </>}
      </article> : <div className="empty-case"><h3>{t("reception.selectCase")}</h3><p className="muted">{t("reception.selectCaseHint")}</p></div>}
    </div>
    {checkInTaskId && selected?.id === checkInTaskId && <CheckInTask booking={selected} item={selectedBoardItem} step={checkInStep} setStep={setCheckInStep} data={checkInData} setData={setCheckInData} busy={actionBusy} conflict={checkInConflict} needsRefresh={checkInNeedsRefresh} error={error} discardRequest={discardRequest} onRefresh={refreshCheckIn} onComplete={completeCheckIn} onClose={closeCheckIn} />}
  </section>;
}

export function ReceptionPage() {
  return <><Bookings /><BillingWorkspace /></>;
}
