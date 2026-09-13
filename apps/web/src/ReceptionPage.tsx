import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  buildReceptionQueue,
  filterReceptionQueue,
  localDateKey,
  receptionQueueCounts,
  receptionQueueFilters,
  type ReceptionQueueFilter,
} from "./receptionQueue";

type Room = { id: string; room_number: string; room_type: string; status: string; price_cents: number };
type Guest = { id: string; full_name: string; email: string; phone: string | null };
type Booking = { id: string; guest_id: string; guest_name: string; room_id: string; room_number: string; check_in: string; check_out: string; status: string; total_cents: number; notes: string | null };
type Invoice = { id: string; booking_id: string; amount_cents: number; paid_amount_cents: number; status: string; payment_method: string; payment_reference: string | null } | null;
type Payment = { id: string; amount_cents: number; payment_method: string; payment_reference: string | null; received_at: string };
type ExtraCharge = { id: string; description: string; amount_cents: number; category: string; created_at: string };

type LocalDevProfile = { label: string; subject: string; email: string; hotelId: string };
const localAcceptanceEnabled = import.meta.env.DEV && import.meta.env.VITE_LOCAL_ACCEPTANCE_AUTH === "true";
const localDevProfiles: LocalDevProfile[] = localAcceptanceEnabled ? [
  { label: "Hotel Norte · Admin / Network", subject: "source-user:14000000-0000-0000-0000-000000000001", email: "ana-admin@migration.invalid", hotelId: "10000000-0000-0000-0000-000000000001" },
  { label: "Hotel Norte · Reception", subject: "source-user:14000000-0000-0000-0000-000000000002", email: "leo-reception@migration.invalid", hotelId: "10000000-0000-0000-0000-000000000001" },
  { label: "Hotel Sur · Operations", subject: "source-user:24000000-0000-0000-0000-000000000001", email: "sol-ops@migration.invalid", hotelId: "20000000-0000-0000-0000-000000000002" },
  { label: "Hotel Sur · Housekeeping", subject: "source-user:24000000-0000-0000-0000-000000000002", email: "max-housekeeping@migration.invalid", hotelId: "20000000-0000-0000-0000-000000000002" },
  { label: "Network · SaaS Admin", subject: "source-user:14000000-0000-0000-0000-000000000003", email: "saas-admin@migration.invalid", hotelId: "10000000-0000-0000-0000-000000000001" },
] : [];
const initialLocalProfileIndex = typeof window === "undefined" ? 0 : Number(window.localStorage.getItem("hms-local-acceptance-profile") ?? 0);
let activeLocalDevProfile = localDevProfiles[initialLocalProfileIndex] ?? localDevProfiles[0];

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("content-type", "application/json");
  if (activeLocalDevProfile) {
    headers.set("x-local-access-subject", activeLocalDevProfile.subject);
    headers.set("x-local-access-email", activeLocalDevProfile.email);
    headers.set("x-hotel-id", activeLocalDevProfile.hotelId);
  }
  const response = await fetch(`/api/v1${path}`, { ...init, headers });
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { error?: { message?: string } } | null;
    throw new Error(payload?.error?.message ?? `Request failed (${response.status})`);
  }
  return response.json();
}

function lifecycleStatus(status: string): "Confirmed" | "CheckedIn" | "CheckedOut" | "Cancelled" | string {
  const key = status.replace(/[\s_-]/g, "").toLocaleLowerCase("en");
  if (key === "confirmed") return "Confirmed";
  if (key === "checkedin") return "CheckedIn";
  if (key === "checkedout") return "CheckedOut";
  if (key === "cancelled" || key === "canceled") return "Cancelled";
  return status;
}

const checkInSteps = ["Verificación", "Datos / estadía", "Habitación", "Confirmar ingreso"];

