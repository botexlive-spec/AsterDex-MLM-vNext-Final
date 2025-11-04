-- ============================================================================
-- FIX COMMISSIONS TABLE SCHEMA
-- Adds missing columns: percentage, reference_type, reference_id
-- ============================================================================

-- Step 1: Add percentage column (commission percentage rate)
ALTER TABLE commissions
ADD COLUMN IF NOT EXISTS percentage DECIMAL(5,2);

-- Step 2: Add reference_type column (what triggered the commission)
ALTER TABLE commissions
ADD COLUMN IF NOT EXISTS reference_type VARCHAR(50);

-- Step 3: Add reference_id column (link to package/transaction/etc)
ALTER TABLE commissions
ADD COLUMN IF NOT EXISTS reference_id UUID;

-- Step 4: Create index for reference lookups
CREATE INDEX IF NOT EXISTS idx_commissions_reference
ON commissions(reference_type, reference_id);

-- Step 5: Add comment
COMMENT ON COLUMN commissions.percentage IS 'Commission percentage rate used for calculation';
COMMENT ON COLUMN commissions.reference_type IS 'Type of transaction that triggered commission (package_purchase, binary_match, etc)';
COMMENT ON COLUMN commissions.reference_id IS 'UUID of the related record (user_package_id, transaction_id, etc)';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Verify the schema
SELECT
  'commissions' as table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'commissions'
ORDER BY ordinal_position;
