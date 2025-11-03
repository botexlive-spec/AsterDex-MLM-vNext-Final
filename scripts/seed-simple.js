#!/usr/bin/env node

/**
 * ═══════════════════════════════════════════════════════════════
 * SIMPLE MLM SEED SCRIPT
 * Works without Auth API - uses manual user insertion
 * ═══════════════════════════════════════════════════════════════
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { faker } from '@faker-js/faker';
import { randomUUID } from 'crypto';

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

// Generate UUID
function generateUUID() {
  return randomUUID();
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function generateReferralCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

async function seedData() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('🌱 SIMPLE MLM SEED SCRIPT');
  console.log('═══════════════════════════════════════════════════════════════\n');

  try {
    // Create root user directly in database
    const rootUserId = generateUUID();
    const rootEmail = 'user@finaster.com';

    console.log('👤 Creating root user...');

    const { error: rootError } = await supabase
      .from('users')
      .insert({
        id: rootUserId,
        email: rootEmail,
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
        is_active: true
      });

    if (rootError) {
      console.error('   ❌ Error creating root user:', rootError.message);
      console.log('\n💡 Try this: Go to Supabase Dashboard → Authentication → Users');
      console.log('   1. Create a new user with email: user@finaster.com');
      console.log('   2. Then run this script again\n');
      process.exit(1);
    }

    console.log(`   ✅ Created: ${rootEmail}`);

    // Create referral code
    await supabase.from('referral_codes').insert({
      user_id: rootUserId,
      code: generateReferralCode(),
      clicks: 0,
      signups: 0,
      is_active: true
    });

    // Create binary tree node
    await supabase.from('binary_tree').insert({
      user_id: rootUserId,
      parent_id: null,
      level: 0,
      position: 'root',
      left_volume: 0,
      right_volume: 0
    });

    console.log('\n🌳 Creating network (30 levels)...\n');

    let allUsers = [{ id: rootUserId, email: rootEmail, level: 1 }];
    let currentLevel = 2;
    const maxUsers = 150;

    while (currentLevel <= 30 && allUsers.length < maxUsers) {
      const previousLevelUsers = allUsers.filter(u => u.level === currentLevel - 1);
      if (previousLevelUsers.length === 0) break;

      let levelUsers = [];

      for (const sponsor of previousLevelUsers) {
        const numDirects = randomInt(1, 5);

        for (let i = 0; i < numDirects && allUsers.length < maxUsers; i++) {
          const newUserId = generateUUID();
          const newEmail = faker.internet.email().toLowerCase();

          const { error } = await supabase
            .from('users')
            .insert({
              id: newUserId,
              email: newEmail,
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
            });

          if (!error) {
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

            levelUsers.push({ id: newUserId, email: newEmail, level: currentLevel });
            allUsers.push({ id: newUserId, email: newEmail, level: currentLevel });
          }
        }
      }

      console.log(`   Level ${currentLevel}: Created ${levelUsers.length} users (Total: ${allUsers.length})`);
      currentLevel++;
    }

    // Update team counts
    console.log('\n📊 Updating team counts...');

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

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ SEED COMPLETE');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log(`👥 Total Users: ${allUsers.length}`);
    console.log(`📊 Levels Created: ${currentLevel - 1}`);
    console.log(`\n✓ Test User: ${rootEmail}`);
    console.log(`✓ Password: Test123456! (set in Supabase Auth)`);
    console.log('\n📝 Next: Create auth user in Supabase Dashboard');
    console.log('   Then run: node scripts/verify-mlm-data.js\n');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ SEED FAILED:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

seedData();
