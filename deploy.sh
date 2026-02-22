#!/bin/bash

# Remote Server Deployment Script (Nginx + SSL Optimized - Manual Git Workflow)
# This script automates the setup, SSL configuration, and deployment.
# Note: This script assumes you have already pulled the code to your server.

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting Remote Deployment Setup with Nginx and SSL...${NC}"

# 1. Update and Install Dependencies
echo -e "${GREEN}1. Updating system and installing dependencies...${NC}"
sudo apt-get update
sudo apt-get install -y curl certbot

# 2. Install Docker and Docker Compose
if ! command -v docker &> /dev/null; then
    echo -e "${GREEN}2. Installing Docker...${NC}"
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    sudo apt-get install -y docker-compose-plugin
else
    echo -e "${GREEN}2. Docker already installed.${NC}"
fi

# 3. Domain and SSL Configuration (CRITICAL)
echo -e "${GREEN}3. Configuring Domain and SSL...${NC}"
DETECTED_IP=$(curl -s https://ifconfig.me || echo "your-server-ip")
echo -e "${YELLOW}Note: SSL certificates (Let's Encrypt) require a domain name (e.g., example.com).${NC}"
echo -e "${YELLOW}An IP address (like $DETECTED_IP) cannot be used for a standard SSL certificate.${NC}"
read -p "Enter your Domain Name (leave blank to use IP $DETECTED_IP over HTTP): " DOMAIN_INPUT

if [ -z "$DOMAIN_INPUT" ]; then
    DOMAIN=$DETECTED_IP
    PROTOCOL="http"
    SSL_ENABLED=false
    echo -e "${YELLOW}Proceeding with IP address $DOMAIN (HTTP only).${NC}"
else
    DOMAIN=$DOMAIN_INPUT
    PROTOCOL="https"
    SSL_ENABLED=true
    echo -e "${GREEN}Proceeding with domain $DOMAIN (HTTPS).${NC}"
fi

# 4. Create root .env for Docker Compose
echo -e "${GREEN}4. Creating root .env file...${NC}"
cat <<EOF > .env
DOMAIN=$DOMAIN
PROTOCOL=$PROTOCOL
EOF

# 5. Interactive backend/.env Setup
if [ ! -f "backend/.env" ]; then
    echo -e "${GREEN}5. Setting up backend/.env...${NC}"
    if [ -f "backend/.env.example" ]; then
        cp backend/.env.example backend/.env
    else
        echo -e "${RED}Error: backend/.env.example not found! Creating a basic one...${NC}"
        touch backend/.env
    fi
    
    echo -e "${YELLOW}Let's configure your environment variables (Script will update placeholders):${NC}"
    
    update_env() {
        local key=$1
        local value=$2
        value=$(echo "$value" | sed 's/\//\\\//g')
        if grep -q "^$key=" backend/.env; then
            sed -i "s/^$key=.*/$key=$value/" backend/.env
        else
            echo "$key=$value" >> backend/.env
        fi
    }

    # IMPORTANT: In Docker bridge network, use 'db' instead of 'localhost'
    read -p "Enter MongoDB URI (default: mongodb://db:27017/schedulify): " MONGO_URI
    MONGO_URI=${MONGO_URI:-"mongodb://db:27017/schedulify"}
    update_env "MONGO_URI" "$MONGO_URI"

    read -p "Enter JWT Secret (required): " JWT_SECRET
    [[ -n "$JWT_SECRET" ]] && update_env "JWT_SECRET" "$JWT_SECRET"

    read -p "Enter Gmail User (default: ambranelabs@gmail.com): " GMAIL_USER
    [[ -n "$GMAIL_USER" ]] && update_env "GMAIL_USER" "$GMAIL_USER"

    echo -n "Enter Gmail App Password: "
    read -rs GMAIL_PASS
    echo ""
    [[ -n "$GMAIL_PASS" ]] && update_env "GMAIL_PASS" "$GMAIL_PASS"
    
    update_env "NODE_ENV" "production"
    update_env "FRONTEND_URL" "$PROTOCOL://$DOMAIN"
    echo -e "${GREEN}.env configuration complete.${NC}"
fi

# 6. Nginx Configuration
echo -e "${GREEN}6. Setting up Nginx...${NC}"
mkdir -p nginx
mkdir -p certbot/www certbot/conf certbot/logs

if [ "$SSL_ENABLED" = true ]; then
    # Create temporary Nginx config for Certbot challenge
    cat <<EOF > nginx/nginx.conf
server {
    listen 80;
    server_name $DOMAIN;
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
}
EOF
    # Start Nginx temporarily to handle challenge
    sudo docker compose up -d nginx

    # Request Certificate
    echo -e "${GREEN}Requesting SSL certificate for $DOMAIN...${NC}"
    WEBROOT_PATH="$(pwd)/certbot/www"
    CONFIG_PATH="$(pwd)/certbot/conf"
    LOGS_PATH="$(pwd)/certbot/logs"
    
    read -p "Enter email for SSL expiration notices (e.g., admin@$DOMAIN): " SSL_EMAIL
    if [ -z "$SSL_EMAIL" ]; then
        SSL_EMAIL="admin@$DOMAIN"
    fi
    
    sudo certbot certonly --webroot -w "$WEBROOT_PATH" \
        --config-dir "$CONFIG_PATH" \
        --logs-dir "$LOGS_PATH" \
        --work-dir "$LOGS_PATH" \
        -d "$DOMAIN" --email "$SSL_EMAIL" --agree-tos --no-eff-email --non-interactive

    # Create full Nginx SSL config from template
    if [ -f "nginx/nginx.conf.template" ]; then
        cp nginx/nginx.conf.template nginx/nginx.conf
        sed -i "s/\${DOMAIN}/$DOMAIN/g" nginx/nginx.conf
    else
        cat <<EOF > nginx/nginx.conf
server {
    listen 80;
    server_name $DOMAIN;
    location / { return 301 https://\$host\$request_uri; }
}
server {
    listen 443 ssl;
    server_name $DOMAIN;
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    
    location / {
        proxy_pass http://frontend:5173;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    location /api {
        proxy_pass http://backend:5000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF
    fi
else
    # HTTP only config for IP
    cat <<EOF > nginx/nginx.conf
server {
    listen 80;
    server_name $DOMAIN;

    # Frontend
    location / {
        proxy_pass http://frontend:5173;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Backend API
    location /api {
        proxy_pass http://backend:5000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF
fi

# 7. Final Start
echo -e "${GREEN}7. Starting all services with final configuration...${NC}"
# Use --force-recreate for nginx to ensure it picks up the new config file
if ! sudo docker compose up -d --build --force-recreate; then
    echo -e "${RED}Error: Deployment failed.${NC}"
    exit 1
fi

echo -e "${GREEN}Deployment successful!${NC}"
echo -e "${YELLOW}Access URL: $PROTOCOL://$DOMAIN${NC}"
