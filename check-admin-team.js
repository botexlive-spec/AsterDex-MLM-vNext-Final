import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://dsgtyrwtlpnckvcozfbc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzZ3R5cnd0bHBuY2t2Y296ZmJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4NDE0MDcsImV4cCI6MjA3NzQxNzQwN30.slPbjLRjENkrFAcQvpQM5US11CWcqc7eTW-JRoT-Feg'
);

console.log('=== CHECKING ADMIN ACCOUNTS WITH TEAM MEMBERS ===\n');

// Find all admin users
const { data: admins, error: adminsError } = await supabase
  .from('users')
  .select('id, full_name, email, role')
  .eq('role', 'admin')
  .order('created_at');

if (adminsError) {
  console.error('Error fetching admins:', adminsError);
  process.exit(1);
}

console.log(`Found ${admins.length} admin users:\n`);

// Check team members for each admin
for (const admin of admins) {
  console.log(`📧 ${admin.email}`);
  console.log(`   ID: ${admin.id}`);
  console.log(`   Name: ${admin.full_name}`);

  // Count direct referrals
  const { count: directCount } = await supabase
    .from('users')
    .select('id', { count: 'exact', head: true })
    .eq('sponsor_id', admin.id);

  console.log(`   Direct Members: ${directCount || 0}`);

  // Get all team members
  const { data: teamMembers } = await supabase
    .from('users')
    .select('id, full_name, level')
    .eq('sponsor_id', admin.id)
    .order('level')
    .limit(5);

  if (teamMembers && teamMembers.length > 0) {
    console.log('   Sample team members:');
    teamMembers.forEach(member => {
      console.log(`     - ${member.full_name} (Level ${member.level || 1})`);
    });
  }

  console.log('');
}

console.log('\n=== RECOMMENDATION ===');
console.log('Log in with the admin account that has team members to see the Team Report data.');
