#!/usr/bin/env bash
# Prépare la machine pour EmploiSearch, sans rien à faire à la main :
# installe Docker s'il manque, prépare backend/.env et ses secrets, construit les images.
# Sans risque à relancer : chaque étape déjà faite est sautée. start.sh l'appelle tout seul si besoin.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"
source scripts/lib.sh

MIN_FREE_GB=5

sudo_or_root() { if [ "$(id -u)" -eq 0 ]; then "$@"; else sudo "$@"; fi; }

# Dépôt officiel de Docker, clé de signature vérifiée par apt (plutôt que le script curl | sh)
install_docker_apt() {
  local distro codename
  distro=$(. /etc/os-release && echo "$ID")
  [ "$distro" = raspbian ] && distro=debian
  codename=$(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}")
  sudo_or_root apt-get update -qq
  sudo_or_root apt-get install -y -qq ca-certificates curl
  sudo_or_root install -m 0755 -d /etc/apt/keyrings
  sudo_or_root curl -fsSL "https://download.docker.com/linux/$distro/gpg" -o /etc/apt/keyrings/docker.asc
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/$distro $codename stable" |
    sudo_or_root tee /etc/apt/sources.list.d/docker.list >/dev/null
  sudo_or_root apt-get update -qq
  sudo_or_root apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
}

install_docker_dnf() {
  sudo_or_root dnf -y install dnf-plugins-core
  sudo_or_root dnf config-manager addrepo --from-repofile=https://download.docker.com/linux/fedora/docker-ce.repo
  sudo_or_root dnf -y install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
}

install_docker() {
  step "Installation de Docker"
  if command -v apt-get >/dev/null; then
    install_docker_apt
  elif command -v pacman >/dev/null; then
    sudo_or_root pacman -S --needed --noconfirm docker docker-compose docker-buildx
  elif command -v dnf >/dev/null; then
    install_docker_dnf
  else
    say "Système non reconnu : installe Docker avec Compose v2 (https://docs.docker.com/engine/install/), puis relance ./setup.sh"
    exit 1
  fi
}

# buildx accélère la construction des images ; sans lui Docker se rabat sur l'ancien constructeur
install_buildx() {
  if command -v pacman >/dev/null; then
    sudo_or_root pacman -S --needed --noconfirm docker-buildx
  elif command -v apt-get >/dev/null; then
    sudo_or_root apt-get install -y -qq docker-buildx-plugin
  elif command -v dnf >/dev/null; then
    sudo_or_root dnf -y install docker-buildx-plugin
  else
    return 1
  fi
}

# Démarré maintenant et à chaque démarrage de la machine (les conteneurs repartent alors d'eux-mêmes)
start_docker_service() {
  if command -v systemctl >/dev/null; then
    sudo_or_root systemctl enable --now docker >/dev/null 2>&1 || true
  fi
  # Pour les prochaines sessions : Docker sans sudo
  if [ "$(id -u)" -ne 0 ] && ! id -nG "$USER" | grep -qw docker; then
    sudo_or_root usermod -aG docker "$USER" && say "  $USER ajouté au groupe docker (effectif à la prochaine connexion)"
  fi
}

ensure_docker() {
  step "Docker"
  if ! command -v docker >/dev/null || ! docker compose version >/dev/null 2>&1; then install_docker; fi
  docker_ready || start_docker_service
  if ! docker_ready; then
    say "Docker est installé mais ne répond pas. Vérifie : sudo systemctl status docker"
    exit 1
  fi
  if ! dk buildx version >/dev/null 2>&1; then
    install_buildx >/dev/null 2>&1 || warn "buildx absent : les images se construisent quand même, plus lentement"
  fi
  say "  $(dk --version)"
}

# Les images vont dans le dossier de données de Docker, pas dans celui du projet
check_disk() {
  local root free_gb
  root=$(dk info -f '{{.DockerRootDir}}' 2>/dev/null || echo /)
  free_gb=$(df -Pk "$root" 2>/dev/null | awk 'NR == 2 { print int($4 / 1048576) }')
  [ -n "$free_gb" ] || return 0
  if [ "$free_gb" -lt "$MIN_FREE_GB" ]; then
    warn "Seulement ${free_gb} Go libres pour Docker ($root) : il en faut environ ${MIN_FREE_GB}"
  fi
}

# Secrets générés une seule fois, puis conservés dans backend/.env
prepare_env() {
  step "Configuration"
  if [ ! -f "$ENV_FILE" ]; then
    cp backend/.env.example "$ENV_FILE"
    say "  backend/.env créé"
  fi
  if ! grep -qE '^DATA_KEY=.{40,}' "$ENV_FILE"; then
    set_env DATA_KEY "$(head -c 32 /dev/urandom | base64 | tr -d '\n')"
    say "  clé de chiffrement des CV créée (à sauvegarder avec la base)"
  fi
  # Sur Internet, sans code, n'importe qui pourrait créer un compte et lancer des recherches depuis cette machine
  if ! env_has SIGNUP_CODE; then
    set_env SIGNUP_CODE "$(head -c 8 /dev/urandom | base32 | tr -d '=' | tr '[:upper:]' '[:lower:]')"
    say "  code d'inscription créé"
  fi
  chmod 600 "$ENV_FILE"
}

build_images() {
  step "Construction des images (la première fois : plusieurs minutes, ~3 Go à télécharger)"
  compose --profile public pull --quiet tunnel
  compose build
}

ensure_docker
check_disk
prepare_env
build_images
# Appelé par start.sh, qui enchaîne tout seul ; lancé à la main, on indique la suite
[ -n "${CALLED_BY_START:-}" ] && step "Prêt" || step "Prêt. Lance ./start.sh"
