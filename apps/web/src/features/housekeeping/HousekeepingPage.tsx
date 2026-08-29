import { StatusBadge } from "../../components/StatusBadge";
import { newHousekeepingDraft } from "./model";
import { useHousekeepingWorkspace } from "./useHousekeepingWorkspace";

export function HousekeepingPage() {
  const {
    boardDate, loading, actionBusy, error, filter, search, visible, selected, draft, mobileFocus, isMobile, lastUpdated,
    taskHeadingRef, setFilter, setSearch, setDrafts, load, updateDraft, action, focusRoom, nextTask, closeFocusedTask, blocked,
  } = useHousekeepingWorkspace();

  return <section className="housekeeping-workspace">
    <div className="workspace-heading">
      <div><p className="eyebrow">Operations</p><h2>Housekeeping board</h2><p className="muted">Queue, selected room and next operational action</p></div>
      <span className="case-count">{visible.length} rooms</span>
    </div>
    <div className="housekeeping-toolbar">
      <label>Search rooms or guests <input aria-label="Search housekeeping" value={search} onChange={e => setSearch(e.target.value)} placeholder="Room, type or guest" /></label>
      <label>Board date <input aria-label="Board date" type="date" value={boardDate} disabled={loading || actionBusy} onChange={e => { if (!loading && !actionBusy) void load(e.target.value); }} /></label>
      <button type="button" aria-label="Refresh housekeeping board" disabled={loading || actionBusy} onClick={() => void load(boardDate)}>Refresh board</button>
      <button type="button" onClick={nextTask} disabled={!visible.length || loading || actionBusy}>Siguiente tarea</button>
    </div>
    <div className="housekeeping-status-strip" aria-live="polite">
      <span><strong>{visible.length}</strong> tareas visibles</span>
      <span><strong>{visible.filter(room => room.room_status === "Dirty").length}</strong> por limpiar</span>
      <span><strong>{visible.filter(room => room.room_status === "Cleaning").length}</strong> en limpieza</span>
      <span><strong>{visible.filter(room => room.room_status === "Maintenance").length}</strong> mantenimiento</span>
      {lastUpdated && <small>Actualizado {lastUpdated}</small>}
    </div>
    <div className="housekeeping-filters" role="group" aria-label="Housekeeping filters">
      {["shift", "dirty", "cleaning", "available", "maintenance"].map(value => <button type="button" className={filter === value ? "selected" : ""} key={value} onClick={() => setFilter(value)}>{value === "shift" ? "Turno" : value === "dirty" ? "Por limpiar" : value === "cleaning" ? "En limpieza" : value === "available" ? "Lista" : "Mantenimiento"}</button>)}
    </div>
    {error && <p className="error" role="alert">{error}</p>}
    {loading && <p className="muted" role="status">Loading housekeeping board…</p>}
    {!loading && !selected && <div className="housekeeping-empty" role="status"><strong>No hay tareas para mostrar</strong><p className="muted">Probá otra categoría o limpiá la búsqueda.</p><button type="button" onClick={() => { setFilter("shift"); setSearch(""); }}>Restablecer filtros</button></div>}
    {!loading && selected && <div className="housekeeping-case-layout">
      <aside className="housekeeping-queue" aria-label="Housekeeping task queue">
        <div className="queue-heading"><div><p className="eyebrow">Task queue</p><h3>Room tasks</h3></div><span>{visible.length}</span></div>
        <div className="queue-list">{visible.map(room => <button type="button" className={selected.room_id === room.room_id ? "selected" : ""} key={room.room_id} onClick={event => focusRoom(room.room_id, event.currentTarget)}><strong>Room {room.room_number}</strong><span>{room.isOrphanDeparture ? "Blocked departure" : room.room_status}</span>{room.departure_guest_name && <small>{room.departure_guest_name}</small>}</button>)}</div>
      </aside>
      {(!isMobile || mobileFocus) && <article className="housekeeping-room-workspace" role={isMobile ? "dialog" : undefined} aria-modal={isMobile ? true : undefined} aria-label={isMobile ? `Focused task room ${selected.room_number}` : undefined}>
        <div className="housekeeping-card-heading"><div><p className="eyebrow">Selected room</p><h3 ref={taskHeadingRef} tabIndex={-1}>Room {selected.room_number} · {selected.room_type}</h3><p className="muted">{selected.departure_guest_name ? `Departure today · ${selected.departure_guest_name} · ${selected.departure_booking_status}` : "No additional context."}</p></div><div className="workspace-heading-actions"><StatusBadge>{selected.room_status}</StatusBadge>{isMobile && <button type="button" onClick={closeFocusedTask}>Cerrar tarea</button>}</div></div>
        <div className="housekeeping-summary"><strong>Summary</strong>{selected.isOrphanDeparture ? <p>Blocked departure: {selected.departure_guest_name} remains visible for operational handoff; no cleaning mutation is available.</p> : selected.maintenance_case ? <p>Case {selected.maintenance_case.id.slice(0, 8)} · {selected.maintenance_case.priority} · {selected.maintenance_case.assigned_to}</p> : <p className="muted">Room context is tenant-local and selected for focused work.</p>}</div>
        <div className="housekeeping-action"><strong>Action</strong>{blocked ? <p className="muted">Blocked departure — resolve the stay handoff before cleaning.</p> : selected.room_status === "Dirty" ? <button type="button" disabled={actionBusy} onClick={() => void action(`/housekeeping/${selected.room_id}/start`, selected.room_id)}>Start cleaning</button> : selected.room_status === "Cleaning" ? <button type="button" disabled={actionBusy} onClick={() => void action(`/housekeeping/${selected.room_id}/finish`, selected.room_id)}>Finish cleaning</button> : selected.room_status === "Maintenance" ? <p className="muted">Resolve the case to return this room to Dirty.</p> : <p className="muted">No cleaning action required.</p>}</div>
        {blocked ? <div className="housekeeping-maintenance"><strong>Maintenance</strong><p className="muted">No maintenance mutation is available for an orphan departure task.</p></div> : <div className="housekeeping-maintenance"><strong>Maintenance</strong>{selected.room_status === "Maintenance" ? <><p>{selected.maintenance_case?.reason ?? "Legacy maintenance room without visible case."}</p><label>Resolution performed <input aria-label={`Resolution for room ${selected.room_number}`} value={draft.resolution} minLength={6} onChange={e => updateDraft(selected.room_id, { resolution: e.target.value })} placeholder="Describe the resolution" /></label><button type="button" disabled={actionBusy || draft.resolution.trim().length < 6} onClick={() => void action(`/housekeeping/${selected.room_id}/dirty`, selected.room_id, { case_id: selected.maintenance_case?.id, resolution_note: draft.resolution.trim() })}>{actionBusy ? "Saving…" : "Resolve and return to Dirty"}</button></> : <><label>Reason <input aria-label={`Reason for room ${selected.room_number}`} value={draft.reason} minLength={6} onChange={e => updateDraft(selected.room_id, { reason: e.target.value })} placeholder="Describe the issue" /></label><label>Priority <select aria-label="Priority" value={draft.priority} onChange={e => updateDraft(selected.room_id, { priority: e.target.value })}><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="URGENT">Urgent</option></select></label><label>Owner <input aria-label={`Owner for room ${selected.room_number}`} minLength={2} value={draft.assignedTo} onChange={e => updateDraft(selected.room_id, { assignedTo: e.target.value })} /></label><button type="button" disabled={actionBusy || draft.reason.trim().length < 6 || draft.assignedTo.trim().length < 2} onClick={() => void action(`/housekeeping/${selected.room_id}/maintenance`, selected.room_id, { reason: draft.reason.trim(), priority: draft.priority, assigned_to: draft.assignedTo.trim() })}>{actionBusy ? "Saving…" : "Create case and block"}</button><button type="button" onClick={() => setDrafts(current => ({ ...current, [selected.room_id]: newHousekeepingDraft() }))}>Clear form</button></>}</div>}
      </article>}
    </div>}
  </section>;
}
