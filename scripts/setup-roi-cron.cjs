#!/usr/bin/env node

/**
 * Automated ROI Cron Job Setup Script
 *
 * This script automates the setup of the daily ROI distribution cron job
 * using PM2 for process management.
 *
 * Usage:
 *   node scripts/setup-roi-cron.cjs
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI colors
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

function exec(command, ignoreError = false) {
  try {
    const output = execSync(command, { encoding: 'utf-8' });
    return { success: true, output };
  } catch (error) {
    if (ignoreError) {
      return { success: false, output: error.message };
    }
    throw error;
  }
}

async function main() {
  logSection('⏰ ROI CRON JOB - AUTOMATED SETUP');

  // Step 1: Check PM2 installation
  logInfo('Step 1: Checking PM2 installation...\n');

  const pm2Check = exec('pm2 --version', true);
  if (!pm2Check.success) {
    logWarning('PM2 is not installed');
    logInfo('Installing PM2 globally...\n');

    try {
      exec('npm install -g pm2');
      logSuccess('PM2 installed successfully');
    } catch (error) {
      logError('Failed to install PM2');
      logError('Please install manually: npm install -g pm2');
      process.exit(1);
    }
  } else {
    logSuccess(`PM2 is installed (version ${pm2Check.output.trim()})`);
  }

  // Step 2: Check logs directory
  logInfo('\nStep 2: Checking logs directory...\n');

  const logsDir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
    logSuccess('Created logs directory');
  } else {
    logSuccess('Logs directory exists');
  }

  // Step 3: Check environment variables
  logInfo('\nStep 3: Checking environment variables...\n');

  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    logError('No .env file found!');
    logWarning('Please create a .env file with:');
    console.log('  VITE_SUPABASE_URL=https://your-project.supabase.co');
    console.log('  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key');
    process.exit(1);
  }

  // Load .env
  require('dotenv').config({ path: envPath });

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    logError('VITE_SUPABASE_URL not found in .env');
    process.exit(1);
  }
  if (!serviceKey) {
    logError('SUPABASE_SERVICE_ROLE_KEY not found in .env');
    process.exit(1);
  }

  logSuccess('Environment variables configured');
  logInfo(`Supabase URL: ${supabaseUrl}`);

  // Step 4: Test ROI distribution script
  logInfo('\nStep 4: Testing ROI distribution script...\n');

  try {
    logWarning('Running manual test (this may take a few seconds)...');
    const testResult = exec('node scripts/distribute-daily-roi.js');
    logSuccess('ROI distribution script tested successfully');
    console.log('\nScript output:');
    console.log(colors.dim + testResult.output.substring(0, 500) + colors.reset);
  } catch (error) {
    logError('ROI distribution script failed!');
    logError(error.message);
    logWarning('Please fix the errors before setting up cron job');
    process.exit(1);
  }

  // Step 5: Check ecosystem config
  logInfo('\nStep 5: Checking PM2 ecosystem configuration...\n');

  const ecosystemPath = path.join(process.cwd(), 'ecosystem.config.cjs');
  if (!fs.existsSync(ecosystemPath)) {
    logError('ecosystem.config.cjs not found!');
    logWarning('Please ensure the file exists in project root');
    process.exit(1);
  }

  logSuccess('Ecosystem config found');

  // Step 6: Start with PM2
  logInfo('\nStep 6: Starting ROI cron job with PM2...\n');

  try {
    // Stop existing instance if any
    exec('pm2 delete roi-distribution', true);

    // Start new instance
    exec('pm2 start ecosystem.config.cjs');
    logSuccess('ROI cron job started with PM2');

    // Save PM2 state
    exec('pm2 save');
    logSuccess('PM2 configuration saved');
  } catch (error) {
    logError('Failed to start with PM2');
    logError(error.message);
    process.exit(1);
  }

  // Step 7: Set up startup script
  logInfo('\nStep 7: Setting up PM2 startup...\n');

  try {
    const startupResult = exec('pm2 startup', true);
    if (startupResult.success) {
      logSuccess('PM2 startup configured');
      if (startupResult.output.includes('sudo')) {
        logWarning('\nIMPORTANT: Run this command to enable startup:');
        console.log(colors.yellow + startupResult.output.trim() + colors.reset);
      }
    }
  } catch (error) {
    logWarning('Could not configure PM2 startup automatically');
    logInfo('Run manually: pm2 startup');
  }

  // Step 8: Show status
  logInfo('\nStep 8: Verifying setup...\n');

  try {
    const statusResult = exec('pm2 list');
    logSuccess('PM2 status:');
    console.log('\n' + statusResult.output);
  } catch (error) {
    logWarning('Could not retrieve PM2 status');
  }

  // Final summary
  logSection('✅ SETUP COMPLETE!');

  console.log('Your ROI distribution cron job is now active!\n');

  console.log(colors.bright + 'Schedule:' + colors.reset);
  console.log('  Daily at 2:00 AM UTC\n');

  console.log(colors.bright + 'Useful Commands:' + colors.reset);
  console.log('  pm2 status                    - View process status');
  console.log('  pm2 logs roi-distribution     - View logs');
  console.log('  pm2 monit                     - Monitor in real-time');
  console.log('  pm2 restart roi-distribution  - Restart process');
  console.log('  pm2 stop roi-distribution     - Stop process');
  console.log('  pm2 delete roi-distribution   - Remove from PM2\n');

  console.log(colors.bright + 'Log Files:' + colors.reset);
  console.log('  logs/roi-distribution-out.log  - Standard output');
  console.log('  logs/roi-distribution-error.log - Error output\n');

  console.log(colors.bright + 'Next Steps:' + colors.reset);
  console.log('  1. Monitor logs for first 24 hours');
  console.log('  2. Verify ROI distributions in database');
  console.log('  3. Check wallet balances are updating');
  console.log('  4. Set up backup strategy\n');

  console.log(colors.green + '🎉 ROI automation is ready!' + colors.reset);
  console.log('\nFor detailed documentation, see: ROI_CRON_SETUP_COMPLETE.md\n');
}

// Run the setup
main().catch((error) => {
  logError(`Setup failed: ${error.message}`);
  console.error(error);
  process.exit(1);
});
