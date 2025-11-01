import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://postgres.dsgtyrwtlpnckvcozfbc:Dubai%401234%23@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres';

async function verifyRanks() {
  const client = new Client({ connectionString });

  try {
    await client.connect();

    const res = await client.query(`
      SELECT rank_name, reward_amount, rank_order,
             min_direct_referrals, min_team_volume,
             is_active, reward_type, bonus_percentage
      FROM public.rank_rewards
      ORDER BY rank_order
    `);

    console.log('\n📊 Rank Rewards in Database:\n');
    console.log('='.repeat(80));

    res.rows.forEach(r => {
      console.log(`${r.rank_order}. ${r.rank_name}`);
      console.log(`   💰 Reward: $${r.reward_amount}`);
      console.log(`   📋 Requirements: ${r.min_direct_referrals} directs, $${r.min_team_volume} volume`);
      console.log(`   🎁 Bonus: ${r.bonus_percentage}% | Type: ${r.reward_type} | Active: ${r.is_active}`);
      console.log('-'.repeat(80));
    });

    console.log(`\n✅ Total ranks configured: ${res.rows.length}\n`);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

verifyRanks();
