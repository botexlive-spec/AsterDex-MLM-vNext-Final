import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://postgres.dsgtyrwtlpnckvcozfbc:Dubai%401234%23@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres';

async function addPriceColumn() {
  const client = new Client({ connectionString });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected!\n');

    // Add price column
    console.log('💰 Adding price column to packages table...');
    await client.query(`
      ALTER TABLE public.packages
      ADD COLUMN IF NOT EXISTS price DECIMAL(10,2) DEFAULT 0;
    `);
    console.log('✅ Price column added!\n');

    // Add direct_commission_percentage column
    console.log('📊 Adding direct_commission_percentage column...');
    await client.query(`
      ALTER TABLE public.packages
      ADD COLUMN IF NOT EXISTS direct_commission_percentage DECIMAL(5,2) DEFAULT 10.0;
    `);
    console.log('✅ Direct commission column added!\n');

    // Update existing packages to have price equal to min_investment
    console.log('🔄 Updating existing packages...');
    await client.query(`
      UPDATE public.packages
      SET price = min_investment
      WHERE price IS NULL OR price = 0;
    `);
    console.log('✅ Existing packages updated!\n');

    console.log('🎉 All columns added successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
    console.log('👋 Connection closed');
  }
}

addPriceColumn();
