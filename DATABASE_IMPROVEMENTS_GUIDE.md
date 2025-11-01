# Database Improvements Implementation Guide

**Created:** 2025-11-01
**Status:** Ready for Deployment
**Priority:** HIGH - Improves data integrity and admin flexibility

---

## Overview

This guide documents two critical database improvements:

1. **Transaction-Based MLM Functions** - Ensures atomic operations and data consistency
2. **Database-Driven Business Rules** - Makes MLM configuration admin-editable

---

## Part 1: Transaction-Based MLM Functions

### Problem Statement

**Current State:**
- MLM operations (package purchase, level income, binary volumes) execute as separate database calls
- If any operation fails mid-process, previous operations are NOT rolled back
- This can lead to inconsistent data (e.g., balance deducted but package not created)

**Example Failure Scenario:**
```
1. ✅ Deduct $1000 from user balance
2. ✅ Create user_package record
3. ❌ FAILS: Update binary tree volumes (network error)
4. ❌ FAILS: Process level income
Result: User lost $1000, got package, but NO commissions distributed = DATA INCONSISTENCY
```

### Solution: Database Functions with Transactions

**File:** `database/create-mlm-functions.sql`

Created 4 PostgreSQL functions that wrap MLM operations in database transactions:

#### 1. `purchase_package_atomic()`
**Purpose:** Atomic package purchase with validation

**What it does:**
- Validates package exists and is active
- Validates amount is within min/max range
- Checks robot subscription is active
- Checks sufficient balance
- Calculates ROI percentage
- Deducts balance in ONE atomic operation
- Creates user_package record
- Creates transaction record
- **Rolls back EVERYTHING if any step fails**

**Usage:**
```sql
SELECT purchase_package_atomic(
  'user-uuid'::UUID,
  'package-uuid'::UUID,
  1000.00
);
```

**Returns:**
```json
{
  "success": true,
  "user_package_id": "up-uuid",
  "amount": 1000.00,
  "roi_percentage": 0.75,
  "message": "Package purchased successfully"
}
```

#### 2. `update_binary_volumes_atomic()`
**Purpose:** Atomic binary tree volume propagation

**What it does:**
- Gets user's position in binary tree (left or right)
- Traverses UP the tree to root
- Updates BOTH `binary_tree` and `users` tables
- **Rolls back ALL volume updates if any fail**

**Usage:**
```sql
SELECT update_binary_volumes_atomic(
  'user-uuid'::UUID,
  500.00
);
```

**Returns:**
```json
{
  "success": true,
  "nodes_updated": 5,
  "volume_added": 500.00
}
```

#### 3. `process_level_income_atomic()`
**Purpose:** Atomic 30-level commission distribution

**What it does:**
- Traverses sponsor chain up to 30 levels
- For each level, checks if sponsor has level unlocked
- Calculates commission based on level (currently hardcoded, will use config table)
- Credits wallet balance
- Creates level_income record
- Creates transaction record
- **Rolls back ALL commissions if any fail**

**Usage:**
```sql
SELECT process_level_income_atomic(
  'source-user-uuid'::UUID,
  1000.00,
  30  -- max levels
);
```

**Returns:**
```json
{
  "success": true,
  "levels_processed": 15,
  "recipients": 8,
  "total_distributed": 150.00
}
```

#### 4. `complete_package_purchase()` ⭐ **Main Function**
**Purpose:** Orchestrates ALL MLM operations in ONE transaction

**What it does:**
- Calls `purchase_package_atomic()`
- Calls `update_binary_volumes_atomic()`
- Calls `process_level_income_atomic()`
- **If ANY operation fails, ALL are rolled back**

**Usage:**
```sql
SELECT complete_package_purchase(
  'user-uuid'::UUID,
  'package-uuid'::UUID,
  1000.00
);
```

**Returns:**
```json
{
  "success": true,
  "purchase": { /* purchase details */ },
  "binary_volumes": { /* volume update details */ },
  "level_income": { /* commission details */ },
  "message": "Package purchase completed successfully"
}
```

### Deployment Steps

**Step 1: Deploy to Supabase**
```bash
# Option A: Via Supabase Dashboard
1. Go to SQL Editor
2. Paste contents of database/create-mlm-functions.sql
3. Click "Run"

# Option B: Via Supabase CLI
supabase db push
```

