import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { api } from "../../api/client";
import type { Booking, Guest } from "../../domain/types";
import { AsyncState } from "../../components/AsyncState";
import { useI18n } from "../../i18n";
import "./guests-operational.css";

type GuestFilter = "all" | "active" | "arrivals" | "upcoming";
type GuestContext = { booking: Booking | null; kind: "active" | "arrival-due" | "upcoming" | "history" | "none" };

function todayKey() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function normalizedStatus(status: string) {
  return status.replace(/[\s_-]/g, "").toLowerCase();
}

function bookingsForGuest(guestId: string, bookings: Booking[]) {
  return bookings.filter(booking => booking.guest_id === guestId).sort((left, right) => right.check_in.localeCompare(left.check_in));
}

function guestContext(guestId: string, bookings: Booking[]): GuestContext {
  const today = todayKey();
  const guestBookings = bookingsForGuest(guestId, bookings);
  const active = guestBookings.find(booking => normalizedStatus(booking.status) === "checkedin");
  if (active) return { booking: active, kind: "active" };
  const arrivalDue = guestBookings
    .filter(booking => normalizedStatus(booking.status) === "confirmed" && booking.check_in <= today)
    .sort((left, right) => left.check_in.localeCompare(right.check_in))[0];
  if (arrivalDue) return { booking: arrivalDue, kind: "arrival-due" };
  const upcoming = guestBookings
    .filter(booking => normalizedStatus(booking.status) === "confirmed" && booking.check_in > today)
    .sort((left, right) => left.check_in.localeCompare(right.check_in))[0];
  if (upcoming) return { booking: upcoming, kind: "upcoming" };
  const history = guestBookings.find(booking => normalizedStatus(booking.status) === "checkedout");
  if (history) return { booking: history, kind: "history" };
  return { booking: null, kind: "none" };
}

