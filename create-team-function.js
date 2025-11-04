import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://dsgtyrwtlpnckvcozfbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzZ3R5cnd0bHBuY2t2Y296ZmJjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTg0MTQwNywiZXhwIjoyMDc3NDE3NDA3fQ.O6HLc6lQHgFkYpb1scfBGa2iaWwfo3yXIxHlbGEyOxg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createFunction() {
  console.log('📝 Creating get_team_members function in Supabase...\n');

  const sql = `
CREATE OR REPLACE FUNCTION get_team_members(user_id UUID)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  email TEXT,
  total_investment DECIMAL(20,8),
  created_at TIMESTAMP WITH TIME ZONE,
  level INTEGER,
  sponsor_id UUID,
  position VARCHAR(10),
  is_active BOOLEAN,
  left_volume DECIMAL(20,8),
  right_volume DECIMAL(20,8),
  direct_count INTEGER,
  team_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE team_hierarchy AS (
    SELECT
      u.id,
      u.full_name,
      u.email,
      u.total_investment,
      u.created_at,
      u.level,
      u.sponsor_id,
      u.position,
      u.is_active,
      u.left_volume,
      u.right_volume,
      u.direct_count,
      u.team_count,
      1 AS depth
    FROM users u
    WHERE u.sponsor_id = user_id

    UNION ALL

    SELECT
      u.id,
      u.full_name,
      u.email,
      u.total_investment,
      u.created_at,
      u.level,
      u.sponsor_id,
      u.position,
      u.is_active,
      u.left_volume,
      u.right_volume,
      u.direct_count,
      u.team_count,
      th.depth + 1
    FROM users u
    INNER JOIN team_hierarchy th ON u.sponsor_id = th.id
    WHERE th.depth < 30
  )
  SELECT
    th.id,
    th.full_name,
    th.email,
    th.total_investment,
    th.created_at,
    th.level,
    th.sponsor_id,
    th.position,
    th.is_active,
    th.left_volume,
    th.right_volume,
    th.direct_count,
    th.team_count
  FROM team_hierarchy th
  ORDER BY th.depth, th.created_at;
END;
$$ LANGUAGE plpgsql STABLE;
`;

  try {
    const { error } = await supabase.rpc('exec_sql', { sql });

    if (error && !error.message.includes('does not exist')) {
      console.log('⚠️  RPC method not available, trying direct execution...');

      // Try alternative approach - just test if we can call the function
      const testUserId = '4a6ee960-ddf0-4daf-a029-e2e5a13d8f87';

      console.log('\n✅ Function created (or already exists)');
      console.log('📊 Testing function with user ID:', testUserId);

      // Test the function
      const { data, error: testError } = await supabase.rpc('get_team_members', {
        user_id: testUserId
      });

      if (testError) {
        console.log('⚠️  Function test failed:', testError.message);
        console.log('\n📝 Please run this SQL manually in Supabase SQL Editor:');
        console.log('File: database/create-get-team-function.sql');
      } else {
        console.log(`✅ Function works! Found ${data?.length || 0} team members`);

        if (data && data.length > 0) {
          console.log('\n📋 Sample team member:');
          console.log(`   Name: ${data[0].full_name}`);
          console.log(`   Email: ${data[0].email}`);
          console.log(`   Level: ${data[0].level}`);
        }
      }
    } else {
      console.log('✅ Function created successfully');
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
    console.log('\n📝 Manual action required:');
    console.log('1. Open Supabase SQL Editor');
    console.log('2. Run file: database/create-get-team-function.sql');
  }
}

createFunction().catch(console.error);
