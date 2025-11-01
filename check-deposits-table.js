import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://postgres.dsgtyrwtlpnckvcozfbc:Dubai%401234%23@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres';

async function checkTable() {
  const client = new Client({ connectionString });
  await client.connect();

  const res = await client.query(`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'deposits'
      AND table_schema = 'public'
    ORDER BY ordinal_position
  `);

  console.log('Deposits table columns:');
  res.rows.forEach(r => console.log('  -', r.column_name, ':', r.data_type));

  await client.end();
}

checkTable();
