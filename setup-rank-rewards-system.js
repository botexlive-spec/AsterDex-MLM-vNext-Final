import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://postgres.dsgtyrwtlpnckvcozfbc:Dubai%401234%23@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres';

async function setupRankRewardsSystem() {
  const client = new Client({ connectionString });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected!\n');

    // Step 1: Create rank_rewards configuration table
    console.log('1️⃣  Creating rank_rewards table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.rank_rewards (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        rank_name VARCHAR(50) NOT NULL UNIQUE,
        reward_amount DECIMAL(20,8) NOT NULL,
        rank_order INTEGER NOT NULL,

        -- Requirements
        min_direct_referrals INTEGER DEFAULT 0,
        min_team_volume DECIMAL(20,8) DEFAULT 0,
        min_active_directs INTEGER DEFAULT 0,
        min_personal_sales DECIMAL(20,8) DEFAULT 0,

        -- Terms and Conditions
        terms_conditions TEXT,
        is_active BOOLEAN DEFAULT true,

        -- Reward Details
        reward_type VARCHAR(20) DEFAULT 'one_time', -- one_time, monthly, quarterly
        bonus_percentage DECIMAL(5,2) DEFAULT 0,

        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('   ✅ Table created\n');

    // Step 2: Insert default rank rewards
    console.log('2️⃣  Inserting default rank rewards...');
    const defaultRanks = [
      {
        rank_name: 'Bronze',
        reward_amount: 500,
        rank_order: 1,
        min_direct_referrals: 5,
        min_team_volume: 5000,
        min_active_directs: 3,
        min_personal_sales: 1000,
        terms_conditions: `Bronze Rank Requirements:
• Minimum 5 direct referrals
• Team volume of $5,000+
• At least 3 active direct referrals
• Personal sales of $1,000+
• All referrals must have active packages
• Reward paid within 7 days of achievement`,
        reward_type: 'one_time',
        bonus_percentage: 0
      },
      {
        rank_name: 'Silver',
        reward_amount: 1500,
        rank_order: 2,
        min_direct_referrals: 10,
        min_team_volume: 15000,
        min_active_directs: 7,
        min_personal_sales: 3000,
        terms_conditions: `Silver Rank Requirements:
• Minimum 10 direct referrals
• Team volume of $15,000+
• At least 7 active direct referrals
• Personal sales of $3,000+
• Must have achieved Bronze rank first
• Includes 2% lifetime commission boost`,
        reward_type: 'one_time',
        bonus_percentage: 2
      },
      {
        rank_name: 'Gold',
        reward_amount: 5000,
        rank_order: 3,
        min_direct_referrals: 20,
        min_team_volume: 50000,
        min_active_directs: 15,
        min_personal_sales: 10000,
        terms_conditions: `Gold Rank Requirements:
• Minimum 20 direct referrals
• Team volume of $50,000+
• At least 15 active direct referrals
• Personal sales of $10,000+
• Must have achieved Silver rank first
• Includes 5% lifetime commission boost
• Monthly leadership bonus eligible`,
        reward_type: 'one_time',
        bonus_percentage: 5
      },
      {
        rank_name: 'Platinum',
        reward_amount: 15000,
        rank_order: 4,
        min_direct_referrals: 50,
        min_team_volume: 200000,
        min_active_directs: 30,
        min_personal_sales: 30000,
        terms_conditions: `Platinum Rank Requirements:
• Minimum 50 direct referrals
• Team volume of $200,000+
• At least 30 active direct referrals
• Personal sales of $30,000+
• Must have achieved Gold rank first
• Includes 10% lifetime commission boost
• Monthly leadership bonus of $500
• Quarterly profit share eligible`,
        reward_type: 'one_time',
        bonus_percentage: 10
      },
      {
        rank_name: 'Diamond',
        reward_amount: 50000,
        rank_order: 5,
        min_direct_referrals: 100,
        min_team_volume: 1000000,
        min_active_directs: 60,
        min_personal_sales: 100000,
        terms_conditions: `Diamond Rank Requirements:
• Minimum 100 direct referrals
• Team volume of $1,000,000+
• At least 60 active direct referrals
• Personal sales of $100,000+
• Must have achieved Platinum rank first
• Includes 15% lifetime commission boost
• Monthly leadership bonus of $2,000
• Quarterly profit share of 2%
• Annual company trip for 2
• Priority support access`,
        reward_type: 'one_time',
        bonus_percentage: 15
      }
    ];

    for (const rank of defaultRanks) {
      await client.query(`
        INSERT INTO public.rank_rewards
        (rank_name, reward_amount, rank_order, min_direct_referrals, min_team_volume,
         min_active_directs, min_personal_sales, terms_conditions, reward_type, bonus_percentage)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (rank_name) DO UPDATE SET
          reward_amount = EXCLUDED.reward_amount,
          rank_order = EXCLUDED.rank_order,
          min_direct_referrals = EXCLUDED.min_direct_referrals,
          min_team_volume = EXCLUDED.min_team_volume,
          min_active_directs = EXCLUDED.min_active_directs,
          min_personal_sales = EXCLUDED.min_personal_sales,
          terms_conditions = EXCLUDED.terms_conditions,
          reward_type = EXCLUDED.reward_type,
          bonus_percentage = EXCLUDED.bonus_percentage,
          updated_at = NOW();
      `, [
        rank.rank_name,
        rank.reward_amount,
        rank.rank_order,
        rank.min_direct_referrals,
        rank.min_team_volume,
        rank.min_active_directs,
        rank.min_personal_sales,
        rank.terms_conditions,
        rank.reward_type,
        rank.bonus_percentage
      ]);
      console.log(`   ✅ ${rank.rank_name} rank configured`);
    }
    console.log('');

    // Step 3: Create indexes
    console.log('3️⃣  Creating indexes...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_rank_rewards_rank_order
      ON public.rank_rewards(rank_order);

      CREATE INDEX IF NOT EXISTS idx_rank_rewards_is_active
      ON public.rank_rewards(is_active);

      CREATE INDEX IF NOT EXISTS idx_rank_achievements_user_id
      ON public.rank_achievements(user_id);

      CREATE INDEX IF NOT EXISTS idx_rank_achievements_rank
      ON public.rank_achievements(rank);
    `);
    console.log('   ✅ Indexes created\n');

    // Step 4: Set up RLS policies
    console.log('4️⃣  Setting up RLS policies...');

    // rank_rewards table
    await client.query(`ALTER TABLE public.rank_rewards ENABLE ROW LEVEL SECURITY;`);

    const policies = await client.query(`
      SELECT policyname FROM pg_policies
      WHERE tablename = 'rank_rewards' AND schemaname = 'public';
    `);

    for (const policy of policies.rows) {
      await client.query(`DROP POLICY IF EXISTS "${policy.policyname}" ON public.rank_rewards;`);
    }

    await client.query(`
      CREATE POLICY "admins_full_access"
      ON public.rank_rewards
      FOR ALL
      TO authenticated
      USING (public.is_admin())
      WITH CHECK (public.is_admin());
    `);

    await client.query(`
      CREATE POLICY "authenticated_users_view"
      ON public.rank_rewards
      FOR SELECT
      TO authenticated
      USING (is_active = true);
    `);

    console.log('   ✅ RLS policies configured\n');

    // Step 5: Create rank_distribution_history table
    console.log('5️⃣  Creating rank_distribution_history table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.rank_distribution_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES auth.users(id),
        rank_name VARCHAR(50) NOT NULL,
        reward_amount DECIMAL(20,8) NOT NULL,
        distributed_by UUID REFERENCES auth.users(id),
        distribution_type VARCHAR(20) DEFAULT 'automatic',
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('   ✅ Table created\n');

    // Step 6: RLS for distribution history
    console.log('6️⃣  Setting up RLS for distribution history...');
    await client.query(`ALTER TABLE public.rank_distribution_history ENABLE ROW LEVEL SECURITY;`);

    await client.query(`
      CREATE POLICY "admins_full_access"
      ON public.rank_distribution_history
      FOR ALL
      TO authenticated
      USING (public.is_admin())
      WITH CHECK (public.is_admin());
    `);

    await client.query(`
      CREATE POLICY "users_view_own"
      ON public.rank_distribution_history
      FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());
    `);
    console.log('   ✅ RLS configured\n');

    console.log('='.repeat(60));
    console.log('🎉 Rank Rewards System Setup Complete!');
    console.log('='.repeat(60));
    console.log('\n📋 Summary:');
    console.log('   ✅ rank_rewards table created');
    console.log('   ✅ 5 default ranks configured (Bronze → Diamond)');
    console.log('   ✅ Terms & conditions added');
    console.log('   ✅ rank_distribution_history table created');
    console.log('   ✅ RLS policies configured');
    console.log('   ✅ Indexes created\n');

    console.log('💎 Configured Ranks:');
    console.log('   1. Bronze    - $500    (5 directs, $5k volume)');
    console.log('   2. Silver    - $1,500  (10 directs, $15k volume)');
    console.log('   3. Gold      - $5,000  (20 directs, $50k volume)');
    console.log('   4. Platinum  - $15,000 (50 directs, $200k volume)');
    console.log('   5. Diamond   - $50,000 (100 directs, $1M volume)\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Full error:', error);
  } finally {
    await client.end();
    console.log('👋 Connection closed');
  }
}

setupRankRewardsSystem();
