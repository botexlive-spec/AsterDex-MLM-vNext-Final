# 🚀 Asterdex DEX - Backend Setup Guide
## Admin/User Authentication & Referral System

---

## 📋 Overview

This guide will help you set up the complete backend infrastructure for:
- ✅ Admin/User authentication system
- ✅ Referral marketing system with commissions
- ✅ Trading activity tracking
- ✅ Admin dashboard with analytics

**Estimated Setup Time:** 15-20 minutes

---

## 🎯 Prerequisites

Before starting, make sure you have:

1. ✅ Node.js 18+ installed
2. ✅ Docker Desktop installed and running (for local Supabase)
3. ✅ A Supabase account (free tier works great)
4. ✅ The Asterdex project cloned locally

---

## 📦 What's Already Done

We've already set up the following for you:

### ✅ Backend Structure Created
- `database-schema.sql` - Complete PostgreSQL schema
- `app/types/` - TypeScript type definitions
- `app/services/` - API service layer
- `.env.example` - Environment configuration template

### ✅ Dependencies Installed
```json
{
  "@supabase/supabase-js": "Latest",
  "bcryptjs": "For password hashing",
  "jsonwebtoken": "For JWT tokens",
  "react-hook-form": "For forms",
  "zod": "For validation",
  "@tanstack/react-query": "For data fetching",
  "recharts": "For charts",
  "date-fns": "For date formatting"
}
```

---

## 🔧 Setup Options

Choose your preferred setup method:

### **Option 1: Cloud Supabase (Recommended for Quick Start)** ⭐

**Pros:**
- ✅ No Docker required
- ✅ Fastest setup (5 minutes)
- ✅ Free tier included
- ✅ Built-in database UI
- ✅ Automatic backups

**Cons:**
- ⚠️ Requires internet connection
- ⚠️ Free tier limits (500MB DB, 2GB bandwidth)

### **Option 2: Local Supabase (Best for Development)**

**Pros:**
- ✅ Complete offline development
- ✅ No data limits
- ✅ Full control

**Cons:**
- ⚠️ Requires Docker Desktop running
- ⚠️ More complex setup

---

## 🌐 Option 1: Cloud Supabase Setup (Recommended)

### Step 1: Create Supabase Project

1. Go to: https://app.supabase.com
2. Click **"New Project"**
3. Fill in:
   - **Name:** Asterdex DEX
   - **Database Password:** Create a strong password (save this!)
   - **Region:** Choose closest to you
4. Click **"Create new project"** (takes ~2 minutes)

### Step 2: Get Your API Keys

1. Once project is ready, go to: **Settings** → **API**
2. Copy these values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **Anon/Public Key** (starts with `eyJhbGc...`)

### Step 3: Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cd C:/Projects/asterdex-8621-main
   copy .env.example .env
   ```

2. Open `.env` and update:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key_here

   # Generate a random JWT secret
   VITE_JWT_SECRET=your_random_secret_key_32_characters
   ```

   **To generate a secure JWT secret:**
   ```bash
   # Windows PowerShell
   powershell -Command "[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))"
   ```

### Step 4: Set Up Database Schema

1. In Supabase dashboard, go to: **SQL Editor**
2. Click **"New Query"**
3. Open `database-schema.sql` from your project
4. Copy the entire contents and paste into SQL Editor
5. Click **"Run"** (or press Ctrl+Enter)

✅ You should see: **"Success. No rows returned"**

### Step 5: Verify Setup

1. In Supabase, go to: **Table Editor**
2. You should see these tables:
   - `users`
   - `referral_codes`
   - `referrals`
   - `trading_activity`
   - `admin_actions`

3. Go to **Authentication** → **Users**
4. You should see 1 default admin user: `admin@asterdex.com`

### Step 6: Test Login

1. Start your dev server:
   ```bash
   npm run dev
   ```

2. Open browser: http://localhost:5173

3. Navigate to the login page (when you create it)

4. Test with default admin:
   - Email: `admin@asterdex.com`
   - Password: `admin123`

---

## 🐳 Option 2: Local Supabase Setup

### Step 1: Ensure Docker is Running

1. Open Docker Desktop
2. Wait for it to fully start
3. Verify it's running:
   ```bash
   docker --version
   ```

### Step 2: Install Supabase CLI

**Windows (using Scoop):**
```bash
# Install Scoop if not already installed
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
irm get.scoop.sh | iex

# Install Supabase CLI
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

**Alternative (Manual Download):**
Download from: https://github.com/supabase/cli/releases

### Step 3: Initialize Supabase

```bash
cd C:/Projects/asterdex-8621-main

# Initialize Supabase
supabase init

# Start local Supabase
supabase start
```

**This will start:**
- PostgreSQL database (port 54322)
- Supabase Studio UI (port 54323)
- Auth server (port 54324)
- Realtime server
- Storage server

### Step 4: Get Local Credentials

After `supabase start` completes, you'll see:

```
API URL: http://localhost:54321
DB URL: postgresql://postgres:postgres@localhost:54322/postgres
Studio URL: http://localhost:54323
Anon key: eyJhb...
Service role key: eyJhb...
```

### Step 5: Configure Environment

1. Copy `.env.example` to `.env`
2. Update with local values:
   ```env
   VITE_SUPABASE_URL=http://localhost:54321
   VITE_SUPABASE_ANON_KEY=your_local_anon_key_from_above
   VITE_JWT_SECRET=your_random_secret_key
   ```

### Step 6: Apply Database Schema

```bash
# Create a migration
supabase migration new init_schema