export function GuestsPage() {
  const { t, statusLabel, formatDate } = useI18n();
  const [guests, setGuests] = useState<Guest[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selected, setSelected] = useState<Guest | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [filter, setFilter] = useState("");
  const [guestFilter, setGuestFilter] = useState<GuestFilter>("all");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", phone: "" });

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [guestResult, bookingResult] = await Promise.allSettled([
        api<Guest[]>("/guests"),
        api<Booking[]>("/bookings?limit=100"),
      ]);
      if (guestResult.status === "rejected") throw guestResult.reason;
      setGuests(guestResult.value);
      setBookings(bookingResult.status === "fulfilled" ? bookingResult.value : []);
      if (selected) setSelected(guestResult.value.find(guest => guest.id === selected.id) ?? null);
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setFormError("");
    setSaving(true);
    try {
      const created = await api<Guest>("/guests", { method: "POST", body: JSON.stringify({ ...form, phone: form.phone || null }) });
      setForm({ full_name: "", email: "", phone: "" });
      setShowCreate(false);
      await load();
      setSelected(created);
    } catch (e) { setFormError((e as Error).message); }
    finally { setSaving(false); }
  }

  const guestRows = guests.map(guest => ({ guest, context: guestContext(guest.id, bookings) }));
  const counts = {
    all: guestRows.length,
    active: guestRows.filter(item => item.context.kind === "active").length,
    arrivals: guestRows.filter(item => item.context.kind === "arrival-due").length,
    upcoming: guestRows.filter(item => item.context.kind === "upcoming").length,
  };
  const query = filter.trim().toLocaleLowerCase();
  const visible = guestRows.filter(({ guest, context }) => {
    const matchesFilter = guestFilter === "all" || context.kind === guestFilter || (guestFilter === "arrivals" && context.kind === "arrival-due");
    const searchable = `${guest.full_name} ${guest.email} ${guest.phone ?? ""} ${context.booking?.room_number ?? ""} ${context.booking?.status ?? ""}`.toLocaleLowerCase();
    return matchesFilter && searchable.includes(query);
  });
  const selectedContext = selected ? guestContext(selected.id, bookings) : null;
  const selectedBookings = selected ? bookingsForGuest(selected.id, bookings).slice(0, 5) : [];

  function contextLabel(context: GuestContext) {
    if (context.kind === "active") return t("guests.contextActive");
    if (context.kind === "arrival-due") return t("guests.contextArrivalDue");
    if (context.kind === "upcoming") return t("guests.contextUpcoming");
    if (context.kind === "history") return t("guests.contextHistory");
    return t("guests.contextNone");
  }

  return <section className="resource-workspace guests-operational-workspace">
    <div className="workspace-heading guests-heading">
      <div><p className="eyebrow">{t("guests.eyebrow")}</p><h2>{t("guests.title")}</h2><p className="muted">{t("guests.operationalSubtitle")}</p></div>
      <div className="guests-heading-actions"><span className="case-count">{t("guests.count", { count: guests.length })}</span><button type="button" className="secondary-button" onClick={() => setShowCreate(current => !current)}>{showCreate ? t("common.close") : t("guests.add")}</button></div>
    </div>

    <div className="guests-status-filters" role="group" aria-label={t("guests.filtersAria")}>
      {(["all", "active", "arrivals", "upcoming"] as GuestFilter[]).map(value => <button type="button" key={value} className={guestFilter === value ? "selected" : ""} aria-pressed={guestFilter === value} onClick={() => setGuestFilter(value)}><strong>{counts[value]}</strong><span>{t(value === "all" ? "guests.filterAll" : value === "active" ? "guests.filterActive" : value === "arrivals" ? "guests.filterArrivals" : "guests.filterUpcoming")}</span></button>)}
    </div>

    {showCreate && <form className="resource-form guest-form guests-create-form" onSubmit={submit}>
      <div><label>{t("guests.fullName")}<input required value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} placeholder={t("guests.namePlaceholder")} /></label></div>
      <div><label>Email<input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="guest@example.com" /></label></div>
      <div><label>{t("guests.phone")} <span className="optional">({t("common.optional")})</span><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+54 9…" /></label></div>
      <button type="submit" disabled={saving}>{saving ? t("guests.adding") : t("guests.add")}</button>
    </form>}
    {formError && <p className="error" role="alert">{formError}</p>}
    <div className="resource-toolbar"><label>{t("guests.search")}<input aria-label={t("guests.search")} value={filter} onChange={e => setFilter(e.target.value)} placeholder={t("guests.operationalSearchPlaceholder")} /></label><button type="button" onClick={() => void load()} disabled={loading}>{t("common.refresh")}</button></div>
    {error && <AsyncState kind="error" title={t("guests.loadError")} message={error} onRetry={() => void load()} />}
    {loading && <AsyncState kind="loading" message={t("guests.loading")} />}
    {!loading && !error && visible.length === 0 && <AsyncState kind="empty" title={t(guests.length ? "guests.noMatch" : "guests.none")} message={t(guests.length ? "guests.trySearch" : "guests.addFirst")} />}

    {!loading && !error && visible.length > 0 && <div className="guest-operational-layout">
      <div className="guest-grid guest-operational-list" aria-label={t("guests.listAria")}>{visible.map(({ guest, context }) => <button type="button" className={selected?.id === guest.id ? "guest-card guest-operational-card selected" : "guest-card guest-operational-card"} key={guest.id} onClick={() => setSelected(guest)} aria-pressed={selected?.id === guest.id}>
        <span className="avatar">{guest.full_name.trim().charAt(0).toUpperCase() || "?"}</span>
        <span className="guest-card-main"><strong>{guest.full_name}</strong><small>{guest.email}</small><small>{context.booking ? `${t("common.room")} ${context.booking.room_number} · ${contextLabel(context)}` : contextLabel(context)}</small></span>
        <span className={`guest-context-badge context-${context.kind}`}>{contextLabel(context)}</span>
      </button>)}</div>

      <aside className="guest-detail guest-operational-detail" aria-live="polite">
        {!selected ? <div><p className="eyebrow">{t("guests.selected")}</p><h3>{t("guests.selectGuest")}</h3><p className="muted">{t("guests.selectHint")}</p></div> : <>
          <div className="guest-detail-heading"><div><p className="eyebrow">{t("guests.selected")}</p><h3>{selected.full_name}</h3><p>{selected.email}</p><p>{selected.phone ?? t("common.noPhone")}</p></div><button type="button" className="secondary-button" onClick={() => setSelected(null)}>{t("guests.clear")}</button></div>
          {selectedContext && <div className="guest-current-stay"><span>{t("guests.currentSituation")}</span><strong>{contextLabel(selectedContext)}</strong>{selectedContext.booking && <p>{t("common.room")} {selectedContext.booking.room_number} · {formatDate(selectedContext.booking.check_in)} → {formatDate(selectedContext.booking.check_out)}</p>}</div>}
          <div className="guest-stay-history"><h4>{t("guests.recentStays")}</h4>{selectedBookings.length === 0 ? <p className="muted">{t("guests.noStays")}</p> : selectedBookings.map(booking => <div className="guest-stay-row" key={booking.id}><div><strong>{t("common.room")} {booking.room_number}</strong><span>{formatDate(booking.check_in)} → {formatDate(booking.check_out)}</span></div><span>{statusLabel(booking.status)}</span></div>)}</div>
        </>}
      </aside>
    </div>}
  </section>;
}
