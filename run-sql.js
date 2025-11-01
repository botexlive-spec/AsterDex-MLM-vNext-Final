import pg from 'pg';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const connectionString = 'postgresql://postgres.dsgtyrwtlpnckvcozfbc:Dubai%401234%23@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres';

async function runSQL() {
  const client = new Client({
    connectionString: connectionString,
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully!');

    const sqlFile = join(__dirname, 'database', 'COMPLETE_PACKAGE_MLM_SCHEMA.sql');
    console.log(`📄 Reading SQL file: ${sqlFile}`);
    const sql = fs.readFileSync(sqlFile, 'utf8');

    console.log('🚀 Executing SQL...');
    await client.query(sql);
    console.log('✅ SQL executed successfully!');
    console.log('✅ Packages table has been created/updated with max_return_percentage column');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  } finally {
    await client.end();
    console.log('👋 Connection closed');
  }
}

runSQL();
