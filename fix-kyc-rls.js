import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://postgres.dsgtyrwtlpnckvcozfbc:Dubai%401234%23@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres';

async function fixKYCRLS() {
  const client = new Client({ connectionString });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected!\n');

    const table = 'kyc_documents';
    console.log(`🔧 Processing table: ${table}\n`);

    // Drop ALL existing policies
    console.log('🗑️  Dropping existing RLS policies...');
    const dropPolicies = await client.query(`
      SELECT policyname FROM pg_policies
      WHERE tablename = $1 AND schemaname = 'public';
    `, [table]);

    for (const row of dropPolicies.rows) {
      await client.query(`DROP POLICY IF EXISTS "${row.policyname}" ON public.${table};`);
      console.log(`   Dropped: ${row.policyname}`);
    }
    console.log('');

    // Enable RLS
    await client.query(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;`);
    console.log('🔒 RLS enabled\n');

    // Create policies
    console.log('📝 Creating new policies...\n');

    // Policy 1: Admins have full access
    console.log('1️⃣  Creating: Admins have full access...');
    await client.query(`
      CREATE POLICY "admins_full_access"
      ON public.${table}
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.users u
          WHERE u.id = auth.uid()
          AND u.role = 'admin'
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.users u
          WHERE u.id = auth.uid()
          AND u.role = 'admin'
        )
      );
    `);
    console.log('   ✅ Created\n');

    // Policy 2: Users can view their own KYC documents
    console.log('2️⃣  Creating: Users can view own KYC documents...');
    await client.query(`
      CREATE POLICY "users_view_own"
      ON public.${table}
      FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());
    `);
    console.log('   ✅ Created\n');

    // Policy 3: Users can insert their own KYC documents
    console.log('3️⃣  Creating: Users can upload own KYC documents...');
    await client.query(`
      CREATE POLICY "users_insert_own"
      ON public.${table}
      FOR INSERT
      TO authenticated
      WITH CHECK (user_id = auth.uid());
    `);
    console.log('   ✅ Created\n');

    // Policy 4: Users can update their own KYC documents
    console.log('4️⃣  Creating: Users can update own KYC documents...');
    await client.query(`
      CREATE POLICY "users_update_own"
      ON public.${table}
      FOR UPDATE
      TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
    `);
    console.log('   ✅ Created\n');

    console.log('🎉 KYC RLS policies created successfully!\n');
    console.log('📋 Summary:');
    console.log('   ✅ Admins have full access to all KYC documents');
    console.log('   ✅ Users can manage their own KYC documents');
    console.log('   ✅ KYC management should now work correctly\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  } finally {
    await client.end();
    console.log('👋 Connection closed');
  }
}

fixKYCRLS();
