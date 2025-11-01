import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://postgres.dsgtyrwtlpnckvcozfbc:Dubai%401234%23@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres';

async function checkAuthUsers() {
  const client = new Client({ connectionString });
  await client.connect();

  const authUsers = await client.query(`SELECT id, email FROM auth.users WHERE email LIKE '%@finaster.com' LIMIT 10`);

  console.log(`\n📋 Found ${authUsers.rowCount} auth.users with @finaster.com emails:\n`);
  authUsers.rows.forEach(r => console.log(`  - ${r.email} (${r.id})`));

  if (authUsers.rowCount > 0) {
    console.log('\nDeleting these auth.users...');
    const result = await client.query(`DELETE FROM auth.users WHERE email LIKE '%@finaster.com'`);
    console.log(`✅ Deleted ${result.rowCount} auth.users`);
  }

  await client.end();
}

checkAuthUsers();
