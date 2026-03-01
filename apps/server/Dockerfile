# Build stage using Node.js (Debian-based for better native dependency support)
FROM node:22-slim AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
COPY packages/sdk/package.json ./packages/sdk/
COPY apps/cms/package.json ./apps/cms/
COPY apps/bwo-tax-forms/package.json ./apps/bwo-tax-forms/ 
COPY apps/demo/package.json ./apps/demo/
COPY apps/customer-portal/package.json ./apps/customer-portal/
COPY apps/server/package.json ./apps/server/

# Install dependencies
RUN npm install

# Install all platform-specific native dependencies for Debian/glibc
RUN npm install --no-save \
    @rollup/rollup-linux-x64-gnu \
    lightningcss-linux-x64-gnu \
    @tailwindcss/oxide-linux-x64-gnu

# Copy source code
COPY . .

# Build SDK
WORKDIR /app/packages/sdk
RUN npm run build

# Build all apps
WORKDIR /app
RUN npm run build:deploy

# Production stage with Bun runtime (fast and efficient)
FROM oven/bun:1.3-alpine

WORKDIR /app

# Install only production dependencies
COPY apps/server/package.json ./
RUN bun install --production

# Copy built apps from builder stage
COPY --from=builder /app/apps/server/public ./public
COPY --from=builder /app/apps/server/config ./config
COPY --from=builder /app/apps/server/content ./content

# Copy server source
COPY apps/server/src ./src

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080
ENV STORAGE_TYPE=azure

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD bun -e 'fetch("http://localhost:8080/health").then(r => r.ok ? process.exit(0) : process.exit(1))'

# Start server
CMD ["bun", "src/index.ts"]
