import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://postgres.dsgtyrwtlpnckvcozfbc:Dubai%401234%23@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres';

async function fixInfiniteRecursion() {
  const client = new Client({ connectionString });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected!\n');

    // Step 1: Create a security definer function that bypasses RLS
    console.log('1️⃣  Creating is_admin() function (security definer)...');
    await client.query(`
      CREATE OR REPLACE FUNCTION public.is_admin()
      RETURNS boolean
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public
      AS $$
      DECLARE
        user_role text;
      BEGIN
        SELECT role INTO user_role
        FROM public.users
        WHERE id = auth.uid()
        LIMIT 1;

        RETURN user_role = 'admin';
      EXCEPTION
        WHEN OTHERS THEN
          RETURN false;
      END;
      $$;
    `);
    console.log('   ✅ Function created\n');

    // Step 2: Drop ALL existing policies on users table
    console.log('2️⃣  Dropping all RLS policies on users table...');
    const userPolicies = await client.query(`
      SELECT policyname FROM pg_policies
      WHERE tablename = 'users' AND schemaname = 'public';
    `);

    for (const row of userPolicies.rows) {
      await client.query(`DROP POLICY IF EXISTS "${row.policyname}" ON public.users;`);
      console.log(`   Dropped: ${row.policyname}`);
    }
    console.log('');

    // Step 3: Create simple, non-recursive policies for users table
    console.log('3️⃣  Creating non-recursive RLS policies for users...\n');

    console.log('   → Users can view own profile...');
    await client.query(`
      CREATE POLICY "users_select_own"
      ON public.users
      FOR SELECT
      TO authenticated
      USING (id = auth.uid());
    `);
    console.log('   ✅ Created\n');

    console.log('   → Users can update own profile...');
    await client.query(`
      CREATE POLICY "users_update_own"
      ON public.users
      FOR UPDATE
      TO authenticated
      USING (id = auth.uid())
      WITH CHECK (id = auth.uid());
    `);
    console.log('   ✅ Created\n');

    console.log('   → Admins can view all users...');
    await client.query(`
      CREATE POLICY "admins_select_all"
      ON public.users
      FOR SELECT
      TO authenticated
      USING (public.is_admin());
    `);
    console.log('   ✅ Created\n');

    console.log('   → Admins can insert users...');
    await client.query(`
      CREATE POLICY "admins_insert_all"
      ON public.users
      FOR INSERT
      TO authenticated
      WITH CHECK (public.is_admin());
    `);
    console.log('   ✅ Created\n');

    console.log('   → Admins can update all users...');
    await client.query(`
      CREATE POLICY "admins_update_all"
      ON public.users
      FOR UPDATE
      TO authenticated
      USING (public.is_admin())
      WITH CHECK (public.is_admin());
    `);
    console.log('   ✅ Created\n');

    console.log('   → Admins can delete users...');
    await client.query(`
      CREATE POLICY "admins_delete_all"
      ON public.users
      FOR DELETE
      TO authenticated
      USING (public.is_admin());
    `);
    console.log('   ✅ Created\n');

    // Step 4: Update other table policies to use the function
    const tables = ['packages', 'user_packages', 'package_features', 'package_level_commissions',
                    'roi_distributions', 'package_commission_earnings', 'package_analytics', 'kyc_documents'];

    console.log('4️⃣  Updating RLS policies for other tables...\n');

    for (const table of tables) {
      // Check if table exists
      const tableCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = $1
        );
      `, [table]);

      if (!tableCheck.rows[0].exists) {
        console.log(`   ⚠️  Skipping ${table} (doesn't exist)`);
        continue;
      }

      console.log(`   📦 Updating: ${table}`);

      // Drop existing admin policies
      await client.query(`DROP POLICY IF EXISTS "admins_full_access" ON public.${table};`);

      // Create new policy using the function
      await client.query(`
        CREATE POLICY "admins_full_access"
        ON public.${table}
        FOR ALL
        TO authenticated
        USING (public.is_admin())
        WITH CHECK (public.is_admin());
      `);
      console.log(`      ✅ Updated`);
    }

    console.log('\n🎉 All policies fixed! No more infinite recursion!\n');
    console.log('📋 Summary:');
    console.log('   ✅ Created is_admin() function with SECURITY DEFINER');
    console.log('   ✅ Function bypasses RLS to check role');
    console.log('   ✅ All policies now use the function');
    console.log('   ✅ No more circular dependencies\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Full error:', error);
  } finally {
    await client.end();
    console.log('👋 Connection closed');
  }
}

fixInfiniteRecursion();
