#!/usr/bin/env node

/**
 * Step 1: Full Audit Mode & System Memory Map
 * Comprehensive project analysis and mapping
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 STEP 1: Full Project Audit Mode Initialized\n');
console.log('═'.repeat(60));

// Recursive file scanner
function scanDirectory(dir, baseDir = dir) {
  let results = [];
  try {
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);
      try {
        const stat = fs.statSync(filePath);

        if (stat.isDirectory() && !file.includes('node_modules') && !file.includes('.git') && !file.includes('dist')) {
          results = results.concat(scanDirectory(filePath, baseDir));
        } else if (stat.isFile()) {
          const ext = path.extname(file);
          const relativePath = path.relative(baseDir, filePath).replace(/\\/g, '/');

          // Read file for analysis
          let imports = [];
          let apis = [];
          let routes = [];

          if (ext === '.tsx' || ext === '.ts' || ext === '.jsx' || ext === '.js') {
            try {
              const content = fs.readFileSync(filePath, 'utf8');

              // Extract imports
              const importMatches = content.match(/import .* from ['"](.*)['"]/g) || [];
              imports = importMatches.map(m => m.match(/from ['"](.*)['"]/)[1]);

              // Extract API calls
              const apiMatches = content.match(/api\.(get|post|put|delete|patch)\(['"](.*?)['"]/g) || [];
              apis = apiMatches.map(m => {
                const match = m.match(/api\.(get|post|put|delete|patch)\(['"](.*?)['"]/);
                return match ? { method: match[1], endpoint: match[2] } : null;
              }).filter(Boolean);

              // Extract routes
              const routeMatches = content.match(/Route.*path=['"](.*?)['"]/g) || [];
              routes = routeMatches.map(m => m.match(/path=['"](.*?)['"]/)[1]);

            } catch (readError) {
              // Skip files that can't be read
            }
          }

          results.push({
            name: file,
            path: relativePath,
            ext,
            size: stat.size,
            type: getFileType(ext),
            imports: imports.length > 0 ? imports : undefined,
            apis: apis.length > 0 ? apis : undefined,
            routes: routes.length > 0 ? routes : undefined
          });
        }
      } catch (statError) {
        // Skip files that can't be accessed
      }
    }
  } catch (error) {
    // Skip inaccessible directories
  }

  return results;
}

function getFileType(ext) {
  const types = {
    '.tsx': 'component',
    '.ts': 'typescript',
    '.jsx': 'component',
    '.js': 'javascript',
    '.json': 'config',
    '.md': 'documentation',
    '.css': 'style',
    '.scss': 'style',
    '.html': 'template'
  };
  return types[ext] || 'other';
}

// Scan all directories
console.log('Scanning project directories...\n');

const adminPages = scanDirectory('app/pages/admin');
const userPages = scanDirectory('app/pages/user');
const components = scanDirectory('app/components');
const services = scanDirectory('app/services');
const serverRoutes = scanDirectory('server/routes');
const serverServices = scanDirectory('server/services');

console.log(`✅ Scanned ${adminPages.length} Admin Page files`);
console.log(`✅ Scanned ${userPages.length} User Page files`);
console.log(`✅ Scanned ${components.length} Component files`);
console.log(`✅ Scanned ${services.length} Frontend Service files`);
console.log(`✅ Scanned ${serverRoutes.length} Backend Route files`);
console.log(`✅ Scanned ${serverServices.length} Backend Service files`);

// Extract menu information with full details
const adminMenus = adminPages
  .filter(f => f.ext === '.tsx')
  .map(f => {
    const name = f.name.replace('.tsx', '');
    return {
      name,
      displayName: name.replace(/([A-Z])/g, ' $1').trim(),
      file: f.path,
      route: `/admin/${name.toLowerCase()}`,
      imports: f.imports,
      apis: f.apis,
      size: f.size,
      hasIssues: (f.imports || []).some(imp => imp.includes('../lib/api')),
      scanned: true
    };
  });

const userMenus = userPages
  .filter(f => f.ext === '.tsx')
  .map(f => {
    const name = f.name.replace('.tsx', '');
    return {
      name,
      displayName: name.replace(/([A-Z])/g, ' $1').trim(),
      file: f.path,
      route: `/user/${name.toLowerCase()}`,
      imports: f.imports,
      apis: f.apis,
      size: f.size,
      hasIssues: (f.imports || []).some(imp => imp.includes('../lib/api')),
      scanned: true
    };
  });

// Collect all API endpoints
const allApis = [
  ...adminPages.flatMap(p => p.apis || []),
  ...userPages.flatMap(p => p.apis || []),
  ...components.flatMap(c => c.apis || [])
];

const uniqueEndpoints = [...new Set(allApis.map(a => a.endpoint))];

// Build dependency map
const dependencyMap = {
  totalImports: 0,
  brokenImports: [],
  missingApis: []
};

adminMenus.concat(userMenus).forEach(menu => {
  if (menu.imports) {
    dependencyMap.totalImports += menu.imports.length;
    menu.imports.forEach(imp => {
      if (imp.includes('../lib/api')) {
        dependencyMap.brokenImports.push({
          file: menu.file,
          import: imp,
          fix: imp.replace('../lib/api', '../api/axios')
        });
      }
    });
  }
});

const systemMap = {
  version: '3.0.0',
  timestamp: new Date().toISOString(),
  project: 'AsterDex_MLM_vNext',
  audit: {
    totalFiles: adminPages.length + userPages.length + components.length + services.length + serverRoutes.length + serverServices.length,
    adminPages: adminPages.length,
    userPages: userPages.length,
    components: components.length,
    services: services.length,
    routes: serverRoutes.length,
    serverServices: serverServices.length
  },
  adminMenus: {
    total: adminMenus.length,
    menus: adminMenus,
    withIssues: adminMenus.filter(m => m.hasIssues).length
  },
  userMenus: {
    total: userMenus.length,
    menus: userMenus,
    withIssues: userMenus.filter(m => m.hasIssues).length
  },
  components: components.filter(c => c.ext === '.tsx').map(c => ({
    name: c.name,
    path: c.path,
    size: c.size
  })),
  apiEndpoints: {
    total: uniqueEndpoints.length,
    endpoints: uniqueEndpoints
  },
  dependencies: dependencyMap,
  frontendServices: services.map(s => s.path),
  backendRoutes: serverRoutes.map(r => r.path),
  backendServices: serverServices.map(s => s.path),
  testing: {
    coverage: 0,
    passing: 0,
    failing: 0,
    lastRun: null
  },
  stability: {
    score: dependencyMap.brokenImports.length === 0 ? 100 : 80,
    issues: dependencyMap.brokenImports.length,
    autoFixable: dependencyMap.brokenImports.length
  }
};

// Save system memory map
fs.writeFileSync(
  'SYSTEM_MEMORY_MAP.json',
  JSON.stringify(systemMap, null, 2)
);

console.log('\n✅ SYSTEM_MEMORY_MAP.json created');
console.log(`📊 Admin Menus: ${adminMenus.length}`);
console.log(`📊 User Menus: ${userMenus.length}`);
console.log(`📊 Components: ${components.filter(c => c.ext === '.tsx').length}`);
console.log(`📊 API Endpoints: ${uniqueEndpoints.length}`);
console.log(`📊 Broken Imports: ${dependencyMap.brokenImports.length}`);
console.log(`📁 Total Files Analyzed: ${systemMap.audit.totalFiles}`);
console.log(`⚡ Stability Score: ${systemMap.stability.score}%`);
console.log('\n' + '═'.repeat(60));

// Log to AUTO_FIX_LOG.md
const logEntry = `
## [${new Date().toISOString()}] AUDIT COMPLETE

### System Audit Results
- **Total Menus**: ${adminMenus.length + userMenus.length}
- **Admin Menus**: ${adminMenus.length}
- **User Menus**: ${userMenus.length}
- **Components**: ${components.filter(c => c.ext === '.tsx').length}
- **API Endpoints**: ${uniqueEndpoints.length}
- **Broken Imports**: ${dependencyMap.brokenImports.length}
- **Stability Score**: ${systemMap.stability.score}%

### Issues Found
\`\`\`json
${JSON.stringify(dependencyMap.brokenImports.slice(0, 5), null, 2)}
\`\`\`

`;

fs.appendFileSync('AUTO_FIX_LOG.md', logEntry);

console.log('✅ Results logged to AUTO_FIX_LOG.md\n');
