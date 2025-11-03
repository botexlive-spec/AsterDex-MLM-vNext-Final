-- ═══════════════════════════════════════════════════════════════
-- DATABASE RESET SCRIPT
-- WARNING: This will DELETE ALL USER DATA
-- Use only in development/testing environments
-- ═══════════════════════════════════════════════════════════════

-- Disable triggers temporarily
SET session_replication_role = 'replica';

-- ═══════════════════════════════════════════════════════════════
-- DELETE ALL USER DATA (Keep system tables)
-- ═══════════════════════════════════════════════════════════════

-- Delete in correct order to avoid foreign key violations
TRUNCATE TABLE audit_logs CASCADE;
TRUNCATE TABLE notifications CASCADE;
TRUNCATE TABLE support_tickets CASCADE;
TRUNCATE TABLE communications CASCADE;

-- MLM Financial Data
TRUNCATE TABLE booster_incomes CASCADE;
TRUNCATE TABLE matching_bonuses CASCADE;
TRUNCATE TABLE rank_achievements CASCADE;
TRUNCATE TABLE level_incomes CASCADE;
TRUNCATE TABLE mlm_transactions CASCADE;

-- MLM Structure
TRUNCATE TABLE referrals CASCADE;
TRUNCATE TABLE binary_tree CASCADE;
TRUNCATE TABLE referral_codes CASCADE;

-- User Data
TRUNCATE TABLE user_packages CASCADE;
TRUNCATE TABLE robot_subscriptions CASCADE;
TRUNCATE TABLE kyc_verifications CASCADE;

-- Users table (auth.users is managed by Supabase Auth)
-- We'll delete from the users table which syncs with auth
DELETE FROM users WHERE email NOT LIKE '%@system.internal';

-- Reset sequences (auto-increment)
ALTER SEQUENCE IF EXISTS mlm_transactions_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS level_incomes_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS matching_bonuses_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS rank_achievements_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS booster_incomes_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS referrals_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS user_packages_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS robot_subscriptions_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS kyc_verifications_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS notifications_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS support_tickets_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS audit_logs_id_seq RESTART WITH 1;

-- Re-enable triggers
SET session_replication_role = 'origin';

-- ═══════════════════════════════════════════════════════════════
-- VERIFICATION
-- ═══════════════════════════════════════════════════════════════

-- Show counts to verify reset
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'referral_codes', COUNT(*) FROM referral_codes
UNION ALL
SELECT 'referrals', COUNT(*) FROM referrals
UNION ALL
SELECT 'binary_tree', COUNT(*) FROM binary_tree
UNION ALL
SELECT 'user_packages', COUNT(*) FROM user_packages
UNION ALL
SELECT 'mlm_transactions', COUNT(*) FROM mlm_transactions
UNION ALL
SELECT 'level_incomes', COUNT(*) FROM level_incomes
UNION ALL
SELECT 'matching_bonuses', COUNT(*) FROM matching_bonuses
UNION ALL
SELECT 'rank_achievements', COUNT(*) FROM rank_achievements
ORDER BY table_name;

-- Show system configuration tables (should still have data)
SELECT 'System Configuration Tables' as info;
SELECT 'packages' as table_name, COUNT(*) as count FROM packages
UNION ALL
SELECT 'level_income_config', COUNT(*) FROM level_income_config
UNION ALL
SELECT 'matching_bonus_tiers', COUNT(*) FROM matching_bonus_tiers
UNION ALL
SELECT 'rank_requirements', COUNT(*) FROM rank_requirements
ORDER BY table_name;
