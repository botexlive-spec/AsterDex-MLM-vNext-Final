#!/usr/bin/env node

/**
 * Step 3: Parallel Compile & Test Engine
 * Auto-detect frontend rendering, routing, and context errors
 * Auto-repair iteratively until 0 runtime errors
 */

const { exec, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 STEP 3: Parallel Compile & Test Engine Initialized\n');
console.log('═'.repeat(60));

const testResults = {
  timestamp: new Date().toISOString(),
  iteration: 0,
  maxIterations: 5,
  tests: [],
  errors: [],
  fixes: [],
  status: 'running'
};

// Execute command with promise
function runCommand(command, options = {}) {
  return new Promise((resolve, reject) => {
    exec(command, { cwd: process.cwd(), maxBuffer: 10 * 1024 * 1024, ...options }, (error, stdout, stderr) => {
      resolve({ error, stdout, stderr, success: !error });
    });
  });
}

// Run TypeScript check
async function checkTypeScript() {
  console.log('\n📝 Running TypeScript compilation check...');
  const result = await runCommand('npx tsc --noEmit');

  const errors = [];
  if (result.stderr) {
    const errorLines = result.stderr.split('\n').filter(line =>
      line.includes('error TS') || line.includes('.tsx') || line.includes('.ts')
    );

    errorLines.forEach(line => {
      if (line.trim()) errors.push(line);
    });
  }

  if (errors.length > 0) {
    console.log(`❌ Found ${errors.length} TypeScript errors`);
    testResults.errors.push({
      type: 'typescript',
      count: errors.length,
      details: errors.slice(0, 20) // First 20 errors
    });
    return false;
  }

  console.log('✅ TypeScript check passed');
  testResults.tests.push({ name: 'TypeScript', status: 'passed' });
  return true;
}

// Run build check
async function checkBuild() {
  console.log('\n🏗️  Running production build...');
  const result = await runCommand('npm run build', { timeout: 300000 }); // 5 min timeout

  if (!result.success) {
    console.log('❌ Build failed');

    // Extract build errors
    const buildErrors = (result.stderr || result.stdout || '').split('\n')
      .filter(line => line.includes('ERROR') || line.includes('error') || line.includes('failed'))
      .slice(0, 20);

    testResults.errors.push({
      type: 'build',
      count: buildErrors.length,
      details: buildErrors
    });
    return false;
  }

  console.log('✅ Build successful');
  testResults.tests.push({ name: 'Build', status: 'passed' });
  return true;
}

// Check for common React/Router errors
async function checkReactErrors() {
  console.log('\n⚛️  Scanning for React/Router errors...');

  const commonIssues = [];
  const filesToCheck = [];

  // Scan for common patterns
  function scanFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');

      // Check for missing React imports in JSX files
      if ((filePath.endsWith('.tsx') || filePath.endsWith('.jsx')) &&
          content.includes('<') &&
          !content.includes('import React') &&
          !content.includes("import { ")) {
        commonIssues.push({
          file: filePath,
          issue: 'Missing React import',
          fix: "Add: import React from 'react';"
        });
      }

      // Check for incorrect Route usage
      if (content.includes('<Route') && !content.includes('import') && !content.includes('Route')) {
        commonIssues.push({
          file: filePath,
          issue: 'Route used without import',
          fix: "Add: import { Route } from 'react-router-dom';"
        });
      }

      // Check for useContext without import
      if (content.includes('useContext') && !content.includes('import') && !content.includes('useContext')) {
        commonIssues.push({
          file: filePath,
          issue: 'useContext used without import',
          fix: "Add: import { useContext } from 'react';"
        });
      }

    } catch (error) {
      // Skip files that can't be read
    }
  }

  // Scan app directory
  function scanDirectory(dir) {
    try {
      const files = fs.readdirSync(dir);
      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory() && !file.includes('node_modules') && !file.includes('.git')) {
          scanDirectory(filePath);
        } else if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
          scanFile(filePath);
        }
      });
    } catch (error) {
      // Skip inaccessible directories
    }
  }

  scanDirectory('app');

  if (commonIssues.length > 0) {
    console.log(`⚠️  Found ${commonIssues.length} React/Router issues`);
    testResults.errors.push({
      type: 'react',
      count: commonIssues.length,
      details: commonIssues.slice(0, 10)
    });
    return false;
  }

  console.log('✅ No React/Router errors found');
  testResults.tests.push({ name: 'React/Router', status: 'passed' });
  return true;
}

