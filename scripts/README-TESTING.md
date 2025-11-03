# MLM Testing Environment Setup

Complete guide for setting up and testing the MLM network with realistic data.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Scripts Overview](#scripts-overview)
- [Step-by-Step Guide](#step-by-step-guide)
- [Verification](#verification)
- [Test Users](#test-users)
- [Troubleshooting](#troubleshooting)

## Prerequisites

1. **Node.js** v18 or higher
2. **Supabase** project with MLM schema deployed
3. **Environment variables** configured in `.env`:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key (optional, for admin operations)
   ```
4. **Dependencies**:
   ```bash
   npm install @faker-js/faker
   ```

## Quick Start

```bash
# 1. Install faker (if not already installed)
npm install @faker-js/faker

# 2. Reset database (WARNING: Deletes all data!)
# Run this SQL file in Supabase SQL Editor:
# scripts/reset-database.sql

# 3. Seed 30-level MLM network
node scripts/seed-complete-mlm-network.js

# 4. Verify data integrity
node scripts/verify-mlm-data.js

# 5. Check test report
cat test-report.json
```

## Scripts Overview

### 1. `reset-database.sql`

**Purpose:** Clean database for fresh testing

**What it does:**
- Deletes ALL user data from all tables
- Keeps system configuration tables (packages, level_income_config, etc.)
- Resets auto-increment sequences
- Shows verification counts

**⚠️ WARNING:** This is destructive! Only use in development/testing.

**How to run:**
```sql
-- In Supabase SQL Editor, copy/paste the entire file and execute
```

### 2. `seed-complete-mlm-network.js`

**Purpose:** Generate realistic MLM network

**What it creates:**
- **150+ users** across 30 levels
- **2 system users**:
  - `admin@finaster.com` / `Admin123456!` (Admin)
  - `user@finaster.com` / `Test123456!` (Root user)
- **Realistic data**:
  - Unique names (via Faker.js)
  - Varied investment amounts ($100 - $50,000)
  - Different join dates (last 6 months)
  - Binary tree placements
  - Package purchases
  - Robot subscriptions (70% active)
  - KYC statuses (60% approved, 25% pending, 15% rejected)
  - Referral codes and relationships

**Network structure:**
- Level 1: 1 root user
- Each user sponsors 1-8 direct referrals (random)
- Maximum 30 levels deep
- Total ~150 users

**How to run:**
```bash
node scripts/seed-complete-mlm-network.js
```

**Expected output:**
```
═══════════════════════════════════════════════════════════════
🌱 MLM NETWORK SEED SCRIPT - 30 LEVELS
═══════════════════════════════════════════════════════════════

👤 Creating system users...

   ✅ Admin created: admin@finaster.com
   ✅ Root user created: user@finaster.com

═══════════════════════════════════════════════════════════════

🌳 Generating MLM network...

   Level 2: Created 5 users (Total: 6)
   Level 3: Created 18 users (Total: 24)
   ...
   Level 30: Created 2 users (Total: 152)

   ✅ Network generated: 152 users across 30 levels

📊 Calculating team counts...

   ✅ Team counts updated

═══════════════════════════════════════════════════════════════
✅ SEED COMPLETE
═══════════════════════════════════════════════════════════════

⏱️  Duration: 45.23s
👥 Total Users: 152
📊 Levels Created: 30

📋 Level Distribution:
   Level  1: 1 users
   Level  2: 5 users
   Level  3: 18 users
   ...
```

### 3. `verify-mlm-data.js`

**Purpose:** Validate database integrity

**Tests performed:**
1. ✅ **User Count** - Ensures users exist
2. ✅ **Level Distribution** - Verifies 30-level structure
3. ✅ **Binary Tree** - Validates parent-child relationships
4. ✅ **Referral Codes** - Checks code coverage
5. ✅ **Package Purchases** - Verifies investments
6. ✅ **Robot Subscriptions** - Validates subscriptions
7. ✅ **Team Counts** - Ensures accurate counts
8. ✅ **KYC Status** - Checks distribution
9. ✅ **Data Integrity** - Finds duplicates/orphans

**How to run:**
```bash
node scripts/verify-mlm-data.js
```

**Expected output:**
```
═══════════════════════════════════════════════════════════════
🔍 MLM DATA VERIFICATION
═══════════════════════════════════════════════════════════════

📋 Running verification tests...

   ✅ User Count: 152 users in database
   ✅ Level Distribution: Found 30 levels
   ✅ Binary Tree Structure: 152 nodes validated
   ✅ Referral Codes: 152 codes for 152 users
   ✅ Package Purchases: 152 packages purchased
   ✅ Robot Subscriptions: 106 active subscriptions
   ✅ Team Counts: Verified 152 users
   ✅ KYC Status Distribution: Verified KYC statuses
   ✅ Email Uniqueness: 0 duplicate emails found
   ✅ Referral Integrity: 0 orphan referrals

═══════════════════════════════════════════════════════════════
📊 TEST SUMMARY
═══════════════════════════════════════════════════════════════

📈 Database Statistics:
   Total Users: 152
   Total Packages: 152
   Total Referrals: 151
   Binary Tree Nodes: 152
   Total Investment: $3,456,789

✅ Passed: 10
❌ Failed: 0
⚠️  Warnings: 0

📊 Success Rate: 100.00%

📄 Report saved: test-report.json

═══════════════════════════════════════════════════════════════

✅ Verification PASSED - Database is ready for testing
```

**Report file:** `test-report.json`
```json
{
  "timestamp": "2025-01-15T10:30:00.000Z",
  "passed": 10,
  "failed": 0,
  "warnings": 0,
  "tests": [...],
  "summary": {
    "totalUsers": 152,
    "totalPackages": 152,
    "totalReferrals": 151,
    "totalBinaryNodes": 152,
    "totalInvestment": 3456789,
    "successRate": 100.00
  }
}
```

## Step-by-Step Guide

### Step 1: Reset Database

1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy contents of `scripts/reset-database.sql`
4. Execute SQL
5. Verify counts are 0

### Step 2: Seed Data

```bash
# Make sure you're in project root
cd C:\Projects\asterdex-8621-main

# Install dependencies if needed
npm install @faker-js/faker

# Run seed script
node scripts/seed-complete-mlm-network.js
```

**Wait for completion** (takes 30-60 seconds)

### Step 3: Verify Data

```bash
# Run verification
node scripts/verify-mlm-data.js

# Check report
cat test-report.json
```

### Step 4: Test Application

Now you can test all features:

1. **Login as root user:**
   - Email: `user@finaster.com`
   - Password: `Test123456!`

2. **Check /team page** - Should show your downline

3. **Check /dashboard** - Should show statistics

4. **Check /earnings** - Should show income

5. **Login as admin:**
   - Email: `admin@finaster.com`
   - Password: `Admin123456!`

6. **Test admin features** - User management, impersonation, etc.

## Test Users

### System Users

| Email | Password | Role | Purpose |
|-------|----------|------|---------|
| admin@finaster.com | Admin123456! | admin | Admin panel testing |
| user@finaster.com | Test123456! | user | Root MLM user |

### Generated Users

- **150+ users** with random names
- **All passwords:** `Test123456!`
- **Emails:** Generated by Faker (e.g., `john.doe123@example.com`)

To find user emails:
```sql
SELECT email, full_name, total_investment, direct_count
FROM users
WHERE role = 'user'
ORDER BY total_investment DESC
LIMIT 10;
```

## Troubleshooting

### Issue: "Failed to create user"

**Cause:** Supabase Auth issue or duplicate email

**Solution:**
1. Check Supabase Auth settings
2. Enable email confirmation bypass in Supabase
3. Run reset script again

### Issue: "Duplicate key violation"

**Cause:** Previous seed data not cleaned

**Solution:**
```bash
# Re-run reset script
# In Supabase SQL Editor:
# Execute reset-database.sql
```

### Issue: "Orphan users found"

**Cause:** Sponsor relationships broken

**Solution:**
```bash
# Re-run seed script
node scripts/seed-complete-mlm-network.js
```

### Issue: "Team page shows 0 users"

**Cause:** Not logged in as correct user or no downline

**Solution:**
1. Login as `user@finaster.com`
2. This is the root user with full downline
3. Check verification report for team counts

### Issue: "Script hangs/timeout"

**Cause:** Network issues or large dataset

**Solution:**
- Check internet connection
- Reduce `TARGET_USERS` in seed script
- Increase timeout in Supabase client

## Advanced Usage

### Custom Configuration

Edit `scripts/seed-complete-mlm-network.js`:

```javascript
const CONFIG = {
  MAX_LEVELS: 20,              // Change max levels
  TARGET_USERS: 100,           // Change total users
  DIRECT_REFERRALS_RANGE: [2, 5], // Change referrals per user
  ROBOT_SUBSCRIPTION_RATE: 0.8 // Change subscription rate
};
```

### Partial Reset

To reset only specific tables:

```sql
-- Reset only transactions
TRUNCATE TABLE mlm_transactions CASCADE;

-- Reset only packages
TRUNCATE TABLE user_packages CASCADE;
```

### Re-run Verification Only

```bash
# After making manual changes
node scripts/verify-mlm-data.js
```

## Best Practices

1. **Always backup production** data before running any scripts
2. **Test in development** environment first
3. **Verify data** after seeding
4. **Document** any custom modifications
5. **Version control** your seed scripts

## Support

If you encounter issues:

1. Check `test-report.json` for detailed errors
2. Review Supabase logs in dashboard
3. Check console output for error messages
4. Verify environment variables are set correctly

---

**Last Updated:** January 2025
**Version:** 1.0.0
