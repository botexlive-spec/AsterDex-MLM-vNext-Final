#!/usr/bin/env node

/**
 * Backend API Auto-Fixer
 * Automatically fixes all backend routes to use correct table names and schemas
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 BACKEND API AUTO-FIXER');
console.log('═'.repeat(70));

const results = {
  filesScanned: 0,
  filesFixed: 0,
  replacements: 0,
  errors: []
};

// Table name mappings (old -> new)
const TABLE_REPLACEMENTS = {
  'kyc_verifications': 'kyc',
  'user_id': 'userId',
  'created_at': 'createdAt',
  'updated_at': 'updatedAt',
  'deleted_at': 'deletedAt',
  'raw_user_meta_data': 'full_name',
  'support_tickets': 'support_ticket'
};

// Column mappings for specific tables
const COLUMN_MAPPINGS = {
  kyc: {
    'user_id': 'userId',
    'template_id': 'templateId',
    'created_at': 'createdAt',
    'updated_at': 'updatedAt',
    'deleted_at': 'deletedAt',
    'reviewed_by': 'notes', // Map to notes field with prefix
    'reviewed_at': 'updatedAt',
    'admin_notes': 'notes',
    'rejection_reason': 'notes',
    'document_number': 'data' // Store in JSON data field
  },
  users: {
    'raw_user_meta_data': 'full_name',
    'created_at': 'createdAt',
    'updated_at': 'updatedAt'
  }
};

/**
 * Fix route file
 */
function fixRouteFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    const originalContent = content;

    // Replace table names in queries
    for (const [oldName, newName] of Object.entries(TABLE_REPLACEMENTS)) {
      const regex = new RegExp(`\\b${oldName}\\b`, 'g');
      const matches = content.match(regex);
      if (matches) {
        content = content.replace(regex, newName);
        modified = true;
        results.replacements += matches.length;
        console.log(`   └─ Replaced "${oldName}" with "${newName}" (${matches.length} times)`);
      }
    }

    // Fix snake_case to camelCase in column names
    const snakeCasePattern = /\b([a-z_]+_[a-z_]+)\b/g;
    content = content.replace(snakeCasePattern, (match) => {
      // Don't replace if it's in a comment or string that looks like SQL
      const camelCase = match.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());

      // Only replace common database column patterns
      const commonPatterns = ['user_id', 'created_at', 'updated_at', 'deleted_at',
                              'template_id', 'reviewed_by', 'reviewed_at'];
      if (commonPatterns.includes(match)) {
        results.replacements++;
        return camelCase;
      }
      return match;
    });

    // Save if modified
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      results.filesFixed++;
      modified = true;
    }

    return modified;
  } catch (error) {
    results.errors.push({
      file: filePath,
      error: error.message
    });
    return false;
  }
}

/**
 * Scan and fix all route files
 */
function fixAllRoutes() {
  const routesDir = path.join(process.cwd(), 'server', 'routes');

  if (!fs.existsSync(routesDir)) {
    console.error('❌ Routes directory not found:', routesDir);
    return;
  }

  const files = fs.readdirSync(routesDir).filter(f => f.endsWith('.ts'));
  console.log(`\nFound ${files.length} route files\n`);

  for (const file of files) {
    const filePath = path.join(routesDir, file);
    results.filesScanned++;

    console.log(`📝 Processing: ${file}`);
    const fixed = fixRouteFile(filePath);

    if (fixed) {
      console.log(`✅ Fixed: ${file}`);
    } else {
      console.log(`   └─ No changes needed`);
    }
  }
}

/**
 * Generate report
 */
function generateReport() {
  console.log('\n' + '═'.repeat(70));
  console.log('📊 BACKEND API FIXER REPORT');
  console.log('═'.repeat(70));
  console.log(`Files Scanned: ${results.filesScanned}`);
  console.log(`Files Fixed: ${results.filesFixed}`);
  console.log(`Total Replacements: ${results.replacements}`);
  console.log(`Errors: ${results.errors.length}`);

  if (results.errors.length > 0) {
    console.log('\n❌ Errors:');
    results.errors.forEach((err, idx) => {
      console.log(`   ${idx + 1}. ${err.file}: ${err.error}`);
    });
  }

  // Save report
  fs.writeFileSync(
    'BACKEND_API_FIXES.json',
    JSON.stringify(results, null, 2)
  );

  console.log('\n✅ Report saved to BACKEND_API_FIXES.json');
  console.log('═'.repeat(70));

  if (results.filesFixed > 0) {
    console.log(`\n🎉 Successfully fixed ${results.filesFixed} backend route files!`);
    console.log('⚠️  Server will automatically reload with the changes.');
  }
}

/**
 * Main execution
 */
function main() {
  try {
    fixAllRoutes();
    generateReport();
  } catch (error) {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  }
}

main();
