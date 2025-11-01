import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://postgres.dsgtyrwtlpnckvcozfbc:Dubai%401234%23@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres';

async function runSchemaSetup() {
  const client = new Client({ connectionString });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully!\n');

    // ============================================
    // 1. Package Features Table
    // ============================================
    console.log('📦 Creating package_features table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.package_features (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        package_id UUID NOT NULL REFERENCES public.packages(id) ON DELETE CASCADE,
        feature_text TEXT NOT NULL,
        feature_icon TEXT,
        display_order INTEGER DEFAULT 0,
        is_highlighted BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('✅ package_features created\n');

    // ============================================
    // 2. Package Level Commissions Table
    // ============================================
    console.log('💰 Creating package_level_commissions table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.package_level_commissions (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        package_id UUID NOT NULL REFERENCES public.packages(id) ON DELETE CASCADE,
        level INTEGER NOT NULL CHECK (level >= 1 AND level <= 30),
        commission_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        CONSTRAINT unique_package_level UNIQUE (package_id, level)
      );
    `);
    console.log('✅ package_level_commissions created\n');

    // ============================================
    // 3. User Packages Table
    // ============================================
    console.log('👥 Creating user_packages table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.user_packages (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        package_id UUID NOT NULL REFERENCES public.packages(id) ON DELETE RESTRICT,
        investment_amount DECIMAL(10,2) NOT NULL,
        daily_roi_amount DECIMAL(10,2) NOT NULL,
        total_roi_limit DECIMAL(10,2) NOT NULL,
        purchase_date TIMESTAMPTZ DEFAULT NOW(),
        activation_date TIMESTAMPTZ DEFAULT NOW(),
        expiry_date TIMESTAMPTZ NOT NULL,
        total_roi_earned DECIMAL(10,2) DEFAULT 0,
        total_roi_paid DECIMAL(10,2) DEFAULT 0,
        days_completed INTEGER DEFAULT 0,
        last_roi_date DATE,
        status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'completed')),
        payment_method TEXT DEFAULT 'wallet',
        transaction_id TEXT,
        metadata JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('✅ user_packages created\n');

    // ============================================
    // 4. ROI Distributions Table
    // ============================================
    console.log('💵 Creating roi_distributions table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.roi_distributions (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_package_id UUID NOT NULL REFERENCES public.user_packages(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        roi_amount DECIMAL(10,2) NOT NULL,
        roi_percentage DECIMAL(5,2) NOT NULL,
        investment_amount DECIMAL(10,2) NOT NULL,
        distribution_date DATE NOT NULL,
        day_number INTEGER NOT NULL,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed')),
        paid_at TIMESTAMPTZ,
        wallet_transaction_id UUID,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('✅ roi_distributions created\n');

    // ============================================
    // 5. Package Commission Earnings Table
    // ============================================
    console.log('🎁 Creating package_commission_earnings table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.package_commission_earnings (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        from_user_package_id UUID NOT NULL REFERENCES public.user_packages(id) ON DELETE CASCADE,
        commission_type TEXT NOT NULL CHECK (commission_type IN ('direct', 'level', 'binary')),
        commission_level INTEGER,
        commission_percentage DECIMAL(5,2) NOT NULL,
        commission_amount DECIMAL(10,2) NOT NULL,
        package_id UUID NOT NULL REFERENCES public.packages(id) ON DELETE RESTRICT,
        investment_amount DECIMAL(10,2) NOT NULL,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed')),
        paid_at TIMESTAMPTZ,
        wallet_transaction_id UUID,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('✅ package_commission_earnings created\n');

    // ============================================
    // 6. Package Analytics Table
    // ============================================
    console.log('📊 Creating package_analytics table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.package_analytics (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        package_id UUID NOT NULL REFERENCES public.packages(id) ON DELETE CASCADE,
        total_purchases INTEGER DEFAULT 0,
        total_active_users INTEGER DEFAULT 0,
        total_expired_users INTEGER DEFAULT 0,
        total_investment DECIMAL(15,2) DEFAULT 0,
        total_roi_paid DECIMAL(15,2) DEFAULT 0,
        average_investment DECIMAL(10,2) DEFAULT 0,
        last_purchase_date TIMESTAMPTZ,
        analytics_date DATE DEFAULT CURRENT_DATE,
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        CONSTRAINT unique_package_date UNIQUE (package_id, analytics_date)
      );
    `);
    console.log('✅ package_analytics created\n');

    // ============================================
    // 7. Create Indexes
    // ============================================
    console.log('🔍 Creating indexes...');

    // Package features indexes
    await client.query(`CREATE INDEX IF NOT EXISTS idx_package_features_package_id ON public.package_features(package_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_package_features_display_order ON public.package_features(package_id, display_order)`);

    // Level commissions indexes
    await client.query(`CREATE INDEX IF NOT EXISTS idx_level_commissions_package_id ON public.package_level_commissions(package_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_level_commissions_level ON public.package_level_commissions(package_id, level)`);

    // User packages indexes
    await client.query(`CREATE INDEX IF NOT EXISTS idx_user_packages_user_id ON public.user_packages(user_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_user_packages_status ON public.user_packages(status)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_user_packages_expiry ON public.user_packages(expiry_date)`);

    // ROI distributions indexes
    await client.query(`CREATE INDEX IF NOT EXISTS idx_roi_distributions_user_package ON public.roi_distributions(user_package_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_roi_distributions_user_id ON public.roi_distributions(user_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_roi_distributions_date ON public.roi_distributions(distribution_date)`);

    // Commission earnings indexes
    await client.query(`CREATE INDEX IF NOT EXISTS idx_commission_earnings_user_id ON public.package_commission_earnings(user_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_commission_earnings_from_user ON public.package_commission_earnings(from_user_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_commission_earnings_type ON public.package_commission_earnings(commission_type)`);

    console.log('✅ Indexes created\n');

    // ============================================
    // 8. Enable RLS
    // ============================================
    console.log('🔒 Enabling Row Level Security...');
    await client.query(`ALTER TABLE public.package_features ENABLE ROW LEVEL SECURITY`);
    await client.query(`ALTER TABLE public.package_level_commissions ENABLE ROW LEVEL SECURITY`);
    await client.query(`ALTER TABLE public.user_packages ENABLE ROW LEVEL SECURITY`);
    await client.query(`ALTER TABLE public.roi_distributions ENABLE ROW LEVEL SECURITY`);
    await client.query(`ALTER TABLE public.package_commission_earnings ENABLE ROW LEVEL SECURITY`);
    await client.query(`ALTER TABLE public.package_analytics ENABLE ROW LEVEL SECURITY`);
    console.log('✅ RLS enabled\n');

    // ============================================
    // 9. Create RLS Policies
    // ============================================
    console.log('📜 Creating RLS policies...');

    // Package features policies
    await client.query(`
      DROP POLICY IF EXISTS "Anyone can read package features" ON public.package_features;
      CREATE POLICY "Anyone can read package features"
        ON public.package_features FOR SELECT USING (true);
    `);

    // User packages policies
    await client.query(`
      DROP POLICY IF EXISTS "Users can read own packages" ON public.user_packages;
      CREATE POLICY "Users can read own packages"
        ON public.user_packages FOR SELECT USING (auth.uid() = user_id);
    `);

    // ROI distributions policies
    await client.query(`
      DROP POLICY IF EXISTS "Users can read own ROI" ON public.roi_distributions;
      CREATE POLICY "Users can read own ROI"
        ON public.roi_distributions FOR SELECT USING (auth.uid() = user_id);
    `);

    // Commission earnings policies
    await client.query(`
      DROP POLICY IF EXISTS "Users can read own commissions" ON public.package_commission_earnings;
      CREATE POLICY "Users can read own commissions"
        ON public.package_commission_earnings FOR SELECT USING (auth.uid() = user_id);
    `);

    console.log('✅ RLS policies created\n');

    // ============================================
    // 10. Verify Setup
    // ============================================
    console.log('🔍 Verifying setup...');
    const tables = await client.query(`
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
    `);

    console.log('\n✅ Created tables:');
    tables.rows.forEach(row => console.log(`   - ${row.table_name}`));

    console.log('\n🎉 Schema setup complete!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.position) {
      console.error('Position:', error.position);
    }
    console.error('\nFull error:', error);
  } finally {
    await client.end();
    console.log('👋 Connection closed');
  }
}

runSchemaSetup();
