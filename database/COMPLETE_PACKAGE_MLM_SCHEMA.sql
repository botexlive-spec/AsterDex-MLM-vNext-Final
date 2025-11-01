-- ============================================================================
-- COMPLETE MLM PACKAGE MANAGEMENT SYSTEM - DATABASE SCHEMA
-- ============================================================================
-- This schema includes everything needed for a full MLM package system:
-- 1. Enhanced packages table with all MLM features
-- 2. Package features management
-- 3. Package level commissions (1-30 levels)
-- 4. User package purchases tracking
-- 5. ROI distribution tracking
-- 6. Commission earnings tracking
-- 7. Package analytics
-- ============================================================================

-- ============================================================================
-- 1. ENHANCED PACKAGES TABLE (Already exists, but we'll add missing columns)
-- ============================================================================

-- Add missing columns to existing packages table
ALTER TABLE public.packages ADD COLUMN IF NOT EXISTS price DECIMAL(10,2) DEFAULT 0;
ALTER TABLE public.packages ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.packages ADD COLUMN IF NOT EXISTS direct_commission_percentage DECIMAL(5,2) DEFAULT 10.0;
ALTER TABLE public.packages ADD COLUMN IF NOT EXISTS binary_volume_multiplier DECIMAL(3,1) DEFAULT 1.0;
ALTER TABLE public.packages ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.packages ADD COLUMN IF NOT EXISTS allow_multiple_purchases BOOLEAN DEFAULT true;
ALTER TABLE public.packages ADD COLUMN IF NOT EXISTS allow_upgrades BOOLEAN DEFAULT true;
ALTER TABLE public.packages ADD COLUMN IF NOT EXISTS auto_renewal BOOLEAN DEFAULT false;
ALTER TABLE public.packages ADD COLUMN IF NOT EXISTS min_rank_required TEXT;
ALTER TABLE public.packages ADD COLUMN IF NOT EXISTS kyc_required BOOLEAN DEFAULT false;
ALTER TABLE public.packages ADD COLUMN IF NOT EXISTS robot_required BOOLEAN DEFAULT false;

-- Create index on status for faster queries
CREATE INDEX IF NOT EXISTS idx_packages_status ON public.packages(status) WHERE status = 'active';

-- ============================================================================
-- 2. PACKAGE FEATURES TABLE (Separate table for better management)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.package_features (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  package_id UUID NOT NULL REFERENCES public.packages(id) ON DELETE CASCADE,
  feature_text TEXT NOT NULL,
  feature_icon TEXT, -- Icon name from lucide-react
  display_order INTEGER DEFAULT 0,
  is_highlighted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_package_features_package FOREIGN KEY (package_id) REFERENCES public.packages(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_package_features_package_id ON public.package_features(package_id);
CREATE INDEX IF NOT EXISTS idx_package_features_display_order ON public.package_features(package_id, display_order);

-- ============================================================================
-- 3. PACKAGE LEVEL COMMISSIONS (1-30 levels configuration)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.package_level_commissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  package_id UUID NOT NULL REFERENCES public.packages(id) ON DELETE CASCADE,
  level INTEGER NOT NULL CHECK (level >= 1 AND level <= 30),
  commission_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_package_level UNIQUE (package_id, level),
  CONSTRAINT fk_level_commissions_package FOREIGN KEY (package_id) REFERENCES public.packages(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_level_commissions_package_id ON public.package_level_commissions(package_id);
CREATE INDEX IF NOT EXISTS idx_level_commissions_level ON public.package_level_commissions(package_id, level);

-- ============================================================================
-- 4. USER PACKAGES (Track user's purchased packages)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_packages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  package_id UUID NOT NULL REFERENCES public.packages(id) ON DELETE RESTRICT,

  -- Investment details
  investment_amount DECIMAL(10,2) NOT NULL,
  daily_roi_amount DECIMAL(10,2) NOT NULL,
  total_roi_limit DECIMAL(10,2) NOT NULL,

  -- Dates
  purchase_date TIMESTAMPTZ DEFAULT NOW(),
  activation_date TIMESTAMPTZ DEFAULT NOW(),
  expiry_date TIMESTAMPTZ NOT NULL,

  -- Tracking
  total_roi_earned DECIMAL(10,2) DEFAULT 0,
  total_roi_paid DECIMAL(10,2) DEFAULT 0,
  days_completed INTEGER DEFAULT 0,
  last_roi_date DATE,

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'completed')),

  -- Payment details
  payment_method TEXT DEFAULT 'wallet',
  transaction_id TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT fk_user_packages_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_packages_package FOREIGN KEY (package_id) REFERENCES public.packages(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_user_packages_user_id ON public.user_packages(user_id);
CREATE INDEX IF NOT EXISTS idx_user_packages_status ON public.user_packages(status);
CREATE INDEX IF NOT EXISTS idx_user_packages_expiry ON public.user_packages(expiry_date) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_user_packages_last_roi_date ON public.user_packages(last_roi_date) WHERE status = 'active';

-- ============================================================================
-- 5. ROI DISTRIBUTIONS (Track daily ROI payments)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.roi_distributions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_package_id UUID NOT NULL REFERENCES public.user_packages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Amount details
  roi_amount DECIMAL(10,2) NOT NULL,
  roi_percentage DECIMAL(5,2) NOT NULL,
  investment_amount DECIMAL(10,2) NOT NULL,

  -- Distribution details
  distribution_date DATE NOT NULL,
  day_number INTEGER NOT NULL,

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed')),
  paid_at TIMESTAMPTZ,

  -- Transaction reference
  wallet_transaction_id UUID,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT fk_roi_distributions_user_package FOREIGN KEY (user_package_id) REFERENCES public.user_packages(id) ON DELETE CASCADE,
  CONSTRAINT fk_roi_distributions_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_roi_distributions_user_package ON public.roi_distributions(user_package_id);
CREATE INDEX IF NOT EXISTS idx_roi_distributions_user_id ON public.roi_distributions(user_id);
CREATE INDEX IF NOT EXISTS idx_roi_distributions_date ON public.roi_distributions(distribution_date);
CREATE INDEX IF NOT EXISTS idx_roi_distributions_status ON public.roi_distributions(status) WHERE status = 'pending';

-- ============================================================================
-- 6. PACKAGE COMMISSION EARNINGS (Track commission from package purchases)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.package_commission_earnings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Who earned
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Who purchased
  from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_user_package_id UUID NOT NULL REFERENCES public.user_packages(id) ON DELETE CASCADE,

  -- Commission details
  commission_type TEXT NOT NULL CHECK (commission_type IN ('direct', 'level', 'binary')),
  commission_level INTEGER, -- NULL for direct/binary, 1-30 for level
  commission_percentage DECIMAL(5,2) NOT NULL,
  commission_amount DECIMAL(10,2) NOT NULL,

  -- Package details
  package_id UUID NOT NULL REFERENCES public.packages(id) ON DELETE RESTRICT,
  investment_amount DECIMAL(10,2) NOT NULL,

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed')),
  paid_at TIMESTAMPTZ,

  -- Transaction reference
  wallet_transaction_id UUID,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT fk_commission_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT fk_commission_from_user FOREIGN KEY (from_user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT fk_commission_package FOREIGN KEY (package_id) REFERENCES public.packages(id) ON DELETE RESTRICT,
  CONSTRAINT fk_commission_user_package FOREIGN KEY (from_user_package_id) REFERENCES public.user_packages(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_commission_earnings_user_id ON public.package_commission_earnings(user_id);
CREATE INDEX IF NOT EXISTS idx_commission_earnings_from_user ON public.package_commission_earnings(from_user_id);
CREATE INDEX IF NOT EXISTS idx_commission_earnings_type ON public.package_commission_earnings(commission_type);
CREATE INDEX IF NOT EXISTS idx_commission_earnings_status ON public.package_commission_earnings(status);

-- ============================================================================
-- 7. PACKAGE ANALYTICS (Pre-computed statistics for performance)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.package_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  package_id UUID NOT NULL REFERENCES public.packages(id) ON DELETE CASCADE,

  -- Counters
  total_purchases INTEGER DEFAULT 0,
  total_active_users INTEGER DEFAULT 0,
  total_expired_users INTEGER DEFAULT 0,

  -- Amounts
  total_investment DECIMAL(15,2) DEFAULT 0,
  total_roi_paid DECIMAL(15,2) DEFAULT 0,
  average_investment DECIMAL(10,2) DEFAULT 0,

  -- Dates
  last_purchase_date TIMESTAMPTZ,
  analytics_date DATE DEFAULT CURRENT_DATE,

  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_package_date UNIQUE (package_id, analytics_date),
  CONSTRAINT fk_analytics_package FOREIGN KEY (package_id) REFERENCES public.packages(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_package_analytics_package_id ON public.package_analytics(package_id);
CREATE INDEX IF NOT EXISTS idx_package_analytics_date ON public.package_analytics(analytics_date DESC);

-- ============================================================================
-- 8. ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.package_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.package_level_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roi_distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.package_commission_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.package_analytics ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 9. RLS POLICIES
-- ============================================================================

-- Package Features: Anyone can read active package features
DROP POLICY IF EXISTS "Anyone can read package features" ON public.package_features;
CREATE POLICY "Anyone can read package features"
  ON public.package_features
  FOR SELECT
  USING (true);

-- Package Features: Admins can manage
DROP POLICY IF EXISTS "Admins can manage package features" ON public.package_features;
CREATE POLICY "Admins can manage package features"
  ON public.package_features
  FOR ALL
  USING (
    (SELECT role FROM auth.users WHERE id = auth.uid()) = 'admin'
  );

-- Package Level Commissions: Anyone can read
DROP POLICY IF EXISTS "Anyone can read level commissions" ON public.package_level_commissions;
CREATE POLICY "Anyone can read level commissions"
  ON public.package_level_commissions
  FOR SELECT
  USING (true);

-- Package Level Commissions: Admins can manage
DROP POLICY IF EXISTS "Admins can manage level commissions" ON public.package_level_commissions;
CREATE POLICY "Admins can manage level commissions"
  ON public.package_level_commissions
  FOR ALL
  USING (
    (SELECT role FROM auth.users WHERE id = auth.uid()) = 'admin'
  );

-- User Packages: Users can read their own packages
DROP POLICY IF EXISTS "Users can read own packages" ON public.user_packages;
CREATE POLICY "Users can read own packages"
  ON public.user_packages
  FOR SELECT
  USING (auth.uid() = user_id);

-- User Packages: Admins can read all
DROP POLICY IF EXISTS "Admins can read all user packages" ON public.user_packages;
CREATE POLICY "Admins can read all user packages"
  ON public.user_packages
  FOR SELECT
  USING (
    (SELECT role FROM auth.users WHERE id = auth.uid()) = 'admin'
  );

-- ROI Distributions: Users can read their own
DROP POLICY IF EXISTS "Users can read own ROI" ON public.roi_distributions;
CREATE POLICY "Users can read own ROI"
  ON public.roi_distributions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Commission Earnings: Users can read their own
DROP POLICY IF EXISTS "Users can read own commissions" ON public.package_commission_earnings;
CREATE POLICY "Users can read own commissions"
  ON public.package_commission_earnings
  FOR SELECT
  USING (auth.uid() = user_id);

-- Analytics: Admins only
DROP POLICY IF EXISTS "Admins can read analytics" ON public.package_analytics;
CREATE POLICY "Admins can read analytics"
  ON public.package_analytics
  FOR SELECT
  USING (
    (SELECT role FROM auth.users WHERE id = auth.uid()) = 'admin'
  );

-- ============================================================================
-- 10. ENABLE REAL-TIME FOR INSTANT SYNC
-- ============================================================================

-- Enable real-time for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.package_features;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.package_level_commissions;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.user_packages;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.roi_distributions;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.package_commission_earnings;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.package_analytics;

-- ============================================================================
-- 11. HELPER FUNCTIONS
-- ============================================================================

-- Function to update package analytics
CREATE OR REPLACE FUNCTION update_package_analytics(p_package_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.package_analytics (
    package_id,
    total_purchases,
    total_active_users,
    total_expired_users,
    total_investment,
    total_roi_paid,
    average_investment,
    last_purchase_date,
    analytics_date
  )
  SELECT
    p_package_id,
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'active'),
    COUNT(*) FILTER (WHERE status = 'expired'),
    COALESCE(SUM(investment_amount), 0),
    COALESCE(SUM(total_roi_paid), 0),
    COALESCE(AVG(investment_amount), 0),
    MAX(purchase_date),
    CURRENT_DATE
  FROM public.user_packages
  WHERE package_id = p_package_id
  ON CONFLICT (package_id, analytics_date)
  DO UPDATE SET
    total_purchases = EXCLUDED.total_purchases,
    total_active_users = EXCLUDED.total_active_users,
    total_expired_users = EXCLUDED.total_expired_users,
    total_investment = EXCLUDED.total_investment,
    total_roi_paid = EXCLUDED.total_roi_paid,
    average_investment = EXCLUDED.average_investment,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = NOW();
END;
$$;

-- Function to automatically update package updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_packages_updated_at ON public.packages;
CREATE TRIGGER update_packages_updated_at
  BEFORE UPDATE ON public.packages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_packages_updated_at ON public.user_packages;
CREATE TRIGGER update_user_packages_updated_at
  BEFORE UPDATE ON public.user_packages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 12. VERIFICATION QUERIES
-- ============================================================================

-- Check all tables created
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'packages',
    'package_features',
    'package_level_commissions',
    'user_packages',
    'roi_distributions',
    'package_commission_earnings',
    'package_analytics'
  )
ORDER BY table_name;

-- Check real-time enabled
SELECT tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename IN (
    'packages',
    'package_features',
    'package_level_commissions',
    'user_packages',
    'roi_distributions',
    'package_commission_earnings',
    'package_analytics'
  )
ORDER BY tablename;

-- ============================================================================
-- SUCCESS!
-- ============================================================================
-- All tables, indexes, RLS policies, and real-time subscriptions are now set up.
-- Next steps:
-- 1. Build the admin interface for package management
-- 2. Build the user package purchase flow
-- 3. Create the MLM distribution logic
-- 4. Set up the ROI distribution cron job
-- ============================================================================
