#!/bin/bash

# Co-op Match Production Deployment Script
# Usage: ./deploy.sh [environment]
# Example: ./deploy.sh production

set -e  # Exit on any error

ENVIRONMENT=${1:-production}
PROJECT_NAME="coop-match"

echo "🚀 Starting deployment for Co-op Match ($ENVIRONMENT environment)"
echo "=================================================="

# Check if Docker and Docker Compose are available
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed or not in PATH"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed or not in PATH"
    exit 1
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p ./backend/public/uploads
mkdir -p ./ssl
mkdir -p ./logs

# Copy environment-specific configuration
echo "⚙️ Setting up environment configuration..."
if [ -f ".env.$ENVIRONMENT" ]; then
    cp ".env.$ENVIRONMENT" ".env"
    echo "✅ Environment file (.env.$ENVIRONMENT) copied to .env"
else
    echo "⚠️ Warning: No .env.$ENVIRONMENT file found, using existing .env"
fi

# Backend environment
if [ -f "./backend/.env.$ENVIRONMENT" ]; then
    cp "./backend/.env.$ENVIRONMENT" "./backend/.env"
    echo "✅ Backend environment file copied"
fi

# Frontend environment  
if [ -f "./frontend/.env.$ENVIRONMENT" ]; then
    cp "./frontend/.env.$ENVIRONMENT" "./frontend/.env"
    echo "✅ Frontend environment file copied"
fi

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.$ENVIRONMENT.yml down --remove-orphans || true

# Pull latest images (if using external images)
echo "⬇️ Pulling latest base images..."
docker-compose -f docker-compose.$ENVIRONMENT.yml pull --ignore-pull-failures || true

# Build and start services
echo "🔨 Building and starting services..."
docker-compose -f docker-compose.$ENVIRONMENT.yml build --no-cache
docker-compose -f docker-compose.$ENVIRONMENT.yml up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Check service health
echo "🏥 Checking service health..."
if docker-compose -f docker-compose.$ENVIRONMENT.yml ps | grep -q "unhealthy\|exited"; then
    echo "❌ Some services are unhealthy:"
    docker-compose -f docker-compose.$ENVIRONMENT.yml ps
    echo "📋 Checking logs..."
    docker-compose -f docker-compose.$ENVIRONMENT.yml logs --tail=50
    exit 1
fi

# Show running services
echo "✅ Deployment completed successfully!"
echo "📊 Service Status:"
docker-compose -f docker-compose.$ENVIRONMENT.yml ps

echo ""
echo "🌐 Application URLs:"
echo "   Frontend: https://coop-match.online"
echo "   API:      https://api.coop-match.online"
echo "   Health:   https://api.coop-match.online/"

echo ""
echo "📝 Useful commands:"
echo "   View logs:    docker-compose -f docker-compose.$ENVIRONMENT.yml logs -f"
echo "   Stop all:     docker-compose -f docker-compose.$ENVIRONMENT.yml down"
echo "   Restart:      docker-compose -f docker-compose.$ENVIRONMENT.yml restart"
echo "   Shell access: docker-compose -f docker-compose.$ENVIRONMENT.yml exec api sh"

echo ""
echo "🎉 Deployment completed successfully!"