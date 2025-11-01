import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://postgres.dsgtyrwtlpnckvcozfbc:Dubai%401234%23@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres';

async function fixCommissionManagement() {
  const client = new Client({ connectionString });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected!\n');

    // Step 1: Create commission_settings table
    console.log('1️⃣  Creating commission_settings table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.commission_settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        level_commissions JSONB DEFAULT '[]'::jsonb,
        binary_settings JSONB DEFAULT '{
          "matchingPercentage": 10,
          "dailyCap": 1000,
          "weeklyCap": 5000,
          "monthlyCap": 20000,
          "matchingRatio": "1:1",
          "flushPeriod": "daily"
        }'::jsonb,
        roi_settings JSONB DEFAULT '{
          "starterMin": 3,
          "starterMax": 5,
          "growthMin": 5,
          "growthMax": 7,
          "premiumMin": 7,
          "premiumMax": 10,
          "distributionSchedule": "daily"
        }'::jsonb,
        rank_rewards JSONB DEFAULT '[]'::jsonb,
        booster_settings JSONB DEFAULT '{
          "percentage": 5,
          "conditions": "Active downlines"
        }'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('   ✅ Table created\n');

    // Step 2: Insert default settings if table is empty
    console.log('2️⃣  Inserting default commission settings...');
    const checkData = await client.query(`SELECT COUNT(*) FROM public.commission_settings;`);
    if (parseInt(checkData.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO public.commission_settings (level_commissions)
        VALUES (
          '[
            {"level": 1, "percentage": 4, "status": "active"},
            {"level": 2, "percentage": 4, "status": "active"},
            {"level": 3, "percentage": 3, "status": "active"},
            {"level": 4, "percentage": 2, "status": "active"},
            {"level": 5, "percentage": 1, "status": "active"},
            {"level": 6, "percentage": 2, "status": "active"},
            {"level": 7, "percentage": 2, "status": "active"},
            {"level": 8, "percentage": 2, "status": "active"}
          ]'::jsonb
        );
      `);
      console.log('   ✅ Default settings inserted\n');
    } else {
      console.log('   ℹ️  Settings already exist, skipping insert\n');
    }

    // Step 3: Create withdrawal_requests table (for commission payouts)
    console.log('3️⃣  Creating withdrawal_requests table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES auth.users(id),
        amount DECIMAL(20,8) NOT NULL,
        currency VARCHAR(10) DEFAULT 'USDT',
        wallet_address TEXT,
        status VARCHAR(20) DEFAULT 'pending',
        type VARCHAR(50) DEFAULT 'commission',
        notes TEXT,
        processed_by UUID REFERENCES auth.users(id),
        processed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('   ✅ Table created\n');

    // Step 4: Create deposits table
    console.log('4️⃣  Creating deposits table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.deposits (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES auth.users(id),
        amount DECIMAL(20,8) NOT NULL,
        currency VARCHAR(10) DEFAULT 'USDT',
        transaction_hash TEXT,
        status VARCHAR(20) DEFAULT 'pending',
        type VARCHAR(50) DEFAULT 'deposit',
        notes TEXT,
        confirmed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('   ✅ Table created\n');

    // Step 5: Enable RLS on all commission tables
    const commissionTables = [
      'commission_settings',
      'package_commission_earnings',
      'package_level_commissions',
      'withdrawal_requests',
      'deposits'
    ];

    console.log('5️⃣  Setting up RLS policies for all commission tables...\n');

    for (const table of commissionTables) {
      // Check if table exists
      const tableCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = $1
        );
      `, [table]);

      if (!tableCheck.rows[0].exists) {
        console.log(`   ⚠️  Table ${table} does not exist, skipping...`);
        continue;
      }

      console.log(`   📦 Processing: ${table}`);

      // Drop existing policies
      const policies = await client.query(`
        SELECT policyname FROM pg_policies
        WHERE tablename = $1 AND schemaname = 'public';
      `, [table]);

      for (const policy of policies.rows) {
        await client.query(`DROP POLICY IF EXISTS "${policy.policyname}" ON public.${table};`);
      }

      // Enable RLS
      await client.query(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;`);

      // Create admin policy
      await client.query(`
        CREATE POLICY "admins_full_access"
        ON public.${table}
        FOR ALL
        TO authenticated
        USING (public.is_admin())
        WITH CHECK (public.is_admin());
      `);

      // For user-specific tables, add user policies
      if (table === 'package_commission_earnings' || table === 'withdrawal_requests' || table === 'deposits') {
        await client.query(`
          CREATE POLICY "users_view_own"
          ON public.${table}
          FOR SELECT
          TO authenticated
          USING (user_id = auth.uid());
        `);
        console.log(`      ✅ Admin + User policies created`);
      } else {
        console.log(`      ✅ Admin policy created`);
      }
    }

    console.log('\n6️⃣  Creating indexes for better performance...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_package_commission_earnings_user_id
      ON public.package_commission_earnings(user_id);

      CREATE INDEX IF NOT EXISTS idx_package_commission_earnings_created_at
      ON public.package_commission_earnings(created_at);

      CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_user_id
      ON public.withdrawal_requests(user_id);

      CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status
      ON public.withdrawal_requests(status);

      CREATE INDEX IF NOT EXISTS idx_deposits_user_id
      ON public.deposits(user_id);
    `);
    console.log('   ✅ Indexes created\n');

    console.log('='.repeat(60));
    console.log('🎉 Commission Management Setup Complete!');
    console.log('='.repeat(60));
    console.log('\n📋 Summary:');
    console.log('   ✅ commission_settings table created');
    console.log('   ✅ withdrawal_requests table created');
    console.log('   ✅ deposits table created');
    console.log('   ✅ RLS policies configured for all tables');
    console.log('   ✅ Indexes created for performance');
    console.log('   ✅ Default commission settings inserted');
    console.log('\n✨ Commission Management page should now work!\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Full error:', error);
  } finally {
    await client.end();
    console.log('👋 Connection closed');
  }
}

fixCommissionManagement();
