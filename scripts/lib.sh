#!/usr/bin/env bash
# Fonctions communes à setup.sh, start.sh et stop.sh (à sourcer, pas à exécuter)

ENV_FILE=backend/.env
LOG_DIR=logs
PID_FILE="$LOG_DIR/logs.pid"
IMAGES=(emploi-search-backend emploi-search-frontend)

say() { printf '%s\n' "$*"; }
step() { printf '\n▸ %s\n' "$*"; }
warn() { printf '  ! %s\n' "$*" >&2; }

# Docker directement si l'utilisateur en a le droit, sinon via sudo
# (juste après l'installation, l'ajout au groupe docker n'est effectif qu'à la prochaine session)
DOCKER=(docker)
pick_docker() {
  if docker info >/dev/null 2>&1; then
    DOCKER=(docker)
  elif command -v sudo >/dev/null && sudo docker info >/dev/null 2>&1; then
    DOCKER=(sudo docker)
  else
    return 1
  fi
}
dk() { "${DOCKER[@]}" "$@"; }
compose() { dk compose "$@"; }

docker_ready() { command -v docker >/dev/null && pick_docker && dk compose version >/dev/null 2>&1; }

# Écrit NOM=valeur dans backend/.env, en remplaçant la ligne si elle existe
set_env() {
  if grep -q "^$1=" "$ENV_FILE"; then
    sed -i "s|^$1=.*|$1=$2|" "$ENV_FILE"
  else
    printf '\n%s=%s\n' "$1" "$2" >>"$ENV_FILE"
  fi
}
env_has() { [ -f "$ENV_FILE" ] && grep -qE "^$1=.+" "$ENV_FILE"; }
env_value() { grep -E "^$1=" "$ENV_FILE" | cut -d= -f2-; }

images_built() {
  local image
  for image in "${IMAGES[@]}"; do dk image inspect "$image" >/dev/null 2>&1 || return 1; done
}

# hostname -I n'existe pas partout (Arch par exemple) : on demande la route vers Internet
local_url() {
  local ip port
  ip=$(ip -4 route get 1.1.1.1 2>/dev/null | awk '{for (i = 1; i < NF; i++) if ($i == "src") print $(i + 1)}' || true)
  port=${FRONTEND_PORT:-80}
  echo "http://${ip:-localhost}$([ "$port" = 80 ] || echo ":$port")"
}

# Le tunnel annonce son adresse aléatoire dans ses logs au bout de quelques secondes
public_url() {
  local url="" _
  for _ in $(seq 1 30); do
    url=$(dk logs emploi-tunnel 2>&1 | grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' | tail -1 || true)
    [ -n "$url" ] && break
    sleep 2
  done
  echo "$url"
}
