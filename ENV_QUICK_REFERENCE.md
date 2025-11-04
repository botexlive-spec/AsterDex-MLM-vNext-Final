# 🚀 Environment Variables - Quick Reference Card

## 📝 Copy-Paste Ready Commands

### Generate JWT Secrets
```bash
# JWT Secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Refresh Token Secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Session Secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Test Database Connection
```bash
psql "$DATABASE_URL"
```

### Validate Configuration
```bash
# Check if all required vars are set
grep -E "^VITE_SUPABASE_URL|^VITE_SUPABASE_ANON_KEY|^DATABASE_URL|^JWT_SECRET" .env.production
```

### URL Encode Password
```bash
# Python
python3 -c "import urllib.parse; print(urllib.parse.quote('your-password'))"

# Node.js
node -e "console.log(encodeURIComponent('your-password'))"
```

---

## ✅ Minimum Required Setup (5 Variables)

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
DATABASE_URL=postgresql://postgres.xxx:pass@host:6543/postgres
NODE_ENV=production
```

---

## 🔐 Security Secrets (4 Variables)

```env
JWT_SECRET=64_char_random_hex_string
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_SECRET=different_64_char_random_hex
SESSION_SECRET=another_different_random_string
```

---

## 🌐 Application URLs (2 Variables)

```env
VITE_APP_URL=https://yourdomain.com
VITE_API_URL=https://yourdomain.com/api
```

---

## 🎨 Branding (2 Variables)

```env
VITE_APP_NAME=finaster
VITE_APP_DESCRIPTION=Your app description
```

---

## 🔌 Optional Integrations

### Orderly Network (DEX Trading)
```env
VITE_ORDERLY_BROKER_ID=your_broker_id
VITE_ORDERLY_BROKER_NAME=finaster
VITE_WALLETCONNECT_PROJECT_ID=your_wc_id
```

### Social Login (Privy)
```env
VITE_PRIVY_APP_ID=your_privy_app_id
VITE_PRIVY_LOGIN_METHODS=email,google
```

### Email (SendGrid)
```env
SENDGRID_API_KEY=SG.xxx
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
```

### Analytics (Google)
```env
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### Error Tracking (Sentry)
```env
VITE_SENTRY_DSN=https://xxx@sentry.io/xxx
```

### Payments (Stripe)
```env
STRIPE_PUBLIC_KEY=pk_live_xxx
STRIPE_SECRET_KEY=sk_live_xxx
```

---

## 📍 Where to Get Values

| Variable | Source |
|----------|--------|
| `VITE_SUPABASE_URL` | Supabase Dashboard → Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API → anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API → service_role |
| `DATABASE_URL` | Supabase Dashboard → Settings → Database → Connection String |
| `VITE_ORDERLY_BROKER_ID` | [Orderly Network Dashboard](https://orderly.network) |
| `VITE_WALLETCONNECT_PROJECT_ID` | [WalletConnect Cloud](https://cloud.walletconnect.com) |
| `VITE_PRIVY_APP_ID` | [Privy Dashboard](https://dashboard.privy.io) |
| `SENDGRID_API_KEY` | [SendGrid Settings](https://app.sendgrid.com/settings/api_keys) |
| `VITE_GA_MEASUREMENT_ID` | [Google Analytics](https://analytics.google.com) → Admin → Data Streams |
| `VITE_SENTRY_DSN` | [Sentry](https://sentry.io) → Project Settings → Client Keys |
| `STRIPE_PUBLIC_KEY` | [Stripe Dashboard](https://dashboard.stripe.com/apikeys) |

---

## 🚦 Deployment Quick Commands

### Vercel
```bash
# Set all env vars
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_ANON_KEY production
# ... add all required variables

# Deploy
vercel --prod
```

### Netlify
```bash
# Deploy
netlify deploy --prod

# Add env vars in dashboard:
# netlify.com → Site → Settings → Environment Variables
```

### Cloudflare Pages
```bash
# Connect GitHub repo in dashboard
# cloudflare.com → Pages → Create Project

# Add env vars:
# Settings → Environment Variables → Production
```

### Docker
```bash
# Build
docker build -t finaster-mlm .

# Run with env file
docker run -d --env-file .env.production -p 5173:5173 finaster-mlm
```

---

## 🐛 Common Issues & Fixes

### "Supabase URL not set"
```bash
# Check if set
echo $VITE_SUPABASE_URL

# Set temporarily
export VITE_SUPABASE_URL=https://xxx.supabase.co

# Add to .env.production
echo "VITE_SUPABASE_URL=https://xxx.supabase.co" >> .env.production
```

### "Database connection failed"
```bash
# Test connection
psql "$DATABASE_URL"

# Check password encoding
node -e "console.log(encodeURIComponent('Pass@123#'))"
# Output: Pass%40123%23
```

### "JWT verification failed"
```bash
# Generate new secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Verify it's set
echo $JWT_SECRET | wc -c  # Should be > 32
```

### "Build fails with undefined env var"
```bash
# Load env vars and build
export $(cat .env.production | xargs)
npm run build
```

---

## 📋 Configuration Validation Script

Save as `check-env.sh`:

```bash
#!/bin/bash

echo "🔍 Checking environment configuration..."

required_vars=(
  "VITE_SUPABASE_URL"
  "VITE_SUPABASE_ANON_KEY"
  "DATABASE_URL"
  "NODE_ENV"
)

missing=()

for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    missing+=("$var")
  else
    echo "✅ $var is set"
  fi
done

if [ ${#missing[@]} -eq 0 ]; then
  echo ""
  echo "🎉 All required variables are set!"
  exit 0
else
  echo ""
  echo "❌ Missing required variables:"
  for var in "${missing[@]}"; do
    echo "  - $var"
  done
  exit 1
fi
```

Run:
```bash
chmod +x check-env.sh
./check-env.sh
```

---

## 🔄 Environment Sync Commands

### Copy development to production
```bash
# Backup first
cp .env.production .env.production.backup

# Copy and edit
cp .env .env.production
nano .env.production  # Update production values
```

### Sync to remote server
```bash
# Using SCP
scp .env.production user@server:/var/www/app/.env

# Using rsync
rsync -avz .env.production user@server:/var/www/app/.env
```

### Update Vercel environment
```bash
# List current vars
vercel env ls

# Remove old
vercel env rm VITE_SUPABASE_URL production

# Add new
vercel env add VITE_SUPABASE_URL production
# Enter value when prompted
```

---

## 💾 Backup Configuration

```bash
# Backup all env files (excluding secrets)
tar -czf env-backup-$(date +%Y%m%d).tar.gz \
  .env.example \
  .env.production.template \
  public/config.production.template.js

# Restore backup
tar -xzf env-backup-20250104.tar.gz
```

---

## 🔐 Security Checklist

- [ ] All secrets generated with crypto.randomBytes()
- [ ] JWT_SECRET ≥ 32 characters
- [ ] Different secrets for different purposes
- [ ] .env.production in .gitignore
- [ ] Service role key never exposed to frontend
- [ ] Database password URL encoded
- [ ] HTTPS enabled (FORCE_HTTPS=true)
- [ ] CORS origins restricted
- [ ] Environment-specific databases
- [ ] Secrets rotated quarterly

---

## 📞 Need Help?

- **Full Guide:** See `PRODUCTION_ENVIRONMENT_SETUP.md`
- **Troubleshooting:** Check [Troubleshooting Section](./PRODUCTION_ENVIRONMENT_SETUP.md#troubleshooting)
- **Support:** Open an issue on GitHub

---

*Quick Reference v1.0.0 | Updated: 2025-11-04*
