-- ============================================
-- ASTERDEX DEX - MLM SYSTEM DATABASE SCHEMA
-- Multi-Level Marketing with DEX Integration
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 1. CUSTOM TYPES FOR MLM
-- ============================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'package_tier') THEN
    CREATE TYPE package_tier AS ENUM ('tier_1', 'tier_2', 'tier_3');
  END IF;
END$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_type') THEN
    CREATE TYPE transaction_type AS ENUM (
      'robot_subscription', 'package_investment', 'direct_income', 'level_income',
      'booster_income', 'matching_bonus', 'roi_income', 'rank_reward',
      'withdrawal', 'deposit', 'dex_trade', 'kyc_fee'
    );
  END IF;
END$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_status') THEN
    CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'failed', 'cancelled');
  END IF;
END$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'kyc_status') THEN
    CREATE TYPE kyc_status AS ENUM ('not_submitted', 'pending', 'approved', 'rejected');
  END IF;
END$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rank_type') THEN
    CREATE TYPE rank_type AS ENUM (
      'starter', 'bronze', 'silver', 'gold', 'platinum',
      'diamond', 'double_diamond', 'triple_diamond', 'crown', 'crown_ambassador'
    );
  END IF;
END$$;

-- ============================================
-- 2. EXTEND USERS TABLE FOR MLM
-- ============================================

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS sponsor_id UUID REFERENCES public.users(id);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS placement_id UUID REFERENCES public.users(id);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS position VARCHAR(10) CHECK (position IN ('left', 'right'));
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS robot_subscription_active BOOLEAN DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS robot_subscription_expires_at TIMESTAMPTZ;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS total_investment DECIMAL(18,6) DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS total_earnings DECIMAL(18,6) DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS wallet_balance DECIMAL(18,6) DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS direct_count INTEGER DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS team_count INTEGER DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS left_volume DECIMAL(18,6) DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS right_volume DECIMAL(18,6) DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS current_rank rank_type DEFAULT 'starter';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS kyc_status kyc_status DEFAULT 'not_submitted';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS kyc_submitted_at TIMESTAMPTZ;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS levels_unlocked INTEGER DEFAULT 0;

-- ============================================
-- 3. MLM PACKAGES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  tier package_tier NOT NULL,
  min_amount DECIMAL(18,6) NOT NULL,
  max_amount DECIMAL(18,6),
  roi_percentage_min DECIMAL(5,2) NOT NULL,
  roi_percentage_max DECIMAL(5,2) NOT NULL,
  description TEXT,
  benefits JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. USER PACKAGES (SUBSCRIPTIONS)
-- ============================================

CREATE TABLE IF NOT EXISTS public.user_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  package_id UUID REFERENCES public.packages(id),
  amount DECIMAL(18,6) NOT NULL,
  roi_percentage DECIMAL(5,2) NOT NULL,
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  roi_earned DECIMAL(18,6) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. ROBOT SUBSCRIPTIONS
-- ============================================

CREATE TABLE IF NOT EXISTS public.robot_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  amount DECIMAL(18,6) NOT NULL DEFAULT 100,
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  auto_renew BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. MLM TRANSACTIONS
-- ============================================

CREATE TABLE IF NOT EXISTS public.mlm_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  from_user_id UUID REFERENCES public.users(id),
  transaction_type transaction_type NOT NULL,
  amount DECIMAL(18,6) NOT NULL,
  status transaction_status DEFAULT 'pending',
  level INTEGER,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- ============================================
-- 7. BINARY TREE STRUCTURE
-- ============================================

