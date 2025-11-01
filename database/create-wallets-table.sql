-- ============================================
-- CREATE WALLETS TABLE AND ADD $10,000 BALANCE
-- ============================================
-- Run this in Supabase SQL Editor
-- Time: 5 seconds
-- ============================================

-- 1. Create wallets table
CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) UNIQUE NOT NULL,
  available_balance DECIMAL(18,6) DEFAULT 0,
  total_balance DECIMAL(18,6) DEFAULT 0,
  locked_balance DECIMAL(18,6) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON public.wallets(user_id);

-- 3. Enable Row Level Security
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

-- 4. Allow users to view their own wallet
DROP POLICY IF EXISTS "Users can view own wallet" ON public.wallets;
CREATE POLICY "Users can view own wallet"
  ON public.wallets
  FOR SELECT
  USING (user_id = auth.uid());

-- 5. Allow users to update their own wallet
DROP POLICY IF EXISTS "Users can update own wallet" ON public.wallets;
CREATE POLICY "Users can update own wallet"
  ON public.wallets
  FOR UPDATE
  USING (user_id = auth.uid());

-- 6. Add $10,000 to all existing users
INSERT INTO public.wallets (user_id, available_balance, total_balance)
SELECT id, 10000.00, 10000.00
FROM auth.users
ON CONFLICT (user_id)
DO UPDATE SET
  available_balance = 10000.00,
  total_balance = 10000.00;

-- 7. Verify wallets created
SELECT
  'SUCCESS! Wallets created' as message,
  COUNT(*) as total_wallets,
  SUM(available_balance) as total_balance
FROM public.wallets;

-- Expected output:
-- message: SUCCESS! Wallets created
-- total_wallets: 5
-- total_balance: 50000.00
