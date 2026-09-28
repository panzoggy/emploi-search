#!/usr/bin/env bash
# Attend que l'API soit saine puis (re)génère ACCES.txt à la racine.
# Réutilisé par boot.sh (démarrage machine) et update.sh (mise à jour).
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."
source scripts/lib.sh

pick_docker || { echo "Docker indisponible" >&2; exit 1; }

status=absent
for _ in $(seq 1 90); do
  status=$(dk inspect -f "{{.State.Health.Status}}" emploi-backend 2>/dev/null || echo absent)
  [ "$status" = healthy ] && break
  sleep 2
done

local_addr=$(local_url)
public_addr=$(public_url)
signup=$(env_value SIGNUP_CODE)

cat > ACCES.txt <<EOF
EmploiSearch — accès (généré le $(date "+%Y-%m-%d %H:%M:%S"))

Connexion réseau local : ${local_addr}
Connexion Internet      : ${public_addr:-indisponible (voir : docker logs emploi-tunnel)}
Code d'inscription       : ${signup}

L'adresse Internet (trycloudflare) change à chaque redémarrage.
Fichier régénéré automatiquement à chaque démarrage de la machine et à chaque ./update.sh.
État API à la génération : ${status}
EOF

echo "--- ACCES.txt ---"
cat ACCES.txt
