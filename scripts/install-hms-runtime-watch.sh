#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

need() {
  local cmd="$1"
  command -v "$cmd" >/dev/null 2>&1 || { echo "Missing required command: $cmd" >&2; exit 10; }
}
for cmd in git npm codex python3 flock systemctl bash; do need "$cmd"; done

UNIT_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/systemd/user"
ENV_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/hms-cloudflare"
mkdir -p "$UNIT_DIR" "$ENV_DIR"

GIT_BIN="$(command -v git)"
NPM_BIN="$(command -v npm)"
CODEX_BIN="$(command -v codex)"
PYTHON_BIN="$(command -v python3)"
FLOCK_BIN="$(command -v flock)"
BASH_BIN="$(command -v bash)"

cat > "$ENV_DIR/runtime-watch.env" <<ENV
HMS_REPO_ROOT="$ROOT"
GIT_BIN="$GIT_BIN"
NPM_BIN="$NPM_BIN"
CODEX_BIN="$CODEX_BIN"
PYTHON_BIN="$PYTHON_BIN"
FLOCK_BIN="$FLOCK_BIN"
HMS_DISPATCH_COOLDOWN_SECONDS="1800"
HMS_DISPATCH_MAX_ATTEMPTS="2"
HMS_DISPATCH_MAX_CHECKPOINTS="20"
HMS_CODEX_MAX_SESSION_CONTINUATIONS="6"
HMS_CODEX_STAGNATION_LIMIT="2"
ENV

cat > "$UNIT_DIR/hms-codex-dispatch.service" <<UNIT
[Unit]
Description=HMS Cloudflare Codex runtime dispatcher
Wants=network-online.target
After=network-online.target

[Service]
Type=oneshot
WorkingDirectory=$ROOT
EnvironmentFile=$ENV_DIR/runtime-watch.env
ExecStart=$BASH_BIN $ROOT/scripts/hms-runtime-watch.sh
Nice=10
UNIT

cat > "$UNIT_DIR/hms-codex-dispatch.timer" <<'UNIT'
[Unit]
Description=Poll HMS Cloudflare runtime state and dispatch Codex when authorized

[Timer]
OnBootSec=2min
OnUnitActiveSec=2min
AccuracySec=20s
Persistent=true
Unit=hms-codex-dispatch.service

[Install]
WantedBy=timers.target
UNIT

systemctl --user daemon-reload
systemctl --user enable --now hms-codex-dispatch.timer

echo "Installed and enabled hms-codex-dispatch.timer"
echo "Timer status: systemctl --user status hms-codex-dispatch.timer"
echo "Recent logs: journalctl --user -u hms-codex-dispatch.service -n 50 --no-pager"
echo "Manual safe check: systemctl --user start hms-codex-dispatch.service"
