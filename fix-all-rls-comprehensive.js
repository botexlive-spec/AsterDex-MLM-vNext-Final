import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://postgres.dsgtyrwtlpnckvcozfbc:Dubai%401234%23@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres';

async function fixAllRLS() {
  const client = new Client({ connectionString });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected!\n');

    // Get all tables
    const allTables = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    console.log(`📋 Found ${allTables.rows.length} tables to process\n`);

    let processed = 0;
    let skipped = 0;

    for (const row of allTables.rows) {
      const table = row.table_name;

      // Skip auth and internal tables
      if (table.startsWith('_') || table === 'schema_migrations') {
        skipped++;
        continue;
      }

      console.log(`📦 Processing: ${table}`);

      // Check if table has user_id column
      const hasUserIdResult = await client.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = $1
        AND column_name = 'user_id';
      `, [table]);

      const hasUserId = hasUserIdResult.rows.length > 0;

      // Drop all existing policies
      const policies = await client.query(`
        SELECT policyname FROM pg_policies
        WHERE tablename = $1 AND schemaname = 'public';
      `, [table]);

      for (const policy of policies.rows) {
        await client.query(`DROP POLICY IF EXISTS "${policy.policyname}" ON public.${table};`);
      }

      // Enable RLS
      await client.query(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;`);

      // Create admin full access policy
      await client.query(`
        CREATE POLICY "admins_full_access"
        ON public.${table}
        FOR ALL
        TO authenticated
        USING (public.is_admin())
        WITH CHECK (public.is_admin());
      `);

      // If table has user_id, create user-specific policies
      if (hasUserId) {
        // Users can view their own records
        await client.query(`
          CREATE POLICY "users_view_own"
          ON public.${table}
          FOR SELECT
          TO authenticated
          USING (user_id = auth.uid());
        `);

        // For certain tables, allow users to insert/update their own records
        const userWritableTables = [
          'kyc_documents',
          'withdrawal_requests',
          'deposits',
          'user_packages',
          'robot_subscriptions',
          'referral_codes'
        ];

        if (userWritableTables.includes(table)) {
          await client.query(`
            CREATE POLICY "users_insert_own"
            ON public.${table}
            FOR INSERT
            TO authenticated
            WITH CHECK (user_id = auth.uid());
          `);

          await client.query(`
            CREATE POLICY "users_update_own"
            ON public.${table}
            FOR UPDATE
            TO authenticated
            USING (user_id = auth.uid())
            WITH CHECK (user_id = auth.uid());
          `);
        }

        console.log(`   ✅ Admin + User policies (user_id column found)`);
      } else {
        console.log(`   ✅ Admin policy only`);
      }

      processed++;
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 RLS Setup Complete for All Tables!');
    console.log('='.repeat(60));
    console.log(`\n📊 Stats:`);
    console.log(`   ✅ Processed: ${processed} tables`);
    console.log(`   ⏭️  Skipped: ${skipped} tables`);
    console.log(`\n✨ All admin pages should now work correctly!\n`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Full error:', error);
  } finally {
    await client.end();
    console.log('👋 Connection closed');
  }
}

fixAllRLS();
