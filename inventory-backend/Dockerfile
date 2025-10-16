# Multi-stage Dockerfile for Backend API

# ================================
# Development Stage
# ================================
FROM node:20-alpine AS development

WORKDIR /app

# Install dependencies for Prisma (openssl, etc.)
RUN apk add --no-cache openssl

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (including dev)
RUN npm install

# Copy application source
COPY . .

# Generate Prisma Client

RUN npx prisma generate


# Expose port
EXPOSE 3000

# Start development server with hot reload
CMD ["sh", "-c", "npm run dev"]

# ================================
# Build Stage
# ================================
FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies for Prisma
RUN apk add --no-cache openssl

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies
RUN npm install

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Remove dev dependencies
RUN npm prune --production

# ================================
# Production Stage
# ================================
FROM node:20-alpine AS production

WORKDIR /app

# Install openssl for Prisma
RUN apk add --no-cache openssl

# Copy package files
COPY package*.json ./

# Copy production dependencies from build stage
COPY --from=build /app/node_modules ./node_modules

# Copy Prisma schema and migrations
COPY --from=build /app/prisma ./prisma

# Copy built application
COPY --from=build /app/dist ./dist

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start production server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
