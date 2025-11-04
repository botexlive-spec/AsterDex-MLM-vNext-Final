import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dsgtyrwtlpnckvcozfbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzZ3R5cnd0bHBuY2t2Y296ZmJjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTg0MTQwNywiZXhwIjoyMDc3NDE3NDA3fQ.O6HLc6lQHgFkYpb1scfBGa2iaWwfo3yXIxHlbGEyOxg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkReferralsSchema() {
  console.log('\n📋 Checking users with sponsors:');
  const { data: users } = await supabase
    .from('users')
    .select('id, email, sponsor_id')
    .not('sponsor_id', 'is', null)
    .limit(5);

  if (users && users.length > 0) {
    console.log(`   Found ${users.length} users with sponsors:`);
    users.forEach(u => {
      console.log(`   - ${u.email} → Sponsor: ${u.sponsor_id}`);
    });
  } else {
    console.log('   No users with sponsors found');
  }
}

checkReferralsSchema().catch(console.error);
