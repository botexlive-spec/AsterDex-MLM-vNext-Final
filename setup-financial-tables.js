import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://postgres.dsgtyrwtlpnckvcozfbc:Dubai%401234%23@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres';

async function setupFinancialTables() {
  const client = new Client({ connectionString });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected!\n');

    // Step 1: Create deposits table
    console.log('1️⃣  Creating deposits table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.deposits (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES auth.users(id),
        amount DECIMAL(20,8) NOT NULL,
        method VARCHAR(50) NOT NULL DEFAULT 'bank_transfer',
        proof_url TEXT,
        status VARCHAR(20) DEFAULT 'pending',
        notes TEXT,
        processed_by UUID REFERENCES auth.users(id),
        processed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('   ✅ Deposits table created\n');

    // Step 2: Create withdrawal_requests table
    console.log('2️⃣  Creating withdrawal_requests table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES auth.users(id),
        amount DECIMAL(20,8) NOT NULL,
        method VARCHAR(50) NOT NULL DEFAULT 'bank_transfer',
        bank_details JSONB,
        wallet_address TEXT,
        status VARCHAR(20) DEFAULT 'pending',
        processed_by UUID REFERENCES auth.users(id),
        processed_at TIMESTAMPTZ,
        rejection_reason TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('   ✅ Withdrawal_requests table created\n');

    // Step 3: Create indexes
    console.log('3️⃣  Creating indexes...');
    await client.query(`CREATE INDEX IF NOT EXISTS idx_deposits_user_id ON public.deposits(user_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_deposits_status ON public.deposits(status);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_deposits_created_at ON public.deposits(created_at);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_user_id ON public.withdrawal_requests(user_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status ON public.withdrawal_requests(status);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_created_at ON public.withdrawal_requests(created_at);`);
    console.log('   ✅ Indexes created\n');

    // Step 4: Enable RLS
    console.log('4️⃣  Enabling RLS...');
    await client.query(`
      ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
    `);
    console.log('   ✅ RLS enabled\n');

    // Step 5: Create RLS policies for deposits
    console.log('5️⃣  Creating RLS policies for deposits...');

    // Drop existing policies if any
    await client.query(`
      DROP POLICY IF EXISTS "admins_full_access" ON public.deposits;
      DROP POLICY IF EXISTS "users_view_own" ON public.deposits;
    `);

    await client.query(`
      CREATE POLICY "admins_full_access"
      ON public.deposits
      FOR ALL
      TO authenticated
      USING (public.is_admin())
      WITH CHECK (public.is_admin());

      CREATE POLICY "users_view_own"
      ON public.deposits
      FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());
    `);
    console.log('   ✅ Deposits RLS policies created\n');

    // Step 6: Create RLS policies for withdrawal_requests
    console.log('6️⃣  Creating RLS policies for withdrawal_requests...');

    // Drop existing policies if any
    await client.query(`
      DROP POLICY IF EXISTS "admins_full_access" ON public.withdrawal_requests;
      DROP POLICY IF EXISTS "users_view_own" ON public.withdrawal_requests;
      DROP POLICY IF EXISTS "users_create_own" ON public.withdrawal_requests;
    `);

    await client.query(`
      CREATE POLICY "admins_full_access"
      ON public.withdrawal_requests
      FOR ALL
      TO authenticated
      USING (public.is_admin())
      WITH CHECK (public.is_admin());

      CREATE POLICY "users_view_own"
      ON public.withdrawal_requests
      FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());

      CREATE POLICY "users_create_own"
      ON public.withdrawal_requests
      FOR INSERT
      TO authenticated
      WITH CHECK (user_id = auth.uid());
    `);
    console.log('   ✅ Withdrawal_requests RLS policies created\n');

    console.log('='.repeat(60));
    console.log('🎉 Financial Tables Setup Complete!');
    console.log('='.repeat(60));
    console.log('\n📋 Summary:');
    console.log('   ✅ deposits table created');
    console.log('   ✅ withdrawal_requests table created');
    console.log('   ✅ Indexes created for performance');
    console.log('   ✅ RLS policies configured');
    console.log('   ✅ User access policies set\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Full error:', error);
  } finally {
    await client.end();
    console.log('👋 Connection closed');
  }
}

setupFinancialTables();
