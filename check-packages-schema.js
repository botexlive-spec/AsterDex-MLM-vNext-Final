import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://postgres.dsgtyrwtlpnckvcozfbc:Dubai%401234%23@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres';

async function checkPackagesSchema() {
  const client = new Client({ connectionString });
  await client.connect();

  const schema = await client.query(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'packages' AND table_schema = 'public'
    ORDER BY ordinal_position
  `);

  console.log('\n📋 packages table columns:\n');
  schema.rows.forEach(r => console.log(`  - ${r.column_name} (${r.data_type}) ${r.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`));

  // Check if there are any existing packages
  const count = await client.query(`SELECT COUNT(*) as count FROM public.packages`);
  console.log(`\n📊 Existing packages: ${count.rows[0].count}\n`);

  if (count.rows[0].count > 0) {
    const packages = await client.query(`SELECT * FROM public.packages LIMIT 5`);
    console.log('Sample packages:');
    packages.rows.forEach(p => {
      console.log(`  - ${JSON.stringify(p)}`);
    });
  }

  await client.end();
}

checkPackagesSchema();
