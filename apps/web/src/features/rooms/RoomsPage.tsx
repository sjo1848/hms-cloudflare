import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { api } from "../../api/client";
import type { Booking, Hold, Room } from "../../domain/types";
import { AsyncState } from "../../components/AsyncState";
import { StatusBadge } from "../../components/StatusBadge";
import { useI18n } from "../../i18n";
import type { MessageKey } from "../../i18n";
import { buildRoomBoard, filterRoomBoard, roomBoardCounts, roomBoardFilters } from "./roomBoard";
import type { RoomBoardFilter, RoomBoardReason } from "./roomBoard";
import "./rooms-board.css";

const filterLabelKeys: Record<RoomBoardFilter, MessageKey> = {
  attention: "rooms.filterAttention",
  occupied: "rooms.filterOccupied",
  preparation: "rooms.filterPreparation",
  available: "rooms.filterAvailable",
  all: "rooms.filterAll",
};

const reasonLabelKeys: Record<RoomBoardReason, MessageKey> = {
  maintenance: "rooms.reasonMaintenance",
  dirty: "rooms.reasonDirty",
  cleaning: "rooms.reasonCleaning",
  "checkout-overdue": "rooms.reasonCheckoutOverdue",
  "checkout-today": "rooms.reasonCheckoutToday",
  "arrival-overdue": "rooms.reasonArrivalOverdue",
  "arrival-today": "rooms.reasonArrivalToday",
  occupied: "rooms.reasonOccupied",
  "upcoming-arrival": "rooms.reasonUpcomingArrival",
  available: "rooms.reasonAvailable",
  blocked: "rooms.reasonBlocked",
  review: "rooms.reasonReview",
};

