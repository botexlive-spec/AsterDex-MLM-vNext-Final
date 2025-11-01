-- ============================================
-- ASTERDEX DEX - Database Schema
-- Admin/User Authentication & Referral System
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. CUSTOM TYPES
-- ============================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('admin', 'user', 'trader');
  END IF;
END$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'referral_status') THEN
    CREATE TYPE referral_status AS ENUM ('pending', 'active', 'completed');
  END IF;
END$$;

-- ============================================
-- 2. TABLES
-- ============================================

-- Users Table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  role user_role NOT NULL DEFAULT 'user',
  wallet_address TEXT,
  privy_id TEXT,
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Referral Codes Table
CREATE TABLE IF NOT EXISTS public.referral_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL,
  clicks INTEGER DEFAULT 0,
  signups INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Referrals Table
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  referee_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  status referral_status DEFAULT 'pending',
  commission_earned DECIMAL(18,6) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trading Activity Table
CREATE TABLE IF NOT EXISTS public.trading_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  trade_volume DECIMAL(18,6) NOT NULL,
  commission DECIMAL(18,6) DEFAULT 0,
  referrer_commission DECIMAL(18,6) DEFAULT 0,
  trade_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin Actions Log Table
CREATE TABLE IF NOT EXISTS public.admin_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON public.users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_users_privy_id ON public.users(privy_id);
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON public.referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_referral_codes_user_id ON public.referral_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON public.referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referee_id ON public.referrals(referee_id);
CREATE INDEX IF NOT EXISTS idx_trading_activity_user_id ON public.trading_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_admin_id ON public.admin_actions(admin_id);

-- ============================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trading_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. HELPER FUNCTIONS
-- ============================================

-- Get current user role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role::text FROM public.users WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Generate unique referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;

  -- Check if code already exists
  WHILE EXISTS (SELECT 1 FROM public.referral_codes WHERE code = result) LOOP
    result := '';
    FOR i IN 1..8 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
  END LOOP;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auto-create referral code for new users
CREATE OR REPLACE FUNCTION public.create_referral_code_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.referral_codes (user_id, code)
  VALUES (NEW.id, public.generate_referral_code());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 6. TRIGGERS
-- ============================================

-- Auto-update updated_at on users table
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Auto-create referral code when user is created
DROP TRIGGER IF EXISTS create_referral_code_on_user_create ON public.users;
CREATE TRIGGER create_referral_code_on_user_create
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_referral_code_for_user();

-- ============================================
-- 7. RLS POLICIES
-- ============================================

-- Users policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can manage all users" ON public.users;
CREATE POLICY "Admins can manage all users" ON public.users
  FOR ALL USING (public.is_admin());

-- Referral codes policies
DROP POLICY IF EXISTS "Users can view their own referral codes" ON public.referral_codes;
CREATE POLICY "Users can view their own referral codes" ON public.referral_codes
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own referral codes" ON public.referral_codes;
CREATE POLICY "Users can create their own referral codes" ON public.referral_codes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all referral codes" ON public.referral_codes;
CREATE POLICY "Admins can manage all referral codes" ON public.referral_codes
  FOR ALL USING (public.is_admin());

-- Referrals policies
DROP POLICY IF EXISTS "Users can view their own referrals" ON public.referrals;
CREATE POLICY "Users can view their own referrals" ON public.referrals
  FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referee_id);

DROP POLICY IF EXISTS "Admins can manage all referrals" ON public.referrals;
CREATE POLICY "Admins can manage all referrals" ON public.referrals
  FOR ALL USING (public.is_admin());

-- Trading activity policies
DROP POLICY IF EXISTS "Users can view their own trading activity" ON public.trading_activity;
CREATE POLICY "Users can view their own trading activity" ON public.trading_activity
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all trading activity" ON public.trading_activity;
CREATE POLICY "Admins can view all trading activity" ON public.trading_activity
  FOR SELECT USING (public.is_admin());

-- Admin actions policies
DROP POLICY IF EXISTS "Admins can view all admin actions" ON public.admin_actions;
CREATE POLICY "Admins can view all admin actions" ON public.admin_actions
  FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can create admin actions" ON public.admin_actions;
CREATE POLICY "Admins can create admin actions" ON public.admin_actions
  FOR INSERT WITH CHECK (public.is_admin());

-- ============================================
-- 8. SAMPLE DATA (Optional for testing)
-- ============================================

-- Insert a default admin user (password: admin123)
-- Password hash is bcrypt hash of "admin123"
INSERT INTO public.users (email, password_hash, full_name, role, email_verified, is_active)
VALUES (
  'admin@asterdex.com',
  '$2a$10$rQ8xYZ9F7VXo8vXhZx9hk.K4Jx8pY7HJ9Lx9N4mXqZ9K7L8M9N0P1',
  'Asterdex Admin',
  'admin',
  true,
  true
) ON CONFLICT (email) DO NOTHING;

-- ============================================
-- SETUP COMPLETE!
-- ============================================

-- To verify the setup, run:
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public';
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
-- ============================================
-- COMPLETE DATABASE SETUP WITH ADMIN USER
-- Run this script in Supabase SQL Editor
-- ============================================

-- STEP 1: Run base schema (if not already done)
-- Copy contents from database-schema.sql first, then:
-- Copy contents from database-mlm-schema.sql

-- STEP 2: Create admin and test users
-- This script creates users directly in Supabase auth

-- ============================================
-- CREATE ADMIN USER
-- ============================================

