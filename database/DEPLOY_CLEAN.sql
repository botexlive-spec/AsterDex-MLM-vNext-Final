-- ============================================
-- FINASTER MLM PLATFORM - CLEAN DEPLOYMENT
-- ============================================
-- This file handles existing objects gracefully
-- Safe to run multiple times
-- ============================================

-- Drop existing policies first (if they exist)
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update users" ON users;

DROP POLICY IF EXISTS "Users can view own wallet" ON wallets;
DROP POLICY IF EXISTS "Users can update own wallet" ON wallets;
DROP POLICY IF EXISTS "Admins can view all wallets" ON wallets;
DROP POLICY IF EXISTS "Admins can update wallets" ON wallets;

DROP POLICY IF EXISTS "Users can view own packages" ON packages;
DROP POLICY IF EXISTS "Admins can view all packages" ON packages;
DROP POLICY IF EXISTS "Admins can create packages" ON packages;

DROP POLICY IF EXISTS "Users can view own commissions" ON commissions;
DROP POLICY IF EXISTS "Admins can view all commissions" ON commissions;

DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
DROP POLICY IF EXISTS "Admins can view all transactions" ON transactions;

DROP POLICY IF EXISTS "Users can view own referrals" ON referrals;
DROP POLICY IF EXISTS "Admins can view all referrals" ON referrals;

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

-- Clear existing data and insert fresh config
DELETE FROM level_income_config;

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
ON CONFLICT (level) DO UPDATE SET
  percentage = EXCLUDED.percentage,
  fixed_amount = EXCLUDED.fixed_amount,
  calculation_type = EXCLUDED.calculation_type,
  description = EXCLUDED.description,
  updated_at = NOW();

-- 2. MATCHING BONUS TIERS
CREATE TABLE IF NOT EXISTS matching_bonus_tiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rank VARCHAR(50) NOT NULL UNIQUE,
  matching_percentage DECIMAL(5,2) NOT NULL CHECK (matching_percentage >= 0 AND matching_percentage <= 100),
  max_levels INTEGER NOT NULL CHECK (max_levels >= 1 AND max_levels <= 30),
  min_active_legs INTEGER DEFAULT 2,
  is_active BOOLEAN DEFAULT TRUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_matching_bonus_tiers_rank ON matching_bonus_tiers(rank);
CREATE INDEX IF NOT EXISTS idx_matching_bonus_tiers_active ON matching_bonus_tiers(is_active);

DELETE FROM matching_bonus_tiers;

INSERT INTO matching_bonus_tiers (rank, matching_percentage, max_levels, min_active_legs, description) VALUES
  ('Bronze', 10.00, 5, 2, 'Bronze rank - 10% matching bonus up to 5 levels'),
  ('Silver', 15.00, 10, 2, 'Silver rank - 15% matching bonus up to 10 levels'),
  ('Gold', 20.00, 15, 2, 'Gold rank - 20% matching bonus up to 15 levels'),
  ('Platinum', 25.00, 20, 2, 'Platinum rank - 25% matching bonus up to 20 levels'),
  ('Diamond', 30.00, 25, 2, 'Diamond rank - 30% matching bonus up to 25 levels'),
  ('Crown Diamond', 35.00, 30, 2, 'Crown Diamond rank - 35% matching bonus up to 30 levels')
ON CONFLICT (rank) DO UPDATE SET
  matching_percentage = EXCLUDED.matching_percentage,
  max_levels = EXCLUDED.max_levels,
  min_active_legs = EXCLUDED.min_active_legs,
  description = EXCLUDED.description,
  updated_at = NOW();

-- 3. RANK REQUIREMENTS
CREATE TABLE IF NOT EXISTS rank_requirements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rank VARCHAR(50) NOT NULL UNIQUE,
  min_active_referrals INTEGER NOT NULL DEFAULT 0,
  min_team_sales DECIMAL(15,2) NOT NULL DEFAULT 0,
  min_personal_sales DECIMAL(15,2) NOT NULL DEFAULT 0,
  min_left_leg_sales DECIMAL(15,2) DEFAULT 0,
  min_right_leg_sales DECIMAL(15,2) DEFAULT 0,
  time_period_days INTEGER DEFAULT 30,
  is_active BOOLEAN DEFAULT TRUE,
  benefits TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rank_requirements_rank ON rank_requirements(rank);
