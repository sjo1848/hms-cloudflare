import { BillingWorkspace } from "../billing/BillingWorkspace";
import { StatusBadge } from "../../components/StatusBadge";
import { checkInSteps } from "./model";
import { useReceptionWorkspace } from "./useReceptionWorkspace";

function Bookings() {
  const {
    bookings, rooms, guests, availableRooms, editAvailableRooms, loading, error, selected,
    checkInStep, checkInData, form, editForm,
    setCheckInStep, setCheckInData, setForm, setEditForm,
    selectCase, closeCase, refreshAvailability, submit, checkIn, reassign, checkout,
    saveEdit, cancelBooking,
  } = useReceptionWorkspace();
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
          <button type="button" onClick={closeCase}>Close case</button>
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
