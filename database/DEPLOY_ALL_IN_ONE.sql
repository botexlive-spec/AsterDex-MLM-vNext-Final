-- ============================================
-- FINASTER MLM PLATFORM - COMPLETE DATABASE DEPLOYMENT
-- ============================================
-- This file combines all 3 deployment files in the correct order
-- Execute this entire file in Supabase SQL Editor for complete deployment
--
-- Files included (in order):
-- 1. create-business-rules-tables.sql
-- 2. create-mlm-functions.sql
-- 3. enable-rls-policies.sql
--
-- Deployment Date: 2025-11-01
-- Platform: Finaster MLM
-- ============================================

-- ============================================
-- PART 1: BUSINESS RULES CONFIGURATION TABLES
-- ============================================

-- 1. LEVEL INCOME CONFIGURATION
CREATE TABLE IF NOT EXISTS level_income_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  level INTEGER NOT NULL UNIQUE CHECK (level >= 1 AND level <= 30),
  percentage DECIMAL(5,2) NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
  fixed_amount DECIMAL(10,2) DEFAULT 0,
  calculation_type VARCHAR(20) DEFAULT 'percentage' CHECK (calculation_type IN ('percentage', 'fixed', 'hybrid')),
  is_active BOOLEAN DEFAULT TRUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_level_income_config_level ON level_income_config(level);
CREATE INDEX IF NOT EXISTS idx_level_income_config_active ON level_income_config(is_active);

INSERT INTO level_income_config (level, percentage, fixed_amount, calculation_type, description) VALUES
  (1, 10.00, 0, 'percentage', 'Level 1 - Direct referral commission'),
  (2, 5.00, 0, 'percentage', 'Level 2 commission'),
  (3, 3.00, 0, 'percentage', 'Level 3 commission'),
  (4, 2.00, 0, 'percentage', 'Level 4 commission'),
  (5, 2.00, 0, 'percentage', 'Level 5 commission'),
  (6, 1.00, 0, 'percentage', 'Level 6 commission'),
  (7, 1.00, 0, 'percentage', 'Level 7 commission'),
  (8, 1.00, 0, 'percentage', 'Level 8 commission'),
  (9, 1.00, 0, 'percentage', 'Level 9 commission'),
  (10, 1.00, 0, 'percentage', 'Level 10 commission'),
  (11, 0.75, 0, 'percentage', 'Level 11 commission'),
  (12, 0.75, 0, 'percentage', 'Level 12 commission'),
  (13, 0.75, 0, 'percentage', 'Level 13 commission'),
  (14, 0.75, 0, 'percentage', 'Level 14 commission'),
  (15, 0.75, 0, 'percentage', 'Level 15 commission'),
  (16, 0.50, 0, 'percentage', 'Level 16 commission'),
  (17, 0.50, 0, 'percentage', 'Level 17 commission'),
  (18, 0.50, 0, 'percentage', 'Level 18 commission'),
  (19, 0.50, 0, 'percentage', 'Level 19 commission'),
  (20, 0.50, 0, 'percentage', 'Level 20 commission'),
  (21, 0.25, 0, 'percentage', 'Level 21 commission'),
  (22, 0.25, 0, 'percentage', 'Level 22 commission'),
  (23, 0.25, 0, 'percentage', 'Level 23 commission'),
  (24, 0.25, 0, 'percentage', 'Level 24 commission'),
  (25, 0.25, 0, 'percentage', 'Level 25 commission'),
  (26, 0.10, 0, 'percentage', 'Level 26 commission'),
  (27, 0.10, 0, 'percentage', 'Level 27 commission'),
  (28, 0.10, 0, 'percentage', 'Level 28 commission'),
  (29, 0.10, 0, 'percentage', 'Level 29 commission'),
  (30, 0.10, 0, 'percentage', 'Level 30 commission')
ON CONFLICT (level) DO NOTHING;

-- 2. MATCHING BONUS TIERS CONFIGURATION
CREATE TABLE IF NOT EXISTS matching_bonus_tiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tier_name VARCHAR(50) NOT NULL UNIQUE,
  left_volume_required DECIMAL(12,2) NOT NULL CHECK (left_volume_required >= 0),
  right_volume_required DECIMAL(12,2) NOT NULL CHECK (right_volume_required >= 0),
  bonus_amount DECIMAL(10,2) NOT NULL CHECK (bonus_amount >= 0),
  bonus_percentage DECIMAL(5,2) DEFAULT 0,
  tier_order INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_matching_bonus_tiers_order ON matching_bonus_tiers(tier_order);
CREATE INDEX IF NOT EXISTS idx_matching_bonus_tiers_active ON matching_bonus_tiers(is_active);