**Step 2: Verify Functions Exist**
```sql
SELECT proname, prosrc
FROM pg_proc
WHERE proname LIKE '%atomic%' OR proname = 'complete_package_purchase';
```

**Step 3: Test Functions**
```sql
-- Test with a real user and package UUID
SELECT complete_package_purchase(
  (SELECT id FROM users LIMIT 1),
  (SELECT id FROM packages WHERE is_active = TRUE LIMIT 1),
  100.00
);
```

**Step 4: Update Application Code**

In `app/services/mlm.service.ts`, replace direct database calls with RPC:

```typescript
// OLD CODE (multiple separate calls)
await supabase.from('users').update({ wallet_balance: ... });
await supabase.from('user_packages').insert({ ... });
await supabase.from('mlm_transactions').insert({ ... });

// NEW CODE (single atomic call)
const { data, error } = await supabase.rpc('complete_package_purchase', {
  p_user_id: userId,
  p_package_id: packageId,
  p_amount: amount
});

if (error) throw error;
// All operations completed atomically!
```

### Benefits

✅ **Data Integrity** - Impossible to have partial updates
✅ **Simplified Error Handling** - Single try/catch block
✅ **Better Performance** - Fewer network round trips
✅ **Easier Testing** - One function to test instead of multiple
✅ **Audit Trail** - Single entry point for monitoring

---

## Part 2: Database-Driven Business Rules

### Problem Statement

**Current State:**
- Business rules hardcoded in `app/types/mlm.types.ts`:
  - `LEVEL_INCOME_CONFIG` - Commission percentages for 30 levels
  - `MATCHING_BONUS_TIERS` - Binary matching bonus tiers
  - `RANK_REQUIREMENTS` - Rank advancement criteria
- Admins CANNOT modify these without code changes and redeployment
- No audit trail for configuration changes

### Solution: Configuration Tables

**File:** `database/create-business-rules-tables.sql`

Created 5 configuration tables:

#### 1. `level_income_config`
**Purpose:** Store commission percentages for each of 30 levels

**Schema:**
```sql
CREATE TABLE level_income_config (
  id UUID PRIMARY KEY,
  level INTEGER NOT NULL UNIQUE (1-30),
  percentage DECIMAL(5,2) NOT NULL (0-100),
  fixed_amount DECIMAL(10,2),
  calculation_type VARCHAR (percentage|fixed|hybrid),
  is_active BOOLEAN,
  description TEXT
);
```

**Default Data:** Pre-populated with 30 levels:
- Level 1: 10% (direct referral)
- Level 2: 5%
- Level 3: 3%
- Levels 4-5: 2%
- Levels 6-10: 1%
- Levels 11-15: 0.75%
- Levels 16-20: 0.5%
- Levels 21-30: 0.25-0.1%

**Admin Query Examples:**
```sql
-- View all level commissions
SELECT level, percentage, description
FROM level_income_config
ORDER BY level;

-- Update level 1 commission to 12%
UPDATE level_income_config
SET percentage = 12.00
WHERE level = 1;

-- Disable level 30 commission
UPDATE level_income_config
SET is_active = FALSE
WHERE level = 30;
```

#### 2. `matching_bonus_tiers`
**Purpose:** Configure binary matching bonus tiers

**Schema:**
```sql
CREATE TABLE matching_bonus_tiers (
  id UUID PRIMARY KEY,
  tier_name VARCHAR(50) UNIQUE,
  left_volume_required DECIMAL(12,2),
  right_volume_required DECIMAL(12,2),
  bonus_amount DECIMAL(10,2),
  tier_order INTEGER,
  is_active BOOLEAN
);
```

**Default Data:** 6 tiers pre-configured:
- Bronze Match: $1k left + $1k right = $100 bonus
- Silver Match: $5k + $5k = $500
- Gold Match: $10k + $10k = $1,200
- Platinum Match: $25k + $25k = $3,500
- Diamond Match: $50k + $50k = $8,000
- Crown Diamond: $100k + $100k = $18,000

**Admin Query Examples:**
```sql
-- Add new tier
INSERT INTO matching_bonus_tiers (
  tier_name, left_volume_required, right_volume_required,
  bonus_amount, tier_order, description
) VALUES (
  'Royal Diamond', 200000, 200000, 35000, 7,
  'Ultimate matching bonus'
);

-- Update bonus amount
UPDATE matching_bonus_tiers
SET bonus_amount = 150.00
WHERE tier_name = 'Bronze Match';
```

