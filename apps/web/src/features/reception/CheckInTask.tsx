import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "../../components/ui/drawer";
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
  const stepHeadingRef = useRef<HTMLHeadingElement>(null);
  const discardRef = useRef<HTMLDivElement>(null);
  const seenDiscardRequest = useRef(discardRequest);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [mobile, setMobile] = useState(() => typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(max-width: 900px)").matches);
  const dirty = data.count !== "1" || data.document || data.contact || data.stay;
  const blocking = !item || item.room_status !== "Available" || item.maintenance_case?.impact === "BLOCKING";
  const eligible = booking.status === "Confirmed" && !blocking;

  useEffect(() => {
    const media = window.matchMedia("(max-width: 900px)");
    const update = () => setMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    stepHeadingRef.current?.focus();
  }, []);

  useEffect(() => {
    if (confirmDiscard) discardRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
    else stepHeadingRef.current?.focus();
  }, [step, confirmDiscard]);
  useEffect(() => {
    if (discardRequest > seenDiscardRequest.current) setConfirmDiscard(true);
    seenDiscardRequest.current = discardRequest;
  }, [discardRequest]);

  function requestClose() {
    if (busy) return;
    if (dirty) setConfirmDiscard(true);
    else onClose();
  }

  function handleOpenChange(open: boolean) {
    if (!open) requestClose();
  }

  function advance(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    if (step < 3) { setStep(step + 1); return; }
    if (eligible && !needsRefresh) void onComplete();
  }

  const SurfaceHeader = mobile ? DrawerHeader : DialogHeader;
  const SurfaceTitle = mobile ? DrawerTitle : DialogTitle;
  const SurfaceDescription = mobile ? DrawerDescription : DialogDescription;
  const task = <>
    <form onSubmit={advance} aria-label={t("reception.checkInAria")} className="checkin-task-form">
      <SurfaceHeader className="checkin-task-header">
      <div><p className="eyebrow">{t("reception.queueLaneArrival")}</p><SurfaceTitle id="checkin-task-title" className="checkin-task-title">{t("reception.nextCheckIn")}</SurfaceTitle><SurfaceDescription id="checkin-task-description" className="checkin-task-description">{booking.guest_name} · {t("common.room")} {booking.room_number}</SurfaceDescription><small>{formatDate(booking.check_in)} → {formatDate(booking.check_out)}</small></div>
      <button type="button" className="secondary-button" onClick={requestClose} aria-label={t("reception.closeCheckIn")}>×</button>
      </SurfaceHeader>
      {confirmDiscard ? <div ref={discardRef} className="checkin-discard" role="alertdialog" aria-label={t("reception.checkInDiscardTitle")}>
      <h3>{t("reception.checkInDiscardTitle")}</h3>
      <p>{t("reception.checkInDiscardBody")}</p>
      <div className="checkin-task-actions"><button type="button" className="secondary-button" onClick={() => setConfirmDiscard(false)}>{t("reception.keepWorking")}</button><button type="button" onClick={onClose}>{t("reception.discardCheckIn")}</button></div>
      </div> : <>
      <div className="checkin-task-body">
        <section className={`checkin-status-summary ${blocking ? "is-blocking" : item?.maintenance_case?.impact === "NON_BLOCKING" ? "is-advisory" : "is-ready"}`} aria-label={t("reception.staySummary")}>
          <div className="checkin-status-heading"><strong>{t("reception.staySummary")}</strong><span>{!item ? t("reception.readinessUnknown") : item.maintenance_case?.impact === "BLOCKING" ? t("reception.readinessBlockingLabel") : item.maintenance_case?.impact === "NON_BLOCKING" ? t("reception.readinessAdvisoryLabel") : item.room_status !== "Available" ? t("reception.roomNotReady", { status: item.room_status }) : t("reception.readinessReadyLabel")}</span></div>
          <p>{t("reception.roomAssigned", { room: booking.room_number })}</p>
          <small>{formatDate(booking.check_in)} → {formatDate(booking.check_out)}</small>
          {item?.maintenance_case?.impact === "NON_BLOCKING" && <p className="checkin-advisory"><strong>{t("reception.maintenanceAdvisory")}</strong>: {item.maintenance_case.reason}</p>}
          {blocking && <p className="checkin-next-action">{t("reception.readinessNextAction")}</p>}
        </section>
        <nav className="step-progress" aria-label={t("reception.checkInProgress")}>{steps.map((key, index) => <span key={key} className={index === step ? "current" : index < step ? "complete" : ""} aria-current={index === step ? "step" : undefined}>{index + 1}. {t(key)}</span>)}</nav>
        <h3 ref={stepHeadingRef} tabIndex={-1} className="checkin-step-heading">{t(steps[step])}</h3>
        {conflict && <div className="checkin-blocker" role="alert"><strong>{conflict}</strong><button type="button" className="secondary-button" onClick={() => void onRefresh()}>{t("reception.refreshArrival")}</button></div>}
        {error && <p className="error" role="alert">{error}</p>}
        {step === 0 && <div className="checkin-fields"><label>{t("reception.finalGuestCount")}<input name="check_in_guests_count" type="number" min="1" max="100" value={data.count} onChange={event => setData({ ...data, count: event.target.value })} required /></label><label className="checkin-check"><input type="checkbox" name="document" checked={data.document} onChange={event => setData({ ...data, document: event.target.checked })} required />{t("reception.documentVerified")}</label></div>}
        {step === 1 && <div className="checkin-fields"><label className="checkin-check"><input type="checkbox" name="contact" checked={data.contact} onChange={event => setData({ ...data, contact: event.target.checked })} required />{t("reception.contactConfirmed")}</label><label className="checkin-check"><input type="checkbox" name="stay" checked={data.stay} onChange={event => setData({ ...data, stay: event.target.checked })} required />{t("reception.stayConfirmed")}</label><p className="muted">{booking.guest_name} · {formatDate(booking.check_in)} → {formatDate(booking.check_out)}</p></div>}
        {step === 2 && <div className="checkin-readiness"><p>{t("reception.roomAssigned", { room: booking.room_number })}</p><strong className={blocking ? "checkin-not-ready" : "checkin-ready"}>{!item ? t("reception.readinessUnknown") : item.maintenance_case?.impact === "BLOCKING" ? t("reception.blockedMaintenance") : item.room_status !== "Available" ? t("reception.roomNotReady", { status: item.room_status }) : t("reception.roomReady")}</strong>{blocking && <><p>{t("reception.readinessHelp")}</p>{!conflict && <button type="button" className="secondary-button" onClick={() => void onRefresh()} disabled={busy}>{t("reception.refreshArrival")}</button>}</>}</div>}
        {step === 3 && <div className="checkin-review"><p>{t("reception.reviewCheckIn")}</p><dl><div><dt>{t("common.guest")}</dt><dd>{booking.guest_name} · {data.count}</dd></div><div><dt>{t("common.room")}</dt><dd>{booking.room_number}</dd></div><div><dt>{t("reception.checkIn")}</dt><dd>{formatDate(booking.check_in)}</dd></div><div><dt>{t("reception.checkOut")}</dt><dd>{formatDate(booking.check_out)}</dd></div><div><dt>{t("checkin.stepRoom")}</dt><dd>{eligible ? t("reception.roomReady") : t("reception.readinessUnknown")}</dd></div></dl><p className="checkin-consequences">{t("reception.afterCheckIn")}</p></div>}
        {booking.status !== "Confirmed" && <p className="checkin-blocker" role="alert">{t("reception.arrivalChanged")}</p>}
      </div>
      <footer className="checkin-task-actions">{step > 0 && <button type="button" className="secondary-button" disabled={busy} onClick={() => setStep(step - 1)}>{t("reception.back")}</button>}<button type="submit" disabled={busy || needsRefresh || (step >= 2 && !eligible)}>{busy ? t("reception.checkInSubmitting") : step < 3 ? t("reception.nextStep") : t("reception.completeCheckIn")}</button></footer>
      </>}
    </form>
  </>;

  return mobile
    ? <DrawerContent open onOpenChange={handleOpenChange} className="checkin-task checkin-task-drawer" aria-labelledby="checkin-task-title" aria-describedby="checkin-task-description">
        {task}
      </DrawerContent>
    : <DialogContent open onOpenChange={handleOpenChange} className="checkin-task checkin-task-dialog" aria-labelledby="checkin-task-title" aria-describedby="checkin-task-description">
        {task}
      </DialogContent>;
}
