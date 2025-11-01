import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres.dsgtyrwtlpnckvcozfbc:Dubai%401234%23@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres'
});

await client.connect();

try {
  // Get Brian Thomas's ID
  const userQuery = await client.query(`
    SELECT id, full_name, email
    FROM users
    WHERE email LIKE '%brian.thomas%'
    ORDER BY created_at DESC
    LIMIT 1
  `);

  if (userQuery.rows.length > 0) {
    const brianId = userQuery.rows[0].id;
    console.log('=== USER INFO ===');
    console.log('ID:', brianId);
    console.log('Name:', userQuery.rows[0].full_name);
    console.log('Email:', userQuery.rows[0].email);

    // Check direct referrals
    const level1 = await client.query(`
      SELECT id, full_name, email, sponsor_id
      FROM users
      WHERE sponsor_id = $1
      ORDER BY created_at
    `, [brianId]);

    console.log('\n=== DIRECT REFERRALS (sponsor_id = this user) ===');
    console.log('Count:', level1.rows.length);
    level1.rows.forEach((row, i) => {
      console.log(`${i+1}. ${row.full_name} - ${row.email}`);
    });

    // Check Mary and John
    const teamQuery = await client.query(`
      SELECT id, full_name, email, sponsor_id
      FROM users
      WHERE full_name LIKE '%Martinez%' OR full_name LIKE '%Jackson%'
      ORDER BY full_name
    `);

    console.log('\n=== MARY & JOHN ===');
    teamQuery.rows.forEach(row => {
      console.log(`- ${row.full_name}`);
      console.log(`  Email: ${row.email}`);
      console.log(`  Sponsor ID: ${row.sponsor_id}`);
      console.log(`  Match Brian: ${row.sponsor_id === brianId ? 'YES' : 'NO'}`);
    });
  } else {
    console.log('Brian Thomas not found');
  }
} catch (error) {
  console.error('Error:', error.message);
} finally {
  await client.end();
}
