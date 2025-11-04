-- ============================================================================
-- CREATE TRANSACTIONS TABLE
-- Complete audit trail for all financial transactions
-- ============================================================================

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Transaction details
  type VARCHAR(50) NOT NULL CHECK (type IN (
    'package_purchase',
    'level_commission',
    'binary_commission',
    'roi_distribution',
    'rank_reward',
    'withdrawal',
    'deposit',
    'transfer',
    'refund',
    'adjustment',
    'bonus'
  )),

  amount DECIMAL(18,6) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
    'pending',
    'completed',
    'failed',
    'cancelled',
    'processing'
  )),

  -- Description and reference
  description TEXT,
  reference_id UUID,  -- Links to user_packages, commissions, roi_distributions, etc.
  reference_type VARCHAR(50),  -- 'user_package', 'commission', 'roi_distribution', etc.

  -- Additional metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_transactions_user_id
ON transactions(user_id);

CREATE INDEX IF NOT EXISTS idx_transactions_type
ON transactions(type);

CREATE INDEX IF NOT EXISTS idx_transactions_status
ON transactions(status);

CREATE INDEX IF NOT EXISTS idx_transactions_reference
ON transactions(reference_type, reference_id);

CREATE INDEX IF NOT EXISTS idx_transactions_created_at
ON transactions(created_at DESC);

-- Enable Row Level Security
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own transactions
CREATE POLICY "Users can view their own transactions"
ON transactions FOR SELECT
USING (auth.uid() = user_id);

-- RLS Policy: System can insert transactions (via service role)
CREATE POLICY "System can insert transactions"
ON transactions FOR INSERT
WITH CHECK (true);

-- RLS Policy: Admin full access
CREATE POLICY "Admin full access to transactions"
ON transactions FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Add helpful comments
COMMENT ON TABLE transactions IS 'Complete audit trail for all financial transactions in the system';
COMMENT ON COLUMN transactions.type IS 'Type of transaction (package_purchase, commission, ROI, etc)';
COMMENT ON COLUMN transactions.reference_id IS 'UUID of the related record that triggered this transaction';
COMMENT ON COLUMN transactions.reference_type IS 'Type of the referenced record (user_package, commission, etc)';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Verify the schema
SELECT
  'transactions' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'transactions'
ORDER BY ordinal_position;
