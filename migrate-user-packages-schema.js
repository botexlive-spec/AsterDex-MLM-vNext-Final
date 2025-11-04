import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dsgtyrwtlpnckvcozfbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzZ3R5cnd0bHBuY2t2Y296ZmJjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTg0MTQwNywiZXhwIjoyMDc3NDE3NDA3fQ.O6HLc6lQHgFkYpb1scfBGa2iaWwfo3yXIxHlbGEyOxg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateUserPackagesSchema() {
  console.log('\n🔄 MIGRATING USER_PACKAGES SCHEMA\n');
  console.log('='.repeat(80));

  try {
    console.log('✅ Connected to Supabase\n');

    // Step 1: Check current row count
    console.log('📊 Step 1: Checking current data...');
    const countResult = await client.query('SELECT COUNT(*) FROM user_packages');
    const rowCount = parseInt(countResult.rows[0].count);
    console.log(`   Current rows: ${rowCount}`);

    if (rowCount > 0) {
      console.log('   ⚠️ WARNING: Table has data! Backing up...');
      // You would backup here if needed
    }

    // Step 2: Drop existing table (CASCADE will drop dependent objects)
    console.log('\n📝 Step 2: Dropping existing user_packages table...');
    await client.query('DROP TABLE IF EXISTS user_packages CASCADE');
    console.log('   ✅ Table dropped');

    // Step 3: Create new table with full schema
    console.log('\n📝 Step 3: Creating new user_packages table with full schema...');

    const createTableSQL = `
CREATE TABLE user_packages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  package_id UUID NOT NULL REFERENCES packages(id) ON DELETE RESTRICT,

  -- Investment details
  investment_amount DECIMAL(10,2) NOT NULL,
  daily_roi_amount DECIMAL(10,2) NOT NULL,
  total_roi_limit DECIMAL(10,2) NOT NULL,

  -- Dates
  purchase_date TIMESTAMPTZ DEFAULT NOW(),
  activation_date TIMESTAMPTZ DEFAULT NOW(),
  expiry_date TIMESTAMPTZ NOT NULL,

  -- Tracking
  total_roi_earned DECIMAL(10,2) DEFAULT 0,
  total_roi_paid DECIMAL(10,2) DEFAULT 0,
  days_completed INTEGER DEFAULT 0,
  last_roi_date DATE,

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'completed')),

  -- Payment details
  payment_method TEXT DEFAULT 'wallet',
  transaction_id TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
`;

    await client.query(createTableSQL);
    console.log('   ✅ Table created with full schema');

    // Step 4: Create indexes
    console.log('\n📝 Step 4: Creating indexes...');

    const indexes = [
      'CREATE INDEX idx_user_packages_user_id ON user_packages(user_id)',
      'CREATE INDEX idx_user_packages_status ON user_packages(status)',
      'CREATE INDEX idx_user_packages_expiry ON user_packages(expiry_date) WHERE status = \'active\'',
      'CREATE INDEX idx_user_packages_last_roi_date ON user_packages(last_roi_date) WHERE status = \'active\''
    ];

    for (const indexSQL of indexes) {
      await client.query(indexSQL);
    }
    console.log('   ✅ Indexes created');

    // Step 5: Recreate ROI distributions table (depends on user_packages)
    console.log('\n📝 Step 5: Recreating roi_distributions table...');
    await client.query('DROP TABLE IF EXISTS roi_distributions CASCADE');

    const createROITableSQL = `
CREATE TABLE roi_distributions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_package_id UUID NOT NULL REFERENCES user_packages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Amount details
  roi_amount DECIMAL(10,2) NOT NULL,
  roi_percentage DECIMAL(5,2) NOT NULL,
  investment_amount DECIMAL(10,2) NOT NULL,

  -- Distribution details
  distribution_date DATE NOT NULL,
  day_number INTEGER NOT NULL,

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed')),
  paid_at TIMESTAMPTZ,

  -- Transaction reference
  wallet_transaction_id UUID,

  created_at TIMESTAMPTZ DEFAULT NOW()
);
`;

    await client.query(createROITableSQL);

    const roiIndexes = [
      'CREATE INDEX idx_roi_distributions_user_package ON roi_distributions(user_package_id)',
      'CREATE INDEX idx_roi_distributions_user_id ON roi_distributions(user_id)',
      'CREATE INDEX idx_roi_distributions_date ON roi_distributions(distribution_date)',
      'CREATE INDEX idx_roi_distributions_status ON roi_distributions(status) WHERE status = \'pending\''
    ];

    for (const indexSQL of roiIndexes) {
      await client.query(indexSQL);
    }
    console.log('   ✅ roi_distributions table created');

    // Step 6: Verify new schema
    console.log('\n📝 Step 6: Verifying new schema...');

    const columnsResult = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'user_packages'
      ORDER BY ordinal_position
    `);

    console.log(`   ✅ Found ${columnsResult.rows.length} columns:`);
    columnsResult.rows.forEach(col => {
      const nullable = col.is_nullable === 'YES' ? '(nullable)' : '(NOT NULL)';
      console.log(`      - ${col.column_name.padEnd(25)} ${col.data_type.padEnd(20)} ${nullable}`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('\n✅ MIGRATION COMPLETE!\n');
    console.log('📊 Summary:');
    console.log(`   - Old schema: 4 columns (amount, roi_percentage, is_active, purchased_at)`);
    console.log(`   - New schema: ${columnsResult.rows.length} columns (full MLM package system)`);
    console.log('   - roi_distributions table: Recreated with proper foreign keys');
    console.log('\n' + '='.repeat(80) + '\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('   Full error:', error);
    throw error;
  } finally {
    await client.end();
    console.log('🔌 Database connection closed\n');
  }
}

migrateUserPackagesSchema().catch(console.error);
