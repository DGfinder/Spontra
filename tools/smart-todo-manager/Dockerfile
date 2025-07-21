FROM node:18-alpine

# Install git for repository operations
RUN apk add --no-cache git

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY src/ ./src/

# Build the application
RUN npm run build

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S smarttodo -u 1001

# Create directories with correct permissions
RUN mkdir -p /app/.todo-data/logs && \
    chown -R smarttodo:nodejs /app

# Switch to non-root user
USER smarttodo

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

# Expose health check port
EXPOSE 3001

# Default command
CMD ["node", "dist/cli.js", "start", "--detect-interval", "5", "--sync-interval", "15", "--port", "3001", "--log-level", "info"]