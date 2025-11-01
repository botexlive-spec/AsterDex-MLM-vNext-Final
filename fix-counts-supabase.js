import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dsgtyrwtlpnckvcozfbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzZ3R5cnd0bHBuY2t2Y296ZmJjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTg0MTQwNywiZXhwIjoyMDc3NDE3NDA3fQ.O6HLc6lQHgFkYpb1scfBGa2iaWwfo3yXIxHlbGEyOxg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixAllCounts() {
  console.log('🔄 Starting count recalculation...\n');

  try {
    // Get all users
    const { data: allUsers, error: usersError } = await supabase
      .from('users')
      .select('id, full_name, email, direct_count, team_count')
      .order('full_name');

    if (usersError) throw usersError;

    console.log(`Found ${allUsers.length} total users\n`);
    console.log('🔄 Step 1: Calculating direct referrals...\n');

    let directUpdatedCount = 0;
    let directMismatchCount = 0;

    for (const user of allUsers) {
      // Count direct referrals
      const { count, error: countError } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('sponsor_id', user.id);

      if (countError) {
        console.error(`Error counting for ${user.full_name}:`, countError);
        continue;
      }

      const actualDirectCount = count || 0;
      const currentDirectCount = user.direct_count || 0;

      if (actualDirectCount !== currentDirectCount) {
        directMismatchCount++;

        const { error: updateError } = await supabase
          .from('users')
          .update({ direct_count: actualDirectCount, updated_at: new Date().toISOString() })
          .eq('id', user.id);

        if (updateError) {
          console.error(`Error updating ${user.full_name}:`, updateError);
          continue;
        }

        console.log(`  ✓ ${user.full_name}: ${currentDirectCount} → ${actualDirectCount}`);
        directUpdatedCount++;
      }
    }

    console.log(`\n✅ Step 1 Complete: Updated ${directUpdatedCount} users`);
    console.log(`   (Found ${directMismatchCount} mismatches)\n`);

    console.log('🔄 Step 2: Calculating team counts (this may take a while)...\n');

    // Function to get all downline recursively
    const getAllDownline = async (userId, visited = new Set()) => {
      if (visited.has(userId)) return visited;
      visited.add(userId);

      const { data: directRefs, error } = await supabase
        .from('users')
        .select('id')
        .eq('sponsor_id', userId);

      if (error) {
        console.error('Error getting downline:', error);
        return visited;
      }

      for (const ref of directRefs || []) {
        if (!visited.has(ref.id)) {
          await getAllDownline(ref.id, visited);
        }
      }

      return visited;
    };

    let teamUpdatedCount = 0;
    let teamMismatchCount = 0;
    let processedCount = 0;

    for (const user of allUsers) {
      processedCount++;
      if (processedCount % 50 === 0) {
        console.log(`  Processing... ${processedCount}/${allUsers.length}`);
      }

      const downline = await getAllDownline(user.id);
      const actualTeamCount = downline.size - 1; // Subtract the user themselves

      const currentTeamCount = user.team_count || 0;

      if (actualTeamCount !== currentTeamCount) {
        teamMismatchCount++;

        const { error: updateError } = await supabase
          .from('users')
          .update({ team_count: actualTeamCount, updated_at: new Date().toISOString() })
          .eq('id', user.id);

        if (updateError) {
          console.error(`Error updating team count for ${user.full_name}:`, updateError);
          continue;
        }

        if (actualTeamCount > 0 || currentTeamCount > 0) {
          console.log(`  ✓ ${user.full_name}: ${currentTeamCount} → ${actualTeamCount}`);
        }
        teamUpdatedCount++;
      }
    }

    console.log(`\n✅ Step 2 Complete: Updated ${teamUpdatedCount} users`);
    console.log(`   (Found ${teamMismatchCount} mismatches)\n`);

    // Show summary
    console.log('📊 SUMMARY - Top 10 users by team size:\n');
    const { data: topUsers, error: topError } = await supabase
      .from('users')
      .select('full_name, email, direct_count, team_count')
      .gt('team_count', 0)
      .order('team_count', { ascending: false })
      .limit(10);

    if (topError) throw topError;

    topUsers?.forEach((user, index) => {
      console.log(`${index + 1}. ${user.full_name} (${user.email})`);
      console.log(`   Direct: ${user.direct_count}, Team: ${user.team_count}\n`);
    });

    console.log('✅ All counts have been recalculated and updated!');

    // Specifically check Mark Lee
    console.log('\n🔍 Checking Mark Lee (user.mark.lee.10.1@finaster.com)...\n');
    const { data: markLee, error: markError } = await supabase
      .from('users')
      .select('full_name, email, direct_count, team_count')
      .eq('id', '58ca73e7-36cc-4ab3-b549-c712bf8462ef')
      .single();

    if (!markError && markLee) {
      console.log(`${markLee.full_name} (${markLee.email})`);
      console.log(`Direct: ${markLee.direct_count}, Team: ${markLee.team_count}`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fixAllCounts();
