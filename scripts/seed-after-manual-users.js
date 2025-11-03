#!/usr/bin/env node

/**
 * ═══════════════════════════════════════════════════════════════
 * SEED SCRIPT - After Manual User Creation
 * Run AFTER creating test users in Supabase Auth Dashboard
 * ═══════════════════════════════════════════════════════════════
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { faker } from '@faker-js/faker';

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function generateReferralCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: 8 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
}

async function seedWithManualUsers() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('🌱 SEED SCRIPT - Using Existing Auth Users');
  console.log('═══════════════════════════════════════════════════════════════\n');

  try {
    // Step 1: Find existing users in auth
    console.log('🔍 Checking for existing users...\n');

    const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers();

    if (listError || !authUsers) {
      console.log('❌ Cannot access auth users. Need SERVICE_ROLE_KEY.');
      console.log('\n💡 MANUAL SETUP REQUIRED:\n');
      console.log('1. Go to: https://supabase.com/dashboard → Authentication → Users');
      console.log('2. Click "Add user"');
      console.log('3. Create user:');
      console.log('   Email: user@finaster.com');
      console.log('   Password: Test123456!');
      console.log('   ✅ Auto Confirm User: YES');
      console.log('\n4. Then run this script again\n');
      process.exit(1);
    }

    console.log(`Found ${authUsers.users.length} auth users\n`);

    // Find or prompt for root user
    let rootUser = authUsers.users.find(u => u.email === 'user@finaster.com');

    if (!rootUser) {
      console.log('❌ Root user (user@finaster.com) not found\n');
      console.log('Please create this user in Supabase Auth Dashboard first.\n');
      process.exit(1);
    }

    console.log(`✅ Found root user: ${rootUser.email}\n`);

    // Step 2: Update root user in users table
    console.log('📝 Setting up root user...\n');

    const { error: updateError } = await supabase
      .from('users')
      .update({
        full_name: 'John Doe',
        role: 'user',
        wallet_balance: 5000,
        total_investment: 10000,
        total_earnings: 0,
        direct_count: 0,
        team_count: 0,
        left_volume: 0,
        right_volume: 0,
        current_rank: 'starter',
        levels_unlocked: 30,
        kyc_status: 'approved',
        is_active: true,
        sponsor_id: null
      })
      .eq('id', rootUser.id);

    if (updateError) {
      console.error('❌ Error updating root user:', updateError.message);
      process.exit(1);
    }

    // Create referral code for root
    await supabase.from('referral_codes').insert({
      user_id: rootUser.id,
      code: generateReferralCode(),
      clicks: 0,
      signups: 0,
      is_active: true
    });

    // Create binary tree node for root
    await supabase.from('binary_tree').insert({
      user_id: rootUser.id,
      parent_id: null,
      level: 0,
      position: 'root',
      left_volume: 0,
      right_volume: 0
    });

    console.log('   ✅ Root user configured\n');

    // Step 3: Generate network using signUp
    console.log('🌳 Creating network (levels 2-30)...\n');

    const allUsers = [{ id: rootUser.id, email: rootUser.email, level: 1 }];
    const TARGET_USERS = 150;
    let currentLevel = 2;

    while (currentLevel <= 30 && allUsers.length < TARGET_USERS) {
      const previousLevelUsers = allUsers.filter(u => u.level === currentLevel - 1);
      if (previousLevelUsers.length === 0) break;

      let levelCount = 0;

      for (const sponsor of previousLevelUsers) {
        const numDirects = randomInt(1, 5);

        for (let i = 0; i < numDirects && allUsers.length < TARGET_USERS; i++) {
          const newEmail = `test${Date.now()}${randomInt(1000, 9999)}@example.com`;
          const newPassword = 'Test123456!';

          // Sign up new user
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: newEmail,
            password: newPassword,
            options: {
              data: {
                full_name: faker.person.fullName(),
              }
            }
          });

          if (signUpError || !signUpData.user) {
            console.log(`   ⚠️  Failed to create ${newEmail}`);
            continue;
          }

          const newUserId = signUpData.user.id;

          // Update user with MLM data
          await supabase
            .from('users')
            .update({
              full_name: faker.person.fullName(),
              role: 'user',
              sponsor_id: sponsor.id,
              wallet_balance: randomInt(0, 5000),
              total_investment: randomInt(100, 50000),
              total_earnings: 0,
              direct_count: 0,
              team_count: 0,
              left_volume: 0,
              right_volume: 0,
              current_rank: 'starter',
              levels_unlocked: 0,
              kyc_status: randomChoice(['approved', 'pending', 'rejected']),
              is_active: true
            })
            .eq('id', newUserId);

          // Create referral code
          await supabase.from('referral_codes').insert({
            user_id: newUserId,
            code: generateReferralCode(),
            clicks: 0,
            signups: 0,
            is_active: true
          });

          // Create referral
          await supabase.from('referrals').insert({
            referrer_id: sponsor.id,
            referee_id: newUserId,
            referral_code: generateReferralCode(),
            status: 'active',
            commission_earned: 0
          });

          // Create binary tree (simplified)
          await supabase.from('binary_tree').insert({
            user_id: newUserId,
            parent_id: sponsor.id,
            level: currentLevel - 1,
            position: randomChoice(['left', 'right']),
            left_volume: 0,
            right_volume: 0
          });

          allUsers.push({ id: newUserId, email: newEmail, level: currentLevel });
          levelCount++;

          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      console.log(`   Level ${currentLevel}: Created ${levelCount} users (Total: ${allUsers.length})`);
      currentLevel++;
    }

    // Step 4: Update team counts
    console.log('\n📊 Updating team counts...\n');

    for (const user of allUsers) {
      const { count } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('sponsor_id', user.id);

      await supabase
        .from('users')
        .update({ direct_count: count || 0, team_count: count || 0 })
        .eq('id', user.id);
    }

    console.log('   ✅ Team counts updated\n');

    // Summary
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ SEED COMPLETE');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log(`👥 Total Users: ${allUsers.length}`);
    console.log(`📊 Levels Created: ${currentLevel - 1}\n`);
    console.log('✓ Test Credentials:');
    console.log('  Email: user@finaster.com');
    console.log('  Password: Test123456!\n');
    console.log('Next: node scripts/verify-mlm-data.js\n');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ SEED FAILED:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

seedWithManualUsers();
