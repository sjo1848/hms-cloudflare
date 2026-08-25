# CF-I09 local operational readiness

This runbook operates the complete HMS candidate locally for technical smoke and Human Product Acceptance preparation. It uses only the checked-in Worker, Vite frontend, deterministic synthetic fixture, and three local D1 databases. It does not authenticate to Cloudflare, provision resources, deploy, migrate real data, or require production secrets.

## Prerequisites and boundaries

- Node.js/npm, `curl`, `python3`, `sha256sum`, and `setsid` are required.
- Install repository dependencies with `npm install`.
- Run commands from the repository root.
- API: `http://127.0.0.1:8787`; frontend: `http://127.0.0.1:4174`.
- Local D1 persistence: `apps/api/.wrangler/state`; runtime PIDs, logs, reset snapshots, and backups: `.hms-local` (Git-ignored). Wrangler resolves `d1 export --local` relative to the selected API config, so every CF-I09 command deliberately uses that same directory.
- `LOCAL_DEV_AUTH=true` is passed only to the explicitly local `wrangler dev --local` process. The checked-in configuration remains `LOCAL_DEV_AUTH=false`, and production continues to require Cloudflare Access.
- Source passwords, Access assertions, tokens, and production-only secrets are neither required nor imported.

The operational topology remains CONTROL_DB plus one operational D1 per hotel:

| Binding | Local role |
| --- | --- |
| `CONTROL_DB` | Access-subject mappings, hotel/network memberships, hotel routing/admin metadata, control audit |
| `HOTEL_DEMO_DB` | First hotel's operational data |
| `HOTEL_SECOND_DB` | Second hotel's operational data |

There is no cross-D1 transaction. Backup and restore are a coordinated, stopped-runtime sequence of three independently exported databases. A failure restores the prior local D1 directory, but this local procedure is not evidence of all-or-nothing rollback across remote D1 databases.

## Deterministic reset and startup

Reset/reseed and machine reconciliation while stopped:

```bash
scripts/cf-i09-local-reset.sh
```

The reset retains the previous D1 directory below `.hms-local/resets/`, runs `scripts/migration/rehearse.mjs --persist-to apps/api/.wrangler/state`, and requires the machine reconciliation to pass. It never contacts remote D1.

Start a freshly reset complete product:

```bash
scripts/cf-i09-local-start.sh --reset
```

Reuse an already reconciled local fixture without resetting:

```bash
scripts/cf-i09-local-start.sh --reuse
```

Startup refuses occupied ports or a live managed runtime. It starts independent process groups, records their PIDs, and waits for `/ready` to prove both the required schema migration (`0004` for control, `0014` for hotels) and the final `APPLIED` migration-rehearsal manifest in every D1 before starting the frontend. `/health` is liveness only; `/ready` is dependency readiness and returns `503` with per-binding status if a required D1 is absent, unreachable, schema-only, partially imported, or unmigrated.

Acceptance identities are a closed list of four synthetic Access subjects from the migration fixture. The managed start command opts the Vite development server into a visible **Local acceptance identity** selector; it supplies those controlled headers without persisting arbitrary values or secrets, and selecting a profile remounts the current surface so its data reloads under that identity. Ordinary Vite test runs and production builds omit the selector and headers entirely. The API also requires `ENVIRONMENT=development`, `LOCAL_DEV_AUTH=true`, and absence of the runtime-owned `request.cf`; therefore a remotely deployed Cloudflare Worker rejects local headers even if development variables are accidentally supplied.

## Clean shutdown

```bash
scripts/cf-i09-local-stop.sh
```

The stop command terminates the managed Vite and Wrangler process groups, waits for the complete groups (leaders and descendants) to exit, escalates only if necessary, removes their PID files, and refuses to print success while any member of an owned process group remains. Logs remain in `.hms-local/logs/` for diagnosis.

## Real local integrated smoke

```bash
node scripts/cf-i09-local-smoke.mjs
```

The smoke resets and starts the complete local product, discovers the synthetic admin/network identities from CONTROL_DB, and exercises real Worker+D1 paths for:

- two-hotel identity/routing plus a real cross-hotel denial;
- room and guest creation/readback;
- booking creation, check-in, room reassignment, extra charge, check-out, and invoice readback;
- housekeeping clean cycle and maintenance open/resolve/clean cycle;
- tenant user/RBAC membership creation/readback;
- billing balance, revenue report, analytics, network hotels/KPIs;
- frontend routes for all accepted product surfaces.
- real Chromium use of the development-only closed profile selector, Hotel Norte/Hotel Sur room isolation, and the network surface.

It then cleanly stops and resets/reconciles the fixture again, so transient smoke mutations do not become the Product Acceptance baseline. This is technical evidence, not Human Product Acceptance.

## Local backup and restore

Create a reconciled local SQL export of all three D1 databases while the runtime is stopped:

```bash
scripts/cf-i09-local-backup.sh
```

The output path is printed. To select one explicitly:

```bash
scripts/cf-i09-local-backup.sh .hms-local/backups/manual-baseline
```

Each backup contains `CONTROL_DB.sql`, `HOTEL_DEMO_DB.sql`, `HOTEL_SECOND_DB.sql`, the baseline machine reconciliation, and `manifest.sha256`. Export uses Wrangler `d1 export --local`; no `--remote` path exists in these scripts.

Restore a stopped runtime from that directory:

```bash
scripts/cf-i09-local-restore.sh .hms-local/backups/manual-baseline
```

Restore verifies checksums before mutation, moves the current local D1 state to `.hms-local/restore-rollbacks/`, imports all three SQL exports using `d1 execute --local`, reruns reconciliation, and requires byte-identical reconciliation against the baseline. If an import fails, the partial restored state is quarantined and the previous local D1 state is reinstated.

Execute the complete baseline → export → intentional three-DB mutation → restore → exact reconciliation rehearsal:

```bash
scripts/cf-i09-local-backup-restore-rehearsal.sh
```

The intentional mutation is a synthetic marker row in CONTROL_DB and each hotel D1. The final assertions prove all three markers disappeared and post-restore reconciliation equals the pre-change baseline.

## Repeatable acceptance sequence

```bash
npm install
bash scripts/migration/test-rehearsal.sh
scripts/cf-i09-local-backup-restore-rehearsal.sh
node scripts/cf-i09-local-smoke.mjs
scripts/cf-i09-local-start.sh --reset
```

The last command leaves the clean reconciled candidate running for Human Product Acceptance. When finished:

```bash
scripts/cf-i09-local-stop.sh
```

If a command fails, treat its acceptance claim as unproven. Inspect `.hms-local/logs/`, repair or reset, and rerun; do not infer readiness from a running port or an earlier PASS line.
