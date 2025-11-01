import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dsgtyrwtlpnckvcozfbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzZ3R5cnd0bHBuY2t2Y296ZmJjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTg0MTQwNywiZXhwIjoyMDc3NDE3NDA3fQ.O6HLc6lQHgFkYpb1scfBGa2iaWwfo3yXIxHlbGEyOxg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function findAllMarks() {
  console.log('🔍 Searching for all users with "mark" or "lee" in name/email...\n');

  // Search by name
  const { data: byName, error: nameError } = await supabase
    .from('users')
    .select('id, full_name, email, direct_count, team_count, created_at')
    .or('full_name.ilike.%mark%,full_name.ilike.%lee%')
    .order('created_at', { ascending: false });

  if (nameError) {
    console.error('Error searching by name:', nameError);
    return;
  }

  console.log(`Found ${byName?.length || 0} users with "mark" or "lee" in name:`);
  byName?.forEach((user, index) => {
    console.log(`\n${index + 1}. ${user.full_name} (${user.email})`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Direct Count: ${user.direct_count}`);
    console.log(`   Team Count: ${user.team_count}`);
    console.log(`   Created: ${new Date(user.created_at).toLocaleString()}`);
  });

  // Also search for users with high direct_count
  console.log('\n\n=== USERS WITH HIGH DIRECT COUNTS ===\n');
  const { data: highCounts, error: countError } = await supabase
    .from('users')
    .select('id, full_name, email, direct_count, team_count')
    .gte('direct_count', 5)
    .order('direct_count', { ascending: false })
    .limit(10);

  if (countError) {
    console.error('Error finding high counts:', countError);
    return;
  }

  console.log(`Found ${highCounts?.length || 0} users with 5+ direct referrals:`);
  highCounts?.forEach((user, index) => {
    console.log(`${index + 1}. ${user.full_name} (${user.email}) - Direct: ${user.direct_count}, Team: ${user.team_count}`);
  });
}

findAllMarks();
