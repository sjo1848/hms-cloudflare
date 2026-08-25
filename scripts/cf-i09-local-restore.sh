#!/usr/bin/env bash
set -euo pipefail
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/cf-i09-local-common.sh"

[[ $# -eq 1 ]] || cf_i09_die "usage: scripts/cf-i09-local-restore.sh BACKUP_DIRECTORY"
cf_i09_require_tools
cf_i09_require_stopped
backup_dir=$(cd "$1" && pwd)
for required in manifest.sha256 reconciliation.json CONTROL_DB.sql HOTEL_DEMO_DB.sql HOTEL_SECOND_DB.sql; do
  [[ -f "$backup_dir/$required" ]] || cf_i09_die "backup is missing $required"
done
(cd "$backup_dir" && sha256sum --check manifest.sha256 >/dev/null) || cf_i09_die "backup checksum verification failed"

mkdir -p "$CF_I09_RUNTIME_DIR/restore-rollbacks" "$CF_I09_PERSIST_DIR"
d1_state="$CF_I09_PERSIST_DIR/v3/d1"
cf_i09_assert_managed_path "$d1_state"
stamp=$(date -u +%Y%m%dT%H%M%SZ)
prior="$CF_I09_RUNTIME_DIR/restore-rollbacks/d1-before-$stamp-$$"
failed="$CF_I09_RUNTIME_DIR/restore-rollbacks/d1-failed-$stamp-$$"
had_prior=false
if [[ -e "$d1_state" ]]; then
  mv "$d1_state" "$prior"
  had_prior=true
fi

restore_failed() {
  status=$?
  if [[ -e "$d1_state" ]]; then mv "$d1_state" "$failed"; fi
  if [[ "$had_prior" == true && -e "$prior" ]]; then mv "$prior" "$d1_state"; fi
  printf 'Restore failed; prior local D1 state was reinstated. Failed state: %s\n' "$failed" >&2
  exit "$status"
}
trap restore_failed ERR
for database in "${CF_I09_DATABASES[@]}"; do
  CI=1 "$CF_I09_WRANGLER" d1 migrations apply "$database" --local --config "$CF_I09_CONFIG" \
    --persist-to "$CF_I09_PERSIST_DIR" >/dev/null
  data_file=$(mktemp)
  financial_file=$(mktemp)
  # The schema migration runner already recreated d1_migrations; omit its
  # historical export rows to avoid primary-key collisions while preserving
  # every application table row from the data-only dump.
  sed -n '/^INSERT INTO "financial_events"/p' "$backup_dir/$database.sql" > "$financial_file"
  sed '/^INSERT INTO "d1_migrations"/d;/^INSERT INTO "financial_events"/d' "$backup_dir/$database.sql" > "$data_file"
  CI=1 "$CF_I09_WRANGLER" d1 execute "$database" --local --config "$CF_I09_CONFIG" \
    --file "$data_file" --persist-to "$CF_I09_PERSIST_DIR" >/dev/null
  if [[ "$database" != CONTROL_DB ]]; then
    CI=1 "$CF_I09_WRANGLER" d1 execute "$database" --local --config "$CF_I09_CONFIG" \
      --command 'DELETE FROM financial_events;' --persist-to "$CF_I09_PERSIST_DIR" >/dev/null
    CI=1 "$CF_I09_WRANGLER" d1 execute "$database" --local --config "$CF_I09_CONFIG" \
      --file "$financial_file" --persist-to "$CF_I09_PERSIST_DIR" >/dev/null
  fi
  rm -f -- "$data_file"
  rm -f -- "$financial_file"
done
cf_i09_reconcile "$CF_I09_RUNTIME_DIR/restored-reconciliation.json"
cmp --silent "$backup_dir/reconciliation.json" "$CF_I09_RUNTIME_DIR/restored-reconciliation.json" \
  || cf_i09_die "post-restore reconciliation differs from the backed-up baseline"
trap - ERR
printf 'CF-I09 local D1 restore PASS; prior state retained at %s\n' "$prior"
