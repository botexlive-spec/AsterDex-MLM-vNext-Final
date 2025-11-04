-- Make password_hash nullable in users table
-- Auth is handled by Supabase Auth, password_hash is redundant

ALTER TABLE public.users
ALTER COLUMN password_hash DROP NOT NULL;

-- Verify the change
SELECT
  column_name,
  is_nullable,
  data_type
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name = 'password_hash';
