import { readFileSync } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

console.log('\n🔄 SCHEMA MIGRATION FOR USER_PACKAGES\n');
console.log('='.repeat(80));

console.log('\n⚠️  IMPORTANT: This migration will:');
console.log('   1. Drop existing user_packages table');
console.log('   2. Drop existing roi_distributions table');
console.log('   3. Recreate both with full MLM schema');
console.log('   4. Set up proper RLS policies\n');

console.log('📋 Migration Options:\n');
console.log('   Option A: Run in Supabase Dashboard (RECOMMENDED)');
console.log('   =================================================');
console.log('   1. Go to: https://supabase.com/dashboard');
console.log('   2. Select your project: dsgtyrwtlpnckvcozfbc');
console.log('   3. Navigate to: SQL Editor');
console.log('   4. Create a new query');
console.log('   5. Copy & paste: database/FIX_USER_PACKAGES_SCHEMA.sql');
console.log('   6. Click "Run" button\n');

console.log('   Option B: Use psql command-line');
console.log('   ================================');
console.log('   Run this command:');
console.log('   psql "postgresql://postgres.dsgtyrwtlpnckvcozfbc:Dubai@1234#@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres" -f database/FIX_USER_PACKAGES_SCHEMA.sql\n');

console.log('   Option C: Automated (if psql is installed)');
console.log('   ===========================================');

// Try to detect if psql is available
try {
  const { stdout, stderr } = await execAsync('psql --version');
  console.log(`   psql detected: ${stdout.trim()}`);
  console.log('\n   Do you want to run the migration now? (y/n)');
  console.log('   [Press Ctrl+C to cancel, or run manually using Option A]\n');

  // For automation, let's just display the SQL file content
  const sqlContent = readFileSync('database/FIX_USER_PACKAGES_SCHEMA.sql', 'utf8');
  console.log('📄 SQL FILE CONTENT:\n');
  console.log('='.repeat(80));
  console.log(sqlContent);
  console.log('='.repeat(80));

} catch (error) {
  console.log('   psql not found. Please use Option A (Supabase Dashboard)\n');

  // Display SQL file content for manual execution
  const sqlContent = readFileSync('database/FIX_USER_PACKAGES_SCHEMA.sql', 'utf8');
  console.log('\n📄 SQL TO EXECUTE:\n');
  console.log('='.repeat(80));
  console.log(sqlContent);
  console.log('='.repeat(80));
}

console.log('\n✅ Next Steps After Running SQL:');
console.log('   1. Verify schema: node verify-user-packages-schema.js');
console.log('   2. Run E2E tests: node e2e-test-suite.js');
console.log('   3. Check application: http://localhost:5173\n');
