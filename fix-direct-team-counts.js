import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres.dsgtyrwtlpnckvcozfbc:Dubai%401234%23@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres'
});

async function fixDirectTeamCounts() {
  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    console.log('🔄 Step 1: Calculating direct referrals for each user...\n');

    // First, get all users
    const { rows: allUsers } = await client.query(`
      SELECT id, full_name, email FROM users ORDER BY full_name
    `);

    console.log(`Found ${allUsers.length} total users`);

    let updatedCount = 0;
    let mismatchCount = 0;

    // For each user, count their direct referrals and update
    for (const user of allUsers) {
      // Count direct referrals (sponsor_id = user.id)
      const { rows: directCount } = await client.query(`
        SELECT COUNT(*) as count FROM users WHERE sponsor_id = $1
      `, [user.id]);

      const actualDirectCount = parseInt(directCount[0].count);

      // Get current direct_count from database
      const { rows: currentData } = await client.query(`
        SELECT direct_count FROM users WHERE id = $1
      `, [user.id]);

      const currentDirectCount = currentData[0].direct_count || 0;

      // Only update if there's a mismatch
      if (actualDirectCount !== currentDirectCount) {
        mismatchCount++;

        await client.query(`
          UPDATE users
          SET direct_count = $1, updated_at = NOW()
          WHERE id = $2
        `, [actualDirectCount, user.id]);

        console.log(`  ✓ ${user.full_name} (${user.email}): ${currentDirectCount} → ${actualDirectCount}`);
        updatedCount++;
      }
    }

    console.log(`\n✅ Step 1 Complete: Updated ${updatedCount} users with mismatched direct_count`);
    console.log(`   (Found ${mismatchCount} mismatches out of ${allUsers.length} users)\n`);

    console.log('🔄 Step 2: Calculating team counts (recursive downline)...\n');

    // Function to get all downline members recursively
    const getAllDownline = async (userId, visited = new Set()) => {
      if (visited.has(userId)) return visited;
      visited.add(userId);

      const { rows: directReferrals } = await client.query(`
        SELECT id FROM users WHERE sponsor_id = $1
      `, [userId]);

      for (const referral of directReferrals) {
        if (!visited.has(referral.id)) {
          await getAllDownline(referral.id, visited);
        }
      }

      return visited;
    };

    let teamUpdatedCount = 0;
    let teamMismatchCount = 0;

    for (const user of allUsers) {
      const downline = await getAllDownline(user.id);
      // Subtract 1 because the set includes the user themselves
      const actualTeamCount = downline.size - 1;

      // Get current team_count
      const { rows: currentData } = await client.query(`
        SELECT team_count FROM users WHERE id = $1
      `, [user.id]);

      const currentTeamCount = currentData[0].team_count || 0;

      if (actualTeamCount !== currentTeamCount) {
        teamMismatchCount++;

        await client.query(`
          UPDATE users
          SET team_count = $1, updated_at = NOW()
          WHERE id = $2
        `, [actualTeamCount, user.id]);

        if (actualTeamCount > 0 || currentTeamCount > 0) {
          console.log(`  ✓ ${user.full_name}: ${currentTeamCount} → ${actualTeamCount}`);
        }
        teamUpdatedCount++;
      }
    }

    console.log(`\n✅ Step 2 Complete: Updated ${teamUpdatedCount} users with mismatched team_count`);
    console.log(`   (Found ${teamMismatchCount} mismatches out of ${allUsers.length} users)\n`);

    // Show summary of users with high counts
    console.log('📊 SUMMARY - Top 10 users by team size:\n');
    const { rows: topUsers } = await client.query(`
      SELECT full_name, email, direct_count, team_count
      FROM users
      WHERE team_count > 0
      ORDER BY team_count DESC
      LIMIT 10
    `);

    topUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.full_name} (${user.email})`);
      console.log(`   Direct: ${user.direct_count}, Team: ${user.team_count}\n`);
    });

    console.log('✅ All counts have been recalculated and updated!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
  }
}

fixDirectTeamCounts();
