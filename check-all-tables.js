import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dsgtyrwtlpnckvcozfbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzZ3R5cnd0bHBuY2t2Y296ZmJjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTg0MTQwNywiZXhwIjoyMDc3NDE3NDA3fQ.O6HLc6lQHgFkYpb1scfBGa2iaWwfo3yXIxHlbGEyOxg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAllTables() {
  console.log('\n🔍 COMPREHENSIVE DATABASE CHECK\n');
  console.log('='.repeat(80));

  const tables = [
    // Core User Tables
    'users',
    'referrals',
    'user_packages',

    // MLM Structure Tables
    'binary_nodes',
    'team_members',

    // Financial Tables
    'wallets',
    'deposits',
    'withdrawals',
    'transactions',

    // Commission Tables
    'commissions',
    'commission_settings',
    'level_commission_rates',

    // Package Tables
    'packages',
    'package_commission_levels',

    // Rank Tables
    'ranks',
    'rank_rewards',
    'rank_distribution_history',
    'user_ranks',

    // ROI Tables
    'roi_distributions',
    'roi_settings',

    // KYC Tables
    'kyc_verifications',
    'kyc_documents',

    // Robot & Subscription
    'robot_subscriptions',

    // Support Tables
    'support_tickets',
    'support_messages',
    'support_canned_responses',
    'support_chat_sessions',
    'support_chat_messages',

    // Admin Tables
    'admin_logs',
    'audit_logs',
    'system_settings',
    'business_rules',
  ];

  let totalRows = 0;
  let existingTables = 0;
  let missingTables = 0;

  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`❌ ${table.padEnd(35)} - NOT FOUND`);
        missingTables++;
      } else {
        console.log(`✅ ${table.padEnd(35)} - EXISTS (${(count || 0).toString().padStart(6)} rows)`);
        existingTables++;
        totalRows += (count || 0);
      }
    } catch (err) {
      console.log(`⚠️ ${table.padEnd(35)} - ERROR: ${err.message}`);
      missingTables++;
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log(`\n📊 SUMMARY:`);
  console.log(`   Total Tables Checked: ${tables.length}`);
  console.log(`   ✅ Existing: ${existingTables}`);
  console.log(`   ❌ Missing: ${missingTables}`);
  console.log(`   📈 Total Rows: ${totalRows.toLocaleString()}`);
  console.log('\n' + '='.repeat(80));
}

checkAllTables().catch(console.error);
