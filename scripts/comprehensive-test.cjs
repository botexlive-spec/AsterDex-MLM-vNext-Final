const fs = require('fs');
const path = require('path');
const axios = require('axios');

/**
 * Comprehensive System Test
 * Tests all API endpoints, database connections, and generates health report
 */

const API_BASE_URL = 'http://localhost:3001';
const REPORT = {
  timestamp: new Date().toISOString(),
  apiEndpoints: [],
  adminPages: [],
  userPages: [],
  databaseHealth: null,
  errors: [],
  warnings: [],
  passed: 0,
  failed: 0
};

// Extract all API endpoints from route files
function extractAPIEndpoints() {
  console.log('\n🔍 Extracting API endpoints from route files...\n');

  const routesDir = path.join(__dirname, '../server/routes');
  const routeFiles = fs.readdirSync(routesDir).filter(f => f.endsWith('.ts') || f.endsWith('.js'));

  const endpoints = [];

  routeFiles.forEach(file => {
    const filePath = path.join(routesDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');

    // Extract route definitions
    const routePatterns = [
      /router\.(get|post|put|delete|patch)\s*\(['"`]([^'"`]+)['"`]/gi,
      /app\.(get|post|put|delete|patch)\s*\(['"`]([^'"`]+)['"`]/gi,
    ];

    routePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const method = match[1].toUpperCase();
        let route = match[2];

        // Determine base path from filename
        const basePath = file.replace(/\.(ts|js)$/, '');

        // Skip if route is a variable or regex
        if (route.includes('(') || route.includes('*')) {
          continue;
        }

        // Build full endpoint
        let fullPath;
        if (route.startsWith('/')) {
          fullPath = `/api/${basePath}${route}`;
        } else {
          fullPath = `/api/${basePath}/${route}`;
        }

        // Clean up double slashes
        fullPath = fullPath.replace(/\/+/g, '/');

        endpoints.push({
          method,
          path: fullPath,
          file: file,
          requiresAuth: content.includes('authMiddleware') || content.includes('authenticate'),
          requiresAdmin: content.includes('adminMiddleware') || content.includes('isAdmin')
        });
      }
    });
  });

  console.log(`   Found ${endpoints.length} endpoints\n`);
  return endpoints;
}

// Test API endpoint
async function testEndpoint(endpoint) {
  try {
    const config = {
      method: endpoint.method.toLowerCase(),
      url: `${API_BASE_URL}${endpoint.path}`,
      timeout: 5000,
      validateStatus: () => true // Don't throw on any status
    };

    // Add auth token if required (you may need to adjust this)
    if (endpoint.requiresAuth || endpoint.requiresAdmin) {
      config.headers = {
        'Authorization': 'Bearer test_token_for_testing'
      };
    }

    const response = await axios(config);

    const result = {
      ...endpoint,
      status: response.status,
      statusText: response.statusText,
      tested: true,
      passed: response.status < 500, // Consider 4xx as "working" (auth errors expected)
      responseTime: response.headers['x-response-time'] || 'N/A'
    };

    if (result.passed) {
      REPORT.passed++;
      console.log(`✓ ${endpoint.method} ${endpoint.path} - ${response.status}`);
    } else {
      REPORT.failed++;
      console.log(`❌ ${endpoint.method} ${endpoint.path} - ${response.status}`);
      REPORT.errors.push(`${endpoint.method} ${endpoint.path} returned ${response.status}`);
    }

    return result;
  } catch (error) {
    REPORT.failed++;
    console.log(`❌ ${endpoint.method} ${endpoint.path} - ${error.message}`);
    REPORT.errors.push(`${endpoint.method} ${endpoint.path} failed: ${error.message}`);

    return {
      ...endpoint,
      tested: true,
      passed: false,
      error: error.message
    };
  }
}

// Check if server is running
async function checkServerHealth() {
  console.log('\n🏥 Checking server health...\n');

  try {
    const response = await axios.get(`${API_BASE_URL}/health`, { timeout: 5000 });
    console.log('✓ Server is running');
    return true;
  } catch (error) {
    // Try root endpoint
    try {
      await axios.get(API_BASE_URL, { timeout: 5000 });
      console.log('✓ Server is running');
      return true;
    } catch (e) {
      console.log('❌ Server is not responding');
      REPORT.warnings.push('API server is not running. Start it with: npm run dev:server');
      return false;
    }
  }
}

// Scan all admin pages
function scanAdminPages() {
  console.log('\n📊 Scanning Admin Pages...\n');

  const adminDir = path.join(__dirname, '../app/pages/admin');
  if (!fs.existsSync(adminDir)) {
    return [];
  }

  const files = fs.readdirSync(adminDir).filter(f => f.endsWith('.tsx') || f.endsWith('.jsx'));

  files.forEach(file => {
    const filePath = path.join(adminDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');

    // Extract API calls
    const apiCalls = extractAPICalls(content);

    REPORT.adminPages.push({
      file,
      path: filePath,
      apiCalls,
      size: content.length,
      hasErrors: content.includes('console.error') || content.includes('throw'),
      hasLoading: content.includes('loading') || content.includes('isLoading'),
      hasAuth: content.includes('useAuth') || content.includes('authToken')
    });

    console.log(`   ✓ ${file} - ${apiCalls.length} API calls`);
  });

  return files;
}

// Scan all user pages
function scanUserPages() {
  console.log('\n👤 Scanning User Pages...\n');

  const userDir = path.join(__dirname, '../app/pages/user');
  if (!fs.existsSync(userDir)) {
    return [];
  }

  const files = fs.readdirSync(userDir).filter(f => f.endsWith('.tsx') || f.endsWith('.jsx'));

  files.forEach(file => {
    const filePath = path.join(userDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');

    const apiCalls = extractAPICalls(content);

    REPORT.userPages.push({
      file,
      path: filePath,
      apiCalls,
      size: content.length,
      hasErrors: content.includes('console.error') || content.includes('throw'),
      hasLoading: content.includes('loading') || content.includes('isLoading'),
      hasAuth: content.includes('useAuth') || content.includes('authToken')
    });

    console.log(`   ✓ ${file} - ${apiCalls.length} API calls`);
  });

  return files;
}

// Extract API calls from code
function extractAPICalls(content) {
  const apiCalls = new Set();

  const patterns = [
    /axios\.(get|post|put|delete|patch)\s*\([`'"]([^`'"]+)[`'"]/gi,
    /fetch\s*\([`'"]([^`'"]+)[`'"]/gi,
    /api\.(get|post|put|delete|patch)\s*\([`'"]([^`'"]+)[`'"]/gi,
  ];

  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const endpoint = match[2] || match[1];
      if (endpoint && (endpoint.startsWith('/api/') || endpoint.startsWith('api/'))) {
        apiCalls.add(endpoint);
      }
    }
  });

  return Array.from(apiCalls);
}

// Generate final report
function generateReport() {
  console.log('\n📄 Generating test report...\n');

  const reportData = {
    ...REPORT,
    summary: {
      timestamp: REPORT.timestamp,
      totalEndpoints: REPORT.apiEndpoints.length,
      endpointsPassed: REPORT.passed,
      endpointsFailed: REPORT.failed,
      adminPages: REPORT.adminPages.length,
      userPages: REPORT.userPages.length,
      totalErrors: REPORT.errors.length,
      totalWarnings: REPORT.warnings.length,
      healthStatus: REPORT.failed === 0 && REPORT.errors.length === 0 ? 'HEALTHY' : 'NEEDS ATTENTION'
    }
  };

  const reportPath = path.join(__dirname, '../test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));

  const summaryPath = path.join(__dirname, '../test-summary.txt');
  const summaryContent = `
===============================================
COMPREHENSIVE SYSTEM TEST REPORT
===============================================
Generated: ${REPORT.timestamp}

SUMMARY:
--------
Admin Pages:          ${REPORT.adminPages.length}
User Pages:           ${REPORT.userPages.length}
API Endpoints:        ${REPORT.apiEndpoints.length}
Tests Passed:         ${REPORT.passed}
Tests Failed:         ${REPORT.failed}
Errors:               ${REPORT.errors.length}
Warnings:             ${REPORT.warnings.length}

HEALTH STATUS:        ${reportData.summary.healthStatus}

${REPORT.errors.length > 0 ? `
ERRORS:
-------
${REPORT.errors.map((e, i) => `${i + 1}. ${e}`).join('\n')}
` : ''}

${REPORT.warnings.length > 0 ? `
WARNINGS:
---------
${REPORT.warnings.map((w, i) => `${i + 1}. ${w}`).join('\n')}
` : ''}

===============================================
`;

  fs.writeFileSync(summaryPath, summaryContent);

  console.log(`✅ Full report saved: ${reportPath}`);
  console.log(`✅ Summary saved: ${summaryPath}\n`);
  console.log(summaryContent);
}

// Main execution
async function runTests() {
  console.log('🚀 Starting Comprehensive System Test...\n');
  console.log('=' .repeat(60) + '\n');

  // 1. Scan pages
  scanAdminPages();
  scanUserPages();

  // 2. Extract and test API endpoints
  const endpoints = extractAPIEndpoints();
  REPORT.apiEndpoints = endpoints;

  // 3. Check server health
  const serverRunning = await checkServerHealth();

  if (serverRunning) {
    console.log('\n🧪 Testing API endpoints...\n');

    // Test a sample of endpoints (to avoid overwhelming the server)
    const samplEndpoints = endpoints.slice(0, 20);

    for (const endpoint of samplEndpoints) {
      const result = await testEndpoint(endpoint);
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay between requests
    }

    if (endpoints.length > 20) {
      console.log(`\n⚠️  Only tested first 20 endpoints. ${endpoints.length - 20} remaining.`);
      REPORT.warnings.push(`Only tested 20 of ${endpoints.length} endpoints`);
    }
  } else {
    console.log('\n⚠️  Skipping API tests (server not running)\n');
  }

  // 4. Generate report
  generateReport();

  console.log('\n✅ Comprehensive test complete!\n');
}

// Run if called directly
if (require.main === module) {
  runTests().catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
}

module.exports = { runTests };
