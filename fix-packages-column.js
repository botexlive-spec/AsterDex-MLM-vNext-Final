import pg from 'pg';

const { Client } = pg;

const connectionString = 'postgresql://postgres.dsgtyrwtlpnckvcozfbc:Dubai%401234%23@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres';

async function fixPackagesTable() {
  const client = new Client({
    connectionString: connectionString,
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully!');

    // Check if column exists
    console.log('🔍 Checking if max_return_percentage column exists...');
    const checkColumn = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'packages'
        AND column_name = 'max_return_percentage';
    `);

    if (checkColumn.rows.length > 0) {
      console.log('✅ max_return_percentage column already exists!');
    } else {
      console.log('❌ max_return_percentage column is missing');
      console.log('➕ Adding max_return_percentage column...');

      await client.query(`
        ALTER TABLE public.packages
        ADD COLUMN max_return_percentage DECIMAL(5,2) NOT NULL DEFAULT 600;
      `);

      console.log('✅ max_return_percentage column added successfully!');
    }

    // Show all columns in packages table
    console.log('\n📋 Current columns in packages table:');
    const columns = await client.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'packages'
      ORDER BY ordinal_position;
    `);

    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type})`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
    console.log('\n👋 Connection closed');
  }
}

fixPackagesTable();
