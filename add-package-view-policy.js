import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://postgres.dsgtyrwtlpnckvcozfbc:Dubai%401234%23@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres';

async function addPackageViewPolicy() {
  const client = new Client({ connectionString });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected!\n');

    console.log('📦 Adding policy for authenticated users to view packages...');

    await client.query(`
      DROP POLICY IF EXISTS "authenticated_view_packages" ON public.packages;
    `);

    await client.query(`
      CREATE POLICY "authenticated_view_packages"
      ON public.packages
      FOR SELECT
      TO authenticated
      USING (true);
    `);

    console.log('✅ Policy added successfully!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
    console.log('👋 Connection closed');
  }
}

addPackageViewPolicy();
