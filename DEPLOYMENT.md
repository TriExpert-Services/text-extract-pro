# 🚀 TextExtract Pro - Docker Deployment Guide

## 📋 Table of Contents
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Environment Configuration](#environment-configuration)
- [Docker Commands](#docker-commands)
- [Production Deployment](#production-deployment)
- [Monitoring & Health Checks](#monitoring--health-checks)
- [Troubleshooting](#troubleshooting)
- [Security Considerations](#security-considerations)

## 🔧 Prerequisites

### Required Software
- **Docker** (version 20.10+)
- **Docker Compose** (version 2.0+)
- **curl** (for health checks)
- **bash** (for deployment scripts)

### System Requirements
- **RAM**: 2GB minimum, 4GB recommended
- **CPU**: 2 cores minimum
- **Storage**: 10GB free space
- **Network**: Internet access for API calls

### Installation Commands
```bash
# Install Docker (Ubuntu/Debian)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

## ⚡ Quick Start

### 1. Clone and Setup
```bash
# Navigate to your project directory
cd textextract-pro

# Make scripts executable
chmod +x scripts/*.sh

# Copy environment template
cp .env.example .env
```

### 2. Configure Environment
Edit the `.env` file with your credentials:
```bash
# Required Supabase Configuration
VITE_SUPABASE_URL=https://your-supabase-url.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional OpenAI Configuration
VITE_OPENAI_API_KEY=your_openai_api_key
```

### 3. Deploy Application
```bash
# Standard deployment
./scripts/deploy.sh

# Production deployment with monitoring
./scripts/deploy.sh prod
```

### 4. Verify Deployment
```bash
# Run health checks
./scripts/health-check.sh

# Access application
open http://localhost:8080
```

## 🌍 Environment Configuration

### Required Variables
| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | `https://abc123.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJhbGciOiJIUzI1NiIs...` |

### Optional Variables
| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_OPENAI_API_KEY` | OpenAI API key for text extraction | _None_ |
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Application port | `8080` |

### Environment Files
- `.env` - Main environment configuration
- `.env.example` - Template with dummy values
- `.env.production` - Production-specific overrides

## 🐳 Docker Commands

### Basic Operations
```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Restart services
docker-compose restart

# View running containers
docker-compose ps
```

### Logs and Debugging
```bash
# View all logs
docker-compose logs

# Follow logs in real-time
docker-compose logs -f

# View specific service logs
docker-compose logs textextract-app

# View last 100 lines
docker-compose logs --tail=100
```

### Container Management
```bash
# Access container shell
docker exec -it textextract-pro sh

# Check container stats
docker stats

# Inspect container
docker inspect textextract-pro

# Remove all containers and volumes
docker-compose down -v --remove-orphans
```

## 🏭 Production Deployment

### Load Balancer Setup
```bash
# Deploy with load balancer and monitoring
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### SSL/HTTPS Configuration
1. Obtain SSL certificates (Let's Encrypt recommended)
2. Place certificates in `./ssl/` directory
3. Update nginx configuration for HTTPS

### Scaling Services
```bash
# Scale application instances
docker-compose up -d --scale textextract-app=3

# Check scaled instances
docker-compose ps
```

### Resource Limits
The production setup includes:
- **Memory**: 512MB limit, 256MB reservation
- **CPU**: 0.5 cores limit, 0.25 cores reservation
- **Auto-restart** on failure

## 📊 Monitoring & Health Checks

### Automated Health Checks
```bash
# Run comprehensive health check
./scripts/health-check.sh

# Monitor continuously
watch -n 30 './scripts/health-check.sh'
```

### Health Endpoints
- **Application**: `http://localhost:8080/health`
- **Nginx Status**: `http://localhost:8080/nginx_status`

### Monitoring Features
- **Container health checks** every 30 seconds
- **Automatic restart** on failure
- **Resource usage monitoring**
- **Log error detection**
- **Disk space monitoring**

### Log Management
```bash
# Logs location
ls -la ./logs/

# Rotate logs (recommended for production)
logrotate -f /etc/logrotate.d/nginx
```

## 🔧 Troubleshooting

### Common Issues

#### Container Won't Start
```bash
# Check container logs
docker-compose logs textextract-app

# Verify environment variables
docker-compose config

# Check port conflicts
netstat -tulpn | grep :8080
```

#### Application Not Accessible
```bash
# Verify container is running
docker-compose ps

# Check nginx configuration
docker exec -it textextract-pro nginx -t

# Test internal connectivity
docker exec -it textextract-pro curl http://localhost:8080/health
```

#### High Resource Usage
```bash
# Monitor resource usage
docker stats

# Check container limits
docker inspect textextract-pro | grep -A 10 Resources

# Restart container
docker-compose restart textextract-app
```

### Debug Mode
```bash
# Run with debug output
DEBUG=1 docker-compose up

# Enable verbose nginx logs
# Edit nginx.conf and add: error_log /var/log/nginx/error.log debug;
```

### Performance Optimization
```bash
# Clear Docker cache
docker system prune -a

# Optimize images
docker image prune

# Check disk usage
docker system df
```

## 🔐 Security Considerations

### Network Security
- Application runs on port **8080** (not default 3000)
- Internal network isolation with Docker networks
- Nginx security headers enabled
- CORS protection configured

### Container Security
- **Non-root user** execution
- **Read-only filesystem** where possible
- **Resource limits** to prevent DoS
- **Health checks** for failure detection

### Data Protection
- Environment variables for sensitive data
- Supabase RLS (Row Level Security) enabled
- API key validation and rotation
- Secure file upload handling

### SSL/TLS (Production)
```bash
# Generate self-signed certificate (development only)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/nginx.key -out ssl/nginx.crt

# For production, use Let's Encrypt:
certbot --nginx -d yourdomain.com
```

### Regular Maintenance
```bash
# Update base images
docker-compose pull

# Security scan
docker scout cves textextract-pro

# Update dependencies
npm audit fix
```

## 📈 Production Checklist

- [ ] SSL certificates configured
- [ ] Environment variables secured
- [ ] Resource limits set
- [ ] Monitoring enabled
- [ ] Backup strategy implemented
- [ ] Log rotation configured
- [ ] Health checks working
- [ ] Security headers enabled
- [ ] API rate limiting configured
- [ ] Database connection pooling enabled

## 🆘 Support

### Logs Location
- **Application logs**: `./logs/access.log`, `./logs/error.log`
- **Container logs**: `docker-compose logs`

### Useful Commands
```bash
# Complete restart
docker-compose down && docker-compose up -d

# Clean deployment
docker-compose down -v && ./scripts/deploy.sh

# Export configuration
docker-compose config > docker-config-backup.yml
```

For additional support, check the application logs and health check output first, then refer to the Docker and nginx documentation for advanced troubleshooting.