#!/bin/bash

# LogPilot Development Setup Script
echo "🚀 Setting up LogPilot for development..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker and try again.${NC}"
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed. Please install Docker Compose and try again.${NC}"
    exit 1
fi

echo -e "${BLUE}📦 Setting up environment files...${NC}"

# Setup backend environment
if [ ! -f logBackend/.env ]; then
    echo -e "${YELLOW}⚠️  Creating backend .env file...${NC}"
    cp logBackend/env.example logBackend/.env
    echo -e "${GREEN}✅ Backend .env file created${NC}"
else
    echo -e "${GREEN}✅ Backend .env file already exists${NC}"
fi

echo -e "${BLUE}🐳 Starting Docker services...${NC}"

# Stop any existing containers
docker-compose down

# Build and start services
docker-compose up -d --build

echo -e "${BLUE}⏳ Waiting for services to be ready...${NC}"

# Wait for PostgreSQL to be ready
echo -e "${YELLOW}🔍 Waiting for PostgreSQL...${NC}"
timeout=60
counter=0
while ! docker-compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; do
    if [ $counter -ge $timeout ]; then
        echo -e "${RED}❌ PostgreSQL failed to start within $timeout seconds${NC}"
        exit 1
    fi
    sleep 1
    counter=$((counter + 1))
done

# Wait for backend to be ready
echo -e "${YELLOW}🔍 Waiting for backend API...${NC}"
timeout=60
counter=0
while ! curl -s http://localhost:8000/ > /dev/null; do
    if [ $counter -ge $timeout ]; then
        echo -e "${RED}❌ Backend API failed to start within $timeout seconds${NC}"
        docker-compose logs backend
        exit 1
    fi
    sleep 1
    counter=$((counter + 1))
done

echo -e "${GREEN}✅ All services are running!${NC}"

# Display service status
echo -e "\n${BLUE}📊 Service Status:${NC}"
docker-compose ps

# Display useful information
echo -e "\n${GREEN}🎉 LogPilot is ready for development!${NC}"
echo -e "\n${BLUE}🔗 Available endpoints:${NC}"
echo -e "   • Backend API: ${YELLOW}http://localhost:8000${NC}"
echo -e "   • Health check: ${YELLOW}http://localhost:8000/${NC}"
echo -e "   • API docs: ${YELLOW}http://localhost:8000/api/v1${NC}"
echo -e "   • PostgreSQL: ${YELLOW}localhost:5432${NC}"
echo -e "   • Redis: ${YELLOW}localhost:6379${NC}"

echo -e "\n${BLUE}🛠️  Management tools (optional):${NC}"
echo -e "   • Start pgAdmin: ${YELLOW}docker-compose --profile tools up pgadmin${NC}"
echo -e "   • pgAdmin URL: ${YELLOW}http://localhost:5050${NC} (admin@logpilot.com / admin)"
echo -e "   • Redis Commander: ${YELLOW}docker-compose --profile tools up redis-commander${NC}"
echo -e "   • Redis Commander URL: ${YELLOW}http://localhost:8081${NC}"

echo -e "\n${BLUE}📝 Quick test commands:${NC}"
echo -e "   • View logs: ${YELLOW}docker-compose logs -f${NC}"
echo -e "   • Health check: ${YELLOW}curl http://localhost:8000/${NC}"
echo -e "   • Stop services: ${YELLOW}docker-compose down${NC}"
echo -e "   • Database shell: ${YELLOW}docker-compose exec postgres psql -U postgres -d logpilot${NC}"

echo -e "\n${GREEN}🚀 The log generator is automatically creating sample data!${NC}"
echo -e "   View generator logs: ${YELLOW}docker-compose logs -f log-generator${NC}"

echo -e "\n${BLUE}📖 Next steps:${NC}"
echo -e "   1. Register a user: see README.md for curl examples"
echo -e "   2. Get authentication token"
echo -e "   3. Start exploring the API endpoints"
echo -e "   4. Check the generated metrics and anomalies"

echo -e "\n${GREEN}✨ Happy logging!${NC}"
