# =============================================================================
# KaoJai All-in-One Multi-Stage Production Dockerfile
# Combines React Frontend build + Node.js Backend Server into a Single Container
# =============================================================================

# --- STAGE 1: Build Frontend React Client ---
FROM node:20-alpine AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# --- STAGE 2: Production Server Environment ---
FROM node:20-alpine AS runner
WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=4000

# Install production dependencies for server
COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm ci --only=production

# Copy server source code
COPY server/ ./

# Copy built frontend assets from STAGE 1 into /app/client/dist
COPY --from=client-build /app/client/dist /app/client/dist

# Create necessary persistent directories
RUN mkdir -p data public/uploads

# Expose single port
EXPOSE 4000

# Start unified KaoJai application
CMD ["npm", "start"]
