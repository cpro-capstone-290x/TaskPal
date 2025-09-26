FROM node:20-slim AS base

# create workdir and set owner before switching users
WORKDIR /app
RUN useradd -m appuser && mkdir -p /app/node_modules && chown -R appuser:appuser /app

# switch to non-root
USER appuser

# copy package.json & lockfile
COPY --chown=appuser:appuser package*.json ./

# install deps as appuser
RUN npm install

# copy the rest of the source
COPY --chown=appuser:appuser . .

EXPOSE 3000
CMD ["npm", "run", "start"]
