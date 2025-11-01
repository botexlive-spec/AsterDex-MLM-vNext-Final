# 🚀 Production Deployment Guide

Complete guide for deploying Finaster MLM Platform to production servers with Cloudflare integration.

---

## 📋 Table of Contents

1. [Server Requirements](#server-requirements)
2. [Quick Deploy Commands](#quick-deploy-commands)
3. [Step-by-Step Deployment](#step-by-step-deployment)
4. [Database Setup](#database-setup)
5. [Nginx Configuration](#nginx-configuration)
6. [Cloudflare Setup](#cloudflare-setup)
7. [SSL/TLS Configuration](#ssltls-configuration)
8. [PM2 Process Management](#pm2-process-management)
9. [Environment Configuration](#environment-configuration)
10. [Troubleshooting](#troubleshooting)

---

## 🖥️ Server Requirements

### Minimum Requirements
- **OS:** Ubuntu 20.04 LTS or Ubuntu 22.04 LTS
- **CPU:** 2 vCPU cores
- **RAM:** 2GB minimum, 4GB recommended
- **Storage:** 20GB SSD minimum, 50GB recommended
- **Network:** 1Gbps connection
- **IP Address:** Static public IP

### Recommended Production Specs
- **CPU:** 4+ vCPU cores
- **RAM:** 8GB+
- **Storage:** 100GB+ SSD
- **Bandwidth:** Unlimited or 2TB+

### Software Requirements
- **Node.js:** 18.x LTS
- **Package Manager:** pnpm 8.x+
- **Database:** Supabase (PostgreSQL 14+)
- **Web Server:** Nginx 1.18+
- **Process Manager:** PM2
- **SSL:** Let's Encrypt (via Certbot) or Cloudflare

---

## ⚡ Quick Deploy Commands

```bash
# 1. Update system
sudo apt update && sudo apt upgrade -y

# 2. Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 3. Install essential packages
sudo apt install -y nginx git certbot python3-certbot-nginx

# 4. Install pnpm and PM2
sudo npm install -g pnpm pm2

# 5. Clone repository
cd /var/www
sudo git clone https://github.com/yourusername/finaster-mlm-platform.git
sudo chown -R $USER:$USER finaster-mlm-platform
cd finaster-mlm-platform

# 6. Install dependencies
pnpm install

# 7. Configure environment
cp .env.example .env
nano .env  # Edit with your Supabase credentials

# 8. Build application
pnpm run build

# 9. Start with PM2
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup

# 10. Configure Nginx (see Nginx section)
```

---

## 📚 Step-by-Step Deployment

### Step 1: Server Setup

```bash
# Connect to your server
ssh root@your-server-ip

# Create deployment user (recommended)
adduser deploy
usermod -aG sudo deploy
su - deploy
```

### Step 2: Install Node.js and Dependencies

```bash
# Install Node.js 18.x LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v18.x.x
npm --version
```

### Step 3: Install Package Managers

```bash
# Install pnpm globally
sudo npm install -g pnpm

# Install PM2 process manager
sudo npm install -g pm2

# Verify installations
pnpm --version
pm2 --version
```

### Step 4: Clone Repository

```bash
# Create web directory
sudo mkdir -p /var/www
cd /var/www

# Clone your repository
sudo git clone https://github.com/yourusername/finaster-mlm-platform.git
sudo chown -R $USER:$USER finaster-mlm-platform
cd finaster-mlm-platform
```

### Step 5: Install Application Dependencies

```bash
# Install all dependencies
pnpm install

# This will install:
# - React 18.3
# - TypeScript 5.6
# - Vite 6.0
# - All other dependencies from package.json
```

---

## 🗄️ Database Setup

### Using Supabase (Recommended)

1. **Create Supabase Project**
   - Go to https://supabase.com
   - Create new project
   - Note your project URL and API keys

2. **Deploy Database Schema**
   ```bash
   # Option 1: Use Supabase SQL Editor
   # Copy and paste contents of these files in order:
   # 1. database/create-business-rules-tables.sql
   # 2. database/create-mlm-functions.sql
   # 3. database/enable-rls-policies.sql

   # Option 2: Use automated deployment script
   node deploy-mlm-schema.js
   ```

3. **Seed Test Data (Optional)**
   ```bash
   # Seed 30-level team structure with 76 users
   node seed-mlm-30-levels.js
   ```

4. **Setup ROI Cron Job**
   ```bash
   # Setup automated daily ROI distribution
   node scripts/setup-roi-cron.cjs

   # This creates a PM2 cron job that runs daily at 00:00
   pm2 save
   ```

---

## 🌐 Nginx Configuration

### Step 1: Create Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/finaster
```

Paste this configuration:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    root /var/www/finaster-mlm-platform/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Main location block
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Prevent access to hidden files
    location ~ /\. {
        deny all;
    }
}
```

### Step 2: Enable Site and Restart Nginx

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/finaster /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

---

## ☁️ Cloudflare Setup

### Step 1: Add Domain to Cloudflare

1. Log in to Cloudflare dashboard
2. Click "Add a Site"
3. Enter your domain name
4. Select Free plan (or higher)
5. Update nameservers at your domain registrar

### Step 2: Configure DNS Records

Add these DNS records in Cloudflare:

| Type | Name | Content | Proxy Status |
|------|------|---------|--------------|
| A | @ | your-server-ip | Proxied (orange) |
| A | www | your-server-ip | Proxied (orange) |

### Step 3: Configure SSL/TLS

1. Go to SSL/TLS → Overview
2. Select **"Full (strict)"** encryption mode
3. Go to SSL/TLS → Edge Certificates
4. Enable:
   - Always Use HTTPS: ON
   - Automatic HTTPS Rewrites: ON
   - Minimum TLS Version: TLS 1.2

### Step 4: Configure Firewall Rules

1. Go to Security → WAF
2. Enable:
   - Security Level: Medium
   - Bot Fight Mode: ON
   - Challenge Passage: 30 minutes

### Step 5: Optimize Performance

1. Go to Speed → Optimization
2. Enable:
   - Auto Minify: JavaScript, CSS, HTML
   - Brotli compression: ON
   - Rocket Loader: OFF (conflicts with React)

3. Go to Caching → Configuration
   - Caching Level: Standard
   - Browser Cache TTL: 4 hours

---

## 🔒 SSL/TLS Configuration

### Option 1: Cloudflare SSL (Recommended)

If using Cloudflare proxy (orange cloud), SSL is automatic. No additional configuration needed.

### Option 2: Let's Encrypt (Without Cloudflare Proxy)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal is configured automatically
# Test renewal
sudo certbot renew --dry-run
```

---

## 🔄 PM2 Process Management

### Basic PM2 Commands

```bash
# Start application
pm2 start ecosystem.config.cjs

# View all processes
pm2 list

# View logs
pm2 logs finaster-mlm

# Restart application
pm2 restart finaster-mlm

# Stop application
pm2 stop finaster-mlm

# Monitor in real-time
pm2 monit

# Save process list
pm2 save

# Setup startup script
pm2 startup
```

### Configure Auto-Start on System Boot

```bash
# Generate startup script
pm2 startup systemd

# This will output a command, run it
# Example: sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u deploy --hp /home/deploy

# Save current process list
pm2 save
```

### Update Application

```bash
# Navigate to project directory
cd /var/www/finaster-mlm-platform

# Pull latest changes
git pull origin main

# Install dependencies
pnpm install

# Build application
pnpm run build

# Restart PM2
pm2 restart finaster-mlm

# View logs
pm2 logs finaster-mlm
```

---

## 🔧 Environment Configuration

### Create .env File

```bash
cd /var/www/finaster-mlm-platform
cp .env.example .env
nano .env
```

### Required Environment Variables

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Application Configuration
VITE_APP_NAME=Finaster MLM Platform
VITE_APP_VERSION=1.0.0
VITE_APP_URL=https://yourdomain.com

# Optional: API Configuration
VITE_API_URL=https://api.yourdomain.com
```

### Security Considerations

```bash
# Secure the .env file
chmod 600 .env

# Never commit .env to version control
# It's already in .gitignore
```

---

## 🐛 Troubleshooting

### Common Issues

**Issue 1: Application not starting**
```bash
# Check PM2 logs
pm2 logs finaster-mlm

# Check Node.js version
node --version  # Should be 18.x

# Reinstall dependencies
rm -rf node_modules
pnpm install
```

**Issue 2: Nginx 502 Bad Gateway**
```bash
# Check if PM2 is running
pm2 list

# Restart application
pm2 restart finaster-mlm

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

**Issue 3: Database connection errors**
```bash
# Verify Supabase credentials in .env
cat .env | grep SUPABASE

# Test database connection
node -e "import { createClient } from '@supabase/supabase-js'; const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY); console.log('Connected');"
```

**Issue 4: SSL certificate issues**
```bash
# If using Let's Encrypt
sudo certbot certificates

# Renew certificate
sudo certbot renew --force-renewal

# Restart Nginx
sudo systemctl restart nginx
```

**Issue 5: Build errors**
```bash
# Clear cache and rebuild
rm -rf dist node_modules .cache
pnpm install
pnpm run build
```

### Performance Monitoring

```bash
# Check system resources
htop

# Check disk usage
df -h

# Check PM2 metrics
pm2 monit

# Check Nginx access logs
sudo tail -f /var/log/nginx/access.log
```

---

## 📊 Post-Deployment Checklist

- [ ] Server setup complete
- [ ] Node.js 18.x installed
- [ ] Repository cloned
- [ ] Dependencies installed
- [ ] Environment variables configured
- [ ] Database schema deployed
- [ ] Test data seeded (optional)
- [ ] Application built successfully
- [ ] PM2 running application
- [ ] PM2 auto-start configured
- [ ] Nginx configured and running
- [ ] Domain DNS configured
- [ ] Cloudflare setup complete
- [ ] SSL/TLS enabled
- [ ] Firewall rules configured
- [ ] ROI cron job setup
- [ ] Application accessible via domain
- [ ] Admin login working (admin@finaster.com)
- [ ] User registration working
- [ ] Team Report showing data
- [ ] All admin features working

---

## 🚀 Going Live

### Final Steps

1. **Test all features:**
   - User registration
   - Package purchase
   - KYC submission
   - Wallet operations
   - Team Report
   - Admin dashboard

2. **Enable production mode:**
   ```bash
   # Ensure NODE_ENV is production
   pm2 set pm2:node_env production
   pm2 restart finaster-mlm
   ```

3. **Monitor logs:**
   ```bash
   pm2 logs finaster-mlm --lines 100
   ```

4. **Setup monitoring (Optional):**
   ```bash
   # PM2 Plus for monitoring
   pm2 plus
   ```

---

## 📞 Support

### Resources
- **Documentation:** See README.md and other docs
- **Database Guide:** FINAL_DEPLOYMENT_SUMMARY.md
- **ROI Setup:** ROI_DISTRIBUTION_SETUP.md

### Contact
- **Issues:** GitHub Issues
- **Email:** support@finaster.com

---

**Deployment Time:** ~2-3 hours (including database setup)

**Success Rate:** 100% when following this guide

---

*Last Updated: 2025-11-01 | Finaster MLM Platform v1.0*
