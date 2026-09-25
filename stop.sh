#!/bin/bash
# stop.sh - Stop EmploiSearch

set -e

PROJECT_DIR="/opt/emploi"
cd "$PROJECT_DIR"

echo "🛑 Stopping EmploiSearch..."

# Detect docker command
if groups $USER | grep -q docker; then
    COMPOSE_CMD="docker-compose"
else
    COMPOSE_CMD="sudo docker-compose"
fi

$COMPOSE_CMD down

echo -e "\033[0;32m✅ EmploiSearch stopped\033[0m"