#### 3. `rank_requirements`
**Purpose:** Configure rank advancement criteria

**Schema:**
```sql
CREATE TABLE rank_requirements (
  id UUID PRIMARY KEY,
  rank_name VARCHAR(50) UNIQUE,
  rank_level INTEGER UNIQUE,
  min_total_volume DECIMAL(12,2),
  min_left_volume DECIMAL(12,2),
  min_right_volume DECIMAL(12,2),
  min_direct_referrals INTEGER,
  levels_unlocked INTEGER (0-30),
  reward_amount DECIMAL(10,2),
  monthly_bonus DECIMAL(10,2),
  rank_color VARCHAR(7)
);
```

**Default Data:** 7 ranks pre-configured:
- Starter: $0 volume, 0 levels unlocked
- Bronze: $1k volume, 5 levels, $50 reward
- Silver: $5k, 10 levels, $200
- Gold: $15k, 15 levels, $500
- Platinum: $35k, 20 levels, $1,200
- Diamond: $75k, 25 levels, $3,000
- Crown Diamond: $150k, 30 levels, $7,500

**Admin Query Examples:**
```sql
-- Add new rank between Gold and Platinum
INSERT INTO rank_requirements (
  rank_name, rank_level, min_total_volume,
  levels_unlocked, reward_amount, rank_color
) VALUES (
  'Emerald', 4, 25000, 17, 800, '#50C878'
);

-- Update Platinum reward
UPDATE rank_requirements
SET reward_amount = 1500.00
WHERE rank_name = 'Platinum';
```

#### 4. `binary_settings`
**Purpose:** Configure binary tree behavior

**Default Settings:**
- `spillover_enabled`: true
- `spillover_rule`: auto
- `placement_priority`: weaker-leg
- `capping_enabled`: true
- `daily_cap`: $1,000
- `weekly_cap`: $5,000
- `monthly_cap`: $20,000
- `matching_bonus_percentage`: 10%
- `carry_forward_enabled`: true
- `max_carry_forward_days`: 30

#### 5. `mlm_system_settings`
**Purpose:** General MLM system configuration

**Default Settings:**
- `robot_subscription_price`: $100
- `robot_subscription_duration_days`: 30
- `max_roi_multiplier`: 3 (300%)
- `roi_distribution_time`: 00:00 UTC
- `min_withdrawal_amount`: $10
- `withdrawal_fee_percentage`: 2%
- `kyc_required_for_withdrawal`: true

### Helper Functions

**3 utility functions for easy config access:**

```sql
-- Get level commission percentage
SELECT get_level_income_percentage(5);  -- Returns 2.00

-- Get system setting
SELECT get_system_setting('robot_subscription_price');  -- Returns '100'

-- Get rank by volume
SELECT * FROM get_rank_by_volume(50000);
-- Returns: {rank_name: 'Diamond', levels_unlocked: 25, ...}
```

### Deployment Steps

**Step 1: Deploy Tables**
```bash
# Via Supabase Dashboard SQL Editor
# Paste contents of database/create-business-rules-tables.sql
# Click "Run"
```

**Step 2: Verify Tables and Data**
```sql
-- Check all 5 tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE '%config%' OR table_name LIKE '%settings%'
  OR table_name = 'matching_bonus_tiers' OR table_name = 'rank_requirements';

-- Verify default data
SELECT COUNT(*) FROM level_income_config;  -- Should be 30
SELECT COUNT(*) FROM matching_bonus_tiers;  -- Should be 6
SELECT COUNT(*) FROM rank_requirements;  -- Should be 7
```

**Step 3: Update Application Code**

Replace hardcoded constants with database queries:

```typescript
// OLD CODE (mlm.types.ts)
export const LEVEL_INCOME_CONFIG = [
  { level: 1, amount: 10 },
  // ... hardcoded
];

// NEW CODE (mlm.service.ts)
const { data: levelConfig } = await supabase
  .from('level_income_config')
  .select('level, percentage')
  .eq('is_active', true)
  .order('level');

// Or use helper function
const { data: percentage } = await supabase
  .rpc('get_level_income_percentage', { p_level: 5 });
```

**Step 4: Create Admin UI** (Future enhancement)

Create admin pages for managing configurations:
- `/admin/config/level-income` - Manage level commissions
- `/admin/config/matching-bonus` - Manage matching tiers
- `/admin/config/ranks` - Manage rank requirements
- `/admin/config/binary` - Manage binary settings
- `/admin/config/system` - Manage system settings

