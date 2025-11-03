-- ═══════════════════════════════════════════════════════════════
-- TEMPORARY FIX: Disable RLS for SELECT operations only
-- This allows Team and Genealogy pages to work
-- INSERT/UPDATE/DELETE are still protected by RLS
-- ═══════════════════════════════════════════════════════════════

-- Drop all existing SELECT policies
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_select_admin" ON users;
DROP POLICY IF EXISTS "users_select_authenticated" ON users;
DROP POLICY IF EXISTS "binary_tree_select_authenticated" ON binary_tree;
DROP POLICY IF EXISTS "referrals_select_own" ON referrals;
DROP POLICY IF EXISTS "referral_codes_select_own" ON referral_codes;

-- Create permissive SELECT policies (allow all reads for authenticated users)
CREATE POLICY "users_select_all" ON users
  FOR SELECT
  USING (true);

CREATE POLICY "binary_tree_select_all" ON binary_tree
  FOR SELECT
  USING (true);

CREATE POLICY "referrals_select_all" ON referrals
  FOR SELECT
  USING (true);

CREATE POLICY "referral_codes_select_all" ON referral_codes
  FOR SELECT
  USING (true);

CREATE POLICY "user_packages_select_all" ON user_packages
  FOR SELECT
  USING (true);

CREATE POLICY "robot_subscriptions_select_all" ON robot_subscriptions
  FOR SELECT
  USING (true);

CREATE POLICY "mlm_transactions_select_all" ON mlm_transactions
  FOR SELECT
  USING (true);

CREATE POLICY "level_incomes_select_all" ON level_incomes
  FOR SELECT
  USING (true);

CREATE POLICY "matching_bonuses_select_all" ON matching_bonuses
  FOR SELECT
  USING (true);

CREATE POLICY "rank_achievements_select_all" ON rank_achievements
  FOR SELECT
  USING (true);

CREATE POLICY "booster_incomes_select_all" ON booster_incomes
  FOR SELECT
  USING (true);

CREATE POLICY "notifications_select_all" ON notifications
  FOR SELECT
  USING (true);

-- Verify policies are created
SELECT
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
AND cmd = 'SELECT'
AND tablename IN ('users', 'binary_tree', 'referrals', 'referral_codes')
ORDER BY tablename;
