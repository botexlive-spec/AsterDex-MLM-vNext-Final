import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dsgtyrwtlpnckvcozfbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzZ3R5cnd0bHBuY2t2Y296ZmJjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTg0MTQwNywiZXhwIjoyMDc3NDE3NDA3fQ.O6HLc6lQHgFkYpb1scfBGa2iaWwfo3yXIxHlbGEyOxg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function comprehensiveQATestV2() {
  console.log('\n🧪 COMPREHENSIVE QA TEST SUITE V2 (After Fixes)\n');
  console.log('='.repeat(80));

  const results = {
    passed: 0,
    failed: 0,
    warnings: 0,
    tests: []
  };

  // Test 1: Check Users-Wallets Integrity
  console.log('\n📋 TEST 1: Users-Wallets Integrity');
  try {
    const { data: users } = await supabase.from('users').select('id, email');
    const { data: wallets } = await supabase.from('wallets').select('user_id');

    const walletUserIds = wallets?.map(w => w.user_id) || [];
    const usersWithoutWallets = users.filter(u => !walletUserIds.includes(u.id));

    if (usersWithoutWallets.length === 0) {
      console.log(`   ✅ PASS - All ${users.length} users have wallets`);
      results.passed++;
    } else {
      console.log(`   ⚠️ WARNING - ${usersWithoutWallets.length} users still without wallets`);
      results.warnings++;
    }

    results.tests.push({
      name: 'Users-Wallets Integrity',
      status: usersWithoutWallets.length === 0 ? 'PASS' : 'WARNING',
      details: `${users.length} users, ${wallets.length} wallets, ${usersWithoutWallets.length} missing`
    });

  } catch (error) {
    console.log(`   ❌ FAIL - ${error.message}`);
    results.failed++;
  }

  // Test 2: Binary Tree Structure (No Duplicates)
  console.log('\n📋 TEST 2: Binary Tree Structure');
  try {
    const { data: nodes } = await supabase.from('binary_nodes').select('*');

    const positionMap = {};
    const duplicates = [];

    nodes.forEach(node => {
      if (node.parent_id && node.position) {
        const key = `${node.parent_id}-${node.position}`;
        if (positionMap[key]) {
          duplicates.push(node);
        } else {
          positionMap[key] = node;
        }
      }
    });

    if (duplicates.length === 0) {
      console.log(`   ✅ PASS - No duplicate positions in ${nodes.length} nodes`);
      results.passed++;
    } else {
      console.log(`   ❌ FAIL - ${duplicates.length} duplicate positions found`);
      results.failed++;
    }

    results.tests.push({
      name: 'Binary Tree Structure',
      status: duplicates.length === 0 ? 'PASS' : 'FAIL',
      details: `${nodes.length} nodes, ${duplicates.length} duplicates`
    });

  } catch (error) {
    console.log(`   ❌ FAIL - ${error.message}`);
    results.failed++;
  }

  // Test 3: Packages Configuration
  console.log('\n📋 TEST 3: Packages Configuration');
  try {
    const { data: packages } = await supabase.from('packages').select('*').eq('status', 'active');

    const issues = [];

    packages.forEach(pkg => {
      if (!pkg.price || pkg.price <= 0) {
        issues.push(`${pkg.name} has invalid price`);
      }
      if (!pkg.daily_return_percentage || pkg.daily_return_percentage <= 0) {
        issues.push(`${pkg.name} has invalid daily ROI`);
      }
      if (!pkg.duration_days || pkg.duration_days <= 0) {
        issues.push(`${pkg.name} has invalid duration`);
      }
    });

    if (issues.length === 0) {
      console.log(`   ✅ PASS - ${packages.length} active packages configured correctly`);
      results.passed++;
    } else {
      console.log(`   ⚠️ WARNING - Issues: ${issues.join(', ')}`);
      results.warnings++;
    }

    results.tests.push({
      name: 'Packages Configuration',
      status: issues.length === 0 ? 'PASS' : 'WARNING',
      details: `${packages.length} packages, ${issues.length} issues`
    });

  } catch (error) {
    console.log(`   ❌ FAIL - ${error.message}`);
    results.failed++;
  }

  // Test 4: Commission Settings
  console.log('\n📋 TEST 4: Commission Settings');
  try {
    const { data: settings } = await supabase.from('commission_settings').select('*').single();

    const issues = [];

    if (!settings.level_commissions || !Array.isArray(settings.level_commissions)) {
      issues.push('Missing level commissions array');
    } else {
      const activelevels = settings.level_commissions.filter(l => l.status === 'active').length;
      if (activelevels !== 30) {
        issues.push(`Expected 30 active levels, found ${activelevels}`);
      }
    }

    if (!settings.binary_settings || !settings.binary_settings.matchingPercentage) {
      issues.push('Missing binary settings');
    }

    if (!settings.roi_settings) {
      issues.push('Missing ROI settings');
    }

    if (issues.length === 0) {
      console.log('   ✅ PASS - Commission settings configured correctly');
      results.passed++;
    } else {
      console.log(`   ⚠️ WARNING - Issues: ${issues.join(', ')}`);
      results.warnings++;
    }

    results.tests.push({
      name: 'Commission Settings',
      status: issues.length === 0 ? 'PASS' : 'WARNING',
      details: issues.length === 0 ? '30-level system configured' : issues.join(', ')
    });

  } catch (error) {
    console.log(`   ❌ FAIL - ${error.message}`);
    results.failed++;
  }

  // Test 5: Rank Rewards
  console.log('\n📋 TEST 5: Rank Rewards Configuration');
  try {
    const { data: ranks } = await supabase
      .from('rank_rewards')
      .select('*')
      .eq('is_active', true)
      .order('rank_order');

    const issues = [];

    if (ranks.length === 0) {
      issues.push('No rank rewards configured');
    }

    let lastVolume = 0;
    ranks.forEach((rank, idx) => {
      if (rank.min_team_volume <= lastVolume && idx > 0) {
        issues.push(`${rank.rank_name} has invalid volume requirement`);
      }
      lastVolume = rank.min_team_volume;
    });

    if (issues.length === 0) {
      console.log(`   ✅ PASS - ${ranks.length} rank tiers configured correctly`);
      results.passed++;
    } else {
      console.log(`   ⚠️ WARNING - Issues: ${issues.join(', ')}`);
      results.warnings++;
    }

    results.tests.push({
      name: 'Rank Rewards',
      status: issues.length === 0 ? 'PASS' : 'WARNING',
      details: `${ranks.length} ranks`
    });

  } catch (error) {
    console.log(`   ❌ FAIL - ${error.message}`);
    results.failed++;
  }

  // Test 6: Wallet Balances
  console.log('\n📋 TEST 6: Wallet Balances');
  try {
    const { data: wallets } = await supabase.from('wallets').select('*');

    const negativeBalances = wallets.filter(w =>
      (w.available_balance && w.available_balance < 0) ||
      (w.total_balance && w.total_balance < 0) ||
      (w.locked_balance && w.locked_balance < 0)
    );

    const userIds = wallets.map(w => w.user_id);
    const duplicates = userIds.filter((id, i) => userIds.indexOf(id) !== i);

    if (negativeBalances.length === 0 && duplicates.length === 0) {
      console.log(`   ✅ PASS - All ${wallets.length} wallets are valid`);
      results.passed++;
    } else {
      console.log(`   ⚠️ WARNING - ${negativeBalances.length} negative, ${duplicates.length} duplicates`);
      results.warnings++;
    }

    results.tests.push({
      name: 'Wallet Balances',
      status: (negativeBalances.length === 0 && duplicates.length === 0) ? 'PASS' : 'WARNING',
      details: `${wallets.length} wallets`
    });

  } catch (error) {
    console.log(`   ❌ FAIL - ${error.message}`);
    results.failed++;
  }

  // Test 7: Data Relationships
  console.log('\n📋 TEST 7: Data Relationships');
  try {
    const { data: users } = await supabase.from('users').select('id');
    const { data: binaryNodes } = await supabase.from('binary_nodes').select('user_id');
    const { data: wallets } = await supabase.from('wallets').select('user_id');

    const userIds = users.map(u => u.id);
    const nodeUserIds = binaryNodes.map(n => n.user_id);
    const walletUserIds = wallets.map(w => w.user_id);

    const orphanedNodes = nodeUserIds.filter(id => !userIds.includes(id));
    const orphanedWallets = walletUserIds.filter(id => !userIds.includes(id));

    if (orphanedNodes.length === 0 && orphanedWallets.length === 0) {
      console.log('   ✅ PASS - All data relationships are valid');
      results.passed++;
    } else {
      console.log(`   ⚠️ WARNING - ${orphanedNodes.length} orphaned nodes, ${orphanedWallets.length} orphaned wallets`);
      results.warnings++;
    }

    results.tests.push({
      name: 'Data Relationships',
      status: (orphanedNodes.length === 0 && orphanedWallets.length === 0) ? 'PASS' : 'WARNING',
      details: `${users.length} users, ${binaryNodes.length} nodes, ${wallets.length} wallets`
    });

  } catch (error) {
    console.log(`   ❌ FAIL - ${error.message}`);
    results.failed++;
  }

  // Print Summary
  console.log('\n' + '='.repeat(80));
  console.log('\n📊 TEST SUMMARY\n');
  console.log(`   Total Tests: ${results.tests.length}`);
  console.log(`   ✅ Passed: ${results.passed}`);
  console.log(`   ⚠️ Warnings: ${results.warnings}`);
  console.log(`   ❌ Failed: ${results.failed}`);

  const score = ((results.passed / results.tests.length) * 100).toFixed(1);
  console.log(`\n   🎯 Quality Score: ${score}%`);

  console.log('\n📋 DETAILED RESULTS:\n');
  results.tests.forEach((test, idx) => {
    const icon = test.status === 'PASS' ? '✅' : test.status === 'WARNING' ? '⚠️' : '❌';
    console.log(`   ${idx + 1}. ${icon} ${test.name}`);
    console.log(`      ${test.details}`);
  });

  if (results.failed === 0 && results.warnings === 0) {
    console.log('\n   ✅ ALL TESTS PASSED - DATABASE IS HEALTHY!');
  } else if (results.failed === 0) {
    console.log('\n   ⚠️ All critical tests passed - Minor warnings present');
  } else {
    console.log('\n   ⚠️ Some tests failed - Review above for details');
  }

  console.log('\n' + '='.repeat(80) + '\n');

  return {
    passed: results.passed,
    failed: results.failed,
    warnings: results.warnings,
    score: parseFloat(score)
  };
}

comprehensiveQATestV2().then(result => {
  process.exit(result.failed > 0 ? 1 : 0);
}).catch(console.error);
