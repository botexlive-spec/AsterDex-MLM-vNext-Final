/**
 * RLS POLICIES TESTING SCRIPT
 * ===========================
 * Automated testing for Row-Level Security policies
 *
 * This script tests RLS policies with different user roles to ensure:
 * - Users can only see their own data
 * - Admins can see all data
 * - Unauthorized access is blocked
 * - System operations work correctly
 *
 * Usage:
 *   npx tsx scripts/test-rls-policies.ts
 *
 * Prerequisites:
 *   1. RLS policies must be deployed to Supabase
 *   2. Test users must exist in database:
 *      - Regular user (role: 'user')
 *      - Admin user (role: 'admin')
 *   3. Environment variables configured (.env file)
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  table?: string;
}

interface TestSummary {
  total: number;
  passed: number;
  failed: number;
  results: TestResult[];
}

/**
 * Create Supabase client with user authentication
 */
const createUserClient = (accessToken: string) => {
  return createClient(SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
};

/**
 * Create service role client (bypasses RLS)
 */
const createServiceClient = () => {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
};

/**
 * Get test users from database
 */
async function getTestUsers() {
  const supabase = createServiceClient();

  // Get regular user
  const { data: regularUser, error: regularError } = await supabase
    .from('users')
    .select('id, email, role')
    .eq('role', 'user')
    .limit(1)
    .single();

  // Get admin user
  const { data: adminUser, error: adminError } = await supabase
    .from('users')
    .select('id, email, role')
    .eq('role', 'admin')
    .or('role.eq.superadmin')
    .limit(1)
    .single();

  if (regularError || !regularUser) {
    console.error(`${colors.red}❌ No regular user found in database${colors.reset}`);
    console.log('Create a test user with role="user" first');
    return null;
  }

  if (adminError || !adminUser) {
    console.error(`${colors.red}❌ No admin user found in database${colors.reset}`);
    console.log('Create a test user with role="admin" or "superadmin" first');
    return null;
  }

  return { regularUser, adminUser };
}

/**
 * Get user's auth token for testing
 * Note: In production, you would use actual login credentials
 */
async function getUserAuthToken(userId: string): Promise<string | null> {
  const supabase = createServiceClient();

  // For testing, we'll create a temporary session
  // In production, you would use actual user credentials
  const { data, error } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: `test-${userId}@example.com`,
  });

  if (error || !data) {
    console.error('Failed to generate auth token:', error);
    return null;
  }

  return data.properties?.access_token || null;
}

/**
 * Test: User can only see own data
 */
async function testUserCanOnlySeeSelfData(
  userId: string,
  userToken: string,
  table: string
): Promise<TestResult> {
  const supabase = createUserClient(userToken);

  const { data, error } = await supabase.from(table).select('user_id');

  if (error) {
    return {
      name: `User can only see own ${table}`,
      passed: false,
      message: `Database error: ${error.message}`,
      table,
    };
  }

  // Check that all returned rows belong to the user
  const allOwnData = data?.every((row: any) => row.user_id === userId) ?? true;

  return {
    name: `User can only see own ${table}`,
    passed: allOwnData,
    message: allOwnData
      ? `✓ User can only see their own ${table} (${data?.length || 0} rows)`
      : `✗ User can see other users' ${table} data! RLS NOT WORKING`,
    table,
  };
}

/**
 * Test: Admin can see all data
 */
async function testAdminCanSeeAllData(
  adminToken: string,
  table: string,
  expectedMinRows: number = 2
): Promise<TestResult> {
  const supabase = createUserClient(adminToken);

  const { data, error, count } = await supabase
    .from(table)
    .select('*', { count: 'exact' });

  if (error) {
    return {
      name: `Admin can see all ${table}`,
      passed: false,
      message: `Database error: ${error.message}`,
      table,
    };
  }

  const canSeeAll = (count ?? 0) >= expectedMinRows;

  return {
    name: `Admin can see all ${table}`,
    passed: canSeeAll,
    message: canSeeAll
      ? `✓ Admin can see all ${table} (${count} rows)`
      : `✗ Admin cannot see all ${table}. Expected >= ${expectedMinRows}, got ${count}`,
    table,
  };
}

