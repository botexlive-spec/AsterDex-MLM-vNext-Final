-- ═══════════════════════════════════════════════════════════════
-- FIX RLS POLICIES - Allow Reading Team Members & Binary Tree
-- ═══════════════════════════════════════════════════════════════

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_select_admin" ON users;

-- Create new policy: Users can SELECT their own data + all users (for team queries)
-- This is needed because team members need to see their downline
CREATE POLICY "users_select_authenticated" ON users
  FOR SELECT
  TO authenticated
  USING (true);

-- Binary tree: Allow all authenticated users to read
CREATE POLICY "binary_tree_select_authenticated" ON binary_tree
  FOR SELECT
  TO authenticated
  USING (true);

-- Referrals: Allow users to see referrals where they are referrer or referee
CREATE POLICY "referrals_select_own" ON referrals
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = referrer_id OR
    auth.uid() = referee_id
  );

-- Referral codes: Allow users to see their own codes
CREATE POLICY "referral_codes_select_own" ON referral_codes
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- User packages: Allow users to see their own packages
CREATE POLICY "user_packages_select_own" ON user_packages
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Robot subscriptions: Allow users to see their own subscriptions
CREATE POLICY "robot_subscriptions_select_own" ON robot_subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- MLM transactions: Allow users to see their own transactions
CREATE POLICY "mlm_transactions_select_own" ON mlm_transactions
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR
    auth.uid() = from_user_id
  );

-- Level incomes: Allow users to see incomes they received or gave
CREATE POLICY "level_incomes_select_own" ON level_incomes
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR
    auth.uid() = from_user_id
  );

-- Matching bonuses: Allow users to see their own bonuses
CREATE POLICY "matching_bonuses_select_own" ON matching_bonuses
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Rank achievements: Allow users to see their own achievements
CREATE POLICY "rank_achievements_select_own" ON rank_achievements
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Booster incomes: Allow users to see their own booster incomes
CREATE POLICY "booster_incomes_select_own" ON booster_incomes
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR
    auth.uid() = direct_1_id OR
    auth.uid() = direct_2_id
  );

-- Notifications: Allow users to see their own notifications
CREATE POLICY "notifications_select_own" ON notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════
-- VERIFICATION
-- ═══════════════════════════════════════════════════════════════

SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN (
  'users', 'binary_tree', 'referrals', 'referral_codes',
  'user_packages', 'robot_subscriptions', 'mlm_transactions'
)
ORDER BY tablename, policyname;
