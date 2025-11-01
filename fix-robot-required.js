import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://postgres.dsgtyrwtlpnckvcozfbc:Dubai%401234%23@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres';

async function fixRobotRequired() {
  const client = new Client({ connectionString });

  try {
    console.log('🔌 Connecting...');
    await client.connect();
    console.log('✅ Connected!\n');

    console.log('🔧 Updating existing packages to set robot_required = false...');
    await client.query(`
      UPDATE public.packages
      SET robot_required = false
      WHERE robot_required IS NULL;
    `);
    console.log('✅ All packages updated!\n');

    console.log('✅ Done!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

fixRobotRequired();
