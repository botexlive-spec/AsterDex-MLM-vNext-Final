# 🌱 MLM Database Seeding Instructions

## 🔍 Problem Identified

After extensive debugging, I discovered the root cause of why users weren't persisting:

**Error:** `"new row violates row-level security policy for table 'users'"`

Even with `SERVICE_ROLE_KEY`, Supabase's Row Level Security (RLS) policies were blocking INSERT/UPSERT operations into the `users` table.

---

## ✅ Solution: 3-Step Process

### **Step 1: Disable RLS Temporarily**

Go to your Supabase Dashboard → SQL Editor and run:

```bash
scripts/disable-rls-for-seed.sql
```

Or copy and paste this SQL:

```sql
ALTER TABLE IF EXISTS public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.referral_codes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.referrals DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.binary_tree DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_packages DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.robot_subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.mlm_transactions DISABLE ROW LEVEL SECURITY;
```

**✓ Verify:** You should see all tables showing "RLS DISABLED"

---

### **Step 2: Run the Seed Script**

```bash
cd C:\Projects\asterdex-8621-main
node scripts/seed-with-debug.js
```

**Expected Output:**
```
🌱 Seeding with METHOD_1...
👤 Setting up root user...
   ✅ Retrieved existing user: user@finaster.com
   ✅ Root user record created in public.users

🌳 Creating network (20 users)...
   ✓ User 1: test...
   ✓ User 2: test...
   ...
✅ Created 21 users total
```

---

### **Step 3: Re-enable RLS (IMPORTANT!)**

Go back to Supabase Dashboard → SQL Editor and run:

```bash
scripts/enable-rls-after-seed.sql
```

Or copy and paste this SQL:

```sql
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.binary_tree ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.robot_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.mlm_transactions ENABLE ROW LEVEL SECURITY;
```

**✓ Verify:** You should see all tables showing "RLS ENABLED ✓"

---

### **Step 4: Verify Data**

```bash
node scripts/verify-mlm-data.js
```

**Expected Output:**
```
✅ User Count: 21 users in database
✅ Binary Tree Structure: 21 nodes validated
✅ Referral Codes: 21 codes for 21 users
📊 Success Rate: 100%
```

---

## 🎯 Quick Command Sequence

```bash
# 1. In Supabase SQL Editor, run:
#    scripts/disable-rls-for-seed.sql

# 2. In terminal:
cd C:\Projects\asterdex-8621-main
node scripts/cleanup-before-seed.js
node scripts/seed-with-debug.js

# 3. In Supabase SQL Editor, run:
#    scripts/enable-rls-after-seed.sql

# 4. Verify:
node scripts/verify-mlm-data.js
```

---

## 📝 Test Credentials

After successful seeding:

- **Email:** `user@finaster.com`
- **Password:** `Test123456!`

Login at: `http://localhost:5174/login`

---

## 🔧 What Was Fixed

1. ✅ **Found root cause:** RLS policies blocking inserts
2. ✅ **Fixed seed script:** Changed `.update()` to `.upsert()`
3. ✅ **Added error handling:** Proper error logging for debugging
4. ✅ **Created RLS management:** Scripts to safely disable/enable RLS
5. ✅ **Existing user handling:** Script now handles existing auth users gracefully

---

## 📊 What Gets Seeded

- **1 Root User:** `user@finaster.com` with:
  - Wallet balance: $5,000
  - Total investment: $10,000
  - Current rank: Starter
  - 30 levels unlocked
  - KYC: Approved

- **20 Downline Users:** Random test users with:
  - Faker.js generated names
  - Random wallet balances (0-$5,000)
  - Random investments (0-$50,000)
  - Mixed KYC statuses (approved/pending)
  - Proper sponsor relationships
  - Referral codes and binary tree nodes

---

## 🚨 Important Notes

- **NEVER leave RLS disabled in production!**
- RLS must be re-enabled after seeding for security
- The scripts are designed for **test environments only**
- For production, configure RLS policies to allow SERVICE_ROLE_KEY operations

---

## 🎉 Success Checklist

- [ ] Ran `disable-rls-for-seed.sql` in Supabase
- [ ] Ran `node scripts/seed-with-debug.js` successfully
- [ ] Saw "✅ Created 21 users total" message
- [ ] Ran `enable-rls-after-seed.sql` in Supabase
- [ ] Ran `node scripts/verify-mlm-data.js` - shows 21 users
- [ ] Logged into app with user@finaster.com
- [ ] /team page shows 20 team members
- [ ] All pages load without errors

---

## 🔍 Troubleshooting

**If seed fails with RLS error:**
- Make sure you ran Step 1 (disable RLS) first
- Verify in Supabase that RLS is actually disabled
- Check that you're using the correct project

**If verification shows 0 users:**
- Run the seed script again
- Check Supabase logs for any errors
- Ensure `SUPABASE_SERVICE_ROLE_KEY` is correct in .env

**If /team page shows no data:**
- Log out and log back in
- Check browser console for errors
- Verify user@finaster.com has sponsor relationships

---

## 📚 Related Files

- `scripts/seed-with-debug.js` - Main seeding script with 4 auth methods
- `scripts/verify-mlm-data.js` - 10 comprehensive data tests
- `scripts/cleanup-before-seed.js` - Clean existing data
- `scripts/disable-rls-for-seed.sql` - Disable RLS for seeding
- `scripts/enable-rls-after-seed.sql` - Re-enable RLS after seeding
- `scripts/README-TESTING.md` - General testing documentation
- `MANUAL-SETUP-GUIDE.md` - Manual setup fallback

---

**Total Time:** 5-10 minutes
**Complexity:** Medium (requires SQL Editor access)
**Safety:** Test environment only - requires manual RLS management
