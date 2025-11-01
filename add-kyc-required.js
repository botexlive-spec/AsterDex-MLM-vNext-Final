import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://postgres.dsgtyrwtlpnckvcozfbc:Dubai%401234%23@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres';

async function addMissingColumns() {
  const client = new Client({ connectionString });

  try {
    console.log('🔌 Connecting...');
    await client.connect();
    console.log('✅ Connected!\n');

    console.log('➕ Adding kyc_required column...');
    await client.query(`
      ALTER TABLE public.packages
      ADD COLUMN IF NOT EXISTS kyc_required BOOLEAN DEFAULT false;
    `);
    console.log('✅ kyc_required column added!\n');

    console.log('➕ Adding all other missing MLM columns...');
    
    // Add binary_volume_multiplier
    await client.query(`
      ALTER TABLE public.packages
      ADD COLUMN IF NOT EXISTS binary_volume_multiplier DECIMAL(3,1) DEFAULT 1.0;
    `);
    console.log('✅ binary_volume_multiplier added');

    // Add image_url
    await client.query(`
      ALTER TABLE public.packages
      ADD COLUMN IF NOT EXISTS image_url TEXT;
    `);
    console.log('✅ image_url added');

    // Add allow_multiple_purchases
    await client.query(`
      ALTER TABLE public.packages
      ADD COLUMN IF NOT EXISTS allow_multiple_purchases BOOLEAN DEFAULT true;
    `);
    console.log('✅ allow_multiple_purchases added');

    // Add allow_upgrades
    await client.query(`
      ALTER TABLE public.packages
      ADD COLUMN IF NOT EXISTS allow_upgrades BOOLEAN DEFAULT true;
    `);
    console.log('✅ allow_upgrades added');

    // Add auto_renewal
    await client.query(`
      ALTER TABLE public.packages
      ADD COLUMN IF NOT EXISTS auto_renewal BOOLEAN DEFAULT false;
    `);
    console.log('✅ auto_renewal added');

    // Add min_rank_required
    await client.query(`
      ALTER TABLE public.packages
      ADD COLUMN IF NOT EXISTS min_rank_required TEXT;
    `);
    console.log('✅ min_rank_required added');

    console.log('\n🔧 Setting default values for existing packages...');
    await client.query(`
      UPDATE public.packages
      SET 
        kyc_required = false,
        robot_required = false,
        binary_volume_multiplier = 1.0,
        allow_multiple_purchases = true,
        allow_upgrades = true,
        auto_renewal = false
      WHERE kyc_required IS NULL 
         OR robot_required IS NULL
         OR binary_volume_multiplier IS NULL;
    `);
    console.log('✅ All existing packages updated!\n');

    console.log('🎉 All columns added successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
    console.log('👋 Done!');
  }
}

addMissingColumns();
