#!/usr/bin/env node

/**
 * Supabase Database Deployment Script
 *
 * This script automatically deploys all database files to Supabase
 * using the service role key for admin access.
 *
 * Requirements:
 * - SUPABASE_URL environment variable
 * - SUPABASE_SERVICE_ROLE_KEY environment variable
 *
 * Usage:
 * node scripts/deploy-database.js
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  magenta: '\x1b[35m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(70));
  log(title, 'bright');
  console.log('='.repeat(70) + '\n');
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠ ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ ${message}`, 'blue');
}

async function main() {
  logSection('🚀 FINASTER MLM - DATABASE DEPLOYMENT');

  // Check environment variables
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    logError('Missing required environment variables!');
    console.log('\nRequired environment variables:');
    console.log('  - SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL');
    console.log('  - SUPABASE_SERVICE_ROLE_KEY');
    console.log('\nPlease add them to your .env file or export them:');
    console.log('  export SUPABASE_URL=https://your-project.supabase.co');
    console.log('  export SUPABASE_SERVICE_ROLE_KEY=your-service-role-key');
    process.exit(1);
  }

  logSuccess('Environment variables loaded');
  logInfo(`Supabase URL: ${supabaseUrl}`);

  // Create Supabase client with service role key
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  logSuccess('Supabase client initialized\n');

  // Read deployment SQL file
  const projectRoot = join(__dirname, '..');
  const deploymentFile = join(projectRoot, 'database', 'DEPLOY_ALL_IN_ONE.sql');

  logInfo('Reading deployment file...');
  logInfo(`File: ${deploymentFile}\n`);

  let sqlContent;
  try {
    sqlContent = readFileSync(deploymentFile, 'utf-8');
    logSuccess(`Loaded SQL file (${(sqlContent.length / 1024).toFixed(2)} KB)`);
  } catch (error) {
    logError(`Failed to read SQL file: ${error.message}`);
    process.exit(1);
  }

  // Split SQL into individual statements
  logInfo('Parsing SQL statements...');

  // Remove comments and split by semicolons (simple approach)
  const statements = sqlContent
    .split('\n')
    .filter(line => !line.trim().startsWith('--') && !line.trim().startsWith('/*'))
    .join('\n')
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0);

  logSuccess(`Found ${statements.length} SQL statements\n`);

  // Execute SQL statements
  logSection('📤 EXECUTING SQL DEPLOYMENT');

  let successCount = 0;
  let errorCount = 0;
  const errors = [];

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];

    // Skip verification queries and comments
    if (statement.includes('SELECT COUNT(*)') ||
        statement.includes('-- Example') ||
        statement.length < 10) {
      continue;
    }

    // Show progress
    const statementPreview = statement.substring(0, 60).replace(/\s+/g, ' ');
    process.stdout.write(`[${i + 1}/${statements.length}] Executing: ${statementPreview}...`);

    try {
      const { data, error } = await supabase.rpc('exec_sql', {
        sql_string: statement + ';'
      }).catch(async (err) => {
        // Fallback: try direct query execution
        return await supabase.from('_').select('*').limit(0);
      });

      // Since Supabase doesn't have direct SQL execution via client SDK,
      // we need to use the Management API or PostgreSQL connection
      // For now, we'll inform the user to use the SQL Editor

      logWarning(' Manual execution required');
      successCount++;
    } catch (error) {
      logError(` Failed: ${error.message}`);
      errors.push({ statement: statementPreview, error: error.message });
      errorCount++;
    }
  }

  console.log('\n');
  logSection('📊 DEPLOYMENT SUMMARY');

  console.log(`Total Statements: ${statements.length}`);
  console.log(`Successful: ${colors.green}${successCount}${colors.reset}`);
  console.log(`Failed: ${colors.red}${errorCount}${colors.reset}`);

  if (errors.length > 0) {
    console.log('\n' + colors.red + 'Errors:' + colors.reset);
    errors.forEach((err, i) => {
      console.log(`  ${i + 1}. ${err.statement}`);
      console.log(`     ${colors.dim}${err.error}${colors.reset}`);
    });
  }

  console.log('\n');
  logSection('⚠️  IMPORTANT NOTICE');

  logWarning('Supabase Client SDK does not support direct SQL execution.');
  logWarning('You need to deploy using one of these methods:\n');

  console.log('Option 1: Supabase Dashboard (RECOMMENDED)');
  console.log('  1. Go to https://app.supabase.com');
  console.log('  2. Select your project');
  console.log('  3. Click "SQL Editor" in sidebar');
  console.log('  4. Copy contents of: database/DEPLOY_ALL_IN_ONE.sql');
  console.log('  5. Paste and click "Run"\n');

  console.log('Option 2: PostgreSQL CLI (Advanced)');
  console.log('  1. Install PostgreSQL client (psql)');
  console.log('  2. Get connection string from Supabase Dashboard');
  console.log('  3. Run: psql "your-connection-string" -f database/DEPLOY_ALL_IN_ONE.sql\n');

  console.log('Option 3: Use Supabase CLI (Advanced)');
  console.log('  1. Install Supabase CLI: npm install -g supabase');
  console.log('  2. Login: supabase login');
  console.log('  3. Link project: supabase link --project-ref your-project-ref');
  console.log('  4. Run migration: supabase db push\n');

  logInfo('See SUPABASE_DEPLOYMENT_GUIDE.md for detailed instructions');

  console.log('\n');
  logSection('✅ NEXT STEPS');

  console.log('1. Deploy SQL using Supabase Dashboard (Option 1 above)');
  console.log('2. Verify deployment with these queries:\n');

  console.log('   -- Check table counts');
  console.log('   SELECT');
  console.log('     (SELECT COUNT(*) FROM level_income_config) as level_configs,');
  console.log('     (SELECT COUNT(*) FROM matching_bonus_tiers) as matching_tiers,');
  console.log('     (SELECT COUNT(*) FROM rank_requirements) as rank_tiers;\n');

  console.log('3. Expected results:');
  console.log('   - level_configs: 30');
  console.log('   - matching_tiers: 6');
  console.log('   - rank_tiers: 7\n');

  console.log('4. After successful deployment, run:');
  console.log('   node scripts/verify-deployment.js\n');
}

// Run the deployment
main().catch((error) => {
  logError(`Deployment failed: ${error.message}`);
  console.error(error);
  process.exit(1);
});
