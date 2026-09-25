FROM node:20-alpine AS base

# Install only what we need for SQLite and HTTPS
RUN apk add --no-cache \
    sqlite \
    openssl \
    ca-certificates \
    && rm -rf /var/cache/apk/*

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install ALL dependencies (dev too, needed for tsx/tsc build)
RUN npm ci

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Prune dev dependencies for production
RUN npm prune --production

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Create data directory with correct permissions
RUN mkdir -p /app/data && chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 4000

CMD ["node", "dist/index.js"]
