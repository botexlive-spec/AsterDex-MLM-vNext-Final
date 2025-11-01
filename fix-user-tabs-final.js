import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://postgres.dsgtyrwtlpnckvcozfbc:Dubai%401234%23@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres';

async function fixUserTabsFinal() {
  const client = new Client({ connectionString });

  try {
    console.log('🔧 FIXING USER TAB FUNCTIONALITY\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

    await client.connect();

    // 1. Link user_packages to packages
    console.log('1️⃣  Linking user_packages to packages table...\n');

    // Update package_id based on amount matching price
    const linkResult = await client.query(`
      UPDATE public.user_packages up
      SET package_id = p.id
      FROM public.packages p
      WHERE up.package_id IS NULL
        AND up.amount >= p.min_investment
        AND up.amount <= p.max_investment
        AND NOT EXISTS (
          SELECT 1 FROM public.packages p2
          WHERE up.amount >= p2.min_investment
            AND up.amount <= p2.max_investment
            AND p2.min_investment > p.min_investment
        )
    `);
    console.log(`✅ Linked ${linkResult.rowCount} user_packages to packages\n`);

    // 2. Create binary_tree table if doesn't exist
    console.log('2️⃣  Setting up binary_tree table...\n');
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
    console.log('✅ Binary tree table ready\n');

    // 3. Populate binary_tree from users
    console.log('3️⃣  Populating binary tree...\n');
    const users = await client.query(`
      SELECT id, placement_id, position, level, left_volume, right_volume, created_at
      FROM public.users
      WHERE email LIKE '%@finaster.com'
      ORDER BY created_at
    `);

    let treeCount = 0;
    for (const user of users.rows) {
      await client.query(`
        INSERT INTO public.binary_tree (user_id, parent_id, position, level, left_volume, right_volume, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (user_id) DO UPDATE
        SET parent_id = $2, position = $3, level = $4, left_volume = $5, right_volume = $6
      `, [
        user.id,
        user.placement_id,
        user.position,
        user.level || 1,
        user.left_volume || 0,
        user.right_volume || 0,
        user.created_at
      ]);
      treeCount++;
    }
    console.log(`✅ Populated ${treeCount} users in binary tree\n`);

    // 4. Update binary tree child relationships
    console.log('4️⃣  Updating binary tree child relationships...\n');
    await client.query(`
      UPDATE public.binary_tree bt1
      SET
        left_child_id = (
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
    console.log('✅ Child relationships updated\n');

    // 5. Enable RLS on binary_tree
    console.log('5️⃣  Setting up RLS on binary_tree...\n');
    await client.query(`ALTER TABLE public.binary_tree ENABLE ROW LEVEL SECURITY;`);

    // Drop existing policies
    await client.query(`DROP POLICY IF EXISTS "admins_all_binary_tree" ON public.binary_tree;`);
    await client.query(`DROP POLICY IF EXISTS "users_view_own_binary_tree" ON public.binary_tree;`);

    // Create policies
    await client.query(`
      CREATE POLICY "admins_all_binary_tree"
      ON public.binary_tree
      FOR ALL
      TO authenticated
      USING (public.is_admin())
      WITH CHECK (public.is_admin());
    `);

    await client.query(`
      CREATE POLICY "users_view_own_binary_tree"
      ON public.binary_tree
      FOR SELECT
      TO authenticated
      USING (user_id = auth.uid() OR public.is_admin());
    `);
    console.log('✅ RLS configured on binary_tree\n');

    // 6. Ensure referrals table exists and is populated
    console.log('6️⃣  Setting up referrals...\n');

    // Populate referrals from sponsor relationships
    // The referral_code is required, so we'll generate one
    const usersToRefer = await client.query(`
      SELECT u.id, u.sponsor_id, u.created_at
      FROM public.users u
      WHERE u.sponsor_id IS NOT NULL
        AND u.email LIKE '%@finaster.com'
        AND NOT EXISTS (
          SELECT 1 FROM public.referrals WHERE referee_id = u.id
        )
    `);

    let refCount = 0;
    for (const user of usersToRefer.rows) {
      // Generate a unique referral code
      const code = `REF${user.id.substring(0, 8).toUpperCase()}`;

      await client.query(`
        INSERT INTO public.referrals (referrer_id, referee_id, referral_code, status, commission_earned, created_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT DO NOTHING
      `, [
        user.sponsor_id,
        user.id,
        code,
        'active',
        0,
        user.created_at
      ]);
      refCount++;
    }
    console.log(`✅ Created ${refCount} referral records\n`);

    // 7. RLS on referrals
    await client.query(`ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;`);
    await client.query(`DROP POLICY IF EXISTS "admins_all_referrals" ON public.referrals;`);
    await client.query(`DROP POLICY IF EXISTS "users_view_own_referrals" ON public.referrals;`);

    await client.query(`
      CREATE POLICY "admins_all_referrals"
      ON public.referrals
      FOR ALL
      TO authenticated
      USING (public.is_admin())
      WITH CHECK (public.is_admin());
    `);

    await client.query(`
      CREATE POLICY "users_view_own_referrals"
      ON public.referrals
      FOR SELECT
      TO authenticated
      USING (referrer_id = auth.uid() OR referee_id = auth.uid() OR public.is_admin());
    `);
    console.log('✅ RLS configured on referrals\n');

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ ALL USER TAB ISSUES FIXED!');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Summary
    console.log('📊 Summary:\n');
    const summary = await client.query(`
      SELECT
        (SELECT COUNT(*) FROM public.users WHERE email LIKE '%@finaster.com') as users,
        (SELECT COUNT(*) FROM public.user_packages WHERE package_id IS NOT NULL) as linked_packages,
        (SELECT COUNT(*) FROM public.binary_tree) as binary_tree_nodes,
        (SELECT COUNT(*) FROM public.referrals) as referrals
    `);

    const s = summary.rows[0];
    console.log(`   👥 Users: ${s.users}`);
    console.log(`   📦 Linked Packages: ${s.linked_packages}`);
    console.log(`   🌳 Binary Tree Nodes: ${s.binary_tree_nodes}`);
    console.log(`   🤝 Referrals: ${s.referrals}\n`);

    console.log('🔄 Please refresh your browser to see the changes!\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await client.end();
    console.log('👋 Connection closed\n');
  }
}

fixUserTabsFinal();
