# Use Node.js 20 as base image
FROM node:20-slim

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with aggressive timeout and registry optimization
RUN npm config set registry https://registry.npmjs.org/ && \
    npm config set fetch-retries 10 && \
    npm config set fetch-retry-mintimeout 60000 && \
    npm config set fetch-retry-maxtimeout 300000 && \
    npm config set maxsockets 1 && \
    npm install --legacy-peer-deps --no-audit --progress=false

# Copy the rest of the application
COPY . .

# Expose the frontend port
EXPOSE 5173

# Start the application (Vite requires --host to be accessible from outside the container)
CMD ["npm", "run", "dev", "--", "--host"]
