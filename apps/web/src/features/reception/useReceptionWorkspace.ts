import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { Booking, Guest, Room } from "../../domain/types";
import {
  cancelBooking as cancelBookingRequest,
  checkInBooking,
  checkoutBooking,
  createBooking,
  loadAvailableRooms,
  loadReceptionQueue,
  reassignBooking,
  updateBooking,
} from "./reception-api";
import {
  CHECK_IN_STEP_COUNT,
  emptyBookingForm,
  emptyCheckInData,
  type BookingEditForm,
  type BookingForm,
  type CheckInData,
} from "./model";
import { useI18n } from "../../i18n";

export function useReceptionWorkspace() {
  const { t } = useI18n();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [editAvailableRooms, setEditAvailableRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Booking | null>(null);
  const [checkInStep, setCheckInStep] = useState(0);
  const [checkInData, setCheckInData] = useState<CheckInData>(emptyCheckInData);
  const [form, setForm] = useState<BookingForm>(emptyBookingForm);
  const [editForm, setEditForm] = useState<BookingEditForm>(emptyBookingForm);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const next = await loadReceptionQueue();
      setBookings(next.bookings);
      setRooms(next.rooms);
      setGuests(next.guests);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  useEffect(() => {
    if (!selected || selected.status !== "Confirmed" || !editForm.check_in || !editForm.check_out) {
      setEditAvailableRooms([]);
      return;
    }
    const timeout = window.setTimeout(() => {
      void loadAvailableRooms(editForm.check_in, editForm.check_out, selected.id)
        .then(items => {
          setEditAvailableRooms(items);
          if (!items.some(room => room.id === editForm.room_id)) setEditForm(current => ({ ...current, room_id: "" }));
        })
        .catch(e => {
          setEditAvailableRooms([]);
          setError((e as Error).message);
        });
    }, 120);
    return () => window.clearTimeout(timeout);
  }, [selected?.id, selected?.status, editForm.check_in, editForm.check_out]);

  function resetLifecycleUi() {
    setCheckInStep(0);
    setCheckInData(emptyCheckInData());
  }

  function closeCase() {
    setSelected(null);
    setEditAvailableRooms([]);
    resetLifecycleUi();
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
    resetLifecycleUi();
    setError("");
  }

  async function refreshAvailability() {
    if (!form.check_in || !form.check_out) {
      setAvailableRooms([]);
      return;
    }
    try {
      const items = await loadAvailableRooms(form.check_in, form.check_out);
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
      await createBooking(form);
      setForm(emptyBookingForm());
      setAvailableRooms([]);
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function runLifecycle(action: () => Promise<unknown>) {
    try {
      await action();
      closeCase();
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function checkIn(event: FormEvent) {
    event.preventDefault();
    if (!selected) return;
    const mobile = window.innerWidth < 768;
    if (mobile && checkInStep < CHECK_IN_STEP_COUNT - 1) {
      setCheckInStep(current => current + 1);
      return;
    }
    await runLifecycle(() => checkInBooking(selected.id, checkInData));
  }

  async function reassign(event: FormEvent) {
    event.preventDefault();
    if (!selected) return;
    const roomId = new FormData(event.currentTarget as HTMLFormElement).get("room_id");
    await runLifecycle(() => reassignBooking(selected.id, roomId));
  }

  async function checkout(event: FormEvent) {
    event.preventDefault();
    if (!selected) return;
    const data = new FormData(event.currentTarget as HTMLFormElement);
    await runLifecycle(() => checkoutBooking(selected.id, data));
  }

  async function saveEdit(event: FormEvent) {
    event.preventDefault();
    if (!selected || selected.status !== "Confirmed") return;
    try {
      await updateBooking(selected.id, editForm);
      closeCase();
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function cancelBooking() {
    if (!selected || selected.status !== "Confirmed") return;
    if (!window.confirm(t("reception.cancelConfirm"))) return;
    try {
      await cancelBookingRequest(selected.id);
      closeCase();
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return {
    bookings, rooms, guests, availableRooms, editAvailableRooms, loading, error, selected,
    checkInStep, checkInData, form, editForm,
    setCheckInStep, setCheckInData, setForm, setEditForm,
    selectCase, closeCase, refreshAvailability, submit, checkIn, reassign, checkout,
    saveEdit, cancelBooking,
  };
}
