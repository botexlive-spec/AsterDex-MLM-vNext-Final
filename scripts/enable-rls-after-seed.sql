-- ═══════════════════════════════════════════════════════════════
-- RE-ENABLE RLS AFTER SEEDING
-- Run this AFTER seed script completes successfully
-- ═══════════════════════════════════════════════════════════════

-- Re-enable RLS on key tables
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.binary_tree ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.robot_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.mlm_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.level_incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.matching_bonuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.rank_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.booster_incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notifications ENABLE ROW LEVEL SECURITY;

SELECT
  tablename,
  CASE
    WHEN rowsecurity THEN 'RLS ENABLED ✓'
    ELSE 'RLS DISABLED ⚠️'
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