-- Admin User
-- Email: admin@asterdex.com
-- Password: admin123
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@asterdex.com',
  crypt('admin123', gen_salt('bf')),
  NOW(),
  '{"full_name": "Admin User", "role": "admin"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
) ON CONFLICT (email) DO UPDATE SET
  encrypted_password = crypt('admin123', gen_salt('bf')),
  raw_user_meta_data = '{"full_name": "Admin User", "role": "admin"}',
  email_confirmed_at = NOW();

-- ============================================
-- CREATE TEST USER
-- ============================================

-- Regular User
-- Email: user@asterdex.com
-- Password: user123
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'user@asterdex.com',
  crypt('user123', gen_salt('bf')),
  NOW(),
  '{"full_name": "Test User", "role": "user"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
) ON CONFLICT (email) DO UPDATE SET
  encrypted_password = crypt('user123', gen_salt('bf')),
  raw_user_meta_data = '{"full_name": "Test User", "role": "user"}',
  email_confirmed_at = NOW();

-- ============================================
-- UPDATE PUBLIC USERS TABLE
-- ============================================

-- Insert into public.users from auth.users
INSERT INTO public.users (
  id,
  email,
  full_name,
  role,
  email_verified,
  is_active,
  wallet_balance,
  total_investment,
  total_earnings,
  robot_subscription_active,
  kyc_status,
  created_at,
  updated_at
)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', u.email),
  CASE
    WHEN u.email = 'admin@asterdex.com' THEN 'admin'::user_role
    ELSE 'user'::user_role
  END,
  true,
  true,
  1000.00, -- Starting balance for testing
  0,
  0,
  false,
  'not_submitted'::kyc_status,
  u.created_at,
  NOW()
FROM auth.users u
WHERE u.email IN ('admin@asterdex.com', 'user@asterdex.com')
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  email_verified = EXCLUDED.email_verified,
  wallet_balance = EXCLUDED.wallet_balance,
  updated_at = NOW();

-- ============================================
-- CREATE SAMPLE PACKAGES
-- ============================================

INSERT INTO public.packages (
  name,
  tier,
  min_amount,
  max_amount,
  roi_percentage_min,
  roi_percentage_max,
  description,
  benefits,
  is_active
) VALUES
  (
    'Starter Package',
    'tier_1',
    100.00,
    2000.00,
    5.00,
    7.00,
    'Perfect for beginners. Start earning with our entry-level package.',
    '{"features": ["5-7% ROI", "Level income", "Binary bonuses", "Rank rewards"]}',
    true
  ),
  (
    'Growth Package',
    'tier_2',
    2001.00,
    5000.00,
    7.00,
    9.00,
    'Ideal for growing your business. Enhanced earning potential.',
    '{"features": ["7-9% ROI", "Level income", "Binary bonuses", "Rank rewards", "Priority support"]}',
    true
  ),
  (
    'Premium Package',
    'tier_3',
    5001.00,
    999999.00,
    10.00,
    12.00,
    'Maximum earning potential for serious investors.',
    '{"features": ["10-12% ROI", "Level income", "Binary bonuses", "Rank rewards", "VIP support", "Exclusive bonuses"]}',
    true
  )
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- INSERT SYSTEM SETTINGS
-- ============================================

INSERT INTO public.system_settings (setting_key, setting_value, description) VALUES
  ('robot_subscription_price', '100', 'Robot subscription price in USD'),
  ('robot_subscription_duration_days', '30', 'Robot subscription duration'),
  ('min_withdrawal_amount', '50', 'Minimum withdrawal amount'),
  ('withdrawal_fee_percentage', '2', 'Withdrawal fee percentage'),
  ('referral_commission_rate', '0.1', 'Referral commission rate (10%)'),
  ('kyc_required_for_withdrawal', 'true', 'Require KYC for withdrawals'),
  ('matching_bonus_enabled', 'true', 'Enable matching bonus system'),
  ('rank_rewards_enabled', 'true', 'Enable rank reward system'),
  ('booster_income_days', '30', 'Days for booster income qualification')
ON CONFLICT (setting_key) DO UPDATE SET
  setting_value = EXCLUDED.setting_value,
  updated_at = NOW();

-- ============================================
-- CREATE WELCOME NOTIFICATIONS
-- ============================================

INSERT INTO public.notifications (user_id, title, message, notification_type, is_read)
SELECT
  u.id,
  'Welcome to Asterdex MLM! 🎉',
  'Start your journey by activating your robot subscription ($100) and purchasing your first package.',
  'system',
  false
FROM public.users u
WHERE u.email IN ('admin@asterdex.com', 'user@asterdex.com')
  AND NOT EXISTS (
    SELECT 1 FROM public.notifications
    WHERE user_id = u.id
    AND title = 'Welcome to Asterdex MLM! 🎉'
  );

-- ============================================
-- VERIFY SETUP
-- ============================================

-- Check if users were created
SELECT
  email,
  full_name,
  role,
  wallet_balance,
  email_verified,
  created_at
FROM public.users
WHERE email IN ('admin@asterdex.com', 'user@asterdex.com');

-- Check packages
SELECT name, tier, min_amount, max_amount, roi_percentage_min, roi_percentage_max
FROM public.packages
WHERE is_active = true;

-- Check system settings
SELECT setting_key, setting_value, description
FROM public.system_settings;

-- ============================================
-- SETUP COMPLETE!
-- ============================================

-- You can now login with:
-- Admin: admin@asterdex.com / admin123
-- User:  user@asterdex.com  / user123

-- Both users have $1000 starting balance for testing

-- Next steps:
-- 1. Configure .env file with your Supabase credentials
-- 2. Start the app: npm run dev
-- 3. Go to: http://localhost:5173/login
-- 4. Login with credentials above
