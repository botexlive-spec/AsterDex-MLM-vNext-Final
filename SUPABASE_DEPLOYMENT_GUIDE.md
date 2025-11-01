# 🚀 SUPABASE DATABASE DEPLOYMENT GUIDE

**Platform:** Finaster MLM
**Deployment Date:** 2025-11-01
**Estimated Time:** 15 minutes

---

## 📋 PRE-DEPLOYMENT CHECKLIST

Before you begin, ensure you have:

- [x] Supabase account created
- [x] Supabase project created
- [x] Project URL and API keys available
- [x] Access to Supabase Dashboard

---

## 🎯 DEPLOYMENT OPTIONS

### Option 1: Single File Deployment (RECOMMENDED)
**Fastest method** - Copy and paste one file

### Option 2: Individual File Deployment
**More control** - Execute each file separately

---

## ⚡ OPTION 1: SINGLE FILE DEPLOYMENT (RECOMMENDED)

### Step 1: Access Supabase SQL Editor
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Click **"SQL Editor"** in the left sidebar
4. Click **"New query"** button

### Step 2: Copy Deployment SQL
1. Open file: `database/DEPLOY_ALL_IN_ONE.sql`
2. Copy the ENTIRE contents (Ctrl+A, Ctrl+C)

### Step 3: Execute SQL
1. Paste the SQL into the Supabase SQL Editor
2. Click **"Run"** button (or press Ctrl+Enter)
3. Wait for execution to complete (~30-60 seconds)

### Step 4: Verify Deployment
Run these verification queries in SQL Editor:

```sql
-- Verify table counts
SELECT
  (SELECT COUNT(*) FROM level_income_config) as level_configs,
  (SELECT COUNT(*) FROM matching_bonus_tiers) as matching_tiers,
  (SELECT COUNT(*) FROM rank_requirements) as rank_tiers,
  (SELECT COUNT(*) FROM binary_settings) as binary_settings,
  (SELECT COUNT(*) FROM mlm_system_settings) as system_settings;
```

**Expected Results:**
- level_configs: **30**
- matching_tiers: **6**
- rank_tiers: **7**
- binary_settings: **10**
- system_settings: **12**

### Step 5: Test Helper Functions
```sql
-- Test level income percentage
SELECT get_level_income_percentage(1);  -- Should return 10.00

-- Test system setting
SELECT get_system_setting('robot_subscription_price');  -- Should return '100'

-- Test rank by volume
SELECT * FROM get_rank_by_volume(25000);  -- Should return Platinum rank
```

---

## 📂 OPTION 2: INDIVIDUAL FILE DEPLOYMENT

If you prefer more control, deploy each file separately:

### File 1: Business Rules Tables (5 min)

**File:** `database/create-business-rules-tables.sql`

1. Open Supabase SQL Editor
2. Create new query
3. Copy contents of `create-business-rules-tables.sql`
4. Paste and run
5. Verify:
```sql
SELECT COUNT(*) FROM level_income_config;  -- 30
SELECT COUNT(*) FROM matching_bonus_tiers;  -- 6
SELECT COUNT(*) FROM rank_requirements;  -- 7
```

### File 2: MLM Functions (5 min)

**File:** `database/create-mlm-functions.sql`

1. Create new query in SQL Editor
2. Copy contents of `create-mlm-functions.sql`
3. Paste and run
4. Verify:
```sql
-- Check if functions exist
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION'
ORDER BY routine_name;
```

### File 3: RLS Policies (5 min)

**File:** `database/enable-rls-policies.sql`

1. Create new query in SQL Editor
2. Copy contents of `enable-rls-policies.sql`
3. Paste and run
4. Verify:
```sql
-- Check RLS enabled tables
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = true
ORDER BY tablename;
```

**Expected:** 21+ tables with RLS enabled

```sql
-- Check policy count
SELECT COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public';
```

**Expected:** 80+ policies

---

## ✅ COMPLETE VERIFICATION CHECKLIST

After deployment, run this comprehensive verification:

```sql
-- ============================================
-- COMPLETE DEPLOYMENT VERIFICATION
-- ============================================

-- 1. Check all configuration tables exist
SELECT
  'level_income_config' as table_name,
  COUNT(*) as row_count
FROM level_income_config
UNION ALL
SELECT 'matching_bonus_tiers', COUNT(*) FROM matching_bonus_tiers
UNION ALL
SELECT 'rank_requirements', COUNT(*) FROM rank_requirements
UNION ALL
SELECT 'binary_settings', COUNT(*) FROM binary_settings
UNION ALL
SELECT 'mlm_system_settings', COUNT(*) FROM mlm_system_settings;

-- 2. Check RLS is enabled
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'users', 'wallets', 'user_packages',
    'binary_tree', 'mlm_transactions',
    'deposits', 'withdrawals', 'kyc_verifications'
  )
ORDER BY tablename;

-- 3. Check helper functions
SELECT
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'get_level_income_percentage',
    'get_system_setting',
    'get_rank_by_volume'
  );

-- 4. Test business logic
SELECT
  level,
  percentage,
  description
FROM level_income_config
WHERE level IN (1, 10, 20, 30)
ORDER BY level;

-- 5. Test rank requirements
SELECT
  rank_name,
  rank_level,
  min_total_volume,
  levels_unlocked,
  reward_amount
FROM rank_requirements
ORDER BY rank_level;
```

