#!/bin/bash

# Docker and Docker Compose Setup Script for Linux
# This script installs Docker and Docker Compose on Ubuntu/Debian-based systems.

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting Docker and Docker Compose Setup...${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Please run as root or with sudo.${NC}"
  exit 1
fi

# 1. Update package index
echo -e "${GREEN}Updating package index...${NC}"
apt-get update

# 2. Install prerequisites
echo -e "${GREEN}Installing prerequisites...${NC}"
apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# 3. Add Docker’s official GPG key
echo -e "${GREEN}Adding Docker's GPG key...${NC}"
mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg --batch --yes

# 4. Set up the repository
echo -e "${GREEN}Setting up Docker repository...${NC}"
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# 5. Install Docker Engine
echo -e "${GREEN}Installing Docker Engine...${NC}"
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# 6. Start and enable Docker
echo -e "${GREEN}Starting and enabling Docker...${NC}"
systemctl start docker
systemctl enable docker

# 7. Add current user to docker group (if sudo_user is available)
if [ -n "$SUDO_USER" ]; then
  echo -e "${GREEN}Adding user $SUDO_USER to the docker group...${NC}"
  usermod -aG docker "$SUDO_USER"
  echo -e "${YELLOW}Note: You may need to log out and back in for group changes to take effect.${NC}"
fi

# 8. Verify installation
echo -e "${GREEN}Verifying installation...${NC}"
docker --version
docker compose version

echo -e "${GREEN}Setup complete!${NC}"
echo -e "${YELLOW}To run the project, use: docker compose up --build${NC}"
