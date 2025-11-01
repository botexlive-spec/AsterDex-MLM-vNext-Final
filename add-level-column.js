import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://postgres.dsgtyrwtlpnckvcozfbc:Dubai%401234%23@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres';

async function addLevelColumn() {
  const client = new Client({ connectionString });
  await client.connect();

  try {
    console.log('🔧 Adding level column to users table...\n');

    // Add level column if it doesn't exist
    await client.query(`
      ALTER TABLE public.users
      ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;
    `);
    console.log('✅ Level column added\n');

    console.log('📊 Calculating and updating user levels...\n');

    // Function to calculate level recursively
    const calculateLevel = async (userId, level = 1) => {
      await client.query(`UPDATE public.users SET level = $1 WHERE id = $2`, [level, userId]);

      // Get all users sponsored by this user
      const children = await client.query(`
        SELECT id FROM public.users WHERE sponsor_id = $1
      `, [userId]);

      for (const child of children.rows) {
        await calculateLevel(child.id, level + 1);
      }
    };

    // Start from root users (users with no sponsor)
    const rootUsers = await client.query(`
      SELECT id FROM public.users WHERE sponsor_id IS NULL AND email LIKE '%@finaster.com'
    `);

    for (const root of rootUsers.rows) {
      await calculateLevel(root.id, 1);
    }

    console.log('✅ Levels calculated\n');

    // Show level distribution
    console.log('📊 LEVEL DISTRIBUTION:\n');
    const levelDist = await client.query(`
      SELECT level, COUNT(*) as count
      FROM public.users
      WHERE email LIKE '%@finaster.com'
      GROUP BY level
      ORDER BY level
    `);

    levelDist.rows.forEach(r => {
      console.log(`   Level ${String(r.level).padStart(2, ' ')}: ${r.count} users`);
    });

    console.log('\n✅ Level column setup complete!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

addLevelColumn();
