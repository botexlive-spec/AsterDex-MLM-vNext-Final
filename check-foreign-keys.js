import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://postgres.dsgtyrwtlpnckvcozfbc:Dubai%401234%23@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres';

async function checkForeignKeys() {
  const client = new Client({ connectionString });
  await client.connect();

  // Check all foreign keys referencing users table
  const fkeys = await client.query(`
    SELECT
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name,
      rc.delete_rule,
      tc.constraint_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    JOIN information_schema.referential_constraints AS rc
      ON rc.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND ccu.table_name = 'users'
      AND tc.table_schema = 'public'
    ORDER BY tc.table_name, kcu.column_name;
  `);

  console.log('\n📋 Foreign keys referencing users table:\n');
  fkeys.rows.forEach(r => {
    console.log(`${r.table_name}.${r.column_name} -> ${r.foreign_table_name}.${r.foreign_column_name}`);
    console.log(`  Constraint: ${r.constraint_name}`);
    console.log(`  ON DELETE: ${r.delete_rule}\n`);
  });

  await client.end();
}

checkForeignKeys();
