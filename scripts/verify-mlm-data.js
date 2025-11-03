#!/usr/bin/env node

/**
 * ═══════════════════════════════════════════════════════════════
 * MLM DATA VERIFICATION SCRIPT
 * Verifies database integrity and generates test report
 * ═══════════════════════════════════════════════════════════════
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { writeFileSync } from 'fs';

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const testResults = {
  timestamp: new Date().toISOString(),
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: []
};

function logTest(name, passed, message, data = null) {
  const result = {
    name,
    passed,
    message,
    data
  };

  testResults.tests.push(result);

  if (passed) {
    testResults.passed++;
    console.log(`   ✅ ${name}: ${message}`);
  } else {
    testResults.failed++;
    console.log(`   ❌ ${name}: ${message}`);
  }

  if (data) {
    console.log(`      Data:`, JSON.stringify(data, null, 2));
  }
}

function logWarning(name, message, data = null) {
  testResults.warnings++;
  testResults.tests.push({ name, passed: null, message, data });
  console.log(`   ⚠️  ${name}: ${message}`);
}

// ═══════════════════════════════════════════════════════════════
// VERIFICATION TESTS
// ═══════════════════════════════════════════════════════════════

async function verifyUserCount() {
  const { count, error } = await supabase
    .from('users')
    .select('id', { count: 'exact', head: true });

  if (error) {
    logTest('User Count', false, `Database error: ${error.message}`);
    return 0;
  }

  const passed = count > 0;
  logTest('User Count', passed, `${count} users in database`, { count });
  return count;
}

async function verifyLevelDistribution() {
  // Get all users with their sponsors
  const { data: users, error } = await supabase
    .from('users')
    .select('id, email, sponsor_id')
    .order('created_at');

  if (error) {
    logTest('Level Distribution', false, `Error: ${error.message}`);
    return {};
  }

  // Calculate levels
  const userLevels = {};
  const levelCounts = {};

  // Find root users (no sponsor)
  users.forEach(user => {
    if (!user.sponsor_id) {
      userLevels[user.id] = 1;
    }
  });

  // Calculate levels iteratively
  let changed = true;
  let iterations = 0;
  const maxIterations = 50;

  while (changed && iterations < maxIterations) {
    changed = false;
    iterations++;

    users.forEach(user => {
      if (userLevels[user.id]) return; // Already has level

      if (user.sponsor_id && userLevels[user.sponsor_id]) {
        userLevels[user.id] = userLevels[user.sponsor_id] + 1;
        changed = true;
      }
    });
  }

  // Count users per level
  Object.values(userLevels).forEach(level => {
    levelCounts[level] = (levelCounts[level] || 0) + 1;
  });

  const maxLevel = Math.max(...Object.keys(levelCounts).map(Number));
  const orphans = users.length - Object.keys(userLevels).length;

  logTest('Level Distribution', orphans === 0, `Found ${maxLevel} levels`, {
    levelCounts,
    orphans,
    totalUsers: users.length
  });

  if (orphans > 0) {
    logWarning('Orphan Users', `${orphans} users without proper sponsor chain`);
  }

  return levelCounts;
}

async function verifyBinaryTree() {
  const { data: treeNodes, error } = await supabase
    .from('binary_tree')
    .select('user_id, parent_id, left_child_id, right_child_id, position');

  if (error) {
    logTest('Binary Tree', false, `Error: ${error.message}`);
    return;
  }

  const nodeCount = treeNodes.length;
  let orphanNodes = 0;
  let invalidPlacements = 0;

  treeNodes.forEach(node => {
    // Check if node has parent but parent doesn't reference it
    if (node.parent_id) {
      const parent = treeNodes.find(n => n.user_id === node.parent_id);
      if (parent) {
        const isReferenced = parent.left_child_id === node.user_id || parent.right_child_id === node.user_id;
        if (!isReferenced) {
          invalidPlacements++;
        }
      } else {
        orphanNodes++;
      }
    }
  });

  const passed = orphanNodes === 0 && invalidPlacements === 0;
  logTest('Binary Tree Structure', passed, `${nodeCount} nodes validated`, {
    totalNodes: nodeCount,
    orphanNodes,
    invalidPlacements
  });
}

async function verifyReferralCodes() {
  const { count: userCount } = await supabase
    .from('users')
    .select('id', { count: 'exact', head: true });

  const { count: codeCount } = await supabase
    .from('referral_codes')
    .select('user_id', { count: 'exact', head: true });

  const passed = codeCount >= userCount;
  logTest('Referral Codes', passed, `${codeCount} codes for ${userCount} users`, {
    userCount,
    codeCount,
    coverage: ((codeCount / userCount) * 100).toFixed(2) + '%'
  });
}

async function verifyPackages() {
  const { count: userCount } = await supabase
    .from('users')
    .select('id', { count: 'exact', head: true });

  const { count: packageCount } = await supabase
    .from('user_packages')
    .select('user_id', { count: 'exact', head: true });

  const coverage = (packageCount / userCount * 100).toFixed(2);
  const passed = packageCount > 0;

  logTest('Package Purchases', passed, `${packageCount} packages purchased`, {
    userCount,
    packageCount,
    coverage: coverage + '%'
  });

  // Check investment totals
  const { data: users } = await supabase
    .from('users')
    .select('id, total_investment')
    .gt('total_investment', 0);

  logTest('Investment Data', users.length > 0, `${users?.length || 0} users with investments`);
}

async function verifyRobotSubscriptions() {
  const { count: userCount } = await supabase
    .from('users')
    .select('id', { count: 'exact', head: true });

  const { count: robotCount } = await supabase
    .from('robot_subscriptions')
    .select('user_id', { count: 'exact', head: true });

  const coverage = (robotCount / userCount * 100).toFixed(2);

  logTest('Robot Subscriptions', robotCount > 0, `${robotCount} active subscriptions`, {
    userCount,
    robotCount,
    coverage: coverage + '%'
  });
}

async function verifyTeamCounts() {
  const { data: users } = await supabase
    .from('users')
    .select('id, email, direct_count, team_count, sponsor_id');

  let incorrectCounts = 0;

  for (const user of users) {
    const { count: actualDirects } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('sponsor_id', user.id);

    if (actualDirects !== user.direct_count) {
      incorrectCounts++;
    }
  }

  const passed = incorrectCounts === 0;
  logTest('Team Counts', passed, `Verified ${users.length} users`, {
    totalUsers: users.length,
    incorrectCounts
  });

  if (incorrectCounts > 0) {
    logWarning('Team Count Accuracy', `${incorrectCounts} users have incorrect team counts`);
  }
}

async function verifyKYCStatus() {
  const { data: statuses, error } = await supabase
    .rpc('count_by_kyc_status');

  if (error) {
    // Fallback
    const { data: users } = await supabase
      .from('users')
      .select('kyc_status');

    const distribution = {};
    users.forEach(u => {
      distribution[u.kyc_status] = (distribution[u.kyc_status] || 0) + 1;
    });

    logTest('KYC Status Distribution', true, 'Verified KYC statuses', distribution);
    return;
  }

  logTest('KYC Status Distribution', true, 'Verified KYC statuses', statuses);
}

async function verifyDataIntegrity() {
  // Check for duplicate emails
  const { data: emails } = await supabase
    .from('users')
    .select('email');

  const emailSet = new Set(emails.map(u => u.email));
  const duplicates = emails.length - emailSet.size;

  logTest('Email Uniqueness', duplicates === 0, `${duplicates} duplicate emails found`, { duplicates });

  // Check for orphan referrals
  const { data: referrals } = await supabase
    .from('referrals')
    .select('referrer_id, referee_id');

  let orphanReferrals = 0;

  for (const ref of referrals) {
    const { data: referrer } = await supabase
      .from('users')
      .select('id')
      .eq('id', ref.referrer_id)
      .single();

    const { data: referee } = await supabase
      .from('users')
      .select('id')
      .eq('id', ref.referee_id)
      .single();

    if (!referrer || !referee) {
      orphanReferrals++;
    }
  }

  logTest('Referral Integrity', orphanReferrals === 0, `${orphanReferrals} orphan referrals`, { orphanReferrals });
}

// ═══════════════════════════════════════════════════════════════
// SUMMARY AND REPORT GENERATION
// ═══════════════════════════════════════════════════════════════

async function generateSummary() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('📊 TEST SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Get statistics
  const { count: totalUsers } = await supabase.from('users').select('id', { count: 'exact', head: true });
  const { count: totalPackages } = await supabase.from('user_packages').select('id', { count: 'exact', head: true });
  const { count: totalReferrals } = await supabase.from('referrals').select('id', { count: 'exact', head: true });
  const { count: totalBinaryNodes } = await supabase.from('binary_tree').select('user_id', { count: 'exact', head: true });

  const { data: investments } = await supabase
    .from('users')
    .select('total_investment');

  const totalInvestment = investments.reduce((sum, u) => sum + (u.total_investment || 0), 0);

  console.log('📈 Database Statistics:');
  console.log(`   Total Users: ${totalUsers}`);
  console.log(`   Total Packages: ${totalPackages}`);
  console.log(`   Total Referrals: ${totalReferrals}`);
  console.log(`   Binary Tree Nodes: ${totalBinaryNodes}`);
  console.log(`   Total Investment: $${totalInvestment.toLocaleString()}`);

  console.log(`\n✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`⚠️  Warnings: ${testResults.warnings}`);

  const successRate = ((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(2);
  console.log(`\n📊 Success Rate: ${successRate}%`);

  testResults.summary = {
    totalUsers,
    totalPackages,
    totalReferrals,
    totalBinaryNodes,
    totalInvestment,
    successRate: parseFloat(successRate)
  };

  // Save report
  const reportPath = 'test-report.json';
  writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
  console.log(`\n📄 Report saved: ${reportPath}`);

  console.log('\n═══════════════════════════════════════════════════════════════\n');
}

// ═══════════════════════════════════════════════════════════════
// MAIN VERIFICATION
// ═══════════════════════════════════════════════════════════════

async function runVerification() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('🔍 MLM DATA VERIFICATION');
  console.log('═══════════════════════════════════════════════════════════════\n');

  console.log('📋 Running verification tests...\n');

  await verifyUserCount();
  await verifyLevelDistribution();
  await verifyBinaryTree();
  await verifyReferralCodes();
  await verifyPackages();
  await verifyRobotSubscriptions();
  await verifyTeamCounts();
  await verifyKYCStatus();
  await verifyDataIntegrity();

  await generateSummary();

  if (testResults.failed > 0) {
    console.log('❌ Verification FAILED - Please review errors above\n');
    process.exit(1);
  } else {
    console.log('✅ Verification PASSED - Database is ready for testing\n');
    process.exit(0);
  }
}

// Run verification
runVerification().catch(error => {
  console.error('\n❌ Verification script failed:', error.message);
  process.exit(1);
});