CREATE TABLE IF NOT EXISTS public.binary_tree (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.users(id),
  left_child_id UUID REFERENCES public.users(id),
  right_child_id UUID REFERENCES public.users(id),
  level INTEGER NOT NULL DEFAULT 0,
  position VARCHAR(10) CHECK (position IN ('left', 'right', 'root')),
  left_volume DECIMAL(18,6) DEFAULT 0,
  right_volume DECIMAL(18,6) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 8. LEVEL INCOME TRACKING
-- ============================================

CREATE TABLE IF NOT EXISTS public.level_incomes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  from_user_id UUID REFERENCES public.users(id),
  level INTEGER NOT NULL,
  amount DECIMAL(18,6) NOT NULL,
  income_type VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 9. MATCHING BONUSES
-- ============================================

CREATE TABLE IF NOT EXISTS public.matching_bonuses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  left_matches INTEGER NOT NULL,
  right_matches INTEGER NOT NULL,
  bonus_amount DECIMAL(18,6) NOT NULL,
  achieved_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 10. RANK ACHIEVEMENTS
-- ============================================

CREATE TABLE IF NOT EXISTS public.rank_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  rank rank_type NOT NULL,
  total_volume DECIMAL(18,6) NOT NULL,
  reward_amount DECIMAL(18,6) NOT NULL,
  achieved_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 11. BOOSTER INCOMES
-- ============================================

CREATE TABLE IF NOT EXISTS public.booster_incomes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  direct_1_id UUID REFERENCES public.users(id),
  direct_2_id UUID REFERENCES public.users(id),
  amount DECIMAL(18,6) NOT NULL,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 12. KYC DOCUMENTS
-- ============================================

CREATE TABLE IF NOT EXISTS public.kyc_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL,
  document_number VARCHAR(100),
  document_url TEXT,
  selfie_url TEXT,
  status kyc_status DEFAULT 'pending',
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES public.users(id),
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 13. WITHDRAWALS
-- ============================================

CREATE TABLE IF NOT EXISTS public.withdrawals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  amount DECIMAL(18,6) NOT NULL,
  wallet_address TEXT NOT NULL,
  status transaction_status DEFAULT 'pending',
  transaction_hash TEXT,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  processed_by UUID REFERENCES public.users(id),
  notes TEXT
);

-- ============================================
-- 14. DEPOSITS
-- ============================================

CREATE TABLE IF NOT EXISTS public.deposits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  amount DECIMAL(18,6) NOT NULL,
  transaction_hash TEXT,
  status transaction_status DEFAULT 'pending',
  deposited_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  confirmations INTEGER DEFAULT 0
);

-- ============================================
-- 15. DEX TRADES
-- ============================================

CREATE TABLE IF NOT EXISTS public.dex_trades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  trade_type VARCHAR(20) NOT NULL CHECK (trade_type IN ('buy', 'sell', 'swap')),
  symbol VARCHAR(50) NOT NULL,
  amount DECIMAL(18,6) NOT NULL,
  price DECIMAL(18,6),
  total_value DECIMAL(18,6) NOT NULL,
  fee DECIMAL(18,6) DEFAULT 0,
  status transaction_status DEFAULT 'pending',
  trade_data JSONB,
  executed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 16. SYSTEM NOTIFICATIONS
-- ============================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  notification_type VARCHAR(50) NOT NULL,
  is_read BOOLEAN DEFAULT false,
  link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 17. SYSTEM SETTINGS
-- ============================================

CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES public.users(id)
);

