import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dsgtyrwtlpnckvcozfbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzZ3R5cnd0bHBuY2t2Y296ZmJjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTg0MTQwNywiZXhwIjoyMDc3NDE3NDA3fQ.O6HLc6lQHgFkYpb1scfBGa2iaWwfo3yXIxHlbGEyOxg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log('🔍 Checking users table schema...\n');

  // Get a sample user to check columns
  const { data: users, error } = await supabase
    .from('users')
    .select('*')
    .limit(1);

  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }

  if (users && users.length > 0) {
    const columns = Object.keys(users[0]);
    console.log('✅ Existing columns in users table:');
    console.log(columns.sort().join('\n'));

    // Check for missing columns
    const requiredColumns = [
      'total_withdrawal',
      'total_investment',
      'wallet_balance',
      'direct_count',
      'team_count',
      'sponsor_id',
      'current_rank',
      'levels_unlocked',
      'kyc_status',
      'is_active'
    ];

    console.log('\n📋 Required columns check:');
    const missingColumns = [];
    requiredColumns.forEach(col => {
      const exists = columns.includes(col);
      console.log(`${exists ? '✅' : '❌'} ${col}`);
      if (!exists) missingColumns.push(col);
    });

    if (missingColumns.length > 0) {
      console.log('\n⚠️  Missing columns:', missingColumns.join(', '));
    } else {
      console.log('\n✅ All required columns exist!');
    }

    // Count users
    const { count } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    console.log(`\n👥 Total users: ${count}`);
  } else {
    console.log('⚠️  No users found in table');
  }
}

checkSchema().catch(console.error);
