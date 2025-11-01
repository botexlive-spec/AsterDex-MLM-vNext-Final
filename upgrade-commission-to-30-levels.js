import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://postgres.dsgtyrwtlpnckvcozfbc:Dubai%401234%23@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres';

async function upgradeCommissionTo30Levels() {
  const client = new Client({ connectionString });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected!\n');

    // Step 1: Add active_levels column to commission_settings
    console.log('1️⃣  Adding active_levels column...');
    await client.query(`
      ALTER TABLE public.commission_settings
      ADD COLUMN IF NOT EXISTS active_levels INTEGER DEFAULT 30;
    `);
    console.log('   ✅ Column added\n');

    // Step 2: Update commission_settings to have 30 levels
    console.log('2️⃣  Updating commission settings to 30 levels...');

    const thirtyLevels = [
      { level: 1, percentage: 10, status: 'active' },
      { level: 2, percentage: 9, status: 'active' },
      { level: 3, percentage: 8, status: 'active' },
      { level: 4, percentage: 7, status: 'active' },
      { level: 5, percentage: 6, status: 'active' },
      { level: 6, percentage: 5, status: 'active' },
      { level: 7, percentage: 4, status: 'active' },
      { level: 8, percentage: 4, status: 'active' },
      { level: 9, percentage: 3, status: 'active' },
      { level: 10, percentage: 3, status: 'active' },
      { level: 11, percentage: 3, status: 'active' },
      { level: 12, percentage: 2, status: 'active' },
      { level: 13, percentage: 2, status: 'active' },
      { level: 14, percentage: 2, status: 'active' },
      { level: 15, percentage: 2, status: 'active' },
      { level: 16, percentage: 2, status: 'active' },
      { level: 17, percentage: 1, status: 'active' },
      { level: 18, percentage: 1, status: 'active' },
      { level: 19, percentage: 1, status: 'active' },
      { level: 20, percentage: 1, status: 'active' },
      { level: 21, percentage: 1, status: 'active' },
      { level: 22, percentage: 1, status: 'active' },
      { level: 23, percentage: 1, status: 'active' },
      { level: 24, percentage: 1, status: 'active' },
      { level: 25, percentage: 1, status: 'active' },
      { level: 26, percentage: 0.5, status: 'active' },
      { level: 27, percentage: 0.5, status: 'active' },
      { level: 28, percentage: 0.5, status: 'active' },
      { level: 29, percentage: 0.5, status: 'active' },
      { level: 30, percentage: 0.5, status: 'active' },
    ];

    await client.query(`
      UPDATE public.commission_settings
      SET level_commissions = $1::jsonb,
          active_levels = 30,
          updated_at = NOW();
    `, [JSON.stringify(thirtyLevels)]);

    console.log('   ✅ Commission settings updated to 30 levels\n');

    // Step 3: Create commission_changelog table
    console.log('3️⃣  Creating commission_changelog table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.commission_changelog (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        changed_by UUID REFERENCES auth.users(id),
        change_type VARCHAR(50) NOT NULL,
        section VARCHAR(50) NOT NULL,
        old_value JSONB,
        new_value JSONB,
        description TEXT,
        affected_users INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('   ✅ Changelog table created\n');

    // Step 4: Create indexes for changelog
    console.log('4️⃣  Creating indexes...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_commission_changelog_changed_by
      ON public.commission_changelog(changed_by);

      CREATE INDEX IF NOT EXISTS idx_commission_changelog_created_at
      ON public.commission_changelog(created_at DESC);

      CREATE INDEX IF NOT EXISTS idx_commission_changelog_section
      ON public.commission_changelog(section);
    `);
    console.log('   ✅ Indexes created\n');

    // Step 5: Set up RLS for changelog
    console.log('5️⃣  Setting up RLS for changelog...');
    await client.query(`ALTER TABLE public.commission_changelog ENABLE ROW LEVEL SECURITY;`);

    await client.query(`
      CREATE POLICY "admins_full_access"
      ON public.commission_changelog
      FOR ALL
      TO authenticated
      USING (public.is_admin())
      WITH CHECK (public.is_admin());
    `);
    console.log('   ✅ RLS configured\n');

    // Step 6: Create commission_runs table for processing history
    console.log('6️⃣  Creating commission_runs table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.commission_runs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        type VARCHAR(50) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        started_at TIMESTAMPTZ DEFAULT NOW(),
        completed_at TIMESTAMPTZ,
        affected_users INTEGER DEFAULT 0,
        total_amount DECIMAL(20,8) DEFAULT 0,
        details JSONB,
        error_message TEXT,
        run_by UUID REFERENCES auth.users(id),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('   ✅ Commission runs table created\n');

    // Step 7: Set up RLS for commission_runs
    console.log('7️⃣  Setting up RLS for commission_runs...');
    await client.query(`ALTER TABLE public.commission_runs ENABLE ROW LEVEL SECURITY;`);

    await client.query(`
      CREATE POLICY "admins_full_access"
      ON public.commission_runs
      FOR ALL
      TO authenticated
      USING (public.is_admin())
      WITH CHECK (public.is_admin());
    `);
    console.log('   ✅ RLS configured\n');

    console.log('='.repeat(60));
    console.log('🎉 Commission System Upgraded to 30 Levels!');
    console.log('='.repeat(60));
    console.log('\n📋 Summary:');
    console.log('   ✅ Commission settings upgraded to 30 levels');
    console.log('   ✅ active_levels column added');
    console.log('   ✅ commission_changelog table created');
    console.log('   ✅ commission_runs table created');
    console.log('   ✅ RLS policies configured');
    console.log('   ✅ Indexes created for performance\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Full error:', error);
  } finally {
    await client.end();
    console.log('👋 Connection closed');
  }
}

upgradeCommissionTo30Levels();
