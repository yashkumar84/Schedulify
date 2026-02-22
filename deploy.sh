#!/bin/bash

# Remote Server Deployment Script (Final Refined Version)
# This script automates the setup, git configuration, and deployment of the Schedulify project.

set -e

# Configuration
PROJECT_DIR="TaskiFy"
REPO_NAME="yashkumar84/Schedulify"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting Remote Deployment Setup...${NC}"

# 1. Update and Install Dependencies
echo -e "${GREEN}1. Updating system and installing dependencies...${NC}"
sudo apt-get update
sudo apt-get install -y git curl

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

# 3. Git Identity Configuration
echo -e "${GREEN}3. Configuring Git identity...${NC}"
read -p "Enter Git User Name (default: Yash): " GIT_USER_NAME
GIT_USER_NAME=${GIT_USER_NAME:-"Yash"}
git config --global user.name "$GIT_USER_NAME"

read -p "Enter Git User Email (default: yashtyagi395@gmail.com): " GIT_USER_EMAIL
GIT_USER_EMAIL=${GIT_USER_EMAIL:-"yashtyagi395@gmail.com"}
git config --global user.email "$GIT_USER_EMAIL"

# 4. Handle Private Repository Cloning
if [ ! -d "$PROJECT_DIR" ]; then
    echo -e "${YELLOW}4. Repository Setup...${NC}"
    echo -e "Is this a private repository? (y/n)"
    read -r IS_PRIVATE
    
    if [[ "$IS_PRIVATE" =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Please visit: https://github.com/settings/tokens to generate a Personal Access Token (PAT).${NC}"
        echo -e "${RED}Ensure you give it 'repo' permissions.${NC}"
        echo -n "Enter your GitHub PAT: "
        read -rs GITHUB_TOKEN
        echo ""
        REPO_URL="https://${GITHUB_TOKEN}@github.com/${REPO_NAME}.git"
    else
        REPO_URL="https://github.com/${REPO_NAME}.git"
    fi

    echo -e "${GREEN}Cloning repository...${NC}"
    git clone "$REPO_URL" "$PROJECT_DIR"
    cd "$PROJECT_DIR"
else
    echo -e "${YELLOW}4. Project directory exists. Pulling latest changes...${NC}"
    cd "$PROJECT_DIR"
    git pull
fi

# 5. Interactive .env Setup
if [ ! -f "backend/.env" ]; then
    echo -e "${GREEN}5. Setting up backend/.env...${NC}"
    cp backend/.env.example backend/.env
    
    echo -e "${YELLOW}Let's configure your environment variables (Script will update placeholders):${NC}"
    
    update_env() {
        local key=$1
        local value=$2
        # Escaping slash for sed
        value=$(echo "$value" | sed 's/\//\\\//g')
        sed -i "s/^$key=.*/$key=$value/" backend/.env
    }

    read -p "Enter MongoDB URI (default: mongodb://localhost:27017/schedulify): " MONGO_URI
    [[ -n "$MONGO_URI" ]] && update_env "MONGO_URI" "$MONGO_URI"

    read -p "Enter JWT Secret: " JWT_SECRET
    [[ -n "$JWT_SECRET" ]] && update_env "JWT_SECRET" "$JWT_SECRET"

    read -p "Enter Gmail User (default: ambranelabs@gmail.com): " GMAIL_USER
    [[ -n "$GMAIL_USER" ]] && update_env "GMAIL_USER" "$GMAIL_USER"

    echo -n "Enter Gmail App Password: "
    read -rs GMAIL_PASS
    echo ""
    [[ -n "$GMAIL_PASS" ]] && update_env "GMAIL_PASS" "$GMAIL_PASS"
    
    update_env "NODE_ENV" "production"
    echo -e "${GREEN}.env configuration complete.${NC}"
fi

# 6. Build and Start Containers
echo -e "${GREEN}6. Starting the project with Docker Compose...${NC}"
# Use sudo for docker commands to ensure permission on fresh setup
if ! sudo docker compose up -d --build; then
    echo -e "${RED}Error: Build failed. Check Docker logs.${NC}"
    exit 1
fi

echo -e "${GREEN}Deployment successful!${NC}"
echo -e "${YELLOW}Access urls (Replace with server IP):${NC}"
echo -e "Frontend: http://your-server-ip:5173"
echo -e "Backend: http://your-server-ip:5000"
