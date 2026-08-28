import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { api } from "../../api/client";

type AdminUser = { access_subject: string; email: string; role: string; active: number; hotel_id: string };

export function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ access_subject: "", email: "", role: "receptionist" });
  const opener = useRef<HTMLButtonElement | null>(null);

  async function load() {
    setLoading(true); setError("");
    try { setUsers(await api<AdminUser[]>("/users")); }
    catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);
  async function create(event: FormEvent) {
    event.preventDefault(); setError(""); setMessage("");
    try { await api("/users", { method: "POST", body: JSON.stringify(form) }); setForm({ access_subject: "", email: "", role: "receptionist" }); setMessage("User membership created"); await load(); }
    catch (e) { setError((e as Error).message); }
  }
  async function changeRole(user: AdminUser, role: string) {
    setError(""); setMessage("");
    try { await api(`/users/${encodeURIComponent(user.access_subject)}/role`, { method: "PATCH", body: JSON.stringify({ role }) }); setMessage("Role updated"); setSelectedUser(current => current?.access_subject === user.access_subject ? { ...current, role } : current); await load(); }
    catch (e) { setError((e as Error).message); }
  }
  async function deactivate(user: AdminUser, trigger?: HTMLButtonElement) {
    if (!window.confirm(`Deactivate ${user.email}?`)) return;
    if (trigger) opener.current = trigger; setError(""); setMessage("");
    try { await api(`/users/${encodeURIComponent(user.access_subject)}`, { method: "DELETE" }); setMessage("Membership deactivated"); setSelectedUser(null); await load(); requestAnimationFrame(() => opener.current?.focus()); }
    catch (e) { setError((e as Error).message); }
  }
  const visible = users.filter(user => `${user.email} ${user.access_subject} ${user.role}`.toLowerCase().includes(search.toLowerCase()));
  const activeCount = users.filter(user => Boolean(user.active)).length;
  return <section className="admin-surface">
    <div className="workspace-heading"><div><p className="eyebrow">Security</p><h2>Users administration</h2><p className="muted">Cloudflare Access identities and hotel memberships</p></div><span className="case-count">{activeCount} active · {users.length - activeCount} inactive</span></div>
    <form className="admin-create" onSubmit={create}><h3>Create membership</h3><div className="form-field"><label htmlFor="user-subject">Access subject</label><input id="user-subject" required placeholder="Access subject" value={form.access_subject} onChange={e => setForm({ ...form, access_subject: e.target.value })} /></div><div className="form-field"><label htmlFor="user-email">Email</label><input id="user-email" required type="email" placeholder="name@hotel.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div><div className="form-field"><label htmlFor="user-role">Role</label><select id="user-role" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}><option value="admin">Admin</option><option value="receptionist">Receptionist</option><option value="ops">Operations</option><option value="housekeeping">Housekeeping</option></select></div><button type="submit">Create user</button></form>
    <label className="admin-search">Search users <input aria-label="Search users" value={search} onChange={e => setSearch(e.target.value)} placeholder="Email, identity or role" /></label>
    {message && <p className="success" role="status">{message}</p>}{error && <div className="error-row"><p className="error" role="alert">{error}</p><button type="button" onClick={() => void load()}>Retry</button></div>}
    {loading ? <p className="muted loading-state" role="status">Loading users…</p> : visible.length === 0 ? <div className="empty-state"><h3>{users.length ? "No users match this search" : "No memberships yet"}</h3><p className="muted">{users.length ? "Try another email, identity or role." : "Create the first hotel membership above."}</p></div> : <div className="cards admin-user-list">{visible.map(user => <article className="admin-user-card" key={user.access_subject}><div className="admin-user-main"><strong>{user.email}</strong><small>{user.access_subject}</small><span className={user.active ? "status-badge active" : "status-badge inactive"}>{user.active ? "Active" : "Inactive"} · {user.role}</span></div><div className="card-actions"><button type="button" onClick={e => { opener.current=e.currentTarget; setSelectedUser(user); }}>View details</button>{user.active ? <button type="button" className="button-secondary" onClick={e => void deactivate(user, e.currentTarget)}>Deactivate</button> : null}</div></article>)}</div>}
    {selectedUser && <article className="admin-user-detail" role="dialog" aria-modal="true" aria-labelledby="user-detail-title"><h3 id="user-detail-title">User details</h3><strong>{selectedUser.email}</strong><small>{selectedUser.access_subject}</small><label>Role <select aria-label={`Role for ${selectedUser.email}`} value={selectedUser.role} disabled={!selectedUser.active} onChange={e => void changeRole(selectedUser, e.target.value)}><option value="admin">Admin</option><option value="ops">Operations</option><option value="receptionist">Receptionist</option><option value="housekeeping">Housekeeping</option></select></label>{selectedUser.active && <button type="button" onClick={e => void deactivate(selectedUser, e.currentTarget)}>Deactivate user</button>}<button type="button" className="button-secondary" onClick={() => { setSelectedUser(null); requestAnimationFrame(() => opener.current?.focus()); }}>Close details</button></article>}
  </section>;
}
