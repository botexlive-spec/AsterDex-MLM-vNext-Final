import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://postgres.dsgtyrwtlpnckvcozfbc:Dubai%401234%23@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres';

async function checkReferralsSchema() {
  const client = new Client({ connectionString });
  await client.connect();

  const res = await client.query(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'referrals' AND table_schema = 'public'
    ORDER BY ordinal_position
  `);

  console.log('\n📋 referrals table columns:\n');
  res.rows.forEach(r => console.log(`  - ${r.column_name} (${r.data_type}) ${r.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`));

  await client.end();
}

checkReferralsSchema();