# Copy the contents of database-schema.sql to the new migration file
# Then apply it
supabase db push
```

Or use the Studio UI:
1. Open http://localhost:54323
2. Go to SQL Editor
3. Paste contents of `database-schema.sql`
4. Run the query

---

## 🧪 Verify Your Setup

### Test Database Connection

Create a test file: `test-db-connection.js`

```javascript
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count');

    if (error) throw error;

    console.log('✅ Database connection successful!');
    console.log('📊 Users count:', data);
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }
}

testConnection();
```

Run it:
```bash
node test-db-connection.js
```

---

## 📁 Project Structure

After setup, your project structure looks like this:

```
asterdex-8621-main/
├── app/
│   ├── types/
│   │   ├── auth.types.ts         # Auth type definitions
│   │   ├── referral.types.ts     # Referral type definitions
│   │   └── admin.types.ts        # Admin type definitions
│   │
│   ├── services/
│   │   ├── supabase.client.ts    # Supabase client setup
│   │   ├── auth.service.ts       # Authentication APIs
│   │   ├── referral.service.ts   # Referral APIs
│   │   └── admin.service.ts      # Admin APIs
│   │
│   └── ... (existing app structure)
│
├── database-schema.sql            # PostgreSQL schema
├── .env                          # Your environment config
├── .env.example                  # Environment template
└── SETUP_GUIDE.md               # This file
```

---

## 🔐 Security Best Practices

### 1. Environment Variables
- ✅ Never commit `.env` to git
- ✅ Use different keys for dev/staging/production
- ✅ Rotate keys periodically

### 2. Row Level Security (RLS)
- ✅ Already enabled on all tables
- ✅ Users can only see their own data
- ✅ Admins have elevated permissions

### 3. Password Security
- ✅ Bcrypt hashing configured
- ✅ Minimum 8 characters
- ✅ No plain text storage

### 4. JWT Tokens
- ✅ Secure token generation
- ✅ 7-day expiration
- ✅ Refresh token support

---

## 🎨 Next Steps: Build the UI

Now that your backend is ready, you can:

1. **Create Auth Pages:**
   - Login page (`app/pages/auth/Login.tsx`)
   - Register page (`app/pages/auth/Register.tsx`)
   - Password reset page

2. **Build Admin Dashboard:**
   - User management
   - Referral analytics
   - Trading volume reports

3. **Create Referral Dashboard:**
   - Personal referral codes
   - Earnings tracker
   - Referral stats

4. **Add Auth Context:**
   - React Context for auth state
   - Protected routes
   - Permission checks

---

## 🐛 Troubleshooting

### Issue: "Failed to fetch" error

**Solution:**
1. Check `.env` file has correct Supabase URL and key
2. Verify Supabase project is running (cloud or local)
3. Check browser console for detailed errors

### Issue: Docker not starting (Local setup)

**Solution:**
1. Open Docker Desktop
2. Wait for full startup
3. Check Docker is running: `docker ps`
4. Restart Docker if needed

### Issue: Database connection fails

**Solution:**
1. Verify Supabase URL in `.env`
2. Check anon key is correct
3. For local: ensure `supabase start` completed successfully
4. Check firewall isn't blocking ports 54321-54324

### Issue: Row Level Security blocks queries

**Solution:**
1. Ensure you're authenticated before queries
2. Check RLS policies in Supabase dashboard
3. For testing, you can temporarily disable RLS on a table

---

## 📚 Useful Commands

### Supabase Local Development

```bash
# Start Supabase
supabase start

# Stop Supabase
supabase stop

# Restart Supabase
supabase stop && supabase start

# View logs
supabase logs

# Reset database (careful!)
supabase db reset

# Generate TypeScript types
supabase gen types typescript --local > app/types/database.types.ts

# Create new migration
supabase migration new your_migration_name

# Apply migrations
supabase db push
```

### Database Management

```bash
# Connect to local database
psql -h localhost -p 54322 -U postgres -d postgres

# Export schema
supabase db dump --local > backup.sql

# Import schema
psql -h localhost -p 54322 -U postgres -d postgres < backup.sql
```

---

## 🎓 Learning Resources

- **Supabase Docs:** https://supabase.com/docs
- **Supabase Auth Guide:** https://supabase.com/docs/guides/auth
- **Row Level Security:** https://supabase.com/docs/guides/auth/row-level-security
- **PostgreSQL Tutorial:** https://www.postgresqltutorial.com/

---

## ✅ Setup Complete Checklist

Before moving to UI development, confirm:

- [ ] Supabase project created (cloud or local)
- [ ] `.env` file configured with correct values
- [ ] Database schema applied successfully
- [ ] All 5 tables visible in Table Editor
- [ ] Default admin user exists
- [ ] Test database connection successful
- [ ] Dependencies installed (`npm install` complete)
- [ ] Dev server runs without errors

---

## 🆘 Need Help?

If you encounter issues:

1. Check the **Troubleshooting** section above
2. Review Supabase logs: `supabase logs` (local) or Dashboard → Logs (cloud)
3. Verify all environment variables are set correctly
4. Check browser console for JavaScript errors

---

## 🎉 You're Ready!

Your Asterdex DEX backend is now fully configured with:
- ✅ PostgreSQL database with Supabase
- ✅ User authentication system
- ✅ Referral marketing infrastructure
- ✅ Admin dashboard APIs
- ✅ Trading activity tracking
- ✅ Type-safe TypeScript interfaces

**Next:** Start building your UI components! 🚀

Check out `FEATURE_DEVELOPMENT_PLAN.md` for the complete implementation roadmap.
