/**
 * Create Stub Implementations for Supabase Services
 *
 * This script replaces Supabase calls with stub implementations
 * that return empty data, preventing runtime errors while we
 * complete the MySQL migration.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.join(__dirname, '..');
const servicesDir = path.join(projectRoot, 'app', 'services');

const stubImplementations = {
  // Replace: const { data, error } = await supabase.from('table').select('*')
  // With: const data = []; const error = null;
  selectPattern: /const\s*{\s*data,\s*error\s*}\s*=\s*await\s+supabase\s*\n?\s*\.from\([^)]+\)\s*\n?\s*\.select\([^)]*\)[^;]*;/g,
  selectReplacement: 'const data = []; const error = null; // TODO: Replace with MySQL API call',

  // Replace: const { data, error } = await supabase.from('table').insert([...])
  // With: const data = null; const error = null;
  insertPattern: /const\s*{\s*data,\s*error\s*}\s*=\s*await\s+supabase\s*\n?\s*\.from\([^)]+\)\s*\n?\s*\.insert\([^)]*\)[^;]*;/g,
  insertReplacement: 'const data = null; const error = null; // TODO: Replace with MySQL API call',

  // Replace: const { error } = await supabase.from('table').update({...})
  // With: const error = null;
  updatePattern: /const\s*{\s*error\s*}\s*=\s*await\s+supabase\s*\n?\s*\.from\([^)]+\)\s*\n?\s*\.update\([^)]*\)[^;]*;/g,
  updateReplacement: 'const error = null; // TODO: Replace with MySQL API call',

  // Replace: const { error } = await supabase.from('table').delete()
  // With: const error = null;
  deletePattern: /const\s*{\s*error\s*}\s*=\s*await\s+supabase\s*\n?\s*\.from\([^)]+\)\s*\n?\s*\.delete\([^)]*\)[^;]*;/g,
  deleteReplacement: 'const error = null; // TODO: Replace with MySQL API call',

  // Replace: await supabase.auth.getUser()
  // With: { data: { user: null }, error: null }
  authPattern: /await\s+supabase\.auth\.getUser\(\)/g,
  authReplacement: '{ data: { user: { id: localStorage.getItem("userId") } }, error: null } // TODO: Use proper auth',
};

function applyStubs(content) {
  let modified = content;

  // Apply each pattern replacement
  Object.keys(stubImplementations).forEach(key => {
    if (key.endsWith('Pattern')) {
      const replacementKey = key.replace('Pattern', 'Replacement');
      const pattern = stubImplementations[key];
      const replacement = stubImplementations[replacementKey];

      modified = modified.replace(pattern, replacement);
    }
  });

  // Add warning at the top of the file
  const warning = `
/**
 * ⚠️  WARNING: This service has been stubbed for Supabase → MySQL migration
 * All Supabase calls have been replaced with stub implementations that return empty data.
 * These functions will NOT work until proper MySQL backend API endpoints are created.
 *
 * See admin-dashboard.service.ts or mlm-client.ts for migration pattern examples.
 */

`;

  // Add warning after imports
  const lines = modified.split('\n');
  let insertIndex = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === '' && i > 5) {
      insertIndex = i + 1;
      break;
    }
  }

  lines.splice(insertIndex, 0, warning);
  return lines.join('\n');
}

const filesToStub = [
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

console.log('🔧 Creating stub implementations for Supabase services...\n');

let totalFiles = 0;

filesToStub.forEach(filename => {
  const filePath = path.join(servicesDir, filename);

  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${filename}`);
    return;
  }

  console.log(`📝 Processing: ${filename}`);

  let content = fs.readFileSync(filePath, 'utf8');

  // Count Supabase references before
  const refsBefore = (content.match(/supabase/g) || []).length;

  if (refsBefore === 0) {
    console.log(`   ✅ No Supabase references found\n`);
    return;
  }

  console.log(`   Found ${refsBefore} Supabase references`);

  // Create backup
  const backupPath = filePath + '.pre-stub.backup';
  if (!fs.existsSync(backupPath)) {
    fs.writeFileSync(backupPath, content);
    console.log(`   💾 Backup created: ${filename}.pre-stub.backup`);
  }

  // Apply stubs
  content = applyStubs(content);

  // Count remaining references
  const refsAfter = (content.match(/supabase/g) || []).length;

  // Write modified content
  fs.writeFileSync(filePath, content);

  totalFiles++;
  console.log(`   ✅ Stubbed ${refsBefore - refsAfter} Supabase calls`);
  console.log(`   ℹ️  ${refsAfter} references remain (in comments/strings)\n`);
});

console.log(`✅ Stubbing complete! Modified ${totalFiles} files`);
console.log('\n📋 Next Steps:');
console.log('   1. Test admin pages - they should load without Supabase errors');
console.log('   2. Create MySQL backend API endpoints for each service');
console.log('   3. Replace stub implementations with real API calls');
console.log('   4. Follow patterns from admin-dashboard.service.ts\n');
