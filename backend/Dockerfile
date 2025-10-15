# ------------------------
# 1️⃣  Base Build Stage
# ------------------------
FROM node:20-slim AS build

# Create app directory and set permissions
WORKDIR /app
RUN useradd -m appuser && mkdir -p /app/node_modules && chown -R appuser:appuser /app
USER appuser

# Copy package files and install dependencies
COPY --chown=appuser:appuser package*.json ./
RUN npm ci --omit=dev

# Copy application source
COPY --chown=appuser:appuser . .

# Optional: Build step if you transpile (e.g., TypeScript)
# RUN npm run build

# ------------------------
# 2️⃣  Runtime Stage
# ------------------------
FROM node:20-slim AS runtime

# Create app directory and switch to non-root user
WORKDIR /app
RUN useradd -m appuser && mkdir -p /app && chown -R appuser:appuser /app
USER appuser

# Copy only the built app and dependencies from build stage
COPY --from=build --chown=appuser:appuser /app /app

# Environment variables (build-time args for CI/CD)
ARG NODE_ENV=production
ARG DATABASE_URL
ARG STRIPE_SECRET_KEY
ARG JWT_SECRET
ARG EMAIL_USER
ARG EMAIL_PASS

# Make them accessible to the app
ENV NODE_ENV=${NODE_ENV}
ENV DATABASE_URL=${DATABASE_URL}
ENV STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
ENV JWT_SECRET=${JWT_SECRET}
ENV EMAIL_USER=${EMAIL_USER}
ENV EMAIL_PASS=${EMAIL_PASS}

# Expose app port
EXPOSE 5000

# Use npm start (defined in package.json)
CMD ["npm", "run", "start"]
