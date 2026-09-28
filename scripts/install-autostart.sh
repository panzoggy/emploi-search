#!/usr/bin/env bash
# Installe (ou met à jour) un service systemd qui relance EmploiSearch au démarrage de la
# machine et régénère ACCES.txt. À lancer avec sudo depuis la racine du repo :
#   sudo ./scripts/install-autostart.sh
set -euo pipefail
[ "$(id -u)" -eq 0 ] || { echo "À lancer avec sudo." >&2; exit 1; }

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUN_USER="${SUDO_USER:-$(id -un)}"
SERVICE=/etc/systemd/system/emploi-search.service

cat > "$SERVICE" <<EOF
[Unit]
Description=EmploiSearch (auto-démarrage + fichier ACCES.txt)
Requires=docker.service
After=docker.service network-online.target
Wants=network-online.target

[Service]
Type=oneshot
RemainAfterExit=yes
User=${RUN_USER}
Group=docker
WorkingDirectory=${REPO_DIR}
ExecStart=${REPO_DIR}/scripts/boot.sh
ExecStop=/usr/bin/docker compose --profile public down
TimeoutStartSec=300

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable --now docker >/dev/null 2>&1 || true
usermod -aG docker "${RUN_USER}" 2>/dev/null || true
systemctl enable emploi-search.service

echo "Service installé et activé : EmploiSearch démarrera à chaque boot,"
echo "et ACCES.txt sera régénéré à la racine du repo."
echo "Pour le lancer tout de suite : sudo systemctl start emploi-search.service"
