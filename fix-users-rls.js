import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://postgres.dsgtyrwtlpnckvcozfbc:Dubai%401234%23@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres';

async function fixUsersRLS() {
  const client = new Client({ connectionString });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected!\n');

    // Drop existing policies on users table
    console.log('🗑️ Dropping existing RLS policies on users table...');
    await client.query(`
      DROP POLICY IF EXISTS "Users can view own data" ON public.users;
      DROP POLICY IF EXISTS "Users can update own data" ON public.users;
      DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
      DROP POLICY IF EXISTS "Admins can manage all users" ON public.users;
      DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.users;
      DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.users;
      DROP POLICY IF EXISTS "Enable update for users based on id" ON public.users;
    `);
    console.log('✅ Existing policies dropped!\n');

    // Enable RLS on users table
    console.log('🔒 Enabling Row Level Security on users table...');
    await client.query(`
      ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
    `);
    console.log('✅ RLS enabled!\n');

    // Create comprehensive RLS policies for users table
    console.log('📝 Creating new RLS policies...');

    // Policy 1: Admins can do everything
    await client.query(`
      CREATE POLICY "Admins have full access to users"
      ON public.users
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM auth.users
          WHERE auth.users.id = auth.uid()
          AND (
            auth.users.raw_user_meta_data->>'role' = 'admin'
            OR auth.users.raw_user_meta_data->>'role' = 'ADMIN'
          )
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM auth.users
          WHERE auth.users.id = auth.uid()
          AND (
            auth.users.raw_user_meta_data->>'role' = 'admin'
            OR auth.users.raw_user_meta_data->>'role' = 'ADMIN'
          )
        )
      );
    `);
    console.log('✅ Admin policy created');

    // Policy 2: Users can view their own data
    await client.query(`
      CREATE POLICY "Users can view own profile"
      ON public.users
      FOR SELECT
      TO authenticated
      USING (id = auth.uid());
    `);
    console.log('✅ User view own data policy created');

    // Policy 3: Users can update their own data
    await client.query(`
      CREATE POLICY "Users can update own profile"
      ON public.users
      FOR UPDATE
      TO authenticated
      USING (id = auth.uid())
      WITH CHECK (id = auth.uid());
    `);
    console.log('✅ User update own data policy created');

    // Policy 4: Allow authenticated users to insert (for registration)
    await client.query(`
      CREATE POLICY "Allow user registration"
      ON public.users
      FOR INSERT
      TO authenticated
      WITH CHECK (id = auth.uid());
    `);
    console.log('✅ User registration policy created\n');

    console.log('🎉 All RLS policies created successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  } finally {
    await client.end();
    console.log('👋 Connection closed');
  }
}

fixUsersRLS();
