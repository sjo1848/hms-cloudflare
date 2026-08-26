#!/usr/bin/env bash
set -euo pipefail
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/cf-i09-local-common.sh"

[[ $# -eq 1 ]] || cf_i09_die "usage: scripts/cf-i09-local-restore.sh BACKUP_DIRECTORY"
cf_i09_require_tools
cf_i09_require_stopped
backup_dir=$(cd "$1" && pwd)
for required in manifest.sha256 reconciliation.json CONTROL_DB.sql HOTEL_DEMO_DB.sql HOTEL_SECOND_DB.sql CONTROL_DB.sqlite HOTEL_DEMO_DB.sqlite HOTEL_SECOND_DB.sqlite; do
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
mkdir -p "$CF_I09_PERSIST_DIR/v3/d1/miniflare-D1DatabaseObject"
for database in "${CF_I09_DATABASES[@]}"; do
  case "$database" in
    CONTROL_DB) db_file=a36f84ea60804f30bb0c7f7cad9f5336a6cca0165abdab8b9241d93dbf0b6006.sqlite ;;
    HOTEL_DEMO_DB) db_file=3dd27f64a8e6b7092b4dc42ea2a5f93d01d65d27a0f4927b2e4bc344a6a2f6f6.sqlite ;;
    HOTEL_SECOND_DB) db_file=374ae31b0276edfb52cf0c3fe3f8b1712cac94c97c4f163773aedbe6cbf2938e.sqlite ;;
  esac
  cp -- "$backup_dir/$database.sqlite" "$CF_I09_PERSIST_DIR/v3/d1/miniflare-D1DatabaseObject/$db_file"
done
cf_i09_reconcile "$CF_I09_RUNTIME_DIR/restored-reconciliation.json"
cmp --silent "$backup_dir/reconciliation.json" "$CF_I09_RUNTIME_DIR/restored-reconciliation.json" || cf_i09_die "post-restore reconciliation differs from the backed-up baseline"
trap - ERR
printf 'CF-I09 local D1 restore PASS; prior state retained at %s\n' "$prior"
exit 0
