import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://postgres.dsgtyrwtlpnckvcozfbc:Dubai%401234%23@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres';

async function fixUsersRLSV2() {
  const client = new Client({ connectionString });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected!\n');

    // Drop ALL existing policies on users table
    console.log('🗑️  Dropping ALL existing RLS policies on users table...');
    const dropPolicies = await client.query(`
      SELECT policyname FROM pg_policies WHERE tablename = 'users' AND schemaname = 'public';
    `);

    for (const row of dropPolicies.rows) {
      await client.query(`DROP POLICY IF EXISTS "${row.policyname}" ON public.users;`);
      console.log(`   Dropped: ${row.policyname}`);
    }
    console.log('✅ All existing policies dropped!\n');

    // Enable RLS
    console.log('🔒 Enabling Row Level Security...');
    await client.query(`ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;`);
    console.log('✅ RLS enabled!\n');

    // Create new comprehensive policies
    console.log('📝 Creating new RLS policies...\n');

    // Policy 1: Allow all authenticated users to SELECT their own data
    console.log('1️⃣  Creating: Authenticated users can view own profile...');
    await client.query(`
      CREATE POLICY "authenticated_users_select_own"
      ON public.users
      FOR SELECT
      TO authenticated
      USING (id = auth.uid());
    `);
    console.log('   ✅ Created\n');

    // Policy 2: Allow all authenticated users to UPDATE their own data
    console.log('2️⃣  Creating: Authenticated users can update own profile...');
    await client.query(`
      CREATE POLICY "authenticated_users_update_own"
      ON public.users
      FOR UPDATE
      TO authenticated
      USING (id = auth.uid())
      WITH CHECK (id = auth.uid());
    `);
    console.log('   ✅ Created\n');

    // Policy 3: Admins can SELECT all users
    console.log('3️⃣  Creating: Admins can view all users...');
    await client.query(`
      CREATE POLICY "admins_select_all"
      ON public.users
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.users u
          WHERE u.id = auth.uid()
          AND u.role IN ('admin', 'superadmin', 'ADMIN', 'SUPERADMIN')
        )
      );
    `);
    console.log('   ✅ Created\n');

    // Policy 4: Admins can INSERT users
    console.log('4️⃣  Creating: Admins can create users...');
    await client.query(`
      CREATE POLICY "admins_insert_all"
      ON public.users
      FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.users u
          WHERE u.id = auth.uid()
          AND u.role IN ('admin', 'superadmin', 'ADMIN', 'SUPERADMIN')
        )
      );
    `);
    console.log('   ✅ Created\n');

    // Policy 5: Admins can UPDATE all users
    console.log('5️⃣  Creating: Admins can update all users...');
    await client.query(`
      CREATE POLICY "admins_update_all"
      ON public.users
      FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.users u
          WHERE u.id = auth.uid()
          AND u.role IN ('admin', 'superadmin', 'ADMIN', 'SUPERADMIN')
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.users u
          WHERE u.id = auth.uid()
          AND u.role IN ('admin', 'superadmin', 'ADMIN', 'SUPERADMIN')
        )
      );
    `);
    console.log('   ✅ Created\n');

    // Policy 6: Admins can DELETE users
    console.log('6️⃣  Creating: Admins can delete users...');
    await client.query(`
      CREATE POLICY "admins_delete_all"
      ON public.users
      FOR DELETE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.users u
          WHERE u.id = auth.uid()
          AND u.role IN ('admin', 'superadmin', 'ADMIN', 'SUPERADMIN')
        )
      );
    `);
    console.log('   ✅ Created\n');

    console.log('🎉 All RLS policies created successfully!\n');
    console.log('📋 Summary:');
    console.log('   ✅ Authenticated users can view/update their own profile');
    console.log('   ✅ Admins can perform all operations on all users');
    console.log('   ✅ Role checking will now work correctly\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  } finally {
    await client.end();
    console.log('👋 Connection closed');
  }
}

fixUsersRLSV2();
