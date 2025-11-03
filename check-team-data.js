#!/usr/bin/env node

/**
 * Check Team Data Script
 * Verifies if users have team members in the database
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.error('Required: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTeamData() {
  console.log('\n🔍 Checking Team Data...\n');

  // First, list all users in database
  const { data: allUsers, error: allUsersError } = await supabase
    .from('users')
    .select('id, email, full_name, sponsor_id')
    .limit(10);

  if (allUsersError) {
    console.error('❌ Error fetching users:', allUsersError.message);
    return;
  }

  console.log(`📋 Found ${allUsers?.length || 0} users in database:\n`);
  if (allUsers && allUsers.length > 0) {
    allUsers.forEach((u, i) => {
      console.log(`   ${i + 1}. ${u.email} (${u.full_name || 'No name'})`);
    });
  } else {
    console.log('   ⚠️  NO USERS IN DATABASE!');
    console.log('\n💡 Solution: Run seed script first:');
    console.log('   node seed-mlm-30-levels.js');
    return;
  }

  // Find user@finaster.com
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, email, full_name, sponsor_id')
    .eq('email', 'user@finaster.com')
    .maybeSingle();

  if (userError || !user) {
    console.log('\n❌ user@finaster.com NOT FOUND in database');
    console.log('\n💡 Solution: Run seed script:');
    console.log('   node seed-mlm-30-levels.js');
    return;
  }

  console.log('✅ Found user:', user.email);
  console.log('   User ID:', user.id);
  console.log('   Name:', user.full_name || 'Not set');
  console.log('   Sponsor ID:', user.sponsor_id || 'None (root user)');

  // Check for team members (direct referrals)
  const { data: teamMembers, error: teamError } = await supabase
    .from('users')
    .select('id, email, full_name, total_investment, created_at')
    .eq('sponsor_id', user.id);

  if (teamError) {
    console.error('\n❌ Error fetching team:', teamError.message);
    return;
  }

  console.log(`\n📊 Team Statistics:`);
  console.log(`   Direct Referrals: ${teamMembers?.length || 0}`);

  if (!teamMembers || teamMembers.length === 0) {
    console.log('\n⚠️  NO TEAM MEMBERS FOUND');
    console.log('\n💡 Solutions:');
    console.log('   1. Run: node seed-mlm-30-levels.js');
    console.log('   2. Or manually create users with sponsor_id = ' + user.id);
  } else {
    console.log('\n👥 Team Members:');
    teamMembers.forEach((member, index) => {
      console.log(`   ${index + 1}. ${member.full_name || member.email}`);
      console.log(`      - Email: ${member.email}`);
      console.log(`      - Investment: $${member.total_investment || 0}`);
      console.log(`      - Joined: ${new Date(member.created_at).toLocaleDateString()}`);
    });
  }

  console.log('\n✅ Check complete!\n');
}

checkTeamData().catch(error => {
  console.error('\n❌ Script error:', error);
  process.exit(1);
});
