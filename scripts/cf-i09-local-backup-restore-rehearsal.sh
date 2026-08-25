#!/usr/bin/env bash
set -euo pipefail
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/cf-i09-local-common.sh"

cf_i09_require_tools
cf_i09_require_stopped
"$CF_I09_REPO_DIR/scripts/cf-i09-local-reset.sh"
stamp=$(date -u +%Y%m%dT%H%M%SZ)
backup_dir="$CF_I09_BACKUP_ROOT/rehearsal-$stamp-$$"
"$CF_I09_REPO_DIR/scripts/cf-i09-local-backup.sh" "$backup_dir"

CI=1 "$CF_I09_WRANGLER" d1 execute CONTROL_DB --local --config "$CF_I09_CONFIG" --persist-to "$CF_I09_PERSIST_DIR" \
  --command "INSERT INTO control_hotels(id,slug,operational_binding,active) VALUES ('cf-i09-restore-marker','cf-i09-restore-marker','HOTEL_DEMO_DB',0);" >/dev/null
for database in HOTEL_DEMO_DB HOTEL_SECOND_DB; do
  CI=1 "$CF_I09_WRANGLER" d1 execute "$database" --local --config "$CF_I09_CONFIG" --persist-to "$CF_I09_PERSIST_DIR" \
    --command "INSERT INTO rooms(id,room_number,room_type,status,price_cents) VALUES ('cf-i09-restore-marker','RESTORE-MARKER','TEST','AVAILABLE',1);" >/dev/null
done

"$CF_I09_REPO_DIR/scripts/cf-i09-local-restore.sh" "$backup_dir"
for database in "${CF_I09_DATABASES[@]}"; do
  table=rooms
  [[ "$database" == CONTROL_DB ]] && table=control_hotels
  result=$(CI=1 "$CF_I09_WRANGLER" d1 execute "$database" --local --config "$CF_I09_CONFIG" --persist-to "$CF_I09_PERSIST_DIR" \
    --command "SELECT COUNT(*) AS marker_count FROM $table WHERE id='cf-i09-restore-marker';" --json)
  RESULT_JSON="$result" node -e 'const x=JSON.parse(process.env.RESULT_JSON); const r=x.find?.(v=>Array.isArray(v.results))??x; if(r.results?.[0]?.marker_count!==0) process.exit(1)'
done
printf 'CF-I09 CONTROL_DB + two-hotel D1 backup/change/restore/reconciliation rehearsal PASS\n'
