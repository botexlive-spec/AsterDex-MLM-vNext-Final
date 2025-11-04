/**
 * Run Support Tables Migration
 * Creates all tables needed for Support Management feature
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Supabase configuration
const SUPABASE_URL = 'https://dsgtyrwtlpnckvcozfbc.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzZ3R5cnd0bHBuY2t2Y296ZmJjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMzU1MzI4MywiZXhwIjoyMDQ5MTI5MjgzfQ.H8p6fEV9CZhsyH4_7tEFEv9K-qSr4BOt6jSjgJhZ4Qo';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function runMigration() {
  try {
    console.log('📊 Starting Support Tables Migration...\n');

    // Read SQL file
    const sqlPath = join(__dirname, 'create-support-tables.sql');
    const sql = readFileSync(sqlPath, 'utf-8');

    console.log('📝 Read SQL migration file');
    console.log('📏 SQL file size:', sql.length, 'bytes\n');

    // Execute SQL
    console.log('⚙️ Executing migration...');

    // Split by semicolon and execute each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (!statement || statement.length < 10) continue;

      try {
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement });

        if (error) {
          // Try direct execution if rpc fails
          const { error: directError } = await supabase.from('_sql').insert({ query: statement });

          if (directError) {
            // Some statements might fail if they already exist, which is okay
            if (
              directError.message?.includes('already exists') ||
              directError.message?.includes('duplicate')
            ) {
              console.log(`  ⚠️ Statement ${i + 1}: Already exists (skipping)`);
            } else {
              console.error(`  ❌ Statement ${i + 1}: Error -`, directError.message);
              errorCount++;
            }
          } else {
            console.log(`  ✅ Statement ${i + 1}: Success`);
            successCount++;
          }
        } else {
          console.log(`  ✅ Statement ${i + 1}: Success`);
          successCount++;
        }
      } catch (err) {
        console.error(`  ❌ Statement ${i + 1}: Error -`, err.message);
        errorCount++;
      }
    }

    console.log(`\n📊 Migration Summary:`);
    console.log(`  ✅ Successful statements: ${successCount}`);
    console.log(`  ❌ Failed statements: ${errorCount}`);

    if (errorCount === 0) {
      console.log('\n✅ Migration completed successfully!');
    } else {
      console.log('\n⚠️ Migration completed with some errors. Check the logs above.');
    }

    // Verify tables were created
    console.log('\n🔍 Verifying tables...');

    const tablesToCheck = [
      'support_tickets',
      'ticket_messages',
      'canned_responses',
      'chat_sessions',
      'chat_messages',
    ];

    for (const table of tablesToCheck) {
      const { data, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`  ❌ Table '${table}': Not found or inaccessible`);
      } else {
        console.log(`  ✅ Table '${table}': Exists`);
      }
    }

    console.log('\n✅ Migration verification complete!');
    console.log('\n📝 Next steps:');
    console.log('  1. Verify tables in Supabase dashboard');
    console.log('  2. Test support management functionality');
    console.log('  3. Create some test tickets and chat sessions\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  }
}

// Run migration
runMigration();
