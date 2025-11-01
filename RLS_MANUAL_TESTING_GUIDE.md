# 🧪 RLS Policies - Manual Testing Guide
**Date:** 2025-11-01
**Purpose:** Step-by-step manual testing procedures for Row-Level Security policies

---

## 📋 Prerequisites

Before testing RLS policies:

1. ✅ **RLS SQL script deployed** to Supabase
   - Run `database/enable-rls-policies.sql` in Supabase SQL Editor

2. ✅ **Test users created** with different roles:
   - Regular user (role: 'user')
   - Admin user (role: 'admin' or 'superadmin')

3. ✅ **Test data exists** in tables:
   - At least 2 users
   - Sample transactions/packages/wallets

---

## 🔍 Testing Method Options

### Option 1: Supabase Dashboard (Easiest)
Use Supabase Dashboard's built-in SQL editor and authentication features.

### Option 2: Application UI (Most Realistic)
Test through your actual application's user interface.

### Option 3: API Calls (Most Thorough)
Use Postman or similar to test API endpoints directly.

---

## ✅ Test Checklist

### Part 1: Verify RLS is Enabled

**Test in Supabase SQL Editor:**

```sql
-- Check which tables have RLS enabled
SELECT
  tablename,
  rowsecurity as "RLS Enabled"
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'users', 'wallets', 'user_packages', 'mlm_transactions',
    'kyc_documents', 'deposits', 'withdrawal_requests',
    'admin_actions', 'commission_runs', 'packages'
  )
ORDER BY tablename;
```

**Expected Result:**
- All listed tables should have `RLS Enabled = true`

**Status:** ☐ Pass  ☐ Fail

---

### Part 2: Test User Data Isolation

#### Test 2.1: User Can Only See Own Data

**Steps:**
1. Login to application as **regular user** (user A)
2. Navigate to "My Transactions" page
3. Note the user_id of logged-in user

**In Supabase SQL Editor (as service role):**
```sql
-- First, get the user's ID
SELECT id, email FROM users WHERE role = 'user' LIMIT 1;

-- Check what transactions exist for this user
SELECT user_id, COUNT(*) as transaction_count
FROM mlm_transactions
GROUP BY user_id;
```

**In Application UI:**
- User should ONLY see their own transactions
- Should NOT see any transactions with different user_id

**Manual Verification:**
```sql
-- Set the user ID from step 1
SET LOCAL row_security = on;
SET LOCAL ROLE authenticated;
-- Simulate user authentication (this is conceptual)

SELECT * FROM mlm_transactions;
-- Should only return rows where user_id matches authenticated user
```

**Status:** ☐ Pass  ☐ Fail

---

#### Test 2.2: User Cannot See Other Users' Wallets

**Steps:**
1. Login as **user A**
2. Navigate to wallet page
3. Check the wallet balance displayed

**In Supabase:**
```sql
-- Get all wallets
SELECT user_id, balance FROM wallets;
-- Note: You should see multiple wallets for different users
```

**Test:**
- User A should ONLY see their own wallet
- Try to access `/api/wallet?user_id={other_user_id}` (should fail)

**Status:** ☐ Pass  ☐ Fail

---

#### Test 2.3: User Cannot See Other Users' Packages

**Steps:**
1. Login as **user A**
2. View active packages page

**Verification:**
```sql
-- Count packages per user
SELECT user_id, COUNT(*) FROM user_packages GROUP BY user_id;
```

**Test:**
- User A should ONLY see packages where they are the user_id
- Should not be able to query packages of other users

**Status:** ☐ Pass  ☐ Fail

---

### Part 3: Test Admin Access

#### Test 3.1: Admin Can See All Users

**Steps:**
1. Login as **admin user**
2. Navigate to "Admin > Users Management"
3. View users list

**Verification:**
```sql
-- Total users in database
SELECT COUNT(*) as total_users FROM users;
```

**Test:**
- Admin should see ALL users (count should match database)
- Regular user should NOT be able to access this page

**Status:** ☐ Pass  ☐ Fail

---

#### Test 3.2: Admin Can See All Transactions

**Steps:**
1. Login as **admin user**
2. Navigate to "Admin > Financial Management > All Transactions"

