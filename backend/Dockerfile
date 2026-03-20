# Backend Dockerfile - Node.js API server

FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package file
COPY package.json ./

# Copy lock file if it exists
COPY package-lock.json* ./

# Install dependencies
RUN npm ci --prefer-offline --no-audit --only=production || npm install --only=production

# Copy application code
COPY src ./src

# Expose port
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=5 \
  CMD node -e "require('http').get('http://localhost:3002/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start application
CMD ["node", "src/index.js"]
