/**
 * Database Manager - Direct PostgreSQL Access
 *
 * SETUP:
 * 1. Get your Supabase database connection string:
 *    - Go to https://app.supabase.com/project/YOUR_PROJECT/settings/database
 *    - Copy "Connection string" under "Connection pooling"
 *
 * 2. Add to .env file:
 *    DATABASE_URL=postgresql://postgres.[PROJECT]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
 *
 * USAGE:
 *   node scripts/db-manager.js <command>
 *
 * COMMANDS:
 *   setup-wallets    - Create wallets table and add $10,000 to all users
 *   setup-packages   - Create packages table and insert sample packages
 *   run-sql <file>   - Run any SQL file
 *   list-tables      - Show all database tables
 *   list-users       - Show all users
 *   list-wallets     - Show all wallets
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read DATABASE_URL from .env
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');

const getEnvValue = (key) => {
  const match = envContent.match(new RegExp(`${key}=(.+)`));
  return match ? match[1].trim() : null;
};

const DATABASE_URL = getEnvValue('DATABASE_URL');

if (!DATABASE_URL) {
  console.error(`
❌ DATABASE_URL not found in .env file!

📝 TO FIX:
1. Go to: https://app.supabase.com/project/dsgtyrwtlpnckvcozfbc/settings/database
2. Scroll to "Connection pooling"
3. Copy the "Connection string" (Mode: Transaction, Port: 6543)
4. Add to your .env file:

   DATABASE_URL=postgresql://postgres.[PROJECT]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres

5. Replace [PASSWORD] with your database password
`);
  process.exit(1);
}

// SQL Scripts
const CREATE_WALLETS_SQL = `
-- Create wallets table
CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID UNIQUE NOT NULL,
  available_balance DECIMAL(18,6) DEFAULT 0,
  total_balance DECIMAL(18,6) DEFAULT 0,
  locked_balance DECIMAL(18,6) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

-- Create policies (simplified for direct connection)
DROP POLICY IF EXISTS "Users can view own wallet" ON public.wallets;
CREATE POLICY "Users can view own wallet"
  ON public.wallets FOR SELECT
  USING (true);

-- Add $10,000 to all users
INSERT INTO public.wallets (user_id, available_balance, total_balance)
SELECT id, 10000.00, 10000.00
FROM auth.users
ON CONFLICT (user_id)
DO UPDATE SET
  available_balance = 10000.00,
  total_balance = 10000.00;
`;

const CREATE_PACKAGES_SQL = `
-- Create packages table
CREATE TABLE IF NOT EXISTS public.packages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  min_investment DECIMAL(10,2) NOT NULL,
  max_investment DECIMAL(10,2) NOT NULL,
  daily_return_percentage DECIMAL(5,2) NOT NULL,
  duration_days INTEGER NOT NULL DEFAULT 365,
  level_depth INTEGER NOT NULL,
  binary_bonus_percentage DECIMAL(5,2) NOT NULL,
  features JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'active',
  is_popular BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS and real-time
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read active packages" ON public.packages FOR SELECT USING (status = 'active');
ALTER PUBLICATION supabase_realtime ADD TABLE public.packages;

-- Insert sample packages
INSERT INTO public.packages (name, description, min_investment, max_investment, daily_return_percentage, duration_days, level_depth, binary_bonus_percentage, features, status, is_popular, sort_order)
VALUES
('Starter Package', 'Perfect for beginners', 100, 2000, 5.0, 365, 10, 10, '["Daily ROI", "Level income 10 levels", "Binary bonus", "Email support"]'::jsonb, 'active', false, 0),
('Growth Package', 'Ideal for growth', 2001, 5000, 7.0, 365, 15, 12, '["Higher returns 7%", "Level income 15 levels", "Enhanced binary 12%", "Priority support"]'::jsonb, 'active', true, 1),
('Premium Package', 'Maximum potential', 5001, 50000, 10.0, 365, 30, 15, '["Maximum ROI 10%", "Level income 30 levels", "Premium binary 15%", "VIP support"]'::jsonb, 'active', false, 2)
ON CONFLICT (name) DO NOTHING;
`;

// Command handlers
async function setupWallets(client) {
  console.log('\n🔧 Setting up wallets table...\n');
  await client.query(CREATE_WALLETS_SQL);

  const result = await client.query('SELECT COUNT(*) as count, SUM(available_balance) as total FROM public.wallets');
  console.log(`✅ Wallets created: ${result.rows[0].count}`);
  console.log(`💰 Total balance: $${result.rows[0].total}\n`);
}

async function setupPackages(client) {
  console.log('\n🔧 Setting up packages table...\n');
  await client.query(CREATE_PACKAGES_SQL);

  const result = await client.query('SELECT name, min_investment, max_investment, daily_return_percentage, is_popular FROM public.packages ORDER BY sort_order');
  console.log('✅ Packages created:\n');
  console.table(result.rows);
}

async function runSQLFile(client, filePath) {
  const fullPath = path.isAbsolute(filePath) ? filePath : path.join(__dirname, '..', filePath);

  if (!fs.existsSync(fullPath)) {
    console.error(`❌ File not found: ${fullPath}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(fullPath, 'utf-8');
  console.log(`\n📂 Executing: ${filePath}\n`);
  await client.query(sql);
  console.log('✅ SQL executed successfully\n');
}

async function listTables(client) {
  const result = await client.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name
  `);
  console.log('\n📊 Tables:\n');
  console.table(result.rows);
}

async function listUsers(client) {
  const result = await client.query('SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC LIMIT 10');
  console.log('\n👥 Users:\n');
  console.table(result.rows);
}

async function listWallets(client) {
  const result = await client.query('SELECT user_id, available_balance, total_balance, created_at FROM public.wallets ORDER BY created_at DESC');
  console.log('\n💰 Wallets:\n');
  console.table(result.rows.map(r => ({
    ...r,
    user_id: r.user_id.substring(0, 8) + '...'
  })));
}

// Main
async function main() {
  const command = process.argv[2];

  if (!command) {
    console.log(`
📖 Database Manager - Commands:

  setup-wallets      Create wallets table + add $10,000 to all users
  setup-packages     Create packages table + insert sample packages
  run-sql <file>     Run any SQL file
  list-tables        Show all database tables
  list-users         Show all users
  list-wallets       Show all wallets

📝 Example:
  node scripts/db-manager.js setup-wallets
  node scripts/db-manager.js run-sql database/create-wallets-table.sql
    `);
    process.exit(0);
  }

  const client = new Client({ connectionString: DATABASE_URL });

  try {
    console.log('\n🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected!\n');

    switch (command) {
      case 'setup-wallets':
        await setupWallets(client);
        break;
      case 'setup-packages':
        await setupPackages(client);
        break;
      case 'run-sql':
        await runSQLFile(client, process.argv[3]);
        break;
      case 'list-tables':
        await listTables(client);
        break;
      case 'list-users':
        await listUsers(client);
        break;
      case 'list-wallets':
        await listWallets(client);
        break;
      default:
        console.error(`❌ Unknown command: ${command}`);
        process.exit(1);
    }

    console.log('✨ Done!\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
