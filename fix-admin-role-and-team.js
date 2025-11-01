import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://dsgtyrwtlpnckvcozfbc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzZ3R5cnd0bHBuY2t2Y296ZmJjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTg0MTQwNywiZXhwIjoyMDc3NDE3NDA3fQ.O6HLc6lQHgFkYpb1scfBGa2iaWwfo3yXIxHlbGEyOxg'
);

console.log('=== FIXING ADMIN ROLE AND TEAM STRUCTURE ===\n');

// Find admin@finaster.com (the seeded admin)
const { data: admin, error: adminError } = await supabase
  .from('users')
  .select('*')
  .eq('email', 'admin@finaster.com')
  .single();

if (adminError || !admin) {
  console.error('❌ admin@finaster.com not found!');
  console.log('Let me check all users with "admin" in email...\n');

  const { data: allAdmins } = await supabase
    .from('users')
    .select('id, email, full_name, role, current_rank')
    .ilike('email', '%admin%')
    .order('created_at');

  console.log(`Found ${allAdmins?.length || 0} users with "admin" in email:`);
  allAdmins?.forEach(u => {
    console.log(`  - ${u.email} (role: ${u.role || 'null'}, rank: ${u.current_rank})`);
  });
} else {
  console.log('✅ Found admin user:');
  console.log(`   Email: ${admin.email}`);
  console.log(`   ID: ${admin.id}`);
  console.log(`   Name: ${admin.full_name}`);
  console.log(`   Current Role: ${admin.role || 'null'}`);
  console.log(`   Current Rank: ${admin.current_rank}`);

  // Update role to 'admin' if not already
  if (admin.role !== 'admin') {
    console.log('\n📝 Updating role to "admin"...');
    const { error: updateError } = await supabase
      .from('users')
      .update({ role: 'admin' })
      .eq('id', admin.id);

    if (updateError) {
      console.error('❌ Error updating role:', updateError);
    } else {
      console.log('✅ Role updated to "admin"');
    }
  }

  // Check team members
  console.log('\n📊 Checking team structure...');
  const { count: directCount } = await supabase
    .from('users')
    .select('id', { count: 'exact', head: true })
    .eq('sponsor_id', admin.id);

  console.log(`   Direct Members: ${directCount || 0}`);

  // Get sample team members
  const { data: teamSample } = await supabase
    .from('users')
    .select('id, full_name, email, level')
    .eq('sponsor_id', admin.id)
    .order('level')
    .limit(5);

  if (teamSample && teamSample.length > 0) {
    console.log('   Sample team members:');
    teamSample.forEach(member => {
      console.log(`     - ${member.full_name} (${member.email}, Level ${member.level || 1})`);
    });
  }
}

console.log('\n=== DONE ===');
console.log('Now log in as: admin@finaster.com / password123');
