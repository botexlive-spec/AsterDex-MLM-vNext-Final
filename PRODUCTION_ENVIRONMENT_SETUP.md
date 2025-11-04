# 🚀 Production Environment Setup Guide

Complete guide for setting up production environment variables for Finaster MLM Platform.

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Environment Files Overview](#environment-files-overview)
3. [Required vs Optional Variables](#required-vs-optional-variables)
4. [Step-by-Step Configuration](#step-by-step-configuration)
5. [Deployment Platforms](#deployment-platforms)
6. [Security Best Practices](#security-best-practices)
7. [Testing Configuration](#testing-configuration)
8. [Troubleshooting](#troubleshooting)

---

## ⚡ Quick Start

### 1. Create Production Environment File

```bash
# Copy the template
cp .env.production.template .env.production

# Edit with your values
nano .env.production  # or use your preferred editor
```

### 2. Create Runtime Configuration

```bash
# Copy the template
cp public/config.production.template.js public/config.js

# Edit with your values
nano public/config.js
```

### 3. Set Minimum Required Variables

These are the absolute minimum variables needed to run:

```env
# In .env.production
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...your_anon_key
SUPABASE_SERVICE_ROLE_KEY=eyJ...your_service_role_key
DATABASE_URL=postgresql://postgres.xxx:password@aws-0-region.pooler.supabase.com:6543/postgres
NODE_ENV=production
```

### 4. Build and Deploy

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Preview the build locally (optional)
npm run preview
```

---

## 📁 Environment Files Overview

### `.env` (Development)
- Used during local development
- Contains development database credentials
- Git-tracked (sanitized version)

### `.env.production` (Production)
- Used for production builds
- Contains production database credentials
- **NEVER commit to Git** (add to .gitignore)

### `.env.production.template` (Template)
- Template with all available variables
- Git-tracked for reference
- Copy this to create your `.env.production`

### `public/config.js` (Runtime Config)
- Loaded at runtime (can change without rebuild)
- Safe for public API keys
- **NEVER include secret keys**
- Can be modified on server after deployment

---

## ✅ Required vs Optional Variables

### 🔴 REQUIRED (Application won't work without these)

```env
# Database
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
DATABASE_URL=postgresql://...

# Environment
NODE_ENV=production
```

### 🟡 HIGHLY RECOMMENDED (Core features won't work)

```env
# Security
JWT_SECRET=your_strong_random_secret
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_SECRET=different_strong_secret
SESSION_SECRET=session_secret

# Application URLs
VITE_APP_URL=https://yourdomain.com
VITE_API_URL=https://yourdomain.com/api
```

### 🟢 OPTIONAL (Enhanced features)

```env
# Orderly Network (DEX Trading)
VITE_ORDERLY_BROKER_ID=your_broker_id
VITE_WALLETCONNECT_PROJECT_ID=your_wc_project_id

# Social Login
VITE_PRIVY_APP_ID=your_privy_app_id

# Analytics
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Email/SMS
SENDGRID_API_KEY=SG.xxx
TWILIO_ACCOUNT_SID=ACxxx

# Payment Gateways
STRIPE_PUBLIC_KEY=pk_live_xxx
PAYPAL_CLIENT_ID=xxx

# Storage
AWS_ACCESS_KEY_ID=xxx (if using S3)
```

---

## 🛠️ Step-by-Step Configuration

### Step 1: Supabase Setup

1. **Go to Supabase Dashboard** → [dashboard.supabase.com](https://dashboard.supabase.com)

2. **Get Project URL:**
   - Settings → API → Project URL
   - Copy: `https://xxxxx.supabase.co`
   - Set as: `VITE_SUPABASE_URL`

3. **Get Anonymous Key:**
   - Settings → API → anon/public
   - Copy the key
   - Set as: `VITE_SUPABASE_ANON_KEY`
   - ✅ Safe to expose in frontend

4. **Get Service Role Key:**
   - Settings → API → service_role
   - Copy the key
   - Set as: `SUPABASE_SERVICE_ROLE_KEY`
   - ⚠️ **KEEP SECRET** - Never expose to frontend

5. **Get Database URL:**
   - Settings → Database → Connection String → URI
   - Example: `postgresql://postgres.xxx:password@aws-0-region.pooler.supabase.com:6543/postgres`
   - URL encode special characters in password:
     - `@` → `%40`
     - `#` → `%23`
     - `$` → `%24`
     - `&` → `%26`

### Step 2: Generate Security Secrets

Generate strong random secrets for JWT and session management:

```bash
# JWT Secret (min 32 chars)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Refresh Token Secret (different from JWT)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Session Secret (different from above)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copy the outputs to:
- `JWT_SECRET`
- `REFRESH_TOKEN_SECRET`
- `SESSION_SECRET`

### Step 3: Orderly Network Configuration (Optional)

If you want DEX trading features:

1. **Register as Broker:**
   - Visit: [Orderly Network](https://orderly.network)
   - Apply for broker program
   - Get your `BROKER_ID`

2. **Set Variables:**
   ```env
   VITE_ORDERLY_BROKER_ID=your_broker_id
   VITE_ORDERLY_BROKER_NAME=finaster
   ```

3. **If skipping DEX features:**
   ```env
   VITE_ORDERLY_BROKER_ID=demo
   # Trading features will work in demo mode
   ```

### Step 4: WalletConnect Project ID (Optional)

For Web3 wallet connections:

1. **Create Project:**
   - Visit: [cloud.walletconnect.com](https://cloud.walletconnect.com)
   - Create new project
   - Copy Project ID

2. **Set Variable:**
   ```env
   VITE_WALLETCONNECT_PROJECT_ID=your_project_id
   ```

### Step 5: Privy Authentication (Optional)

For social login (Google, Twitter, etc.):

1. **Create Privy App:**
   - Visit: [dashboard.privy.io](https://dashboard.privy.io)
   - Create app
   - Configure login methods

2. **Set Variables:**
   ```env
   VITE_PRIVY_APP_ID=your_privy_app_id
   VITE_PRIVY_LOGIN_METHODS=email,google,twitter
   ```

### Step 6: Update Runtime Config

Edit `public/config.js` with your public configuration:

```javascript
window.__RUNTIME_CONFIG__ = {
  "VITE_SUPABASE_URL": "https://your-project.supabase.co",
  "VITE_SUPABASE_ANON_KEY": "eyJ...",
  "VITE_APP_NAME": "Your Brand Name",
  "VITE_SEO_SITE_URL": "https://yourdomain.com",
  // ... other public config
};
```

**Important:** Only include public values in config.js. Never include:
- Service role keys
- JWT secrets
- Private API keys
- Database passwords

---

## 🌐 Deployment Platforms

### Vercel (Recommended)

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Set Environment Variables:**
   ```bash
   vercel env add VITE_SUPABASE_URL production
   vercel env add VITE_SUPABASE_ANON_KEY production
   # ... add all required variables
   ```

3. **Deploy:**
   ```bash
   vercel --prod
   ```

### Netlify

1. **Install Netlify CLI:**
   ```bash
   npm i -g netlify-cli
   ```

2. **Configure:**
   - Create `netlify.toml` (already included)
   - Set env vars in Netlify Dashboard

3. **Deploy:**
   ```bash
   netlify deploy --prod
   ```

### Cloudflare Pages

1. **Connect GitHub Repo:**
   - Go to Cloudflare Dashboard
   - Pages → Create Project
   - Connect your repository

2. **Configure Build:**
   - Build command: `npm run build`
   - Build output: `dist`

3. **Set Environment Variables:**
   - Add all required env vars in dashboard

### Traditional VPS (Ubuntu/Debian)

1. **Install Dependencies:**
   ```bash
   sudo apt update
   sudo apt install -y nodejs npm nginx
   ```

2. **Clone and Build:**
   ```bash
   git clone your-repo.git
   cd your-repo
   npm install
   npm run build
   ```

3. **Configure Nginx:**
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;
       root /var/www/your-app/dist;

       location / {
           try_files $uri $uri/ /index.html;
       }
   }
   ```

4. **Setup PM2 (for API server):**
   ```bash
   npm install -g pm2
   pm2 start npm --name "app" -- start
   pm2 save
   pm2 startup
   ```

---

## 🔒 Security Best Practices

### 1. Never Commit Secrets

Add to `.gitignore`:
```
.env.production
.env.local
.env*.local
config.local.js
*.secret
*.private
```

### 2. Use Different Secrets for Each Environment

```env
# Development
JWT_SECRET=dev_secret_xxx

# Staging
JWT_SECRET=staging_secret_xxx

# Production
JWT_SECRET=prod_secret_xxx
```

### 3. Rotate Secrets Regularly

- Change JWT secrets every 3-6 months
- Rotate database passwords quarterly
- Update API keys after security incidents

### 4. Use Environment-Specific Databases

```env
# Development
DATABASE_URL=postgresql://localhost:5432/mlm_dev

# Staging
DATABASE_URL=postgresql://staging-db:5432/mlm_staging

# Production
DATABASE_URL=postgresql://prod-db:5432/mlm_prod
```

### 5. Enable HTTPS Only

```env
FORCE_HTTPS=true
NODE_ENV=production
```

### 6. Set Secure CORS Origins

```env
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### 7. Use Secret Management Services

- **AWS Secrets Manager**
- **HashiCorp Vault**
- **Google Secret Manager**
- **Azure Key Vault**

Example with AWS Secrets Manager:
```bash
# Store secret
aws secretsmanager create-secret \
  --name prod/mlm/jwt-secret \
  --secret-string "your-secret-here"

# Retrieve in deployment
export JWT_SECRET=$(aws secretsmanager get-secret-value \
  --secret-id prod/mlm/jwt-secret \
  --query SecretString \
  --output text)
```

---

## 🧪 Testing Configuration

### Test Environment Variables

Create `.env.test`:
```env
NODE_ENV=test
VITE_SUPABASE_URL=http://localhost:54321
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/mlm_test
```

### Validate Configuration

Create `validate-config.js`:
```javascript
const required = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'DATABASE_URL',
  'JWT_SECRET'
];

const missing = required.filter(key => !process.env[key]);

if (missing.length > 0) {
  console.error('❌ Missing required environment variables:');
  missing.forEach(key => console.error(`  - ${key}`));
  process.exit(1);
}

console.log('✅ All required environment variables are set');
```

Run validation:
```bash
node validate-config.js
```

### Test Database Connection

Create `test-db-connection.js`:
```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testConnection() {
  try {
    const { data, error } = await supabase.from('users').select('count');
    if (error) throw error;
    console.log('✅ Database connection successful');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
}

testConnection();
```

---

## 🐛 Troubleshooting

### Issue: "Supabase URL is not set"

**Cause:** Missing or incorrect Supabase URL

**Solution:**
1. Check `.env.production`:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   ```
2. Verify in `public/config.js`:
   ```javascript
   "VITE_SUPABASE_URL": "https://your-project.supabase.co"
   ```
3. Rebuild:
   ```bash
   rm -rf dist
   npm run build
   ```

### Issue: "Invalid API key"

**Cause:** Wrong or expired Supabase key

**Solution:**
1. Get fresh keys from Supabase Dashboard
2. Verify you're using `anon` key (not `service_role`) for frontend
3. Check for trailing spaces in .env file

### Issue: "Database connection failed"

**Cause:** Incorrect DATABASE_URL or password encoding

**Solution:**
1. Test connection:
   ```bash
   psql "postgresql://postgres.xxx:password@host:6543/postgres"
   ```
2. URL encode password:
   ```bash
   # If password is: Pass@123#
   # Encoded should be: Pass%40123%23
   ```

### Issue: "Token validation failed"

**Cause:** JWT_SECRET mismatch or not set

**Solution:**
1. Verify JWT_SECRET is set:
   ```bash
   echo $JWT_SECRET
   ```
2. Ensure same secret on all servers
3. Check secret length (minimum 32 characters)

### Issue: "CORS error"

**Cause:** Frontend domain not allowed

**Solution:**
1. Add domain to CORS_ORIGINS:
   ```env
   CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
   ```
2. Configure Supabase CORS:
   - Dashboard → Authentication → URL Configuration
   - Add Site URL: `https://yourdomain.com`

### Issue: "Build failed: Cannot read property of undefined"

**Cause:** Missing required env var during build

**Solution:**
1. Check all `VITE_*` variables are set
2. Verify variables are exported:
   ```bash
   export $(cat .env.production | xargs)
   npm run build
   ```

---

## 📚 Additional Resources

### Documentation
- [Supabase Docs](https://supabase.com/docs)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Orderly Network Docs](https://docs.orderly.network)

### Tools
- [JWT Debugger](https://jwt.io)
- [URL Encoder](https://www.urlencoder.org)
- [Password Generator](https://passwordsgenerator.net)

### Support
- GitHub Issues: [Your Repository Issues]
- Documentation: See `docs/` folder
- Email: support@yourdomain.com

---

## ✅ Configuration Checklist

Before deploying to production:

- [ ] All required environment variables set
- [ ] Secrets generated with crypto.randomBytes()
- [ ] Database connection tested
- [ ] Supabase URL and keys verified
- [ ] JWT secrets different from each other
- [ ] Production database separate from development
- [ ] HTTPS enabled (FORCE_HTTPS=true)
- [ ] CORS origins configured
- [ ] .env.production NOT committed to Git
- [ ] Runtime config (public/config.js) updated
- [ ] Email service configured (if needed)
- [ ] Analytics tracking IDs set (if needed)
- [ ] Error tracking configured (Sentry, etc.)
- [ ] Build tested locally (npm run build && npm run preview)
- [ ] Environment validated (node validate-config.js)
- [ ] Database migrations run
- [ ] E2E tests passing
- [ ] Monitoring/alerting configured
- [ ] Backup strategy in place

---

**🎉 Configuration Complete!**

Your production environment is now ready for deployment. Follow the deployment guide for your chosen platform.

For issues or questions, refer to the [Troubleshooting](#troubleshooting) section or open an issue on GitHub.

---

*Last Updated: 2025-11-04*
*Version: 1.0.0*
