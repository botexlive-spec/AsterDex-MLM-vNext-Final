import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://postgres.dsgtyrwtlpnckvcozfbc:Dubai%401234%23@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres';

async function checkUserTeam() {
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('🔍 Checking user team data...\n');

    // Find Lisa Anderson
    const lisa = await client.query(`
      SELECT id, full_name, email
      FROM public.users
      WHERE email LIKE '%lisa%'
      LIMIT 1
    `);

    if (lisa.rows.length === 0) {
      console.log('❌ Lisa Anderson not found');
      return;
    }

    const lisaId = lisa.rows[0].id;
    console.log(`✅ Found user: ${lisa.rows[0].full_name} (${lisa.rows[0].email})`);
    console.log(`   User ID: ${lisaId}\n`);

    // Check team members (direct referrals)
    const directTeam = await client.query(`
      SELECT id, full_name, email, total_investment, created_at
      FROM public.users
      WHERE sponsor_id = $1
      ORDER BY created_at DESC
    `, [lisaId]);

    console.log(`📊 Direct Team Members: ${directTeam.rows.length}`);
    if (directTeam.rows.length > 0) {
      directTeam.rows.forEach((member, i) => {
        console.log(`   ${i + 1}. ${member.full_name} - ${member.email} - $${member.total_investment || 0}`);
      });
    } else {
      console.log('   No direct team members found\n');
    }

    // Check referrals
    const referrals = await client.query(`
      SELECT r.*, u.full_name, u.email
      FROM public.referrals r
      JOIN public.users u ON u.id = r.referee_id
      WHERE r.referrer_id = $1
      ORDER BY r.created_at DESC
    `, [lisaId]);

    console.log(`\n👥 Referrals: ${referrals.rows.length}`);
    if (referrals.rows.length > 0) {
      referrals.rows.forEach((ref, i) => {
        console.log(`   ${i + 1}. ${ref.full_name} - ${ref.email} - Status: ${ref.status}`);
      });
    } else {
      console.log('   No referrals found\n');
    }

    // Let's pick a user with team members
    console.log('\n🔍 Finding users with team members...\n');
    const usersWithTeam = await client.query(`
      SELECT
        u.id,
        u.full_name,
        u.email,
        COUNT(t.id) as team_count
      FROM public.users u
      LEFT JOIN public.users t ON t.sponsor_id = u.id
      WHERE u.email LIKE '%@finaster.com'
      GROUP BY u.id, u.full_name, u.email
      HAVING COUNT(t.id) > 0
      ORDER BY COUNT(t.id) DESC
      LIMIT 5
    `);

    console.log(`Users with team members:`);
    usersWithTeam.rows.forEach((user, i) => {
      console.log(`   ${i + 1}. ${user.full_name} (${user.email}) - ${user.team_count} members`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkUserTeam();
