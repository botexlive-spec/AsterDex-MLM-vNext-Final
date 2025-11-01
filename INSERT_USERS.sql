-- ============================================
-- INSERT USERS INTO PUBLIC.USERS TABLE
-- Run this in Supabase SQL Editor
-- ============================================

-- First, let's check if users exist in public.users
SELECT id, email, role, email_verified FROM public.users;

-- If the table is empty, we need to insert the users manually
-- Get the user IDs from auth.users first
SELECT id, email FROM auth.users WHERE email IN ('admin@asterdex.com', 'user@asterdex.com');

-- Insert admin user into public.users (replace USER_ID with actual ID from above query)
-- You'll need to run the SELECT query above first to get the actual UUIDs
-- Then uncomment and update the INSERT statements below with the correct IDs

/*
INSERT INTO public.users (
  id,
  email,
  password_hash,
  full_name,
  role,
  email_verified,
  is_active,
  wallet_balance,
  created_at,
  updated_at
) VALUES (
  'REPLACE_WITH_ADMIN_UUID_FROM_AUTH_USERS',
  'admin@asterdex.com',
  'from_auth',
  'Admin User',
  'admin',
  true,
  true,
  1000.00,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  email_verified = EXCLUDED.email_verified,
  updated_at = NOW();

INSERT INTO public.users (
  id,
  email,
  password_hash,
  full_name,
  role,
  email_verified,
  is_active,
  wallet_balance,
  created_at,
  updated_at
) VALUES (
  'REPLACE_WITH_USER_UUID_FROM_AUTH_USERS',
  'user@asterdex.com',
  'from_auth',
  'Test User',
  'user',
  true,
  true,
  1000.00,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  email_verified = EXCLUDED.email_verified,
  updated_at = NOW();
*/