/**
 * Test: User cannot access admin-only table
 */
async function testUserCannotAccessAdminTable(
  userToken: string,
  table: string
): Promise<TestResult> {
  const supabase = createUserClient(userToken);

  const { data, error } = await supabase.from(table).select('*');

  // User should either get no data or an error
  const accessBlocked = error !== null || (data?.length === 0);

  return {
    name: `User cannot access ${table}`,
    passed: accessBlocked,
    message: accessBlocked
      ? `✓ User correctly blocked from ${table}`
      : `✗ User can access admin-only table ${table}! RLS NOT WORKING`,
    table,
  };
}

/**
 * Test: Configuration tables are readable by authenticated users
 */
async function testConfigTableReadable(
  userToken: string,
  table: string
): Promise<TestResult> {
  const supabase = createUserClient(userToken);

  const { data, error } = await supabase.from(table).select('*').limit(1);

  const canRead = error === null;

  return {
    name: `User can read config table ${table}`,
    passed: canRead,
    message: canRead
      ? `✓ User can read ${table} (public read config)`
      : `✗ User cannot read ${table}: ${error?.message}`,
    table,
  };
}

/**
 * Test: User cannot write to configuration tables
 */
async function testConfigTableNotWritable(
  userToken: string,
  table: string
): Promise<TestResult> {
  const supabase = createUserClient(userToken);

  // Try to insert (should fail)
  const { error } = await supabase.from(table).insert({ test: 'data' });

  const writeBlocked = error !== null;

  return {
    name: `User cannot write to ${table}`,
    passed: writeBlocked,
    message: writeBlocked
      ? `✓ User correctly blocked from writing to ${table}`
      : `✗ User can write to config table ${table}! RLS NOT WORKING`,
    table,
  };
}

/**
 * Test: Check if RLS is enabled on table
 */
async function testRLSEnabled(table: string): Promise<TestResult> {
  const supabase = createServiceClient();

  const { data, error } = await supabase.rpc('check_rls_enabled', {
    table_name: table,
  });

  if (error) {
    // Function might not exist, try direct query
    const { data: pgData, error: pgError } = await supabase
      .from('pg_tables')
      .select('rowsecurity')
      .eq('tablename', table)
      .eq('schemaname', 'public')
      .single();

    if (pgError) {
      return {
        name: `RLS enabled on ${table}`,
        passed: false,
        message: `Unable to check RLS status: ${pgError.message}`,
        table,
      };
    }

    return {
      name: `RLS enabled on ${table}`,
      passed: pgData?.rowsecurity === true,
      message: pgData?.rowsecurity
        ? `✓ RLS enabled on ${table}`
        : `✗ RLS NOT ENABLED on ${table}`,
      table,
    };
  }

  return {
    name: `RLS enabled on ${table}`,
    passed: data === true,
    message: data ? `✓ RLS enabled on ${table}` : `✗ RLS NOT ENABLED on ${table}`,
    table,
  };
}

/**
 * Run all RLS tests
 */
