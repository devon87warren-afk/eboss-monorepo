# ---- Build stage ----
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@10.20.0

# Copy workspace manifests first for better layer caching
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/manager/package.json ./apps/manager/package.json

# Install dependencies (only production deps needed for build)
RUN pnpm install --frozen-lockfile --filter @eboss/manager

# Copy application source
COPY apps/manager/ ./apps/manager/

# Build the Vite app
WORKDIR /app/apps/manager
RUN pnpm run build

# ---- Serve stage ----
FROM nginx:1.27-alpine AS runtime

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY apps/manager/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder stage
COPY --from=builder /app/apps/manager/dist /usr/share/nginx/html

# Cloud Run requires the container to listen on $PORT (default 8080)
ENV PORT=8080
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