CREATE INDEX IF NOT EXISTS idx_rank_requirements_active ON rank_requirements(is_active);

DELETE FROM rank_requirements;

INSERT INTO rank_requirements (rank, min_active_referrals, min_team_sales, min_personal_sales, min_left_leg_sales, min_right_leg_sales, benefits) VALUES
  ('Bronze', 3, 1000.00, 500.00, 300.00, 300.00, '10% matching bonus, priority support'),
  ('Silver', 5, 5000.00, 1000.00, 1500.00, 1500.00, '15% matching bonus, monthly rewards'),
  ('Gold', 10, 15000.00, 2500.00, 5000.00, 5000.00, '20% matching bonus, leadership training'),
  ('Platinum', 20, 50000.00, 5000.00, 15000.00, 15000.00, '25% matching bonus, international events'),
  ('Diamond', 40, 150000.00, 10000.00, 50000.00, 50000.00, '30% matching bonus, car bonus'),
  ('Crown Diamond', 80, 500000.00, 25000.00, 150000.00, 150000.00, '35% matching bonus, house fund'),
  ('Royal Crown', 150, 1500000.00, 50000.00, 500000.00, 500000.00, '40% matching bonus, lifetime royalties')
ON CONFLICT (rank) DO UPDATE SET
  min_active_referrals = EXCLUDED.min_active_referrals,
  min_team_sales = EXCLUDED.min_team_sales,
  min_personal_sales = EXCLUDED.min_personal_sales,
  min_left_leg_sales = EXCLUDED.min_left_leg_sales,
  min_right_leg_sales = EXCLUDED.min_right_leg_sales,
  benefits = EXCLUDED.benefits,
  updated_at = NOW();

-- 4. BINARY SETTINGS
CREATE TABLE IF NOT EXISTS binary_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  data_type VARCHAR(20) DEFAULT 'string',
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_binary_settings_key ON binary_settings(setting_key);

DELETE FROM binary_settings;

INSERT INTO binary_settings (setting_key, setting_value, data_type, description) VALUES
  ('pairing_ratio', '1:1', 'string', 'Binary pairing ratio (left:right)'),
  ('pairing_bonus_percentage', '10', 'decimal', 'Percentage of weaker leg for pairing bonus'),
  ('max_pairings_per_day', '100', 'integer', 'Maximum number of pairings allowed per day'),
  ('carry_forward_enabled', 'true', 'boolean', 'Allow unpaired volume to carry forward'),
  ('flush_period_days', '30', 'integer', 'Days after which unpaired volume is flushed'),
  ('min_pairing_amount', '100', 'decimal', 'Minimum amount required for a pairing'),
  ('capping_enabled', 'true', 'boolean', 'Enable daily/weekly capping limits'),
  ('daily_cap_amount', '10000', 'decimal', 'Maximum binary earnings per day'),
  ('weekly_cap_amount', '50000', 'decimal', 'Maximum binary earnings per week')
ON CONFLICT (setting_key) DO UPDATE SET
  setting_value = EXCLUDED.setting_value,
  data_type = EXCLUDED.data_type,
  description = EXCLUDED.description,
  updated_at = NOW();

-- 5. MLM SYSTEM SETTINGS
CREATE TABLE IF NOT EXISTS mlm_system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  category VARCHAR(50) DEFAULT 'general',
  data_type VARCHAR(20) DEFAULT 'string',
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mlm_system_settings_key ON mlm_system_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_mlm_system_settings_category ON mlm_system_settings(category);

DELETE FROM mlm_system_settings;

