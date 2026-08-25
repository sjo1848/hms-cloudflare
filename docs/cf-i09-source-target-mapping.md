# CF-I09 source → D1 migration mapping

Canonical source: `hotel-management-system@4df56a6217caab611f2f5fcbd98bde8386bb5629` (PostgreSQL migrations `0001`–`0030`). Executable field registry: `scripts/migration/source-target-map.mjs`. Synthetic source fixture: `scripts/migration/fixtures/source-synthetic.json`.

The fixture contains source tables/columns only. Target-only Access routing and network membership are isolated under `target_adaptations`; reconstructed lifecycle, housekeeping and financial events are declared separately in `TARGET_RECONSTRUCTIONS` and derive only from source snapshots.

## Semantic mapping

- UUIDs are preserved as D1 `TEXT`. A source booking with `guest_id IS NULL` and nonblank legacy `guest_name` receives tenant-local `legacy-guest:<booking UUID>` plus `<booking UUID>@migration.invalid`; `migration_provenance` records source/import timestamps, logical migration actor and reason. Blank legacy names fail before mutation. `guest_name_snapshot` is preserved independently of the current guest name.
- PostgreSQL `BIGINT` money is accepted only when it is an exact JavaScript safe integer and stored as D1 `INTEGER` cents. Source `bookings.total_price_cents` is the final total at this baseline. The importer subtracts the booking's source-charge sum for its initial insert, then inserts those charges through the accepted target trigger so the final stored total returns to the source value exactly once. Reconciliation compares target final total directly to source. Source invoices are inserted after charges. More than one source invoice per booking fails because the accepted target has a unique booking invoice.
- `DATE` requires real `YYYY-MM-DD`; timestamps normalize with `Date.toISOString()` to UTC. JSONB is recursively key-sorted and emitted as valid canonical JSON.
- Every enum uses the explicit maps in `source-target-map.mjs`; unknown values fail. `NO_SHOW` remains terminal, creates no inventory claim, contributes no reporting revenue/occupancy or Housekeeping turnover, and serializes as source-shaped `NoShow` through the API.
- Source hotel columns route into CONTROL_DB metadata. Slug/D1 binding are explicit target adaptation, and the binding must match the server-owned two-binding allow-list. Operational rows are filtered by source `hotel_id` and emitted only to that hotel's physical D1.
- Source users become `source-user:<UUID>` Access subjects and `.invalid` synthetic emails. Password hashes and refresh tokens are never emitted. Tenant roles map exactly; the synthetic network administrator is an explicit Access/SaaS target adaptation, not a claimed source column.
- Source `refresh_tokens` fields are exhaustively classified `not-applicable`: Cloudflare Access replaces the credential session, so token hashes, session/device identifiers and expiry/revocation state are validated as source-shaped input but never emitted or recreated in D1.
- Booking operational checklist, terminal and late-arrival snapshots are retained by hotel migration `0014`. Lifecycle events derive only from checked-in/out snapshots. Maintenance events derive only from source maintenance cases. Payment/cash financial events are reconstructed deterministically; the cash-closure trigger's random ID is immediately normalized to a deterministic ID.
- Source audit IP address is retained in `control_audit_events.details_json.source_ip_address`. A nullable source audit actor uses a per-event `legacy-source-user:unknown:<event UUID>` sentinel and records why; it is never attributed to the migration operator.

## Safety and reconciliation

`node scripts/migration/rehearse.mjs --persist-to <local-dir>` applies schemas and imports CONTROL_DB plus the two hotel D1s. It queries all three manifests before business mutation; any prior/partial application refuses replay truthfully. Cross-D1 atomic rollback is not claimed: interruption can leave a partial local rehearsal, but absent/mismatched manifests make reconciliation fail and the reset path must recreate all three local stores.

`node scripts/migration/reconcile.mjs --persist-to <local-dir>` emits byte-stable JSON and compares source-derived expectations against control/hotel counts, IDs allow-lists, foreign keys, state counts, inventory ownership, exact financial totals, invoice/payment/closure consistency, provenance/event counts, hotel IDs, plan/membership ownership, `NO_SHOW` exclusions and per-hotel report revenue. A row-count-only result cannot pass.

Run `bash scripts/migration/test-rehearsal.sh` for clean import, deterministic reconciliation, replay-before-mutation and adversarial preflight checks. These commands are local-only and contain no `--remote` path.
