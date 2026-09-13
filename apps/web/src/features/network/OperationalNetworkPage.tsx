import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { api } from "../../api/client";
import { useI18n } from "../../i18n";
import "./network-operational.css";

type AdminHotel = {
  id: string;
  slug: string;
  name: string;
  address: string | null;
  plan_tier: string;
  operational_binding: string;
  active: number;
};

type NetworkHotelMetric = {
  hotel_id: string;
  hotel_name: string;
  plan_tier: string;
  revenue_cents: number;
  active_bookings_count: number;
  occupancy_rate: number;
  adr_cents: number;
  rev_par_cents: number;
};

type NetworkKpis = {
  start: string;
  end: string;
  total_hotels: number;
  total_active_bookings: number;
  total_revenue_cents: number;
  average_occupancy_rate: number;
  hotels: NetworkHotelMetric[];
};

type DateRange = { start: string; end: string };
type RangePreset = "week" | "month30" | "currentMonth";
type PlanFilter = "ALL" | "BASIC" | "PRO" | "ENTERPRISE";

const configuredBindings = ["HOTEL_DEMO_DB", "HOTEL_SECOND_DB"] as const;

function dateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function daysAgo(days: number): string {
  const value = new Date();
  value.setHours(12, 0, 0, 0);
  value.setDate(value.getDate() - days);
  return dateKey(value);
}

