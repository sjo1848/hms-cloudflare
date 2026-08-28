import { mkdirSync, readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { dirname } from "node:path";

function write(path, content) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content.trimEnd() + "\n");
}
function replaceIn(path, replacements) {
  let content = readFileSync(path, "utf8");
  for (const [from, to] of replacements) {
    if (!content.includes(from)) throw new Error(`Missing replacement marker in ${path}: ${from.slice(0, 100)}`);
    content = content.replace(from, to);
  }
  writeFileSync(path, content);
}

const oldClient = "apps/web/src/shared/api.ts";
const client = readFileSync(oldClient, "utf8");
write("apps/web/src/api/client.ts", client);
unlinkSync(oldClient);

const apiImports = [
  ["apps/web/src/app/AppShell.tsx", '"../shared/api"', '"../api/client"'],
  ["apps/web/src/app/LocalDevIdentitySelector.tsx", '"../shared/api"', '"../api/client"'],
  ["apps/web/src/features/billing/BillingWorkspace.tsx", '"../../shared/api"', '"../../api/client"'],
  ["apps/web/src/features/guests/GuestsPage.tsx", '"../../shared/api"', '"../../api/client"'],
  ["apps/web/src/features/housekeeping/HousekeepingPage.tsx", '"../../shared/api"', '"../../api/client"'],
  ["apps/web/src/features/network/NetworkPage.tsx", '"../../shared/api"', '"../../api/client"'],
  ["apps/web/src/features/reception/ReceptionPage.tsx", '"../../shared/api"', '"../../api/client"'],
  ["apps/web/src/features/reports/ReportsPage.tsx", '"../../shared/api"', '"../../api/client"'],
  ["apps/web/src/features/rooms/RoomsPage.tsx", '"../../shared/api"', '"../../api/client"'],
  ["apps/web/src/features/users/UsersPage.tsx", '"../../shared/api"', '"../../api/client"'],
];
for (const [path, from, to] of apiImports) replaceIn(path, [[from, to]]);

write("apps/web/src/components/AsyncState.tsx", `type AsyncStateProps = {
  kind: "loading" | "error" | "empty";
  title?: string;
  message: string;
  onRetry?: () => void;
};

export function AsyncState({ kind, title, message, onRetry }: AsyncStateProps) {
  const className = kind === "error" ? "state-panel state-error" : kind === "empty" ? "state-panel state-empty" : "state-panel";
  const role = kind === "error" ? "alert" : kind === "loading" ? "status" : undefined;
  return <div className={className} role={role}>
    {kind === "loading" && <span className="state-spinner" />}
    {title && <strong>{title}</strong>}
    <span>{message}</span>
    {onRetry && <button type="button" onClick={onRetry}>Try again</button>}
  </div>;
}`);

write("apps/web/src/components/StatusBadge.tsx", `import type { ReactNode } from "react";

export function StatusBadge({ children }: { children: ReactNode }) {
  return <span className="status-badge">{children}</span>;
}`);

replaceIn("apps/web/src/features/rooms/RoomsPage.tsx", [
  ['import type { Hold, Room } from "../../domain/types";', 'import type { Hold, Room } from "../../domain/types";\nimport { AsyncState } from "../../components/AsyncState";\nimport { StatusBadge } from "../../components/StatusBadge";'],
  ['{error && <div className="state-panel state-error" role="alert"><strong>Rooms could not be loaded</strong><span>{error}</span><button type="button" onClick={() => void load()}>Try again</button></div>}', '{error && <AsyncState kind="error" title="Rooms could not be loaded" message={error} onRetry={() => void load()} />}'],
  ['{loading && <div className="state-panel" role="status"><span className="state-spinner" />Loading rooms…</div>}', '{loading && <AsyncState kind="loading" message="Loading rooms…" />}'],
  ['{!loading && !error && visible.length === 0 && <div className="state-panel state-empty"><strong>{rooms.length ? "No matching rooms" : "No rooms yet"}</strong><span>{rooms.length ? "Try another search." : "Add the first room using the form above."}</span></div>}', '{!loading && !error && visible.length === 0 && <AsyncState kind="empty" title={rooms.length ? "No matching rooms" : "No rooms yet"} message={rooms.length ? "Try another search." : "Add the first room using the form above."} />}'],
  ['<span className="resource-card-title">Room {room.room_number}</span><span className="status-badge">{room.status}</span>', '<span className="resource-card-title">Room {room.room_number}</span><StatusBadge>{room.status}</StatusBadge>'],
  ['<span className="status-badge">{selected.status}</span>', '<StatusBadge>{selected.status}</StatusBadge>'],
]);

replaceIn("apps/web/src/features/guests/GuestsPage.tsx", [
  ['import type { Guest } from "../../domain/types";', 'import type { Guest } from "../../domain/types";\nimport { AsyncState } from "../../components/AsyncState";'],
  ['{error && <div className="state-panel state-error" role="alert"><strong>Guests could not be loaded</strong><span>{error}</span><button type="button" onClick={() => void load()}>Try again</button></div>}', '{error && <AsyncState kind="error" title="Guests could not be loaded" message={error} onRetry={() => void load()} />}'],
  ['{loading && <div className="state-panel" role="status"><span className="state-spinner" />Loading guests…</div>}', '{loading && <AsyncState kind="loading" message="Loading guests…" />}'],
  ['{!loading && !error && visible.length === 0 && <div className="state-panel state-empty"><strong>{guests.length ? "No matching guests" : "No guests yet"}</strong><span>{guests.length ? "Try another search." : "Add the first guest using the form above."}</span></div>}', '{!loading && !error && visible.length === 0 && <AsyncState kind="empty" title={guests.length ? "No matching guests" : "No guests yet"} message={guests.length ? "Try another search." : "Add the first guest using the form above."} />}'],
]);

replaceIn("apps/web/src/features/housekeeping/HousekeepingPage.tsx", [
  ['import { api } from "../../api/client";', 'import { api } from "../../api/client";\nimport { StatusBadge } from "../../components/StatusBadge";'],
  ['<span className="status-badge">{selected.room_status}</span>', '<StatusBadge>{selected.room_status}</StatusBadge>'],
]);

replaceIn("apps/web/src/features/reception/ReceptionPage.tsx", [
  ['import { BillingWorkspace } from "../billing/BillingWorkspace";', 'import { BillingWorkspace } from "../billing/BillingWorkspace";\nimport { StatusBadge } from "../../components/StatusBadge";'],
  ['<span className="status-badge">{selected.status}</span>', '<StatusBadge>{selected.status}</StatusBadge>'],
]);

console.log("Final web boundaries applied");
