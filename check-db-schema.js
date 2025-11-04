import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabaseSchema() {
  console.log('\n🔍 DATABASE SCHEMA CHECK\n');
  console.log('='.repeat(80));

  try {
    // Get all tables in the public schema
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .order('table_name');

    if (tablesError) {
      console.error('❌ Error fetching tables:', tablesError);
      return;
    }

    console.log(`\n✅ Found ${tables?.length || 0} tables in database:\n`);

    if (!tables || tables.length === 0) {
      console.log('⚠️ No tables found!');
      return;
    }

    // Check each table
    for (const table of tables) {
      const tableName = table.table_name;

      // Skip system tables
      if (tableName.startsWith('_')) continue;

      // Get row count
      const { count, error: countError } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });

      // Get columns
      const { data: columns, error: colError } = await supabase.rpc('get_table_columns', {
        table_name: tableName
      }).catch(() => null);

      console.log(`\n📊 Table: ${tableName}`);
      console.log(`   Rows: ${countError ? 'Error' : count || 0}`);

      if (countError && countError.message) {
        console.log(`   ⚠️ Access Error: ${countError.message}`);
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('\n✅ Database schema check complete!');

  } catch (error) {
    console.error('❌ Error checking database schema:', error);
  }
}

// Run the check
checkDatabaseSchema();
