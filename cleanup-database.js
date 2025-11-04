import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dsgtyrwtlpnckvcozfbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzZ3R5cnd0bHBuY2t2Y296ZmJjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTg0MTQwNywiZXhwIjoyMDc3NDE3NDA3fQ.O6HLc6lQHgFkYpb1scfBGa2iaWwfo3yXIxHlbGEyOxg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupDatabase() {
  console.log('\n🧹 DATABASE CLEANUP\n');
  console.log('='.repeat(80));

  // Step 1: Delete test rank record
  console.log('\n📝 STEP 1: Delete test rank record');
  try {
    // First, check if test rank exists
    const { data: testRanks, error: findError } = await supabase
      .from('rank_rewards')
      .select('*')
      .eq('rank_name', 'Test Reward');

    if (findError) {
      console.log(`   ⚠️ Error checking for test rank: ${findError.message}`);
    } else if (!testRanks || testRanks.length === 0) {
      console.log('   ℹ️ No test rank record found (may have been deleted already)');
    } else {
      console.log(`   Found ${testRanks.length} test rank record(s)`);

      const { error: deleteError } = await supabase
        .from('rank_rewards')
        .delete()
        .eq('rank_name', 'Test Reward');

      if (deleteError) {
        console.log(`   ❌ Failed to delete: ${deleteError.message}`);
      } else {
        console.log('   ✅ Deleted test rank record successfully');
      }
    }
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
  }

  // Step 2: Delete orphaned wallets
  console.log('\n📝 STEP 2: Delete orphaned wallets');
  try {
    // Get all user IDs
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id');

    if (usersError) throw usersError;

    const userIds = users.map(u => u.id);
    console.log(`   Found ${userIds.length} valid users`);

    // Get all wallets
    const { data: wallets, error: walletsError } = await supabase
      .from('wallets')
      .select('id, user_id');

    if (walletsError) throw walletsError;

    console.log(`   Found ${wallets.length} total wallets`);

    // Find orphaned wallets
    const orphanedWallets = wallets.filter(w => !userIds.includes(w.user_id));
    console.log(`   Found ${orphanedWallets.length} orphaned wallets to delete`);

    if (orphanedWallets.length > 0) {
      let deleted = 0;
      let failed = 0;

      for (const wallet of orphanedWallets) {
        const { error: deleteError } = await supabase
          .from('wallets')
          .delete()
          .eq('id', wallet.id);

        if (deleteError) {
          console.log(`   ⚠️ Failed to delete wallet ${wallet.id}`);
          failed++;
        } else {
          deleted++;
        }
      }

      console.log(`   ✅ Deleted ${deleted} orphaned wallets`);
      if (failed > 0) {
        console.log(`   ⚠️ Failed to delete ${failed} wallets`);
      }
    } else {
      console.log('   ℹ️ No orphaned wallets found');
    }
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
  }

  // Step 3: Verify cleanup
  console.log('\n📝 STEP 3: Verify cleanup');
  try {
    const { data: users } = await supabase.from('users').select('id');
    const { data: wallets } = await supabase.from('wallets').select('user_id');
    const { data: ranks } = await supabase.from('rank_rewards').select('rank_name').eq('rank_name', 'Test Reward');

    const userIds = users.map(u => u.id);
    const orphaned = wallets.filter(w => !userIds.includes(w.user_id));

    console.log('\n   📊 POST-CLEANUP STATUS:');
    console.log(`      Users: ${users.length}`);
    console.log(`      Wallets: ${wallets.length}`);
    console.log(`      Orphaned Wallets: ${orphaned.length}`);
    console.log(`      Test Rank Records: ${ranks?.length || 0}`);

    if (orphaned.length === 0 && (!ranks || ranks.length === 0)) {
      console.log('\n   ✅ DATABASE CLEANUP COMPLETE - ALL CLEAN!');
    } else {
      console.log('\n   ⚠️ Some issues remain - review above');
    }
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
  }

  console.log('\n' + '='.repeat(80) + '\n');
}

cleanupDatabase().catch(console.error);
