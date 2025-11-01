# 🗄️ Database Configuration Deployment Guide
**Deploy Business Rules & Atomic Functions to Supabase**

---

## 📋 Quick Start

**Time Required:** 10 minutes
**Difficulty:** Easy
**Prerequisites:** Supabase project access

---

## 🎯 What You're Deploying

### Part 1: Configuration Tables (5 tables + default data)
- `level_income_config` - 30-level commission rates
- `matching_bonus_tiers` - Binary bonus tiers
- `rank_requirements` - Rank advancement criteria
- `binary_settings` - Binary tree configuration
- `mlm_system_settings` - System parameters

### Part 2: Atomic Transaction Functions (4 functions)
- `purchase_package_atomic()` - Safe package purchases
- `update_binary_volumes_atomic()` - Binary tree updates
- `process_level_income_atomic()` - Commission distribution
- `complete_package_purchase()` - Main orchestrator

---

## ⚡ Quick Deploy (3 Steps)

### Step 1: Open Supabase SQL Editor
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Click **SQL Editor** → **New Query**

### Step 2: Deploy Configuration Tables
1. Open: `database/create-business-rules-tables.sql`
2. Copy all contents
3. Paste into Supabase SQL Editor
4. Click **Run** (Ctrl+Enter)
5. Wait for "Success" message

**Verify:**
```sql
SELECT COUNT(*) FROM level_income_config; -- Should be 30
```

### Step 3: Deploy Atomic Functions
1. Click **New Query** in Supabase
2. Open: `database/create-mlm-functions.sql`
3. Copy all contents
4. Paste into SQL Editor
5. Click **Run**

**Verify:**
```sql
SELECT routine_name FROM information_schema.routines
WHERE routine_name = 'complete_package_purchase';
-- Should return 1 row
```

---

## ✅ Verification Checklist

Run these queries to confirm successful deployment:

```sql
-- 1. Check all tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'level_income_config',
  'matching_bonus_tiers',
  'rank_requirements',
  'binary_settings',
  'mlm_system_settings'
)
ORDER BY table_name;
-- Expected: 5 rows

-- 2. Check data was inserted
SELECT
  (SELECT COUNT(*) FROM level_income_config) as levels,
  (SELECT COUNT(*) FROM matching_bonus_tiers) as tiers,
  (SELECT COUNT(*) FROM rank_requirements) as ranks;
-- Expected: levels=30, tiers=6, ranks=7

-- 3. Check functions exist
SELECT COUNT(*) FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%package%' OR routine_name LIKE '%level_income%';
-- Expected: At least 4

-- 4. Test helper function
SELECT get_level_income_percentage(1);
-- Expected: 10.00 (or your configured percentage)
```

---

## 🎨 Test the Admin UI

After deployment, test the configuration UI:

1. Navigate to: `http://localhost:5174/admin/configuration`
2. You should see 5 tabs:
   - 📊 Level Income
   - 🎯 Matching Bonus
   - 🏆 Rank Requirements
   - 🌳 Binary Settings
   - ⚙️ System Settings

3. Test editing:
   - Click "Level Income" tab
   - Click "Edit" on Level 1
   - Change percentage from 10% to 11%
   - Click "Save"
   - Refresh page - change should persist

---

## 🔍 Common Issues & Solutions

### ❌ "relation already exists"
**Solution:** Tables already deployed. Either:
- Skip this step, or
- Drop tables first: `DROP TABLE IF EXISTS level_income_config CASCADE;`

### ❌ "permission denied"
**Solution:** Grant permissions:
```sql
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres;
```

### ❌ "function already exists"
**Solution:** Functions already deployed. SQL file uses `CREATE OR REPLACE`, so just re-run it.

### ❌ Configuration not showing in UI
**Checklist:**
1. Check Supabase connection in app (.env file)
2. Verify RLS policies allow reads
3. Check browser console for errors
4. Try clearing browser cache

---

## 🔄 Rollback (If Needed)

To undo the deployment:

```sql
-- Drop tables (in order)
DROP TABLE IF EXISTS level_income_config CASCADE;
DROP TABLE IF EXISTS matching_bonus_tiers CASCADE;
DROP TABLE IF EXISTS rank_requirements CASCADE;
DROP TABLE IF EXISTS binary_settings CASCADE;
DROP TABLE IF EXISTS mlm_system_settings CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS complete_package_purchase;
DROP FUNCTION IF EXISTS purchase_package_atomic;
DROP FUNCTION IF EXISTS update_binary_volumes_atomic;
DROP FUNCTION IF EXISTS process_level_income_atomic;
DROP FUNCTION IF EXISTS get_level_income_percentage;
DROP FUNCTION IF EXISTS get_system_setting;
DROP FUNCTION IF EXISTS get_rank_by_volume;
```

---

## 📊 Default Configuration

After deployment, you'll have these defaults:

**Level Income (First 5 levels):**
- Level 1: 10%
- Level 2: 5%
- Level 3: 3%
- Level 4: 2%
- Level 5: 2%
- Levels 6-30: 1%

**Matching Bonus Tiers:**
1. Bronze: 5/5 matches = $50
2. Silver: 10/10 matches = $100
3. Gold: 25/25 matches = $250
4. Platinum: 50/50 matches = $500
5. Diamond: 100/100 matches = $1000
6. Crown Diamond: 250/250 matches = $2500

**Rank Requirements:**
1. Starter: $0 volume → $0 reward
2. Bronze: $1,000 volume → $100 reward
3. Silver: $5,000 volume → $500 reward
4. Gold: $25,000 volume → $2,500 reward
5. Platinum: $100,000 volume → $10,000 reward
6. Diamond: $500,000 volume → $50,000 reward
7. Crown Diamond: $1,000,000 volume → $100,000 reward

---

## 🎯 Next Steps

After successful deployment:

1. **Customize Configuration:**
   - Go to `/admin/configuration`
   - Adjust commissions to match your plan
   - Modify bonus tiers
   - Update rank criteria

2. **Set Up ROI Distribution:**
   - Follow `ROI_DISTRIBUTION_SETUP.md`
   - Configure daily cron job
   - Test ROI calculations

3. **Test Package Purchase:**
   - Try buying a package as a test user
   - Verify commissions distributed correctly
   - Check binary tree updates

4. **Monitor Performance:**
   - Watch database query times
   - Check error logs
   - Verify cache is working

---

## 📞 Need Help?

**Documentation:**
- Full details: `DATABASE_IMPROVEMENTS_GUIDE.md`
- Code migration: `CODE_MIGRATION_SUMMARY.md`
- ROI setup: `ROI_DISTRIBUTION_SETUP.md`

**Troubleshooting:**
- Check Supabase logs
- Review browser console
- Verify environment variables
- Check network requests

---

## ✅ Success!

When you see:
- ✅ All 5 tables created with data
- ✅ All 7 functions created
- ✅ Admin UI loads configuration
- ✅ Can edit and save changes
- ✅ Changes persist after refresh

**You're ready to use database-driven configuration!** 🎉

Access at: `http://localhost:5174/admin/configuration`

---

*Quick Deploy Guide v1.0 - Last Updated: 2025-11-01*
