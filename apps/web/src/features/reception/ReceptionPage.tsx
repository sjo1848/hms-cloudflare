import { BillingWorkspace } from "../billing/BillingWorkspace";
import { StatusBadge } from "../../components/StatusBadge";
import { useReceptionWorkspace } from "./useReceptionWorkspace";
import { useI18n } from "../../i18n";
import type { MessageKey } from "../../i18n";

const checkInStepKeys: MessageKey[] = ["checkin.stepVerification", "checkin.stepStayData", "checkin.stepRoom", "checkin.stepConfirm"];

function Bookings() {
  const { t, statusLabel, formatDate } = useI18n();
  const {
    bookings, rooms, guests, availableRooms, editAvailableRooms, loading, error, selected,
    checkInStep, checkInData, form, editForm,
    setCheckInStep, setCheckInData, setForm, setEditForm,
    selectCase, closeCase, refreshAvailability, submit, checkIn, reassign, checkout,
    saveEdit, cancelBooking,
  } = useReceptionWorkspace();
  const mobileStep = checkInStep;

  return <section className="reception-workspace">
    <div className="workspace-heading">
      <div><p className="eyebrow">{t("reception.eyebrow")}</p><h2>{t("reception.title")}</h2><p className="muted">{t("reception.subtitle")}</p></div>
      <span className="case-count">{t("reception.activeCases", { count: bookings.length })}</span>
    </div>

    <form onSubmit={submit} aria-label={t("reception.createAria")} className="case-create">
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
    </form>

    {error && <p className="error" role="alert">{error}</p>}
    {loading && <p className="muted" role="status">{t("reception.loadingQueue")}</p>}

    <div className="case-layout">
      <aside aria-label={t("reception.queueAria")}>
        <h3>{t("reception.caseQueue")}</h3>
        <div className="case-queue">{bookings.map(booking => <button className={selected?.id === booking.id ? "selected" : ""} key={booking.id} onClick={() => selectCase(booking)}><strong>{booking.guest_name}</strong><span>{statusLabel(booking.status)} · {t("common.room")} {booking.room_number}</span><small>{formatDate(booking.check_in)} → {formatDate(booking.check_out)}</small></button>)}</div>
      </aside>

      {selected ? <article className="case-panel">
        <div className="case-panel-heading">
          <div><p className="eyebrow">{t("reception.selectedCase")}</p><h3>{selected.guest_name}</h3><p className="muted">{formatDate(selected.check_in)} → {formatDate(selected.check_out)} · {t("common.room")} {selected.room_number}</p></div>
          <StatusBadge>{statusLabel(selected.status)}</StatusBadge>
        </div>

        {selected.status === "Confirmed" ? <form onSubmit={saveEdit} aria-label={t("reception.editAria")}>
          <h4>{t("reception.stayDetails")}</h4>
          <label>{t("common.guest")} <select aria-label={t("reception.editGuest")} value={editForm.guest_id} onChange={e => setEditForm({ ...editForm, guest_id: e.target.value })} required>{guests.map(guest => <option key={guest.id} value={guest.id}>{guest.full_name}</option>)}</select></label>
          <label>{t("common.room")} <select aria-label={t("reception.editRoom")} value={editForm.room_id} onChange={e => setEditForm({ ...editForm, room_id: e.target.value })} required><option value="">{t("reception.selectRoomDates")}</option>{editAvailableRooms.map(room => <option key={room.id} value={room.id}>{room.room_number} · {room.room_type}</option>)}</select></label>
          <label>{t("reception.checkIn")} <input aria-label={t("reception.editCheckIn")} type="date" value={editForm.check_in} onChange={e => setEditForm({ ...editForm, check_in: e.target.value })} required /></label>
          <label>{t("reception.checkOut")} <input aria-label={t("reception.editCheckOut")} type="date" value={editForm.check_out} onChange={e => setEditForm({ ...editForm, check_out: e.target.value })} required /></label>
          <label>{t("common.notes")} <input aria-label={t("reception.editNotes")} value={editForm.notes} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} placeholder={t("reception.notesOptional")} /></label>
          <button>{t("reception.saveChanges")}</button>
          <button type="button" onClick={() => void cancelBooking()}>{t("reception.cancelBooking")}</button>
          <button type="button" onClick={closeCase}>{t("reception.closeCase")}</button>
        </form> : <div className="locked-stay-details"><h4>{t("reception.stayDetails")}</h4><p className="muted">{t("reception.assignmentLocked")}</p></div>}

        {selected.status === "Confirmed" && <form onSubmit={checkIn} aria-label={t("reception.checkInAria")}>
          <h4>{t("reception.nextCheckIn")}</h4>
          <div className="step-progress" aria-label={t("reception.checkInProgress")}>{checkInStepKeys.map((step, index) => <span className={index === mobileStep ? "current" : index < mobileStep ? "complete" : ""} key={step}>{index + 1}. {t(step)}</span>)}</div>
          {(window.innerWidth >= 768 || mobileStep === 0) && <><p className="step-title">{t(checkInStepKeys[0])}</p><label>{t("reception.finalGuestCount")} <input name="check_in_guests_count" type="number" min="1" max="100" value={checkInData.count} onChange={e => setCheckInData({ ...checkInData, count: e.target.value })} required /></label><label><input type="checkbox" name="document" checked={checkInData.document} onChange={e => setCheckInData({ ...checkInData, document: e.target.checked })} required />{t("reception.documentVerified")}</label></>}
          {(window.innerWidth >= 768 || mobileStep === 1) && <><p className="step-title">{t(checkInStepKeys[1])}</p><label><input type="checkbox" name="contact" checked={checkInData.contact} onChange={e => setCheckInData({ ...checkInData, contact: e.target.checked })} required />{t("reception.contactConfirmed")}</label><label><input type="checkbox" name="stay" checked={checkInData.stay} onChange={e => setCheckInData({ ...checkInData, stay: e.target.checked })} required />{t("reception.stayConfirmed")}</label></>}
          {(window.innerWidth >= 768 || mobileStep === 2) && <><p className="step-title">{t(checkInStepKeys[2])}</p><p className="muted">{t("reception.roomAssigned", { room: selected.room_number })}</p></>}
          {(window.innerWidth >= 768 || mobileStep === 3) && <><p className="step-title">{t(checkInStepKeys[3])}</p><p className="muted">{t("reception.reviewCheckIn")}</p></>}
          {window.innerWidth < 768 && <div className="step-actions">{mobileStep > 0 && <button type="button" onClick={() => setCheckInStep(mobileStep - 1)}>{t("reception.back")}</button>}<button>{mobileStep < checkInStepKeys.length - 1 ? t("reception.nextStep") : t("reception.completeCheckIn")}</button></div>}
          {window.innerWidth >= 768 && <button>{t("reception.completeCheckIn")}</button>}
        </form>}

        {selected.status === "CheckedIn" && <>
          <form onSubmit={reassign} aria-label={t("reception.reassignAria")}>
            <h4>{t("reception.nextReassign")}</h4>
            <select name="room_id" required><option value="">{t("reception.selectDestination")}</option>{rooms.filter(room => room.id !== selected.room_id && room.status === "Available").map(room => <option key={room.id} value={room.id}>{room.room_number}</option>)}</select>
            <button>{t("reception.reassignRoom")}</button>
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
  </section>;
}

export function ReceptionPage() {
  return <><Bookings /><BillingWorkspace /></>;
}
