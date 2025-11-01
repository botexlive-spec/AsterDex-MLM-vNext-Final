import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://postgres.dsgtyrwtlpnckvcozfbc:Dubai%401234%23@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres';

async function addUpdatedAt() {
  const client = new Client({ connectionString });

  try {
    console.log('🔌 Connecting...');
    await client.connect();
    console.log('✅ Connected!\n');

    console.log('➕ Adding updated_at column...');
    await client.query(`
      ALTER TABLE public.packages
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
    `);
    console.log('✅ updated_at column added!\n');

    console.log('🔧 Setting updated_at for existing packages...');
    await client.query(`
      UPDATE public.packages
      SET updated_at = created_at
      WHERE updated_at IS NULL;
    `);
    console.log('✅ All existing packages updated!\n');

    console.log('🎉 Done!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
    console.log('👋 Connection closed');
  }
}

addUpdatedAt();
