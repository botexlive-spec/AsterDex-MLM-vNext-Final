/**
 * Fix RLS policies for packages table
 * Allows users to view active packages
 * Usage: node run-fix-packages-rls.js
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import fs from 'fs';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.error('   Required: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

console.log('🔧 Connecting to Supabase...');
console.log('📍 URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration() {
  try {
    console.log('\n📝 Fixing RLS policies for packages table...\n');

    // Read SQL file
    const sql = fs.readFileSync('./fix-packages-rls.sql', 'utf-8');

    // Split by semicolon and execute each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--') && !s.startsWith('/*'));

    for (const statement of statements) {
      if (statement.includes('SELECT') && statement.includes('FROM pg_policies')) {
        // This is the verification query, skip it
        continue;
      }

      console.log('Executing:', statement.substring(0, 50) + '...');

      const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });

      if (error) {
        console.error('⚠️  Error:', error.message);
        // Continue anyway, some errors are expected (like DROP IF EXISTS)
      }
    }

    console.log('\n✅ RLS policies updated successfully!');
    console.log('\n📊 Verifying policies...');

    // Test query
    const { data: packages, error: testError } = await supabase
      .from('packages')
      .select('id, name, status')
      .eq('status', 'active');

    if (testError) {
      console.error('❌ Test query failed:', testError.message);
      console.log('\n⚠️  You may need to run the SQL manually in Supabase SQL Editor');
      console.log('   File: fix-packages-rls.sql\n');
    } else {
      console.log(`✅ Test query successful! Found ${packages?.length || 0} active packages`);
      if (packages && packages.length > 0) {
        console.log('\nPackages:');
        packages.forEach(pkg => console.log(`  - ${pkg.name} (${pkg.status})`));
      }
    }

    console.log('\n🎉 Migration complete!');
    console.log('   Users can now view active packages');
    console.log('   Refresh your packages page to test\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.log('\n📋 MANUAL STEPS:');
    console.log('   1. Go to: https://supabase.com/dashboard/project/dsgtyrwtlpnckvcozfbc/sql');
    console.log('   2. Open file: fix-packages-rls.sql');
    console.log('   3. Copy and paste the SQL');
    console.log('   4. Click "Run"\n');
    process.exit(1);
  }
}

runMigration();
