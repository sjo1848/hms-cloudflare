import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import type { Booking, FrontDeskItem } from "../../domain/types";
import { useI18n } from "../../i18n";
import type { MessageKey } from "../../i18n";
import type { CheckInData } from "./model";

const steps: MessageKey[] = ["checkin.stepVerification", "checkin.stepStayData", "checkin.stepRoom", "checkin.stepConfirm"];

type Props = {
  booking: Booking;
  item: FrontDeskItem | undefined;
  step: number;
  setStep: (step: number) => void;
  data: CheckInData;
  setData: (data: CheckInData) => void;
  busy: boolean;
  conflict: string;
  needsRefresh: boolean;
  error: string;
  discardRequest: number;
  onRefresh: () => Promise<unknown>;
  onComplete: () => Promise<void>;
  onClose: () => void;
};

export function CheckInTask({ booking, item, step, setStep, data, setData, busy, conflict, needsRefresh, error, discardRequest, onRefresh, onComplete, onClose }: Props) {
  const { t, formatDate } = useI18n();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const stepHeadingRef = useRef<HTMLHeadingElement>(null);
  const seenDiscardRequest = useRef(discardRequest);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const dirty = data.count !== "1" || data.document || data.contact || data.stay;
  const blocking = !item || item.room_status !== "Available" || item.maintenance_case?.impact === "BLOCKING";
  const eligible = booking.status === "Confirmed" && !blocking;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.showModal();
    stepHeadingRef.current?.focus();
    return () => { if (dialog.open) dialog.close(); };
  }, []);

  useEffect(() => { if (!confirmDiscard) stepHeadingRef.current?.focus(); }, [step, confirmDiscard]);
  useEffect(() => {
    if (discardRequest > seenDiscardRequest.current) setConfirmDiscard(true);
    seenDiscardRequest.current = discardRequest;
  }, [discardRequest]);

  function requestClose() {
    if (busy) return;
    if (dirty) setConfirmDiscard(true);
    else onClose();
  }

  function advance(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    if (step < 3) { setStep(step + 1); return; }
    if (eligible && !needsRefresh) void onComplete();
  }

  return <dialog ref={dialogRef} className="checkin-task" aria-label={t("reception.checkInAria")} onCancel={event => { event.preventDefault(); requestClose(); }}>
    {confirmDiscard ? <div className="checkin-discard" role="alertdialog" aria-label={t("reception.checkInDiscardTitle")}>
      <h3>{t("reception.checkInDiscardTitle")}</h3>
      <p>{t("reception.checkInDiscardBody")}</p>
      <div className="checkin-task-actions"><button type="button" className="secondary-button" onClick={() => setConfirmDiscard(false)}>{t("reception.keepWorking")}</button><button type="button" onClick={onClose}>{t("reception.discardCheckIn")}</button></div>
    </div> : <form onSubmit={advance} aria-label={t("reception.checkInAria")} className="checkin-task-form">
      <header className="checkin-task-header">
        <div><p className="eyebrow">{t("reception.queueLaneArrival")}</p><h2>{t("reception.nextCheckIn")}</h2><p>{booking.guest_name} · {t("common.room")} {booking.room_number}</p><small>{formatDate(booking.check_in)} → {formatDate(booking.check_out)}</small></div>
        <button type="button" className="secondary-button" onClick={requestClose} aria-label={t("reception.closeCheckIn")}>×</button>
      </header>
      <div className="checkin-task-body">
        <nav className="step-progress" aria-label={t("reception.checkInProgress")}>{steps.map((key, index) => <span key={key} className={index === step ? "current" : index < step ? "complete" : ""} aria-current={index === step ? "step" : undefined}>{index + 1}. {t(key)}</span>)}</nav>
        <h3 ref={stepHeadingRef} tabIndex={-1} className="checkin-step-heading">{t(steps[step])}</h3>
        {conflict && <div className="checkin-blocker" role="alert"><strong>{conflict}</strong><button type="button" className="secondary-button" onClick={() => void onRefresh()}>{t("reception.refreshArrival")}</button></div>}
        {error && <p className="error" role="alert">{error}</p>}
        {step === 0 && <div className="checkin-fields"><label>{t("reception.finalGuestCount")}<input name="check_in_guests_count" type="number" min="1" max="100" value={data.count} onChange={event => setData({ ...data, count: event.target.value })} required /></label><label className="checkin-check"><input type="checkbox" name="document" checked={data.document} onChange={event => setData({ ...data, document: event.target.checked })} required />{t("reception.documentVerified")}</label></div>}
        {step === 1 && <div className="checkin-fields"><label className="checkin-check"><input type="checkbox" name="contact" checked={data.contact} onChange={event => setData({ ...data, contact: event.target.checked })} required />{t("reception.contactConfirmed")}</label><label className="checkin-check"><input type="checkbox" name="stay" checked={data.stay} onChange={event => setData({ ...data, stay: event.target.checked })} required />{t("reception.stayConfirmed")}</label><p className="muted">{booking.guest_name} · {formatDate(booking.check_in)} → {formatDate(booking.check_out)}</p></div>}
        {step === 2 && <div className="checkin-readiness"><p>{t("reception.roomAssigned", { room: booking.room_number })}</p><strong className={blocking ? "checkin-not-ready" : "checkin-ready"}>{!item ? t("reception.readinessUnknown") : item.maintenance_case?.impact === "BLOCKING" ? t("reception.blockedMaintenance") : item.room_status !== "Available" ? t("reception.roomNotReady", { status: item.room_status }) : t("reception.roomReady")}</strong>{item?.maintenance_case?.impact === "NON_BLOCKING" && <p className="checkin-advisory">{t("reception.maintenanceAdvisory")}: {item.maintenance_case.reason}</p>}{blocking && <p>{t("reception.readinessHelp")}</p>}</div>}
        {step === 3 && <div className="checkin-review"><p>{t("reception.reviewCheckIn")}</p><dl><div><dt>{t("common.guest")}</dt><dd>{booking.guest_name} · {data.count}</dd></div><div><dt>{t("common.room")}</dt><dd>{booking.room_number}</dd></div><div><dt>{t("reception.checkOut")}</dt><dd>{formatDate(booking.check_out)}</dd></div><div><dt>{t("checkin.stepRoom")}</dt><dd>{eligible ? t("reception.roomReady") : t("reception.readinessUnknown")}</dd></div></dl></div>}
        {booking.status !== "Confirmed" && <p className="checkin-blocker" role="alert">{t("reception.arrivalChanged")}</p>}
      </div>
      <footer className="checkin-task-actions">{step > 0 && <button type="button" className="secondary-button" disabled={busy} onClick={() => setStep(step - 1)}>{t("reception.back")}</button>}<button type="submit" disabled={busy || needsRefresh || (step >= 2 && !eligible)}>{busy ? t("reception.checkInSubmitting") : step < 3 ? t("reception.nextStep") : t("reception.completeCheckIn")}</button></footer>
    </form>}
  </dialog>;
}
