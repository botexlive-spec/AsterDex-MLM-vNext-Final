import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://postgres.dsgtyrwtlpnckvcozfbc:Dubai%401234%23@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres';

async function testImpersonationUsers() {
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('🧪 Testing Different Users\' Teams\n');
    console.log('=' .repeat(80));

    // Get several users at different levels
    const testUsers = await client.query(`
      SELECT id, full_name, email, level
      FROM public.users
      WHERE email LIKE '%@finaster.com'
      ORDER BY level, created_at
      LIMIT 15
    `);

    for (const user of testUsers.rows) {
      console.log(`\n📊 User: ${user.full_name} (${user.email})`);
      console.log(`   Level: ${user.level}`);
      console.log(`   ID: ${user.id}`);

      // Get their direct team
      const team = await client.query(`
        SELECT id, full_name, email, level, total_investment
        FROM public.users
        WHERE sponsor_id = $1
        ORDER BY created_at
      `, [user.id]);

      console.log(`   Direct Team: ${team.rows.length} members`);

      if (team.rows.length > 0) {
        team.rows.forEach((member, i) => {
          console.log(`     ${i + 1}. ${member.full_name} (Level ${member.level}) - $${member.total_investment}`);
        });
      } else {
        console.log(`     (No team members)`);
      }

      // Calculate total downline (recursive would be better, but this gives an idea)
      const allDownline = await client.query(`
        WITH RECURSIVE downline AS (
          -- Start with direct team
          SELECT id, full_name, sponsor_id, level
          FROM public.users
          WHERE sponsor_id = $1

          UNION ALL

          -- Recursively get their team
          SELECT u.id, u.full_name, u.sponsor_id, u.level
          FROM public.users u
          INNER JOIN downline d ON u.sponsor_id = d.id
        )
        SELECT COUNT(*) as total_downline
        FROM downline
      `, [user.id]);

      console.log(`   Total Downline (all levels): ${allDownline.rows[0].total_downline}`);
    }

    console.log('\n\n🎯 Summary:');
    console.log('=' .repeat(80));
    console.log('If impersonation is working correctly, you should see:');
    console.log('  - Admin Root: 2 direct members (Betty Miller, John Miller)');
    console.log('  - John Miller: 3 direct members');
    console.log('  - Donald Garcia: 3 direct members');
    console.log('  - Each user should show DIFFERENT team members');
    console.log('\n If you see the same team member for ALL users, there\'s a bug in impersonation!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

testImpersonationUsers();
