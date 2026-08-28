export type LocalDevProfile = { label: string; subject: string; email: string; hotelId: string };

export const localAcceptanceEnabled = import.meta.env.DEV && import.meta.env.VITE_LOCAL_ACCEPTANCE_AUTH === "true";
export const localDevProfiles: LocalDevProfile[] = localAcceptanceEnabled ? [
  { label: "Hotel Norte · Admin / Network", subject: "source-user:14000000-0000-0000-0000-000000000001", email: "ana-admin@migration.invalid", hotelId: "10000000-0000-0000-0000-000000000001" },
  { label: "Hotel Norte · Reception", subject: "source-user:14000000-0000-0000-0000-000000000002", email: "leo-reception@migration.invalid", hotelId: "10000000-0000-0000-0000-000000000001" },
  { label: "Hotel Sur · Operations", subject: "source-user:24000000-0000-0000-0000-000000000001", email: "sol-ops@migration.invalid", hotelId: "20000000-0000-0000-0000-000000000002" },
  { label: "Hotel Sur · Housekeeping", subject: "source-user:24000000-0000-0000-0000-000000000002", email: "max-housekeeping@migration.invalid", hotelId: "20000000-0000-0000-0000-000000000002" },
  { label: "Network · SaaS Admin", subject: "source-user:14000000-0000-0000-0000-000000000003", email: "saas-admin@migration.invalid", hotelId: "10000000-0000-0000-0000-000000000001" },
] : [];

const initialLocalProfileIndex = typeof window === "undefined" ? 0 : Number(window.localStorage.getItem("hms-local-acceptance-profile") ?? 0);
let activeLocalDevProfile = localDevProfiles[initialLocalProfileIndex] ?? localDevProfiles[0];

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) { super(message); this.name = "ApiError"; this.status = status; }
}

export function getActiveLocalProfileIndex() {
  return Math.max(0, localDevProfiles.indexOf(activeLocalDevProfile));
}
export function setActiveLocalProfileIndex(index: number) {
  activeLocalDevProfile = localDevProfiles[index] ?? localDevProfiles[0];
  window.localStorage.setItem("hms-local-acceptance-profile", String(index));
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("content-type", "application/json");
  if (activeLocalDevProfile) {
    headers.set("x-local-access-subject", activeLocalDevProfile.subject);
    headers.set("x-local-access-email", activeLocalDevProfile.email);
    headers.set("x-hotel-id", activeLocalDevProfile.hotelId);
  }
  const response = await fetch(`/api/v1${path}`, { ...init, headers });
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { error?: { message?: string } } | null;
    throw new ApiError(payload?.error?.message ?? `Request failed (${response.status})`, response.status);
  }
  return response.json();
}
