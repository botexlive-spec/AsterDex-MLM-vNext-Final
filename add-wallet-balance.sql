-- Add test balance to your wallet
-- Run this in Supabase SQL Editor

-- First, check if you have a wallet
SELECT user_id, available_balance, total_balance
FROM wallets
WHERE user_id = auth.uid();

-- If you don't have a wallet, create one with $10,000 test balance
INSERT INTO wallets (user_id, available_balance, total_balance)
VALUES (
  auth.uid(),
  10000.00,
  10000.00
)
ON CONFLICT (user_id)
DO UPDATE SET
  available_balance = 10000.00,
  total_balance = 10000.00;

-- Verify
SELECT user_id, available_balance, total_balance
FROM wallets
WHERE user_id = auth.uid();
