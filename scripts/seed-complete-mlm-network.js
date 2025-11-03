#!/usr/bin/env node

/**
 * ═══════════════════════════════════════════════════════════════
 * COMPLETE MLM NETWORK SEED SCRIPT
 * Generates realistic 30-level MLM network with 100-200 users
 * ═══════════════════════════════════════════════════════════════
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { faker } from '@faker-js/faker';

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ═══════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════

const CONFIG = {
  ROOT_USER: {
    email: 'user@finaster.com',
    password: 'Test123456!',
    full_name: 'John Doe',
    role: 'user'
  },
  ADMIN_USER: {
    email: 'admin@finaster.com',
    password: 'Admin123456!',
    full_name: 'Admin User',
    role: 'admin'
  },
  MAX_LEVELS: 30,
  TARGET_USERS: 150,
  DIRECT_REFERRALS_RANGE: [1, 8], // Each user sponsors 1-8 directs
  PACKAGE_IDS: ['starter', 'growth', 'premium', 'elite'],
  INVESTMENT_RANGES: {
    starter: [100, 500],
    growth: [501, 2000],
    premium: [2001, 10000],
    elite: [10001, 50000]
  },
  ROBOT_SUBSCRIPTION_RATE: 0.7, // 70% have active robot
  KYC_STATUS_DISTRIBUTION: {
    approved: 0.6,
    pending: 0.25,
    rejected: 0.15
  }
};

// ═══════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomDate(startDaysAgo, endDaysAgo = 0) {
  const now = new Date();
  const start = new Date(now.getTime() - startDaysAgo * 24 * 60 * 60 * 1000);
  const end = new Date(now.getTime() - endDaysAgo * 24 * 60 * 60 * 1000);
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generateReferralCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function getKYCStatus() {
  const rand = Math.random();
  if (rand < CONFIG.KYC_STATUS_DISTRIBUTION.approved) return 'approved';
  if (rand < CONFIG.KYC_STATUS_DISTRIBUTION.approved + CONFIG.KYC_STATUS_DISTRIBUTION.pending) return 'pending';
  return 'rejected';
}

// ═══════════════════════════════════════════════════════════════
// USER CREATION
// ═══════════════════════════════════════════════════════════════

async function createUser(userData) {
  try {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password || 'Test123456!',
      email_confirm: true,
      user_metadata: {
        full_name: userData.full_name,
        role: userData.role || 'user'
      }
    });

    if (authError) {
      console.error(`   ❌ Auth error for ${userData.email}:`, authError.message);
      return null;
    }

    const userId = authData.user.id;

    // Update users table
    const { error: updateError } = await supabase
      .from('users')
      .update({
        full_name: userData.full_name,
        role: userData.role || 'user',
        sponsor_id: userData.sponsor_id || null,
        wallet_balance: userData.wallet_balance || 0,
        total_investment: userData.total_investment || 0,
        total_earnings: userData.total_earnings || 0,
        direct_count: 0,
        team_count: 0,
        left_volume: 0,
        right_volume: 0,
        current_rank: 'starter',
        levels_unlocked: userData.levels_unlocked || 0,
        kyc_status: userData.kyc_status || 'pending',
        is_active: true,
        created_at: userData.created_at || new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) {
      console.error(`   ❌ Update error for ${userData.email}:`, updateError.message);
      return null;
    }

    return { id: userId, ...userData };
  } catch (error) {
    console.error(`   ❌ Error creating user ${userData.email}:`, error.message);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════
// REFERRAL CODE CREATION
// ═══════════════════════════════════════════════════════════════

async function createReferralCode(userId) {
  const code = generateReferralCode();
  const { error } = await supabase
    .from('referral_codes')
    .insert({
      user_id: userId,
      code: code,
      clicks: randomInt(0, 50),
      signups: 0,
      is_active: true
    });

  if (error) {
    console.error(`   ⚠️  Referral code error:`, error.message);
  }
  return code;
}

// ═══════════════════════════════════════════════════════════════
// BINARY TREE PLACEMENT
// ═══════════════════════════════════════════════════════════════

async function findBinaryPlacement(sponsorId) {
  // Simple placement: alternate left/right
  const { data: sponsorTree } = await supabase
    .from('binary_tree')
    .select('*')
    .eq('user_id', sponsorId)
    .single();

  if (!sponsorTree) {
    return { parentId: sponsorId, position: 'root', level: 0 };
  }

  // Check left first
  if (!sponsorTree.left_child_id) {
    return { parentId: sponsorId, position: 'left', level: sponsorTree.level + 1 };
  }

  // Then right
  if (!sponsorTree.right_child_id) {
    return { parentId: sponsorId, position: 'right', level: sponsorTree.level + 1 };
  }

  // Both filled - place under a child (BFS)
  const queue = [sponsorTree.left_child_id, sponsorTree.right_child_id];

  while (queue.length > 0) {
    const currentUserId = queue.shift();
    const { data: currentNode } = await supabase
      .from('binary_tree')
      .select('*')
      .eq('user_id', currentUserId)
      .single();

    if (!currentNode) continue;

    if (!currentNode.left_child_id) {
      return { parentId: currentUserId, position: 'left', level: currentNode.level + 1 };
    }
    if (!currentNode.right_child_id) {
      return { parentId: currentUserId, position: 'right', level: currentNode.level + 1 };
    }

    queue.push(currentNode.left_child_id, currentNode.right_child_id);
  }

  return { parentId: sponsorId, position: 'left', level: sponsorTree.level + 1 };
}

async function placeBinaryTree(userId, placement) {
  await supabase
    .from('binary_tree')
    .insert({
      user_id: userId,
      parent_id: placement.position === 'root' ? null : placement.parentId,
      level: placement.level,
      position: placement.position,
      left_volume: 0,
      right_volume: 0
    });

  if (placement.position !== 'root') {
    const updateField = placement.position === 'left' ? 'left_child_id' : 'right_child_id';
    await supabase
      .from('binary_tree')
      .update({ [updateField]: userId })
      .eq('user_id', placement.parentId);
  }
}

// ═══════════════════════════════════════════════════════════════
// PACKAGE PURCHASE
// ═══════════════════════════════════════════════════════════════

async function purchasePackage(userId, packageType, purchaseDate) {
  const [minAmount, maxAmount] = CONFIG.INVESTMENT_RANGES[packageType];
  const amount = randomInt(minAmount, maxAmount);

  // Get package ID
  const { data: packages } = await supabase
    .from('packages')
    .select('id')
    .eq('name', packageType.charAt(0).toUpperCase() + packageType.slice(1))
    .single();

  if (!packages) return 0;

  const roiPercentage = randomFloat(0.5, 2.0); // 0.5% - 2.0% daily ROI

  await supabase
    .from('user_packages')
    .insert({
      user_id: userId,
      package_id: packages.id,
      amount: amount,
      roi_percentage: roiPercentage,
      roi_earned: 0,
      is_active: true,
      purchased_at: purchaseDate.toISOString()
    });

  return amount;
}

// ═══════════════════════════════════════════════════════════════
// ROBOT SUBSCRIPTION
// ═══════════════════════════════════════════════════════════════

async function createRobotSubscription(userId, startDate) {
  if (Math.random() > CONFIG.ROBOT_SUBSCRIPTION_RATE) return;

  const expiresAt = new Date(startDate);
  expiresAt.setDate(expiresAt.getDate() + 30);

  await supabase
    .from('robot_subscriptions')
    .insert({
      user_id: userId,
      amount: 100,
      expires_at: expiresAt.toISOString(),
      is_active: true,
      created_at: startDate.toISOString()
    });

  await supabase
    .from('users')
    .update({
      robot_subscription_active: true,
      robot_subscription_expires_at: expiresAt.toISOString()
    })
    .eq('id', userId);
}

// ═══════════════════════════════════════════════════════════════
// MAIN SEED FUNCTION
// ═══════════════════════════════════════════════════════════════

async function seedMLMNetwork() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('🌱 MLM NETWORK SEED SCRIPT - 30 LEVELS');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const startTime = Date.now();
  const usersByLevel = {};
  const allUsers = [];

  try {
    // ═══════════════════════════════════════════════════════════════
    // 1. CREATE ROOT & ADMIN USERS
    // ═══════════════════════════════════════════════════════════════

    console.log('👤 Creating system users...\n');

    // Create admin
    const adminUser = await createUser({
      ...CONFIG.ADMIN_USER,
      created_at: getRandomDate(365, 300),
      kyc_status: 'approved',
      levels_unlocked: 30,
      wallet_balance: 10000
    });

    if (!adminUser) {
      throw new Error('Failed to create admin user');
    }

    await createReferralCode(adminUser.id);
    await placeBinaryTree(adminUser.id, { parentId: adminUser.id, position: 'root', level: 0 });
    console.log(`   ✅ Admin created: ${adminUser.email}`);

    // Create root user (Level 1)
    const rootUser = await createUser({
      ...CONFIG.ROOT_USER,
      sponsor_id: null,
      created_at: getRandomDate(180, 150),
      kyc_status: 'approved',
      levels_unlocked: 30,
      wallet_balance: 5000
    });

    if (!rootUser) {
      throw new Error('Failed to create root user');
    }

    await createReferralCode(rootUser.id);
    await placeBinaryTree(rootUser.id, { parentId: rootUser.id, position: 'root', level: 0 });

    // Purchase package for root
    const rootInvestment = await purchasePackage(rootUser.id, 'premium', new Date(rootUser.created_at));
    await supabase.from('users').update({ total_investment: rootInvestment }).eq('id', rootUser.id);
    await createRobotSubscription(rootUser.id, new Date(rootUser.created_at));

    usersByLevel[1] = [rootUser];
    allUsers.push(rootUser);

    console.log(`   ✅ Root user created: ${rootUser.email}\n`);
    console.log('═══════════════════════════════════════════════════════════════\n');

    // ═══════════════════════════════════════════════════════════════
    // 2. GENERATE NETWORK (Levels 2-30)
    // ═══════════════════════════════════════════════════════════════

    console.log('🌳 Generating MLM network...\n');

    let totalUsersCreated = 1; // Starting with root
    let currentLevel = 2;

    while (currentLevel <= CONFIG.MAX_LEVELS && totalUsersCreated < CONFIG.TARGET_USERS) {
      const previousLevel = usersByLevel[currentLevel - 1] || [];
      if (previousLevel.length === 0) break;

      usersByLevel[currentLevel] = [];

      for (const sponsor of previousLevel) {
        // Each sponsor gets 1-8 direct referrals
        const numDirects = randomInt(...CONFIG.DIRECT_REFERRALS_RANGE);

        for (let i = 0; i < numDirects && totalUsersCreated < CONFIG.TARGET_USERS; i++) {
          const joinDate = getRandomDate(150, 1);
          const newUser = await createUser({
            email: faker.internet.email().toLowerCase(),
            password: 'Test123456!',
            full_name: faker.person.fullName(),
            sponsor_id: sponsor.id,
            created_at: joinDate,
            kyc_status: getKYCStatus(),
            levels_unlocked: 0,
            wallet_balance: randomInt(0, 5000)
          });

          if (!newUser) continue;

          // Create referral code
          await createReferralCode(newUser.id);

          // Binary placement
          const placement = await findBinaryPlacement(sponsor.id);
          await placeBinaryTree(newUser.id, placement);

          // Package purchase
          const packageType = randomChoice(CONFIG.PACKAGE_IDS);
          const investment = await purchasePackage(newUser.id, packageType, joinDate);
          await supabase.from('users').update({ total_investment: investment }).eq('id', newUser.id);

          // Robot subscription
          await createRobotSubscription(newUser.id, joinDate);

          // Create referral record
          await supabase.from('referrals').insert({
            referrer_id: sponsor.id,
            referee_id: newUser.id,
            referral_code: await createReferralCode(newUser.id),
            status: 'active',
            commission_earned: 0
          });

          usersByLevel[currentLevel].push(newUser);
          allUsers.push(newUser);
          totalUsersCreated++;
        }
      }

      console.log(`   Level ${currentLevel}: Created ${usersByLevel[currentLevel].length} users (Total: ${totalUsersCreated})`);
      currentLevel++;
    }

    console.log(`\n   ✅ Network generated: ${totalUsersCreated} users across ${currentLevel - 1} levels\n`);

    // ═══════════════════════════════════════════════════════════════
    // 3. UPDATE TEAM COUNTS
    // ═══════════════════════════════════════════════════════════════

    console.log('📊 Calculating team counts...\n');

    for (const user of allUsers) {
      const { count: directCount } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('sponsor_id', user.id);

      await supabase
        .from('users')
        .update({
          direct_count: directCount || 0,
          team_count: directCount || 0 // Simplified - real calculation would be recursive
        })
        .eq('id', user.id);
    }

    console.log('   ✅ Team counts updated\n');

    // ═══════════════════════════════════════════════════════════════
    // 4. SUMMARY
    // ═══════════════════════════════════════════════════════════════

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ SEED COMPLETE');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log(`⏱️  Duration: ${duration}s`);
    console.log(`👥 Total Users: ${totalUsersCreated}`);
    console.log(`📊 Levels Created: ${currentLevel - 1}`);
    console.log(`\n📋 Level Distribution:`);

    for (let level = 1; level < currentLevel; level++) {
      const count = usersByLevel[level]?.length || 0;
      console.log(`   Level ${level.toString().padStart(2, ' ')}: ${count} users`);
    }

    console.log('\n═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ SEED FAILED:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run seed
seedMLMNetwork().then(() => {
  console.log('✅ Script completed successfully\n');
  process.exit(0);
}).catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