export function RoomsPage() {
  const { t, statusLabel, formatCurrency, formatDate } = useI18n();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [holds, setHolds] = useState<Hold[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [holdSaving, setHoldSaving] = useState(false);
  const holdsRequestIdRef = useRef(0);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [filter, setFilter] = useState<RoomBoardFilter>("attention");
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ room_number: "", room_type: "STANDARD", price_cents: "" });
  const [editForm, setEditForm] = useState({ room_number: "", room_type: "", price_cents: "" });

  const board = buildRoomBoard(rooms, bookings);
  const counts = roomBoardCounts(board);
  const visible = filterRoomBoard(board, filter, search);
  const selectedItem = selectedId ? board.find(item => item.room.id === selectedId) ?? null : null;

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
      if (selectedId && !nextRooms.some(room => room.id === selectedId)) setSelectedId(null);
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setFormError("");
    setSaving(true);
    try {
      await api("/rooms", {
        method: "POST",
        body: JSON.stringify({ ...form, price_cents: Number(form.price_cents) })
      });
      setForm({ room_number: "", room_type: "STANDARD", price_cents: "" });
      setCreateOpen(false);
      await load();
    } catch (e) { setFormError((e as Error).message); }
    finally { setSaving(false); }
  }

  async function openRoom(room: Room) {
    const requestId = ++holdsRequestIdRef.current;
    setSelectedId(room.id);
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

  function closeRoom() {
    holdsRequestIdRef.current += 1;
    setSelectedId(null);
    setHolds([]);
    setDetailLoading(false);
  }

  async function editRoom(event: FormEvent) {
    event.preventDefault();
    if (!selectedItem) return;
    setEditSaving(true);
    setError("");
    try {
      await api(`/rooms/${selectedItem.room.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          room_number: editForm.room_number,
          room_type: editForm.room_type,
          price_cents: Number(editForm.price_cents),
        })
      });
      await load();
    } catch (e) { setError((e as Error).message); }
    finally { setEditSaving(false); }
  }

  async function addHold(event: FormEvent) {
    event.preventDefault();
    if (!selectedItem) return;
    const room = selectedItem.room;
    const formElement = event.currentTarget as HTMLFormElement;
    const data = new FormData(formElement);
    setHoldSaving(true);
    setError("");
    try {
      await api(`/rooms/${room.id}/holds`, {
        method: "POST",
        body: JSON.stringify({ start_date: data.get("start"), end_date: data.get("end"), hold_type: "Other", reason: data.get("reason") })
      });
      formElement.reset();
      if (selectedId === room.id) await openRoom(room);
    } catch (e) { setError((e as Error).message); }
    finally { setHoldSaving(false); }
  }

  async function deleteHold(holdId: string) {
    if (!selectedItem) return;
    setError("");
    try {
      await api(`/rooms/${selectedItem.room.id}/holds/${holdId}`, { method: "DELETE" });
      await openRoom(selectedItem.room);
    } catch (e) { setError((e as Error).message); }
  }

  return <section className="resource-workspace rooms-workspace">
    <div className="workspace-heading">
      <div><p className="eyebrow">{t("rooms.eyebrow")}</p><h2>{t("rooms.title")}</h2><p className="muted">{t("rooms.subtitle")}</p></div>
      <div className="workspace-heading-actions rooms-heading-actions">
        <span className="case-count">{t("rooms.attentionSummary", { attention: counts.attention, all: counts.all })}</span>
        <button type="button" className="rooms-admin-toggle" aria-expanded={createOpen} aria-controls="rooms-create-form" onClick={() => setCreateOpen(value => !value)}>{createOpen ? t("rooms.hideAdmin") : t("rooms.administer")}</button>
      </div>
    </div>

    {createOpen && <form id="rooms-create-form" className="resource-form rooms-create-form" onSubmit={submit}>
      <div><label>{t("rooms.number")}<input required value={form.room_number} onChange={e => setForm({ ...form, room_number: e.target.value })} placeholder="101" /></label></div>
      <div><label>{t("rooms.type")}<input required value={form.room_type} onChange={e => setForm({ ...form, room_type: e.target.value })} placeholder="STANDARD" /></label></div>
      <div><label>{t("rooms.price")}<input required min="0" type="number" value={form.price_cents} onChange={e => setForm({ ...form, price_cents: e.target.value })} placeholder="18000" /></label></div>
      <button type="submit" disabled={saving}>{saving ? t("rooms.adding") : t("rooms.add")}</button>
    </form>}
    {formError && <p className="error" role="alert">{formError}</p>}

    <div className="rooms-control-bar">
      <label className="rooms-search">{t("rooms.search")}<input aria-label={t("rooms.search")} value={search} onChange={e => setSearch(e.target.value)} placeholder={t("rooms.searchPlaceholder")} /></label>
      <div className="rooms-filters" role="group" aria-label={t("rooms.filtersAria")}>
        {roomBoardFilters.map(value => <button type="button" className={filter === value ? "selected" : ""} key={value} onClick={() => setFilter(value)}>{t(filterLabelKeys[value])} <span>{counts[value]}</span></button>)}
      </div>
      <button type="button" className="rooms-refresh" onClick={() => void load()} disabled={loading}>{t("common.refresh")}</button>
    </div>

    {error && <AsyncState kind="error" title={t("rooms.loadError")} message={error} onRetry={() => void load()} />}
    {loading && <AsyncState kind="loading" message={t("rooms.loading")} />}
    {!loading && !error && visible.length === 0 && <AsyncState kind="empty" title={t(rooms.length ? "rooms.noMatch" : "rooms.none")} message={t(rooms.length ? "rooms.trySearch" : "rooms.addFirst")} />}

    {!loading && !error && visible.length > 0 && <div className="rooms-board-layout">
      <div className="rooms-board-grid" aria-label={t("rooms.listAria")}>
        {visible.map(item => <button type="button" className={`room-board-card state-${item.state} ${selectedId === item.room.id ? "selected" : ""}`} key={item.room.id} onClick={() => void openRoom(item.room)} aria-pressed={selectedId === item.room.id}>
          <span className="room-card-top"><strong>{t("common.room")} {item.room.room_number}</strong><span className="room-state-dot" aria-hidden="true" /></span>
          <span className="room-card-reason">{t(reasonLabelKeys[item.reason])}</span>
          {item.currentBooking ? <span className="room-card-context"><strong>{item.currentBooking.guest_name}</strong><small>{formatDate(item.currentBooking.check_in)} → {formatDate(item.currentBooking.check_out)}</small></span>
            : item.nextBooking ? <span className="room-card-context"><strong>{t("rooms.nextGuest", { guest: item.nextBooking.guest_name })}</strong><small>{formatDate(item.nextBooking.check_in)} → {formatDate(item.nextBooking.check_out)}</small></span>
            : <span className="room-card-context"><strong>{item.room.room_type}</strong><small>{formatCurrency(item.room.price_cents)}</small></span>}
        </button>)}
      </div>

      {selectedItem && <aside className="resource-detail rooms-detail" aria-label={t("rooms.selectedAria")}>
        <div className="resource-detail-heading rooms-detail-heading">
          <div><p className="eyebrow">{t("rooms.selected")}</p><h3>{t("common.room")} {selectedItem.room.room_number}</h3><p className="muted">{selectedItem.room.room_type} · {formatCurrency(selectedItem.room.price_cents)}</p></div>
          <div className="rooms-detail-actions"><StatusBadge>{statusLabel(selectedItem.room.status)}</StatusBadge><button type="button" className="rooms-close" onClick={closeRoom}>{t("common.close")}</button></div>
        </div>

        <div className="rooms-operational-summary">
          <p className="eyebrow">{t("rooms.operationalNow")}</p>
          <strong>{t(reasonLabelKeys[selectedItem.reason])}</strong>
          {selectedItem.currentBooking && <p>{t("rooms.currentStay", { guest: selectedItem.currentBooking.guest_name, date: formatDate(selectedItem.currentBooking.check_out) })}</p>}
          {!selectedItem.currentBooking && selectedItem.nextBooking && <p>{t("rooms.nextArrival", { guest: selectedItem.nextBooking.guest_name, date: formatDate(selectedItem.nextBooking.check_in) })}</p>}
          {!selectedItem.currentBooking && !selectedItem.nextBooking && <p className="muted">{t("rooms.noStayContext")}</p>}
        </div>

        <details className="rooms-secondary-flow">
          <summary>{t("rooms.manageHold")}</summary>
          <form className="resource-subform" onSubmit={addHold}><h4>{t("rooms.operationalHold")}</h4><div className="form-grid"><label>{t("common.start")}<input required name="start" type="date" /></label><label>{t("common.end")}<input required name="end" type="date" /></label><label className="form-span"><span>{t("common.reason")}</span><input required name="reason" minLength={4} placeholder={t("rooms.holdReasonPlaceholder")} /></label></div><button type="submit" disabled={holdSaving}>{holdSaving ? t("common.saving") : t("rooms.addHold")}</button></form>
          {detailLoading && <p className="muted" role="status">{t("rooms.loadingHolds")}</p>}
          {!detailLoading && holds.length === 0 && <p className="muted">{t("rooms.noHolds")}</p>}
          {!detailLoading && holds.map(hold => <div className="hold-row" key={hold.id}><div><strong>{formatDate(hold.start_date)} → {formatDate(hold.end_date)}</strong><span>{hold.reason}</span></div><button type="button" className="danger-button" onClick={() => void deleteHold(hold.id)}>{t("common.delete")}</button></div>)}
        </details>

        <details className="rooms-secondary-flow">
          <summary>{t("rooms.editRoom")}</summary>
          <form className="rooms-edit-form" onSubmit={editRoom}>
            <label>{t("rooms.number")}<input required value={editForm.room_number} onChange={e => setEditForm({ ...editForm, room_number: e.target.value })} /></label>
            <label>{t("rooms.type")}<input required value={editForm.room_type} onChange={e => setEditForm({ ...editForm, room_type: e.target.value })} /></label>
            <label>{t("rooms.price")}<input required min="0" type="number" value={editForm.price_cents} onChange={e => setEditForm({ ...editForm, price_cents: e.target.value })} /></label>
            <button type="submit" disabled={editSaving}>{editSaving ? t("common.saving") : t("rooms.saveRoom")}</button>
          </form>
        </details>
      </aside>}
    </div>}
  </section>;
}
