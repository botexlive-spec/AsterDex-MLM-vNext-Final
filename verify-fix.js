import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dsgtyrwtlpnckvcozfbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzZ3R5cnd0bHBuY2t2Y296ZmJjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTg0MTQwNywiZXhwIjoyMDc3NDE3NDA3fQ.O6HLc6lQHgFkYpb1scfBGa2iaWwfo3yXIxHlbGEyOxg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
  console.log('🔍 Verifying Database Fixes...\n');

  let allGood = true;

  // 1. Check users table has total_withdrawal
  console.log('1️⃣  Checking users table...');
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('*')
    .limit(1);

  if (usersError) {
    console.log('   ❌ Users table error:', usersError.message);
    allGood = false;
  } else if (users && users.length > 0) {
    const hasColumn = 'total_withdrawal' in users[0];
    if (hasColumn) {
      const { count } = await supabase.from('users').select('*', { count: 'exact', head: true });
      console.log(`   ✅ Users table: ${count} rows, has total_withdrawal column`);
    } else {
      console.log('   ❌ Users table missing total_withdrawal column');
      allGood = false;
    }
  }

  // 2. Check binary_nodes table exists
  console.log('\n2️⃣  Checking binary_nodes table...');
  const { data: binaryNodes, error: binaryError } = await supabase
    .from('binary_nodes')
    .select('*')
    .limit(1);

  if (binaryError) {
    console.log('   ❌ Binary nodes table missing:', binaryError.message);
    allGood = false;
  } else {
    const { count } = await supabase.from('binary_nodes').select('*', { count: 'exact', head: true });
    console.log(`   ✅ Binary nodes table: ${count} rows`);

    if (count === 0) {
      console.log('   ⚠️  Warning: Binary nodes table exists but is empty');
      console.log('      Run the population script in fix-all-issues.sql again');
      allGood = false;
    }
  }

  // 3. Check commissions table exists
  console.log('\n3️⃣  Checking commissions table...');
  const { error: commissionsError } = await supabase
    .from('commissions')
    .select('*')
    .limit(1);

  if (commissionsError) {
    console.log('   ❌ Commissions table missing:', commissionsError.message);
    allGood = false;
  } else {
    const { count } = await supabase.from('commissions').select('*', { count: 'exact', head: true });
    console.log(`   ✅ Commissions table: ${count} rows`);
  }

  // 4. Check referrals table has new columns
  console.log('\n4️⃣  Checking referrals table...');
  const { data: referrals, error: referralsError } = await supabase
    .from('referrals')
    .select('*')
    .limit(1);

  if (referralsError) {
    console.log('   ❌ Referrals table error:', referralsError.message);
    allGood = false;
  } else if (referrals && referrals.length > 0) {
    const hasSponsorId = 'sponsor_id' in referrals[0];
    const hasUserId = 'user_id' in referrals[0];
    const hasLevel = 'level' in referrals[0];

    const { count } = await supabase.from('referrals').select('*', { count: 'exact', head: true });

    if (hasSponsorId && hasUserId && hasLevel) {
      console.log(`   ✅ Referrals table: ${count} rows, has sponsor_id, user_id, level columns`);
    } else {
      console.log(`   ⚠️  Referrals table: ${count} rows`);
      if (!hasSponsorId) console.log('      ❌ Missing sponsor_id column');
      if (!hasUserId) console.log('      ❌ Missing user_id column');
      if (!hasLevel) console.log('      ❌ Missing level column');
      allGood = false;
    }
  } else {
    const { count } = await supabase.from('referrals').select('*', { count: 'exact', head: true });
    console.log(`   ✅ Referrals table exists: ${count} rows`);
  }

  // 5. Test team query for user@finaster.com
  console.log('\n5️⃣  Testing team query for user@finaster.com...');
  const { data: testUser } = await supabase
    .from('users')
    .select('id, email, direct_count, team_count')
    .eq('email', 'user@finaster.com')
    .single();

  if (testUser) {
    console.log(`   ✅ Test user found:`);
    console.log(`      ID: ${testUser.id}`);
    console.log(`      Direct count: ${testUser.direct_count}`);
    console.log(`      Team count: ${testUser.team_count}`);

    // Check actual team members
    const { data: teamMembers } = await supabase
      .from('users')
      .select('id, email, full_name, level')
      .eq('sponsor_id', testUser.id);

    console.log(`   ✅ Direct referrals in database: ${teamMembers?.length || 0}`);

    if (teamMembers && teamMembers.length > 0) {
      console.log('      Sample:', teamMembers[0].email);
    }
  } else {
    console.log('   ❌ Test user not found');
    allGood = false;
  }

  // 6. Test binary tree for user@finaster.com
  console.log('\n6️⃣  Testing binary tree...');
  if (!binaryError && testUser) {
    const { data: userNode } = await supabase
      .from('binary_nodes')
      .select('*')
      .eq('user_id', testUser.id)
      .single();

    if (userNode) {
      console.log('   ✅ Binary node exists for test user');
      console.log(`      Position: ${userNode.position}`);
      console.log(`      Level: ${userNode.level}`);
      console.log(`      Left child: ${userNode.left_child_id ? 'Yes' : 'No'}`);
      console.log(`      Right child: ${userNode.right_child_id ? 'Yes' : 'No'}`);
    } else {
      console.log('   ❌ Binary node missing for test user');
      allGood = false;
    }
  }

  // Final summary
  console.log('\n' + '='.repeat(60));
  if (allGood) {
    console.log('✅ ✅ ✅  ALL FIXES VERIFIED SUCCESSFULLY! ✅ ✅ ✅');
    console.log('\nYou can now:');
    console.log('1. Restart the dev server: npm run dev');
    console.log('2. Login with: user@finaster.com');
    console.log('3. Visit Team page - should show 20 members');
    console.log('4. Check Genealogy tree - should display binary tree');
  } else {
    console.log('❌ ❌ ❌  SOME ISSUES REMAIN ❌ ❌ ❌');
    console.log('\nPlease:');
    console.log('1. Run the SQL script again: database/fix-all-issues.sql');
    console.log('2. Check Supabase SQL Editor for any errors');
    console.log('3. Run this script again to verify');
  }
  console.log('='.repeat(60));
}

verify().catch(console.error);
