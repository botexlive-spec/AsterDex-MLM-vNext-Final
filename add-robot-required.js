import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://postgres.dsgtyrwtlpnckvcozfbc:Dubai%401234%23@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres';

async function addRobotRequired() {
  const client = new Client({ connectionString });

  try {
    console.log('🔌 Connecting...');
    await client.connect();
    console.log('✅ Connected!\n');

    console.log('➕ Adding robot_required column...');
    await client.query(`
      ALTER TABLE public.packages
      ADD COLUMN IF NOT EXISTS robot_required BOOLEAN DEFAULT false;
    `);
    console.log('✅ Column added!\n');

    console.log('🔧 Setting robot_required = false for existing packages...');
    await client.query(`
      UPDATE public.packages
      SET robot_required = false
      WHERE robot_required IS NULL;
    `);
    console.log('✅ All packages updated!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
    console.log('👋 Done!');
  }
}

addRobotRequired();
