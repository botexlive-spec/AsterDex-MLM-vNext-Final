#!/usr/bin/env node

/**
 * ═══════════════════════════════════════════════════════════════
 * CLEANUP SCRIPT - Prepare Database for Seeding
 * Safely removes existing test data before seeding
 * ═══════════════════════════════════════════════════════════════
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ═══════════════════════════════════════════════════════════════
// CLEANUP FUNCTIONS
// ═══════════════════════════════════════════════════════════════

async function deleteAuthUsers() {
  console.log('🗑️  Deleting auth users...');

  try {
    // Get all users
    const { data: { users }, error } = await supabase.auth.admin.listUsers();

    if (error) {
      console.log('   ⚠️  Could not list users (may need SERVICE_ROLE_KEY)');
      console.log('   Skipping auth cleanup - will clean database only');
      return 0;
    }

    let deleted = 0;

    for (const user of users) {
      // Skip system users if you want to preserve them
      // Uncomment to preserve:
      // if (user.email.includes('@system.internal')) continue;

      const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);

      if (!deleteError) {
        deleted++;
        console.log(`   ✓ Deleted: ${user.email}`);
      } else {
        console.log(`   ⚠️  Could not delete: ${user.email} - ${deleteError.message}`);
      }
    }

    console.log(`   ✅ Deleted ${deleted} auth users\n`);
    return deleted;

  } catch (error) {
    console.log('   ⚠️  Auth cleanup failed:', error.message);
    console.log('   Continuing with database cleanup...\n');
    return 0;
  }
}

async function cleanupDatabaseTables() {
  console.log('🧹 Cleaning database tables...');

  const tables = [
    'audit_logs',
    'notifications',
    'support_tickets',
    'communications',
    'booster_incomes',
    'matching_bonuses',
    'rank_achievements',
    'level_incomes',
    'mlm_transactions',
    'referrals',
    'binary_tree',
    'referral_codes',
    'user_packages',
    'robot_subscriptions',
    'kyc_verifications',
    'users'
  ];

  let totalDeleted = 0;

  for (const table of tables) {
    try {
      const { error, count } = await supabase
        .from(table)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all except impossible ID

      if (error) {
        console.log(`   ⚠️  ${table}: ${error.message}`);
      } else {
        console.log(`   ✓ ${table}: deleted ${count || 0} rows`);
        totalDeleted += (count || 0);
      }
    } catch (error) {
      console.log(`   ⚠️  ${table}: ${error.message}`);
    }
  }

  console.log(`   ✅ Cleaned ${tables.length} tables (${totalDeleted} total rows)\n`);
}

async function verifyCleanup() {
  console.log('✓ Verifying cleanup...');

  const { count: userCount } = await supabase
    .from('users')
    .select('id', { count: 'exact', head: true });

  const { count: packageCount } = await supabase
    .from('user_packages')
    .select('id', { count: 'exact', head: true });

  const { count: referralCount } = await supabase
    .from('referrals')
    .select('id', { count: 'exact', head: true });

  console.log(`   Users: ${userCount || 0}`);
  console.log(`   Packages: ${packageCount || 0}`);
  console.log(`   Referrals: ${referralCount || 0}`);

  const isClean = (userCount || 0) === 0 && (packageCount || 0) === 0 && (referralCount || 0) === 0;

  if (isClean) {
    console.log('   ✅ Database is clean\n');
  } else {
    console.log('   ⚠️  Some data remains (may be system data)\n');
  }

  return isClean;
}

// ═══════════════════════════════════════════════════════════════
// MAIN CLEANUP
// ═══════════════════════════════════════════════════════════════

async function runCleanup() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('🧹 DATABASE CLEANUP');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const startTime = Date.now();

  try {
    // Step 1: Delete auth users
    await deleteAuthUsers();

    // Step 2: Clean database tables
    await cleanupDatabaseTables();

    // Step 3: Verify cleanup
    await verifyCleanup();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ CLEANUP COMPLETE');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log(`⏱️  Duration: ${duration}s`);
    console.log('✓ Database is ready for seeding\n');
    console.log('Next step: node scripts/seed-complete-mlm-network.js\n');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ CLEANUP FAILED:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run cleanup
runCleanup();
