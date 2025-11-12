#!/usr/bin/env node

/**
 * Step 2: Auto-Context Memory System
 * Analyzes all menu files, identifies missing imports/APIs/routes
 * Creates dependency link map and auto-repairs issues
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 STEP 2: Auto-Context Memory System Initialized\n');
console.log('═'.repeat(60));

// Load the system map
const systemMap = JSON.parse(fs.readFileSync('SYSTEM_MEMORY_MAP.json', 'utf8'));

// Dependency analysis results
const dependencyAnalysis = {
  timestamp: new Date().toISOString(),
  filesAnalyzed: 0,
  issues: {
    missingImports: [],
    missingBackendRoutes: [],
    brokenApiCalls: [],
    unusedImports: []
  },
  repairs: [],
  dependencyGraph: {}
};

// Known backend routes (scan server/routes directory)
const backendRoutes = new Set();
function scanBackendRoutes() {
  console.log('\n📡 Scanning backend routes...');
  const routesDir = 'server/routes';

  try {
    const files = fs.readdirSync(routesDir);
    files.forEach(file => {
      if (file.endsWith('.ts') || file.endsWith('.js')) {
        const content = fs.readFileSync(path.join(routesDir, file), 'utf8');

        // Extract route definitions
        const routePatterns = [
          /router\.(get|post|put|delete|patch)\(['"]([^'"]+)['"]/g,
          /app\.(get|post|put|delete|patch)\(['"]([^'"]+)['"]/g
        ];

        routePatterns.forEach(pattern => {
          let match;
          while ((match = pattern.exec(content)) !== null) {
            const endpoint = match[2];
            backendRoutes.add(endpoint);
          }
        });
      }
    });

    console.log(`✅ Found ${backendRoutes.size} backend routes`);
  } catch (error) {
    console.log('⚠️  Could not scan backend routes:', error.message);
  }
}

// Check if a file path exists
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
}

// Resolve import path
function resolveImportPath(importPath, fromFile) {
  // Handle relative imports
  if (importPath.startsWith('.')) {
    const dir = path.dirname(fromFile);
    let resolved = path.join(dir, importPath);

    // Try different extensions
    const extensions = ['.tsx', '.ts', '.jsx', '.js', '.json'];
    for (const ext of extensions) {
      const withExt = resolved.endsWith(ext) ? resolved : resolved + ext;
      if (fileExists(withExt)) {
        return withExt;
      }
      // Try index file
      const indexPath = path.join(resolved, `index${ext}`);
      if (fileExists(indexPath)) {
        return indexPath;
      }
    }
    return null;
  }

  // Handle node_modules imports - assume they exist
  return 'node_modules';
}

// Analyze a single menu file
function analyzeMenuFile(menu, type) {
  dependencyAnalysis.filesAnalyzed++;

  // Reconstruct the full relative path
  let relativePath;
  if (menu.file.includes('/') || menu.file.includes('\\')) {
    relativePath = menu.file;
  } else {
    // File path is just the filename, need to reconstruct
    if (type === 'admin') {
      relativePath = `app/pages/admin/${menu.file}`;
    } else {
      relativePath = `app/pages/user/${menu.file}`;
    }
  }

  console.log(`\n📄 Analyzing: ${relativePath}`);

  try {
    // Ensure we have the full absolute path
    const fullPath = path.join(process.cwd(), relativePath);
    const content = fs.readFileSync(fullPath, 'utf8');

    // Initialize dependency graph for this file
    dependencyAnalysis.dependencyGraph[relativePath] = {
      imports: [],
      apiCalls: [],
      routes: [],
      missingDeps: [],
      status: 'ok'
    };

    // Check imports
    if (menu.imports && menu.imports.length > 0) {
      console.log(`  📦 Checking ${menu.imports.length} imports...`);

      menu.imports.forEach(imp => {
        const resolved = resolveImportPath(imp, fullPath);
        dependencyAnalysis.dependencyGraph[relativePath].imports.push({
          path: imp,
          resolved: resolved,
          exists: resolved !== null
        });

        if (resolved === null) {
          console.log(`    ❌ Missing import: ${imp}`);
          dependencyAnalysis.issues.missingImports.push({
            file: relativePath,
            import: imp,
            type: type
          });
          dependencyAnalysis.dependencyGraph[relativePath].missingDeps.push(imp);
          dependencyAnalysis.dependencyGraph[relativePath].status = 'has_issues';
        }
      });
    }

    // Check API calls
    if (menu.apis && menu.apis.length > 0) {
      console.log(`  🔌 Checking ${menu.apis.length} API calls...`);

      menu.apis.forEach(api => {
        const endpoint = api.endpoint;
        dependencyAnalysis.dependencyGraph[relativePath].apiCalls.push({
          method: api.method,
          endpoint: endpoint,
          hasBackend: backendRoutes.has(endpoint)
        });

        if (!backendRoutes.has(endpoint)) {
          console.log(`    ⚠️  API endpoint may be missing: ${api.method.toUpperCase()} ${endpoint}`);
          dependencyAnalysis.issues.brokenApiCalls.push({
            file: relativePath,
            method: api.method,
            endpoint: endpoint,
            type: type
          });
          dependencyAnalysis.dependencyGraph[relativePath].status = 'needs_review';
        }
      });
    }

    console.log(`  ✅ Analysis complete`);

  } catch (error) {
    console.log(`  ❌ Error reading file: ${error.message}`);
  }
}

// Auto-repair missing imports
function autoRepairImports() {
  console.log('\n🔧 STEP 2A: Auto-Repairing Missing Imports\n');
  console.log('═'.repeat(60));

  let repaired = 0;

  dependencyAnalysis.issues.missingImports.forEach(issue => {
    // Common import fixes
    const fixes = {
      '../lib/api': '../api/axios',
      './lib/api': './api/axios',
      '../lib/auth': '../api/axios',
      '../lib/supabase': '../services/supabaseClient'
    };

    if (fixes[issue.import]) {
      try {
        const content = fs.readFileSync(issue.file, 'utf8');
        const newContent = content.replace(
          new RegExp(`from ['"]${issue.import.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`, 'g'),
          `from '${fixes[issue.import]}'`
        );

        if (content !== newContent) {
          fs.writeFileSync(issue.file, newContent, 'utf8');
          console.log(`✅ Fixed import in ${issue.file}`);
          console.log(`   ${issue.import} → ${fixes[issue.import]}`);

          dependencyAnalysis.repairs.push({
            type: 'import',
            file: issue.file,
            from: issue.import,
            to: fixes[issue.import]
          });
          repaired++;
        }
      } catch (error) {
        console.log(`❌ Failed to fix ${issue.file}: ${error.message}`);
      }
    }
  });

  console.log(`\n🎯 Repaired ${repaired} import issues`);
}

// Generate missing backend routes
function generateMissingRoutes() {
  console.log('\n🔧 STEP 2B: Identifying Missing Backend Routes\n');
  console.log('═'.repeat(60));

  const missingRoutes = {};

  dependencyAnalysis.issues.brokenApiCalls.forEach(issue => {
    const key = `${issue.method.toUpperCase()} ${issue.endpoint}`;
    if (!missingRoutes[key]) {
      missingRoutes[key] = {
        method: issue.method,
        endpoint: issue.endpoint,
        usedBy: []
      };
    }
    missingRoutes[key].usedBy.push(issue.file);
  });

  console.log(`Found ${Object.keys(missingRoutes).length} unique missing routes:\n`);

  Object.values(missingRoutes).forEach(route => {
    console.log(`📍 ${route.method.toUpperCase()} ${route.endpoint}`);
    console.log(`   Used by: ${route.usedBy.length} file(s)`);
  });

  // Save missing routes for manual implementation
  if (Object.keys(missingRoutes).length > 0) {
    fs.writeFileSync(
      'MISSING_ROUTES.json',
      JSON.stringify(missingRoutes, null, 2)
    );
    console.log(`\n✅ Missing routes saved to MISSING_ROUTES.json`);
  }
}

// Main execution
async function main() {
  console.log('Starting auto-context memory analysis...\n');

  // Scan backend routes first
  scanBackendRoutes();

  // Analyze all admin menus
  console.log('\n\n📊 ANALYZING ADMIN MENUS');
  console.log('═'.repeat(60));
  systemMap.adminMenus.menus.forEach(menu => {
    analyzeMenuFile(menu, 'admin');
  });

  // Analyze all user menus
  console.log('\n\n📊 ANALYZING USER MENUS');
  console.log('═'.repeat(60));
  systemMap.userMenus.menus.forEach(menu => {
    analyzeMenuFile(menu, 'user');
  });

  // Auto-repair issues
  autoRepairImports();
  generateMissingRoutes();

  // Calculate statistics
  const stats = {
    filesAnalyzed: dependencyAnalysis.filesAnalyzed,
    totalImports: Object.values(dependencyAnalysis.dependencyGraph)
      .reduce((sum, file) => sum + file.imports.length, 0),
    missingImports: dependencyAnalysis.issues.missingImports.length,
    brokenApiCalls: dependencyAnalysis.issues.brokenApiCalls.length,
    repairsMade: dependencyAnalysis.repairs.length,
    filesWithIssues: Object.values(dependencyAnalysis.dependencyGraph)
      .filter(file => file.status !== 'ok').length
  };

  // Save dependency analysis
  fs.writeFileSync(
    'DEPENDENCY_ANALYSIS.json',
    JSON.stringify(dependencyAnalysis, null, 2)
  );

  console.log('\n\n' + '═'.repeat(60));
  console.log('📊 ANALYSIS SUMMARY');
  console.log('═'.repeat(60));
  console.log(`Files Analyzed: ${stats.filesAnalyzed}`);
  console.log(`Total Imports: ${stats.totalImports}`);
  console.log(`Missing Imports: ${stats.missingImports}`);
  console.log(`Broken API Calls: ${stats.brokenApiCalls}`);
  console.log(`Repairs Made: ${stats.repairsMade}`);
  console.log(`Files with Issues: ${stats.filesWithIssues}`);
  console.log(`Backend Routes Found: ${backendRoutes.size}`);

  console.log('\n✅ DEPENDENCY_ANALYSIS.json created');

  // Log to AUTO_FIX_LOG.md
  const logEntry = `
## [${new Date().toISOString()}] STEP 2: AUTO-CONTEXT MEMORY COMPLETE

### Analysis Results
- **Files Analyzed**: ${stats.filesAnalyzed}
- **Total Imports**: ${stats.totalImports}
- **Missing Imports**: ${stats.missingImports}
- **Broken API Calls**: ${stats.brokenApiCalls}
- **Backend Routes Found**: ${backendRoutes.size}
- **Repairs Made**: ${stats.repairsMade}
- **Files with Issues**: ${stats.filesWithIssues}

### Auto-Repairs Applied
\`\`\`json
${JSON.stringify(dependencyAnalysis.repairs, null, 2)}
\`\`\`

### Status
${stats.missingImports === 0 ? '✅ All imports resolved' : `⚠️ ${stats.missingImports} imports still need attention`}
${stats.brokenApiCalls === 0 ? '✅ All API endpoints verified' : `⚠️ ${stats.brokenApiCalls} API calls need backend implementation`}

`;

  fs.appendFileSync('AUTO_FIX_LOG.md', logEntry);
  console.log('✅ Results logged to AUTO_FIX_LOG.md\n');

  console.log('═'.repeat(60));
  console.log('🎉 Step 2 Complete: Auto-Context Memory System Active\n');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
