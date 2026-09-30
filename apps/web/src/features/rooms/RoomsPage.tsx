import { useContext, useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { api } from "../../api/client";
import type { Booking, FrontDeskBoard, Hold, Room } from "../../domain/types";
import type { MessageKey } from "../../i18n";
import { CapabilitiesContext } from "../../app/capabilities";
import { useAppRouter } from "../../app/router";
import { AsyncState } from "../../components/AsyncState";
import { StatusBadge } from "../../components/StatusBadge";
import { useI18n } from "../../i18n";
import "./rooms-operational.css";

type RoomEditForm = { room_number: string; room_type: string; price_cents: string };
type HoldDetail = Hold & { created_at?: string };
type Filters = { q: string; occupancy: string; housekeeping: string; maintenance: string; service: string; start: string; end: string; roomId: string };
const readFilters = (search: string): Filters => {
  const p = new URLSearchParams(search);
  return { q: p.get("q") ?? "", occupancy: p.get("occupancy") ?? "", housekeeping: p.get("housekeeping") ?? "", maintenance: p.get("maintenance") ?? "", service: p.get("service") ?? "", start: p.get("start") ?? "", end: p.get("end") ?? "", roomId: p.get("room_id") ?? "" };
};
const queryString = (f: Filters) => {
  const p = new URLSearchParams();
  for (const key of ["q", "occupancy", "housekeeping", "maintenance", "service", "start", "end", "room_id"] as const) {
    const value = key === "room_id" ? f.roomId : f[key];
    if (value) p.set(key, value);
  }
  return p.toString();
};
const dimension = (room: Room, key: "occupancy" | "housekeeping" | "maintenance" | "service") => {
  const state = room.operational_state;
  return key === "occupancy" ? state?.occupancy ?? "UNKNOWN" : key === "housekeeping" ? state?.housekeeping ?? "UNKNOWN" : key === "maintenance" ? state?.maintenanceImpact ?? "UNKNOWN" : state?.serviceState ?? "UNKNOWN";
};
const readinessReasons: Record<string, MessageKey> = {
  OCCUPANCY_UNKNOWN_OR_CONFLICTING: "rooms.reason.occupancyUnresolved",
  HOUSEKEEPING_UNRESOLVED: "rooms.reason.housekeepingUnresolved",
  MAINTENANCE_IMPACT_UNRESOLVED: "rooms.reason.maintenanceUnresolved",
  SERVICE_STATE_UNRESOLVED: "rooms.reason.serviceUnresolved",
  ROOM_OCCUPIED: "rooms.reason.occupied",
  HOUSEKEEPING_NOT_READY: "rooms.reason.housekeepingNotReady",
  BLOCKING_MAINTENANCE_OPEN: "rooms.reason.blockingMaintenance",
  ROOM_OUT_OF_ORDER: "rooms.reason.outOfOrder",
};
const holdTypeLabels: Record<string, MessageKey> = { Vip: "rooms.holdType.Vip", Maintenance: "rooms.holdType.Maintenance", Owner: "rooms.holdType.Owner", Compliance: "rooms.holdType.Compliance", Commercial: "rooms.holdType.Commercial", Other: "rooms.holdType.Other" };
const sellabilityReasons: Record<string, MessageKey> = {
  INTERVAL_CLEAR: "rooms.reason.intervalClear",
  SERVICE_STATE_UNRESOLVED: "rooms.reason.serviceUnresolved",
  SERVICE_OUT_OF_ORDER: "rooms.reason.outOfService",
  BLOCKING_MAINTENANCE: "rooms.reason.blockingMaintenance",
  OVERLAPPING_HOLD: "rooms.reason.hold",
  OVERLAPPING_ROOM_NIGHT: "rooms.reason.inventory",
};
function matchingBooking(room: Room, items: FrontDeskBoard["items"]) {
  const relevant = items.filter(item => item.booking.room_id === room.id && item.lane !== "finished");
  return relevant.find(item => item.booking.status.toLowerCase() === "checkedin")?.booking
    ?? relevant.find(item => item.booking.status.toLowerCase() === "confirmed")?.booking ?? null;
}

export function RoomsPage() {
  const { t, formatCurrency, formatDate } = useI18n();
  const router = useAppRouter();
  const capabilities = useContext(CapabilitiesContext).hotel;
  const canWrite = capabilities.includes("rooms.write");
  const canSearch = capabilities.includes("rooms.search");
  const canReadBookings = capabilities.includes("bookings.read");
  const canReadMaintenance = capabilities.includes("maintenance.read");
  const initial = readFilters(router.search);
  const [filters, setFilters] = useState(initial);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [board, setBoard] = useState<FrontDeskBoard | null>(null);
  const [boardError, setBoardError] = useState("");
  const [boardLoading, setBoardLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Room | null>(null);
  const [holds, setHolds] = useState<HoldDetail[]>([]);
  const [holdsError, setHoldsError] = useState("");
  const [holdLoading, setHoldLoading] = useState(false);
  const [maintenance, setMaintenance] = useState<{ reason: string; status: string; impact: string } | null>(null);
  const [maintenanceError, setMaintenanceError] = useState("");
  const [maintenanceLoading, setMaintenanceLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [holdSaving, setHoldSaving] = useState(false);
  const [editingHoldId, setEditingHoldId] = useState<string | null>(null);
  const [holdForm, setHoldForm] = useState({ start_date: "", end_date: "", hold_type: "Other", reason: "" });
  const [editing, setEditing] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ room_number: "", room_type: "STANDARD", price_cents: "" });
  const [editForm, setEditForm] = useState<RoomEditForm>({ room_number: "", room_type: "", price_cents: "" });
  const roomsRequestId = useRef(0);
  const contextRequestId = useRef(0);
  const detailRequestId = useRef(0);
  const detailRoomId = useRef<string | null>(null);
  const cameFromBoard = useRef(false);
  const lastSelectedRoomId = useRef<string | null>(null);
  const roomButtonRefs = useRef(new Map<string, HTMLButtonElement>());
  const searchRef = useRef<HTMLInputElement>(null);
  const focusRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const next = readFilters(router.search);
    if (!next.roomId && detailRoomId.current) lastSelectedRoomId.current = detailRoomId.current;
    setFilters(next);
    setSelected(rooms.find(room => room.id === next.roomId) ?? null);
  }, [router.search, rooms]);
  useEffect(() => {
    const onPopState = () => {
      const roomId = new URLSearchParams(window.location.search).get("room_id");
      if (roomId) { cameFromBoard.current = true; lastSelectedRoomId.current = roomId; }
      else cameFromBoard.current = false;
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);
  useEffect(() => {
    const params = queryString(filters);
    const current = router.search.startsWith("?") ? router.search.slice(1) : router.search;
    if (params !== current) router.navigate(router.pathname + (params ? `?${params}` : "") + router.hash, { replace: true });
  }, [filters]);
  useEffect(() => {
    if (!canSearch) setFilters(current => current.start || current.end ? { ...current, start: "", end: "" } : current);
  }, [canSearch]);

  async function loadRooms() {
    const id = ++roomsRequestId.current;
    setLoading(true);
    setError("");
    try {
      // A capability downgrade must not turn the readable room board into a
      // forbidden request just because a prior URL retained interval context.
      const range = canSearch && filters.start && filters.end ? `?start=${encodeURIComponent(filters.start)}&end=${encodeURIComponent(filters.end)}` : "";
      const next = await api<Room[]>(`/rooms${range}`);
      if (id !== roomsRequestId.current) return;
      setRooms(next);
      setSelected(current => current ? next.find(room => room.id === current.id) ?? null : next.find(room => room.id === filters.roomId) ?? null);
    } catch (e) { if (id === roomsRequestId.current) setError((e as Error).message); }
    finally { if (id === roomsRequestId.current) setLoading(false); }
  }
  async function loadContext() {
    const id = ++contextRequestId.current;
    if (!canReadBookings) { setBoard(null); setBoardError(""); setBoardLoading(false); return; }
    setBoardLoading(true);
    try {
      const next = await api<FrontDeskBoard>("/front-desk/board");
      if (id === contextRequestId.current) { setBoard(next); setBoardError(""); }
    } catch (e) { if (id === contextRequestId.current) setBoardError((e as Error).message); }
    finally { if (id === contextRequestId.current) setBoardLoading(false); }
  }
  async function loadRoomDetails(room: Room) {
    const id = ++detailRequestId.current;
    detailRoomId.current = room.id;
    setHoldLoading(true);
    setHoldsError("");
    const jobs: Promise<void>[] = [api<HoldDetail[]>(`/rooms/${room.id}/holds`).then(value => { if (id === detailRequestId.current) setHolds(value); }).catch(e => { if (id === detailRequestId.current) setHoldsError((e as Error).message); }).finally(() => { if (id === detailRequestId.current) setHoldLoading(false); })];
    if (canReadMaintenance && room.operational_state?.maintenanceImpact !== "NONE") {
      setMaintenanceLoading(true);
      setMaintenanceError("");
      jobs.push(api<{ reason: string; status: string; impact: string }>(`/housekeeping/${room.id}/maintenance`).then(value => { if (id === detailRequestId.current) setMaintenance(value); }).catch(e => { if (id === detailRequestId.current) { if ((e as Error).message.toLowerCase().includes("not found")) setMaintenance(null); else setMaintenanceError((e as Error).message); } }).finally(() => { if (id === detailRequestId.current) setMaintenanceLoading(false); }));
    } else {
      setMaintenance(null);
      setMaintenanceError("");
      setMaintenanceLoading(false);
    }
    await Promise.allSettled(jobs);
  }
  async function load() {
    const selectedRoom = selected;
    await Promise.allSettled([loadRooms(), loadContext(), ...(selectedRoom ? [loadRoomDetails(selectedRoom)] : [])]);
  }
  useEffect(() => { void loadRooms(); }, [filters.start, filters.end, canSearch]);
  useEffect(() => { void loadContext(); }, [canReadBookings]);

  async function openRoom(room: Room, push = true) {
    if (push && !selected) cameFromBoard.current = true;
    lastSelectedRoomId.current = room.id;
    detailRoomId.current = room.id;
    setSelected(room);
    setEditing(false);
    setEditForm({ room_number: room.room_number, room_type: room.room_type, price_cents: String(room.price_cents) });
    setHolds([]);
    setHoldsError("");
    setMaintenance(null);
    setMaintenanceError("");
    setMaintenanceLoading(false);
    setEditingHoldId(null);
    setHoldForm({ start_date: "", end_date: "", hold_type: "Other", reason: "" });
    setHoldLoading(true);
    const nextFilters = { ...filters, roomId: room.id };
    const q = queryString(nextFilters);
    router.navigate(router.pathname + (q ? `?${q}` : "") + router.hash, { replace: !push });
    setFilters(nextFilters);
    await loadRoomDetails(room);
  }
  useEffect(() => {
    const match = rooms.find(room => room.id === filters.roomId);
    if (match && detailRoomId.current !== match.id) void openRoom(match, false);
    if (!match && !filters.roomId) detailRoomId.current = null;
  }, [rooms, filters.roomId]);
  useEffect(() => {
    if (selected) { focusRef.current?.focus({ preventScroll: true }); return; }
    const roomId = lastSelectedRoomId.current;
    if (!roomId) return;
    requestAnimationFrame(() => {
      const button = roomButtonRefs.current.get(roomId);
      (button ?? searchRef.current)?.focus({ preventScroll: true });
      lastSelectedRoomId.current = null;
    });
  }, [selected?.id, filters.roomId, rooms.length]);

  async function submit(event: FormEvent) {
    event.preventDefault(); setSaving(true); setFormError("");
    try { await api("/rooms", { method: "POST", body: JSON.stringify({ ...form, price_cents: Number(form.price_cents) }) }); setForm({ room_number: "", room_type: "STANDARD", price_cents: "" }); setShowCreate(false); await loadRooms(); }
    catch (e) { setFormError((e as Error).message); } finally { setSaving(false); }
  }
  async function saveEdit(event: FormEvent) {
    event.preventDefault(); if (!selected) return; setEditSaving(true); setError("");
    try { await api(`/rooms/${selected.id}`, { method: "PATCH", body: JSON.stringify({ ...editForm, price_cents: Number(editForm.price_cents) }) }); setEditing(false); await loadRooms(); }
    catch (e) { setError((e as Error).message); } finally { setEditSaving(false); }
  }
  async function addHold(event: FormEvent) {
    event.preventDefault(); if (!selected) return; setHoldSaving(true); setError("");
    try {
      const path = editingHoldId ? `/rooms/${selected.id}/holds/${editingHoldId}` : `/rooms/${selected.id}/holds`;
      await api(path, { method: editingHoldId ? "PATCH" : "POST", body: JSON.stringify(holdForm) });
      setEditingHoldId(null); setHoldForm({ start_date: "", end_date: "", hold_type: "Other", reason: "" });
      await openRoom(selected, false); await loadRooms();
    }
    catch (e) { setError((e as Error).message); } finally { setHoldSaving(false); }
  }
  async function deleteHold(id: string) {
    if (!selected) return; setError("");
    try { await api(`/rooms/${selected.id}/holds/${id}`, { method: "DELETE" }); await openRoom(selected, false); await loadRooms(); }
    catch (e) { setError((e as Error).message); }
  }
  function editHold(hold: HoldDetail) {
    setEditingHoldId(hold.id);
    setHoldForm({ start_date: hold.start_date, end_date: hold.end_date, hold_type: hold.hold_type, reason: hold.reason });
  }
  const visible = useMemo(() => rooms.filter(room => {
    const state = room.operational_state;
    return (!filters.occupancy || dimension(room, "occupancy") === filters.occupancy)
      && (!filters.housekeeping || dimension(room, "housekeeping") === filters.housekeeping)
      && (!filters.maintenance || dimension(room, "maintenance") === filters.maintenance)
      && (!filters.service || dimension(room, "service") === filters.service)
      && (!filters.q || `${room.room_number} ${room.room_type} ${JSON.stringify(state)} ${matchingBooking(room, board?.items ?? [])?.guest_name ?? ""}`.toLocaleLowerCase().includes(filters.q.toLocaleLowerCase()));
  }), [rooms, filters, board]);
  const booking: Booking | null = selected ? matchingBooking(selected, board?.items ?? []) : null;
  const roomName = (room: Room) => `${t("common.room")} ${room.room_number}`;
  const backToQueue = () => {
    if (selected) lastSelectedRoomId.current = selected.id;
    if (cameFromBoard.current) {
      cameFromBoard.current = false;
      window.history.back();
      return;
    }
    setSelected(null);
    setFilters(current => { const next = { ...current, roomId: "" }; const q = queryString(next); router.navigate(router.pathname + (q ? `?${q}` : "") + router.hash, { replace: true }); return next; });
  };
  const clearFilters = () => setFilters(current => ({ ...current, q: "", occupancy: "", housekeeping: "", maintenance: "", service: "", start: "", end: "" }));
  const toggleCreateForm = () => {
    if (showCreate) { setForm({ room_number: "", room_type: "STANDARD", price_cents: "" }); setFormError(""); }
    setShowCreate(value => !value);
  };
  const beginEdit = () => {
    if (!selected) return;
    setEditForm({ room_number: selected.room_number, room_type: selected.room_type, price_cents: String(selected.price_cents) });
    setEditing(true);
  };
  const cancelEdit = () => {
    if (selected) setEditForm({ room_number: selected.room_number, room_type: selected.room_type, price_cents: String(selected.price_cents) });
    setEditing(false);
  };

  return <section className={`resource-workspace rooms-operational-workspace ${selected ? "has-selected-room" : ""}`}>
    <div className="workspace-heading rooms-heading"><div><p className="eyebrow">{t("rooms.eyebrow")}</p><h2>{t("rooms.title")}</h2><p className="muted">{t("rooms.operationalSubtitle")}</p></div><div className="rooms-heading-actions"><span className="case-count">{t("rooms.count", { count: visible.length })}</span>{canWrite && <button type="button" className="secondary-button" onClick={toggleCreateForm}>{showCreate ? t("rooms.cancelCreate") : t("rooms.manage")}</button>}</div></div>
    {showCreate && canWrite && <form className="resource-form rooms-create-form" onSubmit={submit}><label>{t("rooms.number")}<input required value={form.room_number} onChange={e => setForm({ ...form, room_number: e.target.value })} /></label><label>{t("rooms.type")}<input required value={form.room_type} onChange={e => setForm({ ...form, room_type: e.target.value })} /></label><label>{t("rooms.price")}<input required min="0" type="number" value={form.price_cents} onChange={e => setForm({ ...form, price_cents: e.target.value })} /></label><button type="submit" disabled={saving}>{saving ? t("rooms.adding") : t("rooms.add")}</button></form>}
    {formError && <p className="error" role="alert">{formError}</p>}
    <div className="resource-toolbar rooms-filters"><label>{t("rooms.search")}<input ref={searchRef} aria-label={t("rooms.search")} value={filters.q} onChange={e => setFilters({ ...filters, q: e.target.value })} placeholder={t("rooms.operationalSearchPlaceholder")} /></label>{(["occupancy", "housekeeping", "maintenance", "service"] as const).map(key => <label key={key}><span>{t(`rooms.filter.${key}`)}</span><select value={filters[key]} onChange={e => setFilters({ ...filters, [key]: e.target.value })}><option value="">{t("rooms.filter.all")}</option>{(key === "occupancy" ? ["VACANT", "OCCUPIED"] : key === "housekeeping" ? ["READY", "DIRTY", "CLEANING"] : key === "maintenance" ? ["NONE", "NON_BLOCKING", "BLOCKING"] : ["IN_SERVICE", "OUT_OF_ORDER"]).map(value => <option key={value} value={value}>{value}</option>)}<option value="UNKNOWN">{t("rooms.unresolved")}</option></select></label>)}{canSearch && <><label>{t("rooms.rangeStart")}<input type="date" value={filters.start} onChange={e => setFilters({ ...filters, start: e.target.value })} /></label><label>{t("rooms.rangeEnd")}<input type="date" value={filters.end} onChange={e => setFilters({ ...filters, end: e.target.value })} /></label></>}<button type="button" onClick={() => void load()} disabled={loading}>{t("common.refresh")}</button><button type="button" className="secondary-button" onClick={clearFilters}>{t("rooms.clearFilters")}</button></div>
    {!!(filters.start || filters.end) && (!filters.start || !filters.end || filters.start >= filters.end) && <p className="error" role="alert">{t("rooms.completeDateRange")}</p>}
    {error && <AsyncState kind="error" title={t("rooms.loadError")} message={error} onRetry={() => void load()} />}
    {loading && rooms.length === 0 && <AsyncState kind="loading" message={t("rooms.loading")} />}
    {loading && rooms.length > 0 && <p className="muted" role="status">{t("rooms.refreshing")}</p>}
    {!loading && !error && visible.length === 0 && <AsyncState kind="empty" title={t(rooms.length ? "rooms.noMatch" : "rooms.none")} message={t(rooms.length ? "rooms.trySearch" : "rooms.addFirst")} />}
    {rooms.length > 0 && <div className="resource-layout rooms-operational-layout"><div className="resource-list rooms-board" aria-label={t("rooms.listAria")} aria-busy={loading}>{visible.map(room => {
      const state = room.operational_state;
      const active = selected?.id === room.id;
      const stay = matchingBooking(room, board?.items ?? []);
      return <article className={`room-operational-card ${active ? "selected" : ""}`} key={room.id}><button ref={element => { if (element) roomButtonRefs.current.set(room.id, element); else roomButtonRefs.current.delete(room.id); }} type="button" className="room-operational-select" onClick={() => void openRoom(room)} aria-pressed={active}><span className="room-operational-top"><strong>{roomName(room)}</strong><StatusBadge>{state?.readiness.state === "READY_FOR_ARRIVAL" ? t("reception.roomReady") : state?.readiness.state === "NOT_READY" ? t("rooms.notReady") : t("reception.readinessUnknown")}</StatusBadge></span><span>{t("rooms.stateLine", { occupancy: state?.occupancy ?? "—", housekeeping: state?.housekeeping ?? "—" })}</span><span>{t("rooms.impactLine", { maintenance: state?.maintenanceImpact ?? "—", service: state?.serviceState ?? "—" })}</span>{stay ? <><strong className="room-operational-guest">{stay.guest_name}</strong><small>{formatDate(stay.check_in)} → {formatDate(stay.check_out)}</small></> : <small>{room.room_type} · {formatCurrency(room.price_cents)}</small>}</button></article>;
    })}</div><aside className="resource-detail rooms-detail" aria-label={t("rooms.selectedAria")}>{!selected && <div className="state-panel state-empty"><strong>{t("rooms.select")}</strong><span>{t("rooms.operationalSelectHint")}</span></div>}{selected && <><button className="rooms-case-back secondary-button" type="button" onClick={backToQueue}>{t("rooms.backToQueue")}</button><div className="resource-detail-heading"><div><p className="eyebrow">{t("rooms.selected")}</p><h3 ref={focusRef} tabIndex={-1}>{roomName(selected)}</h3><p className="muted">{selected.room_type} · {formatCurrency(selected.price_cents)}</p></div></div><section className="rooms-state-grid" aria-label={t("rooms.dimensions")}><div><small>{t("rooms.occupancy")}</small><strong>{dimension(selected, "occupancy")}</strong></div><div><small>{t("rooms.housekeeping")}</small><strong>{dimension(selected, "housekeeping")}</strong></div><div><small>{t("rooms.maintenance")}</small><strong>{dimension(selected, "maintenance")}</strong></div><div><small>{t("rooms.service")}</small><strong>{dimension(selected, "service")}</strong></div><div><small>{t("rooms.readiness")}</small><strong>{selected.operational_state?.readiness.state ?? "UNRESOLVED"}</strong></div></section>{selected.operational_state?.readiness.reasons.length ? <p className="rooms-attention">{t("rooms.attention")}: {selected.operational_state.readiness.reasons.map(reason => t(readinessReasons[reason] ?? "rooms.contextUnavailable")).join(", ")}</p> : null}{filters.start && filters.end && <div className="room-next-action"><span>{t("rooms.intervalSellability")}</span><strong>{selected.date_range_sellability?.state ?? "UNRESOLVED"}</strong><p>{t(sellabilityReasons[selected.date_range_sellability?.reason ?? ""] ?? "rooms.rangeNotEvaluated")} · {filters.start} → {filters.end}</p></div>}{canReadBookings && <div className="room-next-action"><span>{t("rooms.bookingContext")}</span>{boardLoading && !board ? <p role="status">{t("rooms.bookingLoading")}</p> : boardError ? <p role="status">{t("rooms.contextUnavailable")}</p> : booking ? <><strong>{booking.guest_name}</strong><p>{booking.status} · {formatDate(booking.check_in)} → {formatDate(booking.check_out)}</p><a href={`/bookings?booking_id=${encodeURIComponent(booking.id)}`}>{t("rooms.openBooking")}</a>{boardLoading && <small role="status">{t("rooms.contextRefreshing")}</small>}</> : <strong>{t("rooms.contextNoBooking")}</strong>}</div>}{canReadMaintenance && selected.operational_state?.maintenanceImpact !== "NONE" && <div className="room-next-action"><span>{t("rooms.maintenanceContext")}</span>{maintenanceLoading ? <p role="status">{t("rooms.maintenanceLoading")}</p> : maintenanceError ? <p role="status">{t("rooms.contextUnavailable")}</p> : maintenance ? <><strong>{maintenance.impact} · {maintenance.status}</strong><p>{maintenance.reason}</p></> : <p>{t("rooms.noMaintenanceContext")}</p>}</div>}{canWrite && (!editing ? <button type="button" className="secondary-button rooms-edit-trigger" onClick={beginEdit}>{t("rooms.edit")}</button> : <form className="resource-subform rooms-edit-form" onSubmit={saveEdit}><h4>{t("rooms.editDetails")}</h4><label>{t("rooms.number")}<input required value={editForm.room_number} onChange={e => setEditForm({ ...editForm, room_number: e.target.value })} /></label><label>{t("rooms.type")}<input required value={editForm.room_type} onChange={e => setEditForm({ ...editForm, room_type: e.target.value })} /></label><label>{t("rooms.price")}<input required min="0" type="number" value={editForm.price_cents} onChange={e => setEditForm({ ...editForm, price_cents: e.target.value })} /></label><button type="submit" disabled={editSaving}>{editSaving ? t("common.saving") : t("rooms.saveEdit")}</button><button type="button" className="secondary-button" onClick={cancelEdit}>{t("rooms.cancelEdit")}</button></form>)}{canWrite && <form className="resource-subform" onSubmit={addHold}><h4>{t("rooms.operationalHold")}</h4><label>{t("common.start")}<input required type="date" value={holdForm.start_date} onChange={e => setHoldForm({ ...holdForm, start_date: e.target.value })} /></label><label>{t("common.end")}<input required type="date" value={holdForm.end_date} onChange={e => setHoldForm({ ...holdForm, end_date: e.target.value })} /></label><label>{t("rooms.holdType")}<select value={holdForm.hold_type} onChange={e => setHoldForm({ ...holdForm, hold_type: e.target.value })}>{["Vip", "Maintenance", "Owner", "Compliance", "Commercial", "Other"].map(type => <option key={type} value={type}>{t(holdTypeLabels[type])}</option>)}</select></label><label>{t("common.reason")}<input required minLength={4} maxLength={250} placeholder={t("rooms.holdReasonPlaceholder")} value={holdForm.reason} onChange={e => setHoldForm({ ...holdForm, reason: e.target.value })} /></label><button type="submit" disabled={holdSaving}>{holdSaving ? t("common.saving") : editingHoldId ? t("rooms.saveHold") : t("rooms.addHold")}</button>{editingHoldId && <button type="button" className="secondary-button" onClick={() => { setEditingHoldId(null); setHoldForm({ start_date: "", end_date: "", hold_type: "Other", reason: "" }); }}>{t("rooms.cancelEdit")}</button>}</form>}{holdLoading && <p role="status">{t("rooms.loadingHolds")}</p>}{holdsError && <AsyncState kind="error" title={t("rooms.loadError")} message={holdsError} onRetry={() => void openRoom(selected, false)} />}{!holdLoading && holds.map(hold => <div className="hold-row" key={hold.id}><div><strong>{formatDate(hold.start_date)} → {formatDate(hold.end_date)}</strong><span>{t(holdTypeLabels[hold.hold_type] ?? "rooms.holdType.Other")} · {hold.reason}</span></div>{canWrite && <div className="rooms-hold-actions"><button type="button" className="secondary-button" onClick={() => editHold(hold)}>{t("rooms.editHold")}</button><button type="button" className="danger-button" onClick={() => void deleteHold(hold.id)}>{t("common.delete")}</button></div>}</div>)}{error && <p className="error" role="alert">{error}</p>}</>}</aside></div>}
    {boardError && canReadBookings && <p className="muted" role="status">{t("rooms.bookingContextUnavailable")}</p>}
  </section>;
}
