import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { api } from "../../api/client";
import type { Guest } from "../../domain/types";
import { AsyncState } from "../../components/AsyncState";
import { useI18n } from "../../i18n";

export function GuestsPage() {
  const { t } = useI18n();
  const [guests, setGuests] = useState<Guest[]>([]);
  const [selected, setSelected] = useState<Guest | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [filter, setFilter] = useState("");
  const [form, setForm] = useState({ full_name: "", email: "", phone: "" });

  async function load() {
    setLoading(true);
    setError("");
    try { setGuests(await api<Guest[]>("/guests")); }
    catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setFormError("");
    setSaving(true);
    try {
      await api("/guests", { method: "POST", body: JSON.stringify({ ...form, phone: form.phone || null }) });
      setForm({ full_name: "", email: "", phone: "" });
      await load();
    } catch (e) { setFormError((e as Error).message); }
    finally { setSaving(false); }
  }

  const visible = guests.filter(guest => `${guest.full_name} ${guest.email} ${guest.phone ?? ""}`.toLowerCase().includes(filter.toLowerCase()));

  return <section className="resource-workspace">
    <div className="workspace-heading">
      <div><p className="eyebrow">{t("guests.eyebrow")}</p><h2>{t("guests.title")}</h2><p className="muted">{t("guests.subtitle")}</p></div>
      <span className="case-count">{t("guests.count", { count: guests.length })}</span>
    </div>
    <form className="resource-form guest-form" onSubmit={submit}>
      <div><label>{t("guests.fullName")}<input required value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} placeholder={t("guests.namePlaceholder")} /></label></div>
      <div><label>Email<input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="guest@example.com" /></label></div>
      <div><label>{t("guests.phone")} <span className="optional">({t("common.optional")})</span><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+54 9…" /></label></div>
      <button type="submit" disabled={saving}>{saving ? t("guests.adding") : t("guests.add")}</button>
    </form>
    {formError && <p className="error" role="alert">{formError}</p>}
    <div className="resource-toolbar"><label>{t("guests.search")}<input aria-label={t("guests.search")} value={filter} onChange={e => setFilter(e.target.value)} placeholder={t("guests.searchPlaceholder")} /></label><button type="button" onClick={() => void load()} disabled={loading}>{t("common.refresh")}</button></div>
    {error && <AsyncState kind="error" title={t("guests.loadError")} message={error} onRetry={() => void load()} />}
    {loading && <AsyncState kind="loading" message={t("guests.loading")} />}
    {!loading && !error && visible.length === 0 && <AsyncState kind="empty" title={t(guests.length ? "guests.noMatch" : "guests.none")} message={t(guests.length ? "guests.trySearch" : "guests.addFirst")} />}
    {!loading && !error && visible.length > 0 && <div className="guest-grid" aria-label={t("guests.listAria")}>{visible.map(guest => <button type="button" className={selected?.id === guest.id ? "guest-card selected" : "guest-card"} key={guest.id} onClick={() => setSelected(guest)} aria-pressed={selected?.id === guest.id}><span className="avatar">{guest.full_name.trim().charAt(0).toUpperCase() || "?"}</span><span><strong>{guest.full_name}</strong><small>{guest.email}</small><small>{guest.phone ?? t("common.noPhone")}</small></span><span className="selection-indicator">{selected?.id === guest.id ? t("common.selected") : t("common.view")}</span></button>)}</div>}
    {selected && <div className="guest-detail" aria-live="polite"><div><p className="eyebrow">{t("guests.selected")}</p><h3>{selected.full_name}</h3><p>{selected.email}</p><p>{selected.phone ?? t("common.noPhone")}</p></div><button type="button" className="secondary-button" onClick={() => setSelected(null)}>{t("guests.clear")}</button></div>}
  </section>;
}
