import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://postgres.dsgtyrwtlpnckvcozfbc:Dubai%401234%23@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres';

async function checkEnums() {
  const client = new Client({ connectionString });
  await client.connect();

  // Check all enum types
  const enums = await client.query(`
    SELECT
      t.typname as enum_name,
      e.enumlabel as enum_value
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
    ORDER BY t.typname, e.enumsortorder;
  `);

  console.log('\n📋 Enum types in database:\n');
  const enumsByType = {};
  enums.rows.forEach(r => {
    if (!enumsByType[r.enum_name]) {
      enumsByType[r.enum_name] = [];
    }
    enumsByType[r.enum_name].push(r.enum_value);
  });

  Object.keys(enumsByType).forEach(enumName => {
    console.log(`${enumName}:`);
    console.log(`  Values: ${enumsByType[enumName].join(', ')}\n`);
  });

  // Check users table columns with enum types
  const columns = await client.query(`
    SELECT
      column_name,
      udt_name,
      data_type
    FROM information_schema.columns
    WHERE table_name = 'users'
      AND table_schema = 'public'
      AND data_type = 'USER-DEFINED'
    ORDER BY column_name;
  `);

  console.log('📋 Enum columns in users table:\n');
  columns.rows.forEach(r => {
    console.log(`  ${r.column_name}: ${r.udt_name}`);
  });

  await client.end();
}

checkEnums();
