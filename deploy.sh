#!/bin/bash

echo "🚀 Finaster MLM Platform - Deployment Script"
echo "=============================================="

# Colors
GREEN='\\033[0;32m'
RED='\\033[0;31m'
NC='\\033[0m'

# Pull latest code
echo "📥 Pulling latest code..."
git pull origin main

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Build application
echo "🔨 Building application..."
pnpm run build

# Restart PM2
echo "🔄 Restarting application..."
pm2 restart finaster-mlm

echo "${GREEN}✅ Deployment complete!${NC}"
pm2 status
