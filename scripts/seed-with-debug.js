#!/usr/bin/env node

/**
 * ═══════════════════════════════════════════════════════════════
 * SEED SCRIPT WITH DEBUGGING - Multiple Auth Approaches
 * ═══════════════════════════════════════════════════════════════
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { faker } from '@faker-js/faker';

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('🔍 AUTH API DEBUG & SEED SCRIPT');
console.log('═══════════════════════════════════════════════════════════════\n');

console.log('🔧 Environment Check:');
console.log(`   Supabase URL: ${supabaseUrl ? '✓' : '✗'}`);
console.log(`   Service Key: ${supabaseServiceKey ? `✓ (${supabaseServiceKey.substring(0, 20)}...)` : '✗'}`);
console.log(`   Anon Key: ${supabaseAnonKey ? '✓' : '✗'}\n`);

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required credentials');
  process.exit(1);
}

// Create clients with different configurations
const serviceClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const anonClient = createClient(supabaseUrl, supabaseAnonKey);

// ═══════════════════════════════════════════════════════════════
// TEST AUTH API METHODS
// ═══════════════════════════════════════════════════════════════

async function testAuthMethods() {
  console.log('🧪 Testing Auth API Methods:\n');

  const testEmail = `test${Date.now()}@example.com`;
  const testPassword = 'Test123456!';

  // Method 1: Service Role - createUser
  console.log('1️⃣  Method 1: service.auth.admin.createUser()');
  try {
    const { data, error } = await serviceClient.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: {
        full_name: 'Test User'
      }
    });

    if (error) {
      console.log(`   ❌ Error: ${error.message}`);
      console.log(`   Code: ${error.status || 'N/A'}`);
      console.log(`   Details:`, JSON.stringify(error, null, 2));
    } else {
      console.log(`   ✅ SUCCESS! Created user: ${data.user.email}`);
      console.log(`   User ID: ${data.user.id}`);

      // Clean up test user
      await serviceClient.auth.admin.deleteUser(data.user.id);
      console.log(`   🧹 Cleaned up test user\n`);
      return 'METHOD_1';
    }
  } catch (err) {
    console.log(`   ❌ Exception: ${err.message}\n`);
  }

  // Method 2: Service Role - inviteUserByEmail
  console.log('2️⃣  Method 2: service.auth.admin.inviteUserByEmail()');
  try {
    const { data, error } = await serviceClient.auth.admin.inviteUserByEmail(testEmail, {
      data: { full_name: 'Test User' }
    });

    if (error) {
      console.log(`   ❌ Error: ${error.message}\n`);
    } else {
      console.log(`   ✅ SUCCESS! Invited user: ${data.user.email}`);
      await serviceClient.auth.admin.deleteUser(data.user.id);
      console.log(`   🧹 Cleaned up test user\n`);
      return 'METHOD_2';
    }
  } catch (err) {
    console.log(`   ❌ Exception: ${err.message}\n`);
  }

  // Method 3: Regular signUp with auto-confirm
  console.log('3️⃣  Method 3: service.auth.signUp() with service role');
  try {
    const { data, error } = await serviceClient.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: { full_name: 'Test User' },
        emailRedirectTo: undefined
      }
    });

    if (error) {
      console.log(`   ❌ Error: ${error.message}\n`);
    } else if (data.user) {
      console.log(`   ✅ SUCCESS! Signed up user: ${data.user.email}`);
      await serviceClient.auth.admin.deleteUser(data.user.id);
      console.log(`   🧹 Cleaned up test user\n`);
      return 'METHOD_3';
    }
  } catch (err) {
    console.log(`   ❌ Exception: ${err.message}\n`);
  }

  // Method 4: Anon client signUp
  console.log('4️⃣  Method 4: anon.auth.signUp()');
  try {
    const { data, error } = await anonClient.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: { full_name: 'Test User' }
      }
    });

    if (error) {
      console.log(`   ❌ Error: ${error.message}\n`);
    } else if (data.user) {
      console.log(`   ✅ SUCCESS! Signed up user: ${data.user.email}`);
      await serviceClient.auth.admin.deleteUser(data.user.id);
      console.log(`   🧹 Cleaned up test user\n`);
      return 'METHOD_4';
    }
  } catch (err) {
    console.log(`   ❌ Exception: ${err.message}\n`);
  }

  console.log('❌ All methods failed!\n');
  return null;
}

// ═══════════════════════════════════════════════════════════════
// SEED USING WORKING METHOD
// ═══════════════════════════════════════════════════════════════

async function seedWithWorkingMethod(method) {
  console.log(`\n🌱 Seeding with ${method}...\n`);

  const createUserFunc = {
    'METHOD_1': async (email, password, name) => {
      const { data, error } = await serviceClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: name }
      });
      return { data, error };
    },
    'METHOD_2': async (email, password, name) => {
      const { data, error } = await serviceClient.auth.admin.inviteUserByEmail(email, {
        data: { full_name: name }
      });
      return { data, error };
    },
    'METHOD_3': async (email, password, name) => {
      const { data, error } = await serviceClient.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } }
      });
      return { data, error };
    },
    'METHOD_4': async (email, password, name) => {
      const { data, error } = await anonClient.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } }
      });
      return { data, error };
    }
  }[method];

  // Create or get root user
  console.log('👤 Setting up root user...');
  let { data: rootData, error: rootError } = await createUserFunc(
    'user@finaster.com',
    'Test123456!',
    'John Doe'
  );

  // If user already exists, try to sign in to get the user
  if (rootError?.message?.includes('already been registered')) {
    console.log('   ℹ️  User already exists, attempting to retrieve...');
    const { data: signInData, error: signInError } = await serviceClient.auth.signInWithPassword({
      email: 'user@finaster.com',
      password: 'Test123456!'
    });

    if (signInError || !signInData?.user) {
      console.error(`   ❌ Cannot retrieve existing user: ${signInError?.message}`);
      console.log('   💡 Manual fix: Delete user@finaster.com in Supabase Dashboard → Authentication → Users');
      return;
    }

    rootData = signInData;
    console.log(`   ✅ Retrieved existing user: user@finaster.com`);
  } else if (rootError || !rootData?.user) {
    console.error(`   ❌ Failed: ${rootError?.message}`);
    return;
  } else {
    console.log(`   ✅ Created new user: user@finaster.com`);
  }

  const rootUserId = rootData.user.id;
  console.log(`   User ID: ${rootUserId}`);

  // Clean up existing data for this user
  await serviceClient.from('referral_codes').delete().eq('user_id', rootUserId);
  await serviceClient.from('binary_tree').delete().eq('user_id', rootUserId);
  await serviceClient.from('referrals').delete().eq('referrer_id', rootUserId);
  await serviceClient.from('referrals').delete().eq('referee_id', rootUserId);

  // Insert/update user record in public.users table
  const { data: userData, error: userError } = await serviceClient.from('users').upsert({
    id: rootUserId,
    email: 'user@finaster.com',
    password_hash: '$2a$10$rQ8xYZ9F7VXo8vXhZx9hk.K4Jx8pY7HJ9Lx9N4mXqZ9K7L8M9N0P1', // dummy hash
    full_name: 'John Doe',
    role: 'user',
    wallet_balance: 5000,
    total_investment: 10000,
    direct_count: 0,
    team_count: 0,
    current_rank: 'starter',
    levels_unlocked: 30,
    kyc_status: 'approved',
    is_active: true
  });

  if (userError) {
    console.error(`   ❌ Error upserting root user: ${userError.message}`);
    console.error(`   Details:`, userError);
    return;
  }

  console.log(`   ✅ Root user record created in public.users`);

  // Create referral code
  await serviceClient.from('referral_codes').insert({
    user_id: rootUserId,
    code: generateCode(),
    is_active: true
  });

  // Create binary tree
  await serviceClient.from('binary_tree').insert({
    user_id: rootUserId,
    parent_id: null,
    level: 0,
    position: 'root',
    left_volume: 0,
    right_volume: 0
  });

  console.log('\n🌳 Creating network (20 users)...\n');

  const allUsers = [{ id: rootUserId, level: 1 }];
  let created = 0;

  for (let i = 1; i <= 20; i++) {
    const sponsor = allUsers[Math.floor(Math.random() * allUsers.length)];
    const email = `test${Date.now()}${i}@example.com`;
    const name = faker.person.fullName();

    const { data: newData, error: newError } = await createUserFunc(email, 'Test123456!', name);

    if (!newError && newData?.user) {
      const newUserId = newData.user.id;

      // Insert/update user in public.users table
      const { data: newUserData, error: newUserError } = await serviceClient.from('users').upsert({
        id: newUserId,
        email: email,
        password_hash: '$2a$10$rQ8xYZ9F7VXo8vXhZx9hk.K4Jx8pY7HJ9Lx9N4mXqZ9K7L8M9N0P1', // dummy hash
        full_name: name,
        role: 'user',
        sponsor_id: sponsor.id,
        wallet_balance: Math.floor(Math.random() * 5000),
        total_investment: Math.floor(Math.random() * 50000),
        kyc_status: ['approved', 'pending'][Math.floor(Math.random() * 2)],
        is_active: true
      });

      if (newUserError) {
        console.log(`   ✗ User ${i}: Failed to upsert - ${newUserError.message}`);
        continue;
      }

      // Create referral
      await serviceClient.from('referrals').insert({
        referrer_id: sponsor.id,
        referee_id: newUserId,
        referral_code: generateCode(),
        status: 'active',
        commission_earned: 0
      });

      // Find position in binary tree (left or right)
      const { data: sponsorTree } = await serviceClient
        .from('binary_tree')
        .select('left_child_id, right_child_id')
        .eq('user_id', sponsor.id)
        .single();

      let position = 'left';
      if (sponsorTree) {
        // If left is taken, use right; if both taken, use left (will be nested later)
        position = !sponsorTree.left_child_id ? 'left' : 'right';
      }

      // Create binary tree node for new user
      await serviceClient.from('binary_tree').insert({
        user_id: newUserId,
        parent_id: sponsor.id,
        level: sponsor.level,
        position: position,
        left_volume: 0,
        right_volume: 0
      });

      // Update sponsor's binary tree with child reference
      if (sponsorTree) {
        const updateField = position === 'left' ? { left_child_id: newUserId } : { right_child_id: newUserId };
        await serviceClient
          .from('binary_tree')
          .update(updateField)
          .eq('user_id', sponsor.id);
      }

      allUsers.push({ id: newUserId, level: sponsor.level + 1 });
      created++;
      console.log(`   ✓ User ${i}: ${email}`);

      // Rate limiting
      await sleep(200);
    } else {
      console.log(`   ✗ User ${i}: Failed`);
    }
  }

  // Update team counts
  for (const user of allUsers) {
    const { count } = await serviceClient
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('sponsor_id', user.id);

    await serviceClient.from('users')
      .update({ direct_count: count || 0, team_count: count || 0 })
      .eq('id', user.id);
  }

  console.log(`\n✅ Created ${created + 1} users total\n`);
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('✅ SEED COMPLETE');
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log('Login: user@finaster.com / Test123456!\n');
}

// ═══════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════

function generateCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════

async function main() {
  try {
    const workingMethod = await testAuthMethods();

    if (workingMethod) {
      console.log(`✅ Found working method: ${workingMethod}\n`);
      await seedWithWorkingMethod(workingMethod);
    } else {
      console.log('═══════════════════════════════════════════════════════════════');
      console.log('❌ NO WORKING METHOD FOUND');
      console.log('═══════════════════════════════════════════════════════════════\n');
      console.log('🔍 Possible Issues:\n');
      console.log('1. Auth email confirmation is required');
      console.log('   Fix: Supabase Dashboard → Auth → Settings → Disable "Confirm email"\n');
      console.log('2. RLS policies blocking inserts');
      console.log('   Fix: Temporarily disable RLS on users table\n');
      console.log('3. Auth rate limiting');
      console.log('   Fix: Wait a few minutes and try again\n');
      console.log('4. Service role key permissions');
      console.log('   Fix: Verify key in Supabase Dashboard → Settings → API\n');
      console.log('📝 Manual setup: See MANUAL-SETUP-GUIDE.md\n');
      process.exit(1);
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Script failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
