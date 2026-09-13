import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { api } from "../../api/client";
import type { Booking, Hold, Room } from "../../domain/types";
import { AsyncState } from "../../components/AsyncState";
import { StatusBadge } from "../../components/StatusBadge";
import { useI18n } from "../../i18n";
import "./rooms-operational.css";

type RoomEditForm = { room_number: string; room_type: string; price_cents: string };
type RoomContext = { booking: Booking | null; kind: "occupied" | "arrival-due" | "upcoming" | "none" };

function localTodayKey() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function normalizedStatus(status: string) {
  return status.replace(/[\s_-]/g, "").toLowerCase();
}

function roomContext(room: Room, bookings: Booking[]): RoomContext {
  const today = localTodayKey();
  const relevant = bookings
    .filter(booking => {
      const status = normalizedStatus(booking.status);
      return booking.room_id === room.id && status !== "cancelled" && status !== "canceled" && status !== "checkedout";
    })
    .sort((a, b) => a.check_in.localeCompare(b.check_in));
  const occupied = relevant.find(booking => normalizedStatus(booking.status) === "checkedin");
  if (occupied) return { booking: occupied, kind: "occupied" };
  const arrivalDue = relevant.find(booking => normalizedStatus(booking.status) === "confirmed" && booking.check_in <= today);
  if (arrivalDue) return { booking: arrivalDue, kind: "arrival-due" };
  const upcoming = relevant.find(booking => normalizedStatus(booking.status) === "confirmed" && booking.check_in > today);
  if (upcoming) return { booking: upcoming, kind: "upcoming" };
  return { booking: null, kind: "none" };
}

