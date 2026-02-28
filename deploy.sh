#!/bin/bash

# Remote Server Deployment Script (Nginx + SSL Fully Automated)
# Deploys Schedulify with HTTPS using Let's Encrypt for schedulifynow.com

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

DOMAIN="schedulifynow.com"
WWW_DOMAIN="www.schedulifynow.com"
SSL_EMAIL="schedulifynow@gmail.com"
PROTOCOL="https"

echo -e "${YELLOW}Starting Automated Deployment for $DOMAIN...${NC}"

# 1. Update and Install Dependencies
echo -e "${GREEN}1. Updating system and installing dependencies...${NC}"
sudo apt-get update -y
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

# 3. Kill any process on port 80 before certbot
echo -e "${GREEN}3. Freeing port 80 for SSL certificate issuance...${NC}"
sudo fuser -k 80/tcp || true
docker compose down || true

# 4. Setup backend/.env if not already present
if [ ! -f "backend/.env" ]; then
    echo -e "${GREEN}4. Creating backend/.env from example...${NC}"
    if [ -f "backend/.env.example" ]; then
        cp backend/.env.example backend/.env
    else
        cat <<EOF > backend/.env
PORT=5000
MONGO_URI=mongodb://localhost:27017/schedulifynow
JWT_SECRET=secret_$(date +%s%N)
GMAIL_USER=schedulifynow@gmail.com
GMAIL_PASS=changeme
DEFAULT_SUPER_ADMIN=superadmin@yopmail.com
DEFAULT_SUPER_ADMIN_PASSWORD=Password@2026
NODE_ENV=production
FRONTEND_URL=https://schedulifynow.com
EOF
    fi
else
    echo -e "${GREEN}4. backend/.env already exists, skipping...${NC}"
fi

# 5. Create certbot directories
mkdir -p certbot/www certbot/conf certbot/logs

# 6. Get SSL Certificate using standalone mode
echo -e "${GREEN}5. Requesting SSL certificate for $DOMAIN...${NC}"
sudo certbot certonly --standalone \
    --non-interactive \
    --agree-tos \
    --no-eff-email \
    --email "$SSL_EMAIL" \
    -d "$DOMAIN" \
    -d "$WWW_DOMAIN" \
    --config-dir "$(pwd)/certbot/conf" \
    --logs-dir "$(pwd)/certbot/logs" \
    --work-dir "$(pwd)/certbot/logs"

# 7. Write final Nginx SSL config
echo -e "${GREEN}6. Writing Nginx SSL configuration...${NC}"
cat <<EOF > nginx/nginx_prod.conf
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name $DOMAIN $WWW_DOMAIN;
    return 301 https://\$host\$request_uri;
}

# HTTPS server
server {
    listen 443 ssl;
    server_name $DOMAIN $WWW_DOMAIN;

    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Frontend
    location / {
        proxy_pass http://127.0.0.1:5173;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Backend API
    location /api {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# 8. Start all services
echo -e "${GREEN}7. Starting all Docker services...${NC}"
docker compose up -d --build --force-recreate

echo -e "${GREEN}Deployment complete!${NC}"
echo -e "${YELLOW}Your site is live at: $PROTOCOL://$DOMAIN${NC}"
echo -e ""
echo -e "${YELLOW}To seed the database (first-time setup), run:${NC}"
echo -e "${GREEN}docker compose exec backend npm run seed${NC}"
