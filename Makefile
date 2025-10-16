# Makefile for Inventory Management System
# Provides convenient shortcuts for Docker operations

.PHONY: help build up down logs restart clean prune dev prod backend-only backup restore test

# Default target
help:
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo "  Inventory Management System - Docker Commands"
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo ""
	@echo "Development Commands:"
	@echo "  make dev           - Start development environment"
	@echo "  make backend-only  - Start only backend infrastructure"
	@echo "  make logs          - View logs (all services)"
	@echo "  make logs-backend  - View backend logs"
	@echo "  make logs-frontend - View frontend logs"
	@echo "  make shell-backend - Access backend shell"
	@echo "  make shell-db      - Access PostgreSQL shell"
	@echo ""
	@echo "Production Commands:"
	@echo "  make prod          - Start production environment"
	@echo "  make prod-build    - Build production images"
	@echo "  make prod-deploy   - Deploy production (build + up)"
	@echo "  make prod-scale    - Scale production services"
	@echo ""
	@echo "Common Commands:"
	@echo "  make up            - Start all services"
	@echo "  make down          - Stop all services"
	@echo "  make restart       - Restart all services"
	@echo "  make ps            - Show running containers"
	@echo "  make stats         - Show resource usage"
	@echo ""
	@echo "Database Commands:"
	@echo "  make migrate       - Run database migrations"
	@echo "  make seed          - Seed database with sample data"
	@echo "  make db-reset      - Reset database (WARNING: deletes data)"
	@echo "  make backup        - Create database backup"
	@echo "  make restore       - Restore database from backup"
	@echo ""
	@echo "Maintenance Commands:"
	@echo "  make clean         - Stop and remove containers"
	@echo "  make prune         - Remove unused Docker resources"
	@echo "  make rebuild       - Rebuild images without cache"
	@echo "  make health        - Check service health"
	@echo ""

# ===================================
# Development Commands
# ===================================

dev:
	@echo "🚀 Starting development environment..."
	docker-compose up -d
	@echo "✅ Development environment started!"
	@echo "   Frontend: http://localhost:5173"
	@echo "   Backend:  http://localhost:3000"
	@echo "   RabbitMQ: http://localhost:15672"
	@make logs

backend-only:
	@echo "🔧 Starting backend infrastructure only..."
	cd inventory-backend && docker-compose -f docker-compose.dev.yml up -d postgres redis rabbitmq
	@echo "✅ Backend infrastructure started!"
	@echo "   PostgreSQL: localhost:5432"
	@echo "   Redis:      localhost:6379"
	@echo "   RabbitMQ:   localhost:5672 (Management: http://localhost:15672)"

# ===================================
# Production Commands
# ===================================

prod:
	@echo "🚀 Starting production environment..."
	@test -f .env || (echo "❌ Error: .env file not found. Copy .env.example to .env first." && exit 1)
	docker-compose -f docker-compose.prod.yml up -d
	@echo "✅ Production environment started!"
	@make health

prod-build:
	@echo "🔨 Building production images..."
	docker-compose -f docker-compose.prod.yml build --parallel

prod-deploy: prod-build
	@echo "🚀 Deploying production..."
	docker-compose -f docker-compose.prod.yml up -d
	@echo "✅ Production deployed!"
	@make health

prod-scale:
	@echo "📈 Scaling production services..."
	docker-compose -f docker-compose.prod.yml up -d --scale backend=3 --scale frontend=2
	@echo "✅ Services scaled!"

# ===================================
# Common Commands
# ===================================

up:
	docker-compose up -d

down:
	docker-compose down

restart:
	docker-compose restart

ps:
	@echo "📊 Running containers:"
	@docker-compose ps

stats:
	@echo "📈 Resource usage:"
	@docker stats --no-stream

build:
	docker-compose build --parallel

rebuild:
	@echo "🔨 Rebuilding without cache..."
	docker-compose build --no-cache --parallel

# ===================================
# Logs
# ===================================

logs:
	docker-compose logs -f

