import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dsgtyrwtlpnckvcozfbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzZ3R5cnd0bHBuY2t2Y296ZmJjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTg0MTQwNywiZXhwIjoyMDc3NDE3NDA3fQ.O6HLc6lQHgFkYpb1scfBGa2iaWwfo3yXIxHlbGEyOxg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnoseMarkLee() {
  console.log('🔍 Diagnosing Mark Lee data...\n');

  // Find Mark Lee
  const { data: users, error: searchError } = await supabase
    .from('users')
    .select('id, full_name, email, direct_count, team_count, sponsor_id')
    .ilike('email', '%mark.lee%');

  if (searchError) {
    console.error('Error finding Mark Lee:', searchError);
    return;
  }

  if (!users || users.length === 0) {
    console.log('❌ No user found with email containing "mark.lee"');
    return;
  }

  console.log('✅ Found Mark Lee:');
  const markLee = users[0];
  console.log(markLee);
  console.log('');

  // Get actual team members using sponsor_id
  const { data: teamMembers, error: teamError } = await supabase
    .from('users')
    .select('id, full_name, email, sponsor_id, created_at')
    .eq('sponsor_id', markLee.id)
    .order('created_at', { ascending: false });

  if (teamError) {
    console.error('Error fetching team:', teamError);
    return;
  }

  console.log('=== TEAM MEMBERS (sponsor_id = Mark Lee) ===');
  console.log(`Found ${teamMembers?.length || 0} team members:`);
  if (teamMembers && teamMembers.length > 0) {
    teamMembers.forEach((member, index) => {
      console.log(`  ${index + 1}. ${member.full_name} (${member.email})`);
    });
  } else {
    console.log('  (none)');
  }
  console.log('');

  // Check mismatch
  console.log('=== DATA CONSISTENCY CHECK ===');
  console.log(`direct_count field: ${markLee.direct_count}`);
  console.log(`Actual sponsor_id count: ${teamMembers?.length || 0}`);

  if (markLee.direct_count === (teamMembers?.length || 0)) {
    console.log('✅ Data is consistent');
  } else {
    console.log(`❌ MISMATCH! difference: ${markLee.direct_count - (teamMembers?.length || 0)}`);

    // Check if data might be in referred_by column
    const { data: referredByMembers } = await supabase
      .from('users')
      .select('id, full_name, email')
      .eq('referred_by', markLee.id);

    console.log(`\nChecking referred_by column: ${referredByMembers?.length || 0} members`);

    if (referredByMembers && referredByMembers.length > 0) {
      console.log('Members with referred_by = Mark Lee:');
      referredByMembers.forEach((member, index) => {
        console.log(`  ${index + 1}. ${member.full_name} (${member.email})`);
      });
    }
  }
}

diagnoseMarkLee();