export function RoomsPage() {
  const { t, statusLabel, formatCurrency, formatDate } = useI18n();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selected, setSelected] = useState<Room | null>(null);
  const [holds, setHolds] = useState<Hold[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [holdSaving, setHoldSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const holdsRequestIdRef = useRef(0);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [filter, setFilter] = useState("");
  const [form, setForm] = useState({ room_number: "", room_type: "STANDARD", price_cents: "" });
  const [editForm, setEditForm] = useState<RoomEditForm>({ room_number: "", room_type: "", price_cents: "" });

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [nextRooms, nextBookings] = await Promise.all([
        api<Room[]>("/rooms"),
        api<Booking[]>("/bookings?limit=100"),
      ]);
      setRooms(nextRooms);
      setBookings(nextBookings);
      if (selected) setSelected(nextRooms.find(room => room.id === selected.id) ?? null);
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setFormError("");
    setSaving(true);
    try {
      await api("/rooms", { method: "POST", body: JSON.stringify({ ...form, price_cents: Number(form.price_cents) }) });
      setForm({ room_number: "", room_type: "STANDARD", price_cents: "" });
      setShowCreate(false);
      await load();
    } catch (e) { setFormError((e as Error).message); }
    finally { setSaving(false); }
  }

  async function openRoom(room: Room) {
    const requestId = ++holdsRequestIdRef.current;
    setSelected(room);
    setEditing(false);
    setEditForm({ room_number: room.room_number, room_type: room.room_type, price_cents: String(room.price_cents) });
    setHolds([]);
    setDetailLoading(true);
    setError("");
    try {
      const nextHolds = await api<Hold[]>(`/rooms/${room.id}/holds`);
      if (requestId === holdsRequestIdRef.current) setHolds(nextHolds);
    } catch (e) {
      if (requestId === holdsRequestIdRef.current) setError((e as Error).message);
    } finally {
      if (requestId === holdsRequestIdRef.current) setDetailLoading(false);
    }
  }

  async function saveRoomEdit(event: FormEvent) {
    event.preventDefault();
    if (!selected) return;
    setEditSaving(true);
    setError("");
    try {
      await api(`/rooms/${selected.id}`, { method: "PATCH", body: JSON.stringify({ room_number: editForm.room_number, room_type: editForm.room_type, price_cents: Number(editForm.price_cents) }) });
      setEditing(false);
      await load();
    } catch (e) { setError((e as Error).message); }
    finally { setEditSaving(false); }
  }

  async function addHold(event: FormEvent) {
    event.preventDefault();
    if (!selected) return;
    const room = selected;
    const formElement = event.currentTarget as HTMLFormElement;
    const data = new FormData(formElement);
    setHoldSaving(true);
    setError("");
    try {
      await api(`/rooms/${room.id}/holds`, { method: "POST", body: JSON.stringify({ start_date: data.get("start"), end_date: data.get("end"), hold_type: "Other", reason: data.get("reason") }) });
      formElement.reset();
      if (selected?.id === room.id) await openRoom(room);
    } catch (e) { setError((e as Error).message); }
    finally { setHoldSaving(false); }
  }

  async function deleteHold(holdId: string) {
    if (!selected) return;
    setError("");
    try {
      await api(`/rooms/${selected.id}/holds/${holdId}`, { method: "DELETE" });
      await openRoom(selected);
    } catch (e) { setError((e as Error).message); }
  }

  const roomRows = rooms.map(room => ({ room, context: roomContext(room, bookings) }));
  const query = filter.trim().toLocaleLowerCase();
  const visible = roomRows.filter(({ room, context }) => `${room.room_number} ${room.room_type} ${room.status} ${context.booking?.guest_name ?? ""}`.toLocaleLowerCase().includes(query));
  const occupiedCount = roomRows.filter(item => item.context.kind === "occupied").length;
  const arrivalCount = roomRows.filter(item => item.context.kind === "arrival-due").length;
  const availableCount = roomRows.filter(item => item.room.status === "Available" && item.context.kind === "none").length;
  const selectedContext = selected ? roomContext(selected, bookings) : null;

  function contextLabel(context: RoomContext) {
    if (context.kind === "occupied") return t("rooms.contextOccupied");
    if (context.kind === "arrival-due") return t("rooms.contextArrivalDue");
    if (context.kind === "upcoming") return t("rooms.contextUpcoming");
    return t("rooms.contextNoBooking");
  }

  return <section className="resource-workspace rooms-operational-workspace">
    <div className="workspace-heading rooms-heading">
      <div><p className="eyebrow">{t("rooms.eyebrow")}</p><h2>{t("rooms.title")}</h2><p className="muted">{t("rooms.operationalSubtitle")}</p></div>
      <div className="rooms-heading-actions"><span className="case-count">{t("rooms.count", { count: rooms.length })}</span><button type="button" className="secondary-button" onClick={() => setShowCreate(current => !current)}>{showCreate ? t("rooms.cancelCreate") : t("rooms.manage")}</button></div>
    </div>
    <div className="rooms-status-strip" aria-label={t("rooms.statusSummary")}><span><strong>{availableCount}</strong>{t("rooms.availableNow")}</span><span><strong>{occupiedCount}</strong>{t("rooms.occupiedNow")}</span><span><strong>{arrivalCount}</strong>{t("rooms.arrivalsDue")}</span></div>
    {showCreate && <form className="resource-form rooms-create-form" onSubmit={submit}><div><label>{t("rooms.number")}<input required value={form.room_number} onChange={e => setForm({ ...form, room_number: e.target.value })} placeholder="101" /></label></div><div><label>{t("rooms.type")}<input required value={form.room_type} onChange={e => setForm({ ...form, room_type: e.target.value })} placeholder="STANDARD" /></label></div><div><label>{t("rooms.price")}<input required min="0" type="number" value={form.price_cents} onChange={e => setForm({ ...form, price_cents: e.target.value })} placeholder="18000" /></label></div><button type="submit" disabled={saving}>{saving ? t("rooms.adding") : t("rooms.add")}</button></form>}
    {formError && <p className="error" role="alert">{formError}</p>}
    <div className="resource-toolbar"><label>{t("rooms.search")}<input aria-label={t("rooms.search")} value={filter} onChange={e => setFilter(e.target.value)} placeholder={t("rooms.operationalSearchPlaceholder")} /></label><button type="button" onClick={() => void load()} disabled={loading}>{t("common.refresh")}</button></div>
    {error && <AsyncState kind="error" title={t("rooms.loadError")} message={error} onRetry={() => void load()} />}
    {loading && <AsyncState kind="loading" message={t("rooms.loading")} />}
    {!loading && !error && visible.length === 0 && <AsyncState kind="empty" title={t(rooms.length ? "rooms.noMatch" : "rooms.none")} message={t(rooms.length ? "rooms.trySearch" : "rooms.addFirst")} />}
    {!loading && !error && visible.length > 0 && <div className="resource-layout rooms-operational-layout"><div className="resource-list rooms-board" aria-label={t("rooms.listAria")}>{visible.map(({ room, context }) => <article className={selected?.id === room.id ? `room-operational-card selected context-${context.kind}` : `room-operational-card context-${context.kind}`} key={room.id}><button type="button" className="room-operational-select" onClick={() => void openRoom(room)} aria-pressed={selected?.id === room.id}><span className="room-operational-top"><strong>{t("common.room")} {room.room_number}</strong><StatusBadge>{statusLabel(room.status)}</StatusBadge></span><span className="room-operational-context">{contextLabel(context)}</span>{context.booking ? <><strong className="room-operational-guest">{context.booking.guest_name}</strong><small>{formatDate(context.booking.check_in)} → {formatDate(context.booking.check_out)}</small></> : <small>{room.room_type} · {formatCurrency(room.price_cents)}</small>}</button></article>)}</div><aside className="resource-detail rooms-detail" aria-label={t("rooms.selectedAria")}>{!selected && <div className="state-panel state-empty"><strong>{t("rooms.select")}</strong><span>{t("rooms.operationalSelectHint")}</span></div>}{selected && <><div className="resource-detail-heading"><div><p className="eyebrow">{t("rooms.selected")}</p><h3>{t("common.room")} {selected.room_number}</h3><p className="muted">{selected.room_type} · {formatCurrency(selected.price_cents)}</p></div><StatusBadge>{statusLabel(selected.status)}</StatusBadge></div>{selectedContext && <div className="room-next-action"><span>{t("rooms.currentSituation")}</span><strong>{contextLabel(selectedContext)}</strong>{selectedContext.booking && <p>{selectedContext.booking.guest_name} · {formatDate(selectedContext.booking.check_in)} → {formatDate(selectedContext.booking.check_out)}</p>}</div>}{!editing ? <button type="button" className="secondary-button rooms-edit-trigger" onClick={() => setEditing(true)}>{t("rooms.edit")}</button> : <form className="resource-subform rooms-edit-form" onSubmit={saveRoomEdit}><h4>{t("rooms.editDetails")}</h4><div className="form-grid"><label>{t("rooms.number")}<input required value={editForm.room_number} onChange={event => setEditForm({ ...editForm, room_number: event.target.value })} /></label><label>{t("rooms.type")}<input required value={editForm.room_type} onChange={event => setEditForm({ ...editForm, room_type: event.target.value })} /></label><label className="form-span">{t("rooms.price")}<input required min="0" type="number" value={editForm.price_cents} onChange={event => setEditForm({ ...editForm, price_cents: event.target.value })} /></label></div><div className="rooms-edit-actions"><button type="submit" disabled={editSaving}>{editSaving ? t("common.saving") : t("rooms.saveEdit")}</button><button type="button" className="secondary-button" onClick={() => setEditing(false)}>{t("rooms.cancelEdit")}</button></div></form>}<form className="resource-subform" onSubmit={addHold}><h4>{t("rooms.operationalHold")}</h4><div className="form-grid"><label>{t("common.start")}<input required name="start" type="date" /></label><label>{t("common.end")}<input required name="end" type="date" /></label><label className="form-span"><span>{t("common.reason")}</span><input required name="reason" minLength={4} placeholder={t("rooms.holdReasonPlaceholder")} /></label></div><button type="submit" disabled={holdSaving}>{holdSaving ? t("common.saving") : t("rooms.addHold")}</button></form>{detailLoading && <p className="muted" role="status">{t("rooms.loadingHolds")}</p>}{!detailLoading && holds.length === 0 && <p className="muted">{t("rooms.noHolds")}</p>}{!detailLoading && holds.map(hold => <div className="hold-row" key={hold.id}><div><strong>{formatDate(hold.start_date)} → {formatDate(hold.end_date)}</strong><span>{hold.reason}</span></div><button type="button" className="danger-button" onClick={() => void deleteHold(hold.id)}>{t("common.delete")}</button></div>)}</>}</aside></div>}
  </section>;
}
