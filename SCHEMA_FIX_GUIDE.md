# 🔧 USER_PACKAGES SCHEMA FIX GUIDE

**Status:** ⚠️ **ACTION REQUIRED**
**Time Required:** 5 minutes
**Difficulty:** Easy (Copy & Paste)

---

## 🎯 PROBLEM

The `user_packages` table in the database has an incomplete schema:

**Current Schema (4 columns):**
- `amount`
- `roi_percentage`
- `is_active`
- `purchased_at`

**Required Schema (18+ columns):**
- `investment_amount`
- `daily_roi_amount`
- `total_roi_limit`
- `purchase_date`, `activation_date`, `expiry_date`
- `total_roi_earned`, `total_roi_paid`
- `status`, `payment_method`
- And more...

**Impact:** Package purchase functionality is blocked until schema is fixed.

---

## ✅ SOLUTION

Run the SQL migration script in Supabase Dashboard to update the schema.

---

## 📋 STEP-BY-STEP INSTRUCTIONS

### Step 1: Open Supabase Dashboard

1. Go to: https://supabase.com/dashboard
2. Login to your account
3. Select project: `dsgtyrwtlpnckvcozfbc`

### Step 2: Navigate to SQL Editor

1. Click "SQL Editor" in the left sidebar
2. Click "New query" button (top right)

### Step 3: Copy & Paste SQL

Copy the entire SQL from `database/FIX_USER_PACKAGES_SCHEMA.sql` OR copy from below:

```sql
-- ============================================================================
-- FIX USER_PACKAGES SCHEMA
-- This script drops and recreates the user_packages table with full MLM schema
-- ============================================================================

-- Step 1: Drop existing tables (CASCADE will drop dependent objects)
DROP TABLE IF EXISTS roi_distributions CASCADE;
DROP TABLE IF EXISTS user_packages CASCADE;

-- Step 2: Create user_packages table with full schema
CREATE TABLE user_packages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  package_id UUID NOT NULL REFERENCES packages(id) ON DELETE RESTRICT,

  -- Investment details
  investment_amount DECIMAL(10,2) NOT NULL,
  daily_roi_amount DECIMAL(10,2) NOT NULL,
  total_roi_limit DECIMAL(10,2) NOT NULL,

  -- Dates
  purchase_date TIMESTAMPTZ DEFAULT NOW(),
  activation_date TIMESTAMPTZ DEFAULT NOW(),
  expiry_date TIMESTAMPTZ NOT NULL,

  -- Tracking
  total_roi_earned DECIMAL(10,2) DEFAULT 0,
  total_roi_paid DECIMAL(10,2) DEFAULT 0,
  days_completed INTEGER DEFAULT 0,
  last_roi_date DATE,

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'completed')),

  -- Payment details
  payment_method TEXT DEFAULT 'wallet',
  transaction_id TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 3: Create indexes for user_packages
CREATE INDEX idx_user_packages_user_id ON user_packages(user_id);
CREATE INDEX idx_user_packages_status ON user_packages(status);
CREATE INDEX idx_user_packages_expiry ON user_packages(expiry_date) WHERE status = 'active';
CREATE INDEX idx_user_packages_last_roi_date ON user_packages(last_roi_date) WHERE status = 'active';

-- Step 4: Create roi_distributions table
CREATE TABLE roi_distributions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_package_id UUID NOT NULL REFERENCES user_packages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Amount details
  roi_amount DECIMAL(10,2) NOT NULL,
  roi_percentage DECIMAL(5,2) NOT NULL,
  investment_amount DECIMAL(10,2) NOT NULL,

  -- Distribution details
  distribution_date DATE NOT NULL,
  day_number INTEGER NOT NULL,

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed')),
  paid_at TIMESTAMPTZ,

  -- Transaction reference
  wallet_transaction_id UUID,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 5: Create indexes for roi_distributions
CREATE INDEX idx_roi_distributions_user_package ON roi_distributions(user_package_id);
CREATE INDEX idx_roi_distributions_user_id ON roi_distributions(user_id);
CREATE INDEX idx_roi_distributions_date ON roi_distributions(distribution_date);
CREATE INDEX idx_roi_distributions_status ON roi_distributions(status) WHERE status = 'pending';

-- Step 6: Enable RLS on both tables
ALTER TABLE user_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE roi_distributions ENABLE ROW LEVEL SECURITY;

-- Step 7: Create RLS policies for user_packages
CREATE POLICY "Users can view their own packages"
  ON user_packages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own packages"
  ON user_packages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin full access to user_packages"
  ON user_packages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Step 8: Create RLS policies for roi_distributions
CREATE POLICY "Users can view their own ROI distributions"
  ON roi_distributions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admin full access to roi_distributions"
  ON roi_distributions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
```

