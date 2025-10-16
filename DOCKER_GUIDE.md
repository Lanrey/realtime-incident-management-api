# Docker Deployment Guide

Complete guide for running the Inventory Management System using Docker.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Development Setup](#development-setup)
- [Production Deployment](#production-deployment)
- [Docker Commands Reference](#docker-commands-reference)
- [Troubleshooting](#troubleshooting)
- [Architecture Overview](#architecture-overview)

---

## Prerequisites

### Required Software

- **Docker**: 24.0 or higher
- **Docker Compose**: 2.20 or higher

### Installation

**macOS:**
```bash
brew install docker docker-compose
```

**Linux:**
```bash
# Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

**Windows:**
Download and install Docker Desktop from [docker.com](https://www.docker.com/products/docker-desktop)

---

## Quick Start

### Run Complete Application (All Services)

```bash
# From project root directory
cd /path/to/Souk

# Start all services (PostgreSQL, Redis, RabbitMQ, Backend, Frontend)
docker-compose up -d

# View logs
docker-compose logs -f

# Check service status
docker-compose ps
```

**Services will be available at:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- RabbitMQ Management: http://localhost:15672 (guest/guest)
- PostgreSQL: localhost:5432
- Redis: localhost:6379

### Stop All Services

```bash
docker-compose down

# Remove volumes (WARNING: deletes all data)
docker-compose down -v
```

---

## Development Setup

### Option 1: Run Full Stack in Docker

```bash
# Start all services including database infrastructure
docker-compose up -d

# View logs for specific service
docker-compose logs -f backend
docker-compose logs -f frontend

# Access container shell
docker-compose exec backend sh
docker-compose exec postgres psql -U postgres -d inventory_db
```

### Option 2: Run Only Infrastructure (Develop Locally)

```bash
# Start only PostgreSQL, Redis, and RabbitMQ
cd inventory-backend
docker-compose -f docker-compose.dev.yml up -d postgres redis rabbitmq

# Then run backend locally
npm install
cp .env.example .env
npm run dev

# In another terminal, run frontend locally
cd ../inventory-frontend
npm install
npm run dev
```

### Option 3: Backend Only with Infrastructure

```bash
cd inventory-backend
docker-compose -f docker-compose.dev.yml up -d
```

### Hot Reload Development

The development Docker setup includes volume mounts for hot reload:

```yaml
volumes:
  - ./inventory-backend:/app    # Backend code
  - ./inventory-frontend:/app   # Frontend code
  - /app/node_modules           # Preserve node_modules in container
```

Changes to source code will automatically reload the application.

---

## Production Deployment

### 1. Prepare Environment Variables

Create `.env` file in project root:

```bash
# Database
POSTGRES_USER=admin
POSTGRES_PASSWORD=your_secure_password_here
POSTGRES_DB=inventory_db

# Redis
REDIS_PASSWORD=your_redis_password_here

# RabbitMQ
RABBITMQ_USER=admin
RABBITMQ_PASSWORD=your_rabbitmq_password_here

# Application
STOCK_CHECK_INTERVAL=5
```

**Security Note:** Use strong passwords and never commit `.env` to version control!

### 2. Build and Run Production

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Start production stack
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Check health status
docker-compose -f docker-compose.prod.yml ps
```

### 3. Database Migrations

```bash
# Run migrations on production database
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy

# Seed initial data (optional)
docker-compose -f docker-compose.prod.yml exec backend npx prisma db seed
```

### 4. Scaling Services

```bash
# Scale backend to 4 instances
docker-compose -f docker-compose.prod.yml up -d --scale backend=4

# Scale frontend to 2 instances with load balancer
docker-compose -f docker-compose.prod.yml up -d --scale frontend=2
```

### 5. Production Monitoring

```bash
# View resource usage
docker stats

# View service health
docker-compose -f docker-compose.prod.yml ps

# Check backend health
curl http://localhost:3000/health

# Check frontend health
curl http://localhost/health
```

---

## Docker Commands Reference

### Container Management

```bash
# Start services
docker-compose up -d                    # Detached mode
docker-compose up --build               # Rebuild images
docker-compose up -d backend            # Start specific service

# Stop services
docker-compose stop                     # Stop without removing
docker-compose down                     # Stop and remove containers
docker-compose down -v                  # Stop and remove volumes

# Restart services
docker-compose restart                  # Restart all
docker-compose restart backend          # Restart specific service
```

### Logs and Debugging

```bash
# View logs
docker-compose logs                     # All services
docker-compose logs -f backend          # Follow specific service
docker-compose logs --tail=100 backend  # Last 100 lines

# Execute commands in container
docker-compose exec backend sh          # Open shell
docker-compose exec backend npm run prisma:studio
docker-compose exec postgres psql -U postgres -d inventory_db

# Copy files
docker cp backend:/app/logs ./local-logs
docker cp ./config.json backend:/app/
```

### Database Operations

```bash
# Access PostgreSQL
docker-compose exec postgres psql -U postgres -d inventory_db

# Create database backup
docker-compose exec postgres pg_dump -U postgres inventory_db > backup.sql

# Restore database
docker-compose exec -T postgres psql -U postgres -d inventory_db < backup.sql

# Run Prisma commands
docker-compose exec backend npx prisma migrate dev
docker-compose exec backend npx prisma studio
docker-compose exec backend npx prisma db seed
```

### Image Management

```bash
# Build images
docker-compose build                    # Build all
docker-compose build backend            # Build specific service
docker-compose build --no-cache         # Build without cache

# List images
docker images

# Remove unused images
docker image prune -a

# Tag and push to registry
docker tag inventory-backend:latest registry.example.com/inventory-backend:v1.0.0
docker push registry.example.com/inventory-backend:v1.0.0
```

### Volume Management

```bash
# List volumes
docker volume ls

# Inspect volume
docker volume inspect souk_postgres_data

# Remove unused volumes
docker volume prune

# Backup volume
docker run --rm -v souk_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup.tar.gz -C /data .

# Restore volume
docker run --rm -v souk_postgres_data:/data -v $(pwd):/backup alpine tar xzf /backup/postgres_backup.tar.gz -C /data
```

---

## Troubleshooting

### Common Issues

#### 1. Port Already in Use

```bash
# Find process using port
lsof -i :3000
lsof -i :5432

# Kill process
kill -9 <PID>

# Or change port in docker-compose.yml
ports:
  - "3001:3000"  # Use 3001 instead
```

#### 2. Database Connection Failed

```bash
# Check if PostgreSQL is healthy
docker-compose ps

# View PostgreSQL logs
docker-compose logs postgres

# Test connection
docker-compose exec backend npx prisma db pull

# Verify DATABASE_URL
docker-compose exec backend env | grep DATABASE_URL
```

#### 3. Container Won't Start

```bash
# View error logs
docker-compose logs backend

# Check container status
docker-compose ps -a

# Rebuild with no cache
docker-compose build --no-cache backend
docker-compose up -d backend
```

#### 4. Out of Memory

```bash
# Check container resource usage
docker stats

# Increase Docker memory limit in Docker Desktop settings
# Or add resource limits in docker-compose.yml:
deploy:
  resources:
    limits:
      memory: 2G
```

#### 5. Volume Permission Issues

```bash
# Fix permissions
docker-compose exec backend chown -R node:node /app

# Or run as root temporarily
docker-compose exec -u root backend sh
```

#### 6. Hot Reload Not Working

```bash
# Ensure volumes are mounted correctly
docker-compose config | grep volumes

# Restart with clean build
docker-compose down
docker-compose up --build -d
```

### Health Checks

```bash
# Backend health
curl http://localhost:3000/health

# Frontend health
curl http://localhost:5173/

# PostgreSQL health
docker-compose exec postgres pg_isready -U postgres

# Redis health
docker-compose exec redis redis-cli ping

# RabbitMQ health
docker-compose exec rabbitmq rabbitmq-diagnostics ping
```

### Performance Optimization

```bash
# Enable BuildKit for faster builds
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

# Use build cache
docker-compose build --parallel

# Clean up system
docker system prune -a --volumes
```

---

## Architecture Overview

### Container Network Topology

```
┌──────────────────────────────────────────────────────────┐
│                    Host Machine                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │           Docker Network: inventory-network        │ │
│  │                                                     │ │
│  │  ┌───────────┐  ┌───────────┐  ┌──────────────┐  │ │
│  │  │ Frontend  │  │  Backend  │  │  PostgreSQL  │  │ │
│  │  │   :5173   │◄─┤   :3000   │◄─┤    :5432     │  │ │
│  │  └─────┬─────┘  └─────┬─────┘  └──────────────┘  │ │
│  │        │              │                           │ │
│  │        │              │         ┌──────────────┐  │ │
│  │        │              └────────►│    Redis     │  │ │
│  │        │                        │    :6379     │  │ │
│  │        │                        └──────────────┘  │ │
│  │        │                                          │ │
│  │        │                        ┌──────────────┐  │ │
│  │        └───────────────────────►│  RabbitMQ    │  │ │
│  │                                 │  :5672       │  │ │
│  │                                 │  :15672      │  │ │
│  │                                 └──────────────┘  │ │
│  └────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

### Volume Mounts

**Development Mode:**
- Source code mounted for hot reload
- Node modules persisted in anonymous volumes
- Database data in named volumes

**Production Mode:**
- No source code mounts
- Compiled code baked into image
- All data in named volumes with backup strategy

### Multi-Stage Builds

Both Dockerfile use multi-stage builds for optimization:

1. **Development**: Full dev dependencies, source maps
2. **Build**: Compile TypeScript, generate Prisma client
3. **Production**: Minimal runtime, no dev dependencies

---

## Additional Resources

### Useful Links

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [Prisma Docker Guide](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-docker)
- [Fastify Docker Best Practices](https://www.fastify.io/docs/latest/Guides/Recommendations/#docker-and-containerization)

### Production Checklist

- [ ] Set strong passwords in `.env`
- [ ] Enable SSL/TLS certificates
- [ ] Configure firewall rules
- [ ] Set up automated backups
- [ ] Configure log aggregation
- [ ] Set up monitoring (Prometheus/Grafana)
- [ ] Configure alerts
- [ ] Document disaster recovery plan
- [ ] Test backup restoration
- [ ] Set up CI/CD pipeline

---

## Support

For issues or questions:
1. Check logs: `docker-compose logs -f`
2. Verify health: `docker-compose ps`
3. Review this guide's troubleshooting section
4. Open issue on GitHub repository
