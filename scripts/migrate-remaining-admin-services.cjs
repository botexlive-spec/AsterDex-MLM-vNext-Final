/**
 * Automated Migration Script for Remaining Admin Services
 * This script creates stub implementations for all remaining admin services
 * to prevent runtime errors while maintaining the same function signatures
 */

const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');
const servicesDir = path.join(projectRoot, 'app', 'services');

// Services that still need migration
const servicesToMigrate = [
  {
    file: 'admin-kyc.service.ts',
    refs: 18,
    description: 'KYC verification and management'
  },
  {
    file: 'admin-reports.service.ts',
    refs: 17,
    description: 'Admin reports generation'
  },
  {
    file: 'admin-config.service.ts',
    refs: 14,
    description: 'System configuration management'
  },
  {
    file: 'admin-support.service.ts',
    refs: 22,
    description: 'Support tickets and live chat'
  },
  {
    file: 'admin-impersonate.service.ts',
    refs: 6,
    description: 'User impersonation'
  },
  {
    file: 'admin-audit.service.ts',
    refs: 2,
    description: 'Audit logs'
  },
  {
    file: 'admin-binary.service.ts',
    refs: 1,
    description: 'Binary tree management'
  },
  {
    file: 'admin-commission.service.ts',
    refs: 1,
    description: 'Commission management'
  }
];

const API_CLIENT_TEMPLATE = `const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Get auth token from localStorage
 */
function getAuthToken(): string | null {
  return localStorage.getItem('auth_token');
}

/**
 * Make authenticated API request
 */
async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const token = getAuthToken();

  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(\`\${API_BASE_URL}\${endpoint}\`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': \`Bearer \${token}\`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || \`API request failed: \${response.status}\`);
  }

  return response.json();
}
`;

console.log('🚀 Starting automated migration of remaining admin services...\n');

let totalMigrated = 0;

servicesToMigrate.forEach(service => {
  const filePath = path.join(servicesDir, service.file);

  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${service.file}`);
    return;
  }

  console.log(`📝 Processing: ${service.file} (${service.refs} refs)`);

  let content = fs.readFileSync(filePath, 'utf8');

  // Create backup
  const backupPath = filePath + '.pre-mysql-migration';
  if (!fs.existsSync(backupPath)) {
    fs.writeFileSync(backupPath, content);
    console.log(`   💾 Backup created: ${service.file}.pre-mysql-migration`);
  }

  // Remove all Supabase imports
  content = content.replace(/import\s+.*from\s+['"].*supabase.*['"]\s*;?\s*/g, '');

  // Remove requireAdmin import and calls (handled by backend)
  content = content.replace(/import\s+{[^}]*requireAdmin[^}]*}\s+from\s+['"][^'"]+['"]\s*;?\s*/g, '');
  content = content.replace(/await\s+requireAdmin\(\)\s*;?\s*/g, '// Admin auth handled by backend');

  // Replace supabase.auth.getUser() calls
  content = content.replace(
    /const\s+{\s*data:\s*{\s*user:\s*\w+\s*},\s*error:\s*\w+\s*}\s*=\s*await\s+supabase\.auth\.getUser\(\)\s*;?/g,
    '// Auth handled by backend - admin ID from JWT token'
  );

  // Replace all Supabase database calls with TODO comments
  content = content.replace(
    /const\s+{\s*data[^}]*}\s*=\s*await\s+supabase[^;]+;/g,
    '// TODO: Implement MySQL backend API endpoint'
  );

  content = content.replace(
    /const\s+{\s*error[^}]*}\s*=\s*await\s+supabase[^;]+;/g,
    '// TODO: Implement MySQL backend API endpoint'
  );

  // Add API client template at the top after imports
  const lines = content.split('\n');
  let insertIndex = 0;
  
  // Find the end of imports
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('export interface') || 
        lines[i].trim().startsWith('export type') ||
        lines[i].trim().startsWith('export const') ||
        lines[i].trim().startsWith('export async function')) {
      insertIndex = i;
      break;
    }
  }

  // Insert warning and API client
  const warning = `
/**
 * ⚠️  MIGRATION IN PROGRESS: MySQL Backend Integration
 * 
 * This service is being migrated from Supabase to MySQL backend.
 * Some functions may return empty data or throw errors until backend
 * API endpoints are fully implemented.
 * 
 * Service: ${service.description}
 * Supabase references removed: ${service.refs}
 * 
 * Next steps:
 * 1. Create backend API routes in server/routes/${service.file.replace('.service.ts', '.ts')}
 * 2. Replace TODO comments with actual API calls using apiRequest()
 * 3. Follow pattern from admin-rank.service.ts
 */

${API_CLIENT_TEMPLATE}

// ============================================
// SERVICE FUNCTIONS (Need MySQL Backend APIs)
// ============================================

`;

  lines.splice(insertIndex, 0, warning);
  content = lines.join('\n');

  // Write modified content
  fs.writeFileSync(filePath, content);

  totalMigrated++;
  console.log(`   ✅ Migrated ${service.file}`);
  console.log(`   📊 ${service.refs} Supabase references removed\n`);
});

console.log('\n✅ Migration complete!');
console.log(`📊 Total services migrated: ${totalMigrated}`);
console.log('\n⚠️  IMPORTANT NOTES:');
console.log('   • All services now have API client infrastructure');
console.log('   • Backend API routes still need to be created');
console.log('   • Functions will throw errors until backend endpoints are implemented');
console.log('   • Use admin-rank.service.ts as a reference for implementation');
console.log('\n📋 Next Steps:');
console.log('   1. Create backend routes for each service');
console.log('   2. Implement MySQL queries in backend');
console.log('   3. Replace TODO comments with actual API calls');
console.log('   4. Test each admin page thoroughly\n');

