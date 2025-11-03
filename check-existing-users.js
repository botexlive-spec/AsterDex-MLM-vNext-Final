import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://postgres.dsgtyrwtlpnckvcozfbc:Dubai%401234%23@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres';

async function checkUsers() {
  const client = new Client({ connectionString });
  try {
    await client.connect();

    // Check users table
    const result = await client.query(`
      SELECT id, email, full_name, role
      FROM users
      ORDER BY created_at DESC
      LIMIT 10
    `);

    console.log(`Found ${result.rowCount} users in database:`);
    console.log('');
    result.rows.forEach(r => {
      console.log(`Name: ${r.full_name || 'No Name'}`);
      console.log(`Email: ${r.email}`);
      console.log(`ID: ${r.id}`);
      console.log(`Role: ${r.role}`);
      console.log('---');
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

checkUsers();
