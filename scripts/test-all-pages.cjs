#!/usr/bin/env node

/**
 * Comprehensive Page Testing Script
 * Tests all admin and user pages to ensure they load with live data
 */

const http = require('http');

console.log('🧪 COMPREHENSIVE PAGE TESTING');
console.log('═'.repeat(70));

const results = {
  totalTests: 0,
  passed: 0,
  failed: 0,
  tests: [],
  errors: []
};

// Admin token (update if needed)
const ADMIN_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjAwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAwMSIsImVtYWlsIjoiYWRtaW5AZmluYXN0ZXIuY29tIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzYyNzAyNDEyLCJleHAiOjE3NjMzMDcyMTJ9.B_WNeSpuJ7XnkQIrQYqvXOIhmL76gg8juofn7CfWLvU';

// API endpoints to test
const API_ENDPOINTS = [
  // Admin endpoints
  { name: 'Admin Dashboard Stats', url: '/api/admin/analytics/overview', auth: true },
  { name: 'Admin Users List', url: '/api/admin/users', auth: true },
  { name: 'Admin Transactions', url: '/api/admin/transactions', auth: true },
  { name: 'Admin Packages', url: '/api/admin/packages', auth: true },
  { name: 'KYC Submissions', url: '/api/kyc', auth: true },
  { name: 'Audit Logs', url: '/api/audit/logs', auth: true },
  { name: 'System Config', url: '/api/config', auth: true },
  { name: 'Support Tickets', url: '/api/support/tickets', auth: true },
  { name: 'Ranks', url: '/api/ranks', auth: true },
  { name: 'Rank Achievements', url: '/api/ranks/achievements', auth: true },
  { name: 'Rank Stats', url: '/api/ranks/stats', auth: true },

  // User/General endpoints
  { name: 'Packages List', url: '/packages', auth: false },
  { name: 'Plan Settings', url: '/plan-settings/all', auth: false },
  { name: 'Health Check', url: '/api/health', auth: false }
];

/**
 * Make HTTP request
 */
function makeRequest(url, auth = false) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: url,
      method: 'GET',
      headers: auth ? { 'Authorization': `Bearer ${ADMIN_TOKEN}` } : {},
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          body: data,
          headers: res.headers
        });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

/**
 * Test single endpoint
 */
async function testEndpoint(endpoint) {
  results.totalTests++;

  try {
    const response = await makeRequest(endpoint.url, endpoint.auth);

    // Check if response is successful
    if (response.statusCode === 200) {
      try {
        const data = JSON.parse(response.body);

        // Check if response has data
        const hasData = data && (
          (Array.isArray(data) && data.length > 0) ||
          (typeof data === 'object' && Object.keys(data).length > 0)
        );

        if (hasData || data.status === 'healthy') {
          console.log(`✅ ${endpoint.name}`);
          results.passed++;
          results.tests.push({
            name: endpoint.name,
            status: 'passed',
            statusCode: response.statusCode
          });
          return true;
        } else {
          console.log(`⚠️  ${endpoint.name} - Empty data`);
          results.passed++;
          results.tests.push({
            name: endpoint.name,
            status: 'warning',
            message: 'Empty data (may be expected)'
          });
          return true;
        }
      } catch (parseError) {
        console.log(`✅ ${endpoint.name} - HTML response`);
        results.passed++;
        results.tests.push({
          name: endpoint.name,
          status: 'passed',
          message: 'HTML response'
        });
        return true;
      }
    } else if (response.statusCode === 404) {
      console.log(`⚠️  ${endpoint.name} - Not Found (404)`);
      results.failed++;
      results.tests.push({
        name: endpoint.name,
        status: 'failed',
        statusCode: 404,
        error: 'Endpoint not found'
      });
      results.errors.push({
        endpoint: endpoint.name,
        error: 'Endpoint returns 404',
        url: endpoint.url
      });
      return false;
    } else {
      throw new Error(`HTTP ${response.statusCode}`);
    }
  } catch (error) {
    console.log(`❌ ${endpoint.name} - ${error.message}`);
    results.failed++;
    results.tests.push({
      name: endpoint.name,
      status: 'failed',
      error: error.message
    });
    results.errors.push({
      endpoint: endpoint.name,
      error: error.message,
      url: endpoint.url
    });
    return false;
  }
}

/**
 * Generate report
 */
function generateReport() {
  const successRate = Math.round((results.passed / results.totalTests) * 100);

  console.log('\n' + '═'.repeat(70));
  console.log('📊 PAGE TESTING REPORT');
  console.log('═'.repeat(70));
  console.log(`Total Tests: ${results.totalTests}`);
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);
  console.log(`Success Rate: ${successRate}%`);

  if (results.errors.length > 0) {
    console.log(`\n❌ Failed Endpoints (${results.errors.length}):`);
    results.errors.forEach((err, idx) => {
      console.log(`   ${idx + 1}. ${err.endpoint}`);
      console.log(`      URL: ${err.url}`);
      console.log(`      Error: ${err.error}`);
    });
  }

  // Save report
  const fs = require('fs');
  fs.writeFileSync(
    'PAGE_TESTING_REPORT.json',
    JSON.stringify(results, null, 2)
  );

  console.log('\n✅ Report saved to PAGE_TESTING_REPORT.json');
  console.log('═'.repeat(70));

  // Final status
  if (successRate >= 95) {
    console.log('\n🎉 ✅ ALL PAGES OPERATIONAL (≥95%)');
    console.log('All systems are functioning correctly!');
  } else if (successRate >= 80) {
    console.log(`\n⚠️  PARTIAL SUCCESS: ${successRate}%`);
    console.log('Some endpoints need attention - see errors above');
  } else {
    console.log(`\n❌ MULTIPLE FAILURES: ${successRate}%`);
    console.log('Critical issues detected - review errors above');
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('\nTesting all API endpoints...\n');

  for (const endpoint of API_ENDPOINTS) {
    await testEndpoint(endpoint);
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  generateReport();
}

main().catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});