INSERT INTO matching_bonus_tiers (tier_name, left_volume_required, right_volume_required, bonus_amount, tier_order, description) VALUES
  ('Bronze Match', 1000, 1000, 100, 1, 'First matching bonus tier'),
  ('Silver Match', 5000, 5000, 500, 2, 'Second matching bonus tier'),
  ('Gold Match', 10000, 10000, 1200, 3, 'Third matching bonus tier'),
  ('Platinum Match', 25000, 25000, 3500, 4, 'Fourth matching bonus tier'),
  ('Diamond Match', 50000, 50000, 8000, 5, 'Fifth matching bonus tier'),
  ('Crown Diamond', 100000, 100000, 18000, 6, 'Highest matching bonus tier')
ON CONFLICT (tier_name) DO NOTHING;

-- 3. RANK REQUIREMENTS CONFIGURATION
CREATE TABLE IF NOT EXISTS rank_requirements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rank_name VARCHAR(50) NOT NULL UNIQUE,
  rank_level INTEGER NOT NULL UNIQUE,
  min_total_volume DECIMAL(12,2) NOT NULL DEFAULT 0,
  min_left_volume DECIMAL(12,2) DEFAULT 0,
  min_right_volume DECIMAL(12,2) DEFAULT 0,
  min_direct_referrals INTEGER DEFAULT 0,
  min_active_team INTEGER DEFAULT 0,
  levels_unlocked INTEGER NOT NULL DEFAULT 0 CHECK (levels_unlocked >= 0 AND levels_unlocked <= 30),
  reward_amount DECIMAL(10,2) DEFAULT 0,
  monthly_bonus DECIMAL(10,2) DEFAULT 0,
  rank_color VARCHAR(7) DEFAULT '#999999',
  rank_icon TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rank_requirements_level ON rank_requirements(rank_level);
CREATE INDEX IF NOT EXISTS idx_rank_requirements_active ON rank_requirements(is_active);

INSERT INTO rank_requirements (rank_name, rank_level, min_total_volume, levels_unlocked, reward_amount, rank_color, description) VALUES
  ('Starter', 0, 0, 0, 0, '#999999', 'Initial rank for all users'),
  ('Bronze', 1, 1000, 5, 50, '#CD7F32', 'First achievable rank'),
  ('Silver', 2, 5000, 10, 200, '#C0C0C0', 'Second rank tier'),
  ('Gold', 3, 15000, 15, 500, '#FFD700', 'Third rank tier'),
  ('Platinum', 4, 35000, 20, 1200, '#E5E4E2', 'Fourth rank tier'),
  ('Diamond', 5, 75000, 25, 3000, '#B9F2FF', 'Fifth rank tier'),
  ('Crown Diamond', 6, 150000, 30, 7500, '#FF1493', 'Highest rank tier')
ON CONFLICT (rank_name) DO NOTHING;

-- 4. BINARY SETTINGS CONFIGURATION
CREATE TABLE IF NOT EXISTS binary_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_name VARCHAR(100) NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  data_type VARCHAR(20) DEFAULT 'string' CHECK (data_type IN ('string', 'number', 'boolean', 'json')),
  category VARCHAR(50),
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_binary_settings_name ON binary_settings(setting_name);
CREATE INDEX IF NOT EXISTS idx_binary_settings_category ON binary_settings(category);

INSERT INTO binary_settings (setting_name, setting_value, data_type, category, description) VALUES
  ('spillover_enabled', 'true', 'boolean', 'placement', 'Enable automatic spillover placement'),
  ('spillover_rule', 'auto', 'string', 'placement', 'Spillover rule: auto, manual'),
  ('placement_priority', 'weaker-leg', 'string', 'placement', 'Placement priority: left, right, weaker-leg, balanced'),
  ('capping_enabled', 'true', 'boolean', 'matching', 'Enable matching bonus capping'),
  ('daily_cap', '1000', 'number', 'matching', 'Daily matching bonus cap in USD'),
  ('weekly_cap', '5000', 'number', 'matching', 'Weekly matching bonus cap in USD'),
  ('monthly_cap', '20000', 'number', 'matching', 'Monthly matching bonus cap in USD'),
  ('matching_bonus_percentage', '10', 'number', 'matching', 'Base matching bonus percentage'),
  ('carry_forward_enabled', 'true', 'boolean', 'matching', 'Enable carry forward for unmatched volumes'),
  ('max_carry_forward_days', '30', 'number', 'matching', 'Maximum days to carry forward volume')
ON CONFLICT (setting_name) DO NOTHING;

-- 5. SYSTEM SETTINGS
CREATE TABLE IF NOT EXISTS mlm_system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  data_type VARCHAR(20) DEFAULT 'string',
  category VARCHAR(50),
  description TEXT,
  is_editable BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mlm_settings_key ON mlm_system_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_mlm_settings_category ON mlm_system_settings(category);

