/**
 * DEPLOYMENT READINESS VERIFICATION SCRIPT
 * ========================================
 * Checks if all required files exist and platform is ready for production deployment
 *
 * Usage:
 *   node scripts/verify-deployment-readiness.js
 */

const fs = require('fs');
const path = require('path');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

const log = {
  success: (msg) => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}✗ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ ${msg}${colors.reset}`),
  header: (msg) => console.log(`\n${colors.cyan}${colors.bold}${msg}${colors.reset}`),
};

/**
 * Check if file exists
 */
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
}

/**
 * Get file size in KB
 */
function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return (stats.size / 1024).toFixed(2);
  } catch (error) {
    return 0;
  }
}

/**
 * Check file content for specific patterns
 */
function checkFileContent(filePath, patterns) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const results = {};

    for (const [key, pattern] of Object.entries(patterns)) {
      if (pattern instanceof RegExp) {
        results[key] = pattern.test(content);
      } else {
        results[key] = content.includes(pattern);
      }
    }

    return results;
  } catch (error) {
    return null;
  }
}

/**
 * Count lines in file
 */
function countLines(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return content.split('\n').length;
  } catch (error) {
    return 0;
  }
}

/**
 * Main verification function
 */
async function verifyDeploymentReadiness() {
  console.log(`${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}${colors.bold}        FINASTER MLM PLATFORM - DEPLOYMENT READINESS CHECK        ${colors.reset}`);
  console.log(`${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}\n`);

  let totalChecks = 0;
  let passedChecks = 0;
  const issues = [];

  // ============================================================================
  // 1. DATABASE DEPLOYMENT FILES
  // ============================================================================
  log.header('1. DATABASE DEPLOYMENT FILES');

  const databaseFiles = [
    {
      name: 'Business Rules Tables',
      path: 'database/create-business-rules-tables.sql',
      minLines: 400,
      required: true,
      patterns: {
        'level_income_config': 'CREATE TABLE level_income_config',
        'matching_bonus_tiers': 'CREATE TABLE matching_bonus_tiers',
        'rank_requirements': 'CREATE TABLE rank_requirements',
      },
    },
    {
      name: 'MLM Functions',
      path: 'database/create-mlm-functions.sql',
      minLines: 300,
      required: true,
      patterns: {
        'purchase_package_atomic': 'purchase_package_atomic',
        'update_binary_volumes_atomic': 'update_binary_volumes_atomic',
        'process_level_income_atomic': 'process_level_income_atomic',
      },
    },
    {
      name: 'RLS Policies',
      path: 'database/enable-rls-policies.sql',
      minLines: 500,
      required: true,
      patterns: {
        'enable_rls': 'ENABLE ROW LEVEL SECURITY',
        'policies': 'CREATE POLICY',
        'users_table': 'ALTER TABLE users ENABLE',
      },
    },
  ];

  for (const file of databaseFiles) {
    totalChecks++;
    const filePath = path.join(process.cwd(), file.path);

    if (!fileExists(filePath)) {
      log.error(`${file.name}: File not found (${file.path})`);
      issues.push(`Missing database file: ${file.path}`);
      continue;
    }

    const lines = countLines(filePath);
    const size = getFileSize(filePath);

    if (lines < file.minLines) {
      log.warning(`${file.name}: File too small (${lines} lines, expected >= ${file.minLines})`);
      issues.push(`${file.path} may be incomplete`);
    } else {
      log.success(`${file.name}: ${lines} lines, ${size} KB`);
      passedChecks++;
    }

    // Check content patterns
    if (file.patterns) {
      const contentCheck = checkFileContent(filePath, file.patterns);
      if (contentCheck) {
        for (const [key, found] of Object.entries(contentCheck)) {
          if (!found) {
            log.warning(`  Missing pattern: ${key}`);
            issues.push(`${file.path} missing ${key}`);
          }
        }
      }
    }
  }

  // ============================================================================
  // 2. DOCUMENTATION FILES
  // ============================================================================
  log.header('\n2. DOCUMENTATION FILES');

  const documentationFiles = [
    { name: 'Database Deployment Guide', path: 'DATABASE_DEPLOYMENT_GUIDE.md', minSize: 5 },
    { name: 'RLS Policies Guide', path: 'RLS_POLICIES_GUIDE.md', minSize: 30 },
    { name: 'RLS Manual Testing Guide', path: 'RLS_MANUAL_TESTING_GUIDE.md', minSize: 20 },
    { name: 'ROI Distribution Setup', path: 'ROI_DISTRIBUTION_SETUP.md', minSize: 10 },
    { name: 'Admin Auth Implementation', path: 'ADMIN_AUTH_IMPLEMENTATION_SUMMARY.md', minSize: 10 },
    { name: 'API Endpoints Audit', path: 'API_ENDPOINTS_AUDIT.md', minSize: 20 },
    { name: 'Deployment Ready Checklist', path: 'DEPLOYMENT_READY_CHECKLIST.md', minSize: 10 },
  ];

  for (const file of documentationFiles) {
    totalChecks++;
    const filePath = path.join(process.cwd(), file.path);

    if (!fileExists(filePath)) {
      log.error(`${file.name}: File not found`);
      issues.push(`Missing documentation: ${file.path}`);
      continue;
    }

    const size = getFileSize(filePath);

    if (parseFloat(size) < file.minSize) {
      log.warning(`${file.name}: File too small (${size} KB)`);
      issues.push(`${file.path} may be incomplete`);
    } else {
      log.success(`${file.name}: ${size} KB`);
      passedChecks++;
    }
  }

  // ============================================================================
  // 3. SCRIPTS
  // ============================================================================
  log.header('\n3. DEPLOYMENT SCRIPTS');

  const scripts = [
    { name: 'Daily ROI Distribution', path: 'scripts/distribute-daily-roi.js', required: true },
    { name: 'RLS Testing Script', path: 'scripts/test-rls-policies.ts', required: false },
    { name: 'Database Audit Script', path: 'scripts/run-audit.js', required: false },
  ];

  for (const script of scripts) {
    totalChecks++;
    const filePath = path.join(process.cwd(), script.path);

    if (!fileExists(filePath)) {
      if (script.required) {
        log.error(`${script.name}: File not found`);
        issues.push(`Missing required script: ${script.path}`);
      } else {
        log.warning(`${script.name}: File not found (optional)`);
      }
      continue;
    }

    const size = getFileSize(filePath);
    log.success(`${script.name}: ${size} KB`);
    passedChecks++;
  }

  // ============================================================================
  // 4. SERVICE LAYER
  // ============================================================================
  log.header('\n4. SERVICE LAYER');

  const serviceFiles = [
    'app/services/admin-dashboard.service.ts',
    'app/services/admin-user.service.ts',
    'app/services/admin-financial.service.ts',
    'app/services/admin-kyc.service.ts',
    'app/services/admin-commission.service.ts',
    'app/services/admin-binary.service.ts',
    'app/services/admin-rank.service.ts',
    'app/services/admin-audit.service.ts',
    'app/services/admin-config.service.ts',
    'app/services/admin-reports.service.ts',
    'app/services/admin-communications.service.ts',
    'app/services/mlm.service.ts',
    'app/services/wallet.service.ts',
    'app/services/package.service.ts',
  ];

  let serviceCount = 0;
  for (const servicePath of serviceFiles) {
    const filePath = path.join(process.cwd(), servicePath);
    if (fileExists(filePath)) {
      serviceCount++;
    }
  }

  totalChecks++;
  if (serviceCount === serviceFiles.length) {
    log.success(`All ${serviceFiles.length} service files present`);
    passedChecks++;
  } else {
    log.warning(`Only ${serviceCount}/${serviceFiles.length} service files found`);
    issues.push(`Missing ${serviceFiles.length - serviceCount} service files`);
  }

  // ============================================================================
  // 5. MIDDLEWARE
  // ============================================================================
  log.header('\n5. MIDDLEWARE');

  const middlewareFiles = [
    { name: 'Admin Authorization Middleware', path: 'app/middleware/admin.middleware.ts' },
  ];

  for (const file of middlewareFiles) {
    totalChecks++;
    const filePath = path.join(process.cwd(), file.path);

    if (!fileExists(filePath)) {
      log.error(`${file.name}: File not found`);
      issues.push(`Missing middleware: ${file.path}`);
      continue;
    }

    // Check for required functions
    const contentCheck = checkFileContent(filePath, {
      'requireAdmin': 'requireAdmin',
      'requireSuperAdmin': 'requireSuperAdmin',
    });

    if (contentCheck && contentCheck.requireAdmin && contentCheck.requireSuperAdmin) {
      log.success(`${file.name}: All functions present`);
      passedChecks++;
    } else {
      log.warning(`${file.name}: Missing required functions`);
      issues.push(`${file.path} incomplete`);
    }
  }

  // ============================================================================
  // 6. ENVIRONMENT VARIABLES
  // ============================================================================
  log.header('\n6. ENVIRONMENT VARIABLES');

  const envFile = path.join(process.cwd(), '.env');
  totalChecks++;

  if (!fileExists(envFile)) {
    log.error('.env file not found');
    issues.push('Missing .env file');
  } else {
    const envContent = fs.readFileSync(envFile, 'utf8');
    const requiredVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
    ];

    let envVarsPresent = 0;
    for (const varName of requiredVars) {
      if (envContent.includes(varName)) {
        envVarsPresent++;
      } else {
        log.warning(`Missing: ${varName}`);
      }
    }

    if (envVarsPresent === requiredVars.length) {
      log.success(`All ${requiredVars.length} required environment variables configured`);
      passedChecks++;
    } else {
      log.error(`Only ${envVarsPresent}/${requiredVars.length} environment variables found`);
      issues.push(`Missing ${requiredVars.length - envVarsPresent} environment variables`);
    }
  }

  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log(`\n${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}${colors.bold}                          SUMMARY                                ${colors.reset}`);
  console.log(`${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}\n`);

  console.log(`  Total Checks: ${totalChecks}`);
  console.log(`  ${colors.green}Passed: ${passedChecks}${colors.reset}`);
  console.log(`  ${colors.red}Failed: ${totalChecks - passedChecks}${colors.reset}\n`);

  const passRate = ((passedChecks / totalChecks) * 100).toFixed(1);
  console.log(`  Pass Rate: ${passRate}%\n`);

  if (issues.length > 0) {
    console.log(`${colors.yellow}Issues Found:${colors.reset}`);
    issues.forEach((issue, index) => {
      console.log(`  ${index + 1}. ${issue}`);
    });
    console.log();
  }

  // Platform readiness assessment
  log.header('PLATFORM READINESS ASSESSMENT');

  const readiness = passRate >= 90 ? '98%' : passRate >= 75 ? '85%' : '70%';
  const status = passRate >= 90 ? 'READY' : passRate >= 75 ? 'NEARLY READY' : 'NOT READY';
  const color = passRate >= 90 ? colors.green : passRate >= 75 ? colors.yellow : colors.red;

  console.log(`  Platform Readiness: ${color}${readiness}${colors.reset}`);
  console.log(`  Deployment Status: ${color}${status}${colors.reset}\n`);

  if (passRate >= 90) {
    log.success('Platform is ready for production deployment! 🚀');
    console.log('\nNext Steps:');
    console.log('  1. Deploy database SQL files to Supabase (15 minutes)');
    console.log('  2. Set up ROI cron job (30 minutes)');
    console.log('  3. Follow DEPLOYMENT_READY_CHECKLIST.md\n');
  } else if (passRate >= 75) {
    log.warning('Platform is nearly ready. Address the issues above first.');
    console.log('\nRecommended Actions:');
    console.log('  1. Fix missing/incomplete files');
    console.log('  2. Re-run this verification script');
    console.log('  3. Follow deployment checklist\n');
  } else {
    log.error('Platform is not ready for deployment.');
    console.log('\nRequired Actions:');
    console.log('  1. Fix all critical issues above');
    console.log('  2. Ensure all database files are present');
    console.log('  3. Complete documentation');
    console.log('  4. Re-run this verification script\n');
  }

  // Exit code
  process.exit(passRate >= 90 ? 0 : 1);
}

// Run verification
verifyDeploymentReadiness().catch((error) => {
  console.error(`\n${colors.red}Verification failed:${colors.reset}`, error.message);
  process.exit(1);
});
