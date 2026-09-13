import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { api } from "../../api/client";
import type { Hold, Room } from "../../domain/types";
import { AsyncState } from "../../components/AsyncState";
import { StatusBadge } from "../../components/StatusBadge";
import { useI18n } from "../../i18n";

export function RoomsPage() {
  const { t, statusLabel, formatCurrency, formatDate } = useI18n();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selected, setSelected] = useState<Room | null>(null);
  const [holds, setHolds] = useState<Hold[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [holdSaving, setHoldSaving] = useState(false);
  const holdsRequestIdRef = useRef(0);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [filter, setFilter] = useState("");
  const [form, setForm] = useState({ room_number: "", room_type: "STANDARD", price_cents: "" });

  async function load() {
    setLoading(true);
    setError("");
    try { setRooms(await api<Room[]>("/rooms")); }
    catch (e) { setError((e as Error).message); }
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
      await load();
    } catch (e) { setFormError((e as Error).message); }
    finally { setSaving(false); }
  }

  async function openRoom(room: Room) {
    const requestId = ++holdsRequestIdRef.current;
    setSelected(room);
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

  async function editRoom(room: Room) {
    const roomNumber = window.prompt(t("rooms.promptNumber"), room.room_number);
    if (!roomNumber) return;
    const roomType = window.prompt(t("rooms.promptType"), room.room_type);
    if (!roomType) return;
    const price = window.prompt(t("rooms.promptPrice"), String(room.price_cents));
    if (!price) return;
    try {
      await api(`/rooms/${room.id}`, {
        method: "PATCH",
        body: JSON.stringify({ room_number: roomNumber, room_type: roomType, price_cents: Number(price) })
      });
      await load();
      if (selected?.id === room.id) setSelected({ ...room, room_number: roomNumber, room_type: roomType, price_cents: Number(price) });
    } catch (e) { setError((e as Error).message); }
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
      await api(`/rooms/${room.id}/holds`, {
        method: "POST",
        body: JSON.stringify({ start_date: data.get("start"), end_date: data.get("end"), hold_type: "Other", reason: data.get("reason") })
      });
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

  const visible = rooms.filter(room => `${room.room_number} ${room.room_type} ${room.status}`.toLowerCase().includes(filter.toLowerCase()));

  return <section className="resource-workspace">
    <div className="workspace-heading">
      <div><p className="eyebrow">{t("rooms.eyebrow")}</p><h2>{t("rooms.title")}</h2><p className="muted">{t("rooms.subtitle")}</p></div>
      <span className="case-count">{t("rooms.count", { count: rooms.length })}</span>
    </div>
    <form className="resource-form" onSubmit={submit}>
      <div><label>{t("rooms.number")}<input required value={form.room_number} onChange={e => setForm({ ...form, room_number: e.target.value })} placeholder="101" /></label></div>
      <div><label>{t("rooms.type")}<input required value={form.room_type} onChange={e => setForm({ ...form, room_type: e.target.value })} placeholder="STANDARD" /></label></div>
      <div><label>{t("rooms.price")}<input required min="0" type="number" value={form.price_cents} onChange={e => setForm({ ...form, price_cents: e.target.value })} placeholder="18000" /></label></div>
      <button type="submit" disabled={saving}>{saving ? t("rooms.adding") : t("rooms.add")}</button>
    </form>
    {formError && <p className="error" role="alert">{formError}</p>}
    <div className="resource-toolbar"><label>{t("rooms.search")}<input aria-label={t("rooms.search")} value={filter} onChange={e => setFilter(e.target.value)} placeholder={t("rooms.searchPlaceholder")} /></label><button type="button" onClick={() => void load()} disabled={loading}>{t("common.refresh")}</button></div>
    {error && <AsyncState kind="error" title={t("rooms.loadError")} message={error} onRetry={() => void load()} />}
    {loading && <AsyncState kind="loading" message={t("rooms.loading")} />}
    {!loading && !error && visible.length === 0 && <AsyncState kind="empty" title={t(rooms.length ? "rooms.noMatch" : "rooms.none")} message={t(rooms.length ? "rooms.trySearch" : "rooms.addFirst")} />}
    {!loading && !error && visible.length > 0 && <div className="resource-layout">
      <div className="resource-list" aria-label={t("rooms.listAria")}>{visible.map(room => <article className={selected?.id === room.id ? "resource-card selected" : "resource-card"} key={room.id}>
        <button type="button" className="resource-card-select" onClick={() => void openRoom(room)} aria-pressed={selected?.id === room.id}>
          <span className="resource-card-title">{t("common.room")} {room.room_number}</span><StatusBadge>{statusLabel(room.status)}</StatusBadge>
          <span className="resource-card-meta">{room.room_type} · {formatCurrency(room.price_cents)}</span>
        </button>
        <button type="button" className="secondary-button" onClick={() => void editRoom(room)}>{t("rooms.edit")}</button>
      </article>)}</div>
      <aside className="resource-detail" aria-label={t("rooms.selectedAria")}>
        {!selected && <div className="state-panel state-empty"><strong>{t("rooms.select")}</strong><span>{t("rooms.selectHint")}</span></div>}
        {selected && <><div className="resource-detail-heading"><div><p className="eyebrow">{t("rooms.selected")}</p><h3>{t("common.room")} {selected.room_number}</h3><p className="muted">{selected.room_type} · {formatCurrency(selected.price_cents)}</p></div><StatusBadge>{statusLabel(selected.status)}</StatusBadge></div>
          <form className="resource-subform" onSubmit={addHold}><h4>{t("rooms.operationalHold")}</h4><div className="form-grid"><label>{t("common.start")}<input required name="start" type="date" /></label><label>{t("common.end")}<input required name="end" type="date" /></label><label className="form-span"><span>{t("common.reason")}</span><input required name="reason" minLength={4} placeholder={t("rooms.holdReasonPlaceholder")} /></label></div><button type="submit" disabled={holdSaving}>{holdSaving ? t("common.saving") : t("rooms.addHold")}</button></form>
          {detailLoading && <p className="muted" role="status">{t("rooms.loadingHolds")}</p>}
          {!detailLoading && holds.length === 0 && <p className="muted">{t("rooms.noHolds")}</p>}
          {!detailLoading && holds.map(hold => <div className="hold-row" key={hold.id}><div><strong>{formatDate(hold.start_date)} → {formatDate(hold.end_date)}</strong><span>{hold.reason}</span></div><button type="button" className="danger-button" onClick={() => void deleteHold(hold.id)}>{t("common.delete")}</button></div>)}
        </>}
      </aside>
    </div>}
  </section>;
}
