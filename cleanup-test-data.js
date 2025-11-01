import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://postgres.dsgtyrwtlpnckvcozfbc:Dubai%401234%23@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres';

async function cleanupTestData() {
  const client = new Client({ connectionString });

  try {
    console.log('🧹 Cleaning up test data...\n');
    await client.connect();

    // Get all test user IDs first
    const testUsersQuery = await client.query(`SELECT id FROM public.users WHERE email LIKE '%@finaster.com'`);
    const testUserIds = testUsersQuery.rows.map(r => r.id);

    if (testUserIds.length === 0) {
      console.log('ℹ️  No test users found to clean up.');
      return;
    }

    console.log(`Found ${testUserIds.length} test users to clean up...\n`);

    // Delete in reverse order to respect foreign keys
    // Most tables have CASCADE, so they'll be deleted automatically
    // But we'll explicitly delete some to show progress

    console.log('Nullifying binary tree references...');
    await client.query(`UPDATE public.binary_tree SET parent_id = NULL WHERE parent_id = ANY($1)`, [testUserIds]);
    await client.query(`UPDATE public.binary_tree SET left_child_id = NULL WHERE left_child_id = ANY($1)`, [testUserIds]);
    await client.query(`UPDATE public.binary_tree SET right_child_id = NULL WHERE right_child_id = ANY($1)`, [testUserIds]);
    console.log('✅ Binary tree references nullified');

    console.log('Deleting binary tree entries...');
    const binary = await client.query(`DELETE FROM public.binary_tree WHERE user_id = ANY($1)`, [testUserIds]);
    console.log(`✅ Deleted ${binary.rowCount} binary tree entries`);

    console.log('Nullifying booster income references...');
    await client.query(`UPDATE public.booster_incomes SET direct_1_id = NULL WHERE direct_1_id = ANY($1)`, [testUserIds]);
    await client.query(`UPDATE public.booster_incomes SET direct_2_id = NULL WHERE direct_2_id = ANY($1)`, [testUserIds]);
    console.log('✅ Booster income references nullified');

    console.log('Deleting booster incomes...');
    const booster = await client.query(`DELETE FROM public.booster_incomes WHERE user_id = ANY($1)`, [testUserIds]);
    console.log(`✅ Deleted ${booster.rowCount} booster incomes`);

    console.log('Nullifying level income references...');
    await client.query(`UPDATE public.level_incomes SET from_user_id = NULL WHERE from_user_id = ANY($1)`, [testUserIds]);
    console.log('✅ Level income references nullified');

    console.log('Deleting level incomes...');
    const level = await client.query(`DELETE FROM public.level_incomes WHERE user_id = ANY($1)`, [testUserIds]);
    console.log(`✅ Deleted ${level.rowCount} level incomes`);

    console.log('Nullifying transaction references...');
    await client.query(`UPDATE public.mlm_transactions SET from_user_id = NULL WHERE from_user_id = ANY($1)`, [testUserIds]);
    console.log('✅ Transaction references nullified');

    console.log('Deleting referrals...');
    const referrals = await client.query(`DELETE FROM public.referrals WHERE referee_id = ANY($1) OR referrer_id = ANY($1)`, [testUserIds]);
    console.log(`✅ Deleted ${referrals.rowCount} referrals`);

    console.log('Temporarily dropping self-referential foreign key constraints...');
    await client.query(`ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_sponsor_id_fkey`);
    await client.query(`ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_placement_id_fkey`);
    console.log('✅ Constraints dropped');

    console.log('Deleting public users (CASCADE will handle most related records)...');
    const users = await client.query(`DELETE FROM public.users WHERE id = ANY($1)`, [testUserIds]);
    console.log(`✅ Deleted ${users.rowCount} public users`);

    console.log('Fixing orphaned references...');
    await client.query(`UPDATE public.users SET sponsor_id = NULL WHERE sponsor_id NOT IN (SELECT id FROM public.users)`);
    await client.query(`UPDATE public.users SET placement_id = NULL WHERE placement_id NOT IN (SELECT id FROM public.users)`);
    console.log('✅ Orphaned references fixed');

    console.log('Recreating self-referential foreign key constraints...');
    await client.query(`
      ALTER TABLE public.users
      ADD CONSTRAINT users_sponsor_id_fkey
      FOREIGN KEY (sponsor_id) REFERENCES public.users(id)
      ON DELETE NO ACTION
    `);
    await client.query(`
      ALTER TABLE public.users
      ADD CONSTRAINT users_placement_id_fkey
      FOREIGN KEY (placement_id) REFERENCES public.users(id)
      ON DELETE NO ACTION
    `);
    console.log('✅ Constraints recreated');

    console.log('Deleting remaining wallets...');
    const walletIds = (await client.query(`SELECT id FROM auth.users WHERE email LIKE '%@finaster.com'`)).rows.map(r => r.id);
    if (walletIds.length > 0) {
      const wallets = await client.query(`DELETE FROM public.wallets WHERE user_id = ANY($1)`, [walletIds]);
      console.log(`✅ Deleted ${wallets.rowCount} wallets`);
    }

    console.log('Deleting auth users...');
    const authUsers = await client.query(`DELETE FROM auth.users WHERE email LIKE '%@finaster.com'`);
    console.log(`✅ Deleted ${authUsers.rowCount} auth users`);

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('✅ CLEANUP COMPLETED!');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
    console.log('👋 Connection closed');
  }
}

cleanupTestData();
