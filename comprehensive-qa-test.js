import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dsgtyrwtlpnckvcozfbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzZ3R5cnd0bHBuY2t2Y296ZmJjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTg0MTQwNywiZXhwIjoyMDc3NDE3NDA3fQ.O6HLc6lQHgFkYpb1scfBGa2iaWwfo3yXIxHlbGEyOxg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function comprehensiveQATest() {
  console.log('\n🧪 COMPREHENSIVE QA TEST SUITE\n');
  console.log('='.repeat(80));

  const results = {
    passed: 0,
    failed: 0,
    warnings: 0,
    tests: []
  };

  // Test 1: Check Users Table Integrity
  console.log('\n📋 TEST 1: Users Table Integrity');
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('*');

    if (error) throw error;

    const issues = [];

    // Check for duplicate emails
    const emails = users.map(u => u.email);
    const duplicateEmails = emails.filter((e, i) => emails.indexOf(e) !== i);
    if (duplicateEmails.length > 0) {
      issues.push(`Duplicate emails found: ${duplicateEmails.join(', ')}`);
    }

    // Check for orphaned referrals
    const sponsorIds = users.map(u => u.sponsor_id).filter(id => id);
    const userIds = users.map(u => u.id);
    const orphanedSponsors = sponsorIds.filter(sid => !userIds.includes(sid));
    if (orphanedSponsors.length > 0) {
      issues.push(`Orphaned sponsor IDs: ${orphanedSponsors.length}`);
    }

    // Check for users without wallets
    const { data: wallets } = await supabase
      .from('wallets')
      .select('user_id');

    const walletUserIds = wallets?.map(w => w.user_id) || [];
    const usersWithoutWallets = users.filter(u => !walletUserIds.includes(u.id));
    if (usersWithoutWallets.length > 0) {
      issues.push(`Users without wallets: ${usersWithoutWallets.length}`);
    }

    if (issues.length === 0) {
      console.log('   ✅ PASS - All users have valid data');
      results.passed++;
    } else {
      console.log('   ⚠️ WARNING - Issues found:');
      issues.forEach(i => console.log(`      - ${i}`));
      results.warnings++;
    }

    results.tests.push({ name: 'Users Table Integrity', status: issues.length === 0 ? 'PASS' : 'WARNING', issues });

  } catch (error) {
    console.log(`   ❌ FAIL - ${error.message}`);
    results.failed++;
    results.tests.push({ name: 'Users Table Integrity', status: 'FAIL', error: error.message });
  }

  // Test 2: Check Binary Tree Structure
  console.log('\n📋 TEST 2: Binary Tree Structure');
  try {
    const { data: nodes, error } = await supabase
      .from('binary_nodes')
      .select('*');

    if (error) throw error;

    const issues = [];

    // Check for duplicate positions
    const positions = nodes.map(n => `${n.parent_id}-${n.position}`);
    const duplicates = positions.filter((p, i) => positions.indexOf(p) !== i);
    if (duplicates.length > 0) {
      issues.push(`Duplicate positions: ${duplicates.length}`);
    }

    // Check for orphaned nodes
    const nodeUserIds = nodes.map(n => n.user_id);
    const { data: users } = await supabase.from('users').select('id');
    const userIds = users?.map(u => u.id) || [];
    const orphanedNodes = nodeUserIds.filter(uid => !userIds.includes(uid));
    if (orphanedNodes.length > 0) {
      issues.push(`Orphaned nodes: ${orphanedNodes.length}`);
    }

    // Check for circular references
    for (const node of nodes) {
      if (node.parent_id === node.user_id) {
        issues.push(`Circular reference detected for user: ${node.user_id}`);
      }
    }

    if (issues.length === 0) {
      console.log('   ✅ PASS - Binary tree structure is valid');
      results.passed++;
    } else {
      console.log('   ⚠️ WARNING - Issues found:');
      issues.forEach(i => console.log(`      - ${i}`));
      results.warnings++;
    }

    results.tests.push({ name: 'Binary Tree Structure', status: issues.length === 0 ? 'PASS' : 'WARNING', issues });

  } catch (error) {
    console.log(`   ❌ FAIL - ${error.message}`);
    results.failed++;
    results.tests.push({ name: 'Binary Tree Structure', status: 'FAIL', error: error.message });
  }

  // Test 3: Check Packages Configuration
  console.log('\n📋 TEST 3: Packages Configuration');
  try {
    const { data: packages, error } = await supabase
      .from('packages')
      .select('*');

    if (error) throw error;

    const issues = [];

    if (packages.length === 0) {
      issues.push('No packages configured');
    }

    // Check package prices
    packages.forEach(pkg => {
      if (!pkg.price || pkg.price <= 0) {
        issues.push(`Package ${pkg.name} has invalid price: ${pkg.price}`);
      }
      if (!pkg.roi_percentage || pkg.roi_percentage <= 0) {
        issues.push(`Package ${pkg.name} has invalid ROI: ${pkg.roi_percentage}`);
      }
      if (!pkg.duration_days || pkg.duration_days <= 0) {
        issues.push(`Package ${pkg.name} has invalid duration: ${pkg.duration_days}`);
      }
    });

    if (issues.length === 0) {
      console.log(`   ✅ PASS - ${packages.length} packages configured correctly`);
      results.passed++;
    } else {
      console.log('   ⚠️ WARNING - Issues found:');
      issues.forEach(i => console.log(`      - ${i}`));
      results.warnings++;
    }

    results.tests.push({ name: 'Packages Configuration', status: issues.length === 0 ? 'PASS' : 'WARNING', issues });

  } catch (error) {
    console.log(`   ❌ FAIL - ${error.message}`);
    results.failed++;
    results.tests.push({ name: 'Packages Configuration', status: 'FAIL', error: error.message });
  }

  // Test 4: Check Commission Settings
  console.log('\n📋 TEST 4: Commission Settings');
  try {
    const { data: settings, error } = await supabase
      .from('commission_settings')
      .select('*');

    if (error) throw error;

    const issues = [];

    if (!settings || settings.length === 0) {
      issues.push('No commission settings configured');
    } else {
      const setting = settings[0];
      if (!setting.direct_commission_rate || setting.direct_commission_rate <= 0) {
        issues.push('Invalid direct commission rate');
      }
      if (!setting.binary_bonus_rate || setting.binary_bonus_rate <= 0) {
        issues.push('Invalid binary bonus rate');
      }
    }

    if (issues.length === 0) {
      console.log('   ✅ PASS - Commission settings configured correctly');
      results.passed++;
    } else {
      console.log('   ⚠️ WARNING - Issues found:');
      issues.forEach(i => console.log(`      - ${i}`));
      results.warnings++;
    }

    results.tests.push({ name: 'Commission Settings', status: issues.length === 0 ? 'PASS' : 'WARNING', issues });

  } catch (error) {
    console.log(`   ❌ FAIL - ${error.message}`);
    results.failed++;
    results.tests.push({ name: 'Commission Settings', status: 'FAIL', error: error.message });
  }

  // Test 5: Check Rank Rewards
  console.log('\n📋 TEST 5: Rank Rewards Configuration');
  try {
    const { data: ranks, error } = await supabase
      .from('rank_rewards')
      .select('*')
      .order('minimum_investment');

    if (error) throw error;

    const issues = [];

    if (ranks.length === 0) {
      issues.push('No rank rewards configured');
    }

    // Check rank progression
    let lastInvestment = 0;
    ranks.forEach((rank, idx) => {
      if (rank.minimum_investment <= lastInvestment && idx > 0) {
        issues.push(`Rank ${rank.rank_name} has invalid investment requirement`);
      }
      lastInvestment = rank.minimum_investment;

      if (!rank.reward_amount || rank.reward_amount < 0) {
        issues.push(`Rank ${rank.rank_name} has invalid reward amount`);
      }
    });

    if (issues.length === 0) {
      console.log(`   ✅ PASS - ${ranks.length} rank tiers configured correctly`);
      results.passed++;
    } else {
      console.log('   ⚠️ WARNING - Issues found:');
      issues.forEach(i => console.log(`      - ${i}`));
      results.warnings++;
    }

    results.tests.push({ name: 'Rank Rewards Configuration', status: issues.length === 0 ? 'PASS' : 'WARNING', issues });

  } catch (error) {
    console.log(`   ❌ FAIL - ${error.message}`);
    results.failed++;
    results.tests.push({ name: 'Rank Rewards Configuration', status: 'FAIL', error: error.message });
  }

  // Test 6: Check Referral Consistency
  console.log('\n📋 TEST 6: Referral Consistency');
  try {
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, sponsor_id');

    const { data: referrals, error: referralsError } = await supabase
      .from('referrals')
      .select('*');

    if (usersError) throw usersError;
    if (referralsError) throw referralsError;

    const issues = [];

    // Check if all sponsorships have referral records
    const usersWithSponsors = users.filter(u => u.sponsor_id);
    const referralMap = {};
    referrals.forEach(r => {
      referralMap[`${r.sponsor_id}-${r.referred_id}`] = true;
    });

    let missingReferrals = 0;
    usersWithSponsors.forEach(user => {
      const key = `${user.sponsor_id}-${user.id}`;
      if (!referralMap[key]) {
        missingReferrals++;
      }
    });

    if (missingReferrals > 0) {
      issues.push(`${missingReferrals} users missing referral records`);
    }

    // Check for orphaned referrals
    const userIds = users.map(u => u.id);
    const orphanedReferrals = referrals.filter(r =>
      !userIds.includes(r.sponsor_id) || !userIds.includes(r.referred_id)
    );
    if (orphanedReferrals.length > 0) {
      issues.push(`${orphanedReferrals.length} orphaned referral records`);
    }

    if (issues.length === 0) {
      console.log('   ✅ PASS - Referral data is consistent');
      results.passed++;
    } else {
      console.log('   ⚠️ WARNING - Issues found:');
      issues.forEach(i => console.log(`      - ${i}`));
      results.warnings++;
    }

    results.tests.push({ name: 'Referral Consistency', status: issues.length === 0 ? 'PASS' : 'WARNING', issues });

  } catch (error) {
    console.log(`   ❌ FAIL - ${error.message}`);
    results.failed++;
    results.tests.push({ name: 'Referral Consistency', status: 'FAIL', error: error.message });
  }

  // Test 7: Check Wallet Balances
  console.log('\n📋 TEST 7: Wallet Balances');
  try {
    const { data: wallets, error } = await supabase
      .from('wallets')
      .select('*');

    if (error) throw error;

    const issues = [];

    // Check for negative balances
    const negativeBalances = wallets.filter(w =>
      (w.balance && w.balance < 0) ||
      (w.total_earned && w.total_earned < 0) ||
      (w.total_withdrawn && w.total_withdrawn < 0)
    );

    if (negativeBalances.length > 0) {
      issues.push(`${negativeBalances.length} wallets with negative balances`);
    }

    // Check for duplicate wallets
    const userIds = wallets.map(w => w.user_id);
    const duplicateUserIds = userIds.filter((id, i) => userIds.indexOf(id) !== i);
    if (duplicateUserIds.length > 0) {
      issues.push(`${duplicateUserIds.length} users with duplicate wallets`);
    }

    if (issues.length === 0) {
      console.log(`   ✅ PASS - All ${wallets.length} wallets are valid`);
      results.passed++;
    } else {
      console.log('   ⚠️ WARNING - Issues found:');
      issues.forEach(i => console.log(`      - ${i}`));
      results.warnings++;
    }

    results.tests.push({ name: 'Wallet Balances', status: issues.length === 0 ? 'PASS' : 'WARNING', issues });

  } catch (error) {
    console.log(`   ❌ FAIL - ${error.message}`);
    results.failed++;
    results.tests.push({ name: 'Wallet Balances', status: 'FAIL', error: error.message });
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

  if (results.failed === 0) {
    console.log('\n   ✅ All critical tests passed!');
  } else {
    console.log('\n   ⚠️ Some tests failed - review above for details');
  }

  console.log('\n' + '='.repeat(80) + '\n');
}

comprehensiveQATest().catch(console.error);
