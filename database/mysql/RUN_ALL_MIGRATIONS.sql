-- ============================================================================
-- FINASTER MLM SYSTEM - CONSOLIDATED MIGRATION SCRIPT
-- ============================================================================
-- 
-- This script runs all migrations in order.
-- Run each migration file individually in sequence.
--
-- Usage:
--   mysql -u root -p finaster_mlm < database/mysql/RUN_ALL_MIGRATIONS.sql
--
-- Or run each file individually:
--   mysql -u root -p finaster_mlm < database/mysql/01_init_schema.sql
--   mysql -u root -p finaster_mlm < database/mysql/02_binary_tree.sql
--   ... and so on
--
-- ============================================================================

-- MIGRATION CHECKLIST
-- Run these files in ORDER:

-- [✓] 01_init_schema.sql
--     Creates: users, packages, user_packages, mlm_transactions, payouts,
--              withdrawals
--
-- [✓] 02_binary_tree.sql  
--     Creates: binary_tree table for MLM structure
--
-- [✓] 03_boosters.sql
--     Creates: boosters table for 30-day direct tracking
--
-- [✓] 04_level_unlocks.sql
--     Creates: level_unlocks table (initial version)
--
-- [✓] 05_rewards.sql
--     Creates: user_business_volumes, reward_distributions
--
-- [✓] 06_roi_enhancements.sql
--     Adds: Enhanced ROI tracking columns
--
-- [✓] 07_payouts_idempotency.sql
--     Adds: Idempotency constraints to payouts (generated columns + unique index)
--     IMPORTANT: Uses MySQL generated columns workaround
--
-- [✓] 08_extend_level_unlocks.sql
--     Extends: level_unlocks to 30 levels
--
-- [✓] 09_plan_settings.sql
--     Creates: plan_settings table for dynamic feature controls
--
-- [✓] 10_cron_jobs.sql (optional)
--     Documents: Cron job configuration (not a SQL migration)
--
-- [✓] 11_performance_indexes.sql
--     Adds: 40+ performance indexes across all tables
--     IMPORTANT: Some indexes may already exist, ignore duplicate key errors
--

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check all tables exist:
SHOW TABLES;

-- Check indexes applied:
SHOW INDEX FROM users;
SHOW INDEX FROM binary_tree;
SHOW INDEX FROM payouts;

-- Check plan settings:
SELECT * FROM plan_settings;

-- Check level unlocks structure:
DESC level_unlocks;

-- ============================================================================
-- POST-MIGRATION STEPS
-- ============================================================================

-- 1. Create admin user (see database/mysql/seed_data.sql)
-- 2. Create sample packages
-- 3. Verify cron jobs are configured
-- 4. Run ANALYZE TABLE on all tables
-- 5. Test application startup
