import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { api } from "../../shared/api";
import type { Hold, Room } from "../../domain/types";

export function RoomsPage() {
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
    const roomNumber = window.prompt("Room number", room.room_number);
    if (!roomNumber) return;
    const roomType = window.prompt("Room type", room.room_type);
    if (!roomType) return;
    const price = window.prompt("Price in cents", String(room.price_cents));
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
      <div><p className="eyebrow">Inventory</p><h2>Rooms</h2><p className="muted">Availability, pricing and operational holds</p></div>
      <span className="case-count">{rooms.length} rooms</span>
    </div>
    <form className="resource-form" onSubmit={submit}>
      <div><label>Room number<input required value={form.room_number} onChange={e => setForm({ ...form, room_number: e.target.value })} placeholder="e.g. 101" /></label></div>
      <div><label>Room type<input required value={form.room_type} onChange={e => setForm({ ...form, room_type: e.target.value })} placeholder="STANDARD" /></label></div>
      <div><label>Price in cents<input required min="0" type="number" value={form.price_cents} onChange={e => setForm({ ...form, price_cents: e.target.value })} placeholder="18000" /></label></div>
      <button type="submit" disabled={saving}>{saving ? "Adding…" : "Add room"}</button>
    </form>
    {formError && <p className="error" role="alert">{formError}</p>}
    <div className="resource-toolbar"><label>Search rooms<input aria-label="Search rooms" value={filter} onChange={e => setFilter(e.target.value)} placeholder="Number, type or status" /></label><button type="button" onClick={() => void load()} disabled={loading}>Refresh</button></div>
    {error && <div className="state-panel state-error" role="alert"><strong>Rooms could not be loaded</strong><span>{error}</span><button type="button" onClick={() => void load()}>Try again</button></div>}
    {loading && <div className="state-panel" role="status"><span className="state-spinner" />Loading rooms…</div>}
    {!loading && !error && visible.length === 0 && <div className="state-panel state-empty"><strong>{rooms.length ? "No matching rooms" : "No rooms yet"}</strong><span>{rooms.length ? "Try another search." : "Add the first room using the form above."}</span></div>}
    {!loading && !error && visible.length > 0 && <div className="resource-layout">
      <div className="resource-list" aria-label="Rooms list">{visible.map(room => <article className={selected?.id === room.id ? "resource-card selected" : "resource-card"} key={room.id}>
        <button type="button" className="resource-card-select" onClick={() => void openRoom(room)} aria-pressed={selected?.id === room.id}>
          <span className="resource-card-title">Room {room.room_number}</span><span className="status-badge">{room.status}</span>
          <span className="resource-card-meta">{room.room_type} · ${(room.price_cents / 100).toFixed(2)}</span>
        </button>
        <button type="button" className="secondary-button" onClick={() => void editRoom(room)}>Edit</button>
      </article>)}</div>
      <aside className="resource-detail" aria-label="Selected room">
        {!selected && <div className="state-panel state-empty"><strong>Select a room</strong><span>Choose a room to review its holds.</span></div>}
        {selected && <><div className="resource-detail-heading"><div><p className="eyebrow">Selected room</p><h3>Room {selected.room_number}</h3><p className="muted">{selected.room_type} · ${(selected.price_cents / 100).toFixed(2)}</p></div><span className="status-badge">{selected.status}</span></div>
          <form className="resource-subform" onSubmit={addHold}><h4>Operational hold</h4><div className="form-grid"><label>Start<input required name="start" type="date" /></label><label>End<input required name="end" type="date" /></label><label className="form-span"><span>Reason</span><input required name="reason" minLength={4} placeholder="Maintenance or reservation hold" /></label></div><button type="submit" disabled={holdSaving}>{holdSaving ? "Saving…" : "Add hold"}</button></form>
          {detailLoading && <p className="muted" role="status">Loading holds…</p>}
          {!detailLoading && holds.length === 0 && <p className="muted">No operational holds for this room.</p>}
          {!detailLoading && holds.map(hold => <div className="hold-row" key={hold.id}><div><strong>{hold.start_date} → {hold.end_date}</strong><span>{hold.reason}</span></div><button type="button" className="danger-button" onClick={() => void deleteHold(hold.id)}>Delete</button></div>)}
        </>}
      </aside>
    </div>}
  </section>;
}
