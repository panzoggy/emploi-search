#!/usr/bin/env bash
# Démarre EmploiSearch au boot de la machine (conteneurs + tunnel public) puis génère ACCES.txt.
# Appelé par le service systemd emploi-search.service (voir scripts/install-autostart.sh).
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."
source scripts/lib.sh

pick_docker || { echo "Docker indisponible" >&2; exit 1; }
compose --profile public up -d
exec scripts/access.sh