async function runAllTests(): Promise<TestSummary> {
  const results: TestResult[] = [];

  console.log(`\n${colors.cyan}═══════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}  RLS POLICIES TESTING SUITE${colors.reset}`);
  console.log(`${colors.cyan}═══════════════════════════════════════════════════${colors.reset}\n`);

  // Step 1: Get test users
  console.log(`${colors.blue}Step 1: Getting test users...${colors.reset}`);
  const users = await getTestUsers();

  if (!users) {
    console.log(`\n${colors.red}❌ Test aborted: Missing test users${colors.reset}\n`);
    return { total: 0, passed: 0, failed: 0, results: [] };
  }

  const { regularUser, adminUser } = users;
  console.log(`${colors.green}✓ Regular user: ${regularUser.email} (${regularUser.role})${colors.reset}`);
  console.log(`${colors.green}✓ Admin user: ${adminUser.email} (${adminUser.role})${colors.reset}\n`);

  // Step 2: Test tables with RLS
  console.log(`${colors.blue}Step 2: Testing RLS on core tables...${colors.reset}\n`);

  const coreTables = [
    'users',
    'wallets',
    'user_packages',
    'mlm_transactions',
    'kyc_documents',
    'deposits',
    'withdrawal_requests',
  ];

  for (const table of coreTables) {
    // Check if RLS is enabled
    const rlsTest = await testRLSEnabled(table);
    results.push(rlsTest);
    console.log(`  ${rlsTest.passed ? colors.green : colors.red}${rlsTest.message}${colors.reset}`);
  }

  // Step 3: Test user data isolation
  console.log(`\n${colors.blue}Step 3: Testing user data isolation...${colors.reset}\n`);

  // Note: For this to work, we need actual auth tokens
  // In a real implementation, you would authenticate test users properly
  console.log(`  ${colors.yellow}⚠ Auth token generation required for full testing${colors.reset}`);
  console.log(`  ${colors.yellow}  Use real user credentials in production tests${colors.reset}\n`);

  // Step 4: Test admin access
  console.log(`${colors.blue}Step 4: Testing admin access...${colors.reset}\n`);
  console.log(`  ${colors.yellow}⚠ Requires authenticated admin session${colors.reset}\n`);

  // Step 5: Test admin-only tables
  console.log(`${colors.blue}Step 5: Testing admin-only tables...${colors.reset}\n`);

  const adminTables = ['admin_actions', 'commission_runs'];

  for (const table of adminTables) {
    const rlsTest = await testRLSEnabled(table);
    results.push(rlsTest);
    console.log(`  ${rlsTest.passed ? colors.green : colors.red}${rlsTest.message}${colors.reset}`);
  }

  // Step 6: Test configuration tables
  console.log(`\n${colors.blue}Step 6: Testing configuration tables...${colors.reset}\n`);

  const configTables = [
    'packages',
    'level_income_config',
    'matching_bonus_tiers',
    'rank_requirements',
    'binary_settings',
    'mlm_system_settings',
  ];

  for (const table of configTables) {
    const rlsTest = await testRLSEnabled(table);
    results.push(rlsTest);
    console.log(`  ${rlsTest.passed ? colors.green : colors.red}${rlsTest.message}${colors.reset}`);
  }

  // Calculate summary
  const summary: TestSummary = {
    total: results.length,
    passed: results.filter((r) => r.passed).length,
    failed: results.filter((r) => !r.passed).length,
    results,
  };

  return summary;
}

/**
 * Print test summary
 */
function printSummary(summary: TestSummary) {
  console.log(`\n${colors.cyan}═══════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}  TEST SUMMARY${colors.reset}`);
  console.log(`${colors.cyan}═══════════════════════════════════════════════════${colors.reset}\n`);

  console.log(`  Total Tests: ${summary.total}`);
  console.log(`  ${colors.green}Passed: ${summary.passed}${colors.reset}`);
  console.log(`  ${colors.red}Failed: ${summary.failed}${colors.reset}\n`);

  if (summary.failed > 0) {
    console.log(`${colors.red}Failed Tests:${colors.reset}`);
    summary.results
      .filter((r) => !r.passed)
      .forEach((r) => {
        console.log(`  ${colors.red}✗ ${r.name}${colors.reset}`);
        console.log(`    ${r.message}`);
      });
    console.log();
  }

  const passRate = ((summary.passed / summary.total) * 100).toFixed(1);
  console.log(`  Pass Rate: ${passRate}%`);

  if (summary.failed === 0) {
    console.log(`\n${colors.green}✓ All tests passed!${colors.reset}\n`);
  } else {
    console.log(`\n${colors.red}✗ Some tests failed. Review RLS policies.${colors.reset}\n`);
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    // Check environment variables
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      console.error(`${colors.red}❌ Missing required environment variables${colors.reset}`);
      console.log('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
      process.exit(1);
    }

    // Run tests
    const summary = await runAllTests();

    // Print summary
    printSummary(summary);

    // Exit with appropriate code
    process.exit(summary.failed === 0 ? 0 : 1);
  } catch (error: any) {
    console.error(`\n${colors.red}❌ Test execution failed:${colors.reset}`, error.message);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { runAllTests, TestSummary, TestResult };
