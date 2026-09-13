import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { api } from "../../api/client";
import { useI18n } from "../../i18n";
import "./users-operational.css";

type AdminUser = { access_subject: string; email: string; role: string; active: number; hotel_id: string };
type UserFilter = "active" | "inactive" | "admin" | "receptionist" | "ops" | "housekeeping";

export function UsersPage() {
  const { t, roleLabel } = useI18n();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<UserFilter>("active");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ access_subject: "", email: "", role: "receptionist" });
  const opener = useRef<HTMLButtonElement | null>(null);

  async function load() {
    setLoading(true); setError("");
    try {
      const next = await api<AdminUser[]>("/users");
      setUsers(next);
      setSelectedUser(current => current ? next.find(user => user.access_subject === current.access_subject) ?? null : null);
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);

  async function create(event: FormEvent) {
    event.preventDefault(); setError(""); setMessage(""); setSaving(true);
    try {
      await api("/users", { method: "POST", body: JSON.stringify(form) });
      setForm({ access_subject: "", email: "", role: "receptionist" });
      setCreateOpen(false); setMessage(t("users.membershipCreated")); await load();
    } catch (e) { setError((e as Error).message); }
    finally { setSaving(false); }
  }
  async function changeRole(user: AdminUser, role: string) {
    if (role === user.role) return;
    setError(""); setMessage(""); setSaving(true);
    try {
      await api(`/users/${encodeURIComponent(user.access_subject)}/role`, { method: "PATCH", body: JSON.stringify({ role }) });
      setMessage(t("users.roleUpdated")); setSelectedUser(current => current?.access_subject === user.access_subject ? { ...current, role } : current); await load();
    } catch (e) { setError((e as Error).message); await load(); }
    finally { setSaving(false); }
  }
  async function deactivate(user: AdminUser) {
    if (!window.confirm(t("users.deactivateConfirm", { email: user.email }))) return;
    setError(""); setMessage(""); setSaving(true);
    try {
      await api(`/users/${encodeURIComponent(user.access_subject)}`, { method: "DELETE" });
      setMessage(t("users.membershipDeactivated")); setSelectedUser(null); await load(); requestAnimationFrame(() => opener.current?.focus());
    } catch (e) { setError((e as Error).message); }
    finally { setSaving(false); }
  }

  const activeCount = users.filter(user => Boolean(user.active)).length;
  const countFor = (value: UserFilter) => users.filter(user => value === "active" ? Boolean(user.active) : value === "inactive" ? !user.active : user.role === value).length;
  const normalizedSearch = search.trim().toLowerCase();
  const visible = users.filter(user => {
    const filterMatch = filter === "active" ? Boolean(user.active) : filter === "inactive" ? !user.active : user.role === filter;
    return filterMatch && `${user.email} ${user.access_subject} ${user.role}`.toLowerCase().includes(normalizedSearch);
  });
  const filters: UserFilter[] = ["active", "inactive", "admin", "receptionist", "ops", "housekeeping"];

  function selectUser(user: AdminUser, trigger: HTMLButtonElement) { opener.current = trigger; setSelectedUser(user); }
  function closeDetails() { setSelectedUser(null); requestAnimationFrame(() => opener.current?.focus()); }

  return <section className="admin-surface users-operational">
    <div className="workspace-heading"><div><p className="eyebrow">{t("users.security")}</p><h2>{t("users.title")}</h2><p className="muted">{t("users.subtitle")}</p></div><div className="workspace-heading-actions"><span className="case-count">{t("users.count", { active: activeCount, inactive: users.length - activeCount })}</span>{!createOpen && <button type="button" onClick={() => setCreateOpen(true)}>{t("users.createMembership")}</button>}</div></div>
    {createOpen && <form className="admin-create users-create" onSubmit={create}><div className="users-create-heading"><h3>{t("users.createMembership")}</h3><button type="button" className="button-secondary" onClick={() => setCreateOpen(false)}>{t("common.close")}</button></div><div className="form-field"><label htmlFor="user-subject">{t("users.accessSubject")}</label><input id="user-subject" required placeholder={t("users.accessSubject")} value={form.access_subject} onChange={e => setForm({ ...form, access_subject: e.target.value })} /></div><div className="form-field"><label htmlFor="user-email">Email</label><input id="user-email" required type="email" placeholder="name@hotel.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div><div className="form-field"><label htmlFor="user-role">{t("users.role")}</label><select id="user-role" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}><option value="admin">{roleLabel("admin")}</option><option value="receptionist">{roleLabel("receptionist")}</option><option value="ops">{roleLabel("ops")}</option><option value="housekeeping">{roleLabel("housekeeping")}</option></select></div><button type="submit" disabled={saving}>{saving ? t("common.saving") : t("users.create")}</button></form>}
    <div className="users-toolbar"><label className="admin-search">{t("users.search")} <input aria-label={t("users.search")} value={search} onChange={e => setSearch(e.target.value)} placeholder={t("users.searchPlaceholder")} /></label><button type="button" className="button-secondary" onClick={() => void load()} disabled={loading}>{t("common.refresh")}</button></div>
    <div className="users-filters" role="group" aria-label={t("users.title")}>{filters.map(value => <button type="button" key={value} className={filter === value ? "selected" : ""} aria-pressed={filter === value} onClick={() => setFilter(value)}>{value === "active" ? t("common.active") : value === "inactive" ? t("common.inactive") : roleLabel(value)} <span>{countFor(value)}</span></button>)}</div>
    {message && <p className="success" role="status">{message}</p>}{error && <div className="error-row"><p className="error" role="alert">{error}</p><button type="button" onClick={() => void load()}>{t("users.retry")}</button></div>}
    {loading ? <p className="muted loading-state" role="status">{t("users.loading")}</p> : visible.length === 0 ? <div className="empty-state"><h3>{t(users.length ? "users.noMatch" : "users.none")}</h3><p className="muted">{t(users.length ? "users.trySearch" : "users.createFirst")}</p></div> : <div className="admin-network-layout users-layout"><div className="cards admin-user-list">{visible.map(user => <article className={selectedUser?.access_subject === user.access_subject ? "admin-user-card selected" : "admin-user-card"} key={user.access_subject}><div className="admin-user-main"><strong>{user.email}</strong><small>{user.access_subject}</small><span className={user.active ? "status-badge active" : "status-badge inactive"}>{t(user.active ? "common.active" : "common.inactive")} · {roleLabel(user.role)}</span></div><button type="button" className="button-secondary" onClick={e => selectUser(user, e.currentTarget)}>{t("users.viewDetails")}</button></article>)}</div>{selectedUser ? <article className="admin-user-detail" role="region" aria-labelledby="user-detail-title"><div className="users-detail-heading"><div><h3 id="user-detail-title">{t("users.details")}</h3><strong>{selectedUser.email}</strong><small>{selectedUser.access_subject}</small></div><button type="button" className="button-secondary" onClick={closeDetails}>{t("users.closeDetails")}</button></div><span className={selectedUser.active ? "status-badge active" : "status-badge inactive"}>{t(selectedUser.active ? "common.active" : "common.inactive")} · {roleLabel(selectedUser.role)}</span><label>{t("users.role")} <select aria-label={t("users.roleFor", { email: selectedUser.email })} value={selectedUser.role} disabled={!selectedUser.active || saving} onChange={e => void changeRole(selectedUser, e.target.value)}><option value="admin">{roleLabel("admin")}</option><option value="ops">{roleLabel("ops")}</option><option value="receptionist">{roleLabel("receptionist")}</option><option value="housekeeping">{roleLabel("housekeeping")}</option></select></label>{selectedUser.active && <button type="button" className="danger-button" disabled={saving} onClick={() => void deactivate(selectedUser)}>{t("users.deactivateUser")}</button>}</article> : <div className="users-empty-detail"><p className="muted">{t("common.noAdditionalContext")}</p></div>}</div>}
  </section>;
}
