import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dsgtyrwtlpnckvcozfbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzZ3R5cnd0bHBuY2t2Y296ZmJjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTg0MTQwNywiZXhwIjoyMDc3NDE3NDA3fQ.O6HLc6lQHgFkYpb1scfBGa2iaWwfo3yXIxHlbGEyOxg';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

console.log('\n🔍 CHECKING TRANSACTIONS TABLE\n');
console.log('='.repeat(80));

// Try to query transactions table
const { data, error } = await supabase
  .from('transactions')
  .select('*')
  .limit(1);

if (error) {
  console.log('\n❌ Transactions table does NOT exist');
  console.log(`   Error: ${error.message}`);
  console.log('\n✅ RECOMMENDATION: Create transactions table for audit trail\n');
} else {
  console.log('\n✅ Transactions table EXISTS');
  if (data && data.length > 0) {
    console.log('\n📊 Sample Record:');
    console.log(JSON.stringify(data[0], null, 2));
  } else {
    console.log('\n⚠️  Table exists but is empty (0 rows)');
  }
  console.log();
}

console.log('='.repeat(80));
console.log();
