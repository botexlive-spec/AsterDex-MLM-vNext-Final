import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dsgtyrwtlpnckvcozfbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzZ3R5cnd0bHBuY2t2Y296ZmJjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTg0MTQwNywiZXhwIjoyMDc3NDE3NDA3fQ.O6HLc6lQHgFkYpb1scfBGa2iaWwfo3yXIxHlbGEyOxg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAdminDirects() {
  console.log('🔍 Checking Admin direct referrals...\n');

  // Find Admin
  const { data: admin, error: searchError } = await supabase
    .from('users')
    .select('id, full_name, email, direct_count, team_count, sponsor_id')
    .eq('email', 'admin@finaster.com')
    .single();

  if (searchError) {
    console.error('Error finding admin:', searchError);
    return;
  }

  if (!admin) {
    console.log('❌ Admin user not found');
    return;
  }

  console.log('✅ Found Admin:');
  console.log(admin);
  console.log('');

  // Get actual direct referrals using sponsor_id
  const { data: directReferrals, error: directError } = await supabase
    .from('users')
    .select('id, full_name, email, sponsor_id, created_at')
    .eq('sponsor_id', admin.id)
    .order('created_at', { ascending: false });

  if (directError) {
    console.error('Error fetching directs:', directError);
    return;
  }

  console.log('=== DIRECT REFERRALS (sponsor_id = admin.id) ===');
  console.log(`Found ${directReferrals?.length || 0} direct referrals:`);
  if (directReferrals && directReferrals.length > 0) {
    directReferrals.forEach((member, index) => {
      console.log(`  ${index + 1}. ${member.full_name} (${member.email})`);
    });
  } else {
    console.log('  (none)');
  }
  console.log('');

  // Check mismatch
  console.log('=== DATA CONSISTENCY CHECK ===');
  console.log(`direct_count field: ${admin.direct_count}`);
  console.log(`Actual sponsor_id count: ${directReferrals?.length || 0}`);

  if (admin.direct_count === (directReferrals?.length || 0)) {
    console.log('✅ Data is consistent');
  } else {
    console.log(`❌ MISMATCH! difference: ${admin.direct_count - (directReferrals?.length || 0)}`);
  }
}

checkAdminDirects();
