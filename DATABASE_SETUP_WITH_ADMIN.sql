-- ============================================
-- COMPLETE DATABASE SETUP WITH ADMIN USER
-- Run this script in Supabase SQL Editor
-- ============================================

-- STEP 1: Run base schema (if not already done)
-- Copy contents from database-schema.sql first, then:
-- Copy contents from database-mlm-schema.sql

-- STEP 2: Create admin and test users
-- This script creates users directly in Supabase auth

-- ============================================
-- CREATE ADMIN USER
-- ============================================

-- Admin User
-- Email: admin@asterdex.com
-- Password: admin123
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@asterdex.com',
  crypt('admin123', gen_salt('bf')),
  NOW(),
  '{"full_name": "Admin User", "role": "admin"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
) ON CONFLICT (email) DO UPDATE SET
  encrypted_password = crypt('admin123', gen_salt('bf')),
  raw_user_meta_data = '{"full_name": "Admin User", "role": "admin"}',
  email_confirmed_at = NOW();

-- ============================================
-- CREATE TEST USER
-- ============================================

-- Regular User
-- Email: user@asterdex.com
-- Password: user123
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'user@asterdex.com',
  crypt('user123', gen_salt('bf')),
  NOW(),
  '{"full_name": "Test User", "role": "user"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
) ON CONFLICT (email) DO UPDATE SET
  encrypted_password = crypt('user123', gen_salt('bf')),
  raw_user_meta_data = '{"full_name": "Test User", "role": "user"}',
  email_confirmed_at = NOW();

-- ============================================
-- UPDATE PUBLIC USERS TABLE
-- ============================================

-- Insert into public.users from auth.users
INSERT INTO public.users (
  id,
  email,
  full_name,
  role,
  email_verified,
  is_active,
  wallet_balance,
  total_investment,
  total_earnings,
  robot_subscription_active,
  kyc_status,
  created_at,
  updated_at
)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', u.email),
  CASE
    WHEN u.email = 'admin@asterdex.com' THEN 'admin'::user_role
    ELSE 'user'::user_role
  END,
  true,
  true,
  1000.00, -- Starting balance for testing
  0,
  0,
  false,
  'not_submitted'::kyc_status,
  u.created_at,
  NOW()
FROM auth.users u
WHERE u.email IN ('admin@asterdex.com', 'user@asterdex.com')
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  email_verified = EXCLUDED.email_verified,
  wallet_balance = EXCLUDED.wallet_balance,
  updated_at = NOW();

-- ============================================
-- CREATE SAMPLE PACKAGES
-- ============================================

INSERT INTO public.packages (
  name,
  tier,
  min_amount,
  max_amount,
  roi_percentage_min,
  roi_percentage_max,
  description,
  benefits,
  is_active
) VALUES
  (
    'Starter Package',
    'tier_1',
    100.00,
    2000.00,
    5.00,
    7.00,
    'Perfect for beginners. Start earning with our entry-level package.',
    '{"features": ["5-7% ROI", "Level income", "Binary bonuses", "Rank rewards"]}',
    true
  ),
  (
    'Growth Package',
    'tier_2',
    2001.00,
    5000.00,
    7.00,
    9.00,
    'Ideal for growing your business. Enhanced earning potential.',
    '{"features": ["7-9% ROI", "Level income", "Binary bonuses", "Rank rewards", "Priority support"]}',
    true
  ),
  (
    'Premium Package',
    'tier_3',
    5001.00,
    999999.00,
    10.00,
    12.00,
    'Maximum earning potential for serious investors.',
    '{"features": ["10-12% ROI", "Level income", "Binary bonuses", "Rank rewards", "VIP support", "Exclusive bonuses"]}',
    true
  )
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- INSERT SYSTEM SETTINGS
-- ============================================

INSERT INTO public.system_settings (setting_key, setting_value, description) VALUES
  ('robot_subscription_price', '100', 'Robot subscription price in USD'),
  ('robot_subscription_duration_days', '30', 'Robot subscription duration'),
  ('min_withdrawal_amount', '50', 'Minimum withdrawal amount'),
  ('withdrawal_fee_percentage', '2', 'Withdrawal fee percentage'),
  ('referral_commission_rate', '0.1', 'Referral commission rate (10%)'),
  ('kyc_required_for_withdrawal', 'true', 'Require KYC for withdrawals'),
  ('matching_bonus_enabled', 'true', 'Enable matching bonus system'),
  ('rank_rewards_enabled', 'true', 'Enable rank reward system'),
  ('booster_income_days', '30', 'Days for booster income qualification')
ON CONFLICT (setting_key) DO UPDATE SET
  setting_value = EXCLUDED.setting_value,
  updated_at = NOW();

-- ============================================
-- CREATE WELCOME NOTIFICATIONS
-- ============================================

INSERT INTO public.notifications (user_id, title, message, notification_type, is_read)
SELECT
  u.id,
  'Welcome to Asterdex MLM! 🎉',
  'Start your journey by activating your robot subscription ($100) and purchasing your first package.',
  'system',
  false
FROM public.users u
WHERE u.email IN ('admin@asterdex.com', 'user@asterdex.com')
  AND NOT EXISTS (
    SELECT 1 FROM public.notifications
    WHERE user_id = u.id
    AND title = 'Welcome to Asterdex MLM! 🎉'
  );

-- ============================================
-- VERIFY SETUP
-- ============================================

-- Check if users were created
SELECT
  email,
  full_name,
  role,
  wallet_balance,
  email_verified,
  created_at
FROM public.users
WHERE email IN ('admin@asterdex.com', 'user@asterdex.com');

-- Check packages
SELECT name, tier, min_amount, max_amount, roi_percentage_min, roi_percentage_max
FROM public.packages
WHERE is_active = true;

-- Check system settings
SELECT setting_key, setting_value, description
FROM public.system_settings;

-- ============================================
-- SETUP COMPLETE!
-- ============================================

-- You can now login with:
-- Admin: admin@asterdex.com / admin123
-- User:  user@asterdex.com  / user123

-- Both users have $1000 starting balance for testing

-- Next steps:
-- 1. Configure .env file with your Supabase credentials
-- 2. Start the app: npm run dev
-- 3. Go to: http://localhost:5173/login
-- 4. Login with credentials above
