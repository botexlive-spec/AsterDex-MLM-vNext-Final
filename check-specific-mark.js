import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dsgtyrwtlpnckvcozfbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzZ3R5cnd0bHBuY2t2Y296ZmJjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTg0MTQwNywiZXhwIjoyMDc3NDE3NDA3fQ.O6HLc6lQHgFkYpb1scfBGa2iaWwfo3yXIxHlbGEyOxg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSpecificMark() {
  const markLeeId = '58ca73e7-36cc-4ab3-b549-c712bf8462ef';

  console.log('🔍 Checking Mark Lee (user.mark.lee.10.1@finaster.com)...\n');

  // Get Mark Lee info
  const { data: markLee, error: markError } = await supabase
    .from('users')
    .select('id, full_name, email, direct_count, team_count, sponsor_id')
    .eq('id', markLeeId)
    .single();

  if (markError) {
    console.error('Error fetching Mark Lee:', markError);
    return;
  }

  console.log('✅ Mark Lee Info:');
  console.log(markLee);
  console.log('');

  // Get actual team members using sponsor_id
  const { data: teamMembers, error: teamError } = await supabase
    .from('users')
    .select('id, full_name, email, sponsor_id, created_at')
    .eq('sponsor_id', markLeeId)
    .order('created_at', { ascending: false });

  if (teamError) {
    console.error('Error fetching team:', teamError);
    return;
  }

  console.log('=== DIRECT REFERRALS (sponsor_id = Mark Lee) ===');
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
      .eq('referred_by', markLeeId);

    console.log(`\nChecking referred_by column: ${referredByMembers?.length || 0} members`);

    if (referredByMembers && referredByMembers.length > 0) {
      console.log('Members with referred_by = Mark Lee:');
      referredByMembers.forEach((member, index) => {
        console.log(`  ${index + 1}. ${member.full_name} (${member.email})`);
      });
    }
  }
}

checkSpecificMark();
