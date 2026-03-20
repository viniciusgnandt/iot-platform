# Frontend Dockerfile - Multi-stage build

# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package file
COPY package.json ./

# Copy lock file if it exists, otherwise npm install will create it
COPY package-lock.json* ./

# Install dependencies
RUN npm ci --prefer-offline --no-audit || npm install

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage - serve with Nginx
FROM nginx:alpine

# Copy nginx configuration
RUN rm /etc/nginx/conf.d/default.conf

COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built app from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
