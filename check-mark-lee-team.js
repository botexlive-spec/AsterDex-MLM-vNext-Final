import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres.dsgtyrwtlpnckvcozfbc:Dubai%401234%23@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres'
});

async function checkMarkLeeTeam() {
  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Find Mark Lee by email
    console.log('=== FINDING MARK LEE ===');
    const { rows: markLeeSearch } = await client.query(`
      SELECT id, full_name, email, direct_count, team_count, sponsor_id
      FROM users
      WHERE email LIKE '%mark.lee%'
      LIMIT 5
    `);

    console.log(`Found ${markLeeSearch.length} users matching 'mark.lee':`);
    markLeeSearch.forEach(u => console.log(`  - ${u.full_name} (${u.email}) - ID: ${u.id}`));

    if (markLeeSearch.length === 0) {
      console.log('No user found with email containing "mark.lee"');
      return;
    }

    const markLeeInfo = markLeeSearch;
    const markLeeId = markLeeSearch[0].id;
    console.log('\n=== MARK LEE INFO ===');
    console.log('Using:', markLeeInfo[0]);

    console.log('Mark Lee:', markLeeInfo[0]);
    console.log('\n=== ACTUAL DIRECT REFERRALS (sponsor_id = Mark Lee) ===');

    // Get actual direct referrals
    const { rows: directReferrals } = await client.query(`
      SELECT id, full_name, email, sponsor_id, created_at
      FROM users
      WHERE sponsor_id = $1
      ORDER BY created_at DESC
    `, [markLeeId]);

    console.log(`Found ${directReferrals.length} actual direct referrals:`);
    directReferrals.forEach((ref, index) => {
      console.log(`  ${index + 1}. ${ref.full_name} (${ref.email})`);
    });

    console.log('\n=== CHECKING direct_count FIELD ===');
    console.log(`direct_count in database: ${markLeeInfo[0]?.direct_count || 0}`);
    console.log(`Actual sponsor_id count: ${directReferrals.length}`);
    console.log(`Match: ${markLeeInfo[0]?.direct_count === directReferrals.length ? '✅ YES' : '❌ NO - MISMATCH!'}`);

    // If there's a mismatch, let's check if there are users with a different column
    if (markLeeInfo[0]?.direct_count !== directReferrals.length) {
      console.log('\n=== CHECKING referred_by COLUMN ===');
      const { rows: referredByCheck } = await client.query(`
        SELECT id, full_name, email
        FROM users
        WHERE referred_by = $1
        ORDER BY created_at DESC
      `, [markLeeId]);

      console.log(`Found ${referredByCheck.length} users with referred_by = Mark Lee:`);
      referredByCheck.forEach((ref, index) => {
        console.log(`  ${index + 1}. ${ref.full_name} (${ref.email})`);
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

checkMarkLeeTeam();
