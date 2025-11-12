# ------------------------
# FRONTEND - Development
# ------------------------
FROM node:20-slim
WORKDIR /app

# Copy dependencies and install
COPY package*.json ./
RUN npm install

# Copy the app source
COPY . .

# Expose Vite dev port
EXPOSE 5173

# Run Vite in dev mode with host binding for Docker
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