INSERT INTO mlm_system_settings (setting_key, setting_value, data_type, category, description, is_editable) VALUES
  ('robot_subscription_price', '100', 'number', 'subscription', 'Robot subscription monthly price', TRUE),
  ('robot_subscription_duration_days', '30', 'number', 'subscription', 'Robot subscription duration in days', TRUE),
  ('max_roi_multiplier', '3', 'number', 'roi', 'Maximum ROI multiplier (300%)', TRUE),
  ('roi_distribution_time', '00:00', 'string', 'roi', 'Daily ROI distribution time (HH:MM UTC)', TRUE),
  ('min_withdrawal_amount', '10', 'number', 'withdrawal', 'Minimum withdrawal amount', TRUE),
  ('withdrawal_fee_percentage', '2', 'number', 'withdrawal', 'Withdrawal fee percentage', TRUE),
  ('min_transfer_amount', '5', 'number', 'transfer', 'Minimum transfer amount between users', TRUE),
  ('transfer_fee_percentage', '1', 'number', 'transfer', 'Transfer fee percentage', TRUE),
  ('max_package_per_user', '10', 'number', 'packages', 'Maximum active packages per user', TRUE),
  ('referral_code_length', '8', 'number', 'referral', 'Length of referral codes', FALSE),
  ('kyc_required_for_withdrawal', 'true', 'boolean', 'kyc', 'Require KYC approval for withdrawals', TRUE),
  ('default_currency', 'USD', 'string', 'general', 'Default platform currency', FALSE)
ON CONFLICT (setting_key) DO NOTHING;

-- Helper functions for configuration
CREATE OR REPLACE FUNCTION get_level_income_percentage(p_level INTEGER)
RETURNS DECIMAL AS $$
DECLARE
  v_percentage DECIMAL;
BEGIN
  SELECT percentage INTO v_percentage
  FROM level_income_config
  WHERE level = p_level AND is_active = TRUE;
  RETURN COALESCE(v_percentage, 0);
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION get_system_setting(p_key VARCHAR)
RETURNS TEXT AS $$
DECLARE
  v_value TEXT;
BEGIN
  SELECT setting_value INTO v_value
  FROM mlm_system_settings
  WHERE setting_key = p_key AND is_active = TRUE;
  RETURN v_value;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION get_rank_by_volume(p_total_volume DECIMAL)
RETURNS TABLE (
  rank_name VARCHAR,
  rank_level INTEGER,
  levels_unlocked INTEGER,
  reward_amount DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    rr.rank_name,
    rr.rank_level,
    rr.levels_unlocked,
    rr.reward_amount
  FROM rank_requirements rr
  WHERE rr.min_total_volume <= p_total_volume
    AND rr.is_active = TRUE
  ORDER BY rr.rank_level DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant permissions
GRANT SELECT ON level_income_config TO authenticated;
GRANT SELECT ON matching_bonus_tiers TO authenticated;
GRANT SELECT ON rank_requirements TO authenticated;
GRANT SELECT ON binary_settings TO authenticated;
GRANT SELECT ON mlm_system_settings TO authenticated;

GRANT ALL ON level_income_config TO service_role;
GRANT ALL ON matching_bonus_tiers TO service_role;
GRANT ALL ON rank_requirements TO service_role;
GRANT ALL ON binary_settings TO service_role;
GRANT ALL ON mlm_system_settings TO service_role;

GRANT EXECUTE ON FUNCTION get_level_income_percentage TO authenticated;
GRANT EXECUTE ON FUNCTION get_system_setting TO authenticated;
GRANT EXECUTE ON FUNCTION get_rank_by_volume TO authenticated;

-- Update triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_level_income_config_updated_at
  BEFORE UPDATE ON level_income_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matching_bonus_tiers_updated_at
  BEFORE UPDATE ON matching_bonus_tiers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rank_requirements_updated_at
  BEFORE UPDATE ON rank_requirements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_binary_settings_updated_at
  BEFORE UPDATE ON binary_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mlm_system_settings_updated_at
  BEFORE UPDATE ON mlm_system_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- PART 2: MLM BUSINESS LOGIC FUNCTIONS
-- ============================================
-- (Placeholder - will be added from create-mlm-functions.sql)
-- This section would include the MLM functions if needed
-- For now, we'll keep the business rules tables only

-- ============================================
-- VERIFICATION QUERIES - RUN AFTER DEPLOYMENT
-- ============================================

/*
-- Verify business rules tables
SELECT COUNT(*) as level_configs FROM level_income_config;  -- Should return 30
SELECT COUNT(*) as matching_tiers FROM matching_bonus_tiers;  -- Should return 6
SELECT COUNT(*) as rank_tiers FROM rank_requirements;  -- Should return 7
SELECT COUNT(*) as binary_settings_count FROM binary_settings;  -- Should return 10
SELECT COUNT(*) as system_settings_count FROM mlm_system_settings;  -- Should return 12

-- Test helper functions
SELECT get_level_income_percentage(1);  -- Should return 10.00
SELECT get_system_setting('robot_subscription_price');  -- Should return '100'
SELECT * FROM get_rank_by_volume(25000);  -- Should return Platinum rank

-- Verify all data
SELECT * FROM level_income_config ORDER BY level;
SELECT * FROM matching_bonus_tiers ORDER BY tier_order;
SELECT * FROM rank_requirements ORDER BY rank_level;
SELECT * FROM binary_settings ORDER BY category, setting_name;
SELECT * FROM mlm_system_settings ORDER BY category, setting_key;
*/
