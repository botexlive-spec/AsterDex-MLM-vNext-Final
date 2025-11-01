import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://postgres.dsgtyrwtlpnckvcozfbc:Dubai%401234%23@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres';

async function fixAllAdminRLS() {
  const client = new Client({ connectionString });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected!\n');

    // Tables that need admin-friendly RLS policies
    const tables = [
      'packages',
      'kyc_submissions',
      'user_packages',
      'package_features',
      'package_level_commissions',
      'roi_distributions',
      'package_commission_earnings',
      'package_analytics'
    ];

    for (const table of tables) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`🔧 Processing table: ${table}`);
      console.log('='.repeat(60));

      // Check if table exists
      const tableCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = $1
        );
      `, [table]);

      if (!tableCheck.rows[0].exists) {
        console.log(`⚠️  Table ${table} does not exist, skipping...`);
        continue;
      }

      // Drop ALL existing policies
      console.log(`🗑️  Dropping existing RLS policies...`);
      const dropPolicies = await client.query(`
        SELECT policyname FROM pg_policies
        WHERE tablename = $1 AND schemaname = 'public';
      `, [table]);

      for (const row of dropPolicies.rows) {
        await client.query(`DROP POLICY IF EXISTS "${row.policyname}" ON public.${table};`);
        console.log(`   Dropped: ${row.policyname}`);
      }

      // Enable RLS
      await client.query(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;`);
      console.log(`🔒 RLS enabled`);

      // Create admin-friendly policies
      console.log(`📝 Creating new policies...`);

      // Policy 1: Admins have full access
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
      console.log(`   ✅ Admins have full access`);

      // Policy 2: Users can view their own data (if table has user_id column)
      const columnCheck = await client.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = $1
        AND column_name = 'user_id';
      `, [table]);

      if (columnCheck.rows.length > 0) {
        await client.query(`
          CREATE POLICY "users_view_own"
          ON public.${table}
          FOR SELECT
          TO authenticated
          USING (user_id = auth.uid());
        `);
        console.log(`   ✅ Users can view own data`);
      }

      // Policy 3: All authenticated users can view packages (only for packages table)
      if (table === 'packages') {
        await client.query(`
          CREATE POLICY "authenticated_view_packages"
          ON public.packages
          FOR SELECT
          TO authenticated
          USING (true);
        `);
        console.log(`   ✅ All authenticated users can view packages`);
      }

      console.log(`✅ Completed: ${table}`);
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log('🎉 All RLS policies have been successfully updated!');
    console.log('='.repeat(60));
    console.log('\n📋 Summary:');
    console.log('   ✅ Admins have full access to all tables');
    console.log('   ✅ Users can view their own data where applicable');
    console.log('   ✅ All users can view active packages');
    console.log('   ✅ Package management should now work correctly\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Full error:', error);
  } finally {
    await client.end();
    console.log('👋 Connection closed');
  }
}

fixAllAdminRLS();
