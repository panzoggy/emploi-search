#!/usr/bin/env bash
# Script UNIQUE de mise à jour : récupère la dernière version de dev, installe les manques,
# reconstruit les images, redémarre, et régénère ACCES.txt. À lancer après chaque push sur dev.
#   ./update.sh
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"
source scripts/lib.sh

BRANCH=dev

step "Mise à jour du code (branche $BRANCH)"
git fetch origin "$BRANCH"
git checkout "$BRANCH" 2>/dev/null || git checkout -B "$BRANCH" "origin/$BRANCH"
git reset --hard "origin/$BRANCH"
say "Version : $(git log --oneline -1)"

step "Vérification de Docker et des prérequis"
if ! docker_ready; then
  say "Docker ou dépendances manquants : installation automatique."
  CALLED_BY_START=1 ./setup.sh
fi
pick_docker

step "Build des manques et redémarrage"
compose --profile public up -d --build

step "Adresses et code d'inscription"
scripts/access.sh

say ""
say "Mise à jour terminée."
