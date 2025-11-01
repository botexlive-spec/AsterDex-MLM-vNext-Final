import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://postgres.dsgtyrwtlpnckvcozfbc:Dubai%401234%23@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres';

async function checkSponsorRelationships() {
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('🔍 Checking sponsor relationships in database...\n');

    // Check sample users from different levels
    const sampleUsers = await client.query(`
      SELECT id, full_name, email, level, sponsor_id
      FROM public.users
      WHERE email LIKE '%@finaster.com'
      ORDER BY level, created_at
      LIMIT 10
    `);

    console.log('📊 Sample Users and Their Sponsors:');
    console.log('=' .repeat(80));
    for (const user of sampleUsers.rows) {
      console.log(`\nUser: ${user.full_name} (${user.email})`);
      console.log(`  ID: ${user.id}`);
      console.log(`  Level: ${user.level}`);
      console.log(`  Sponsor ID: ${user.sponsor_id || 'NULL'}`);

      // Get their direct team members
      const teamMembers = await client.query(`
        SELECT id, full_name, email, level
        FROM public.users
        WHERE sponsor_id = $1
        ORDER BY created_at
      `, [user.id]);

      console.log(`  Direct Team Members: ${teamMembers.rows.length}`);
      if (teamMembers.rows.length > 0) {
        teamMembers.rows.forEach((member, i) => {
          console.log(`    ${i + 1}. ${member.full_name} (Level ${member.level})`);
        });
      }
    }

    // Check total sponsor relationships
    console.log('\n\n📈 Summary Statistics:');
    console.log('=' .repeat(80));

    const totalUsers = await client.query(`SELECT COUNT(*) FROM public.users WHERE email LIKE '%@finaster.com'`);
    console.log(`Total users: ${totalUsers.rows[0].count}`);

    const usersWithSponsors = await client.query(`SELECT COUNT(*) FROM public.users WHERE sponsor_id IS NOT NULL AND email LIKE '%@finaster.com'`);
    console.log(`Users with sponsors: ${usersWithSponsors.rows[0].count}`);

    const usersWithTeam = await client.query(`
      SELECT COUNT(DISTINCT sponsor_id)
      FROM public.users
      WHERE sponsor_id IS NOT NULL AND email LIKE '%@finaster.com'
    `);
    console.log(`Users who have team members: ${usersWithTeam.rows[0].count}`);

    // Check if Kenneth Sanchez is showing up for multiple sponsors
    console.log('\n\n🔍 Checking Kenneth Sanchez:');
    console.log('=' .repeat(80));
    const kenneth = await client.query(`
      SELECT id, full_name, email, sponsor_id
      FROM public.users
      WHERE full_name LIKE '%Kenneth%Sanchez%'
    `);

    if (kenneth.rows.length > 0) {
      const kennethData = kenneth.rows[0];
      console.log(`Kenneth Sanchez ID: ${kennethData.id}`);
      console.log(`Kenneth's Email: ${kennethData.email}`);
      console.log(`Kenneth's Sponsor ID: ${kennethData.sponsor_id}`);

      // Find Kenneth's sponsor
      if (kennethData.sponsor_id) {
        const sponsor = await client.query(`
          SELECT id, full_name, email
          FROM public.users
          WHERE id = $1
        `, [kennethData.sponsor_id]);

        if (sponsor.rows.length > 0) {
          console.log(`Kenneth's Sponsor: ${sponsor.rows[0].full_name} (${sponsor.rows[0].email})`);
        }
      }
    }

    // Check a specific impersonated user to see their team
    console.log('\n\n🔍 Checking Admin Root team:');
    console.log('=' .repeat(80));
    const admin = await client.query(`
      SELECT id, full_name, email
      FROM public.users
      WHERE email = 'admin@finaster.com'
    `);

    if (admin.rows.length > 0) {
      const adminId = admin.rows[0].id;
      console.log(`Admin ID: ${adminId}`);

      const adminTeam = await client.query(`
        SELECT id, full_name, email, level, total_investment
        FROM public.users
        WHERE sponsor_id = $1
        ORDER BY created_at
      `, [adminId]);

      console.log(`Admin's Direct Team: ${adminTeam.rows.length} members`);
      adminTeam.rows.forEach((member, i) => {
        console.log(`  ${i + 1}. ${member.full_name} - ${member.email} - Level ${member.level} - $${member.total_investment}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await client.end();
  }
}

checkSponsorRelationships();
