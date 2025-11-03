-- ═══════════════════════════════════════════════════════════════
-- TEMPORARILY DISABLE RLS FOR SEEDING
-- Run this BEFORE seed script, then run enable-rls-after-seed.sql AFTER
-- ═══════════════════════════════════════════════════════════════

-- Disable RLS on key tables
ALTER TABLE IF EXISTS public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.referral_codes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.referrals DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.binary_tree DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_packages DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.robot_subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.mlm_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.level_incomes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.matching_bonuses DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.rank_achievements DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.booster_incomes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notifications DISABLE ROW LEVEL SECURITY;

SELECT
  tablename,
  CASE
    WHEN rowsecurity THEN 'RLS ENABLED'
    ELSE 'RLS DISABLED'
  END as status
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
  'users', 'referral_codes', 'referrals', 'binary_tree',
  'user_packages', 'robot_subscriptions', 'mlm_transactions',
  'level_incomes', 'matching_bonuses', 'rank_achievements',
  'booster_incomes', 'notifications'
)
ORDER BY tablename;