---

## 🎯 SUCCESS CRITERIA

✅ Deployment is successful when:

1. **Tables Created:**
   - level_income_config (30 rows)
   - matching_bonus_tiers (6 rows)
   - rank_requirements (7 rows)
   - binary_settings (10 rows)
   - mlm_system_settings (12 rows)

2. **Helper Functions Working:**
   - `get_level_income_percentage()` returns correct percentages
   - `get_system_setting()` returns settings
   - `get_rank_by_volume()` returns rank data

3. **RLS Policies Enabled:**
   - 21+ tables have RLS enabled
   - 80+ security policies created
   - All policies visible in `pg_policies` table

4. **No Errors:**
   - All SQL executed without errors
   - All verification queries return expected results

---

## 🚨 TROUBLESHOOTING

### Issue: "Permission Denied" Error
**Cause:** Not using service_role key or admin role
**Fix:** Ensure you're logged in as project owner in Supabase Dashboard

### Issue: "Function Already Exists" Error
**Cause:** Re-running deployment
**Fix:** This is safe to ignore. Use `CREATE OR REPLACE FUNCTION` (already in scripts)

### Issue: "Table Already Exists" Error
**Cause:** Re-running deployment
**Fix:** Safe to ignore. Script uses `CREATE TABLE IF NOT EXISTS`

### Issue: "Syntax Error Near..."
**Cause:** Incomplete SQL copy/paste
**Fix:** Ensure you copied the ENTIRE file contents

### Issue: RLS Policies Not Working
**Cause:** RLS not enabled or policies not created
**Fix:**
```sql
-- Enable RLS on a table
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- Check if RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'your_table';
```

---

## 📊 POST-DEPLOYMENT TASKS

After successful deployment:

### 1. Update Environment Variables
Add to your `.env` file:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### 2. Create Initial Admin User
```sql
-- First, register a user through the application
-- Then promote to admin:
UPDATE users
SET role = 'superadmin',
    kyc_verified = true,
    is_active = true
WHERE id = 'USER-UUID-FROM-AUTH';
```

### 3. Test Application Connection
```bash
# Run dev server
npm run dev

# Application should connect to Supabase successfully
# Check browser console for any connection errors
```

### 4. Configure Admin Panel
1. Login as superadmin
2. Navigate to System Configuration
3. Verify all settings are correct
4. Adjust commission rates if needed
5. Create investment packages

---

## 📁 FILE REFERENCE

**All Deployment Files Located In:** `database/`

| File | Purpose | Size |
|------|---------|------|
| `DEPLOY_ALL_IN_ONE.sql` | Combined deployment (recommended) | ~8KB |
| `create-business-rules-tables.sql` | Business rules tables | 12KB |
| `create-mlm-functions.sql` | MLM business logic functions | 12KB |
| `enable-rls-policies.sql` | Row-Level Security policies | 18KB |

---

## 🔗 NEXT STEPS

After database deployment:

1. ✅ **Database Deployed** ← YOU ARE HERE
2. ⏳ **Set Up ROI Cron Job** - See `ROI_DISTRIBUTION_SETUP.md`
3. ⏳ **Create Admin User** - See instructions above
4. ⏳ **Test Application** - See `DEPLOYMENT_READY_CHECKLIST.md`
5. ⏳ **Run Security Tests** - See `RLS_MANUAL_TESTING_GUIDE.md`

---

## 📞 SUPPORT

If you encounter issues:

1. **Check verification queries** - Run all verification SQL above
2. **Review error messages** - Note exact error and line number
3. **Check Supabase logs** - Dashboard → Logs → SQL Logs
4. **Review documentation:**
   - `DATABASE_DEPLOYMENT_GUIDE.md`
   - `RLS_POLICIES_GUIDE.md`
   - `DEPLOYMENT_READY_CHECKLIST.md`

---

## ✨ DEPLOYMENT COMPLETE!

Once all verification queries pass, your database is fully deployed and ready for the MLM platform.

**Platform Readiness:** Database = 100% ✅

**Next:** Set up the ROI cron job (see `ROI_DISTRIBUTION_SETUP.md`)

---

*Supabase Deployment Guide - Finaster MLM Platform*
*Version: 1.0 Final*
*Last Updated: 2025-11-01*
