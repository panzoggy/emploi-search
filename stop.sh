#!/usr/bin/env bash
# Arrête EmploiSearch et le tunnel. Les données (base SQLite) sont conservées dans le volume Docker.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"
source scripts/lib.sh

if [ -f "$PID_FILE" ]; then
  kill "$(cat "$PID_FILE")" 2>/dev/null || true
  rm -f "$PID_FILE"
fi

if ! pick_docker; then
  say "Docker ne répond pas : rien à arrêter."
  exit 0
fi
compose --profile public down
say "EmploiSearch arrêté."
