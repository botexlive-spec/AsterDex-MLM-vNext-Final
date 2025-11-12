const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

/**
 * Comprehensive MLM Platform Audit Script
 * Detects: Missing tables, unlinked models, broken API endpoints, frontend-backend disconnects
 */

const AUDIT_REPORT = {
  timestamp: new Date().toISOString(),
  adminPages: [],
  userPages: [],
  apiRoutes: [],
  databaseTables: [],
  missingTables: [],
  brokenEndpoints: [],
  unlinkeddModels: [],
  frontendIssues: [],
  errors: []
};

// MySQL Connection
let db;

async function connectDatabase() {
  try {
    db = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'root',
      database: process.env.DB_NAME || 'asterdex_mlm',
      port: process.env.DB_PORT || 3306
    });
    console.log('✅ Database connected');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    AUDIT_REPORT.errors.push(`Database connection failed: ${error.message}`);
    return false;
  }
}

// 1. Scan all Admin Pages
function scanAdminPages() {
  console.log('\n📊 Scanning Admin Pages...');
  const adminDir = path.join(__dirname, '../app/pages/admin');

  if (!fs.existsSync(adminDir)) {
    AUDIT_REPORT.errors.push('Admin pages directory not found');
    return;
  }

  const files = fs.readdirSync(adminDir).filter(f => f.endsWith('.tsx') || f.endsWith('.jsx'));

  files.forEach(file => {
    const filePath = path.join(adminDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');

    // Extract API calls
    const apiCalls = extractAPIcalls(content);
    const requiredTables = extractTableReferences(content);

    AUDIT_REPORT.adminPages.push({
      file,
      path: filePath,
      apiCalls,
      requiredTables,
      size: content.length
    });
  });

  console.log(`   Found ${files.length} admin pages`);
}

// 2. Scan all User Pages
function scanUserPages() {
  console.log('\n👤 Scanning User Pages...');
  const userDir = path.join(__dirname, '../app/pages/user');

  if (!fs.existsSync(userDir)) {
    AUDIT_REPORT.errors.push('User pages directory not found');
    return;
  }

  const files = fs.readdirSync(userDir).filter(f => f.endsWith('.tsx') || f.endsWith('.jsx'));

  files.forEach(file => {
    const filePath = path.join(userDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');

    const apiCalls = extractAPIcalls(content);
    const requiredTables = extractTableReferences(content);

    AUDIT_REPORT.userPages.push({
      file,
      path: filePath,
      apiCalls,
      requiredTables,
      size: content.length
    });
  });

  console.log(`   Found ${files.length} user pages`);
}

// 3. Scan Backend API Routes
function scanAPIRoutes() {
  console.log('\n🔌 Scanning Backend API Routes...');
  const routesDir = path.join(__dirname, '../server/routes');

  if (!fs.existsSync(routesDir)) {
    AUDIT_REPORT.errors.push('Server routes directory not found');
    return;
  }

  const files = fs.readdirSync(routesDir).filter(f => f.endsWith('.ts') || f.endsWith('.js'));

  files.forEach(file => {
    const filePath = path.join(routesDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');

    const endpoints = extractEndpoints(content);
    const tablesUsed = extractTableReferences(content);

    AUDIT_REPORT.apiRoutes.push({
      file,
      path: filePath,
      endpoints,
      tablesUsed
    });
  });

  console.log(`   Found ${files.length} route files`);
}

// 4. Check Database Schema
async function checkDatabaseSchema() {
  console.log('\n🗄️  Checking Database Schema...');

  if (!db) {
    console.log('   ⚠️  Skipping (no database connection)');
    return;
  }

  try {
    const [tables] = await db.query('SHOW TABLES');
    const tableNames = tables.map(t => Object.values(t)[0]);

    AUDIT_REPORT.databaseTables = tableNames;
    console.log(`   Found ${tableNames.length} tables in database`);

    // Get schema for each table
    for (const table of tableNames) {
      const [columns] = await db.query(`DESCRIBE ${table}`);
      AUDIT_REPORT.databaseTables.push({
        name: table,
        columns: columns.map(c => ({
          field: c.Field,
          type: c.Type,
          null: c.Null,
          key: c.Key,
          default: c.Default
        }))
      });
    }
  } catch (error) {
    AUDIT_REPORT.errors.push(`Database schema check failed: ${error.message}`);
  }
}

// 5. Detect Missing Tables
function detectMissingTables() {
  console.log('\n🔍 Detecting Missing Tables...');

  const allRequiredTables = new Set();

  // Collect from admin pages
  AUDIT_REPORT.adminPages.forEach(page => {
    page.requiredTables.forEach(t => allRequiredTables.add(t));
  });

  // Collect from user pages
  AUDIT_REPORT.userPages.forEach(page => {
    page.requiredTables.forEach(t => allRequiredTables.add(t));
  });

  // Collect from API routes
  AUDIT_REPORT.apiRoutes.forEach(route => {
    route.tablesUsed.forEach(t => allRequiredTables.add(t));
  });

  const existingTables = Array.isArray(AUDIT_REPORT.databaseTables)
    ? AUDIT_REPORT.databaseTables
    : AUDIT_REPORT.databaseTables.map(t => t.name);

  allRequiredTables.forEach(table => {
    if (!existingTables.includes(table)) {
      AUDIT_REPORT.missingTables.push(table);
    }
  });

  console.log(`   Missing tables: ${AUDIT_REPORT.missingTables.length}`);
  if (AUDIT_REPORT.missingTables.length > 0) {
    console.log(`   ${AUDIT_REPORT.missingTables.join(', ')}`);
  }
}

// 6. Detect Broken Endpoints
function detectBrokenEndpoints() {
  console.log('\n🔗 Detecting Broken Endpoints...');

  const allAPICalls = new Set();
  const allEndpoints = new Set();

  // Collect all API calls from frontend
  [...AUDIT_REPORT.adminPages, ...AUDIT_REPORT.userPages].forEach(page => {
    page.apiCalls.forEach(call => allAPICalls.add(call));
  });

  // Collect all backend endpoints
  AUDIT_REPORT.apiRoutes.forEach(route => {
    route.endpoints.forEach(ep => allEndpoints.add(ep));
  });

  // Find calls without matching endpoints
  allAPICalls.forEach(call => {
    const matched = Array.from(allEndpoints).some(ep => {
      return call.includes(ep) || ep.includes(call);
    });

    if (!matched) {
      AUDIT_REPORT.brokenEndpoints.push({
        call,
        status: 'No matching backend endpoint'
      });
    }
  });

  console.log(`   Broken endpoints: ${AUDIT_REPORT.brokenEndpoints.length}`);
}

// Utility: Extract API calls from code
function extractAPIcalls(content) {
  const apiCalls = [];

  // Match axios/fetch calls
  const patterns = [
    /axios\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/gi,
    /fetch\s*\(\s*['"`]([^'"`]+)['"`]/gi,
    /api\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/gi,
    /['"`]\/api\/([^'"`]+)['"`]/gi
  ];

  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const endpoint = match[2] || match[1];
      if (endpoint && endpoint.startsWith('/api/') || endpoint.startsWith('api/')) {
        apiCalls.push(endpoint);
      }
    }
  });

  return [...new Set(apiCalls)];
}

// Utility: Extract table references from code
function extractTableReferences(content) {
  const tables = [];

  // Common table name patterns in SQL queries and code
  const patterns = [
    /FROM\s+`?(\w+)`?/gi,
    /JOIN\s+`?(\w+)`?/gi,
    /INTO\s+`?(\w+)`?/gi,
    /UPDATE\s+`?(\w+)`?/gi,
    /Table:\s*['"`](\w+)['"`]/gi,
    /table\s*:\s*['"`](\w+)['"`]/gi,
    /db\.query\(['"`]SELECT.*?FROM\s+(\w+)/gi
  ];

  // Common MLM table names to look for
  const commonTables = [
    'users', 'packages', 'user_packages', 'ranks', 'user_ranks',
    'commissions', 'transactions', 'withdrawals', 'kyc_verification',
    'binary_tree', 'genealogy', 'earnings', 'referrals', 'support_tickets',
    'audit_logs', 'system_config', 'notifications', 'wallet', 'roi_earnings'
  ];

  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      if (match[1]) {
        tables.push(match[1]);
      }
    }
  });

  // Also check for common table name mentions
  commonTables.forEach(table => {
    if (content.includes(table) || content.includes(table.toUpperCase())) {
      tables.push(table);
    }
  });

  return [...new Set(tables)];
}

// Utility: Extract endpoints from route files
function extractEndpoints(content) {
  const endpoints = [];

  const patterns = [
    /router\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/gi,
    /app\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/gi,
  ];

  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      if (match[2]) {
        endpoints.push(`${match[1].toUpperCase()} ${match[2]}`);
      }
    }
  });

  return endpoints;
}

// Generate Report
function generateReport() {
  console.log('\n📄 Generating Audit Report...');

  const report = {
    ...AUDIT_REPORT,
    summary: {
      adminPages: AUDIT_REPORT.adminPages.length,
      userPages: AUDIT_REPORT.userPages.length,
      apiRoutes: AUDIT_REPORT.apiRoutes.length,
      databaseTables: Array.isArray(AUDIT_REPORT.databaseTables)
        ? AUDIT_REPORT.databaseTables.length
        : AUDIT_REPORT.databaseTables.filter(t => t.name).length,
      missingTables: AUDIT_REPORT.missingTables.length,
      brokenEndpoints: AUDIT_REPORT.brokenEndpoints.length,
      errors: AUDIT_REPORT.errors.length
    }
  };

  const reportPath = path.join(__dirname, '../audit-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log(`\n✅ Audit report saved: ${reportPath}`);
  console.log('\n📊 SUMMARY:');
  console.log(`   Admin Pages: ${report.summary.adminPages}`);
  console.log(`   User Pages: ${report.summary.userPages}`);
  console.log(`   API Routes: ${report.summary.apiRoutes}`);
  console.log(`   Database Tables: ${report.summary.databaseTables}`);
  console.log(`   Missing Tables: ${report.summary.missingTables}`);
  console.log(`   Broken Endpoints: ${report.summary.brokenEndpoints}`);
  console.log(`   Errors: ${report.summary.errors}`);

  return report;
}

// Main Execution
async function runAudit() {
  console.log('🚀 Starting Comprehensive MLM Platform Audit...\n');

  // Load environment variables
  require('dotenv').config();

  // Connect to database
  await connectDatabase();

  // Run all audits
  scanAdminPages();
  scanUserPages();
  scanAPIRoutes();
  await checkDatabaseSchema();
  detectMissingTables();
  detectBrokenEndpoints();

  // Generate final report
  const report = generateReport();

  // Close database connection
  if (db) {
    await db.end();
  }

  console.log('\n✅ Audit Complete!');

  return report;
}

// Run if called directly
if (require.main === module) {
  runAudit().catch(error => {
    console.error('❌ Audit failed:', error);
    process.exit(1);
  });
}

module.exports = { runAudit };
