import { useContext, useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import type { Booking, FrontDeskBoard, Guest, HousekeepingBoard, Invoice, MaintenanceCase, Room } from "../../domain/types";
import { CapabilitiesContext } from "../../app/capabilities";
import {
  cancelBooking as cancelBookingRequest,
  checkInBooking,
  checkoutBooking,
  createReservationOperation,
  loadAvailableRooms,
  loadBooking,
  loadBookingInvoice,
  loadHotelContext,
  loadReceptionBoard,
  loadReceptionRooms,
  loadReceptionGuests,
  loadRecoverableReservationOperations,
  loadReassignmentQuote,
  loadRoomMaintenanceCase,
  reassignBooking,
  updateBooking,
  type ReservationCreationOperation,
} from "./reception-api";
import {
  emptyBookingForm,
  emptyCheckInData,
  type BookingEditForm,
  type BookingForm,
  type CheckInData,
  type ReassignmentQuote,
} from "./model";
import { useI18n } from "../../i18n";
import { ApiError } from "../../api/client";

export function useReceptionWorkspace() {
  const { t } = useI18n();
  const { hotel } = useContext(CapabilitiesContext);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [frontDeskBoard, setFrontDeskBoard] = useState<FrontDeskBoard | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [recoverableOperations, setRecoverableOperations] = useState<ReservationCreationOperation[]>([]);
  const [newGuestMode, setNewGuestMode] = useState(false);
  const [newGuest, setNewGuest] = useState({ full_name: "", email: "", phone: "" });
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [editAvailableRooms, setEditAvailableRooms] = useState<Room[]>([]);
  const [reassignAvailableIds, setReassignAvailableIds] = useState<Set<string>>(new Set());
  const [reassignBoard, setReassignBoard] = useState<HousekeepingBoard | null>(null);
  const [reassignMaintenanceCase, setReassignMaintenanceCase] = useState<MaintenanceCase | null>(null);
  const [reassignHotelDate, setReassignHotelDate] = useState("");
  const [reassignQuote, setReassignQuote] = useState<ReassignmentQuote | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [guestsLoading, setGuestsLoading] = useState(true);
  const [recoveryLoading, setRecoveryLoading] = useState(true);
  const [roomsError, setRoomsError] = useState("");
  const [guestsError, setGuestsError] = useState("");
  const [recoveryError, setRecoveryError] = useState("");
  const [accountSummary, setAccountSummary] = useState<Invoice>(null);
  const [accountLoading, setAccountLoading] = useState(false);
  const [accountError, setAccountError] = useState("");
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
  const roomsEpoch = useRef(0);
  const guestsEpoch = useRef(0);
  const recoveryEpoch = useRef(0);
  const accountEpoch = useRef(0);
  const selectionEpoch = useRef(0);
  const checkInInFlight = useRef(false);
  const reassignQuoteEpoch = useRef(0);
  const reservationOperationToken = useRef(crypto.randomUUID());

  async function loadRooms() {
    const epoch = ++roomsEpoch.current;
    setRoomsLoading(true);
    setRoomsError("");
    try {
      const result = await loadReceptionRooms();
      if (epoch === roomsEpoch.current) setRooms(result);
    } catch (e) {
      if (epoch === roomsEpoch.current) setRoomsError((e as Error).message);
    } finally {
      if (epoch === roomsEpoch.current) setRoomsLoading(false);
    }
  }

  async function loadGuests() {
    const epoch = ++guestsEpoch.current;
    setGuestsLoading(true);
    setGuestsError("");
    try {
      const result = await loadReceptionGuests();
      if (epoch === guestsEpoch.current) setGuests(result);
    } catch (e) {
      if (epoch === guestsEpoch.current) setGuestsError((e as Error).message);
    } finally {
      if (epoch === guestsEpoch.current) setGuestsLoading(false);
    }
  }

  async function loadRecovery() {
    const epoch = ++recoveryEpoch.current;
    setRecoveryLoading(true);
    setRecoveryError("");
    try {
      const result = await loadRecoverableReservationOperations();
      if (epoch === recoveryEpoch.current) setRecoverableOperations(result);
    } catch (e) {
      if (epoch === recoveryEpoch.current) setRecoveryError((e as Error).message);
    } finally {
      if (epoch === recoveryEpoch.current) setRecoveryLoading(false);
    }
  }

  function loadAncillary() {
    void loadRooms();
    void loadGuests();
    void loadRecovery();
  }

  async function loadAccountSummary(bookingId: string) {
    if (!hotel.includes("billing.invoice.read")) {
      setAccountSummary(null);
      setAccountError("");
      setAccountLoading(false);
      return;
    }
    const epoch = ++accountEpoch.current;
    setAccountLoading(true);
    setAccountError("");
    try {
      const result = await loadBookingInvoice(bookingId);
      if (epoch === accountEpoch.current && selected?.id === bookingId) setAccountSummary(result);
    } catch (e) {
      if (epoch === accountEpoch.current && selected?.id === bookingId) setAccountError((e as Error).message);
    } finally {
      if (epoch === accountEpoch.current) setAccountLoading(false);
    }
  }

  async function load() {
    loadAncillary();
    const epoch = ++loadEpoch.current;
    const selectionAtStart = selectionEpoch.current;
    let selectedDetailRefreshFailed = false;
    if (frontDeskBoard) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const board = await loadReceptionBoard();
      if (epoch !== loadEpoch.current) return null;
      const nextBookings = board.items.map(item => item.booking);
      setFrontDeskBoard(board);
      setBookings(nextBookings);
      const selectedId = selectionEpoch.current === selectionAtStart ? selected?.id : undefined;
      if (selectedId) {
        void loadAccountSummary(selectedId);
        const queuedBooking = nextBookings.find(booking => booking.id === selectedId);
        if (queuedBooking) {
          setSelected(current => current?.id === selectedId ? queuedBooking : current);
        } else {
          try {
            const detail = await loadBooking(selectedId);
            if (epoch === loadEpoch.current && selectionEpoch.current === selectionAtStart) setSelected(current => current?.id === selectedId ? detail : current);
          } catch (detailError) {
            if (epoch === loadEpoch.current && selectionEpoch.current === selectionAtStart) {
              if (detailError instanceof ApiError && detailError.status === 404) {
                setSelected(current => current?.id === selectedId ? null : current);
              } else {
                selectedDetailRefreshFailed = true;
                setError((detailError as Error).message);
              }
            }
          }
        }
      }
      if (selectedDetailRefreshFailed) return null;
      return board;
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
    function revalidate() { if (document.visibilityState === "visible" && !actionBusy && (!loading || frontDeskBoard)) void load(); }
    window.addEventListener("focus", revalidate);
    const interval = window.setInterval(revalidate, 30000);
    return () => { window.removeEventListener("focus", revalidate); window.clearInterval(interval); };
  }, [actionBusy, frontDeskBoard, loading]);

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

  useEffect(() => {
    if (selected) void loadAccountSummary(selected.id);
    else { accountEpoch.current += 1; setAccountSummary(null); setAccountLoading(false); setAccountError(""); }
  }, [selected?.id, hotel.join(" ")]);

  function resetLifecycleUi() {
    setCheckInStep(0);
    setCheckInData(emptyCheckInData());
  }

  function closeCase() {
    selectionEpoch.current += 1;
    setSelected(null);
    setEditAvailableRooms([]);
    setReassignAvailableIds(new Set());
    setReassignBoard(null);
    setReassignMaintenanceCase(null);
    setReassignHotelDate("");
    setReassignQuote(null);
    reassignQuoteEpoch.current += 1;
    resetLifecycleUi();
    setCheckInConflict("");
    setCheckInNeedsRefresh(false);
    setCheckInAccepted(false);
  }

  function selectCase(booking: Booking) {
    selectionEpoch.current += 1;
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

  async function restoreCase(bookingId: string): Promise<boolean | null> {
    const epoch = ++selectionEpoch.current;
    const inBoard = frontDeskBoard?.items.find(item => item.booking.id === bookingId)?.booking;
    if (inBoard) {
      selectCase(inBoard);
      return true;
    }
    try {
      const booking = await loadBooking(bookingId);
      if (epoch === selectionEpoch.current) {
        selectCase(booking);
        return true;
      }
      return null;
    } catch (e) {
      if (epoch !== selectionEpoch.current) return null;
      closeCase();
      if (e instanceof ApiError && e.status === 404) return false;
      setError((e as Error).message);
      return true;
    }
  }

  async function loadReassignmentContext(booking: Booking) {
    try {
      const hotelContext = await loadHotelContext();
      const effectiveDate = hotelContext.hotel_local_date > booking.check_in ? hotelContext.hotel_local_date : booking.check_in;
      const available = hotelContext.hotel_local_date < booking.check_out
        ? await loadAvailableRooms(effectiveDate, booking.check_out, booking.id)
        : [];
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
    } catch (e) {
      setReassignAvailableIds(new Set());
      setReassignBoard(null);
      setError((e as Error).message);
    }
  }

  async function selectReassignDestination(roomId: string) {
    const epoch = ++reassignQuoteEpoch.current;
    setReassignMaintenanceCase(null);
    setReassignQuote(null);
    if (!roomId || !selected) return;
    try {
      const [maintenance, quote] = await Promise.all([
        loadRoomMaintenanceCase(roomId).catch(error => {
          if (error instanceof ApiError && error.status === 404) return null;
          throw error;
        }),
        loadReassignmentQuote(selected.id, roomId),
      ]);
      if (epoch !== reassignQuoteEpoch.current) return;
      setReassignMaintenanceCase(maintenance);
      setReassignQuote(quote);
    } catch (e) {
      if (epoch !== reassignQuoteEpoch.current) return;
      setReassignQuote(null);
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
    if (actionBusy) return;
    setActionBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await createReservationOperation({
        operation_token: reservationOperationToken.current,
        ...(newGuestMode
          ? { guest: { full_name: newGuest.full_name, email: newGuest.email, phone: newGuest.phone || null } }
          : { guest_id: form.guest_id }),
        booking: { room_id: form.room_id, check_in: form.check_in, check_out: form.check_out, notes: form.notes },
      });
      if (!result.booking) throw new Error(t("reception.recoveryGuestSaved"));
      reservationOperationToken.current = crypto.randomUUID();
      setNewGuest({ full_name: "", email: "", phone: "" });
      setNewGuestMode(false);
      setRecoverableOperations(current => current.filter(operation => operation.operation_token !== result.operation.operation_token));
      setForm(emptyBookingForm());
      setAvailableRooms([]);
      setNotice(t("reception.reservationCreated"));
      await load();
    } catch (e) {
      if (e instanceof ApiError && e.status === 409 && e.detail && typeof e.detail === "object") {
        const detail = e.detail as { operation?: ReservationCreationOperation; recoveryReason?: string };
        const operation = detail.operation;
        if (operation?.operation_token) setRecoverableOperations(current => [operation, ...current.filter(item => item.operation_token !== operation.operation_token)]);
        if (detail.recoveryReason === "ROOM_UNAVAILABLE") setError(t("reception.recoveryAvailableConflict"));
        else if (detail.recoveryReason === "PAYLOAD_MISMATCH") setError(t("reception.recoveryPayloadConflict"));
        else setError((e as Error).message);
      } else {
        setError((e as Error).message);
      }
    } finally {
      setActionBusy(false);
    }
  }

  function useRecoveredGuest(operation: ReservationCreationOperation) {
    setNewGuestMode(false);
    setForm(current => ({ ...current, guest_id: operation.guest_id, room_id: operation.room_id, check_in: operation.check_in, check_out: operation.check_out }));
    setNewGuest({ full_name: "", email: "", phone: "" });
    reservationOperationToken.current = crypto.randomUUID();
    setError("");
    setNotice(`${operation.guest_name} · ${t("guests.selected")}`);
  }

  async function runLifecycle(action: () => Promise<unknown>) {
    if (actionBusy) return;
    setActionBusy(true);
    try {
      await action();
      closeCase();
      await load();
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        await load();
        setError(t("reception.checkoutConflict"));
      } else setError((e as Error).message);
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
    if (!reassignQuote || reassignQuote.destination_room_id !== data.get("room_id")) {
      setError(t("reception.reassignQuoteLoading"));
      return;
    }
    setActionBusy(true);
    setError("");
    try {
      await reassignBooking(selected.id, data.get("room_id"), String(data.get("reason") ?? "").trim(), reassignQuote.quote_token);
      closeCase();
      await load();
      setNotice(t("reception.reassignSuccess"));
    } catch (e) {
      setNotice("");
      const conflict = e instanceof ApiError && e.status === 409;
      if (conflict) {
        setReassignQuote(null);
        const board = await load();
        const latest = board?.items.find(item => item.booking.id === selected.id)?.booking;
        if (latest?.status === "CheckedIn") {
          await loadReassignmentContext(latest);
          const roomId = String(data.get("room_id") ?? "");
          if (roomId) await selectReassignDestination(roomId);
        }
        // load() clears stale errors while refreshing. Reassert the actionable
        // conflict after authoritative booking/room context has been restored.
        setError(t("reception.reassignConflict"));
      } else setError((e as Error).message);
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
    bookings, frontDeskBoard, rooms, guests, recoverableOperations, roomsLoading, guestsLoading, recoveryLoading, roomsError, guestsError, recoveryError, accountSummary, accountLoading, accountError, newGuestMode, newGuest, availableRooms, editAvailableRooms, reassignAvailableIds, reassignBoard, reassignMaintenanceCase, reassignHotelDate, reassignQuote, loading, refreshing, error, notice, checkInConflict, checkInNeedsRefresh, checkInAccepted, selected, actionBusy,
    checkInStep, checkInData, form, editForm,
    setCheckInStep, setCheckInData, setForm, setEditForm, setNewGuestMode, setNewGuest,
    selectCase, restoreCase, closeCase, refreshQueue: load, retryRooms: loadRooms, retryGuests: loadGuests, retryRecovery: loadRecovery, retryAccountSummary: () => selected ? loadAccountSummary(selected.id) : Promise.resolve(), refreshCheckInContext, refreshAvailability, submit, checkIn, reassign, checkout, selectReassignDestination,
    saveEdit, cancelBooking, useRecoveredGuest,
  };
}
