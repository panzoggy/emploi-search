#!/bin/bash
# restart.sh - Restart EmploiSearch

set -e

PROJECT_DIR="/opt/emploi"
cd "$PROJECT_DIR"

echo "🔄 Restarting EmploiSearch..."

# Detect docker command
if groups $USER | grep -q docker; then
    COMPOSE_CMD="docker-compose"
else
    COMPOSE_CMD="sudo docker-compose"
fi

$COMPOSE_CMD restart

echo -e "\033[0;32m✅ EmploiSearch restarted\033[0m"
$COMPOSE_CMD ps