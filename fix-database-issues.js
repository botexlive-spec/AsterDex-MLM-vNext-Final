import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dsgtyrwtlpnckvcozfbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzZ3R5cnd0bHBuY2t2Y296ZmJjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTg0MTQwNywiZXhwIjoyMDc3NDE3NDA3fQ.O6HLc6lQHgFkYpb1scfBGa2iaWwfo3yXIxHlbGEyOxg';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixDatabaseIssues() {
  console.log('\n🔧 FIXING DATABASE ISSUES\n');
  console.log('='.repeat(80));

  // ISSUE 1: Create wallets for users without wallets
  console.log('\n📝 ISSUE 1: Users without wallets');
  try {
    const { data: allUsers, error: usersError } = await supabase
      .from('users')
      .select('id, email, full_name');

    if (usersError) throw usersError;

    const { data: existingWallets, error: walletsError } = await supabase
      .from('wallets')
      .select('user_id');

    if (walletsError) throw walletsError;

    const walletUserIds = existingWallets.map(w => w.user_id);
    const usersWithoutWallets = allUsers.filter(u => !walletUserIds.includes(u.id));

    console.log(`   Found ${usersWithoutWallets.length} users without wallets`);

    if (usersWithoutWallets.length > 0) {
      for (const user of usersWithoutWallets) {
        const { error: insertError } = await supabase
          .from('wallets')
          .insert({
            user_id: user.id,
            available_balance: 0,
            total_balance: 0,
            locked_balance: 0,
          });

        if (insertError) {
          console.log(`   ❌ Failed to create wallet for ${user.email}: ${insertError.message}`);
        } else {
          console.log(`   ✅ Created wallet for ${user.email}`);
        }
      }
      console.log(`   ✅ FIXED: Created ${usersWithoutWallets.length} wallets`);
    } else {
      console.log('   ✅ No action needed');
    }
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
  }

  // ISSUE 2: Fix duplicate binary positions
  console.log('\n📝 ISSUE 2: Duplicate binary positions');
  try {
    const { data: nodes, error } = await supabase
      .from('binary_nodes')
      .select('*')
      .order('created_at');

    if (error) throw error;

    // Find duplicates
    const positionMap = {};
    const duplicates = [];

    nodes.forEach(node => {
      if (node.parent_id && node.position) {
        const key = `${node.parent_id}-${node.position}`;
        if (positionMap[key]) {
          duplicates.push({
            existing: positionMap[key],
            duplicate: node
          });
        } else {
          positionMap[key] = node;
        }
      }
    });

    console.log(`   Found ${duplicates.length} duplicate positions`);

    if (duplicates.length > 0) {
      for (const dup of duplicates) {
        // Keep the older one, delete the newer one
        const { error: deleteError } = await supabase
          .from('binary_nodes')
          .delete()
          .eq('id', dup.duplicate.id);

        if (deleteError) {
          console.log(`   ❌ Failed to delete duplicate node ${dup.duplicate.id}: ${deleteError.message}`);
        } else {
          console.log(`   ✅ Deleted duplicate node for user ${dup.duplicate.user_id}`);
        }
      }
      console.log(`   ✅ FIXED: Removed ${duplicates.length} duplicate nodes`);
    } else {
      console.log('   ✅ No action needed');
    }
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
  }

  // ISSUE 3: Fix referral inconsistencies
  console.log('\n📝 ISSUE 3: Referral inconsistencies');
  try {
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, sponsor_id, created_at');

    const { data: referrals, error: referralsError } = await supabase
      .from('referrals')
      .select('*');

    if (usersError) throw usersError;
    if (referralsError) throw referralsError;

    // Build referral map
    const referralMap = {};
    referrals.forEach(r => {
      referralMap[`${r.sponsor_id}-${r.referred_id}`] = true;
    });

    // Find users with sponsors but no referral records
    const usersWithSponsors = users.filter(u => u.sponsor_id);
    let created = 0;
    let skipped = 0;

    for (const user of usersWithSponsors) {
      const key = `${user.sponsor_id}-${user.id}`;
      if (!referralMap[key]) {
        // Create missing referral record
        const { error: insertError } = await supabase
          .from('referrals')
          .insert({
            sponsor_id: user.sponsor_id,
            referred_id: user.id,
            level: 1, // Direct referral
            created_at: user.created_at
          });

        if (insertError) {
          console.log(`   ⚠️ Skipped ${user.email}: ${insertError.message}`);
          skipped++;
        } else {
          console.log(`   ✅ Created referral record for ${user.email}`);
          created++;
        }
      }
    }

    if (created > 0) {
      console.log(`   ✅ FIXED: Created ${created} missing referral records`);
    }
    if (skipped > 0) {
      console.log(`   ⚠️ Skipped ${skipped} records due to errors`);
    }
    if (created === 0 && skipped === 0) {
      console.log('   ✅ No action needed');
    }

    // Delete orphaned referrals
    const userIds = users.map(u => u.id);
    const orphanedReferrals = referrals.filter(r =>
      !userIds.includes(r.sponsor_id) || !userIds.includes(r.referred_id)
    );

    if (orphanedReferrals.length > 0) {
      console.log(`\n   Found ${orphanedReferrals.length} orphaned referrals to delete`);
      for (const ref of orphanedReferrals) {
        const { error: deleteError } = await supabase
          .from('referrals')
          .delete()
          .eq('id', ref.id);

        if (deleteError) {
          console.log(`   ❌ Failed to delete orphaned referral ${ref.id}`);
        } else {
          console.log(`   ✅ Deleted orphaned referral ${ref.id}`);
        }
      }
    }

  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
  }

  // ISSUE 4: Update users' direct_count and team_count
  console.log('\n📝 ISSUE 4: Update user counts');
  try {
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id');

    if (usersError) throw usersError;

    for (const user of users) {
      // Count direct referrals
      const { count: directCount, error: directError } = await supabase
        .from('referrals')
        .select('*', { count: 'exact', head: true })
        .eq('sponsor_id', user.id)
        .eq('level', 1);

      if (directError) {
        console.log(`   ⚠️ Error counting directs for user ${user.id}`);
        continue;
      }

      // Count total team
      const { count: teamCount, error: teamError } = await supabase
        .from('referrals')
        .select('*', { count: 'exact', head: true })
        .eq('sponsor_id', user.id);

      if (teamError) {
        console.log(`   ⚠️ Error counting team for user ${user.id}`);
        continue;
      }

      // Update user record
      const { error: updateError } = await supabase
        .from('users')
        .update({
          direct_count: directCount || 0,
          team_count: teamCount || 0
        })
        .eq('id', user.id);

      if (!updateError) {
        console.log(`   ✅ Updated counts for user ${user.id}: ${directCount} directs, ${teamCount} team`);
      }
    }

    console.log('   ✅ FIXED: Updated all user counts');
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n✅ DATABASE FIXES COMPLETE\n');
}

fixDatabaseIssues().catch(console.error);