### Benefits

✅ **Admin Flexibility** - Change config without code deployment
✅ **Audit Trail** - `updated_at` timestamps track all changes
✅ **Data Validation** - Database constraints ensure valid values
✅ **Easy Testing** - Test different configs without code changes
✅ **Multi-tenancy Ready** - Can support different configs per organization

---

## Migration Strategy

### Phase 1: Deploy (Immediate)
1. ✅ Deploy `create-mlm-functions.sql`
2. ✅ Deploy `create-business-rules-tables.sql`
3. ✅ Verify all functions and tables exist
4. ✅ Run test queries to ensure data is correct

### Phase 2: Update Application Code (Next Session)
1. Update `mlm.service.ts` to use RPC functions
2. Update config reading to use database tables
3. Keep old code as fallback during transition
4. Add feature flags to switch between old/new logic

### Phase 3: Testing (After Code Update)
1. Test package purchase with transaction functions
2. Test commission calculations with new config
3. Test rank advancement with database criteria
4. Monitor for any errors or inconsistencies

### Phase 4: Cleanup (After Stable)
1. Remove hardcoded constants from `mlm.types.ts`
2. Remove old non-transactional code
3. Add admin UI for managing configurations

---

## Rollback Plan

If issues occur:

**Rollback Functions:**
```sql
DROP FUNCTION IF EXISTS complete_package_purchase;
DROP FUNCTION IF EXISTS process_level_income_atomic;
DROP FUNCTION IF EXISTS update_binary_volumes_atomic;
DROP FUNCTION IF EXISTS purchase_package_atomic;
```

**Rollback Tables:**
```sql
DROP TABLE IF EXISTS level_income_config CASCADE;
DROP TABLE IF EXISTS matching_bonus_tiers CASCADE;
DROP TABLE IF EXISTS rank_requirements CASCADE;
DROP TABLE IF EXISTS binary_settings CASCADE;
DROP TABLE IF EXISTS mlm_system_settings CASCADE;
```

Application will fall back to hardcoded values.

---

## Testing Checklist

### Database Functions
- [ ] `purchase_package_atomic()` successfully creates package
- [ ] `purchase_package_atomic()` rolls back on insufficient balance
- [ ] `update_binary_volumes_atomic()` propagates volume correctly
- [ ] `process_level_income_atomic()` distributes to all 30 levels
- [ ] `complete_package_purchase()` rolls back if any step fails

### Configuration Tables
- [ ] All 30 levels present in `level_income_config`
- [ ] All 6 tiers present in `matching_bonus_tiers`
- [ ] All 7 ranks present in `rank_requirements`
- [ ] Binary settings have default values
- [ ] System settings have default values
- [ ] Helper functions return correct values

---

## Performance Considerations

**Database Functions:**
- ✅ Single network round-trip instead of multiple
- ✅ Reduced latency (database-side execution)
- ⚠️ More complex error debugging (errors in database logs)

**Configuration Tables:**
- ✅ Cached in application memory for frequent reads
- ✅ Indexed for fast lookups
- ⚠️ Need to invalidate cache when admin updates config

---

## Security Considerations

**Permissions:**
- Authenticated users: READ-ONLY access to config tables
- Authenticated users: EXECUTE permissions on functions
- Service role: FULL access to all tables and functions
- Admins: Special permissions to UPDATE config tables (via admin UI)

**Validation:**
- Database constraints prevent invalid values
- Functions validate inputs before processing
- Transactions ensure atomicity

---

## Monitoring

**Queries to Monitor:**

```sql
-- Check function usage
SELECT proname, prosrc
FROM pg_proc
WHERE proname IN (
  'complete_package_purchase',
  'purchase_package_atomic',
  'update_binary_volumes_atomic',
  'process_level_income_atomic'
);

-- Check config changes
SELECT * FROM level_income_config WHERE updated_at > NOW() - INTERVAL '7 days';
SELECT * FROM rank_requirements WHERE updated_at > NOW() - INTERVAL '7 days';

-- Check for errors in logs
SELECT * FROM postgres_logs WHERE message LIKE '%atomic%' AND level = 'ERROR';
```

---

**Documentation Created:** 2025-11-01
**Status:** Ready for Deployment
**Next Steps:** Deploy to Supabase and update application code
