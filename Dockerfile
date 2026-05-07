# Multi-stage Dockerfile for v9planes
# Optimized for production deployment

# ═══════════════════════════════════════════════════════════════
# Stage 1: Builder
# ═══════════════════════════════════════════════════════════════
FROM node:20-alpine AS builder

# Install build dependencies
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files first (for better caching)
COPY package*.json ./

# Install all dependencies (including devDependencies)
RUN npm ci --prefer-offline --no-audit

# Copy source code
COPY . .

# Build with memory optimization
ENV NODE_OPTIONS=--max-old-space-size=4096
ENV NODE_ENV=production
RUN npm run build

# ═══════════════════════════════════════════════════════════════
# Stage 2: Production
# ═══════════════════════════════════════════════════════════════
FROM node:20-alpine AS production

# Install runtime dependencies for sharp
RUN apk add --no-cache vips-dev

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --prefer-offline --no-audit --omit=dev && \
    npm cache clean --force

# Copy built app from builder stage
COPY --from=builder /app/.output ./.output

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nuxt -u 1001

# Change ownership of the app directory
RUN chown -R nuxt:nodejs /app
USER nuxt

# Expose port (Render uses 10000 by default)
EXPOSE 10000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:10000/api/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

# Start the app
ENV NITRO_PORT=10000
ENV NODE_ENV=production
CMD ["node", ".output/server/index.mjs"]
