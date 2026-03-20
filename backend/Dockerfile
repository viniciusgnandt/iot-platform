# Backend Dockerfile - Node.js API server

FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install system dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++

# Copy package file
COPY package.json ./

# Copy lock file if it exists
COPY package-lock.json* ./

# Install dependencies
RUN npm ci --prefer-offline --no-audit --only=production || npm install --only=production

# Copy application code
COPY src ./src

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/sensors', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start application
CMD ["node", "src/index.js"]
