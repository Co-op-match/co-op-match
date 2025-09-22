# Co-op Match Deployment Guide

## 🌐 Production Domains

- **Frontend**: https://coop-match.online
- **API Backend**: https://api.coop-match.online

## 🚀 Quick Deployment

### Prerequisites

1. **Docker & Docker Compose** installed
2. **SSL Certificates** for both domains placed in `./ssl/` directory:
   - `coop-match.online.crt` and `coop-match.online.key`
   - `api.coop-match.online.crt` and `api.coop-match.online.key`

### One-Command Deployment

**Linux/macOS:**
```bash
chmod +x deploy.sh
./deploy.sh production
```

**Windows (PowerShell):**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\deploy.ps1 production
```

### Manual Deployment

```bash
# Copy environment configurations
cp .env.production .env
cp backend/.env.production backend/.env
cp frontend/.env.production frontend/.env

# Deploy with Docker Compose
docker-compose -f docker-compose.production.yml up -d --build
```

## 📋 Environment Configuration

### Backend (.env.production)
```env
CORS_ORIGIN=https://coop-match.online
PORT=8080
API_BASE_URL=https://api.coop-match.online
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=coopmatch4@gmail.com
SMTP_PASSWORD=gbje dwdb dchl zcyx
FROM_EMAIL=coopmatch4@gmail.com
```

### Frontend (.env.production)
```env
VITE_API_BASE_URL=https://api.coop-match.online
VITE_ASSET_BASE_URL=https://api.coop-match.online
VITE_WS_BASE_URL=wss://api.coop-match.online
VITE_ENVIRONMENT=production
```

## 🏗️ Architecture

```
                     ┌─────────────────┐
                     │   Nginx Proxy   │
                     │   (Port 80/443) │
                     └─────────┬───────┘
                               │
           ┌───────────────────┼───────────────────┐
           │                   │                   │
           ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   Frontend      │ │   Backend API   │ │   Static Files  │
│ (coop-match.    │ │ (api.coop-      │ │   & Uploads     │
│  online)        │ │  match.online)  │ │                 │
│ Port: 3000      │ │ Port: 8080      │ │                 │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

## 🔧 Service Management

### View Logs
```bash
# All services
docker-compose -f docker-compose.production.yml logs -f

# Specific service
docker-compose -f docker-compose.production.yml logs -f api
docker-compose -f docker-compose.production.yml logs -f web
docker-compose -f docker-compose.production.yml logs -f nginx
```

### Restart Services
```bash
# Restart all
docker-compose -f docker-compose.production.yml restart

# Restart specific service
docker-compose -f docker-compose.production.yml restart api
```

### Access Service Shell
```bash
# Backend shell
docker-compose -f docker-compose.production.yml exec api sh

# Frontend shell  
docker-compose -f docker-compose.production.yml exec web sh
```

### Stop Services
```bash
docker-compose -f docker-compose.production.yml down
```

## 🔐 SSL Certificate Setup

### Using Certbot (Let's Encrypt)
```bash
# Install certbot
sudo apt-get update
sudo apt-get install certbot

# Generate certificates
sudo certbot certonly --standalone -d coop-match.online -d www.coop-match.online
sudo certbot certonly --standalone -d api.coop-match.online

# Copy to ssl directory
sudo cp /etc/letsencrypt/live/coop-match.online/fullchain.pem ./ssl/coop-match.online.crt
sudo cp /etc/letsencrypt/live/coop-match.online/privkey.pem ./ssl/coop-match.online.key
sudo cp /etc/letsencrypt/live/api.coop-match.online/fullchain.pem ./ssl/api.coop-match.online.crt
sudo cp /etc/letsencrypt/live/api.coop-match.online/privkey.pem ./ssl/api.coop-match.online.key
```

### Certificate Renewal
```bash
# Add to crontab for auto-renewal
0 12 * * * /usr/bin/certbot renew --quiet
```

## 🎯 Health Checks

### API Health
```bash
curl -f https://api.coop-match.online/
```

### Frontend Health
```bash
curl -f https://coop-match.online/
```

### Service Status
```bash
docker-compose -f docker-compose.production.yml ps
```

## 🚨 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Check `CORS_ORIGIN` in backend `.env`
   - Verify Nginx proxy headers

2. **SSL Certificate Errors**
   - Ensure certificates are in `./ssl/` directory
   - Check certificate validity: `openssl x509 -in ./ssl/coop-match.online.crt -text -noout`

3. **Database Connection Issues**
   - Check if SQLite file exists: `./backend/co-op-match.db`
   - Verify volume mounts in docker-compose

4. **Service Not Starting**
   - Check logs: `docker-compose -f docker-compose.production.yml logs [service-name]`
   - Verify port conflicts
   - Check environment variables

### Debug Commands
```bash
# Check container status
docker ps -a

# View service logs
docker logs coop-match-api
docker logs coop-match-web
docker logs coop-match-nginx

# Test network connectivity
docker exec coop-match-nginx ping api
docker exec coop-match-nginx ping web
```

## 📊 Monitoring

### Log Files Location
- Nginx: `/var/log/nginx/` (inside nginx container)
- Application logs: Use `docker-compose logs`

### Performance Monitoring
```bash
# Container resource usage
docker stats

# Service response times
curl -w "@curl-format.txt" -o /dev/null -s "https://api.coop-match.online/"
```

## 🔄 Updates & Maintenance

### Application Update
```bash
# Pull latest code
git pull origin main

# Rebuild and deploy
./deploy.sh production
```

### Database Backup
```bash
# Create backup
docker exec coop-match-api cp /app/co-op-match.db /app/backup-$(date +%Y%m%d_%H%M%S).db

# Copy backup to host
docker cp coop-match-api:/app/backup-$(date +%Y%m%d_%H%M%S).db ./backups/
```

---

## 💡 Additional Notes

- **Rate Limiting**: Configured in Nginx (10 req/s for API, 5 req/m for auth)
- **File Uploads**: Maximum 100MB per file
- **Security Headers**: Applied via Nginx configuration
- **Compression**: Gzip enabled for static files
- **Caching**: 1 year cache for static assets, 1 month for uploads

For support, please check the application logs first and refer to this documentation.