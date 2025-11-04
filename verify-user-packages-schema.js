import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://dsgtyrwtlpnckvcozfbc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzZ3R5cnd0bHBuY2t2Y296ZmJjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTg0MTQwNywiZXhwIjoyMDc3NDE3NDA3fQ.O6HLc6lQHgFkYpb1scfBGa2iaWwfo3yXIxHlbGEyOxg'
);

console.log('\n🔍 VERIFYING USER_PACKAGES TABLE SCHEMA\n');
console.log('='.repeat(80));

// Method 1: Try inserting with minimal data to see what's required
console.log('\n📝 Method 1: Test insert to identify required columns\n');

const testUserId = '00000000-0000-0000-0000-000000000001';
const testPackageId = '00000000-0000-0000-0000-000000000002';

// Try with different column combinations
const testCombinations = [
  {
    name: 'Deployed Schema (amount)',
    data: { user_id: testUserId, package_id: testPackageId, amount: 100 }
  },
  {
    name: 'SQL File Schema (investment_amount)',
    data: { user_id: testUserId, package_id: testPackageId, investment_amount: 100 }
  }
];

for (const combo of testCombinations) {
  const { error } = await supabase
    .from('user_packages')
    .insert(combo.data);

  if (error) {
    console.log(`❌ ${combo.name}:`);
    console.log(`   Error: ${error.message.substring(0, 100)}...`);
  } else {
    console.log(`✅ ${combo.name}: SUCCESS`);
    // Delete the test record
    await supabase.from('user_packages').delete().eq('user_id', testUserId);
  }
}

// Method 2: Check what columns exist by trying to select specific columns
console.log('\n📝 Method 2: Test column existence\n');

const columnsToTest = [
  'amount',
  'investment_amount',
  'roi_percentage',
  'daily_roi_amount',
  'status',
  'is_active',
  'purchased_at',
  'activation_date',
  'total_roi_limit',
  'total_roi_earned'
];

const existingColumns = [];
const missingColumns = [];

for (const col of columnsToTest) {
  const { error } = await supabase
    .from('user_packages')
    .select(col)
    .limit(1);

  if (error) {
    missingColumns.push(col);
    console.log(`❌ ${col.padEnd(25)} - MISSING`);
  } else {
    existingColumns.push(col);
    console.log(`✅ ${col.padEnd(25)} - EXISTS`);
  }
}

console.log('\n' + '='.repeat(80));
console.log('\n📊 SCHEMA SUMMARY:\n');
console.log(`   Existing Columns (${existingColumns.length}):`);
existingColumns.forEach(col => console.log(`      ✅ ${col}`));

console.log(`\n   Missing Columns (${missingColumns.length}):`);
missingColumns.forEach(col => console.log(`      ❌ ${col}`));

console.log('\n' + '='.repeat(80) + '\n');
