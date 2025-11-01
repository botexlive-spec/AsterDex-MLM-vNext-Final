-- ============================================================================
-- FINASTER MLM PLATFORM - ROW-LEVEL SECURITY POLICIES
-- ============================================================================
-- Description: Complete RLS policy implementation for all tables
-- Version: 1.0
-- Date: 2025-11-01
-- ============================================================================
-- IMPORTANT: Run this script in your Supabase SQL Editor
-- This will enable RLS and create all necessary policies
-- ============================================================================

-- ============================================================================
-- 1. USERS TABLE
-- ============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_select_admin" ON users
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = (SELECT role FROM users WHERE id = auth.uid()));

CREATE POLICY "users_update_admin" ON users
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

CREATE POLICY "users_insert_signup" ON users
  FOR INSERT WITH CHECK (true);

-- ============================================================================
-- 2. WALLETS TABLE
-- ============================================================================

ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wallets_select_own" ON wallets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "wallets_select_admin" ON wallets
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

CREATE POLICY "wallets_insert_system" ON wallets
  FOR INSERT WITH CHECK (true);

CREATE POLICY "wallets_update_system" ON wallets
  FOR UPDATE USING (true);

-- ============================================================================
-- 3. USER_PACKAGES TABLE
-- ============================================================================

ALTER TABLE user_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_packages_select_own" ON user_packages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_packages_select_admin" ON user_packages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

CREATE POLICY "user_packages_insert_own" ON user_packages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_packages_update_system" ON user_packages
  FOR UPDATE USING (true);

-- ============================================================================
-- 4. MLM_TRANSACTIONS TABLE
-- ============================================================================

ALTER TABLE mlm_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mlm_transactions_select_own" ON mlm_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "mlm_transactions_select_admin" ON mlm_transactions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

CREATE POLICY "mlm_transactions_insert_system" ON mlm_transactions
  FOR INSERT WITH CHECK (true);

-- ============================================================================
-- 5. BINARY_TREE TABLE
-- ============================================================================

ALTER TABLE binary_tree ENABLE ROW LEVEL SECURITY;

CREATE POLICY "binary_tree_select_all" ON binary_tree
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "binary_tree_insert_system" ON binary_tree
  FOR INSERT WITH CHECK (true);

CREATE POLICY "binary_tree_update_system" ON binary_tree
  FOR UPDATE USING (true);

-- ============================================================================
-- 6. KYC_DOCUMENTS TABLE
-- ============================================================================

ALTER TABLE kyc_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "kyc_documents_select_own" ON kyc_documents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "kyc_documents_select_admin" ON kyc_documents
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

CREATE POLICY "kyc_documents_insert_own" ON kyc_documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "kyc_documents_update_admin" ON kyc_documents
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

-- ============================================================================
-- 7. DEPOSITS TABLE
-- ============================================================================

ALTER TABLE deposits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "deposits_select_own" ON deposits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "deposits_select_admin" ON deposits
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

CREATE POLICY "deposits_insert_own" ON deposits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "deposits_update_admin" ON deposits
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

-- ============================================================================
-- 8. WITHDRAWAL_REQUESTS TABLE
-- ============================================================================

ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "withdrawal_requests_select_own" ON withdrawal_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "withdrawal_requests_select_admin" ON withdrawal_requests
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

CREATE POLICY "withdrawal_requests_insert_own" ON withdrawal_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "withdrawal_requests_update_admin" ON withdrawal_requests
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

-- ============================================================================
-- 9. ADMIN_ACTIONS TABLE
-- ============================================================================

ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_actions_select_admin" ON admin_actions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

CREATE POLICY "admin_actions_insert_system" ON admin_actions
  FOR INSERT WITH CHECK (true);

-- ============================================================================
-- 10. COMMISSION_RUNS TABLE
-- ============================================================================

ALTER TABLE commission_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "commission_runs_select_admin" ON commission_runs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

CREATE POLICY "commission_runs_insert_system" ON commission_runs
  FOR INSERT WITH CHECK (true);

-- ============================================================================
-- 11. PACKAGES TABLE (Public Read, Admin Write)
-- ============================================================================

ALTER TABLE packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "packages_select_all" ON packages
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "packages_insert_admin" ON packages
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

CREATE POLICY "packages_update_admin" ON packages
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

-- ============================================================================
-- 12. CONFIGURATION TABLES (Public Read, Admin Write)
-- ============================================================================

-- Level Income Config
ALTER TABLE level_income_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "level_income_config_select_all" ON level_income_config
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "level_income_config_update_admin" ON level_income_config
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

-- Matching Bonus Tiers
ALTER TABLE matching_bonus_tiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "matching_bonus_tiers_select_all" ON matching_bonus_tiers
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "matching_bonus_tiers_all_admin" ON matching_bonus_tiers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

-- Rank Requirements
ALTER TABLE rank_requirements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rank_requirements_select_all" ON rank_requirements
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "rank_requirements_all_admin" ON rank_requirements
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

