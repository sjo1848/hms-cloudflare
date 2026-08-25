#!/usr/bin/env bash
set -euo pipefail
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/cf-i09-local-common.sh"

cf_i09_require_tools
cf_i09_require_stopped
stamp=$(date -u +%Y%m%dT%H%M%SZ)
backup_dir="${1:-$CF_I09_BACKUP_ROOT/$stamp}"
mkdir -p "$backup_dir"
backup_dir=$(cd "$backup_dir" && pwd)
[[ ! -e "$backup_dir/manifest.sha256" ]] || cf_i09_die "backup directory is already finalized: $backup_dir"

cf_i09_reconcile "$backup_dir/reconciliation.json"
for database in "${CF_I09_DATABASES[@]}"; do
  : > "$backup_dir/$database.sql"
  printf 'PRAGMA foreign_keys=OFF;\n' >> "$backup_dir/$database.sql"
  if [[ "$database" == CONTROL_DB ]]; then
    tables=(control_hotels access_identity_mappings hotel_memberships network_memberships hotel_admin_metadata control_audit_events migration_rehearsals)
  else
    # Restore in dependency/transition order: base entities first, then
    # booking-linked tables and domain events whose triggers inspect bookings.
    tables=(extra_charges rooms guests room_holds bookings invoices payment_entries cash_closures room_inventory_nights maintenance_cases housekeeping_events lifecycle_events financial_events migration_provenance migration_rehearsals)
  fi
  for table in "${tables[@]}"; do
    table_dump=$(mktemp)
    CI=1 "$CF_I09_WRANGLER" d1 export "$database" --local --config "$CF_I09_CONFIG" \
      --table "$table" --output "$table_dump" --no-schema --skip-confirmation >/dev/null
    # Migration bookkeeping is recreated by restore's schema phase.
    sed '/^INSERT INTO "d1_migrations"/d' "$table_dump" >> "$backup_dir/$database.sql"
    rm -f -- "$table_dump"
  done
  [[ -s "$backup_dir/$database.sql" ]] || cf_i09_die "empty export for $database"
done
(
  cd "$backup_dir"
  sha256sum CONTROL_DB.sql HOTEL_DEMO_DB.sql HOTEL_SECOND_DB.sql reconciliation.json > manifest.sha256
)
printf 'CF-I09 local D1 backup PASS: %s\n' "$backup_dir"
