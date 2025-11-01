import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://postgres.dsgtyrwtlpnckvcozfbc:Dubai%401234%23@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres';

async function verifySeededUsers() {
  const client = new Client({ connectionString });
  await client.connect();

  // Count users by email domain
  const finasterUsers = await client.query(`
    SELECT COUNT(*) as count FROM public.users WHERE email LIKE '%@finaster.com'
  `);

  const exampleUsers = await client.query(`
    SELECT COUNT(*) as count FROM public.users WHERE email LIKE '%@example.com'
  `);

  console.log('\n📊 USER COUNT BY DOMAIN:');
  console.log(`   @finaster.com users: ${finasterUsers.rows[0].count}`);
  console.log(`   @example.com users: ${exampleUsers.rows[0].count}`);

  // Check level distribution for finaster users
  console.log('\n📊 LEVEL DISTRIBUTION (@finaster.com):');
  const levelDist = await client.query(`
    SELECT
      CAST(
        CASE
          WHEN sponsor_id IS NULL THEN 1
          ELSE (
            SELECT COUNT(*) + 1
            FROM public.users u2
            WHERE u2.id = u1.sponsor_id
          )
        END AS INTEGER
      ) as level,
      COUNT(*) as count
    FROM public.users u1
    WHERE email LIKE '%@finaster.com'
    GROUP BY level
    ORDER BY level
  `);

  levelDist.rows.forEach(r => {
    console.log(`   Level ${r.level}: ${r.count} users`);
  });

  // Show sample finaster users
  console.log('\n📋 SAMPLE @finaster.com USERS:');
  const sampleUsers = await client.query(`
    SELECT email, full_name, current_rank, total_investment
    FROM public.users
    WHERE email LIKE '%@finaster.com'
    ORDER BY created_at
    LIMIT 10
  `);

  sampleUsers.rows.forEach(r => {
    console.log(`   - ${r.email} | ${r.full_name} | ${r.current_rank} | $${r.total_investment}`);
  });

  await client.end();
}

verifySeededUsers();
