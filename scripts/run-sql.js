/**
 * SQL Runner - Execute SQL commands from terminal
 * Usage: node scripts/run-sql.js <sql-file>
 * Example: node scripts/run-sql.js database/create-wallets-table.sql
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read Supabase credentials from .env
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');

const getEnvValue = (key) => {
  const match = envContent.match(new RegExp(`${key}=(.+)`));
  return match ? match[1].trim() : null;
};

const supabaseUrl = getEnvValue('VITE_SUPABASE_URL');
const supabaseKey = getEnvValue('VITE_SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Supabase credentials not found in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runSQL(sqlFilePath) {
  try {
    console.log(`\n📂 Reading SQL file: ${sqlFilePath}`);

    const fullPath = path.isAbsolute(sqlFilePath)
      ? sqlFilePath
      : path.join(__dirname, '..', sqlFilePath);

    if (!fs.existsSync(fullPath)) {
      console.error(`❌ File not found: ${fullPath}`);
      process.exit(1);
    }

    const sql = fs.readFileSync(fullPath, 'utf-8');

    console.log('\n🚀 Executing SQL...\n');
    console.log('─'.repeat(60));
    console.log(sql);
    console.log('─'.repeat(60));

    // Execute SQL using Supabase RPC
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      console.error('\n❌ SQL Error:', error.message);
      console.error('Details:', error);
      process.exit(1);
    }

    console.log('\n✅ SQL executed successfully!');

    if (data) {
      console.log('\n📊 Results:');
      console.table(data);
    }

    console.log('\n✨ Done!\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Get SQL file from command line argument
const sqlFile = process.argv[2];

if (!sqlFile) {
  console.log(`
📖 Usage:
  node scripts/run-sql.js <sql-file>

📝 Examples:
  node scripts/run-sql.js database/create-wallets-table.sql
  node scripts/run-sql.js database/setup-packages-table.sql

📁 Available SQL files:
  - database/create-wallets-table.sql
  - database/setup-packages-table.sql
  `);
  process.exit(0);
}

runSQL(sqlFile);
