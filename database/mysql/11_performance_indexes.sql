/**
 * Performance Optimization Indexes
 * Adds indexes to frequently queried columns for better performance
 * NOTE: Some indexes may already exist, ignore duplicate key errors
 */

-- Users table indexes
ALTER TABLE users ADD INDEX idx_users_sponsor (sponsor_id);
ALTER TABLE users ADD INDEX idx_users_referral_code (referral_code);
ALTER TABLE users ADD INDEX idx_users_created_at (created_at);
ALTER TABLE users ADD INDEX idx_users_is_active (is_active);
ALTER TABLE users ADD INDEX idx_users_role (role);

-- Binary tree indexes
ALTER TABLE binary_tree ADD INDEX idx_binary_parent (parent_id);
ALTER TABLE binary_tree ADD INDEX idx_binary_left_child (left_child_id);
ALTER TABLE binary_tree ADD INDEX idx_binary_right_child (right_child_id);
ALTER TABLE binary_tree ADD INDEX idx_binary_level (level);

-- Payouts table composite indexes for common queries
ALTER TABLE payouts ADD INDEX idx_payouts_user_type (user_id, payout_type);
ALTER TABLE payouts ADD INDEX idx_payouts_user_created (user_id, created_at);
ALTER TABLE payouts ADD INDEX idx_payouts_type_created (payout_type, created_at);
ALTER TABLE payouts ADD INDEX idx_payouts_status (status);
ALTER TABLE payouts ADD INDEX idx_payouts_created_at (created_at);

-- User packages indexes
ALTER TABLE user_packages ADD INDEX idx_user_packages_status (status);
ALTER TABLE user_packages ADD INDEX idx_user_packages_activation (activation_date);
ALTER TABLE user_packages ADD INDEX idx_user_packages_expiry (expiry_date);

-- MLM transactions indexes
ALTER TABLE mlm_transactions ADD INDEX idx_mlm_transactions_type (transaction_type);
ALTER TABLE mlm_transactions ADD INDEX idx_mlm_transactions_status (status);
ALTER TABLE mlm_transactions ADD INDEX idx_mlm_transactions_created (created_at);

-- Boosters indexes
ALTER TABLE boosters ADD INDEX idx_boosters_status (status);
ALTER TABLE boosters ADD INDEX idx_boosters_end_date (end_date);

-- Withdrawals indexes
ALTER TABLE withdrawals ADD INDEX idx_withdrawals_status (status);
ALTER TABLE withdrawals ADD INDEX idx_withdrawals_created (created_at);

-- User business volumes indexes
ALTER TABLE user_business_volumes ADD INDEX idx_user_volumes_month_year (month, year);

-- Reward distributions indexes
ALTER TABLE reward_distributions ADD INDEX idx_reward_dist_period (period_month, period_year);

-- Analyze tables for query optimization
ANALYZE TABLE users;
ANALYZE TABLE binary_tree;
ANALYZE TABLE payouts;
ANALYZE TABLE user_packages;
ANALYZE TABLE mlm_transactions;
ANALYZE TABLE boosters;
ANALYZE TABLE withdrawals;
ANALYZE TABLE level_unlocks;
ANALYZE TABLE user_business_volumes;
ANALYZE TABLE reward_distributions;
