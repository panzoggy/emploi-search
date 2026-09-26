#!/usr/bin/env bash
# Lance EmploiSearch et affiche ses adresses : réseau local et Internet (tunnel Cloudflare gratuit, sans compte).
# Si la machine n'est pas prête (Docker absent, configuration ou images manquantes), lance d'abord ./setup.sh.
#   ./start.sh           réseau local + Internet
#   ./start.sh --local   réseau local seulement
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"
source scripts/lib.sh

PUBLIC=true
[ "${1:-}" = "--local" ] && PUBLIC=false

ready() { docker_ready && env_has DATA_KEY && env_has SIGNUP_CODE && images_built; }

wait_for_api() {
  printf "Démarrage de l'API"
  local status=absent _
  for _ in $(seq 1 90); do
    status=$(dk inspect -f '{{.State.Health.Status}}' emploi-backend 2>/dev/null || echo absent)
    [ "$status" = healthy ] && break
    printf "."
    sleep 2
  done
  echo
  if [ "$status" != healthy ]; then
    say "L'API ne répond pas. Dernières lignes du backend :"
    compose logs --tail=40 backend
    exit 1
  fi
}

summary() {
  echo
  say "EmploiSearch tourne"
  say "  Réseau local        $(local_url)"
  if $PUBLIC; then
    local url
    url=$(public_url)
    say "  Internet            ${url:-indisponible (voir : docker logs emploi-tunnel)}"
    say "  Code d'inscription  $(env_value SIGNUP_CODE)"
    say "  L'adresse Internet change à chaque démarrage."
  fi
  say "  Logs : $LOG_DIR/app.log · arrêt : ./stop.sh"
}

if ! ready; then
  say "Première fois ou installation incomplète : préparation automatique."
  CALLED_BY_START=1 ./setup.sh
  pick_docker
fi

# Un éventuel suivi de logs précédent, puis des logs repartis de zéro
[ -f "$PID_FILE" ] && kill "$(cat "$PID_FILE")" 2>/dev/null || true
rm -rf "$LOG_DIR" && mkdir -p "$LOG_DIR"

if $PUBLIC; then
  compose --profile public up -d --build
else
  # Un tunnel resté ouvert d'un démarrage public précédent est refermé
  compose --profile public stop tunnel >/dev/null 2>&1 || true
  compose up -d --build
fi

wait_for_api
nohup "${DOCKER[@]}" compose --profile public logs -f --no-color >"$LOG_DIR/app.log" 2>&1 &
echo $! >"$PID_FILE"
summary