-- ============================================
-- 18. INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_users_sponsor ON public.users(sponsor_id);
CREATE INDEX IF NOT EXISTS idx_users_placement ON public.users(placement_id);
CREATE INDEX IF NOT EXISTS idx_user_packages_user ON public.user_packages(user_id);
CREATE INDEX IF NOT EXISTS idx_robot_subscriptions_user ON public.robot_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_mlm_transactions_user ON public.mlm_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_mlm_transactions_type ON public.mlm_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_mlm_transactions_status ON public.mlm_transactions(status);
CREATE INDEX IF NOT EXISTS idx_binary_tree_user ON public.binary_tree(user_id);
CREATE INDEX IF NOT EXISTS idx_binary_tree_parent ON public.binary_tree(parent_id);
CREATE INDEX IF NOT EXISTS idx_level_incomes_user ON public.level_incomes(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_user ON public.withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON public.withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_deposits_user ON public.deposits(user_id);
CREATE INDEX IF NOT EXISTS idx_dex_trades_user ON public.dex_trades(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);

-- ============================================
-- 19. ENABLE RLS ON NEW TABLES
-- ============================================

ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.robot_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mlm_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.binary_tree ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.level_incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matching_bonuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rank_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booster_incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dex_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 20. RLS POLICIES
-- ============================================

-- Packages (everyone can view active packages)
DROP POLICY IF EXISTS "Anyone can view active packages" ON public.packages;
CREATE POLICY "Anyone can view active packages" ON public.packages
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage packages" ON public.packages;
CREATE POLICY "Admins can manage packages" ON public.packages
  FOR ALL USING (public.is_admin());

-- User Packages
DROP POLICY IF EXISTS "Users can view their own packages" ON public.user_packages;
CREATE POLICY "Users can view their own packages" ON public.user_packages
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can purchase packages" ON public.user_packages;
CREATE POLICY "Users can purchase packages" ON public.user_packages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all packages" ON public.user_packages;
CREATE POLICY "Admins can view all packages" ON public.user_packages
  FOR SELECT USING (public.is_admin());

-- Robot Subscriptions
DROP POLICY IF EXISTS "Users can view their robot subscriptions" ON public.robot_subscriptions;
CREATE POLICY "Users can view their robot subscriptions" ON public.robot_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can purchase robot subscriptions" ON public.robot_subscriptions;
CREATE POLICY "Users can purchase robot subscriptions" ON public.robot_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- MLM Transactions
DROP POLICY IF EXISTS "Users can view their transactions" ON public.mlm_transactions;
CREATE POLICY "Users can view their transactions" ON public.mlm_transactions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all transactions" ON public.mlm_transactions;
CREATE POLICY "Admins can view all transactions" ON public.mlm_transactions
  FOR SELECT USING (public.is_admin());

-- Withdrawals
DROP POLICY IF EXISTS "Users can view their withdrawals" ON public.withdrawals;
CREATE POLICY "Users can view their withdrawals" ON public.withdrawals
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can request withdrawals" ON public.withdrawals;
CREATE POLICY "Users can request withdrawals" ON public.withdrawals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage withdrawals" ON public.withdrawals;
CREATE POLICY "Admins can manage withdrawals" ON public.withdrawals
  FOR ALL USING (public.is_admin());

-- Notifications
DROP POLICY IF EXISTS "Users can view their notifications" ON public.notifications;
CREATE POLICY "Users can view their notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their notifications" ON public.notifications;
CREATE POLICY "Users can update their notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- 21. HELPER FUNCTIONS FOR MLM
-- ============================================

-- Calculate user's total team size
CREATE OR REPLACE FUNCTION calculate_team_size(target_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  team_size INTEGER;
BEGIN
  WITH RECURSIVE team AS (
    -- Start with direct referrals
    SELECT id FROM users WHERE sponsor_id = target_user_id
    UNION
    -- Recursively get all downline
    SELECT u.id FROM users u
    INNER JOIN team t ON u.sponsor_id = t.id
  )
  SELECT COUNT(*) INTO team_size FROM team;

  RETURN COALESCE(team_size, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Calculate binary tree volume
CREATE OR REPLACE FUNCTION calculate_leg_volume(target_user_id UUID, leg VARCHAR(10))
RETURNS DECIMAL(18,6) AS $$
DECLARE
  total_volume DECIMAL(18,6);
BEGIN
  WITH RECURSIVE tree AS (
    -- Get the specified leg
    SELECT
      CASE
        WHEN leg = 'left' THEN bt.left_child_id
        WHEN leg = 'right' THEN bt.right_child_id
      END as user_id
    FROM binary_tree bt
    WHERE bt.user_id = target_user_id

    UNION

    -- Recursively get all downline in that leg
    SELECT
      CASE
        WHEN EXISTS (SELECT 1 FROM binary_tree WHERE user_id = t.user_id AND left_child_id IS NOT NULL)
        THEN (SELECT left_child_id FROM binary_tree WHERE user_id = t.user_id)
      END as user_id
    FROM tree t
    WHERE t.user_id IS NOT NULL

    UNION

    SELECT
      CASE
        WHEN EXISTS (SELECT 1 FROM binary_tree WHERE user_id = t.user_id AND right_child_id IS NOT NULL)
        THEN (SELECT right_child_id FROM binary_tree WHERE user_id = t.user_id)
      END as user_id
    FROM tree t
    WHERE t.user_id IS NOT NULL
  )
  SELECT COALESCE(SUM(u.total_investment), 0) INTO total_volume
  FROM tree t
  JOIN users u ON t.user_id = u.id
  WHERE t.user_id IS NOT NULL;

  RETURN COALESCE(total_volume, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Unlock levels for user
CREATE OR REPLACE FUNCTION unlock_levels(target_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  direct_count INTEGER;
  new_levels INTEGER := 0;
  current_levels INTEGER;
BEGIN
  -- Get current direct count and levels
  SELECT direct_count, levels_unlocked
  INTO direct_count, current_levels
  FROM users
  WHERE id = target_user_id;

  -- Level unlocking logic
  -- First 4 levels: 1 direct per level
  IF direct_count >= 4 AND current_levels < 4 THEN
    new_levels := LEAST(direct_count, 4);
  END IF;

  -- Levels 5-7: 1 direct per level (total 4 directs needed)
  IF direct_count >= 5 AND current_levels >= 4 AND current_levels < 7 THEN
    new_levels := 4 + LEAST(direct_count - 4, 3);
  END IF;

  -- Levels 8-10: 1 direct per level (total 7 directs needed)
  IF direct_count >= 8 AND current_levels >= 7 AND current_levels < 10 THEN
    new_levels := 7 + LEAST(direct_count - 7, 3);
  END IF;

  -- Levels 11-20: 1 direct unlocks all
  IF direct_count >= 11 AND current_levels >= 10 AND current_levels < 20 THEN
    new_levels := 20;
  END IF;

  -- Levels 21-30: 1 more direct unlocks all
  IF direct_count >= 21 AND current_levels >= 20 THEN
    new_levels := 30;
  END IF;

  -- Update user's unlocked levels
  IF new_levels > current_levels THEN
    UPDATE users SET levels_unlocked = new_levels WHERE id = target_user_id;
  END IF;

  RETURN new_levels;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Process level income
CREATE OR REPLACE FUNCTION process_level_income(
  source_user_id UUID,
  investment_amount DECIMAL(18,6)
)
RETURNS void AS $$
DECLARE
  processing_user_id UUID := source_user_id;
  sponsor UUID;
  level_num INTEGER := 1;
  income_amount DECIMAL(18,6);
  max_level INTEGER;
BEGIN
  -- Process up to 30 levels
  WHILE level_num <= 30 AND processing_user_id IS NOT NULL LOOP
    -- Get sponsor
    SELECT sponsor_id INTO sponsor FROM users WHERE id = processing_user_id;

    IF sponsor IS NULL THEN
      EXIT;
    END IF;

    -- Check if sponsor has this level unlocked
    SELECT levels_unlocked INTO max_level FROM users WHERE id = sponsor;

    IF max_level >= level_num THEN
      -- Calculate income based on level
      income_amount := CASE
        WHEN level_num = 1 THEN 20
        WHEN level_num = 2 THEN 10
        WHEN level_num = 3 THEN 5
        WHEN level_num = 4 THEN 3
        WHEN level_num BETWEEN 5 AND 10 THEN 2
        WHEN level_num BETWEEN 11 AND 20 THEN 1
        WHEN level_num BETWEEN 21 AND 30 THEN 0.5
        ELSE 0
      END;

      -- Record income
      INSERT INTO level_incomes (user_id, from_user_id, level, amount, income_type)
      VALUES (sponsor, source_user_id, level_num, income_amount, 'direct_income');

      -- Update wallet balance
      UPDATE users
      SET wallet_balance = wallet_balance + income_amount,
          total_earnings = total_earnings + income_amount
      WHERE id = sponsor;

      -- Create transaction record
      INSERT INTO mlm_transactions (user_id, from_user_id, transaction_type, amount, level, status)
      VALUES (sponsor, source_user_id, 'level_income', income_amount, level_num, 'completed');
    END IF;

    processing_user_id := sponsor;
    level_num := level_num + 1;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 22. SAMPLE DATA
-- ============================================

-- Insert default packages
INSERT INTO public.packages (name, tier, min_amount, max_amount, roi_percentage_min, roi_percentage_max, description, is_active)
VALUES
  ('Starter Package', 'tier_1', 100, 2000, 5.0, 7.0, 'Entry level package with 5-7% benefits', true),
  ('Growth Package', 'tier_2', 2001, 5000, 7.0, 9.0, 'Mid-tier package with 7-9% benefits', true),
  ('Premium Package', 'tier_3', 5001, 999999, 10.0, 12.0, 'Premium package with 10-12% benefits', true)
ON CONFLICT (name) DO NOTHING;

-- Insert system settings
INSERT INTO public.system_settings (setting_key, setting_value, description)
VALUES
  ('robot_subscription_price', '100', 'Price for robot subscription in USD'),
  ('robot_subscription_duration_days', '30', 'Duration of robot subscription in days'),
  ('min_withdrawal_amount', '50', 'Minimum withdrawal amount in USD'),
  ('withdrawal_fee_percentage', '2', 'Withdrawal fee percentage'),
  ('dex_trade_fee_percentage', '0.3', 'DEX trading fee percentage'),
  ('matching_bonus_enabled', 'true', 'Enable matching bonus system'),
  ('rank_rewards_enabled', 'true', 'Enable rank reward system'),
  ('booster_income_days', '30', 'Days required for booster income'),
  ('kyc_required_for_withdrawal', 'true', 'Require KYC for withdrawals')
ON CONFLICT (setting_key) DO NOTHING;

-- ============================================
-- SETUP COMPLETE!
-- ============================================
