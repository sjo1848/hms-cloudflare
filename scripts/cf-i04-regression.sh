#!/usr/bin/env bash
set -euo pipefail

# CF-I04 owns the lifecycle adversarial suite; it composes the historical
# CF-I03 foundation checks so the integrated invariant remains covered.
exec bash "$(dirname "${BASH_SOURCE[0]}")/cf-i03-regression.sh"
