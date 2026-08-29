import { StatusBadge } from "../../components/StatusBadge";
import { newHousekeepingDraft } from "./model";
import { useHousekeepingWorkspace } from "./useHousekeepingWorkspace";
import { useI18n } from "../../i18n";

export function HousekeepingPage() {
  const { t, statusLabel, priorityLabel, formatTime } = useI18n();
  const {
    boardDate, loading, actionBusy, error, filter, search, visible, selected, draft, mobileFocus, isMobile, lastUpdated,
    taskHeadingRef, setFilter, setSearch, setDrafts, load, updateDraft, action, focusRoom, nextTask, closeFocusedTask, blocked,
  } = useHousekeepingWorkspace();

  return <section className="housekeeping-workspace">
    <div className="workspace-heading">
      <div><p className="eyebrow">{t("housekeeping.operations")}</p><h2>{t("housekeeping.title")}</h2><p className="muted">{t("housekeeping.subtitle")}</p></div>
      <span className="case-count">{t("housekeeping.count", { count: visible.length })}</span>
    </div>
    <div className="housekeeping-toolbar">
      <label>{t("housekeeping.search")} <input aria-label={t("housekeeping.searchAria")} value={search} onChange={e => setSearch(e.target.value)} placeholder={t("housekeeping.searchPlaceholder")} /></label>
      <label>{t("housekeeping.boardDate")} <input aria-label={t("housekeeping.boardDate")} type="date" value={boardDate} disabled={loading || actionBusy} onChange={e => { if (!loading && !actionBusy) void load(e.target.value); }} /></label>
      <button type="button" aria-label={t("housekeeping.refreshAria")} disabled={loading || actionBusy} onClick={() => void load(boardDate)}>{t("housekeeping.refresh")}</button>
      <button type="button" onClick={nextTask} disabled={!visible.length || loading || actionBusy}>{t("housekeeping.nextTask")}</button>
    </div>
    <div className="housekeeping-status-strip" aria-live="polite">
      <span><strong>{visible.length}</strong> {t("housekeeping.visibleTasks")}</span>
      <span><strong>{visible.filter(room => room.room_status === "Dirty").length}</strong> {t("housekeeping.toClean")}</span>
      <span><strong>{visible.filter(room => room.room_status === "Cleaning").length}</strong> {t("housekeeping.cleaning")}</span>
      <span><strong>{visible.filter(room => room.room_status === "Maintenance").length}</strong> {t("housekeeping.maintenance")}</span>
      {lastUpdated && <small>{t("housekeeping.updated", { time: formatTime(lastUpdated) })}</small>}
    </div>
    <div className="housekeeping-filters" role="group" aria-label={t("housekeeping.filtersAria")}>
      {["shift", "dirty", "cleaning", "available", "maintenance"].map(value => <button type="button" className={filter === value ? "selected" : ""} key={value} onClick={() => setFilter(value)}>{t(value === "shift" ? "housekeeping.filterShift" : value === "dirty" ? "housekeeping.filterDirty" : value === "cleaning" ? "housekeeping.filterCleaning" : value === "available" ? "housekeeping.filterAvailable" : "housekeeping.filterMaintenance")}</button>)}
    </div>
    {error && <p className="error" role="alert">{error}</p>}
    {loading && <p className="muted" role="status">{t("housekeeping.loading")}</p>}
    {!loading && !selected && <div className="housekeeping-empty" role="status"><strong>{t("housekeeping.empty")}</strong><p className="muted">{t("housekeeping.emptyHint")}</p><button type="button" onClick={() => { setFilter("shift"); setSearch(""); }}>{t("housekeeping.reset")}</button></div>}
    {!loading && selected && <div className="housekeeping-case-layout">
      <aside className="housekeeping-queue" aria-label={t("housekeeping.queueAria")}>
        <div className="queue-heading"><div><p className="eyebrow">{t("housekeeping.taskQueue")}</p><h3>{t("housekeeping.roomTasks")}</h3></div><span>{visible.length}</span></div>
        <div className="queue-list">{visible.map(room => <button type="button" className={selected.room_id === room.room_id ? "selected" : ""} key={room.room_id} onClick={event => focusRoom(room.room_id, event.currentTarget)}><strong>{t("common.room")} {room.room_number}</strong><span>{room.isOrphanDeparture ? t("housekeeping.blockedDeparture") : statusLabel(room.room_status)}</span>{room.departure_guest_name && <small>{room.departure_guest_name}</small>}</button>)}</div>
      </aside>
      {(!isMobile || mobileFocus) && <article className="housekeeping-room-workspace" role={isMobile ? "dialog" : undefined} aria-modal={isMobile ? true : undefined} aria-label={isMobile ? t("housekeeping.focusedTask", { room: selected.room_number }) : undefined}>
        <div className="housekeeping-card-heading"><div><p className="eyebrow">{t("housekeeping.selectedRoom")}</p><h3 ref={taskHeadingRef} tabIndex={-1}>{t("common.room")} {selected.room_number} · {selected.room_type}</h3><p className="muted">{selected.departure_guest_name ? t("housekeeping.departureToday", { guest: selected.departure_guest_name, status: statusLabel(selected.departure_booking_status ?? "") }) : t("common.noAdditionalContext")}</p></div><div className="workspace-heading-actions"><StatusBadge>{statusLabel(selected.room_status)}</StatusBadge>{isMobile && <button type="button" onClick={closeFocusedTask}>{t("housekeeping.closeTask")}</button>}</div></div>
        <div className="housekeeping-summary"><strong>{t("housekeeping.summary")}</strong>{selected.isOrphanDeparture ? <p>{t("housekeeping.blockedDepartureDetail", { guest: selected.departure_guest_name ?? "" })}</p> : selected.maintenance_case ? <p>{t("housekeeping.caseSummary", { id: selected.maintenance_case.id.slice(0, 8), priority: priorityLabel(selected.maintenance_case.priority), owner: selected.maintenance_case.assigned_to })}</p> : <p className="muted">{t("housekeeping.tenantContext")}</p>}</div>
        <div className="housekeeping-action"><strong>{t("housekeeping.action")}</strong>{blocked ? <p className="muted">{t("housekeeping.resolveHandoff")}</p> : selected.room_status === "Dirty" ? <button type="button" disabled={actionBusy} onClick={() => void action(`/housekeeping/${selected.room_id}/start`, selected.room_id)}>{t("housekeeping.startCleaning")}</button> : selected.room_status === "Cleaning" ? <button type="button" disabled={actionBusy} onClick={() => void action(`/housekeeping/${selected.room_id}/finish`, selected.room_id)}>{t("housekeeping.finishCleaning")}</button> : selected.room_status === "Maintenance" ? <p className="muted">{t("housekeeping.resolveReturnDirty")}</p> : <p className="muted">{t("housekeeping.noAction")}</p>}</div>
        {blocked ? <div className="housekeeping-maintenance"><strong>{t("housekeeping.filterMaintenance")}</strong><p className="muted">{t("housekeeping.noMaintenanceOrphan")}</p></div> : <div className="housekeeping-maintenance"><strong>{t("housekeeping.filterMaintenance")}</strong>{selected.room_status === "Maintenance" ? <><p>{selected.maintenance_case?.reason ?? t("housekeeping.legacyMaintenance")}</p><label>{t("housekeeping.resolution")} <input aria-label={t("housekeeping.resolution")} value={draft.resolution} minLength={6} onChange={e => updateDraft(selected.room_id, { resolution: e.target.value })} placeholder={t("housekeeping.resolutionPlaceholder")} /></label><button type="button" disabled={actionBusy || draft.resolution.trim().length < 6} onClick={() => void action(`/housekeeping/${selected.room_id}/dirty`, selected.room_id, { case_id: selected.maintenance_case?.id, resolution_note: draft.resolution.trim() })}>{actionBusy ? t("common.saving") : t("housekeeping.resolveDirty")}</button></> : <><label>{t("common.reason")} <input aria-label={t("common.reason")} value={draft.reason} minLength={6} onChange={e => updateDraft(selected.room_id, { reason: e.target.value })} placeholder={t("housekeeping.issuePlaceholder")} /></label><label>{t("common.priority")} <select aria-label={t("common.priority")} value={draft.priority} onChange={e => updateDraft(selected.room_id, { priority: e.target.value })}><option value="LOW">{priorityLabel("LOW")}</option><option value="MEDIUM">{priorityLabel("MEDIUM")}</option><option value="HIGH">{priorityLabel("HIGH")}</option><option value="URGENT">{priorityLabel("URGENT")}</option></select></label><label>{t("common.owner")} <input aria-label={t("common.owner")} minLength={2} value={draft.assignedTo} onChange={e => updateDraft(selected.room_id, { assignedTo: e.target.value })} /></label><button type="button" disabled={actionBusy || draft.reason.trim().length < 6 || draft.assignedTo.trim().length < 2} onClick={() => void action(`/housekeeping/${selected.room_id}/maintenance`, selected.room_id, { reason: draft.reason.trim(), priority: draft.priority, assigned_to: draft.assignedTo.trim() })}>{actionBusy ? t("common.saving") : t("housekeeping.createCase")}</button><button type="button" onClick={() => setDrafts(current => ({ ...current, [selected.room_id]: newHousekeepingDraft() }))}>{t("housekeeping.clearForm")}</button></>}</div>}
      </article>}
    </div>}
  </section>;
}