**Verification:**
```sql
-- Total transactions
SELECT COUNT(*) as total FROM mlm_transactions;

-- Transactions per user
SELECT user_id, COUNT(*) FROM mlm_transactions GROUP BY user_id;
```

**Test:**
- Admin should see transactions from ALL users
- Total count should match database total

**Status:** ☐ Pass  ☐ Fail

---

#### Test 3.3: Admin Can See All Wallets

**Steps:**
1. Login as **admin user**
2. Navigate to "Admin > Financial Management > Wallets"

**Verification:**
```sql
SELECT COUNT(*) as total_wallets FROM wallets;
```

**Test:**
- Admin should see all wallets
- Can view balances for all users

**Status:** ☐ Pass  ☐ Fail

---

### Part 4: Test Admin-Only Tables

#### Test 4.1: Regular User Cannot Access Admin Actions

**Steps:**
1. Login as **regular user**
2. Try to access admin actions (should fail)

**API Test (if applicable):**
```javascript
// This should fail for regular users
fetch('/api/admin/actions')
  .then(res => {
    if (res.status === 403 || res.status === 401) {
      console.log('✓ Access correctly blocked');
    } else {
      console.error('✗ User can access admin table!');
    }
  });
```

**Status:** ☐ Pass  ☐ Fail

---

#### Test 4.2: Admin Can Access Admin Actions

**Steps:**
1. Login as **admin user**
2. Navigate to "Admin > Audit Logs"
3. View admin actions

**Verification:**
```sql
SELECT COUNT(*) FROM admin_actions;
```

**Test:**
- Admin should see all admin actions
- Regular user should be blocked

**Status:** ☐ Pass  ☐ Fail

---

### Part 5: Test Configuration Tables

#### Test 5.1: User Can Read Packages (Public Read)

**Steps:**
1. Login as **regular user**
2. Navigate to "Packages" page
3. View available packages

**Verification:**
```sql
SELECT COUNT(*) FROM packages WHERE active = true;
```

**Test:**
- User should be able to see active packages
- This is expected (public read for config tables)

**Status:** ☐ Pass  ☐ Fail

---

#### Test 5.2: User Cannot Modify Packages

**Steps:**
1. Login as **regular user**
2. Try to create/edit a package (should fail)

**API Test:**
```javascript
// This should fail for regular users
fetch('/api/packages', {
  method: 'POST',
  body: JSON.stringify({ name: 'Test Package', amount: 100 })
})
  .then(res => {
    if (res.status === 403 || res.status === 401) {
      console.log('✓ Write correctly blocked');
    } else {
      console.error('✗ User can modify packages!');
    }
  });
```

**Status:** ☐ Pass  ☐ Fail

---

#### Test 5.3: Admin Can Modify Packages

**Steps:**
1. Login as **admin user**
2. Navigate to "Admin > System Configuration > Packages"
3. Try to edit a package

**Test:**
- Admin should successfully update package
- Changes should be saved to database

**Status:** ☐ Pass  ☐ Fail

---

### Part 6: Test Binary Tree Access

#### Test 6.1: Authenticated Users Can View Binary Tree

**Steps:**
1. Login as **regular user**
2. Navigate to "Genealogy" or "Binary Tree" page

**Test:**
- User should be able to view binary tree structure
- This is expected (genealogy needs tree visibility)

**Status:** ☐ Pass  ☐ Fail

---

#### Test 6.2: Unauthenticated Users Cannot View Binary Tree

**Steps:**
1. Logout completely
2. Try to access binary tree endpoint

**Test:**
- Should be redirected to login
- Should NOT see any binary tree data

**Status:** ☐ Pass  ☐ Fail

---

### Part 7: Test Referral System

#### Test 7.1: User Can See Own Referral Code

**Steps:**
1. Login as **user A**
2. View "My Referral Code" page

**Verification:**
```sql
SELECT user_id, code FROM referral_codes;
```

**Test:**
- User should ONLY see their own referral codes
- Should not see codes of other users

**Status:** ☐ Pass  ☐ Fail

---

#### Test 7.2: User Can See Referrals They Made

**Steps:**
1. Login as **user A** (who has referred someone)
2. View "My Referrals" page

**Verification:**
```sql
SELECT referrer_id, referred_id, COUNT(*)
FROM referrals
GROUP BY referrer_id, referred_id;
```

