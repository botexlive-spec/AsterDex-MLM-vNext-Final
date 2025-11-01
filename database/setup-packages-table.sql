-- ============================================
-- PACKAGES TABLE SETUP FOR PACKAGESENHANCED
-- ============================================
-- Run this in your Supabase SQL Editor
-- Time: 2 minutes
-- ============================================

-- 1. Create packages table
CREATE TABLE IF NOT EXISTS public.packages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  min_investment DECIMAL(10,2) NOT NULL DEFAULT 100,
  max_investment DECIMAL(10,2) NOT NULL DEFAULT 5000,
  daily_return_percentage DECIMAL(5,2) NOT NULL DEFAULT 5.0,
  max_return_percentage DECIMAL(5,2) NOT NULL DEFAULT 600,
  duration_days INTEGER NOT NULL DEFAULT 365,
  level_depth INTEGER NOT NULL DEFAULT 10,
  binary_bonus_percentage DECIMAL(5,2) NOT NULL DEFAULT 10,
  features JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  is_popular BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create indexes for better performance
CREATE INDEX IF NOT EXISTS packages_sort_order_idx ON public.packages(sort_order);
CREATE INDEX IF NOT EXISTS packages_status_idx ON public.packages(status);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policy: Anyone can read active packages
DROP POLICY IF EXISTS "Anyone can read active packages" ON public.packages;
CREATE POLICY "Anyone can read active packages"
  ON public.packages
  FOR SELECT
  USING (status = 'active');

-- 5. Create RLS policy: Admins can manage packages (adjust based on your auth setup)
DROP POLICY IF EXISTS "Admins can manage packages" ON public.packages;
CREATE POLICY "Admins can manage packages"
  ON public.packages
  FOR ALL
  USING (
    auth.jwt() ->> 'role' = 'admin'
    OR
    (SELECT role FROM auth.users WHERE id = auth.uid()) = 'admin'
  );

-- 6. CRITICAL: Enable Real-time for instant admin-user sync
ALTER PUBLICATION supabase_realtime ADD TABLE public.packages;

-- ============================================
-- 7. INSERT 3 SAMPLE PACKAGES
-- ============================================

INSERT INTO public.packages (
  name, description, min_investment, max_investment,
  daily_return_percentage, duration_days, level_depth,
  binary_bonus_percentage, features, status, is_popular, sort_order
) VALUES

-- 🌱 STARTER PACKAGE (Green Card)
(
  'Starter Package',
  'Perfect for beginners looking to start their investment journey',
  100,
  2000,
  5.0,
  365,
  10,
  10,
  '["Daily ROI payments", "Level income up to 10 levels", "Binary matching bonus", "Email support", "Monthly performance reports"]'::jsonb,
  'active',
  false,
  0
),

-- 📈 GROWTH PACKAGE (Blue Card) - Most Popular
(
  'Growth Package',
  'Ideal for growing your wealth with enhanced earning potential',
  2001,
  5000,
  7.0,
  365,
  15,
  12,
  '["Higher daily returns 7%", "Level income up to 15 levels", "Enhanced binary bonus 12%", "Priority email support", "Weekly performance reports", "Dedicated account manager"]'::jsonb,
  'active',
  true,
  1
),

-- 💎 PREMIUM PACKAGE (Purple Card)
(
  'Premium Package',
  'Maximum earning potential for serious investors',
  5001,
  50000,
  10.0,
  365,
  30,
  15,
  '["Maximum ROI 10% daily", "Unlimited level income", "Premium binary bonus 15%", "24/7 VIP support", "Daily detailed reports", "Personal wealth manager", "Exclusive investment opportunities"]'::jsonb,
  'active',
  false,
  2
);

-- ============================================
-- 8. VERIFY SETUP
-- ============================================

-- Check if table was created
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name = 'packages';

-- Check if packages were inserted
SELECT id, name, status, is_popular, sort_order
FROM public.packages
ORDER BY sort_order;

-- Check if real-time is enabled
SELECT * FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
AND tablename = 'packages';

-- ============================================
-- EXPECTED RESULTS:
-- ============================================
-- ✅ Table created: packages
-- ✅ Indexes created: 2 indexes
-- ✅ RLS enabled: Yes
-- ✅ Policies created: 2 policies
-- ✅ Real-time enabled: Yes
-- ✅ Sample packages: 3 packages inserted
-- ============================================

-- Next step: Refresh your browser at http://localhost:5174/packages
-- You should see 3 beautiful gradient cards! 🎉
