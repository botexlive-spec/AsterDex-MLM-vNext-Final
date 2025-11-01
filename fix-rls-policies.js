import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://postgres.dsgtyrwtlpnckvcozfbc:Dubai%401234%23@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres';

async function fixRLSPolicies() {
  const client = new Client({ connectionString });

  try {
    console.log('🔌 Connecting...');
    await client.connect();
    console.log('✅ Connected!\n');

    console.log('🔒 Fixing RLS policies for packages table...\n');

    // Drop existing admin policy
    console.log('1. Dropping old admin policy...');
    await client.query(`
      DROP POLICY IF EXISTS "Admins can manage packages" ON public.packages;
    `);
    console.log('✅ Old policy dropped\n');

    // Create new comprehensive admin policy
    console.log('2. Creating new admin policy for ALL operations...');
    await client.query(`
      CREATE POLICY "Admins can manage packages"
      ON public.packages
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM auth.users 
          WHERE id = auth.uid() 
          AND raw_user_meta_data->>'role' = 'admin'
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM auth.users 
          WHERE id = auth.uid() 
          AND raw_user_meta_data->>'role' = 'admin'
        )
      );
    `);
    console.log('✅ New admin policy created\n');

    // Also create a policy that allows service role to do anything
    console.log('3. Creating service role bypass policy...');
    await client.query(`
      DROP POLICY IF EXISTS "Service role can do anything" ON public.packages;
      CREATE POLICY "Service role can do anything"
      ON public.packages
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
    `);
    console.log('✅ Service role policy created\n');

    console.log('🎉 All RLS policies fixed!');
    console.log('\n📝 Summary:');
    console.log('   - Admins can now INSERT, UPDATE, DELETE packages');
    console.log('   - Service role has full access');
    console.log('   - Regular users can still SELECT active packages');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Details:', error);
  } finally {
    await client.end();
    console.log('\n👋 Connection closed');
  }
}

fixRLSPolicies();
