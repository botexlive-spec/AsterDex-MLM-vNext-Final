#!/usr/bin/env node

/**
 * Supabase Database Deployment Script (PostgreSQL Direct)
 *
 * This script deploys all database files to Supabase using direct PostgreSQL connection
 *
 * Requirements:
 * - DATABASE_URL environment variable (PostgreSQL connection string from Supabase)
 *   OR
 * - Individual connection parameters in .env
 *
 * Usage:
 * node scripts/deploy-database-pg.cjs
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
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

async function deployDatabase() {
  logSection('🚀 FINASTER MLM - DATABASE DEPLOYMENT');

  // Try to load .env file
  try {
    require('dotenv').config();
    logInfo('Loaded environment variables from .env');
  } catch (err) {
    logWarning('dotenv not installed, using process.env');
  }

  // Get database connection string
  const connectionString = process.env.DATABASE_URL ||
                          process.env.SUPABASE_DB_URL ||
                          process.env.POSTGRES_URL;

  if (!connectionString) {
    logError('Missing DATABASE_URL environment variable!');
    console.log('\nTo get your connection string:');
    console.log('  1. Go to Supabase Dashboard');
    console.log('  2. Settings → Database');
    console.log('  3. Copy the "Connection string" (URI format)');
    console.log('  4. Add to .env file:');
    console.log('     DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres');
    console.log('\nOr deploy manually using Supabase SQL Editor:');
    console.log('  See SUPABASE_DEPLOYMENT_GUIDE.md');
    process.exit(1);
  }

  logSuccess('Database connection string found');

  // Create PostgreSQL client
  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false // Supabase uses SSL
    }
  });

  try {
    // Connect to database
    logInfo('Connecting to database...');
    await client.connect();
    logSuccess('Connected to PostgreSQL database\n');

    // Read deployment SQL file
    const projectRoot = path.join(__dirname, '..');
    const deploymentFile = path.join(projectRoot, 'database', 'DEPLOY_ALL_IN_ONE.sql');

    logInfo(`Reading: ${path.basename(deploymentFile)}`);

    let sqlContent;
    try {
      sqlContent = fs.readFileSync(deploymentFile, 'utf-8');
      logSuccess(`Loaded SQL file (${(sqlContent.length / 1024).toFixed(2)} KB)\n`);
    } catch (error) {
      logError(`Failed to read SQL file: ${error.message}`);
      logWarning('File should be at: database/DEPLOY_ALL_IN_ONE.sql');
      process.exit(1);
    }

    // Execute SQL
    logSection('📤 EXECUTING SQL DEPLOYMENT');
    logInfo('This may take 30-60 seconds...\n');

    const startTime = Date.now();

    try {
      await client.query(sqlContent);
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      logSuccess(`SQL executed successfully in ${duration} seconds\n`);
    } catch (error) {
      logError(`SQL execution failed: ${error.message}`);
      console.error('\nError details:', error);
      process.exit(1);
    }

    // Verify deployment
    logSection('✅ VERIFYING DEPLOYMENT');

    const verifications = [
      {
        name: 'Level Income Config',
        query: 'SELECT COUNT(*) as count FROM level_income_config',
        expected: 30
      },
      {
        name: 'Matching Bonus Tiers',
        query: 'SELECT COUNT(*) as count FROM matching_bonus_tiers',
        expected: 6
      },
      {
        name: 'Rank Requirements',
        query: 'SELECT COUNT(*) as count FROM rank_requirements',
        expected: 7
      },
      {
        name: 'Binary Settings',
        query: 'SELECT COUNT(*) as count FROM binary_settings',
        expected: 10
      },
      {
        name: 'System Settings',
        query: 'SELECT COUNT(*) as count FROM mlm_system_settings',
        expected: 12
      }
    ];

    let allVerified = true;

    for (const verification of verifications) {
      try {
        const result = await client.query(verification.query);
        const count = parseInt(result.rows[0].count);

        if (count === verification.expected) {
          logSuccess(`${verification.name}: ${count} rows ✓`);
        } else {
          logWarning(`${verification.name}: ${count} rows (expected ${verification.expected})`);
          allVerified = false;
        }
      } catch (error) {
        logError(`${verification.name}: Failed to verify`);
        allVerified = false;
      }
    }

    console.log('\n');

    // Test helper functions
    logInfo('Testing helper functions...\n');

    try {
      const result1 = await client.query('SELECT get_level_income_percentage(1) as percentage');
      const percentage = parseFloat(result1.rows[0].percentage);
      if (percentage === 10.00) {
        logSuccess(`get_level_income_percentage(1) = ${percentage}% ✓`);
      } else {
        logWarning(`get_level_income_percentage(1) = ${percentage}% (expected 10.00%)`);
      }
    } catch (error) {
      logError('Helper function test failed');
    }

    // Check RLS policies
    console.log('\n');
    logInfo('Checking RLS policies...\n');

    try {
      const result = await client.query(`
        SELECT COUNT(*) as count
        FROM pg_policies
        WHERE schemaname = 'public'
      `);
      const policyCount = parseInt(result.rows[0].count);
      logInfo(`Found ${policyCount} RLS policies`);

      if (policyCount >= 80) {
        logSuccess('RLS policies deployed ✓');
      } else {
        logWarning(`Expected 80+ policies, found ${policyCount}`);
      }
    } catch (error) {
      logWarning('Could not verify RLS policies');
    }

    // Final summary
    console.log('\n');
    logSection('🎉 DEPLOYMENT COMPLETE');

    if (allVerified) {
      logSuccess('All verification checks passed!');
      logSuccess('Database is ready for production use.');
    } else {
      logWarning('Some verification checks did not pass.');
      logInfo('Review the warnings above and check your database.');
    }

    console.log('\n' + colors.bright + 'Next Steps:' + colors.reset);
    console.log('  1. Create an admin user (see SUPABASE_DEPLOYMENT_GUIDE.md)');
    console.log('  2. Set up ROI cron job (see ROI_DISTRIBUTION_SETUP.md)');
    console.log('  3. Run security tests (see RLS_MANUAL_TESTING_GUIDE.md)');
    console.log('  4. Test the application: npm run dev');

    console.log('\n');

  } catch (error) {
    logError(`Deployment failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  } finally {
    // Close connection
    await client.end();
    logInfo('Database connection closed');
  }
}

// Run deployment
deployDatabase();