function ReceptionWorkspace() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Booking | null>(null);
  const [checkInStep, setCheckInStep] = useState(0);
  const [checkInData, setCheckInData] = useState({ count: "1", document: false, contact: false, stay: false });
  const [queueSearch, setQueueSearch] = useState("");
  const [queueFilter, setQueueFilter] = useState<ReceptionQueueFilter>("attention");
  const [form, setForm] = useState({ guest_id: "", room_id: "", check_in: "", check_out: "", notes: "" });

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [items, roomItems, guestItems] = await Promise.all([
        api<Booking[]>("/bookings?limit=100"),
        api<Room[]>("/rooms"),
        api<Guest[]>("/guests"),
      ]);
      setBookings(items);
      setRooms(roomItems);
      setGuests(guestItems);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const queue = buildReceptionQueue(bookings, localDateKey());
  const counts = receptionQueueCounts(queue);
  const visibleQueue = filterReceptionQueue(queue, queueFilter, queueSearch);

  function selectCase(booking: Booking) {
    setSelected(booking);
    setCheckInStep(0);
    setCheckInData({ count: "1", document: false, contact: false, stay: false });
    setError("");
  }

  async function refreshAvailability() {
    if (!form.check_in || !form.check_out) {
      setAvailableRooms([]);
      return;
    }
    try {
      setAvailableRooms(await api<Room[]>(`/rooms/available?start=${form.check_in}&end=${form.check_out}`));
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await api<Booking>("/bookings", { method: "POST", body: JSON.stringify(form) });
      setForm({ guest_id: "", room_id: "", check_in: "", check_out: "", notes: "" });
      setAvailableRooms([]);
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function lifecycle(path: string, body: Record<string, unknown>) {
    try {
      await api(path, { method: "POST", body: JSON.stringify(body) });
      setSelected(null);
      setCheckInStep(0);
      setCheckInData({ count: "1", document: false, contact: false, stay: false });
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function checkIn(event: FormEvent) {
    event.preventDefault();
    if (!selected) return;
    const mobile = window.innerWidth < 768;
    if (mobile && checkInStep < checkInSteps.length - 1) {
      setCheckInStep(checkInStep + 1);
      return;
    }
    await lifecycle(`/bookings/${selected.id}/check-in`, {
      check_in_guests_count: Number(checkInData.count),
      document_verified: checkInData.document,
      contact_confirmed: checkInData.contact,
      stay_confirmed: checkInData.stay,
    });
  }

  async function reassign(event: FormEvent) {
    event.preventDefault();
    if (!selected) return;
    await lifecycle(`/bookings/${selected.id}/reassign`, {
      room_id: new FormData(event.currentTarget as HTMLFormElement).get("room_id"),
    });
  }

  async function checkout(event: FormEvent) {
    event.preventDefault();
    if (!selected) return;
    const data = new FormData(event.currentTarget as HTMLFormElement);
    await lifecycle(`/bookings/${selected.id}/check-out`, {
      check_out_payment_policy: data.get("policy"),
      check_out_reference: data.get("reference"),
      charge_reviewed: data.get("charges") === "on",
      release_confirmed: data.get("release") === "on",
      handoff_confirmed: data.get("handoff") === "on",
    });
  }

  async function saveEdit(event: FormEvent) {
    event.preventDefault();
    if (!selected) return;
    try {
      const data = new FormData(event.currentTarget as HTMLFormElement);
      await api(`/bookings/${selected.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          guest_id: data.get("guest_id"),
          room_id: data.get("room_id"),
          check_in: data.get("check_in"),
          check_out: data.get("check_out"),
          notes: data.get("notes"),
        }),
      });
      setSelected(null);
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  const selectedStatus = selected ? lifecycleStatus(selected.status) : null;
  const mobileStep = checkInStep;

  return (
    <section className="reception-workspace">
      <div className="workspace-heading">
        <div>
          <p className="eyebrow">Reception desk</p>
          <h2>Turno de recepción</h2>
          <p className="muted">Trabajo priorizado, contexto del huésped y próxima acción</p>
        </div>
        <span className="case-count">{counts.attention} requieren atención · {counts.all} casos</span>
      </div>

      <form onSubmit={submit} aria-label="Create booking" className="case-create">
        <h3>Open walk-in or reservation case</h3>
        <select required aria-label="Guest" value={form.guest_id} onChange={e => setForm({ ...form, guest_id: e.target.value })}>
          <option value="">Select guest</option>
          {guests.map(guest => <option key={guest.id} value={guest.id}>{guest.full_name}</option>)}
        </select>
        <select required aria-label="Room" value={form.room_id} onChange={e => setForm({ ...form, room_id: e.target.value })}>
          <option value="">Select available room</option>
          {availableRooms.map(room => <option key={room.id} value={room.id}>{room.room_number} · {room.room_type}</option>)}
        </select>
        <label>Check-in <input required type="date" value={form.check_in} onChange={e => setForm({ ...form, check_in: e.target.value })} /></label>
        <label>Check-out <input required type="date" value={form.check_out} onChange={e => setForm({ ...form, check_out: e.target.value })} /></label>
        <button type="button" onClick={() => void refreshAvailability()}>Find available rooms</button>
        <input placeholder="Notes (optional)" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
        <button>Create booking</button>
      </form>

      {error && <p className="error" role="alert">{error}</p>}
      {loading && <p className="muted" role="status">Loading booking queue…</p>}

      <div className="case-layout reception-case-layout">
        <aside className="reception-queue-panel" aria-label="Reception case queue">
          <div className="queue-heading">
            <div>
              <p className="eyebrow">Cola del turno</p>
              <h3>Qué resolver ahora</h3>
            </div>
            <span>{visibleQueue.length}</span>
          </div>

          <label className="reception-search">
            Buscar en el turno
            <input
              type="search"
              aria-label="Buscar en el turno"
              placeholder="Huésped, habitación o reserva"
              value={queueSearch}
              onChange={e => setQueueSearch(e.target.value)}
            />
          </label>

          <div className="reception-filters" role="group" aria-label="Filtros de recepción">
            {receptionQueueFilters.map(filter => (
              <button
                type="button"
                className={queueFilter === filter.value ? "selected" : ""}
                key={filter.value}
                onClick={() => setQueueFilter(filter.value)}
              >
                {filter.label} <span>{counts[filter.value]}</span>
              </button>
            ))}
          </div>

          <p className="queue-summary" role="status">
            {visibleQueue.length === 1 ? "1 caso visible" : `${visibleQueue.length} casos visibles`}
          </p>

          <div className="case-queue reception-case-queue">
            {visibleQueue.map(item => (
              <button
                type="button"
                className={selected?.id === item.booking.id ? "selected" : ""}
                key={item.booking.id}
                onClick={() => selectCase(item.booking)}
              >
                <div className="reception-case-topline">
                  <span className={`reception-lane lane-${item.lane.toLocaleLowerCase("es").replace(/\s/g, "-")}`}>{item.lane}</span>
                  <small>Hab. {item.booking.room_number}</small>
                </div>
                <strong>{item.booking.guest_name}</strong>
                <span>{item.title}</span>
                <small>{item.detail}</small>
                <div className="reception-case-bottomline">
                  <small>{item.booking.check_in} → {item.booking.check_out}</small>
                  <strong>{item.actionLabel} →</strong>
                </div>
              </button>
            ))}
            {!loading && visibleQueue.length === 0 && (
              <div className="queue-empty">
                <strong>No hay casos en esta vista.</strong>
                <span>{queueFilter === "attention" ? "El turno no tiene acciones urgentes con los datos actuales." : "Probá otro filtro o búsqueda."}</span>
              </div>
            )}
          </div>
        </aside>

        {selected ? (
          <article className="case-panel reception-case-panel">
            <div className="case-panel-heading">
              <div>
                <p className="eyebrow">Selected case</p>
                <h3>{selected.guest_name}</h3>
                <p className="muted">{selected.check_in} → {selected.check_out} · Room {selected.room_number}</p>
              </div>
              <span className="status-badge">{selected.status}</span>
            </div>

            <form onSubmit={saveEdit} aria-label="Edit booking">
              <h4>Stay details</h4>
              <select name="guest_id" defaultValue={selected.guest_id} required>{guests.map(guest => <option key={guest.id} value={guest.id}>{guest.full_name}</option>)}</select>
              <select name="room_id" defaultValue={selected.room_id} required>{rooms.filter(room => room.id === selected.room_id || room.status === "Available").map(room => <option key={room.id} value={room.id}>{room.room_number}</option>)}</select>
              <input name="check_in" type="date" defaultValue={selected.check_in} required />
              <input name="check_out" type="date" defaultValue={selected.check_out} required />
              <input name="notes" defaultValue={selected.notes ?? ""} placeholder="Notes (optional)" />
              <button>Save changes</button>
              <button type="button" onClick={() => { setSelected(null); setCheckInStep(0); }}>Close case</button>
            </form>

            {selectedStatus === "Confirmed" && (
              <form onSubmit={checkIn} aria-label="Check in booking">
                <h4>Next action: check-in verification</h4>
                <div className="step-progress" aria-label="Check-in progress">
                  {checkInSteps.map((step, index) => <span className={index === mobileStep ? "current" : index < mobileStep ? "complete" : ""} key={step}>{index + 1}. {step}</span>)}
                </div>
                {(window.innerWidth >= 768 || mobileStep === 0) && <><p className="step-title">{checkInSteps[0]}</p><label>Final guest count <input name="check_in_guests_count" type="number" min="1" max="100" value={checkInData.count} onChange={e => setCheckInData({ ...checkInData, count: e.target.value })} required /></label><label><input type="checkbox" name="document" checked={checkInData.document} onChange={e => setCheckInData({ ...checkInData, document: e.target.checked })} required />Document verified</label></>}
                {(window.innerWidth >= 768 || mobileStep === 1) && <><p className="step-title">{checkInSteps[1]}</p><label><input type="checkbox" name="contact" checked={checkInData.contact} onChange={e => setCheckInData({ ...checkInData, contact: e.target.checked })} required />Contact confirmed</label><label><input type="checkbox" name="stay" checked={checkInData.stay} onChange={e => setCheckInData({ ...checkInData, stay: e.target.checked })} required />Stay confirmed</label></>}
                {(window.innerWidth >= 768 || mobileStep === 2) && <><p className="step-title">{checkInSteps[2]}</p><p className="muted">Room {selected.room_number} is assigned for this stay.</p></>}
                {(window.innerWidth >= 768 || mobileStep === 3) && <><p className="step-title">{checkInSteps[3]}</p><p className="muted">Review the guest count, verification and stay confirmations before completing check-in.</p></>}
                {window.innerWidth < 768 ? <div className="step-actions">{mobileStep > 0 && <button type="button" onClick={() => setCheckInStep(mobileStep - 1)}>Back</button>}<button>{mobileStep < checkInSteps.length - 1 ? "Next step" : "Complete check-in"}</button></div> : <button>Complete check-in</button>}
              </form>
            )}

            {selectedStatus === "CheckedIn" && <>
              <form onSubmit={reassign} aria-label="Reassign room">
                <h4>Next action: room reassignment</h4>
                <select name="room_id" required><option value="">Select destination room</option>{rooms.filter(room => room.id !== selected.room_id && room.status === "Available").map(room => <option key={room.id} value={room.id}>{room.room_number}</option>)}</select>
                <button>Reassign room</button>
              </form>
              <form onSubmit={checkout} aria-label="Checkout">
                <h4>Next action: checkout and handoff</h4>
                <label>Payment policy <select name="policy" required><option value="settled">Settled</option><option value="pending-approved">Pending approved</option></select></label>
                <label>Closing reference <input name="reference" minLength={6} placeholder="Required for pending approved (6+ chars)" /></label>
                {[["charges", "Charges reviewed"], ["release", "Room release confirmed"], ["handoff", "Housekeeping handoff confirmed"]].map(([name, label]) => <label key={name}><input type="checkbox" name={name} required />{label}</label>)}
                <button>Complete checkout</button>
              </form>
            </>}
          </article>
        ) : (
          <div className="empty-case reception-empty-case">
            <p className="eyebrow">Foco del turno</p>
            <h3>Seleccioná un caso</h3>
            <p className="muted">La cola está ordenada por prioridad operativa. Abrí un caso para continuar con su próxima acción.</p>
            {visibleQueue[0] && <button type="button" onClick={() => selectCase(visibleQueue[0].booking)}>Abrir primer caso</button>}
          </div>
        )}
      </div>
    </section>
  );
}

function BillingPanel() {
  const [items, setItems] = useState<Booking[]>([]);
  const [selected, setSelected] = useState<Booking | null>(null);
  const [invoice, setInvoice] = useState<Invoice>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [charges, setCharges] = useState<ExtraCharge[]>([]);
  const [charge, setCharge] = useState({ description: "", amount: "" });
  const [payment, setPayment] = useState({ amount: "", method: "CASH", reference: "" });
  const [error, setError] = useState("");

  async function refresh(id?: string) {
    try {
      const next = await api<Booking[]>("/bookings?limit=100");
      setItems(next);
      const current = next.find(item => item.id === id) ?? selected ?? next[0];
      if (!current) return;
      setSelected(current);
      const [i, p, x] = await Promise.all([
        api<Invoice>(`/bookings/${current.id}/invoice`),
        api<Payment[]>(`/bookings/${current.id}/payments`),
        api<ExtraCharge[]>(`/bookings/${current.id}/extra-charges`),
      ]);
      setInvoice(i); setPayments(p); setCharges(x);
    } catch (e) { setError((e as Error).message); }
  }

  useEffect(() => { void refresh(); }, []);

  async function submitCharge(event: FormEvent) {
    event.preventDefault(); if (!selected) return;
    try {
      await api(`/bookings/${selected.id}/extra-charges`, { method: "POST", body: JSON.stringify({ description: charge.description, amount_cents: Number(charge.amount), category: "OTHER" }) });
      setCharge({ description: "", amount: "" }); await refresh(selected.id);
    } catch (e) { setError((e as Error).message); }
  }

  async function submitPayment(event: FormEvent) {
    event.preventDefault(); if (!selected) return;
    try {
      await api(`/bookings/${selected.id}/payments`, { method: "POST", body: JSON.stringify({ amount_cents: Number(payment.amount), payment_method: payment.method, payment_reference: payment.reference || undefined }) });
      setPayment({ ...payment, amount: "", reference: "" }); await refresh(selected.id);
    } catch (e) { setError((e as Error).message); }
  }

  return <section className="billing-workspace"><div className="workspace-heading"><div><p className="eyebrow">Finance</p><h2>Billing and payments</h2><p className="muted">Exact cents, payment history and booking invoice</p></div></div>{error && <p className="error" role="alert">{error}</p>}<label>Booking <select aria-label="Billing booking" value={selected?.id ?? ""} onChange={e => void refresh(e.target.value)}><option value="">Select booking</option>{items.map(item => <option key={item.id} value={item.id}>{item.guest_name} · {item.room_number}</option>)}</select></label>{selected && <article className="case-panel"><h3>{selected.guest_name} · Invoice</h3><p className="muted">Total {invoice?.amount_cents ?? selected.total_cents} cents · Paid {invoice?.paid_amount_cents ?? 0} cents · {invoice?.status ?? "PENDING"}</p><form onSubmit={submitCharge} aria-label="Billing extra charge"><input required aria-label="Billing charge description" placeholder="Description" value={charge.description} onChange={e => setCharge({ ...charge, description: e.target.value })} /><input required min="1" type="number" aria-label="Billing charge amount" placeholder="Amount cents" value={charge.amount} onChange={e => setCharge({ ...charge, amount: e.target.value })} /><button>Add extra charge</button></form><form onSubmit={submitPayment} aria-label="Billing payment"><input required min="1" type="number" aria-label="Billing payment amount" placeholder="Payment cents" value={payment.amount} onChange={e => setPayment({ ...payment, amount: e.target.value })} /><select aria-label="Billing payment method" value={payment.method} onChange={e => setPayment({ ...payment, method: e.target.value })}><option value="CASH">Cash</option><option value="CARD">Card</option><option value="TRANSFER">Transfer</option></select><input aria-label="Billing payment reference" placeholder="Reference" value={payment.reference} onChange={e => setPayment({ ...payment, reference: e.target.value })} /><button>Register payment</button></form>{charges.map(item => <p className="muted" key={item.id}>Charge · {item.description} · {item.amount_cents} cents</p>)}{payments.map(item => <p className="muted" key={item.id}>Payment · {item.amount_cents} cents · {item.payment_method}</p>)}</article>}</section>;
}

type CashBalance = { total_amount_cents: number; cash_amount_cents: number; card_amount_cents: number; non_cash_amount_cents: number; payment_count: number; pending_amount_cents: number; opening_time: string };

function CashBalancePanel() {
  const [balance, setBalance] = useState<CashBalance | null>(null);
  const [counted, setCounted] = useState("");
  const [handoff, setHandoff] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function refresh() { try { setBalance(await api<CashBalance>("/billing/balance")); } catch (e) { setError((e as Error).message); } }
  useEffect(() => { void refresh(); }, []);

  async function closeShift(event: FormEvent) {
    event.preventDefault(); if (!balance) return; setError(""); setMessage("");
    try {
      const result = await api<{ cash_difference_cents: number }>("/billing/close-cash", { method: "POST", body: JSON.stringify({ expected_cash_amount_cents: balance.cash_amount_cents, expected_total_amount_cents: balance.total_amount_cents, expected_non_cash_amount_cents: balance.non_cash_amount_cents, expected_payment_count: balance.payment_count, counted_cash_amount_cents: Number(counted), handoff_to: handoff, notes: notes || undefined }) });
      setMessage(`Shift closed · difference ${result.cash_difference_cents} cents`); setCounted(""); setHandoff(""); setNotes(""); await refresh();
    } catch (e) { setError((e as Error).message); await refresh(); }
  }

  return <section className="billing-workspace" aria-label="Cash balance and close"><div className="workspace-heading"><div><p className="eyebrow">Cash operations</p><h2>Current shift balance</h2><p className="muted">Revalidated at close; handoff remains auditable</p></div><button type="button" onClick={() => void refresh()}>Refresh balance</button></div>{error && <p className="error" role="alert">{error}</p>}{message && <p className="status-badge" role="status">{message}</p>}{balance && <><div className="cards"><article><strong>Total {balance.total_amount_cents} cents</strong><span>Cash {balance.cash_amount_cents} cents</span><span>Non-cash {balance.non_cash_amount_cents} cents</span><span>{balance.payment_count} payments</span></article><article><span>Pending invoices {balance.pending_amount_cents} cents</span><span>Opening {balance.opening_time}</span></article></div><form onSubmit={closeShift} aria-label="Close cash shift"><label>Expected cash <input aria-label="Expected cash cents" type="number" value={balance.cash_amount_cents} readOnly /></label><label>Counted cash <input required min="0" aria-label="Counted cash cents" type="number" value={counted} onChange={e => setCounted(e.target.value)} /></label><label>Handoff to <input required minLength={1} aria-label="Handoff to" value={handoff} onChange={e => setHandoff(e.target.value)} /></label><label>Notes <input aria-label="Close notes" value={notes} onChange={e => setNotes(e.target.value)} /></label><button>Close cash shift</button></form></>}</section>;
}

function LocalDevIdentitySelector({ onChange }: { onChange: () => void }) {
  if (!localAcceptanceEnabled) return null;
  const selected = Math.max(0, localDevProfiles.indexOf(activeLocalDevProfile));
  return <aside className="local-dev-identity" aria-label="Local acceptance identity"><strong>Local acceptance identity</strong><label>Profile <select aria-label="Local acceptance profile" value={String(selected)} onChange={event => { const index = Number(event.target.value); activeLocalDevProfile = localDevProfiles[index]; window.localStorage.setItem("hms-local-acceptance-profile", String(index)); onChange(); }}>{localDevProfiles.map((profile, index) => <option value={index} key={profile.subject}>{profile.label}</option>)}</select></label><small>Synthetic fixture only · not persisted</small></aside>;
}

export function ReceptionRoot() {
  const [identityVersion, setIdentityVersion] = useState(0);
  return (
    <main>
      <header>
        <div><p className="eyebrow">HMS Elite</p><h1>Hotel operations</h1></div>
        <nav>
          <a className="active" href="/bookings">Reception</a>
          <a href="/rooms">Rooms</a>
          <a href="/guests">Guests</a>
          <a href="/housekeeping">Housekeeping</a>
          <a href="/users">Users</a>
          <a href="/reports">Reports</a>
          <a href="/network">Network</a>
        </nav>
      </header>
      <LocalDevIdentitySelector onChange={() => setIdentityVersion(value => value + 1)} />
      <div key={identityVersion}>
        <ReceptionWorkspace />
        <BillingPanel />
        <CashBalancePanel />
      </div>
    </main>
  );
}
