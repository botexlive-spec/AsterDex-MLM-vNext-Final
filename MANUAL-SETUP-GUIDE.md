# 📝 Manual Test Environment Setup

Since automated user creation is blocked, follow these steps for manual setup:

## ✅ Quick Setup (5 minutes)

### Step 1: Create Root User in Supabase

1. **Go to Supabase Dashboard:**
   ```
   https://supabase.com/dashboard/project/dsgtyrwtlpnckvcozfbc/auth/users
   ```

2. **Click "Add user" → "Create new user"**

3. **Fill in:**
   - Email: `user@finaster.com`
   - Password: `Test123456!`
   - ✅ **Check:** "Auto Confirm User"
   - Click "Create user"

4. **Repeat for admin (optional):**
   - Email: `admin@finaster.com`
   - Password: `Admin123456!`
   - ✅ Auto Confirm
   - After creation, update role to 'admin' in users table

### Step 2: Login to Application

1. **Go to:** http://localhost:5174/login

2. **Login with:**
   - Email: `user@finaster.com`
   - Password: `Test123456!`

3. **This will:**
   - Create user record in `users` table
   - Initialize MLM structure
   - Generate referral code

### Step 3: Create Test Team Members (Option A - Through App)

**Use the application's registration:**

1. **Get your referral link:**
   - Login as `user@finaster.com`
   - Go to Profile or Referrals page
   - Copy your referral code (e.g., `ABC12345`)

2. **Register downline users:**
   - Open incognito window
   - Go to: `http://localhost:5174/register?ref=ABC12345`
   - Register with test emails:
     - `test1@example.com`
     - `test2@example.com`
     - `test3@example.com`
     - etc.
   - Password: `Test123456!`

3. **Each new user becomes your downline**

### Step 3: Create Test Team Members (Option B - Quick SQL)

**Or run this SQL in Supabase:**

```sql
-- Insert 10 quick test users under root user
DO $$
DECLARE
    root_user_id UUID;
    new_user_id UUID;
    i INTEGER;
BEGIN
    -- Get root user ID
    SELECT id INTO root_user_id FROM users WHERE email = 'user@finaster.com';

    -- Create 10 test users
    FOR i IN 1..10 LOOP
        new_user_id := gen_random_uuid();

        -- Insert into auth.users (if you have access)
        -- Or just insert into public.users

        INSERT INTO users (
            id, email, full_name, role, sponsor_id,
            wallet_balance, total_investment, total_earnings,
            direct_count, team_count, current_rank,
            kyc_status, is_active
        ) VALUES (
            new_user_id,
            'test' || i || '@example.com',
            'Test User ' || i,
            'user',
            root_user_id,
            1000,
            5000,
            0,
            0,
            0,
            'starter',
            'approved',
            true
        );

        -- Create referral code
        INSERT INTO referral_codes (user_id, code, clicks, signups, is_active)
        VALUES (new_user_id, 'TEST' || LPAD(i::text, 4, '0'), 0, 0, true);

        -- Create referral record
        INSERT INTO referrals (referrer_id, referee_id, referral_code, status, commission_earned)
        VALUES (root_user_id, new_user_id, 'TEST' || LPAD(i::text, 4, '0'), 'active', 0);

        -- Create binary tree node
        INSERT INTO binary_tree (user_id, parent_id, level, position, left_volume, right_volume)
        VALUES (new_user_id, root_user_id, 1, CASE WHEN i % 2 = 0 THEN 'left' ELSE 'right' END, 0, 0);

    END LOOP;

    -- Update root user's team count
    UPDATE users
    SET direct_count = 10, team_count = 10
    WHERE id = root_user_id;

    RAISE NOTICE 'Created 10 test users under user@finaster.com';
END $$;
```

## ✅ Verification

### Check if setup worked:

1. **Login as `user@finaster.com`**

2. **Go to /team page**
   - Should show 10 team members
   - Should show statistics

3. **Go to /dashboard**
   - Should show team count: 10
   - Should show your referral code

## 🎯 What You Can Test Now:

✅ **User Dashboard** - Stats, earnings, notifications
✅ **Team Page** - View downline, team statistics
✅ **Referrals** - Referral code, link sharing
✅ **Genealogy** - Binary tree visualization
✅ **Earnings** - Income reports, transactions
✅ **Packages** - Purchase packages (if you add wallet balance)
✅ **Robot** - Subscribe to trading robot
✅ **KYC** - Submit verification
✅ **Profile** - Update info, settings

## 🔧 Add More Test Users

**Quick add via SQL:**

```sql
-- Add one user
INSERT INTO users (id, email, full_name, role, sponsor_id, wallet_balance, is_active)
SELECT
    gen_random_uuid(),
    'newuser@example.com',
    'New User',
    'user',
    id,
    1000,
    true
FROM users WHERE email = 'user@finaster.com';
```

## 📊 Check Current Data:

```sql
-- See all users and their team
SELECT
    u.email,
    u.full_name,
    u.direct_count,
    u.team_count,
    u.total_investment,
    s.email as sponsor_email
FROM users u
LEFT JOIN users s ON u.sponsor_id = s.id
WHERE u.role = 'user'
ORDER BY u.created_at;
```

## 🚨 Troubleshooting

### Team page shows 0 users:
- Make sure you're logged in as `user@finaster.com`
- Check SQL: `SELECT COUNT(*) FROM users WHERE sponsor_id = (SELECT id FROM users WHERE email = 'user@finaster.com')`
- Re-run the quick SQL script above

### Can't login:
- Verify user exists: Supabase Dashboard → Authentication → Users
- Check "Auto Confirm User" was checked
- Try password reset

### Permission errors:
- Check RLS policies on users table
- Temporarily disable: `ALTER TABLE users DISABLE ROW LEVEL SECURITY;`

## ✅ Success Checklist

- [ ] Created user@finaster.com in Supabase Auth
- [ ] Logged into application successfully
- [ ] See dashboard with user info
- [ ] Added 10 test team members (via app OR SQL)
- [ ] /team page shows team members
- [ ] Team statistics display correctly
- [ ] Can navigate all pages without errors

---

## 🎉 You're Ready!

Once you complete these steps, you have a working test environment to demonstrate all MLM features.

**Estimated time:** 5-10 minutes
**Users created:** 11 (1 root + 10 downline)
**Fully functional:** ✅

---

Need help? The automated scripts are available in `scripts/` folder but require SERVICE_ROLE_KEY permissions that may be restricted by Supabase.
