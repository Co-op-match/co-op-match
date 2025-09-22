# Co-op Match Production Deployment Script for Windows
# Usage: .\deploy.ps1 [environment]
# Example: .\deploy.ps1 production

param(
    [string]$Environment = "production"
)

$ProjectName = "coop-match"

Write-Host "🚀 Starting deployment for Co-op Match ($Environment environment)" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green

# Check if Docker and Docker Compose are available
try {
    docker --version | Out-Null
    Write-Host "✅ Docker is available" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

try {
    docker-compose --version | Out-Null
    Write-Host "✅ Docker Compose is available" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker Compose is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

# Create necessary directories
Write-Host "📁 Creating necessary directories..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "./backend/public/uploads" | Out-Null
New-Item -ItemType Directory -Force -Path "./ssl" | Out-Null
New-Item -ItemType Directory -Force -Path "./logs" | Out-Null

# Copy environment-specific configuration
Write-Host "⚙️ Setting up environment configuration..." -ForegroundColor Yellow

if (Test-Path ".env.$Environment") {
    Copy-Item ".env.$Environment" ".env" -Force
    Write-Host "✅ Environment file (.env.$Environment) copied to .env" -ForegroundColor Green
} else {
    Write-Host "⚠️ Warning: No .env.$Environment file found, using existing .env" -ForegroundColor Yellow
}

# Backend environment
if (Test-Path "./backend/.env.$Environment") {
    Copy-Item "./backend/.env.$Environment" "./backend/.env" -Force
    Write-Host "✅ Backend environment file copied" -ForegroundColor Green
}

# Frontend environment
if (Test-Path "./frontend/.env.$Environment") {
    Copy-Item "./frontend/.env.$Environment" "./frontend/.env" -Force
    Write-Host "✅ Frontend environment file copied" -ForegroundColor Green
}

# Stop existing containers
Write-Host "🛑 Stopping existing containers..." -ForegroundColor Yellow
try {
    docker-compose -f "docker-compose.$Environment.yml" down --remove-orphans
} catch {
    Write-Host "⚠️ No existing containers to stop" -ForegroundColor Yellow
}

# Pull latest images
Write-Host "⬇️ Pulling latest base images..." -ForegroundColor Yellow
try {
    docker-compose -f "docker-compose.$Environment.yml" pull --ignore-pull-failures
} catch {
    Write-Host "⚠️ Some images could not be pulled" -ForegroundColor Yellow
}

# Build and start services
Write-Host "🔨 Building and starting services..." -ForegroundColor Yellow
docker-compose -f "docker-compose.$Environment.yml" build --no-cache
docker-compose -f "docker-compose.$Environment.yml" up -d

# Wait for services to be healthy
Write-Host "⏳ Waiting for services to be healthy..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Check service health
Write-Host "🏥 Checking service health..." -ForegroundColor Yellow
$serviceStatus = docker-compose -f "docker-compose.$Environment.yml" ps

if ($serviceStatus -match "unhealthy|exited") {
    Write-Host "❌ Some services are unhealthy:" -ForegroundColor Red
    docker-compose -f "docker-compose.$Environment.yml" ps
    Write-Host "📋 Checking logs..." -ForegroundColor Yellow
    docker-compose -f "docker-compose.$Environment.yml" logs --tail=50
    exit 1
}

# Show running services
Write-Host "✅ Deployment completed successfully!" -ForegroundColor Green
Write-Host "📊 Service Status:" -ForegroundColor Cyan
docker-compose -f "docker-compose.$Environment.yml" ps

Write-Host ""
Write-Host "🌐 Application URLs:" -ForegroundColor Cyan
Write-Host "   Frontend: https://coop-match.online" -ForegroundColor White
Write-Host "   API:      https://api.coop-match.online" -ForegroundColor White
Write-Host "   Health:   https://api.coop-match.online/" -ForegroundColor White

Write-Host ""
Write-Host "📝 Useful commands:" -ForegroundColor Cyan
Write-Host "   View logs:    docker-compose -f docker-compose.$Environment.yml logs -f" -ForegroundColor White
Write-Host "   Stop all:     docker-compose -f docker-compose.$Environment.yml down" -ForegroundColor White
Write-Host "   Restart:      docker-compose -f docker-compose.$Environment.yml restart" -ForegroundColor White
Write-Host "   Shell access: docker-compose -f docker-compose.$Environment.yml exec api sh" -ForegroundColor White

Write-Host ""
Write-Host "🎉 Deployment completed successfully!" -ForegroundColor Green