// Auto-repair TypeScript errors
async function autoRepairTypeScriptErrors() {
  console.log('\n🔧 Attempting to auto-repair TypeScript errors...');

  const typeScriptErrors = testResults.errors.find(e => e.type === 'typescript');
  if (!typeScriptErrors) return 0;

  let fixed = 0;

  // Common fixes
  const fixes = {
    // Fix any type usage
    "Parameter '.*' implicitly has an 'any' type": (file, match) => {
      try {
        let content = fs.readFileSync(file, 'utf8');
        const param = match[1];
        // Add : any type annotation
        content = content.replace(
          new RegExp(`\\(${param}\\)`, 'g'),
          `(${param}: any)`
        );
        fs.writeFileSync(file, content, 'utf8');
        return true;
      } catch (error) {
        return false;
      }
    },

    // Fix missing imports
    "Cannot find name '(.*)'": (file, match) => {
      const name = match[1];
      const commonImports = {
        'React': "import React from 'react';",
        'useState': "import { useState } from 'react';",
        'useEffect': "import { useEffect } from 'react';",
        'useContext': "import { useContext } from 'react';",
        'useNavigate': "import { useNavigate } from 'react-router-dom';",
        'Route': "import { Route } from 'react-router-dom';",
        'Link': "import { Link } from 'react-router-dom';"
      };

      if (commonImports[name]) {
        try {
          let content = fs.readFileSync(file, 'utf8');
          // Add import at the top if not already present
          if (!content.includes(commonImports[name])) {
            content = commonImports[name] + '\n' + content;
            fs.writeFileSync(file, content, 'utf8');
            return true;
          }
        } catch (error) {
          return false;
        }
      }
      return false;
    }
  };

  // Try to apply fixes
  for (const errorLine of typeScriptErrors.details || []) {
    for (const [pattern, fixer] of Object.entries(fixes)) {
      const match = errorLine.match(new RegExp(pattern));
      if (match) {
        const fileMatch = errorLine.match(/([^:]+\.tsx?)/);
        if (fileMatch && fixer(fileMatch[1], match)) {
          fixed++;
          testResults.fixes.push({
            type: 'typescript',
            file: fileMatch[1],
            fix: pattern
          });
        }
      }
    }
  }

  console.log(`✅ Auto-repaired ${fixed} TypeScript errors`);
  return fixed;
}

// Generate report
function generateReport() {
  console.log('\n' + '═'.repeat(60));
  console.log('📊 TEST CYCLE SUMMARY');
  console.log('═'.repeat(60));
  console.log(`Iteration: ${testResults.iteration}/${testResults.maxIterations}`);
  console.log(`Tests Passed: ${testResults.tests.filter(t => t.status === 'passed').length}`);
  console.log(`Error Types: ${testResults.errors.length}`);
  console.log(`Fixes Applied: ${testResults.fixes.length}`);

  const totalErrors = testResults.errors.reduce((sum, e) => sum + (e.count || 0), 0);
  console.log(`Total Errors: ${totalErrors}`);

  // Save detailed report
  fs.writeFileSync(
    'TEST_CYCLE_RESULTS.json',
    JSON.stringify(testResults, null, 2)
  );

  // Log to AUTO_FIX_LOG.md
  const logEntry = `
## [${testResults.timestamp}] STEP 3: PARALLEL COMPILE & TEST - ITERATION ${testResults.iteration}

### Test Results
- **Tests Passed**: ${testResults.tests.filter(t => t.status === 'passed').length}
- **Error Types**: ${testResults.errors.length}
- **Total Errors**: ${totalErrors}
- **Fixes Applied**: ${testResults.fixes.length}
- **Status**: ${totalErrors === 0 ? '✅ All tests passed' : '⚠️ Errors remaining'}

### Errors Found
\`\`\`json
${JSON.stringify(testResults.errors.map(e => ({ type: e.type, count: e.count })), null, 2)}
\`\`\`

### Auto-Fixes Applied
\`\`\`json
${JSON.stringify(testResults.fixes, null, 2)}
\`\`\`

`;

  fs.appendFileSync('AUTO_FIX_LOG.md', logEntry);

  return totalErrors === 0;
}

// Main test cycle
async function runTestCycle() {
  console.log('\n🚀 Starting test cycle...\n');

  let allPassed = false;

  for (let i = 1; i <= testResults.maxIterations && !allPassed; i++) {
    testResults.iteration = i;
    testResults.tests = [];
    testResults.errors = [];

    console.log(`\n${'═'.repeat(60)}`);
    console.log(`ITERATION ${i}/${testResults.maxIterations}`);
    console.log('═'.repeat(60));

    // Run all checks in parallel
    const [tsResult, reactResult] = await Promise.all([
      checkTypeScript(),
      checkReactErrors()
    ]);

    // Run build check (sequential, depends on TS)
    const buildResult = tsResult ? await checkBuild() : false;

    // Check if all passed
    allPassed = tsResult && reactResult && buildResult;

    // Generate report
    const success = generateReport();

    if (!allPassed && i < testResults.maxIterations) {
      // Try to auto-repair
      console.log('\n🔧 Auto-repair phase...');
      const fixes = await autoRepairTypeScriptErrors();

      if (fixes === 0) {
        console.log('⚠️  No automatic fixes available, manual intervention may be required');
        break;
      }

      console.log('\n⏳ Waiting 2 seconds before next iteration...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    } else if (allPassed) {
      testResults.status = 'success';
      console.log('\n🎉 All tests passed! No errors remaining.');
      break;
    }
  }

  if (!allPassed) {
    testResults.status = 'needs_manual_review';
    console.log('\n⚠️  Maximum iterations reached. Some errors require manual review.');
  }

  console.log('\n✅ Test cycle complete');
  console.log('📄 Results saved to TEST_CYCLE_RESULTS.json');
  console.log('📄 Logged to AUTO_FIX_LOG.md\n');
  console.log('═'.repeat(60));
}

// Run the test cycle
runTestCycle().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
