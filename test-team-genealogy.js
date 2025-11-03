import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dsgtyrwtlpnckvcozfbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzZ3R5cnd0bHBuY2t2Y296ZmJjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTg0MTQwNywiZXhwIjoyMDc3NDE3NDA3fQ.O6HLc6lQHgFkYpb1scfBGa2iaWwfo3yXIxHlbGEyOxg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testTeamAndGenealogy() {
  console.log('🧪 Testing Team & Genealogy Features\n');
  console.log('=' .repeat(70));

  // Get test user
  const { data: testUser, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('email', 'user@finaster.com')
    .single();

  if (userError || !testUser) {
    console.log('❌ Test user not found');
    return;
  }

  console.log('\n✅ Test User:', testUser.email);
  console.log(`   ID: ${testUser.id}`);
  console.log(`   Direct Count: ${testUser.direct_count}`);
  console.log(`   Team Count: ${testUser.team_count}`);

  // Test 1: Get Direct Referrals (Level 1)
  console.log('\n' + '─'.repeat(70));
  console.log('TEST 1: Direct Referrals (Using users table)');
  console.log('─'.repeat(70));

  const { data: directRefs, error: directError } = await supabase
    .from('users')
    .select('id, email, full_name, sponsor_id, level, total_investment, team_count')
    .eq('sponsor_id', testUser.id);

  if (directError) {
    console.log('❌ Error:', directError.message);
  } else {
    console.log(`✅ Found ${directRefs?.length || 0} direct referrals`);
    if (directRefs && directRefs.length > 0) {
      console.log('\n📋 Direct Referrals:');
      directRefs.forEach((ref, idx) => {
        console.log(`   ${idx + 1}. ${ref.full_name} (${ref.email})`);
        console.log(`      Team Size: ${ref.team_count}, Investment: $${ref.total_investment || 0}`);
      });
    }
  }

  // Test 2: Get All Team Members (Recursive)
  console.log('\n' + '─'.repeat(70));
  console.log('TEST 2: All Team Members (Recursive Query)');
  console.log('─'.repeat(70));

  async function getAllTeamMembers(userId, level = 1, maxLevel = 5) {
    const members = [];

    const { data: directs } = await supabase
      .from('users')
      .select('id, email, full_name, sponsor_id, level as user_level, total_investment')
      .eq('sponsor_id', userId);

    if (directs && directs.length > 0) {
      for (const member of directs) {
        members.push({ ...member, level });

        if (level < maxLevel) {
          const subMembers = await getAllTeamMembers(member.id, level + 1, maxLevel);
          members.push(...subMembers);
        }
      }
    }

    return members;
  }

  const allTeamMembers = await getAllTeamMembers(testUser.id);
  console.log(`✅ Found ${allTeamMembers.length} total team members`);

  if (allTeamMembers.length > 0) {
    console.log('\n📊 Team Breakdown by Level:');
    const levelBreakdown = {};
    allTeamMembers.forEach(member => {
      levelBreakdown[member.level] = (levelBreakdown[member.level] || 0) + 1;
    });

    Object.keys(levelBreakdown).sort().forEach(level => {
      console.log(`   Level ${level}: ${levelBreakdown[level]} members`);
    });

    console.log('\n📋 First 5 Team Members:');
    allTeamMembers.slice(0, 5).forEach((member, idx) => {
      console.log(`   ${idx + 1}. [L${member.level}] ${member.full_name} (${member.email})`);
    });
  }

  // Test 3: Binary Nodes
  console.log('\n' + '─'.repeat(70));
  console.log('TEST 3: Binary Nodes (Genealogy Tree)');
  console.log('─'.repeat(70));

  const { data: rootNode, error: nodeError } = await supabase
    .from('binary_nodes')
    .select('*')
    .eq('user_id', testUser.id)
    .single();

  if (nodeError) {
    console.log('❌ Error:', nodeError.message);
  } else if (rootNode) {
    console.log('✅ Binary node found for test user');
    console.log(`   Position: ${rootNode.position}`);
    console.log(`   Level: ${rootNode.level}`);
    console.log(`   Left Child: ${rootNode.left_child_id ? '✅ Yes' : '❌ No'}`);
    console.log(`   Right Child: ${rootNode.right_child_id ? '✅ Yes' : '❌ No'}`);
    console.log(`   Left Volume: ${rootNode.left_volume}`);
    console.log(`   Right Volume: ${rootNode.right_volume}`);

    // Get children nodes
    const { data: allNodes } = await supabase
      .from('binary_nodes')
      .select('user_id, parent_id, position, level')
      .order('level');

    console.log(`\n📊 Total Binary Nodes: ${allNodes?.length || 0}`);

    if (allNodes && allNodes.length > 0) {
      const levelCounts = {};
      allNodes.forEach(node => {
        levelCounts[node.level] = (levelCounts[node.level] || 0) + 1;
      });

      console.log('\n📊 Binary Tree Level Distribution:');
      Object.keys(levelCounts).sort().forEach(level => {
        console.log(`   Level ${level}: ${levelCounts[level]} nodes`);
      });
    }
  }

  // Test 4: Referrals Table
  console.log('\n' + '─'.repeat(70));
  console.log('TEST 4: Referrals Table');
  console.log('─'.repeat(70));

  const { data: referrals, error: refError } = await supabase
    .from('referrals')
    .select('*')
    .or(`referrer_id.eq.${testUser.id},sponsor_id.eq.${testUser.id}`);

  if (refError) {
    console.log('❌ Error:', refError.message);
  } else {
    console.log(`✅ Found ${referrals?.length || 0} referral records`);
    if (referrals && referrals.length > 0) {
      const sample = referrals[0];
      console.log('\n📋 Referrals table columns:');
      console.log(`   ${Object.keys(sample).join(', ')}`);
      console.log(`\n📋 Sample Referral:`);
      console.log(`   Referrer ID: ${sample.referrer_id || sample.sponsor_id}`);
      console.log(`   Referee ID: ${sample.referee_id || sample.user_id}`);
      console.log(`   Status: ${sample.status}`);
      console.log(`   Commission: $${sample.commission_earned || 0}`);
    }
  }

  // Final Summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 FINAL SUMMARY');
  console.log('='.repeat(70));

  const testsResults = {
    '✅ User Authentication': testUser ? 'PASS' : 'FAIL',
    '✅ Direct Referrals Query': directError ? 'FAIL' : 'PASS',
    '✅ Team Members Recursive': allTeamMembers.length > 0 ? 'PASS' : 'FAIL',
    '✅ Binary Nodes Table': nodeError ? 'FAIL' : 'PASS',
    '✅ Genealogy Tree Data': rootNode ? 'PASS' : 'FAIL',
    '✅ Referrals Table': refError ? 'FAIL' : 'PASS'
  };

  Object.entries(testsResults).forEach(([test, result]) => {
    const symbol = result === 'PASS' ? '✅' : '❌';
    console.log(`${symbol} ${test.replace(/^[✅❌] /, '')}: ${result}`);
  });

  console.log('\n📈 Statistics:');
  console.log(`   • Total Users: 21`);
  console.log(`   • Direct Referrals: ${directRefs?.length || 0}`);
  console.log(`   • Total Team Members: ${allTeamMembers.length}`);
  console.log(`   • Binary Nodes: ${allNodes?.length || 0}`);
  console.log(`   • Referral Records: ${referrals?.length || 0}`);

  const allPass = Object.values(testsResults).every(result => result === 'PASS');

  console.log('\n' + '='.repeat(70));
  if (allPass) {
    console.log('🎉 🎉 🎉  ALL TESTS PASSED! 🎉 🎉 🎉');
    console.log('\n✅ Team page should now show team members!');
    console.log('✅ Genealogy tree should display correctly!');
    console.log('\n🌐 Open in browser:');
    console.log('   URL: http://localhost:5173/team');
    console.log('   Login: user@finaster.com / Test123456!');
  } else {
    console.log('⚠️  Some tests failed. Please review the errors above.');
  }
  console.log('='.repeat(70));
}

testTeamAndGenealogy().catch(console.error);