INSERT INTO mlm_system_settings (setting_key, setting_value, category, data_type, description) VALUES
  ('commission_processing_time', 'instant', 'commission', 'string', 'When to process commissions: instant, daily, weekly'),
  ('min_withdrawal_amount', '50', 'withdrawal', 'decimal', 'Minimum amount for withdrawal'),
  ('max_withdrawal_amount', '50000', 'withdrawal', 'decimal', 'Maximum amount for single withdrawal'),
  ('withdrawal_fee_percentage', '2.5', 'withdrawal', 'decimal', 'Withdrawal fee percentage'),
  ('withdrawal_processing_days', '3', 'withdrawal', 'integer', 'Business days to process withdrawal'),
  ('kyc_required_for_withdrawal', 'true', 'kyc', 'boolean', 'KYC verification required for withdrawals'),
  ('kyc_required_amount_threshold', '1000', 'kyc', 'decimal', 'Amount threshold requiring KYC'),
  ('roi_distribution_enabled', 'true', 'roi', 'boolean', 'Enable ROI distribution'),
  ('roi_daily_percentage', '1.5', 'roi', 'decimal', 'Daily ROI percentage'),
  ('roi_max_cap_multiplier', '3', 'roi', 'decimal', 'ROI cap multiplier (3x = 300%)'),
  ('roi_distribution_time', '02:00', 'roi', 'string', 'Time to distribute daily ROI (UTC)'),
  ('platform_fee_percentage', '5', 'fees', 'decimal', 'Platform fee on package purchases'),
  ('referral_reward_enabled', 'true', 'rewards', 'boolean', 'Enable referral rewards'),
  ('rank_advancement_auto', 'true', 'ranks', 'boolean', 'Automatically advance ranks when qualified'),
  ('max_levels_depth', '30', 'general', 'integer', 'Maximum levels for commission calculation')
ON CONFLICT (setting_key) DO UPDATE SET
  setting_value = EXCLUDED.setting_value,
  category = EXCLUDED.category,
  data_type = EXCLUDED.data_type,
  description = EXCLUDED.description,
  updated_at = NOW();

-- ============================================
-- PART 2: MLM HELPER FUNCTIONS
-- ============================================

-- Function 1: Calculate Level Income
CREATE OR REPLACE FUNCTION calculate_level_income(
  p_package_amount DECIMAL,
  p_level INTEGER
) RETURNS DECIMAL AS $$
DECLARE
  v_config RECORD;
  v_income DECIMAL := 0;
BEGIN
  -- Get configuration for this level
  SELECT * INTO v_config
  FROM level_income_config
  WHERE level = p_level AND is_active = true;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  -- Calculate based on type
  CASE v_config.calculation_type
    WHEN 'percentage' THEN
      v_income := p_package_amount * (v_config.percentage / 100);
    WHEN 'fixed' THEN
      v_income := v_config.fixed_amount;
    WHEN 'hybrid' THEN
      v_income := (p_package_amount * (v_config.percentage / 100)) + v_config.fixed_amount;
  END CASE;

  RETURN v_income;
END;
$$ LANGUAGE plpgsql;

