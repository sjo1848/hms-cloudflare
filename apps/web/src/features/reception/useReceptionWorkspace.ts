import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import type { Booking, FrontDeskBoard, Guest, HousekeepingBoard, Invoice, MaintenanceCase, Room } from "../../domain/types";
import {
  cancelBooking as cancelBookingRequest,
  checkInBooking,
  checkoutBooking,
  createBooking,
  loadAvailableRooms,
  loadBillingContext,
  loadHotelContext,
  loadReceptionQueue,
  loadRoomMaintenanceCase,
  reassignBooking,
  updateBooking,
} from "./reception-api";
import {
  emptyBookingForm,
  emptyCheckInData,
  type BookingEditForm,
  type BookingForm,
  type CheckInData,
} from "./model";
import { useI18n } from "../../i18n";
import { ApiError } from "../../api/client";

export function useReceptionWorkspace() {
  const { t } = useI18n();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [frontDeskBoard, setFrontDeskBoard] = useState<FrontDeskBoard | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [editAvailableRooms, setEditAvailableRooms] = useState<Room[]>([]);
  const [reassignAvailableIds, setReassignAvailableIds] = useState<Set<string>>(new Set());
  const [reassignBoard, setReassignBoard] = useState<HousekeepingBoard | null>(null);
  const [reassignMaintenanceCase, setReassignMaintenanceCase] = useState<MaintenanceCase | null>(null);
  const [reassignInvoice, setReassignInvoice] = useState<Invoice>(null);
  const [reassignExtraCents, setReassignExtraCents] = useState(0);
  const [reassignHotelDate, setReassignHotelDate] = useState("");
  const [actionBusy, setActionBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [checkInConflict, setCheckInConflict] = useState("");
  const [checkInNeedsRefresh, setCheckInNeedsRefresh] = useState(false);
  const [checkInAccepted, setCheckInAccepted] = useState(false);
  const [selected, setSelected] = useState<Booking | null>(null);
  const [checkInStep, setCheckInStep] = useState(0);
  const [checkInData, setCheckInData] = useState<CheckInData>(emptyCheckInData);
  const [form, setForm] = useState<BookingForm>(emptyBookingForm);
  const [editForm, setEditForm] = useState<BookingEditForm>(emptyBookingForm);
  const loadEpoch = useRef(0);
  const checkInInFlight = useRef(false);

  async function load() {
    const epoch = ++loadEpoch.current;
    if (frontDeskBoard) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const next = await loadReceptionQueue();
      if (epoch !== loadEpoch.current) return null;
      setFrontDeskBoard(next.board);
      setBookings(next.bookings);
      setRooms(next.rooms);
      setGuests(next.guests);
      setSelected(current => current ? next.bookings.find(booking => booking.id === current.id) ?? current : null);
      return next.board;
    } catch (e) {
      if (epoch === loadEpoch.current) setError((e as Error).message);
      return null;
    } finally {
      if (epoch === loadEpoch.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }

  useEffect(() => { void load(); }, []);
  useEffect(() => {
    function revalidate() { if (document.visibilityState === "visible" && !actionBusy) void load(); }
    window.addEventListener("focus", revalidate);
    const interval = window.setInterval(revalidate, 30000);
    return () => { window.removeEventListener("focus", revalidate); window.clearInterval(interval); };
  }, [actionBusy, frontDeskBoard]);

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
    setReassignAvailableIds(new Set());
    setReassignBoard(null);
    setReassignMaintenanceCase(null);
    setReassignInvoice(null);
    setReassignExtraCents(0);
    setReassignHotelDate("");
    resetLifecycleUi();
    setCheckInConflict("");
    setCheckInNeedsRefresh(false);
    setCheckInAccepted(false);
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
    setNotice("");
    setCheckInConflict("");
    setCheckInNeedsRefresh(false);
    setCheckInAccepted(false);
    if (booking.status === "CheckedIn") {
      setActionBusy(false);
      void loadReassignmentContext(booking);
    }
  }

  async function loadReassignmentContext(booking: Booking) {
    try {
      const hotelContext = await loadHotelContext();
      const [available, billing] = await Promise.all([
        loadAvailableRooms(booking.check_in, booking.check_out, booking.id),
        loadBillingContext(booking.id),
      ]);
      const board: HousekeepingBoard = {
        date: hotelContext.hotel_local_date,
        rooms: available.map((room, index) => ({
          room_id: room.id,
          room_number: room.room_number,
          room_type: room.room_type,
          room_status: room.status,
        })),
      };
      setReassignHotelDate(hotelContext.hotel_local_date);
      setReassignAvailableIds(new Set(available.map(room => room.id)));
      setReassignBoard(board);
      setReassignInvoice(billing[0]);
      setReassignExtraCents(billing[1].reduce((sum, item) => sum + item.amount_cents, 0));
    } catch (e) {
      setReassignAvailableIds(new Set());
      setReassignBoard(null);
      setError((e as Error).message);
    }
  }

  async function selectReassignDestination(roomId: string) {
    setReassignMaintenanceCase(null);
    if (!roomId) return;
    try {
      setReassignMaintenanceCase(await loadRoomMaintenanceCase(roomId));
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) return;
      if (typeof e === "object" && e !== null && "status" in e && (e as { status?: unknown }).status === 404) return;
      setError((e as Error).message);
    }
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
    setNotice("");
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
    if (actionBusy) return;
    setActionBusy(true);
    try {
      await action();
      closeCase();
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setActionBusy(false);
    }
  }

  async function checkIn() {
    if (!selected || actionBusy || checkInNeedsRefresh || checkInInFlight.current) return null;
    checkInInFlight.current = true;
    const bookingId = selected.id;
    setActionBusy(true);
    setError("");
    setCheckInConflict("");
    setCheckInAccepted(false);
    try {
      await checkInBooking(bookingId, checkInData);
      setCheckInAccepted(true);
      const board = await load();
      if (!board) {
        setCheckInNeedsRefresh(true);
        setCheckInConflict(t("reception.checkInRefreshFailed"));
        return null;
      }
      setCheckInAccepted(false);
      resetLifecycleUi();
      return board;
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        const board = await load();
        if (!board) setCheckInNeedsRefresh(true);
        setCheckInStep(2);
        setCheckInConflict(board ? t("reception.checkInConflict") : t("reception.checkInConflictRefreshFailed"));
      } else setError((e as Error).message);
      return null;
    } finally {
      checkInInFlight.current = false;
      setActionBusy(false);
    }
  }

  async function refreshCheckInContext() {
    const board = await load();
    if (board && (!checkInAccepted || board.items.find(item => item.booking.id === selected?.id)?.booking.status === "CheckedIn")) setCheckInNeedsRefresh(false);
    return board;
  }

  async function reassign(event: FormEvent) {
    event.preventDefault();
    if (!selected || actionBusy) return;
    const data = new FormData(event.currentTarget as HTMLFormElement);
    setActionBusy(true);
    setError("");
    try {
      await reassignBooking(selected.id, data.get("room_id"), String(data.get("reason") ?? "").trim());
      setNotice(t("reception.reassignSuccess"));
      closeCase();
      await load();
    } catch (e) {
      setNotice("");
      setError(e instanceof ApiError && e.status === 409 ? t("reception.reassignConflict") : (e as Error).message);
      await loadReassignmentContext(selected);
    } finally {
      setActionBusy(false);
    }
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
    bookings, frontDeskBoard, rooms, guests, availableRooms, editAvailableRooms, reassignAvailableIds, reassignBoard, reassignMaintenanceCase, reassignInvoice, reassignExtraCents, reassignHotelDate, loading, refreshing, error, notice, checkInConflict, checkInNeedsRefresh, checkInAccepted, selected, actionBusy,
    checkInStep, checkInData, form, editForm,
    setCheckInStep, setCheckInData, setForm, setEditForm,
    selectCase, closeCase, refreshQueue: load, refreshCheckInContext, refreshAvailability, submit, checkIn, reassign, checkout, selectReassignDestination,
    saveEdit, cancelBooking,
  };
}
