#!/bin/bash
# Deployment script for Debian server (192.168.1.194)
# Run this script on the Debian server to deploy the application

set -e

echo "🚀 Starting deployment of EmploiSearch..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="/opt/emploi"
BACKUP_DIR="/opt/emploi/backups"
DOCKER_COMPOSE_FILE="docker-compose.yml"

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root or with sudo${NC}"
    exit 1
fi

# Update system
echo -e "${YELLOW}📦 Updating system packages...${NC}"
apt-get update && apt-get upgrade -y

# Install Docker if not present
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}🐳 Installing Docker...${NC}"
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
fi

# Install Docker Compose if not present
if ! command -v docker-compose &> /dev/null; then
    echo -e "${YELLOW}🐳 Installing Docker Compose...${NC}"
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# Create project directory
echo -e "${YELLOW}📁 Creating project directory...${NC}"
mkdir -p $PROJECT_DIR
mkdir -p $BACKUP_DIR

# Copy project files (assuming they're in the current directory)
echo -e "${YELLOW}📋 Copying project files...${NC}"
cp -r . $PROJECT_DIR/
cd $PROJECT_DIR

# Create .env file from example if not exists
if [ ! -f backend/.env ]; then
    echo -e "${YELLOW}⚙️ Creating .env file...${NC}"
    cp backend/.env.example backend/.env
    echo -e "${GREEN}✅ Please edit backend/.env with your configuration${NC}"
fi

# Set permissions
chown -R 1001:1001 $PROJECT_DIR/backend/data 2>/dev/null || true
chmod -R 755 $PROJECT_DIR/backend/data 2>/dev/null || true

# Build and start containers
echo -e "${YELLOW}🔨 Building and starting containers...${NC}"
docker-compose -f $DOCKER_COMPOSE_FILE down --remove-orphans
docker-compose -f $DOCKER_COMPOSE_FILE build --no-cache
docker-compose -f $DOCKER_COMPOSE_FILE up -d

# Wait for services to be healthy
echo -e "${YELLOW}⏳ Waiting for services to be ready...${NC}"
sleep 10

# Run database migrations
echo -e "${YELLOW}🗄️ Running database migrations...${NC}"
docker-compose -f $DOCKER_COMPOSE_FILE exec -T backend npx prisma db push

# Seed database (optional)
echo -e "${YELLOW}🌱 Seeding database...${NC}"
docker-compose -f $DOCKER_COMPOSE_FILE exec -T backend npx prisma db seed || true

# Check service status
echo -e "${YELLOW}🔍 Checking service status...${NC}"
docker-compose -f $DOCKER_COMPOSE_FILE ps

# Show logs
echo -e "${YELLOW}📜 Recent logs:${NC}"
docker-compose -f $DOCKER_COMPOSE_FILE logs --tail=20

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo -e "${GREEN}🌐 Application available at: http://192.168.1.194${NC}"
echo -e "${GREEN}🔧 Backend API at: http://192.168.1.194/api${NC}"
echo ""
echo -e "${YELLOW}Useful commands:${NC}"
echo "  View logs:     docker-compose -f $PROJECT_DIR/$DOCKER_COMPOSE_FILE logs -f"
echo "  Restart:       docker-compose -f $PROJECT_DIR/$DOCKER_COMPOSE_FILE restart"
echo "  Stop:          docker-compose -f $PROJECT_DIR/$DOCKER_COMPOSE_FILE down"
echo "  Update:        cd $PROJECT_DIR && git pull && ./deploy.sh"
echo "  Backup DB:     docker-compose -f $PROJECT_DIR/$DOCKER_COMPOSE_FILE exec backend sqlite3 /app/data/dev.db .dump > backup_$(date +%Y%m%d).sql"