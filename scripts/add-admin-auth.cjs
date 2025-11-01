/**
 * Script to add admin role verification to all admin service files
 * This script automatically adds:
 * 1. Import statement for requireAdmin
 * 2. await requireAdmin() call at the start of each exported async function
 */

const fs = require('fs');
const path = require('path');

// List of admin service files to update
const adminServiceFiles = [
  'app/services/admin.service.ts',
  'app/services/admin-user.service.ts',
  'app/services/admin-financial.service.ts',
  'app/services/admin-kyc.service.ts',
  'app/services/admin-audit.service.ts',
  'app/services/admin-binary.service.ts',
  'app/services/admin-commission.service.ts',
  'app/services/admin-rank.service.ts',
  'app/services/admin-config.service.ts',
  'app/services/admin-communications.service.ts',
  'app/services/admin-reports.service.ts',
];

const importStatement = `import { requireAdmin } from '../middleware/admin.middleware';`;
const authCheck = `    // Verify admin access\n    await requireAdmin();\n\n`;

function addAdminAuth(filePath) {
  const fullPath = path.join(process.cwd(), filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`❌ File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  let modified = false;

  // Step 1: Add import if not already present
  if (!content.includes("import { requireAdmin }")) {
    // Find the last import statement
    const importRegex = /^import .+ from .+;$/gm;
    const imports = content.match(importRegex);

    if (imports && imports.length > 0) {
      const lastImport = imports[imports.length - 1];
      content = content.replace(lastImport, `${lastImport}\n${importStatement}`);
      modified = true;
      console.log(`✅ Added import to: ${filePath}`);
    }
  } else {
    console.log(`ℹ️  Import already exists in: ${filePath}`);
  }

  // Step 2: Add requireAdmin() to each exported async function
  // Pattern: export const functionName = async (...) => {\n  try {
  const functionPattern = /(export const \w+ = async \([^)]*\)[^{]*\{\s*try \{\s*(?![\s]*\/\/\s*Verify admin access))/g;

  let match;
  let addedCount = 0;

  while ((match = functionPattern.exec(content)) !== null) {
    const originalMatch = match[0];
    const replacement = originalMatch + authCheck;
    content = content.replace(originalMatch, replacement);
    addedCount++;
    modified = true;
  }

  if (addedCount > 0) {
    console.log(`✅ Added admin checks to ${addedCount} functions in: ${filePath}`);
  } else {
    console.log(`ℹ️  No functions needed updating in: ${filePath}`);
  }

  // Step 3: Write updated content back to file
  if (modified) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`💾 Saved changes to: ${filePath}\n`);
    return addedCount;
  } else {
    console.log(`⏭️  Skipped (no changes): ${filePath}\n`);
    return 0;
  }
}

// Main execution
console.log('🔐 Adding Admin Role Verification to Admin Service Files\n');
console.log('=' .repeat(60));
console.log('\n');

let totalFunctionsUpdated = 0;
let filesUpdated = 0;

adminServiceFiles.forEach(file => {
  const count = addAdminAuth(file);
  if (count && count > 0) {
    totalFunctionsUpdated += count;
    filesUpdated++;
  }
});

console.log('=' .repeat(60));
console.log('\n📊 Summary:');
console.log(`Files updated: ${filesUpdated}/${adminServiceFiles.length}`);
console.log(`Total functions secured: ${totalFunctionsUpdated}`);
console.log('\n✅ Admin role verification implementation complete!\n');
console.log('Next steps:');
console.log('1. Test admin endpoints to verify authorization works');
console.log('2. Test non-admin users are correctly blocked');
console.log('3. Check console logs for any errors\n');
