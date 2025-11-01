-- ============================================================================
-- MANUAL FIX: Run this in Supabase SQL Editor
-- Copy and paste this entire script into your Supabase SQL Editor
-- ============================================================================

-- Create remaining indexes
CREATE INDEX IF NOT EXISTS idx_package_analytics_package_id ON public.package_analytics(package_id);
CREATE INDEX IF NOT EXISTS idx_package_analytics_date ON public.package_analytics(analytics_date DESC);

-- Verify all tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'packages', 'package_features', 'package_level_commissions',
    'user_packages', 'roi_distributions', 'package_commission_earnings', 'package_analytics'
  )
ORDER BY table_name;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ All indexes created successfully!';
END $$;
