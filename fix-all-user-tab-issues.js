import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://postgres.dsgtyrwtlpnckvcozfbc:Dubai%401234%23@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres';

async function fixAllUserTabIssues() {
  const client = new Client({ connectionString });

  try {
    console.log('🔧 FIXING ALL USER TAB ISSUES\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

    await client.connect();

    // 1. Check and show current user_packages schema
    console.log('1️⃣  Checking user_packages table schema...\n');
    const pkgSchema = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'user_packages' AND table_schema = 'public'
      ORDER BY ordinal_position
    `);

    console.log('Current user_packages columns:');
    pkgSchema.rows.forEach(r => console.log(`   - ${r.column_name} (${r.data_type})`));
    console.log('');

    // 2. Create packages table if it doesn't exist
    console.log('2️⃣  Ensuring packages table exists...\n');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.packages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        amount DECIMAL(20,8) NOT NULL,
        roi_percentage DECIMAL(5,2) NOT NULL,
        roi_duration_days INTEGER NOT NULL DEFAULT 365,
        level_depth INTEGER NOT NULL DEFAULT 5,
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        min_investment DECIMAL(20,8),
        max_investment DECIMAL(20,8),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('✅ Packages table ensured\n');

    // 3. Create default packages
    console.log('3️⃣  Creating default packages...\n');
    const defaultPackages = [
      { name: 'Starter', amount: 100, roi: 1, duration: 365, depth: 5 },
      { name: 'Growth', amount: 500, roi: 5, duration: 365, depth: 15 },
      { name: 'Premium', amount: 1000, roi: 15, duration: 365, depth: 30 },
      { name: 'Gold', amount: 5000, roi: 75, duration: 365, depth: 30 },
      { name: 'Platinum', amount: 10000, roi: 150, duration: 365, depth: 30 }
    ];

    for (const pkg of defaultPackages) {
      await client.query(`
        INSERT INTO public.packages (name, amount, roi_percentage, roi_duration_days, level_depth, is_active)
        VALUES ($1, $2, $3, $4, $5, true)
        ON CONFLICT DO NOTHING
      `, [pkg.name, pkg.amount, pkg.roi, pkg.duration, pkg.depth]);
    }
    console.log('✅ Default packages created\n');

    // 4. Update user_packages to reference packages table
    console.log('4️⃣  Adding package_id to user_packages...\n');
    await client.query(`ALTER TABLE public.user_packages ADD COLUMN IF NOT EXISTS package_id UUID REFERENCES public.packages(id);`);

    // Link existing user_packages to packages based on amount
    await client.query(`
      UPDATE public.user_packages up
      SET package_id = p.id
      FROM public.packages p
      WHERE up.package_id IS NULL
        AND up.amount = p.amount
        AND up.roi_percentage = p.roi_percentage
    `);
    console.log('✅ user_packages linked to packages\n');

    // 5. Create binary_tree table if it doesn't exist
    console.log('5️⃣  Ensuring binary_tree table exists...\n');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.binary_tree (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        parent_id UUID REFERENCES public.users(id),
        left_child_id UUID REFERENCES public.users(id),
        right_child_id UUID REFERENCES public.users(id),
        position VARCHAR(10),
        level INTEGER DEFAULT 1,
        left_volume DECIMAL(20,8) DEFAULT 0,
        right_volume DECIMAL(20,8) DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id)
      );
    `);
    console.log('✅ Binary tree table ensured\n');

    // 6. Populate binary_tree from users data
    console.log('6️⃣  Populating binary tree from users...\n');
    const users = await client.query(`
      SELECT id, placement_id, position, level, left_volume, right_volume
      FROM public.users
      WHERE email LIKE '%@finaster.com'
      ORDER BY created_at
    `);

    for (const user of users.rows) {
      await client.query(`
        INSERT INTO public.binary_tree (user_id, parent_id, position, level, left_volume, right_volume)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (user_id) DO UPDATE
        SET parent_id = $2, position = $3, level = $4, left_volume = $5, right_volume = $6
      `, [
        user.id,
        user.placement_id,
        user.position,
        user.level || 1,
        user.left_volume || 0,
        user.right_volume || 0
      ]);
    }
    console.log(`✅ Populated binary tree with ${users.rowCount} users\n`);

    // 7. Update binary tree parent-child relationships
    console.log('7️⃣  Updating binary tree relationships...\n');
    await client.query(`
      UPDATE public.binary_tree bt1
      SET left_child_id = (
        SELECT bt2.user_id
        FROM public.binary_tree bt2
        WHERE bt2.parent_id = bt1.user_id AND bt2.position = 'left'
        LIMIT 1
      ),
      right_child_id = (
        SELECT bt2.user_id
        FROM public.binary_tree bt2
        WHERE bt2.parent_id = bt1.user_id AND bt2.position = 'right'
        LIMIT 1
      )
    `);
    console.log('✅ Binary tree relationships updated\n');

    // 8. Create referrals table if it doesn't exist
    console.log('8️⃣  Ensuring referrals table exists...\n');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.referrals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        referrer_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
        referee_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        status VARCHAR(20) DEFAULT 'active',
        commission_earned DECIMAL(20,8) DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(referee_id)
      );
    `);
    console.log('✅ Referrals table ensured\n');

    // 9. Populate referrals from users
    console.log('9️⃣  Populating referrals from users...\n');
    await client.query(`
      INSERT INTO public.referrals (referrer_id, referee_id, status, created_at)
      SELECT sponsor_id, id, 'active', created_at
      FROM public.users
      WHERE sponsor_id IS NOT NULL
        AND email LIKE '%@finaster.com'
        AND NOT EXISTS (
          SELECT 1 FROM public.referrals WHERE referee_id = users.id
        )
    `);
    console.log('✅ Referrals populated\n');

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ ALL USER TAB ISSUES FIXED!');
    console.log('═══════════════════════════════════════════════════════════════\n');

    console.log('📊 Summary:\n');
    console.log('   ✅ Packages table created with default packages');
    console.log('   ✅ user_packages linked to packages');
    console.log('   ✅ Binary tree table created and populated');
    console.log('   ✅ Binary tree relationships established');
    console.log('   ✅ Referrals table created and populated\n');

    console.log('🔄 Please refresh the browser to see the changes!\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await client.end();
    console.log('👋 Connection closed\n');
  }
}

fixAllUserTabIssues();
