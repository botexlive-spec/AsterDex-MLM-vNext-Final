import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://postgres.dsgtyrwtlpnckvcozfbc:Dubai%401234%23@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres';

async function checkSchema() {
  const client = new Client({ connectionString });
  await client.connect();

  // Check users table structure
  const users = await client.query(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'users' AND table_schema = 'public'
    ORDER BY ordinal_position
  `);

  console.log('\n📋 public.users table columns:');
  users.rows.forEach(r => console.log(`   - ${r.column_name} (${r.data_type}) ${r.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`));

  // Check user_packages table structure
  const packages = await client.query(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'user_packages' AND table_schema = 'public'
    ORDER BY ordinal_position
  `);

  console.log('\n📦 public.user_packages table columns:');
  packages.rows.forEach(r => console.log(`   - ${r.column_name} (${r.data_type}) ${r.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`));

  // Check mlm_transactions table structure
  const transactions = await client.query(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'mlm_transactions' AND table_schema = 'public'
    ORDER BY ordinal_position
  `);

  console.log('\n💰 public.mlm_transactions table columns:');
  transactions.rows.forEach(r => console.log(`   - ${r.column_name} (${r.data_type}) ${r.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`));

  await client.end();
}

checkSchema();
