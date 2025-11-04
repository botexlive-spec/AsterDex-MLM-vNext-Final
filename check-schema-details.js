import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dsgtyrwtlpnckvcozfbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzZ3R5cnd0bHBuY2t2Y296ZmJjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTg0MTQwNywiZXhwIjoyMDc3NDE3NDA3fQ.O6HLc6lQHgFkYpb1scfBGa2iaWwfo3yXIxHlbGEyOxg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchemaDetails() {
  console.log('\n🔍 CHECKING SCHEMA DETAILS\n');
  console.log('='.repeat(80));

  // Check Packages columns
  console.log('\n📦 PACKAGES TABLE:');
  const { data: packages, error: pkgError } = await supabase
    .from('packages')
    .select('*')
    .limit(1);

  if (!pkgError && packages && packages.length > 0) {
    console.log('   Columns:', Object.keys(packages[0]).join(', '));
    console.log('   Sample:', JSON.stringify(packages[0], null, 2));
  } else {
    console.log('   Error:', pkgError?.message);
  }

  // Check Commission Settings columns
  console.log('\n💰 COMMISSION_SETTINGS TABLE:');
  const { data: commSettings, error: commError } = await supabase
    .from('commission_settings')
    .select('*')
    .limit(1);

  if (!commError && commSettings && commSettings.length > 0) {
    console.log('   Columns:', Object.keys(commSettings[0]).join(', '));
    console.log('   Sample:', JSON.stringify(commSettings[0], null, 2));
  } else {
    console.log('   Error:', commError?.message);
  }

  // Check Rank Rewards columns
  console.log('\n🏆 RANK_REWARDS TABLE:');
  const { data: rankRewards, error: rankError } = await supabase
    .from('rank_rewards')
    .select('*')
    .limit(1);

  if (!rankError && rankRewards && rankRewards.length > 0) {
    console.log('   Columns:', Object.keys(rankRewards[0]).join(', '));
    console.log('   Sample:', JSON.stringify(rankRewards[0], null, 2));
  } else {
    console.log('   Error:', rankError?.message);
  }

  // Check Users columns
  console.log('\n👤 USERS TABLE:');
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('*')
    .limit(1);

  if (!usersError && users && users.length > 0) {
    console.log('   Columns:', Object.keys(users[0]).join(', '));
  } else {
    console.log('   Error:', usersError?.message);
  }

  // Check Wallets columns
  console.log('\n💳 WALLETS TABLE:');
  const { data: wallets, error: walletsError } = await supabase
    .from('wallets')
    .select('*')
    .limit(1);

  if (!walletsError && wallets && wallets.length > 0) {
    console.log('   Columns:', Object.keys(wallets[0]).join(', '));
  } else {
    console.log('   Error:', walletsError?.message);
  }

  // Check Binary Nodes columns
  console.log('\n🌳 BINARY_NODES TABLE:');
  const { data: nodes, error: nodesError } = await supabase
    .from('binary_nodes')
    .select('*')
    .limit(1);

  if (!nodesError && nodes && nodes.length > 0) {
    console.log('   Columns:', Object.keys(nodes[0]).join(', '));
  } else {
    console.log('   Error:', nodesError?.message);
  }

  console.log('\n' + '='.repeat(80) + '\n');
}

checkSchemaDetails().catch(console.error);
