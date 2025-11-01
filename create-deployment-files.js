import fs from 'fs';

// DEPLOYMENT.md content
const deploymentMd = `# 🚀 Production Deployment Guide

Complete guide for deploying Finaster MLM Platform to production servers.

## Quick Deploy Commands

\`\`\`bash
# 1. Server Setup
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs nginx git
npm install -g pnpm pm2

# 2. Clone Repository
git clone https://github.com/yourusername/finaster-mlm-platform.git
cd finaster-mlm-platform

# 3. Install & Build
pnpm install
cp .env.example .env
# Edit .env with your settings
pnpm run build

# 4. Start Application
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup

# 5. Configure Nginx (see Nginx section below)
\`\`\`

## Server Requirements

- **OS:** Ubuntu 20.04+ or similar
- **RAM:** Minimum 2GB, Recommended 4GB+
- **Storage:** Minimum 20GB SSD, Recommended 50GB+
- **Node.js:** 18.x LTS
- **Database:** PostgreSQL 14+ or Supabase

## Detailed Setup Instructions

See full documentation at: https://docs.finaster.com/deployment

## Support

- Email: support@finaster.com
- GitHub: https://github.com/yourusername/finaster-mlm-platform/issues
`;

// deploy.sh script
const deploySh = `#!/bin/bash

echo "🚀 Finaster MLM Platform - Deployment Script"
echo "=============================================="

# Colors
GREEN='\\\\033[0;32m'
RED='\\\\033[0;31m'
NC='\\\\033[0m'

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

echo "\${GREEN}✅ Deployment complete!\${NC}"
pm2 status
`;

// Write files
fs.writeFileSync('DEPLOYMENT.md', deploymentMd);
fs.writeFileSync('deploy.sh', deploySh);
fs.chmodSync('deploy.sh', '755');

console.log('✅ Deployment files created:');
console.log('  - DEPLOYMENT.md');
console.log('  - deploy.sh');
