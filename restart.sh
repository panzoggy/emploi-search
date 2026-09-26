#!/usr/bin/env bash
# Relance EmploiSearch en reconstruisant les images (utile après un git pull).
# Mêmes options que start.sh : --local pour rester sur le réseau local.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"
./stop.sh
./start.sh "$@"
