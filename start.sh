#!/bin/bash
# start.sh - Start EmploiSearch with dependency checks

set -e

PROJECT_DIR="/opt/emploi"
cd "$PROJECT_DIR"

echo "🚀 Starting EmploiSearch..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to install Docker
install_docker() {
    echo -e "${YELLOW}🐳 Installing Docker...${NC}"
    curl -fsSL https://get.docker.com | sh
    sudo usermod -aG docker $USER
    echo -e "${GREEN}✅ Docker installed${NC}"
}

# Function to install Docker Compose
install_docker_compose() {
    echo -e "${YELLOW}🐳 Installing Docker Compose...${NC}"
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo -e "${GREEN}✅ Docker Compose installed${NC}"
}

# Check dependencies
echo "🔍 Checking dependencies..."

if ! command_exists docker; then
    install_docker
fi

if ! command_exists docker-compose; then
    install_docker_compose
fi

# Check if user is in docker group (warn only, don't fail)
if ! groups $USER | grep -q docker; then
    echo -e "${YELLOW}⚠️  User not in docker group. Adding...${NC}"
    sudo usermod -aG docker $USER
    echo -e "${YELLOW}⚠️  You may need to log out and back in, or run: newgrp docker${NC}"
    # Use sudo for docker commands if not in group
    DOCKER_CMD="sudo docker"
    COMPOSE_CMD="sudo docker-compose"
else
    DOCKER_CMD="docker"
    COMPOSE_CMD="docker-compose"
fi

# Create .env if not exists
if [ ! -f backend/.env ]; then
    echo -e "${YELLOW}⚙️  Creating backend/.env from example...${NC}"
    cp backend/.env.example backend/.env
fi

# Create data directory with correct permissions
echo -e "${YELLOW}📁 Setting up data directory...${NC}"
mkdir -p backend/data
# Ensure the directory is writable by the container user (uid 1001)
sudo chown -R 1001:1001 backend/data 2>/dev/null || chown -R 1001:1001 backend/data
chmod -R 755 backend/data

# Create backups directory
mkdir -p backups
sudo chown -R 1001:1001 backups 2>/dev/null || chown -R 1001:1001 backups
chmod -R 755 backups

# Build images first
echo -e "${YELLOW}🔨 Building images...${NC}"
$COMPOSE_CMD build --no-cache

# Start only the backend first to initialize database
echo -e "${YELLOW}🗄️ Starting backend for database initialization...${NC}"
$COMPOSE_CMD up -d backend

# Wait for backend to be ready
echo -e "${YELLOW}⏳ Waiting for backend to be ready...${NC}"
sleep 10

# Run database migrations
echo -e "${YELLOW}🗄️ Running database migrations...${NC}"
if ! $COMPOSE_CMD exec -T backend npx prisma db push; then
    echo -e "${RED}❌ Database migration failed${NC}"
    $COMPOSE_CMD logs backend --tail=50
    exit 1
fi

# Seed database if empty
echo -e "${YELLOW}🌱 Seeding database...${NC}"
if ! $COMPOSE_CMD exec -T backend npx prisma db seed; then
    echo -e "${YELLOW}⚠️  Database seeding failed (may already have data)${NC}"
fi

# Verify database has data
echo -e "${YELLOW}🔍 Verifying database...${NC}"
$COMPOSE_CMD exec -T backend node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.job.count().then(count => {
  console.log('Jobs in database:', count);
  process.exit(0);
}).catch(err => {
  console.error('Database verification failed:', err);
  process.exit(1);
});
"

# Now start all services
echo -e "${YELLOW}🚀 Starting all services...${NC}"
$COMPOSE_CMD up -d

# Wait for services
echo -e "${YELLOW}⏳ Waiting for services to be ready...${NC}"
sleep 10

# Show status
echo -e "${GREEN}✅ EmploiSearch started successfully!${NC}"
SERVER_IP=$(hostname -I | awk '{print $1}')
echo -e "${GREEN}🌐 Frontend: http://$SERVER_IP${NC}"
echo -e "${GREEN}🔧 Backend API: http://$SERVER_IP/api${NC}"
echo ""
$COMPOSE_CMD ps

echo ""
echo -e "${YELLOW}To view logs: $COMPOSE_CMD logs -f${NC}"