**Test:**
- User should see referrals where they are the referrer
- Should also see referrals where they are the referred (their own signup)

**Status:** ☐ Pass  ☐ Fail

---

### Part 8: Test KYC & Financial Operations

#### Test 8.1: User Can Only See Own KYC Documents

**Steps:**
1. Login as **user A**
2. View KYC documents page

**Test:**
- Should ONLY see own KYC documents
- Should not see other users' documents

**Status:** ☐ Pass  ☐ Fail

---

#### Test 8.2: Admin Can See All KYC Documents

**Steps:**
1. Login as **admin user**
2. Navigate to "Admin > KYC Management"

**Verification:**
```sql
SELECT COUNT(*) FROM kyc_documents;
```

**Test:**
- Admin should see KYC documents from all users
- Can approve/reject any user's documents

**Status:** ☐ Pass  ☐ Fail

---

#### Test 8.3: User Can Only See Own Deposits

**Steps:**
1. Login as **user A**
2. View deposit history

**Test:**
- Should ONLY see own deposit records
- Cannot access other users' deposits

**Status:** ☐ Pass  ☐ Fail

---

#### Test 8.4: User Can Only See Own Withdrawal Requests

**Steps:**
1. Login as **user A**
2. View withdrawal history

**Test:**
- Should ONLY see own withdrawal requests
- Cannot access other users' requests

**Status:** ☐ Pass  ☐ Fail

---

## 🔧 Quick SQL Tests

Run these in Supabase SQL Editor to quickly verify RLS:

### Test 1: Check RLS Status
```sql
SELECT
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

### Test 2: Count Policies Per Table
```sql
SELECT
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY policy_count DESC, tablename;
```

### Test 3: List All Policies
```sql
SELECT
  tablename,
  policyname,
  cmd as operation,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

---

## 📊 Test Results Summary

| Test Category | Tests | Passed | Failed |
|--------------|-------|--------|--------|
| RLS Enabled | 13 | ☐ | ☐ |
| User Data Isolation | 3 | ☐ | ☐ |
| Admin Access | 3 | ☐ | ☐ |
| Admin-Only Tables | 2 | ☐ | ☐ |
| Config Tables | 3 | ☐ | ☐ |
| Binary Tree | 2 | ☐ | ☐ |
| Referrals | 2 | ☐ | ☐ |
| KYC & Financial | 4 | ☐ | ☐ |
| **TOTAL** | **32** | **☐** | **☐** |

---

## 🚨 Common Issues & Fixes

### Issue 1: RLS Not Enabled
**Symptom:** Users can see all data regardless of ownership

**Fix:**
```sql
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
```

### Issue 2: No Policies Created
**Symptom:** RLS enabled but all queries return no data

**Fix:** Run the `database/enable-rls-policies.sql` script

### Issue 3: Admin Cannot See Data
**Symptom:** Admin users see no data or only their own

**Fix:** Check admin policies exist:
```sql
SELECT * FROM pg_policies
WHERE tablename = 'users'
AND policyname LIKE '%admin%';
```

### Issue 4: Service Role Blocked
**Symptom:** Background jobs fail

**Fix:** Service role should bypass RLS (check your Supabase client setup)

---

## ✅ Completion Checklist

After testing, verify:

- [ ] All tables have RLS enabled
- [ ] Users can only see their own data
- [ ] Admins can see all data
- [ ] Regular users blocked from admin tables
- [ ] Config tables readable by all users
- [ ] Config tables only writable by admins
- [ ] Binary tree accessible to authenticated users
- [ ] Referral system working correctly
- [ ] KYC & financial data properly isolated
- [ ] No unexpected errors in application logs

---

## 📝 Documentation

**Test Date:** _____________

**Tester:** _____________

**Supabase Project:** _____________

**Overall Result:**  ☐ PASS  ☐ FAIL

**Notes:**
```
_________________________________________
_________________________________________
_________________________________________
```

---

**Next Steps After Successful Testing:**

1. ✅ Mark RLS verification task as complete
2. ✅ Document any policy adjustments made
3. ✅ Update deployment checklist
4. ✅ Proceed with production deployment planning

---

*RLS Manual Testing Guide - Finaster MLM Platform*
*Generated: 2025-11-01*
