#!/usr/bin/env bash
set -euo pipefail

UNIT_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/systemd/user"
ENV_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/hms-cloudflare"

systemctl --user disable --now hms-codex-dispatch.timer 2>/dev/null || true
systemctl --user stop hms-codex-dispatch.service 2>/dev/null || true
rm -f "$UNIT_DIR/hms-codex-dispatch.timer" "$UNIT_DIR/hms-codex-dispatch.service"
rm -f "$ENV_DIR/runtime-watch.env"
systemctl --user daemon-reload

echo "HMS Codex dispatcher removed. Local retry state under ~/.local/state/hms-cloudflare was preserved for auditability."
