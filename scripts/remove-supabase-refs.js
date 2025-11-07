/**
 * Automated Script to Remove Remaining Supabase References
 *
 * This script removes Supabase references from admin service files
 * that still have Supabase dependencies.
 *
 * Services to migrate:
 * - admin-support.service.ts (22 refs)
 * - admin-rank.service.ts (22 refs)
 * - admin-kyc.service.ts (18 refs)
 * - admin-reports.service.ts (17 refs)
 * - admin-config.service.ts (14 refs)
 * - admin-impersonate.service.ts (6 refs)
 * - admin-audit.service.ts (2 refs)
 * - admin-binary.service.ts (1 ref)
 * - admin-commission.service.ts (1 ref)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.join(__dirname, '..');
const servicesDir = path.join(projectRoot, 'app', 'services');

// Files to process
const filesToMigrate = [
  'admin-support.service.ts',
  'admin-rank.service.ts',
  'admin-kyc.service.ts',
  'admin-reports.service.ts',
  'admin-config.service.ts',
  'admin-impersonate.service.ts',
  'admin-audit.service.ts',
  'admin-binary.service.ts',
  'admin-commission.service.ts',
];

// Comment out Supabase references
function commentOutSupabaseReferences(content) {
  const lines = content.split('\n');
  const modifiedLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if line contains supabase reference
    if (line.includes('supabase') && !line.trim().startsWith('//')) {
      // Comment out the line
      modifiedLines.push(`    // TODO: Migrate to MySQL API - ${line.trim()}`);
    } else {
      modifiedLines.push(line);
    }
  }

  return modifiedLines.join('\n');
}

// Add stub implementations
function addStubImplementations(content, filename) {
  // Add import for API client at the top
  const apiClientImport = `import { requireAdmin } from '../middleware/admin.middleware';\n\n// TODO: Replace Supabase calls with MySQL backend API calls\n// Use pattern from admin-dashboard.service.ts or mlm-client.ts\n\n`;

  // Find the first import or type declaration
  const lines = content.split('\n');
  let insertIndex = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('export interface') || lines[i].includes('export type') || lines[i].includes('export const')) {
      insertIndex = i;
      break;
    }
  }

  // Insert the comment
  lines.splice(insertIndex, 0, '');
  lines.splice(insertIndex, 0, '// TODO: This service needs MySQL backend API endpoints');
  lines.splice(insertIndex, 0, '// Currently all Supabase calls are commented out');
  lines.splice(insertIndex, 0, '');

  return lines.join('\n');
}

console.log('🔧 Starting Supabase reference cleanup...\n');

let totalRefsRemoved = 0;

filesToMigrate.forEach(filename => {
  const filePath = path.join(servicesDir, filename);

  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${filename}`);
    return;
  }

  console.log(`📝 Processing: ${filename}`);

  let content = fs.readFileSync(filePath, 'utf8');

  // Count Supabase references
  const refCount = (content.match(/supabase/g) || []).length;

  if (refCount === 0) {
    console.log(`   ✅ No Supabase references found\n`);
    return;
  }

  console.log(`   Found ${refCount} Supabase references`);

  // Comment out Supabase references
  content = commentOutSupabaseReferences(content);

  // Add stub implementations
  content = addStubImplementations(content, filename);

  // Create backup
  const backupPath = filePath + '.backup';
  fs.writeFileSync(backupPath, fs.readFileSync(filePath, 'utf8'));

  // Write modified content
  fs.writeFileSync(filePath, content, 'utf8');

  totalRefsRemoved += refCount;
  console.log(`   ✅ Commented out ${refCount} references`);
  console.log(`   💾 Backup saved: ${filename}.backup\n`);
});

console.log('✅ Cleanup complete!');
console.log(`📊 Total Supabase references commented out: ${totalRefsRemoved}`);
console.log('\n⚠️  Important: These services now need MySQL backend API endpoints');
console.log('   Follow the pattern in admin-dashboard.service.ts or mlm-client.ts');
console.log('   to create corresponding backend endpoints.');