-- Binary Settings
ALTER TABLE binary_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "binary_settings_select_all" ON binary_settings
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "binary_settings_update_admin" ON binary_settings
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

-- MLM System Settings
ALTER TABLE mlm_system_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mlm_system_settings_select_all" ON mlm_system_settings
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "mlm_system_settings_update_admin" ON mlm_system_settings
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

-- ============================================================================
-- 13. REFERRAL SYSTEM TABLES
-- ============================================================================

-- Referral Codes
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "referral_codes_select_own" ON referral_codes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "referral_codes_select_admin" ON referral_codes
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

CREATE POLICY "referral_codes_insert_own" ON referral_codes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Referrals
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "referrals_select_own" ON referrals
  FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

CREATE POLICY "referrals_select_admin" ON referrals
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

CREATE POLICY "referrals_insert_system" ON referrals
  FOR INSERT WITH CHECK (true);

-- ============================================================================
-- 14. SUPPORT & COMMUNICATION TABLES (If they exist)
-- ============================================================================

-- Support Tickets
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'support_tickets') THEN
    ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "support_tickets_select_own" ON support_tickets
      FOR SELECT USING (auth.uid() = user_id);

    CREATE POLICY "support_tickets_select_admin" ON support_tickets
      FOR SELECT USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
      );

    CREATE POLICY "support_tickets_insert_own" ON support_tickets
      FOR INSERT WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "support_tickets_update_all" ON support_tickets
      FOR UPDATE USING (
        auth.uid() = user_id OR
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
      );
  END IF;
END $$;

-- Notifications
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'notifications') THEN
    ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "notifications_select_own" ON notifications
      FOR SELECT USING (auth.uid() = user_id);

    CREATE POLICY "notifications_insert_system" ON notifications
      FOR INSERT WITH CHECK (true);

    CREATE POLICY "notifications_update_own" ON notifications
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Announcements
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'announcements') THEN
    ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "announcements_select_all" ON announcements
      FOR SELECT USING (auth.role() = 'authenticated');

    CREATE POLICY "announcements_all_admin" ON announcements
      FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
      );
  END IF;
END $$;

-- News Articles
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'news_articles') THEN
    ALTER TABLE news_articles ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "news_articles_select_all" ON news_articles
      FOR SELECT USING (status = 'published' OR auth.role() = 'authenticated');

    CREATE POLICY "news_articles_all_admin" ON news_articles
      FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
      );
  END IF;
END $$;

-- ============================================================================
-- 15. MLM INCOME TRACKING TABLES (If they exist as separate tables)
-- ============================================================================

-- Level Incomes
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'level_incomes') THEN
    ALTER TABLE level_incomes ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "level_incomes_select_own" ON level_incomes
      FOR SELECT USING (auth.uid() = user_id);

    CREATE POLICY "level_incomes_select_admin" ON level_incomes
      FOR SELECT USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
      );

    CREATE POLICY "level_incomes_insert_system" ON level_incomes
      FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- Matching Bonuses Records
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'matching_bonuses') THEN
    ALTER TABLE matching_bonuses ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "matching_bonuses_select_own" ON matching_bonuses
      FOR SELECT USING (auth.uid() = user_id);

    CREATE POLICY "matching_bonuses_select_admin" ON matching_bonuses
      FOR SELECT USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
      );

    CREATE POLICY "matching_bonuses_insert_system" ON matching_bonuses
      FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- Rank Achievements
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'rank_achievements') THEN
    ALTER TABLE rank_achievements ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "rank_achievements_select_own" ON rank_achievements
      FOR SELECT USING (auth.uid() = user_id);

    CREATE POLICY "rank_achievements_select_admin" ON rank_achievements
      FOR SELECT USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
      );

    CREATE POLICY "rank_achievements_insert_system" ON rank_achievements
      FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- Booster Incomes
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'booster_incomes') THEN
    ALTER TABLE booster_incomes ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "booster_incomes_select_own" ON booster_incomes
      FOR SELECT USING (auth.uid() = user_id);

    CREATE POLICY "booster_incomes_select_admin" ON booster_incomes
      FOR SELECT USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
      );

    CREATE POLICY "booster_incomes_insert_system" ON booster_incomes
      FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check which tables have RLS enabled
SELECT
  schemaname,
  tablename,
  rowsecurity as "RLS Enabled"
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Check all policies
SELECT
  tablename,
  policyname,
  cmd as operation
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Count policies per table
SELECT
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY policy_count DESC, tablename;

-- ============================================================================
-- DEPLOYMENT COMPLETE
-- ============================================================================

-- 🎉 RLS Policies have been deployed successfully!
--
-- Next steps:
-- 1. Review the verification queries above
-- 2. Test with different user roles
-- 3. Verify users can only see their own data
-- 4. Verify admins can see all data
-- 5. Test insert/update/delete operations
--
-- See RLS_POLICIES_GUIDE.md for testing procedures and troubleshooting.
-- ============================================================================