function presetRanges(): Record<RangePreset, DateRange> {
  const today = new Date();
  return {
    week: { start: daysAgo(6), end: dateKey(today) },
    month30: { start: daysAgo(29), end: dateKey(today) },
    currentMonth: {
      start: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`,
      end: dateKey(today),
    },
  };
}

export function NetworkPage() {
  const { t, planLabel, formatCurrency, formatPercent, formatDate } = useI18n();
  const presets = presetRanges();
  const [hotels, setHotels] = useState<AdminHotel[]>([]);
  const [selected, setSelected] = useState<AdminHotel | null>(null);
  const [kpis, setKpis] = useState<NetworkKpis | null>(null);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState<PlanFilter>("ALL");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [range, setRange] = useState<DateRange>(presets.currentMonth);
  const [form, setForm] = useState({ id: "", slug: "", name: "", operational_binding: "HOTEL_SECOND_DB", plan_tier: "BASIC" });

  async function load() {
    setLoading(true);
    setError("");
    try {
      const next = await api<AdminHotel[]>("/hotels");
      setHotels(next);
      setSelected(current => current ? next.find(hotel => hotel.id === current.id) ?? null : null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function loadKpis(nextRange: DateRange = range) {
    if (nextRange.end < nextRange.start) {
      setError(t("network.invalidRange"));
      return;
    }
    setAnalyticsLoading(true);
    setError("");
    try {
      const next = await api<NetworkKpis>(`/hotels/network-kpis?start=${nextRange.start}&end=${nextRange.end}`);
      setKpis(next);
      setRange(nextRange);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setAnalyticsLoading(false);
    }
  }

  useEffect(() => {
    void load();
    void loadKpis(presets.currentMonth);
  }, []);

  async function register(event: FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");
    setSaving(true);
    try {
      await api("/hotels", { method: "POST", body: JSON.stringify(form) });
      setMessage(t("network.propertyRegistered"));
      setForm({ id: "", slug: "", name: "", operational_binding: "HOTEL_SECOND_DB", plan_tier: "BASIC" });
      setRegisterOpen(false);
      await load();
      await loadKpis();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function updatePlan(planTier: string) {
    if (!selected || planTier === selected.plan_tier) return;
    const hotelId = selected.id;
    const authoritative = hotels.find(hotel => hotel.id === hotelId) ?? selected;
    setSelected({ ...selected, plan_tier: planTier });
    setError("");
    setMessage("");
    setSaving(true);
    try {
      await api(`/hotels/${hotelId}/plan`, { method: "PATCH", body: JSON.stringify({ plan_tier: planTier }) });
      setMessage(t("network.planUpdated"));
      await load();
      await loadKpis();
    } catch (e) {
      setSelected(authoritative);
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  function applyPreset(preset: RangePreset) {
    const next = presetRanges()[preset];
    setRange(next);
    void loadKpis(next);
  }

  const metricsByHotel = useMemo(() => new Map((kpis?.hotels ?? []).map(row => [row.hotel_id, row])), [kpis]);
  const usedBindings = new Set(hotels.map(hotel => hotel.operational_binding));
  const freeBindings = configuredBindings.filter(binding => !usedBindings.has(binding));
  const activePreset = (Object.entries(presets) as Array<[RangePreset, DateRange]>).find(([, value]) => value.start === range.start && value.end === range.end)?.[0];
  const normalizedSearch = search.trim().toLowerCase();
  const visible = hotels
    .filter(hotel => (planFilter === "ALL" || hotel.plan_tier === planFilter) && `${hotel.name} ${hotel.slug} ${hotel.id} ${hotel.operational_binding}`.toLowerCase().includes(normalizedSearch))
    .sort((left, right) => (metricsByHotel.get(right.id)?.revenue_cents ?? -1) - (metricsByHotel.get(left.id)?.revenue_cents ?? -1) || (left.name || left.slug).localeCompare(right.name || right.slug));
  const countPlan = (plan: PlanFilter) => plan === "ALL" ? hotels.length : hotels.filter(hotel => hotel.plan_tier === plan).length;
  const selectedMetric = selected ? metricsByHotel.get(selected.id) : undefined;

  function openRegistration() {
    if (!freeBindings.length) return;
    setForm(current => ({ ...current, operational_binding: freeBindings[0] }));
    setRegisterOpen(true);
  }

  return <section className="admin-surface network-operational">
    <div className="workspace-heading">
      <div><p className="eyebrow">{t("network.eyebrow")}</p><h2>{t("network.title")}</h2><p className="muted">{t("network.subtitle")}</p></div>
      <div className="network-heading-actions"><span className="case-count">{t("network.properties", { count: hotels.length })}</span><button type="button" disabled={!freeBindings.length || registerOpen} onClick={openRegistration}>{t("network.registerProperty")}</button></div>
    </div>

    {registerOpen && <form className="admin-create network-registration" onSubmit={register}>
      <div className="network-registration-heading"><h3>{t("network.registerProperty")}</h3><button type="button" className="button-secondary" onClick={() => setRegisterOpen(false)}>{t("common.close")}</button></div>
      <div className="form-field"><label htmlFor="hotel-id">{t("network.propertyId")}</label><input id="hotel-id" required value={form.id} onChange={e => setForm({ ...form, id: e.target.value })} /></div>
      <div className="form-field"><label htmlFor="hotel-slug">{t("network.slug")}</label><input id="hotel-slug" required value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} /></div>
      <div className="form-field"><label htmlFor="hotel-name">{t("network.name")}</label><input id="hotel-name" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
      <div className="form-field"><label htmlFor="hotel-binding">{t("network.binding")}</label><select id="hotel-binding" value={form.operational_binding} onChange={e => setForm({ ...form, operational_binding: e.target.value })}>{configuredBindings.map(binding => <option key={binding} value={binding} disabled={usedBindings.has(binding)}>{binding}{usedBindings.has(binding) ? ` (${t("common.assigned")})` : ""}</option>)}</select></div>
      <button type="submit" disabled={saving || !freeBindings.length}>{saving ? t("common.saving") : t("network.register")}</button>
    </form>}

    <div className="network-preset-bar" role="group" aria-label={t("network.quickRanges")}>
      <button type="button" className={activePreset === "week" ? "selected" : ""} aria-pressed={activePreset === "week"} onClick={() => applyPreset("week")}>{t("network.last7")}</button>
      <button type="button" className={activePreset === "month30" ? "selected" : ""} aria-pressed={activePreset === "month30"} onClick={() => applyPreset("month30")}>{t("network.last30")}</button>
      <button type="button" className={activePreset === "currentMonth" ? "selected" : ""} aria-pressed={activePreset === "currentMonth"} onClick={() => applyPreset("currentMonth")}>{t("network.currentMonth")}</button>
    </div>
    <div className="report-controls"><div className="date-range"><label>{t("common.start")} <input aria-label={t("network.reportStartAria")} type="date" value={range.start} disabled={analyticsLoading} onChange={e => setRange({ ...range, start: e.target.value })} /></label><label>{t("common.end")} <input aria-label={t("network.reportEndAria")} type="date" value={range.end} disabled={analyticsLoading} onChange={e => setRange({ ...range, end: e.target.value })} /></label></div><button type="button" disabled={analyticsLoading} onClick={() => void loadKpis()}>{analyticsLoading ? t("network.loadingAnalytics") : t("network.refreshAnalytics")}</button></div>
    <p className="muted" aria-live="polite">{t("network.rangeSummary", { start: formatDate(range.start), end: formatDate(range.end) })}</p>

    {message && <p className="success" role="status">{message}</p>}
    {error && <div className="error-row"><p className="error" role="alert">{error}</p><button type="button" onClick={() => { void load(); void loadKpis(); }}>{t("network.retry")}</button></div>}
    {loading ? <p className="muted loading-state" role="status">{t("network.loading")}</p> : <>
      <div className="kpi-grid">{kpis ? <><article><strong>{t("network.totalHotels")}</strong><span>{kpis.total_hotels}</span></article><article><strong>{t("network.revenue")}</strong><span>{formatCurrency(kpis.total_revenue_cents)}</span></article><article><strong>{t("network.activeBookings")}</strong><span>{kpis.total_active_bookings}</span></article><article><strong>{t("network.occupancy")}</strong><span>{formatPercent(kpis.average_occupancy_rate)}</span></article></> : <p className="muted">{t("network.analyticsUnavailable")}</p>}</div>

      <div className="network-tools">
        <label className="admin-search">{t("network.filter")} <input aria-label={t("network.filter")} value={search} onChange={e => setSearch(e.target.value)} placeholder={t("network.filterPlaceholder")} /></label>
        <div className="network-plan-filters" role="group" aria-label={t("network.planFilters")}>
          {(["ALL", "BASIC", "PRO", "ENTERPRISE"] as PlanFilter[]).map(plan => <button type="button" key={plan} className={planFilter === plan ? "selected" : ""} aria-pressed={planFilter === plan} onClick={() => setPlanFilter(plan)}>{plan === "ALL" ? t("network.allPlans") : planLabel(plan)} <span>{countPlan(plan)}</span></button>)}
        </div>
      </div>

      {visible.length === 0 ? <div className="empty-state"><h3>{t(hotels.length ? "network.noMatch" : "network.none")}</h3><p className="muted">{t("network.adjust")}</p></div> : <div className="admin-network-layout network-operational-layout">
        <div className="network-property-list">{visible.map(hotel => {
          const metric = metricsByHotel.get(hotel.id);
          return <button type="button" className={selected?.id === hotel.id ? "network-row network-property-row selected" : "network-row network-property-row"} key={hotel.id} onClick={() => setSelected(hotel)}>
            <span className="network-property-main"><strong>{hotel.name || hotel.slug}</strong><span>{hotel.slug} · {planLabel(hotel.plan_tier)} · {hotel.active ? t("common.active") : t("common.inactive")}</span><small>{hotel.operational_binding}</small></span>
            <span className="network-property-metrics"><span><small>{t("network.revenue")}</small><strong>{metric ? formatCurrency(metric.revenue_cents) : "—"}</strong></span><span><small>{t("network.occupancy")}</small><strong>{metric ? formatPercent(metric.occupancy_rate) : "—"}</strong></span><span><small>{t("network.activeBookings")}</small><strong>{metric?.active_bookings_count ?? "—"}</strong></span></span>
          </button>;
        })}</div>

        {selected ? <article className="network-detail network-property-detail">
          <div className="network-detail-heading"><div><p className="eyebrow">{t("network.propertyDetail")}</p><h3>{selected.name || selected.slug}</h3><small>{selected.slug} · {selected.operational_binding}</small></div><button type="button" className="button-secondary" onClick={() => setSelected(null)}>{t("network.closeProperty")}</button></div>
          <div className="network-detail-meta"><span className={selected.active ? "status-badge active" : "status-badge inactive"}>{t(selected.active ? "common.active" : "common.inactive")}</span><span>{selected.address || t("common.noAddress")}</span></div>
          <label>{t("network.plan")} <select aria-label={t("network.propertyPlanAria")} value={selected.plan_tier} disabled={saving} onChange={e => void updatePlan(e.target.value)}><option value="BASIC">{planLabel("BASIC")}</option><option value="PRO">{planLabel("PRO")}</option><option value="ENTERPRISE">{planLabel("ENTERPRISE")}</option></select></label>
          {selectedMetric ? <div className="network-metric-grid"><div><small>{t("network.revenue")}</small><strong>{formatCurrency(selectedMetric.revenue_cents)}</strong></div><div><small>{t("network.occupancy")}</small><strong>{formatPercent(selectedMetric.occupancy_rate)}</strong></div><div><small>{t("network.adr")}</small><strong>{formatCurrency(selectedMetric.adr_cents)}</strong></div><div><small>{t("network.revPar")}</small><strong>{formatCurrency(selectedMetric.rev_par_cents)}</strong></div><div><small>{t("network.activeBookings")}</small><strong>{selectedMetric.active_bookings_count}</strong></div></div> : <p className="muted">{t("network.noPropertyAnalytics")}</p>}
        </article> : <div className="network-detail users-empty-detail"><p className="muted">{t("network.selectProperty")}</p></div>}
      </div>}

      {kpis && <div className="cards revenue-ranking network-ranking"><h3>{t("network.revenueRanking")}</h3>{kpis.hotels.map((row, index) => <article key={row.hotel_id}><span className="network-ranking-rank">#{index + 1}</span><strong>{row.hotel_name || row.hotel_id}</strong><span>{formatCurrency(row.revenue_cents)} · {formatPercent(row.occupancy_rate)} · ADR {formatCurrency(row.adr_cents)}</span></article>)}</div>}
    </>}
  </section>;
}