-- Function 2: Get Upline Chain
CREATE OR REPLACE FUNCTION get_upline_chain(
  p_user_id UUID,
  p_max_levels INTEGER DEFAULT 30
) RETURNS TABLE(
  level INTEGER,
  user_id UUID,
  username VARCHAR,
  email VARCHAR,
  rank VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE upline_tree AS (
    -- Base case: direct sponsor
    SELECT
      1 as level,
      u.id,
      u.username,
      u.email,
      u.rank,
      u.sponsor_id
    FROM users u
    WHERE u.id = (SELECT sponsor_id FROM users WHERE id = p_user_id)

    UNION ALL

    -- Recursive case: sponsors of sponsors
    SELECT
      ut.level + 1,
      u.id,
      u.username,
      u.email,
      u.rank,
      u.sponsor_id
    FROM users u
    INNER JOIN upline_tree ut ON u.id = ut.sponsor_id
    WHERE ut.level < p_max_levels
  )
  SELECT
    ut.level,
    ut.id,
    ut.username,
    ut.email,
    ut.rank
  FROM upline_tree ut
  ORDER BY ut.level;
END;
$$ LANGUAGE plpgsql;

-- Function 3: Check Rank Eligibility
CREATE OR REPLACE FUNCTION check_rank_eligibility(
  p_user_id UUID,
  p_target_rank VARCHAR
) RETURNS TABLE(
  is_eligible BOOLEAN,
  missing_requirements JSONB
) AS $$
DECLARE
  v_requirements RECORD;
  v_user_stats RECORD;
  v_missing JSONB := '{}';
  v_eligible BOOLEAN := true;
BEGIN
  -- Get rank requirements
  SELECT * INTO v_requirements
  FROM rank_requirements
  WHERE rank = p_target_rank AND is_active = true;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, '{"error": "Rank not found"}'::jsonb;
    RETURN;
  END IF;

  -- Get user statistics
  SELECT
    (SELECT COUNT(DISTINCT id) FROM users WHERE sponsor_id = p_user_id AND is_active = true) as active_referrals,
    (SELECT COALESCE(SUM(amount), 0) FROM packages WHERE user_id = p_user_id AND status = 'active') as personal_sales,
    (SELECT COALESCE(SUM(p.amount), 0)
     FROM packages p
     INNER JOIN users u ON p.user_id = u.id
     WHERE u.sponsor_id = p_user_id AND p.status = 'active') as team_sales
  INTO v_user_stats;

  -- Check each requirement
  IF v_user_stats.active_referrals < v_requirements.min_active_referrals THEN
    v_eligible := false;
    v_missing := jsonb_set(v_missing, '{active_referrals}',
      jsonb_build_object(
        'required', v_requirements.min_active_referrals,
        'current', v_user_stats.active_referrals,
        'missing', v_requirements.min_active_referrals - v_user_stats.active_referrals
      )
    );
  END IF;

  IF v_user_stats.personal_sales < v_requirements.min_personal_sales THEN
    v_eligible := false;
    v_missing := jsonb_set(v_missing, '{personal_sales}',
      jsonb_build_object(
        'required', v_requirements.min_personal_sales,
        'current', v_user_stats.personal_sales,
        'missing', v_requirements.min_personal_sales - v_user_stats.personal_sales
      )
    );
  END IF;

  IF v_user_stats.team_sales < v_requirements.min_team_sales THEN
    v_eligible := false;
    v_missing := jsonb_set(v_missing, '{team_sales}',
      jsonb_build_object(
        'required', v_requirements.min_team_sales,
        'current', v_user_stats.team_sales,
        'missing', v_requirements.min_team_sales - v_user_stats.team_sales
      )
    );
  END IF;

  RETURN QUERY SELECT v_eligible, v_missing;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PART 3: ROW-LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on core tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- USERS table policies
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "Admins can update users"
  ON users FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'superadmin')
    )
  );

-- WALLETS table policies
CREATE POLICY "Users can view own wallet"
  ON wallets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own wallet"
  ON wallets FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all wallets"
  ON wallets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "Admins can update wallets"
  ON wallets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'superadmin')
    )
  );

-- PACKAGES table policies
CREATE POLICY "Users can view own packages"
  ON packages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all packages"
  ON packages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "Admins can create packages"
  ON packages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'superadmin')
    )
  );

-- COMMISSIONS table policies
CREATE POLICY "Users can view own commissions"
  ON commissions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all commissions"
  ON commissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'superadmin')
    )
  );

-- TRANSACTIONS table policies
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions"
  ON transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'superadmin')
    )
  );

-- REFERRALS table policies
CREATE POLICY "Users can view own referrals"
  ON referrals FOR SELECT
  USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

CREATE POLICY "Admins can view all referrals"
  ON referrals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'superadmin')
    )
  );

-- ============================================
-- VERIFICATION QUERY
-- ============================================
-- Run this after deployment to verify everything is set up correctly:
--
-- SELECT
--   (SELECT COUNT(*) FROM level_income_config) as level_configs,
--   (SELECT COUNT(*) FROM matching_bonus_tiers) as bonus_tiers,
--   (SELECT COUNT(*) FROM rank_requirements) as ranks,
--   (SELECT COUNT(*) FROM binary_settings) as binary_settings,
--   (SELECT COUNT(*) FROM mlm_system_settings) as system_settings;
--
-- Expected results: 30, 6, 7, 9, 15
-- ============================================
