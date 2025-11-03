import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dsgtyrwtlpnckvcozfbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzZ3R5cnd0bHBuY2t2Y296ZmJjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTg0MTQwNywiZXhwIjoyMDc3NDE3NDA3fQ.O6HLc6lQHgFkYpb1scfBGa2iaWwfo3yXIxHlbGEyOxg';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function addColumn() {
  console.log('🔧 Adding total_withdrawal column to users table...\n');

  // Add the column using raw SQL
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS total_withdrawal DECIMAL(20,8) DEFAULT 0.00000000;
    `
  });

  if (error) {
    console.error('❌ Error:', error.message);

    // Try alternative method
    console.log('\n⚠️  Trying direct SQL execution via PostgREST...');

    const { error: sqlError } = await supabase
      .from('_sql')
      .insert({
        query: 'ALTER TABLE users ADD COLUMN IF NOT EXISTS total_withdrawal DECIMAL(20,8) DEFAULT 0.00000000;'
      });

    if (sqlError) {
      console.error('❌ Alternative method failed:', sqlError.message);
      console.log('\n📝 Please run this SQL manually in Supabase SQL Editor:');
      console.log('---');
      console.log('ALTER TABLE users ADD COLUMN IF NOT EXISTS total_withdrawal DECIMAL(20,8) DEFAULT 0.00000000;');
      console.log('---');
    }
    return;
  }

  console.log('✅ Column added successfully!');

  // Verify
  const { data: users } = await supabase
    .from('users')
    .select('total_withdrawal')
    .limit(1);

  if (users && users.length > 0) {
    console.log('✅ Verification: total_withdrawal column exists');
    console.log('   Sample value:', users[0].total_withdrawal);
  }
}

addColumn().catch(console.error);
