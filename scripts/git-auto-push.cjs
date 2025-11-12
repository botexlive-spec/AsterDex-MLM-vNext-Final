#!/usr/bin/env node

/**
 * Git Auto-Push Script
 * Automatically commits and pushes fixes to vNext-dev branch
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

function runCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, { cwd: process.cwd() }, (error, stdout, stderr) => {
      if (error && !stderr.includes('nothing to commit')) {
        reject({ error, stdout, stderr });
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

async function gitAutoPush() {
  console.log('🔄 Git Auto-Push Starting...\n');

  try {
    // 1. Check if we're in a git repo
    await runCommand('git status');

    // 2. Create/switch to vNext-dev branch
    try {
      await runCommand('git checkout vNext-dev');
      console.log('✅ Switched to vNext-dev branch');
    } catch (error) {
      console.log('📝 Creating vNext-dev branch...');
      await runCommand('git checkout -b vNext-dev');
      console.log('✅ Created vNext-dev branch');
    }

    // 3. Add all changes
    await runCommand('git add .');
    console.log('✅ Staged all changes');

    // 4. Read AUTO_FIX_LOG.md for commit message
    const logFile = path.join(process.cwd(), 'AUTO_FIX_LOG.md');
    let commitMessage = 'Auto-fix: Various improvements';
    
    if (fs.existsSync(logFile)) {
      const logContent = fs.readFileSync(logFile, 'utf8');
      const lastEntry = logContent.split('##').pop().trim();
      if (lastEntry) {
        commitMessage = `Auto-fix: ${lastEntry.substring(0, 100)}`;
      }
    }

    // 5. Commit
    try {
      await runCommand(`git commit -m "${commitMessage}"`);
      console.log('✅ Committed changes');

      // 6. Push to origin
      try {
        await runCommand('git push -u origin vNext-dev');
        console.log('✅ Pushed to origin/vNext-dev\n');
        console.log('🎉 Git auto-push completed successfully!');
        return true;
      } catch (pushError) {
        console.log('⚠️  Push failed (may need to set up remote)');
        console.log('   Run: git remote add origin <your-repo-url>');
        return false;
      }
    } catch (commitError) {
      if (commitError.stderr && commitError.stderr.includes('nothing to commit')) {
        console.log('ℹ️  No changes to commit');
        return true;
      }
      throw commitError;
    }

  } catch (error) {
    console.error('❌ Git auto-push failed:', error.message);
    return false;
  }
}

if (require.main === module) {
  gitAutoPush().catch(console.error);
}

module.exports = gitAutoPush;
