import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://postgres.dsgtyrwtlpnckvcozfbc:Dubai%401234%23@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres';

async function fixFinancialTables() {
  const client = new Client({ connectionString });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected!\n');

    // Step 1: Add missing columns to deposits table
    console.log('1️⃣  Adding missing columns to deposits table...');
    await client.query(`ALTER TABLE public.deposits ADD COLUMN IF NOT EXISTS method VARCHAR(50) DEFAULT 'bank_transfer';`);
    await client.query(`ALTER TABLE public.deposits ADD COLUMN IF NOT EXISTS proof_url TEXT;`);
    await client.query(`ALTER TABLE public.deposits ADD COLUMN IF NOT EXISTS notes TEXT;`);
    await client.query(`ALTER TABLE public.deposits ADD COLUMN IF NOT EXISTS processed_by UUID REFERENCES auth.users(id);`);
    await client.query(`ALTER TABLE public.deposits ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ;`);
    await client.query(`ALTER TABLE public.deposits ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();`);
    await client.query(`ALTER TABLE public.deposits ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();`);

    // Update created_at to copy values from deposited_at where null
    await client.query(`UPDATE public.deposits SET created_at = deposited_at WHERE created_at IS NULL;`);
    console.log('   ✅ Columns added to deposits\n');

    // Step 2: Ensure withdrawal_requests table exists
    console.log('2️⃣  Ensuring withdrawal_requests table exists...');
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
    console.log('   ✅ Withdrawal_requests table ready\n');

    // Step 3: Enable RLS if not already enabled
    console.log('3️⃣  Ensuring RLS is enabled...');
    await client.query(`ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;`);
    console.log('   ✅ RLS enabled\n');

    // Step 4: Create/update RLS policies
    console.log('4️⃣  Setting up RLS policies...');

    await client.query(`DROP POLICY IF EXISTS "admins_full_access" ON public.withdrawal_requests;`);
    await client.query(`DROP POLICY IF EXISTS "users_view_own" ON public.withdrawal_requests;`);
    await client.query(`DROP POLICY IF EXISTS "users_create_own" ON public.withdrawal_requests;`);

    await client.query(`
      CREATE POLICY "admins_full_access"
      ON public.withdrawal_requests
      FOR ALL
      TO authenticated
      USING (public.is_admin())
      WITH CHECK (public.is_admin());
    `);

    await client.query(`
      CREATE POLICY "users_view_own"
      ON public.withdrawal_requests
      FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());
    `);

    await client.query(`
      CREATE POLICY "users_create_own"
      ON public.withdrawal_requests
      FOR INSERT
      TO authenticated
      WITH CHECK (user_id = auth.uid());
    `);
    console.log('   ✅ RLS policies configured\n');

    console.log('='.repeat(60));
    console.log('🎉 Financial Tables Fixed!');
    console.log('='.repeat(60));
    console.log('\n📋 Summary:');
    console.log('   ✅ deposits table updated with missing columns');
    console.log('   ✅ withdrawal_requests table ensured');
    console.log('   ✅ RLS policies configured\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Full error:', error);
  } finally {
    await client.end();
    console.log('👋 Connection closed');
  }
}

fixFinancialTables();
