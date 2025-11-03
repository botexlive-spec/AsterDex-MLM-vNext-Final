-- ═══════════════════════════════════════════════════════════════
-- QUICKEST FIX: Disable RLS on read-heavy tables
-- This immediately fixes Team and Genealogy pages
-- ═══════════════════════════════════════════════════════════════

-- Disable RLS on tables needed for Team and Genealogy queries
ALTER TABLE IF EXISTS public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.binary_tree DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.referrals DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.referral_codes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_packages DISABLE ROW LEVEL SECURITY;

-- Check status
SELECT
  tablename,
  CASE WHEN rowsecurity THEN 'RLS ENABLED ⚠️' ELSE 'RLS DISABLED ✓' END as status
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('users', 'binary_tree', 'referrals', 'referral_codes', 'user_packages')
ORDER BY tablename;