logs-backend:
	docker-compose logs -f backend

logs-frontend:
	docker-compose logs -f frontend

logs-db:
	docker-compose logs -f postgres

logs-redis:
	docker-compose logs -f redis

logs-rabbitmq:
	docker-compose logs -f rabbitmq

# ===================================
# Shell Access
# ===================================

shell-backend:
	docker-compose exec backend sh

shell-frontend:
	docker-compose exec frontend sh

shell-db:
	docker-compose exec postgres psql -U postgres -d inventory_db

shell-redis:
	docker-compose exec redis redis-cli

# ===================================
# Database Commands
# ===================================

migrate:
	@echo "🗃️  Running database migrations..."
	docker-compose exec backend npx prisma migrate deploy
	@echo "✅ Migrations complete!"

seed:
	@echo "🌱 Seeding database..."
	docker-compose exec backend npx prisma db seed
	@echo "✅ Database seeded!"

db-reset:
	@echo "⚠️  WARNING: This will delete all data!"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker-compose exec backend npx prisma migrate reset --force; \
		echo "✅ Database reset complete!"; \
	else \
		echo "❌ Cancelled"; \
	fi

backup:
	@echo "💾 Creating database backup..."
	@mkdir -p backups
	docker-compose exec postgres pg_dump -U postgres inventory_db > backups/backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "✅ Backup created in ./backups/"

restore:
	@echo "📥 Available backups:"
	@ls -1 backups/*.sql 2>/dev/null || echo "No backups found"
	@read -p "Enter backup filename: " backup; \
	if [ -f "backups/$$backup" ]; then \
		docker-compose exec -T postgres psql -U postgres -d inventory_db < backups/$$backup; \
		echo "✅ Database restored!"; \
	else \
		echo "❌ Backup file not found"; \
	fi

# ===================================
# Health & Monitoring
# ===================================

health:
	@echo "🏥 Checking service health..."
	@echo ""
	@echo "Backend API:"
	@curl -s http://localhost:3000/health | jq . || echo "❌ Backend not responding"
	@echo ""
	@echo "Frontend:"
	@curl -s http://localhost:5173 > /dev/null && echo "✅ Frontend is up" || echo "❌ Frontend not responding"
	@echo ""
	@echo "PostgreSQL:"
	@docker-compose exec postgres pg_isready -U postgres || echo "❌ PostgreSQL not ready"
	@echo ""
	@echo "Redis:"
	@docker-compose exec redis redis-cli ping || echo "❌ Redis not responding"
	@echo ""
	@echo "RabbitMQ:"
	@docker-compose exec rabbitmq rabbitmq-diagnostics ping || echo "❌ RabbitMQ not responding"

# ===================================
# Maintenance Commands
# ===================================

clean:
	@echo "🧹 Cleaning up containers..."
	docker-compose down
	@echo "✅ Cleanup complete!"

clean-all:
	@echo "⚠️  WARNING: This will remove all containers and volumes!"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker-compose down -v; \
		echo "✅ All containers and volumes removed!"; \
	else \
		echo "❌ Cancelled"; \
	fi

prune:
	@echo "🗑️  Removing unused Docker resources..."
	docker system prune -af
	@echo "✅ Prune complete!"

# ===================================
# Testing
# ===================================

test:
	@echo "🧪 Running tests..."
	docker-compose exec backend npm test

test-watch:
	@echo "🧪 Running tests in watch mode..."
	docker-compose exec backend npm run test:watch

# ===================================
# Utility Commands
# ===================================

install:
	@echo "📦 Installing dependencies..."
	cd inventory-backend && npm install
	cd inventory-frontend && npm install
	@echo "✅ Dependencies installed!"

update:
	@echo "⬆️  Updating dependencies..."
	cd inventory-backend && npm update
	cd inventory-frontend && npm update
	@echo "✅ Dependencies updated!"

audit:
	@echo "🔍 Running security audit..."
	cd inventory-backend && npm audit
	cd inventory-frontend && npm audit
