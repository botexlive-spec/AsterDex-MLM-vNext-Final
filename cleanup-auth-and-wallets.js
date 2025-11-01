import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://postgres.dsgtyrwtlpnckvcozfbc:Dubai%401234%23@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres';

async function cleanupAuthAndWallets() {
  const client = new Client({ connectionString });
  await client.connect();

  try {
    // Get auth user IDs for test users
    const authUsers = await client.query(`SELECT id FROM auth.users WHERE email LIKE '%@finaster.com'`);
    console.log(`Found ${authUsers.rowCount} auth.users to clean up`);

    if (authUsers.rowCount > 0) {
      const userIds = authUsers.rows.map(r => r.id);

      // Delete wallets first
      const wallets = await client.query(`DELETE FROM public.wallets WHERE user_id = ANY($1)`, [userIds]);
      console.log(`✅ Deleted ${wallets.rowCount} wallets`);

      // Delete auth.users
      const deleted = await client.query(`DELETE FROM auth.users WHERE id = ANY($1)`, [userIds]);
      console.log(`✅ Deleted ${deleted.rowCount} auth.users`);
    }

    console.log('\n✅ Cleanup complete!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

cleanupAuthAndWallets();
