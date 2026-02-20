# Use Node.js 20 as base image
FROM node:20-slim

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with aggressive timeout and retry settings
RUN npm config set fetch-retries 10 && \
    npm config set fetch-retry-mintimeout 60000 && \
    npm config set fetch-retry-maxtimeout 300000 && \
    npm config set maxsockets 1 && \
    npm install --legacy-peer-deps --no-audit --progress=false

# Copy the rest of the application
COPY . .

# Expose the backend port
EXPOSE 5000

# Start the application
CMD ["npm", "start"]
