import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dsgtyrwtlpnckvcozfbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzZ3R5cnd0bHBuY2t2Y296ZmJjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTg0MTQwNywiZXhwIjoyMDc3NDE3NDA3fQ.O6HLc6lQHgFkYpb1scfBGa2iaWwfo3yXIxHlbGEyOxg';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

console.log('\n🔍 VERIFYING COMMISSIONS TABLE SCHEMA\n');
console.log('='.repeat(80));

// Query information_schema to get actual column names
const { data: columns, error } = await supabase
  .rpc('exec_sql', {
    sql: `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'commissions'
      ORDER BY ordinal_position;
    `
  })
  .select();

if (error) {
  console.log('\n⚠️  Could not query information_schema. Trying alternative method...\n');

  // Try selecting from commissions with limit 0 to see columns
  const { data: sampleData, error: selectError } = await supabase
    .from('commissions')
    .select('*')
    .limit(1);

  if (selectError) {
    console.log('❌ Error:', selectError.message);
    process.exit(1);
  }

  if (sampleData && sampleData.length > 0) {
    console.log('\n📊 Actual Columns (from sample data):\n');
    Object.keys(sampleData[0]).forEach((col, i) => {
      console.log(`   ${i + 1}. ${col}`);
    });
  } else {
    console.log('\n⚠️  Table exists but is empty. Attempting to get structure...\n');

    // Get table info from Supabase
    const { data: tableInfo, error: infoError } = await supabase
      .from('commissions')
      .select()
      .limit(0);

    console.log('Table query result:', { tableInfo, infoError });
  }
} else {
  console.log('\n📊 Current Schema:\n');
  columns.forEach((col, i) => {
    console.log(`   ${i + 1}. ${col.column_name.padEnd(30)} - ${col.data_type}`);
  });
}

// Check for expected columns
console.log('\n\n✅ EXPECTED COLUMNS CHECK:\n');

const expectedColumns = [
  'id',
  'user_id',
  'from_user_id',
  'package_id',
  'level',
  'percentage',       // THIS IS THE MISSING COLUMN
  'amount',
  'commission_type',
  'status',
  'created_at'
];

for (const col of expectedColumns) {
  try {
    const { data, error } = await supabase
      .from('commissions')
      .select(col)
      .limit(0);

    if (error && error.message.includes(`Could not find the '${col}' column`)) {
      console.log(`   ❌ ${col.padEnd(30)} - MISSING`);
    } else if (error) {
      console.log(`   ⚠️  ${col.padEnd(30)} - ERROR: ${error.message}`);
    } else {
      console.log(`   ✅ ${col.padEnd(30)} - EXISTS`);
    }
  } catch (e) {
    console.log(`   ❌ ${col.padEnd(30)} - ERROR: ${e.message}`);
  }
}

console.log('\n' + '='.repeat(80));
console.log('\n✅ Schema verification complete\n');
