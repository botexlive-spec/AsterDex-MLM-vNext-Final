/**
 * Setup Wallets - Create wallets table and add balance
 * Usage: node scripts/setup-wallets.js
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read Supabase credentials
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');

const getEnvValue = (key) => {
  const match = envContent.match(new RegExp(`${key}=(.+)`));
  return match ? match[1].trim() : null;
};

const supabaseUrl = getEnvValue('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnvValue('VITE_SUPABASE_ANON_KEY');

console.log('\n🔧 Supabase Wallets Setup\n');
console.log(`URL: ${supabaseUrl}`);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Error: Supabase credentials not found');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function setupWallets() {
  try {
    console.log('\n📊 Step 1: Checking if wallets table exists...');

    // Check if wallets table exists
    const { data: tables, error: tableError } = await supabase
      .from('wallets')
      .select('id')
      .limit(1);

    if (tableError && tableError.code === '42P01') {
      console.log('⚠️  Wallets table does not exist');
      console.log('\n❌ ERROR: Cannot create tables with anon key');
      console.log('\n💡 SOLUTION: You need to run the SQL in Supabase SQL Editor:');
      console.log('   File: database/create-wallets-table.sql\n');
      console.log('   Or use this direct connection string approach (see below)\n');
      process.exit(1);
    }

    console.log('✅ Wallets table exists');

    // Get all users
    console.log('\n📊 Step 2: Getting all users...');
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      process.exit(1);
    }

    console.log(`✅ Found ${users.users.length} users`);

    // Insert/update wallets
    console.log('\n📊 Step 3: Creating wallets with $10,000 balance...');

    for (const user of users.users) {
      const { data, error } = await supabase
        .from('wallets')
        .upsert({
          user_id: user.id,
          available_balance: 10000.00,
          total_balance: 10000.00,
          locked_balance: 0,
        }, {
          onConflict: 'user_id'
        })
        .select();

      if (error) {
        console.error(`❌ Error for user ${user.email}:`, error.message);
      } else {
        console.log(`✅ Wallet created/updated for: ${user.email}`);
      }
    }

    // Verify
    console.log('\n📊 Step 4: Verifying wallets...');
    const { data: wallets, error: walletsError } = await supabase
      .from('wallets')
      .select('user_id, available_balance, total_balance');

    if (walletsError) {
      console.error('❌ Error:', walletsError);
      process.exit(1);
    }

    console.log('\n✅ SUCCESS! Wallets created:\n');
    console.table(wallets.map(w => ({
      user_id: w.user_id.substring(0, 8) + '...',
      available: `$${w.available_balance}`,
      total: `$${w.total_balance}`
    })));

    console.log(`\n🎉 Total wallets: ${wallets.length}`);
    console.log(`💰 Total balance: $${wallets.reduce((sum, w) => sum + parseFloat(w.available_balance), 0)}\n`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

setupWallets();
