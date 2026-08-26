#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
RUNNER="$ROOT/scripts/codex-unattended.sh"
WATCH="$ROOT/scripts/hms-runtime-watch.sh"

bash -n "$RUNNER"
bash -n "$WATCH"

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

make_repo() {
  local name="$1"
  local bare="$tmp/$name-origin.git"
  local work="$tmp/$name-work"
  git init --bare "$bare" >/dev/null
  git init -b main "$work" >/dev/null
  (
    cd "$work"
    git config user.name RuntimeSelftest
    git config user.email runtime-selftest@example.invalid
    mkdir -p scripts .orchestration
    cp "$RUNNER" scripts/codex-unattended.sh
    chmod +x scripts/codex-unattended.sh
    printf 'Resume autonomously.\n' > .orchestration/RESUME_PROMPT.txt
    printf '# State\n' > .orchestration/STATE.md
    cat > .orchestration/STATUS.json <<'EOF'
{
  "schema_version": 1,
  "project": "Runtime Selftest",
  "phase": "BUILD",
  "runtime_status": "READY_TO_RESUME",
  "resume_authorized": true,
  "active_task": "CF-I09",
  "last_completed_task": "REWORK-2",
  "last_completed_head": null,
  "work_branch": "main",
  "next_action": "CONTINUE",
  "stop_reason": null,
  "event": {"seq": 86, "id": "CF-I09@REWORK-2", "type": "READY_TO_RESUME"},
  "external_review": {"required": false, "artifact_head": null, "pending_verdict": null},
  "human_gate": null,
  "blocker": null
}
EOF
    git add .
    git commit -m init >/dev/null
    git remote add origin "$bare"
    git push -u origin main >/dev/null
  )
  printf '%s\t%s\n' "$bare" "$work"
}

make_fake_codex() {
  local path="$1"
  cat > "$path" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
mode="$(cat "$FAKE_CODEX_MODE")"
count=0
[[ -f "$FAKE_CODEX_COUNT" ]] && count="$(cat "$FAKE_CODEX_COUNT")"
count=$((count + 1))
printf '%s\n' "$count" > "$FAKE_CODEX_COUNT"
printf 'session-%s-%s\n' "$count" "$mode" >> payload.txt
python3 - "$mode" "$count" <<'PY'
import json, sys
mode=sys.argv[1]; count=int(sys.argv[2])
p=".orchestration/STATUS.json"
with open(p, encoding="utf-8") as fh:
    s=json.load(fh)
if mode == "two-session":
    if count == 1:
        s["runtime_status"]="READY_TO_RESUME"
        s["resume_authorized"]=True
        s["external_review"]["required"]=False
        s["next_action"]="SECOND_SESSION"
    else:
        s["runtime_status"]="WAITING_EXTERNAL_REVIEW"
        s["resume_authorized"]=False
        s["external_review"]["required"]=True
        s["next_action"]="HOST_PUBLICATION"
elif mode == "checkpoint":
    s["runtime_status"]="READY_TO_RESUME"
    s["resume_authorized"]=True
    s["external_review"]["required"]=False
    s["next_action"]="CONTINUE_AFTER_CHECKPOINT"
elif mode == "final":
    s["runtime_status"]="WAITING_EXTERNAL_REVIEW"
    s["resume_authorized"]=False
    s["external_review"]["required"]=True
    s["next_action"]="HOST_PUBLICATION"
else:
    raise SystemExit(f"unknown fake mode {mode}")
with open(p,"w",encoding="utf-8") as fh:
    json.dump(s,fh,indent=2)
    fh.write("\n")
PY
EOF
  chmod +x "$path"
}

IFS=$'\t' read -r bare1 work1 < <(make_repo scenario1)
fake1="$tmp/fake-codex-1"
mode1="$tmp/mode1"
count1="$tmp/count1"
make_fake_codex "$fake1"
printf 'two-session\n' > "$mode1"
(
  cd "$work1"
  FAKE_CODEX_MODE="$mode1" FAKE_CODEX_COUNT="$count1" CODEX_BIN="$fake1" \
    HMS_CODEX_MAX_SESSION_CONTINUATIONS=3 bash scripts/codex-unattended.sh
  A="$(git rev-parse origin/main^)"
  B="$(git rev-parse origin/main)"
  [[ "$(cat "$count1")" == "2" ]]
  git merge-base --is-ancestor "$A" "$B"
  [[ "$(git rev-parse "$B^")" == "$A" ]]
  changed="$(git diff --name-only "$A" "$B")"
  [[ "$changed" == $'.orchestration/STATE.md\n.orchestration/STATUS.json' ]]
  python3 - "$A" <<'PY'
import json, subprocess, sys
a=sys.argv[1]
s=json.loads(subprocess.check_output(["git","show","origin/main:.orchestration/STATUS.json"],text=True))
assert s["runtime_status"] == "WAITING_EXTERNAL_REVIEW"
assert s["resume_authorized"] is False
assert s["external_review"]["required"] is True
assert s["external_review"]["artifact_head"] == a
PY
)

IFS=$'\t' read -r bare2 work2 < <(make_repo scenario2)
fake2="$tmp/fake-codex-2"
mode2="$tmp/mode2"
count2="$tmp/count2"
make_fake_codex "$fake2"
printf 'checkpoint\n' > "$mode2"
(
  cd "$work2"
  base="$(git rev-parse origin/main)"
  FAKE_CODEX_MODE="$mode2" FAKE_CODEX_COUNT="$count2" CODEX_BIN="$fake2" \
    HMS_CODEX_MAX_SESSION_CONTINUATIONS=1 bash scripts/codex-unattended.sh
  [[ "$(git rev-parse origin/main)" == "$base" ]]
  checkpoint="$(git rev-parse origin/runtime/cf-i09-86)"
  git merge-base --is-ancestor "$base" "$checkpoint"

  printf 'final\n' > "$mode2"
  FAKE_CODEX_MODE="$mode2" FAKE_CODEX_COUNT="$count2" CODEX_BIN="$fake2" \
    HMS_CODEX_MAX_SESSION_CONTINUATIONS=2 bash scripts/codex-unattended.sh
  A="$(git rev-parse origin/main^)"
  B="$(git rev-parse origin/main)"
  git merge-base --is-ancestor "$checkpoint" "$A"
  [[ "$(git rev-parse "$B^")" == "$A" ]]
)

printf 'HMS runtime dispatcher selftest PASS\n'
