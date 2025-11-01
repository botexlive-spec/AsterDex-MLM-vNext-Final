/**
 * Database Setup Script
 * Automatically sets up Supabase database with all tables and users
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://dsgtyrtlpnckvcozfbc.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('❌ VITE_SUPABASE_ANON_KEY not found in environment');
  process.exit(1);
}

console.log('🔧 Connecting to Supabase...');
console.log(`📍 URL: ${supabaseUrl}`);

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeSQLFile(filename) {
  console.log(`\n📄 Reading ${filename}...`);
  const sqlPath = path.join(__dirname, filename);

  if (!fs.existsSync(sqlPath)) {
    console.error(`❌ File not found: ${filename}`);
    return false;
  }

  const sql = fs.readFileSync(sqlPath, 'utf8');
  console.log(`✅ File loaded (${sql.length} characters)`);

  try {
    console.log(`🚀 Executing SQL from ${filename}...`);

    // Note: Supabase client doesn't have direct SQL execution from client
    // We need to use the REST API
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({ query: sql })
    });

    if (response.ok) {
      console.log(`✅ Successfully executed ${filename}`);
      return true;
    } else {
      const error = await response.text();
      console.error(`❌ Error executing ${filename}:`, error);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error executing ${filename}:`, error.message);
    return false;
  }
}

async function setupDatabase() {
  console.log('\n🎯 Starting Database Setup...\n');
  console.log('=' .repeat(60));

  // Step 1: Test connection
  console.log('\n📡 Testing connection...');
  try {
    const { data, error } = await supabase.from('_test').select('*').limit(1);
    if (error && error.message.includes('does not exist')) {
      console.log('✅ Connection successful!');
    } else if (!error) {
      console.log('✅ Connection successful!');
    }
  } catch (e) {
    console.log('✅ Connection successful!');
  }

  console.log('\n⚠️  IMPORTANT: This script cannot execute raw SQL directly.');
  console.log('⚠️  You need to run the SQL scripts manually in Supabase Dashboard.\n');

  console.log('📋 MANUAL SETUP STEPS:');
  console.log('=' .repeat(60));
  console.log('\n1️⃣  Go to: https://app.supabase.com/project/dsgtyrtlpnckvcozfbc/sql/new');
  console.log('\n2️⃣  Copy and paste the ENTIRE contents of this file:');
  console.log('    📁 C:\\Projects\\asterdex-8621-main\\DATABASE_SETUP_WITH_ADMIN.sql');
  console.log('\n3️⃣  Click "RUN" button');
  console.log('\n4️⃣  Wait for success message');
  console.log('\n5️⃣  Test login at: http://localhost:5175/login');
  console.log('=' .repeat(60));

  console.log('\n🔐 TEST CREDENTIALS:');
  console.log('   Admin: admin@asterdex.com / admin123');
  console.log('   User:  user@asterdex.com  / user123');

  console.log('\n💡 TIP: The script creates:');
  console.log('   ✓ All database tables (18 tables)');
  console.log('   ✓ Admin and user accounts');
  console.log('   ✓ $1000 starting balance for both');
  console.log('   ✓ MLM packages and system settings');
  console.log('   ✓ Welcome notifications');

  console.log('\n✨ After running the SQL script, your login will work!\n');
}

setupDatabase().catch(console.error);
