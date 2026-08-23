import { useEffect, useState } from "react";
import type { FormEvent } from "react";

type Room = { id: string; room_number: string; room_type: string; status: string; price_cents: number };
type Guest = { id: string; full_name: string; email: string; phone: string | null };
type Hold = { id: string; start_date: string; end_date: string; hold_type: string; reason: string };

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/v1${path}`, { ...init, headers: { "content-type": "application/json", ...(init?.headers ?? {}) } });
  if (!response.ok) { const payload = await response.json().catch(() => null) as { error?: { message?: string } } | null; throw new Error(payload?.error?.message ?? `Request failed (${response.status})`); }
  return response.json();
}

function Rooms() {
  const [rooms, setRooms] = useState<Room[]>([]); const [selected, setSelected] = useState<Room | null>(null); const [holds, setHolds] = useState<Hold[]>([]); const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ room_number: "", room_type: "STANDARD", price_cents: "" });
  const load = () => { setLoading(true); return api<Room[]>("/rooms").then(setRooms).catch((e: Error) => setError(e.message)).finally(() => setLoading(false)); };
  useEffect(() => { void load(); }, []);
  async function submit(event: FormEvent) { event.preventDefault(); setError(""); try { await api("/rooms", { method: "POST", body: JSON.stringify({ ...form, price_cents: Number(form.price_cents) }) }); setForm({ room_number: "", room_type: "STANDARD", price_cents: "" }); load(); } catch (e) { setError((e as Error).message); } }
  async function openRoom(room: Room) { setSelected(room); try { setHolds(await api<Hold[]>(`/rooms/${room.id}/holds`)); } catch (e) { setError((e as Error).message); } }
  async function addHold(event: FormEvent) { event.preventDefault(); if (!selected) return; const formData = new FormData(event.currentTarget as HTMLFormElement); try { await api(`/rooms/${selected.id}/holds`, { method: "POST", body: JSON.stringify({ start_date: formData.get("start"), end_date: formData.get("end"), hold_type: "Other", reason: formData.get("reason") }) }); await openRoom(selected); } catch (e) { setError((e as Error).message); } }
  return <section><h2>Rooms</h2><form onSubmit={submit}><input required placeholder="Room number" value={form.room_number} onChange={e => setForm({ ...form, room_number: e.target.value })} /><input required placeholder="Type" value={form.room_type} onChange={e => setForm({ ...form, room_type: e.target.value })} /><input required min="0" type="number" placeholder="Price cents" value={form.price_cents} onChange={e => setForm({ ...form, price_cents: e.target.value })} /><button>Add room</button></form>{error && <p className="error">{error}</p>}{loading && <p className="muted">Loading rooms…</p>}<div className="cards">{rooms.map(room => <article key={room.id}><button onClick={() => void openRoom(room)}>{room.room_number}</button><span>{room.room_type}</span><span>{room.status}</span><span>${(room.price_cents / 100).toFixed(2)}</span></article>)}</div>{!loading && !error && rooms.length === 0 && <p className="muted">No rooms yet.</p>}{selected && <div><h3>Holds for room {selected.room_number}</h3><form onSubmit={addHold}><input required name="start" type="date" /><input required name="end" type="date" /><input required name="reason" minLength={4} placeholder="Reason" /><button>Add hold</button></form>{holds.map(hold => <article key={hold.id}><span>{hold.start_date} → {hold.end_date}</span><span>{hold.reason}</span><button onClick={() => api(`/rooms/${selected.id}/holds/${hold.id}`, { method: "DELETE" }).then(() => openRoom(selected)).catch((e: Error) => setError(e.message))}>Delete</button></article>)}</div>}</section>;
}

function Guests() {
  const [guests, setGuests] = useState<Guest[]>([]); const [error, setError] = useState(""); const [form, setForm] = useState({ full_name: "", email: "", phone: "" });
  const load = () => api<Guest[]>("/guests").then(setGuests).catch((e: Error) => setError(e.message)); useEffect(() => { void load(); }, []);
  async function submit(event: FormEvent) { event.preventDefault(); setError(""); try { await api("/guests", { method: "POST", body: JSON.stringify({ ...form, phone: form.phone || null }) }); setForm({ full_name: "", email: "", phone: "" }); load(); } catch (e) { setError((e as Error).message); } }
  return <section><h2>Guests</h2><form onSubmit={submit}><input required placeholder="Full name" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} /><input required type="email" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /><input placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /><button>Add guest</button></form>{error && <p className="error">{error}</p>}<div className="cards">{guests.map(guest => <article key={guest.id}><strong>{guest.full_name}</strong><span>{guest.email}</span><span>{guest.phone ?? "—"}</span></article>)}</div>{!error && guests.length === 0 && <p className="muted">No guests yet.</p>}</section>;
}

export function App() { const page = location.pathname.startsWith("/guests") ? "guests" : "rooms"; return <main><header><div><p className="eyebrow">HMS Elite</p><h1>Hotel operations</h1></div><nav><a className={page === "rooms" ? "active" : ""} href="/rooms">Rooms</a><a className={page === "guests" ? "active" : ""} href="/guests">Guests</a></nav></header>{page === "rooms" ? <Rooms /> : <Guests />}</main>; }
