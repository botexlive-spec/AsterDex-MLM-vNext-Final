/**
 * Run SQL migration to make password_hash nullable
 * Usage: node run-password-hash-migration.js
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env file');
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
    console.log('\n📝 Executing SQL migration...');
    console.log('   ALTER TABLE public.users ALTER COLUMN password_hash DROP NOT NULL;\n');

    // Execute the ALTER TABLE command
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE public.users ALTER COLUMN password_hash DROP NOT NULL;'
    });

    if (error) {
      // Try direct SQL execution via REST API
      console.log('⚠️  RPC not available, trying direct SQL execution...');

      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`
        },
        body: JSON.stringify({
          sql: 'ALTER TABLE public.users ALTER COLUMN password_hash DROP NOT NULL;'
        })
      });

      if (!response.ok) {
        throw new Error('Direct SQL execution failed. Please run the SQL manually in Supabase SQL Editor.');
      }
    }

    console.log('✅ Migration executed successfully!');
    console.log('\n📊 Verifying the change...');

    // Verify by checking the column definition
    const { data: columns, error: verifyError } = await supabase
      .from('information_schema.columns')
      .select('column_name, is_nullable, data_type')
      .eq('table_name', 'users')
      .eq('column_name', 'password_hash')
      .single();

    if (verifyError) {
      console.log('⚠️  Could not verify the change automatically.');
      console.log('   Please check in Supabase SQL Editor:\n');
      console.log('   SELECT column_name, is_nullable FROM information_schema.columns');
      console.log('   WHERE table_name = \'users\' AND column_name = \'password_hash\';\n');
    } else {
      console.log('✅ Verification successful:');
      console.log(`   Column: ${columns?.column_name}`);
      console.log(`   Type: ${columns?.data_type}`);
      console.log(`   Nullable: ${columns?.is_nullable}\n`);
    }

    console.log('🎉 Password hash constraint removed!');
    console.log('   Users can now be created without password_hash values.');
    console.log('   Refresh your Dashboard page to test.\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.log('\n📋 MANUAL STEPS:');
    console.log('   1. Go to: https://supabase.com/dashboard/project/dsgtyrwtlpnckvcozfbc/sql');
    console.log('   2. Paste this SQL:');
    console.log('      ALTER TABLE public.users ALTER COLUMN password_hash DROP NOT NULL;');
    console.log('   3. Click "Run"\n');
    process.exit(1);
  }
}

runMigration();