### Step 4: Execute SQL

1. Paste the SQL into the query editor
2. Click the "Run" button (or press Ctrl+Enter)
3. Wait for success message

### Step 5: Verify Success

You should see a success message saying:
- Tables dropped
- Tables created
- Indexes created
- RLS policies created

---

## 🧪 VERIFICATION

After running the SQL, verify the fix worked:

### Terminal Commands:

```bash
# Verify schema
node verify-user-packages-schema.js

# Run E2E tests
node e2e-test-suite.js
```

### Expected Results:

```
✅ investment_amount         - EXISTS
✅ daily_roi_amount          - EXISTS
✅ total_roi_limit           - EXISTS
✅ status                    - EXISTS
✅ activation_date           - EXISTS
```

---

## 📊 BEFORE vs AFTER

### Before Migration

| Table | Columns | Status |
|-------|---------|--------|
| user_packages | 4 minimal columns | ❌ Incomplete |
| roi_distributions | 0 rows | ❌ Missing |

### After Migration

| Table | Columns | Status |
|-------|---------|--------|
| user_packages | 18 full MLM columns | ✅ Complete |
| roi_distributions | Full tracking system | ✅ Complete |

---

## ⚠️ IMPORTANT NOTES

1. **Data Loss:** Current user_packages table is EMPTY (0 rows), so no data will be lost
2. **Downtime:** Migration takes ~5 seconds
3. **Dependencies:** Recreates roi_distributions table (also empty)
4. **RLS:** Automatically sets up security policies

---

## 🚀 AFTER MIGRATION

Once migration is complete, you can:

1. ✅ Purchase packages
2. ✅ Calculate ROI distributions
3. ✅ Distribute commissions
4. ✅ Track package maturity
5. ✅ Run full E2E tests

---

## 🆘 TROUBLESHOOTING

### Issue: "Permission denied"
**Solution:** Make sure you're logged in as the database owner

### Issue: "Table doesn't exist"
**Solution:** That's okay! The script creates it from scratch

### Issue: "Foreign key constraint"
**Solution:** Make sure `packages` and `users` tables exist first

---

## 📞 SUPPORT

If you encounter any issues:

1. Check Supabase logs for error details
2. Verify you have admin access to the database
3. Review the SQL file: `database/FIX_USER_PACKAGES_SCHEMA.sql`
4. Run verification: `node verify-user-packages-schema.js`

---

## ✅ COMPLETION CHECKLIST

- [ ] Open Supabase Dashboard
- [ ] Navigate to SQL Editor
- [ ] Copy & paste SQL from this guide
- [ ] Click "Run" button
- [ ] See success messages
- [ ] Run: `node verify-user-packages-schema.js`
- [ ] Run: `node e2e-test-suite.js`
- [ ] Confirm all tests pass

---

**🎯 Total Time:** 5 minutes
**⚠️ Difficulty:** Easy
**✅ Result:** Fully functional package purchase system

---

*Schema Fix Guide - Finaster MLM Platform*
*Last Updated: 2025-11-04*
