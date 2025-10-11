FROM node:20-slim

# Create app directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy rest of the source code
COPY . .

# Expose Vite's default port
EXPOSE 5173

# Run Vite in dev mode
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
