#!/bin/bash
# start.sh — Lance EmploiSearch avec vérification des dépendances

set -e

# Détecter le répertoire du script (fonctionne partout, pas seulement /opt/emploi)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 Démarrage d'EmploiSearch...${NC}"
echo -e "${BLUE}   Répertoire: $SCRIPT_DIR${NC}"
echo ""

# ─── Fonctions utilitaires ────────────────────────────────────────────────────

command_exists() { command -v "$1" >/dev/null 2>&1; }

install_docker() {
  echo -e "${YELLOW}🐳 Installation de Docker...${NC}"
  curl -fsSL https://get.docker.com | sh
  sudo usermod -aG docker "$USER" 2>/dev/null || true
  echo -e "${GREEN}✅ Docker installé${NC}"
}

# Choisir la commande Docker Compose (v2 ou v1)
get_compose_cmd() {
  if docker compose version >/dev/null 2>&1; then
    echo "docker compose"
  elif command_exists docker-compose; then
    echo "docker-compose"
  else
    return 1
  fi
}

install_docker_compose() {
  echo -e "${YELLOW}🐳 Installation de Docker Compose...${NC}"
  COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/')
  sudo curl -L "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" \
    -o /usr/local/bin/docker-compose
  sudo chmod +x /usr/local/bin/docker-compose
  echo -e "${GREEN}✅ Docker Compose installé${NC}"
}

# ─── Vérification des dépendances ────────────────────────────────────────────

echo -e "${YELLOW}🔍 Vérification des dépendances...${NC}"

# Docker
if ! command_exists docker; then
  install_docker
fi

# Vérifier que Docker tourne
if ! docker info >/dev/null 2>&1; then
  echo -e "${YELLOW}⚠️  Démarrage du service Docker...${NC}"
  sudo systemctl start docker 2>/dev/null || sudo service docker start 2>/dev/null || true
  sleep 3
fi

# Docker Compose
if ! get_compose_cmd >/dev/null 2>&1; then
  install_docker_compose
fi

COMPOSE_CMD=$(get_compose_cmd)
echo -e "${GREEN}✅ Docker: $(docker --version)${NC}"
echo -e "${GREEN}✅ Compose: $COMPOSE_CMD${NC}"

# Vérifier les droits Docker
if ! docker ps >/dev/null 2>&1; then
  echo -e "${YELLOW}⚠️  Droits insuffisants, utilisation de sudo...${NC}"
  COMPOSE_CMD="sudo $COMPOSE_CMD"
fi

# ─── Configuration ────────────────────────────────────────────────────────────

# Créer .env backend si absent
if [ ! -f backend/.env ]; then
  echo -e "${YELLOW}⚙️  Création de backend/.env depuis l'exemple...${NC}"
  cp backend/.env.example backend/.env

  # Détecter l'IP du serveur et la mettre dans .env
  SERVER_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "localhost")
  sed -i "s|FRONTEND_URL=http://localhost|FRONTEND_URL=http://$SERVER_IP|g" backend/.env
  echo -e "${YELLOW}   IP détectée: $SERVER_IP (modifiable dans backend/.env)${NC}"
fi

# Créer les répertoires de données
echo -e "${YELLOW}📁 Préparation des répertoires...${NC}"
mkdir -p backend/data backups
chmod -R 755 backend/data backups 2>/dev/null || true
# Essayer de chown pour l'uid 1001 (user nodejs dans le container)
sudo chown -R 1001:1001 backend/data backups 2>/dev/null || \
  chown -R 1001:1001 backend/data backups 2>/dev/null || true

# ─── Build ────────────────────────────────────────────────────────────────────

echo ""
echo -e "${YELLOW}🔨 Construction des images Docker...${NC}"
$COMPOSE_CMD build

# ─── Démarrage ───────────────────────────────────────────────────────────────

echo ""
echo -e "${YELLOW}🗄️  Démarrage du backend...${NC}"
$COMPOSE_CMD up -d backend

# Attendre que le backend soit prêt
echo -e "${YELLOW}⏳ Attente que le backend soit prêt (max 60s)...${NC}"
for i in $(seq 1 12); do
  if $COMPOSE_CMD exec -T backend wget -q --spider http://127.0.0.1:4000/api/health 2>/dev/null; then
    echo -e "${GREEN}✅ Backend prêt!${NC}"
    break
  fi
  echo -n "."
  sleep 5
done
echo ""

# Migrations DB
echo -e "${YELLOW}🗄️  Migrations de la base de données...${NC}"
if ! $COMPOSE_CMD exec -T backend npx prisma db push --accept-data-loss; then
  echo -e "${RED}❌ Échec des migrations${NC}"
  $COMPOSE_CMD logs backend --tail=50
  exit 1
fi
echo -e "${GREEN}✅ Base de données initialisée${NC}"

# Seed initial
echo -e "${YELLOW}🌱 Initialisation des données...${NC}"
$COMPOSE_CMD exec -T backend node -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.user.upsert({
  where: { email: 'personal@local' },
  update: {},
  create: { id: 'personal-user', email: 'personal@local', name: 'Personal User' }
}).then(() => {
  console.log('✅ Utilisateur par défaut créé');
  process.exit(0);
}).catch(e => { console.error(e); process.exit(1); });
" 2>/dev/null || echo -e "${YELLOW}⚠️  Seed ignoré (données déjà présentes)${NC}"

# Démarrer tout
echo ""
echo -e "${YELLOW}🚀 Démarrage de tous les services...${NC}"
$COMPOSE_CMD up -d

# Attendre
sleep 5

# ─── Résumé ───────────────────────────────────────────────────────────────────

echo ""
SERVER_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "localhost")
echo -e "${GREEN}╔════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║        ✅ EmploiSearch démarré!            ║${NC}"
echo -e "${GREEN}╠════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║  🌐 Interface:  http://$SERVER_IP          ${NC}"
echo -e "${GREEN}║  🔧 API:        http://$SERVER_IP/api      ${NC}"
echo -e "${GREEN}║  ❤️  Health:    http://$SERVER_IP/api/health${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════╝${NC}"
echo ""
$COMPOSE_CMD ps
echo ""
echo -e "${YELLOW}Logs: $COMPOSE_CMD logs -f${NC}"
echo -e "${YELLOW}Stop: ./stop.sh${NC}"
