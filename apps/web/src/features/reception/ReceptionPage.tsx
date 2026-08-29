import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { api } from "../../api/client";
import type { Booking, ExtraCharge, Guest, Invoice, Payment, Room } from "../../domain/types";
import { BillingWorkspace } from "../billing/BillingWorkspace";
import { StatusBadge } from "../../components/StatusBadge";

const checkInSteps = ["Verificación", "Datos / estadía", "Habitación", "Confirmar ingreso"];

type BookingEditForm = {
  guest_id: string;
  room_id: string;
  check_in: string;
  check_out: string;
  notes: string;
};

function Bookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [editAvailableRooms, setEditAvailableRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Booking | null>(null);
  const [invoice, setInvoice] = useState<Invoice>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [charges, setCharges] = useState<ExtraCharge[]>([]);
  const [billingForm, setBillingForm] = useState({ charge: "", description: "", payment: "", method: "CASH", reference: "" });
  const [paymentOperationToken, setPaymentOperationToken] = useState<string | null>(null);
  const [checkInStep, setCheckInStep] = useState(0);
  const [checkInData, setCheckInData] = useState({ count: "1", document: false, contact: false, stay: false });
  const [form, setForm] = useState({ guest_id: "", room_id: "", check_in: "", check_out: "", notes: "" });
  const [editForm, setEditForm] = useState<BookingEditForm>({ guest_id: "", room_id: "", check_in: "", check_out: "", notes: "" });

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

  useEffect(() => {
    if (!selected || selected.status !== "Confirmed" || !editForm.check_in || !editForm.check_out) {
      setEditAvailableRooms([]);
      return;
    }
    const timeout = window.setTimeout(() => {
      const query = new URLSearchParams({
        start: editForm.check_in,
        end: editForm.check_out,
        exclude_booking_id: selected.id,
      });
      void api<Room[]>(`/rooms/available?${query.toString()}`)
        .then(items => {
          setEditAvailableRooms(items);
          if (!items.some(room => room.id === editForm.room_id)) {
            setEditForm(current => ({ ...current, room_id: "" }));
          }
        })
        .catch(e => {
          setEditAvailableRooms([]);
          setError((e as Error).message);
        });
    }, 120);
    return () => window.clearTimeout(timeout);
  }, [selected?.id, selected?.status, editForm.check_in, editForm.check_out]);

  async function loadBilling(bookingId: string) {
    try {
      const [nextInvoice, nextPayments, nextCharges] = await Promise.all([
        api<Invoice>(`/bookings/${bookingId}/invoice`),
        api<Payment[]>(`/bookings/${bookingId}/payments`),
        api<ExtraCharge[]>(`/bookings/${bookingId}/extra-charges`),
      ]);
      setInvoice(nextInvoice);
      setPayments(nextPayments);
      setCharges(nextCharges);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  function selectCase(booking: Booking) {
    setSelected(booking);
    setEditForm({
      guest_id: booking.guest_id,
      room_id: booking.room_id,
      check_in: booking.check_in,
      check_out: booking.check_out,
      notes: booking.notes ?? "",
    });
    setCheckInStep(0);
    setCheckInData({ count: "1", document: false, contact: false, stay: false });
    setBillingForm({ charge: "", description: "", payment: "", method: "CASH", reference: "" });
    setPaymentOperationToken(null);
    setError("");
    void loadBilling(booking.id);
  }

  async function refreshAvailability() {
    if (!form.check_in || !form.check_out) {
      setAvailableRooms([]);
      return;
    }
    try {
      const query = new URLSearchParams({ start: form.check_in, end: form.check_out });
      const items = await api<Room[]>(`/rooms/available?${query.toString()}`);
      setAvailableRooms(items);
      if (!items.some(room => room.id === form.room_id)) setForm(current => ({ ...current, room_id: "" }));
    } catch (e) {
      setAvailableRooms([]);
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
    if (!selected || selected.status !== "Confirmed") return;
    try {
      await api(`/bookings/${selected.id}`, { method: "PATCH", body: JSON.stringify(editForm) });
      setSelected(null);
      setEditAvailableRooms([]);
      setCheckInStep(0);
      setCheckInData({ count: "1", document: false, contact: false, stay: false });
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function cancelBooking() {
    if (!selected || selected.status !== "Confirmed") return;
    if (!window.confirm("Cancel this booking? Its room inventory will be released.")) return;
    try {
      await api(`/bookings/${selected.id}`, { method: "PATCH", body: JSON.stringify({ status: "CANCELLED" }) });
      setSelected(null);
      setEditAvailableRooms([]);
      setCheckInStep(0);
      setCheckInData({ count: "1", document: false, contact: false, stay: false });
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function addCharge(event: FormEvent) {
    event.preventDefault();
    if (!selected) return;
    try {
      await api(`/bookings/${selected.id}/extra-charges`, {
        method: "POST",
        body: JSON.stringify({ amount_cents: Number(billingForm.charge), description: billingForm.description, category: "OTHER" }),
      });
      setBillingForm({ ...billingForm, charge: "", description: "" });
      await loadBilling(selected.id);
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function addPayment(event: FormEvent) {
    event.preventDefault();
    if (!selected) return;
    const operationToken = paymentOperationToken ?? crypto.randomUUID();
    setPaymentOperationToken(operationToken);
    try {
      await api(`/bookings/${selected.id}/payments`, {
        method: "POST",
        body: JSON.stringify({
          amount_cents: Number(billingForm.payment),
          payment_method: billingForm.method,
          payment_reference: billingForm.reference || undefined,
          operation_token: operationToken,
        }),
      });
      setBillingForm({ ...billingForm, payment: "", reference: "" });
      setPaymentOperationToken(null);
      await loadBilling(selected.id);
    } catch (e) {
      setError((e as Error).message);
      await loadBilling(selected.id);
    }
  }

  const mobileStep = checkInStep;

  return <section className="reception-workspace">
    <div className="workspace-heading">
      <div><p className="eyebrow">Reception desk</p><h2>Booking case workspace</h2><p className="muted">Queue, stay details and next action</p></div>
      <span className="case-count">{bookings.length} active cases</span>
    </div>

    <form onSubmit={submit} aria-label="Create booking" className="case-create">
      <h3>Open walk-in or reservation case</h3>
      <select required aria-label="Guest" value={form.guest_id} onChange={e => setForm({ ...form, guest_id: e.target.value })}>
        <option value="">Select guest</option>{guests.map(guest => <option key={guest.id} value={guest.id}>{guest.full_name}</option>)}
      </select>
      <select required aria-label="Room" value={form.room_id} onChange={e => setForm({ ...form, room_id: e.target.value })}>
        <option value="">Select available room</option>{availableRooms.map(room => <option key={room.id} value={room.id}>{room.room_number} · {room.room_type}</option>)}
      </select>
      <label>Check-in <input required type="date" value={form.check_in} onChange={e => setForm({ ...form, check_in: e.target.value })} /></label>
      <label>Check-out <input required type="date" value={form.check_out} onChange={e => setForm({ ...form, check_out: e.target.value })} /></label>
      <button type="button" onClick={() => void refreshAvailability()}>Find available rooms</button>
      <input placeholder="Notes (optional)" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
      <button>Create booking</button>
    </form>

    {error && <p className="error" role="alert">{error}</p>}
    {loading && <p className="muted" role="status">Loading booking queue…</p>}

    <div className="case-layout">
      <aside aria-label="Reception case queue">
        <h3>Case queue</h3>
        <div className="case-queue">{bookings.map(booking => <button className={selected?.id === booking.id ? "selected" : ""} key={booking.id} onClick={() => selectCase(booking)}><strong>{booking.guest_name}</strong><span>{booking.status} · Room {booking.room_number}</span><small>{booking.check_in} → {booking.check_out}</small></button>)}</div>
      </aside>

      {selected ? <article className="case-panel">
        <div className="case-panel-heading">
          <div><p className="eyebrow">Selected case</p><h3>{selected.guest_name}</h3><p className="muted">{selected.check_in} → {selected.check_out} · Room {selected.room_number}</p></div>
          <StatusBadge>{selected.status}</StatusBadge>
        </div>

        {selected.status === "Confirmed" ? <form onSubmit={saveEdit} aria-label="Edit booking">
          <h4>Stay details</h4>
          <label>Guest <select aria-label="Edit guest" value={editForm.guest_id} onChange={e => setEditForm({ ...editForm, guest_id: e.target.value })} required>{guests.map(guest => <option key={guest.id} value={guest.id}>{guest.full_name}</option>)}</select></label>
          <label>Room <select aria-label="Edit room" value={editForm.room_id} onChange={e => setEditForm({ ...editForm, room_id: e.target.value })} required><option value="">Select room for these dates</option>{editAvailableRooms.map(room => <option key={room.id} value={room.id}>{room.room_number} · {room.room_type}</option>)}</select></label>
          <label>Check-in <input aria-label="Edit check-in" type="date" value={editForm.check_in} onChange={e => setEditForm({ ...editForm, check_in: e.target.value })} required /></label>
          <label>Check-out <input aria-label="Edit check-out" type="date" value={editForm.check_out} onChange={e => setEditForm({ ...editForm, check_out: e.target.value })} required /></label>
          <label>Notes <input aria-label="Edit notes" value={editForm.notes} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} placeholder="Notes (optional)" /></label>
          <button>Save changes</button>
          <button type="button" onClick={() => void cancelBooking()}>Cancel booking</button>
          <button type="button" onClick={() => { setSelected(null); setEditAvailableRooms([]); setCheckInStep(0); }}>Close case</button>
        </form> : <div className="locked-stay-details"><h4>Stay details</h4><p className="muted">Stay assignment is locked after the booking leaves Confirmed state.</p></div>}

        {selected.status === "Confirmed" && <form onSubmit={checkIn} aria-label="Check in booking">
          <h4>Next action: check-in verification</h4>
          <div className="step-progress" aria-label="Check-in progress">{checkInSteps.map((step, index) => <span className={index === mobileStep ? "current" : index < mobileStep ? "complete" : ""} key={step}>{index + 1}. {step}</span>)}</div>
          {(window.innerWidth >= 768 || mobileStep === 0) && <><p className="step-title">{checkInSteps[0]}</p><label>Final guest count <input name="check_in_guests_count" type="number" min="1" max="100" value={checkInData.count} onChange={e => setCheckInData({ ...checkInData, count: e.target.value })} required /></label><label><input type="checkbox" name="document" checked={checkInData.document} onChange={e => setCheckInData({ ...checkInData, document: e.target.checked })} required />Document verified</label></>}
          {(window.innerWidth >= 768 || mobileStep === 1) && <><p className="step-title">{checkInSteps[1]}</p><label><input type="checkbox" name="contact" checked={checkInData.contact} onChange={e => setCheckInData({ ...checkInData, contact: e.target.checked })} required />Contact confirmed</label><label><input type="checkbox" name="stay" checked={checkInData.stay} onChange={e => setCheckInData({ ...checkInData, stay: e.target.checked })} required />Stay confirmed</label></>}
          {(window.innerWidth >= 768 || mobileStep === 2) && <><p className="step-title">{checkInSteps[2]}</p><p className="muted">Room {selected.room_number} is assigned for this stay.</p></>}
          {(window.innerWidth >= 768 || mobileStep === 3) && <><p className="step-title">{checkInSteps[3]}</p><p className="muted">Review the guest count, verification and stay confirmations before completing check-in.</p></>}
          {window.innerWidth < 768 && <div className="step-actions">{mobileStep > 0 && <button type="button" onClick={() => setCheckInStep(mobileStep - 1)}>Back</button>}<button>{mobileStep < checkInSteps.length - 1 ? "Next step" : "Complete check-in"}</button></div>}
          {window.innerWidth >= 768 && <button>Complete check-in</button>}
        </form>}

        {selected.status === "CheckedIn" && <>
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
      </article> : <div className="empty-case"><h3>Select a case</h3><p className="muted">Choose a guest from the reception queue to continue the next action.</p></div>}
    </div>
  </section>;
}

export function ReceptionPage() {
  return <><Bookings /><BillingWorkspace /></>;
}
