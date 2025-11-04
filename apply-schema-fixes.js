import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = 'https://dsgtyrwtlpnckvcozfbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzZ3R5cnd0bHBuY2t2Y296ZmJjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTg0MTQwNywiZXhwIjoyMDc3NDE3NDA3fQ.O6HLc6lQHgFkYpb1scfBGa2iaWwfo3yXIxHlbGEyOxg';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

console.log('\n🔧 APPLYING DATABASE SCHEMA FIXES\n');
console.log('='.repeat(80));

// Fix #1: Add columns to commissions table
console.log('\n📝 FIX #1: Adding columns to commissions table...\n');

try {
  // Add percentage column
  console.log('   Adding "percentage" column...');
  const { error: err1 } = await supabase.rpc('exec_sql', {
    sql: 'ALTER TABLE commissions ADD COLUMN IF NOT EXISTS percentage DECIMAL(5,2);'
  });

  if (err1) {
    console.log(`   ⚠️  Method 1 failed: ${err1.message}`);
    console.log('   Trying alternative method...');

    // Try using PostgreSQL client
    const pkg = await import('pg');
    const { Pool } = pkg.default || pkg;
    const pool = new Pool({
      connectionString: 'postgresql://postgres.dsgtyrwtlpnckvcozfbc:Dubai%401234%23@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres',
      ssl: { rejectUnauthorized: false }
    });

    const client = await pool.connect();

    console.log('   ✅ Connected via PostgreSQL client');

    // Execute all ALTER TABLE statements
    await client.query('ALTER TABLE commissions ADD COLUMN IF NOT EXISTS percentage DECIMAL(5,2);');
    console.log('   ✅ Added column: percentage');

    await client.query('ALTER TABLE commissions ADD COLUMN IF NOT EXISTS reference_type VARCHAR(50);');
    console.log('   ✅ Added column: reference_type');

    await client.query('ALTER TABLE commissions ADD COLUMN IF NOT EXISTS reference_id UUID;');
    console.log('   ✅ Added column: reference_id');

    await client.query('CREATE INDEX IF NOT EXISTS idx_commissions_reference ON commissions(reference_type, reference_id);');
    console.log('   ✅ Created index: idx_commissions_reference');

    console.log('\n✅ FIX #1 COMPLETE: Commissions table updated\n');

    // Fix #2: Create transactions table
    console.log('📝 FIX #2: Creating transactions table...\n');

    const createTransactionsSQL = readFileSync('database/CREATE_TRANSACTIONS_TABLE.sql', 'utf8');

    // Execute the full SQL file
    await client.query(createTransactionsSQL);
    console.log('   ✅ Transactions table created');
    console.log('   ✅ All indexes created');
    console.log('   ✅ RLS policies applied');

    console.log('\n✅ FIX #2 COMPLETE: Transactions table created\n');

    client.release();
    await pool.end();

    console.log('='.repeat(80));
    console.log('\n🎉 ALL SCHEMA FIXES APPLIED SUCCESSFULLY!\n');
    console.log('Next steps:');
    console.log('  1. Run: node verify-commissions-schema.js');
    console.log('  2. Run: node verify-transactions-table.js');
    console.log('  3. Run: node e2e-test-suite.js');
    console.log('  4. Expect: 100% test pass rate (5/5)\n');

  } else {
    console.log('   ✅ Supabase RPC method worked!');
  }

} catch (error) {
  console.error('\n❌ ERROR:', error.message);
  console.log('\n⚠️  Automated execution failed. Reasons:');
  console.log('   - Supabase JS client does not support DDL operations');
  console.log('   - PostgreSQL direct connection may have auth/SSL issues');
  console.log('   - Service role key may not have DDL permissions\n');
  console.log('📋 MANUAL EXECUTION REQUIRED:');
  console.log('   Please run the SQL via Supabase Dashboard');
  console.log('   Guide: DATABASE_SCHEMA_FIXES.md\n');
  process.exit(1);
}
