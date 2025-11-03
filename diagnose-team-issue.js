import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dsgtyrwtlpnckvcozfbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzZ3R5cnd0bHBuY2t2Y296ZmJjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTg0MTQwNywiZXhwIjoyMDc3NDE3NDA3fQ.O6HLc6lQHgFkYpb1scfBGa2iaWwfo3yXIxHlbGEyOxg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnose() {
  console.log('🔍 Diagnosing Team Data Issue\n');

  // Find the test user
  const { data: testUser, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('email', 'user@finaster.com')
    .single();

  if (userError || !testUser) {
    console.log('❌ Test user not found:', userError?.message);
    console.log('\n📋 Available users:');
    const { data: allUsers } = await supabase
      .from('users')
      .select('id, email, full_name, role')
      .order('created_at', { ascending: false });

    console.table(allUsers);
    return;
  }

  console.log('✅ Test User Found:');
  console.log({
    id: testUser.id,
    email: testUser.email,
    full_name: testUser.full_name,
    sponsor_id: testUser.sponsor_id,
    direct_count: testUser.direct_count,
    team_count: testUser.team_count
  });

  // Check referrals table
  console.log('\n📊 Checking referrals table...');
  const { data: referrals, error: refError } = await supabase
    .from('referrals')
    .select('*')
    .eq('sponsor_id', testUser.id);

  if (refError) {
    console.log('❌ Error checking referrals:', refError.message);
  } else {
    console.log(`✅ Found ${referrals?.length || 0} direct referrals`);
    if (referrals && referrals.length > 0) {
      console.table(referrals.map(r => ({
        user_id: r.user_id,
        level: r.level,
        status: r.status,
        created_at: r.created_at
      })));
    }
  }

  // Check users with this sponsor_id
  console.log('\n👥 Checking users with sponsor_id...');
  const { data: directRefs, error: directError } = await supabase
    .from('users')
    .select('id, email, full_name, sponsor_id, level')
    .eq('sponsor_id', testUser.id);

  if (directError) {
    console.log('❌ Error:', directError.message);
  } else {
    console.log(`✅ Found ${directRefs?.length || 0} users with sponsor_id`);
    if (directRefs && directRefs.length > 0) {
      console.table(directRefs);
    }
  }

  // Check binary nodes
  console.log('\n🌳 Checking binary nodes...');
  const { data: binaryNodes, error: binaryError } = await supabase
    .from('binary_nodes')
    .select('*')
    .eq('user_id', testUser.id);

  if (binaryError) {
    console.log('❌ Error:', binaryError.message);
  } else {
    console.log(`✅ Found ${binaryNodes?.length || 0} binary nodes`);
    if (binaryNodes && binaryNodes.length > 0) {
      console.table(binaryNodes);
    }
  }

  // Count all users
  const { count: totalUsers } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true });

  console.log(`\n📈 Total users in database: ${totalUsers}`);

  // Check if test user has any team members at all
  console.log('\n🔍 Checking ALL users\' sponsor relationships...');
  const { data: allUsers } = await supabase
    .from('users')
    .select('id, email, sponsor_id, level, direct_count, team_count')
    .order('level');

  if (allUsers) {
    console.log('\n📊 User hierarchy:');
    console.table(allUsers);
  }
}

diagnose().catch(console.error);
