-- Add missing total_withdrawal column to users table
-- Run this in Supabase SQL Editor

ALTER TABLE users
ADD COLUMN IF NOT EXISTS total_withdrawal DECIMAL(20,8) DEFAULT 0.00000000;

-- Add comment
COMMENT ON COLUMN users.total_withdrawal IS 'Total amount withdrawn by user';

-- Verify the column was added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'total_withdrawal';
