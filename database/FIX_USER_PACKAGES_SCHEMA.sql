-- ============================================================================
-- FIX USER_PACKAGES SCHEMA
-- This script drops and recreates the user_packages table with full MLM schema
-- ============================================================================

-- Step 1: Drop existing tables (CASCADE will drop dependent objects)
DROP TABLE IF EXISTS roi_distributions CASCADE;
DROP TABLE IF EXISTS user_packages CASCADE;

-- Step 2: Create user_packages table with full schema
CREATE TABLE user_packages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  package_id UUID NOT NULL REFERENCES packages(id) ON DELETE RESTRICT,

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
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 3: Create indexes for user_packages
CREATE INDEX idx_user_packages_user_id ON user_packages(user_id);
CREATE INDEX idx_user_packages_status ON user_packages(status);
CREATE INDEX idx_user_packages_expiry ON user_packages(expiry_date) WHERE status = 'active';
CREATE INDEX idx_user_packages_last_roi_date ON user_packages(last_roi_date) WHERE status = 'active';

-- Step 4: Create roi_distributions table
CREATE TABLE roi_distributions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_package_id UUID NOT NULL REFERENCES user_packages(id) ON DELETE CASCADE,
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

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 5: Create indexes for roi_distributions
CREATE INDEX idx_roi_distributions_user_package ON roi_distributions(user_package_id);
CREATE INDEX idx_roi_distributions_user_id ON roi_distributions(user_id);
CREATE INDEX idx_roi_distributions_date ON roi_distributions(distribution_date);
CREATE INDEX idx_roi_distributions_status ON roi_distributions(status) WHERE status = 'pending';

-- Step 6: Enable RLS on both tables
ALTER TABLE user_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE roi_distributions ENABLE ROW LEVEL SECURITY;

-- Step 7: Create RLS policies for user_packages
CREATE POLICY "Users can view their own packages"
  ON user_packages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own packages"
  ON user_packages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin full access to user_packages"
  ON user_packages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Step 8: Create RLS policies for roi_distributions
CREATE POLICY "Users can view their own ROI distributions"
  ON roi_distributions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admin full access to roi_distributions"
  ON roi_distributions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Verify the schema
SELECT
  'user_packages' as table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'user_packages'
ORDER BY ordinal_position;
