#!/bin/bash

# CostGuardian Project Setup Script
# This script will:
# 1. Backup existing project
# 2. Restructure directories
# 3. Create clean frontend with terminal theme
# 4. Move files to proper locations

set -e  # Exit on error

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║         CostGuardian Project Setup & Restructure              ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Project root
PROJECT_ROOT=~/Desktop/CostGuardian-Optimization-tool

echo -e "${CYAN}📂 Project Location: ${PROJECT_ROOT}${NC}"
echo ""

# Step 1: Backup
echo -e "${YELLOW}[1/7] Creating backup...${NC}"
if [ -d "${PROJECT_ROOT}" ]; then
    BACKUP_DIR="${PROJECT_ROOT}-backup-$(date +%Y%m%d_%H%M%S)"
    cp -r "${PROJECT_ROOT}" "${BACKUP_DIR}"
    echo -e "${GREEN}✓ Backup created at: ${BACKUP_DIR}${NC}"
else
    echo -e "${RED}✗ Project directory not found!${NC}"
    exit 1
fi
echo ""

# Step 2: Navigate to project
cd "${PROJECT_ROOT}"

# Step 3: Create backend structure
echo -e "${YELLOW}[2/7] Creating backend directory structure...${NC}"
mkdir -p backend/cloud-watch
mkdir -p backend/iam
mkdir -p backend/lambda/cost_monitor
mkdir -p backend/lambda/data_exporter
mkdir -p backend/terraform
mkdir -p docs
echo -e "${GREEN}✓ Backend structure created${NC}"
echo ""

# Step 4: Move existing files
echo -e "${YELLOW}[3/7] Moving existing files to backend...${NC}"

# Move Lambda files
if [ -f "lambda_function.py" ]; then
    mv lambda_function.py backend/lambda/cost_monitor/ 2>/dev/null || true
    echo -e "${GREEN}✓ Moved lambda_function.py${NC}"
fi

if [ -d "lambda" ]; then
    cp -r lambda/* backend/lambda/cost_monitor/ 2>/dev/null || true
    echo -e "${GREEN}✓ Copied lambda files${NC}"
fi

# Move CloudWatch files
if [ -d "cloud-watch" ]; then
    cp -r cloud-watch/* backend/cloud-watch/ 2>/dev/null || true
    echo -e "${GREEN}✓ Moved cloud-watch files${NC}"
fi

# Move IAM files
if [ -d "iam" ]; then
    cp -r iam/* backend/iam/ 2>/dev/null || true
    echo -e "${GREEN}✓ Moved iam files${NC}"
fi

# Move Terraform files
if [ -d "terraform" ]; then
    cp -r terraform/* backend/terraform/ 2>/dev/null || true
    echo -e "${GREEN}✓ Moved terraform files${NC}"
fi

echo ""

# Step 5: Remove old messy directories
echo -e "${YELLOW}[4/7] Cleaning up old directories...${NC}"
rm -rf frontend/ 2>/dev/null || true
rm -rf lambda/ 2>/dev/null || true
rm -rf cloud-watch/ 2>/dev/null || true
rm -rf iam/ 2>/dev/null || true
rm -rf terraform/ 2>/dev/null || true
rm -f dynamic-dashboard.tsx 2>/dev/null || true
rm -f netlify.toml 2>/dev/null || true
echo -e "${GREEN}✓ Old directories cleaned${NC}"
echo ""

# Step 6: Create new Next.js frontend
echo -e "${YELLOW}[5/7] Creating new Next.js frontend with terminal theme...${NC}"
npx create-next-app@latest frontend \
  --typescript \
  --tailwind \
  --app \
  --no-src-dir \
  --import-alias "@/*" \
  --use-npm

echo -e "${GREEN}✓ Next.js app created${NC}"
echo ""

# Step 7: Install dependencies
echo -e "${YELLOW}[6/7] Installing frontend dependencies...${NC}"
cd frontend
npm install lucide-react recharts
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# Step 8: Create necessary directories and files
echo -e "${YELLOW}[7/7] Setting up frontend structure...${NC}"
mkdir -p public

# Create config.json
cat > public/config.json << 'EOF'
{
  "user_info": {
    "github_username": "your-username",
    "github_repo": "your-username/CostGuardian-Optimization-tool",
    "aws_account_id": "941431936794",
    "aws_region": "us-east-1"
  }
}
EOF
echo -e "${GREEN}✓ Created config.json${NC}"

# Create sample data.json
cat > public/data.json << 'EOF'
{
  "metadata": {
    "last_updated": "2025-12-08T08:00:00Z",
    "version": "1.0.0"
  },
  "overview": {
    "total_resources": 0,
    "resources_deleted": 0,
    "monthly_savings": 0,
    "annual_savings": 0,
    "active_resources": 0,
    "idle_resources": 0
  },
  "breakdown": {},
  "activity": [],
  "current_resources": [],
  "deleted_resources": []
}
EOF
echo -e "${GREEN}✓ Created sample data.json${NC}"

# Create .gitignore
cat > .gitignore << 'EOF'
# Dependencies
node_modules
/.pnp
.pnp.js

# Testing
/coverage

# Next.js
/.next/
/out/

# Production
/build

# Misc
.DS_Store
*.pem

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Local env files
.env*.local

# Vercel
.vercel

# Turbopack
.turbo
EOF
echo -e "${GREEN}✓ Created .gitignore${NC}"

cd ..

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                  ✓ Setup Complete!                            ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${CYAN}📁 New Project Structure:${NC}"
echo ""
echo "CostGuardian-Optimization-tool/"
echo "├── .github/              (your existing workflows)"
echo "├── backend/"
echo "│   ├── cloud-watch/      (CloudWatch configs)"
echo "│   ├── iam/              (IAM roles)"
echo "│   ├── lambda/"
echo "│   │   ├── cost_monitor/    (main Lambda)"
echo "│   │   └── data_exporter/   (dashboard Lambda)"
echo "│   └── terraform/        (IaC)"
echo "├── frontend/             (NEW terminal-themed UI)"
echo "│   ├── app/"
echo "│   ├── components/"
echo "│   ├── public/"
echo "│   └── package.json"
echo "└── docs/                 (documentation)"
echo ""
echo -e "${CYAN}📝 Next Steps:${NC}"
echo ""
echo "1. Update config.json with your GitHub repo:"
echo -e "   ${YELLOW}cd frontend/public${NC}"
echo -e "   ${YELLOW}nano config.json${NC}"
echo ""
echo "2. Copy terminal theme files:"
echo -e "   ${YELLOW}# Copy globals.css to app/globals.css${NC}"
echo -e "   ${YELLOW}# Copy terminal-page.tsx to app/page.tsx${NC}"
echo ""
echo "3. Start the development server:"
echo -e "   ${YELLOW}cd frontend${NC}"
echo -e "   ${YELLOW}npm run dev${NC}"
echo ""
echo "4. Open browser:"
echo -e "   ${CYAN}http://localhost:3000${NC}"
echo ""
echo -e "${GREEN}🎉 Your terminal-themed CostGuardian dashboard is ready!${NC}"